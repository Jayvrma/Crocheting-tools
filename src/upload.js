import { fillTemplate } from './template.js';
import uploadPageHtml from './pages/upload.html?raw';
import pdfListHtml from './pages/pdf-list.html?raw';
import pdfListItemHtml from './pages/pdf-list-item.html?raw';
import pdfListEmptyHtml from './pages/pdf-list-empty.html?raw';
import placeholderSrc from './images/cd.webp';

export const renderUploadPage = () => fillTemplate(uploadPageHtml, { placeholderSrc });

const listMarkup = (files) => fillTemplate(pdfListHtml, {
  items: files.map((file) => fillTemplate(pdfListItemHtml, file)).join(''),
});

const renderPdfList = async (statusEl) => {
  const pdfList = document.getElementById('pdfList');
  if (!pdfList) {
    return;
  }

  try {
    const result = await window.electronAPI.listUploadedPdfs();
    const files = result.success ? result.files : [];
    pdfList.innerHTML = files.length ? listMarkup(files) : pdfListEmptyHtml;

    pdfList.querySelectorAll('.remove-pdf').forEach((button) => {
      button.addEventListener('click', () => handleRemove(button.dataset.fileName, statusEl));
    });
  } catch (error) {
    if (statusEl) {
      statusEl.textContent = `Unable to load PDFs: ${error.message}`;
    }
  }
};

const handleRemove = async (fileName, statusEl) => {
  if (!fileName) {
    return;
  }

  if (statusEl) {
    statusEl.textContent = 'Removing PDF...';
  }

  try {
    const result = await window.electronAPI.removePdf(fileName);
    if (statusEl) {
      statusEl.textContent = result.success ? 'PDF removed.' : `Remove failed: ${result.error}`;
    }
    if (result.success) {
      await renderPdfList(statusEl);
    }
  } catch (error) {
    if (statusEl) {
      statusEl.textContent = `Remove failed: ${error.message}`;
    }
  }
};

const handleUpload = async (file, statusEl) => {
  statusEl.textContent = 'Uploading...';

  try {
    const fileData = {
      name: file.name,
      mimeType: file.type,
      buffer: await file.arrayBuffer(),
    };

    const result = await window.electronAPI.uploadFile(fileData);
    statusEl.textContent = result.success
      ? `Successfully copied to: ${result.savedPath}`
      : `Upload failed: ${result.error}`;

    if (result.success) {
      await renderPdfList(statusEl);
    }
  } catch (error) {
    statusEl.textContent = `Upload failed: ${error.message}`;
  }
};

export const attachUploadPageEvents = () => {
  const filePicker = document.getElementById('filePicker');
  const statusEl = document.getElementById('status');

  if (!filePicker || !statusEl) {
    return;
  }

  filePicker.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleUpload(file, statusEl);
    }
  });
};

export const attachFilesPageEvents = () => {
  const statusEl = document.getElementById('status');
  renderPdfList(statusEl);
};
