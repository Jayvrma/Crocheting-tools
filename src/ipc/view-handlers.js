import { BrowserView, ipcMain } from 'electron';
import { pathToFileURL } from 'node:url';

let pdfView = null;

export const registerViewHandlers = (getMainWindow) => {
  ipcMain.handle('view-pdf', (_event, { filePath, bounds }) => {
    const mainWindow = getMainWindow();
    if (!mainWindow) {
      return { success: false, error: 'No window' };
    }

    if (!pdfView) {
      pdfView = new BrowserView();
    }

    mainWindow.addBrowserView(pdfView);
    pdfView.setBounds(bounds);
    pdfView.webContents.loadURL(pathToFileURL(filePath).href);

    return { success: true };
  });

  ipcMain.handle('hide-pdf-view', () => {
    const mainWindow = getMainWindow();
    if (mainWindow && pdfView) {
      mainWindow.removeBrowserView(pdfView);
    }

    return { success: true };
  });
};
