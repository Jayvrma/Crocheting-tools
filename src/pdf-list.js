import { fillTemplate } from './template.js';
import pdfListHtml from './pages/pdf-list.html?raw';
import pdfListItemHtml from './pages/pdf-list-item.html?raw';
import pdfListEmptyHtml from './pages/pdf-list-empty.html?raw';

const listMarkup = (files) => fillTemplate(pdfListHtml, {
  items: files.map((file) => fillTemplate(pdfListItemHtml, file)).join(''),
});

export const renderPdfList = async (statusEl) => {
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

export const attachFilesPageEvents = () => {
  const statusEl = document.getElementById('filesStatus');
  renderPdfList(statusEl);
};
