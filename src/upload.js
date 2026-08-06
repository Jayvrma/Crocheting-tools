import { fillTemplate } from './template.js';
import uploadPageHtml from './pages/upload.html?raw';
import pdfListHtml from './pages/pdf-list.html?raw';
import pdfListItemHtml from './pages/pdf-list-item.html?raw';
import pdfListEmptyHtml from './pages/pdf-list-empty.html?raw';
import placeholderSrc from './images/cd.webp';

export const renderUploadPage = () => fillTemplate(uploadPageHtml, { placeholderSrc });

const MIN_LIST_ROWS = 8;

const listMarkup = (files) => {
  const itemsHtml = files.map((file) => fillTemplate(pdfListItemHtml, file)).join('');
  const fillerCount = Math.max(0, MIN_LIST_ROWS - files.length);
  const fillerHtml = '<li class="list-group-item list-group-item-empty"></li>'.repeat(fillerCount);

  return fillTemplate(pdfListHtml, { items: itemsHtml + fillerHtml });
};

let currentlyViewedPath = null;

const getFilesMainBounds = () => {
  const filesMain = document.querySelector('.files-main');
  if (!filesMain) {
    return null;
  }

  const rect = filesMain.getBoundingClientRect();
  return {
    x: Math.round(rect.left),
    y: Math.round(rect.top),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
};

const viewPdf = (filePath) => {
  const bounds = getFilesMainBounds();
  if (!bounds) {
    return;
  }

  currentlyViewedPath = filePath;
  window.electronAPI.viewPdf(filePath, bounds);
};

window.addEventListener('resize', () => {
  if (currentlyViewedPath) {
    viewPdf(currentlyViewedPath);
  }
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
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        handleRemove(button.dataset.fileName, statusEl);
      });
    });

    pdfList.querySelectorAll('.list-group-item:not(.list-group-item-empty)').forEach((row, index) => {
      row.addEventListener('click', () => viewPdf(files[index].path));
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
  currentlyViewedPath = null;
  const statusEl = document.getElementById('status');
  renderPdfList(statusEl);
};
