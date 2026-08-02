// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  uploadFile: (fileData) => ipcRenderer.invoke('upload-file-to-folder', fileData),
  listUploadedPdfs: () => ipcRenderer.invoke('list-uploaded-pdfs'),
  removePdf: (fileName) => ipcRenderer.invoke('remove-uploaded-pdf', fileName),
});