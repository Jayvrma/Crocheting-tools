import { app, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs';

const UPLOAD_DIR = path.join(app.getPath('userData'), 'my-uploaded-files');

const toPdfEntry = (name) => ({ name, path: path.join(UPLOAD_DIR, name) });

export const registerUploadHandlers = () => {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  ipcMain.handle('upload-file-to-folder', async (_event, fileData) => {
    try {
      const fileName = path.basename(fileData.name || 'uploaded-file.pdf');
      const destinationPath = path.join(UPLOAD_DIR, fileName);
      fs.writeFileSync(destinationPath, Buffer.from(fileData.buffer));

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
        .map(toPdfEntry);

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
};
