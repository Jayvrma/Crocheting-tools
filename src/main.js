import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import started from 'electron-squirrel-startup';

const UPLOAD_DIR = path.join(app.getPath('userData'), 'my-uploaded-files');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

ipcMain.handle('upload-file-to-folder', async (_event, fileData) => {
  try {
    const fileName = path.basename(fileData.name || 'uploaded-file.pdf');
    const destinationPath = path.join(UPLOAD_DIR, fileName);
    const buffer = Buffer.from(fileData.buffer);

    fs.writeFileSync(destinationPath, buffer);

    return { success: true, savedPath: destinationPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('list-uploaded-pdfs', async () => {
  try {
    const files = fs.readdirSync(UPLOAD_DIR)
      .filter((name) => name.toLowerCase().endsWith('.pdf'))
      .sort()
      .map((name) => ({
        name,
        path: path.join(UPLOAD_DIR, name),
      }));

    return { success: true, files };
  } catch (error) {
    return { success: false, error: error.message, files: [] };
  }
});

ipcMain.handle('remove-uploaded-pdf', async (_event, fileName) => {
  try {
    const targetPath = path.join(UPLOAD_DIR, fileName);
    if (!fs.existsSync(targetPath)) {
      return { success: false, error: 'File not found' };
    }

    fs.unlinkSync(targetPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  const { Menu } = require('electron');
  Menu.setApplicationMenu(null);
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
