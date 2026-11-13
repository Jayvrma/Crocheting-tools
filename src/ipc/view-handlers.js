import { WebContentsView, ipcMain } from 'electron';
import { pathToFileURL } from 'node:url';

let pdfView = null;

export const registerViewHandlers = (getMainWindow) => {
  ipcMain.handle('view-pdf', (_event, { filePath, bounds }) => {
    const mainWindow = getMainWindow();
    if (!mainWindow) {
      return { success: false, error: 'No window' };
    }

    if (!pdfView) {
      // plugins enables Chromium's built-in PDF viewer inside the view
      pdfView = new WebContentsView({ webPreferences: { plugins: true } });
    }

    mainWindow.contentView.addChildView(pdfView);
    pdfView.setBounds(bounds);
    pdfView.webContents.loadURL(pathToFileURL(filePath).href);

    return { success: true };
  });

  ipcMain.handle('hide-pdf-view', () => {
    const mainWindow = getMainWindow();
    if (mainWindow && pdfView) {
      mainWindow.contentView.removeChildView(pdfView);
    }

    return { success: true };
  });
};
