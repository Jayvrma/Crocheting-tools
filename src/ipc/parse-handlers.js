import { app, ipcMain } from 'electron';
import { execFile } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const PARSED_DIR = path.join(app.getPath('userData'), 'parsed');
const PYTHON = 'python';
const SCRIPT = path.join(app.getAppPath(), 'data', 'parse.py');

const parsedPathFor = (pdfName) => path.join(PARSED_DIR, `${path.basename(pdfName, '.pdf')}.json`);

export const registerParseHandlers = () => {
  fs.mkdirSync(PARSED_DIR, { recursive: true });

  ipcMain.handle('parse-pdf', (_event, pdfPath) => new Promise((resolve) => {
    execFile(PYTHON, [SCRIPT, pdfPath], { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        return resolve({ success: false, error: stderr || error.message });
      }

      try {
        resolve({ success: true, parsed: JSON.parse(stdout) });
      } catch (parseError) {
        resolve({ success: false, error: `parse.py did not print valid JSON: ${parseError.message}` });
      }
    });
  }));

  ipcMain.handle('save-parsed', async (_event, pdfName, parsed) => {
    try {
      const destinationPath = parsedPathFor(pdfName);
      fs.writeFileSync(destinationPath, JSON.stringify(parsed, null, 2));

      return { success: true, savedPath: destinationPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('load-parsed', async (_event, pdfName) => {
    try {
      const targetPath = parsedPathFor(pdfName);
      if (!fs.existsSync(targetPath)) {
        return { success: false, error: 'Not parsed yet' };
      }

      return { success: true, parsed: JSON.parse(fs.readFileSync(targetPath, 'utf8')) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
};
