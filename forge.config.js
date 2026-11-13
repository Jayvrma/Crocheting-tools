const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

// The packaged app carries its own Python so users don't need it installed. It's the official
// embeddable build from python.org, which is signed, so Windows Smart App Control lets it run
// (a PyInstaller exe gets blocked). PyMuPDF wheels are abi3, so any 3.10+ version works.
const PYTHON_VERSION = '3.14.8';
const PYTHON_EMBED_URL = `https://www.python.org/ftp/python/${PYTHON_VERSION}/python-${PYTHON_VERSION}-embed-amd64.zip`;
const PYTHON_DIR = path.join(__dirname, 'python-dist');

const buildBundledPython = async () => {
  if (fs.existsSync(path.join(PYTHON_DIR, 'python.exe'))) {
    return;
  }

  fs.rmSync(PYTHON_DIR, { recursive: true, force: true });
  fs.mkdirSync(PYTHON_DIR, { recursive: true });

  const response = await fetch(PYTHON_EMBED_URL);
  if (!response.ok) {
    throw new Error(`Downloading ${PYTHON_EMBED_URL} failed: ${response.status}`);
  }
  const zipPath = path.join(PYTHON_DIR, 'python-embed.zip');
  fs.writeFileSync(zipPath, Buffer.from(await response.arrayBuffer()));
  // Windows' own tar understands zip files (Git Bash's tar doesn't)
  execFileSync(path.join(process.env.SystemRoot, 'System32', 'tar.exe'), ['-xf', zipPath, '-C', PYTHON_DIR]);
  fs.rmSync(zipPath);

  // The embeddable build ignores site-packages unless its ._pth file lists it
  const pthFile = fs.readdirSync(PYTHON_DIR).find((name) => name.endsWith('._pth'));
  fs.appendFileSync(path.join(PYTHON_DIR, pthFile), '\nLib\\site-packages\n');

  execFileSync('python', [
    '-m', 'pip', 'install', '--quiet', '--disable-pip-version-check',
    '--target', path.join(PYTHON_DIR, 'Lib', 'site-packages'),
    '--only-binary=:all:', '--platform', 'win_amd64', '--python-version', PYTHON_VERSION,
    '-r', path.join(__dirname, 'requirements.txt'),
  ], { stdio: 'inherit' });
};

// VS Code (and some other tools) set ELECTRON_RUN_AS_NODE=1, which makes Electron
// run as plain Node and exit immediately instead of opening the app window.
delete process.env.ELECTRON_RUN_AS_NODE;

module.exports = {
  packagerConfig: {
    asar: true,
    // No extension: the packager picks icon.ico on Windows (and would want icon.icns on macOS)
    icon: 'src/images/icon',
    // Copied next to app.asar, where parse-handlers.js looks for them
    extraResource: ['python-dist', 'data/parse.py'],
  },
  rebuildConfig: {},
  hooks: {
    // Downloads and sets up python-dist/ once; later builds reuse it
    prePackage: buildBundledPython,
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        setupIcon: 'src/images/icon.ico',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      // win32 too, for a portable zip alongside the installer
      platforms: ['darwin', 'win32'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
        // If you are familiar with Vite configuration, it will look really familiar.
        build: [
          {
            // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
            entry: 'src/main.js',
            config: 'vite.main.config.mjs',
            target: 'main',
          },
          {
            entry: 'src/preload.js',
            config: 'vite.preload.config.mjs',
            target: 'preload',
          },
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.renderer.config.mjs',
          },
        ],
      },
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
