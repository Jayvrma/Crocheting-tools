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
let currentPaneSelector = '.files-pdf';
// What clicking a row does; the view page swaps this to fill its sections instead of showing the PDF
let selectHandler = (file) => viewPdf(file.path);

const getPaneBounds = (selector) => {
  const pane = document.querySelector(selector);
  if (!pane) {
    return null;
  }

  const rect = pane.getBoundingClientRect();
  return {
    x: Math.round(rect.left),
    y: Math.round(rect.top),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
};

// Shows the PDF over the element matching selector (the files page uses .files-pdf, review uses .review-pdf)
export const viewPdf = (filePath, selector = '.files-pdf') => {
  const bounds = getPaneBounds(selector);
  if (!bounds) {
    return;
  }

  currentlyViewedPath = filePath;
  currentPaneSelector = selector;
  window.electronAPI.viewPdf(filePath, bounds);
};

window.addEventListener('resize', () => {
  if (currentlyViewedPath) {
    viewPdf(currentlyViewedPath, currentPaneSelector);
  }
});

window.addEventListener('hashchange', () => {
  currentlyViewedPath = null;
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

    pdfList.querySelectorAll('.parse-pdf').forEach((button, index) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        handleParse(files[index], statusEl);
      });
    });

    const rows = pdfList.querySelectorAll('.list-group-item:not(.list-group-item-empty)');
    rows.forEach((row, index) => {
      row.addEventListener('click', () => {
        rows.forEach((other) => other.classList.toggle('list-group-item-selected', other === row));
        selectHandler(files[index]);
      });
    });
  } catch (error) {
    if (statusEl) {
      statusEl.textContent = `Unable to load PDFs: ${error.message}`;
    }
  }
};

const handleParse = async (file, statusEl) => {
  if (statusEl) {
    statusEl.textContent = 'Parsing...';
  }

  try {
    const result = await window.electronAPI.parsePdf(file.path);
    if (!result.success) {
      if (statusEl) {
        statusEl.textContent = `Parse failed: ${result.error}`;
      }
      return;
    }

    const saved = await window.electronAPI.saveParsed(file.name, result.parsed);
    if (!saved.success) {
      if (statusEl) {
        statusEl.textContent = `Save failed: ${saved.error}`;
      }
      return;
    }

    window.location.hash = `#/review?file=${encodeURIComponent(file.name)}`;
  } catch (error) {
    if (statusEl) {
      statusEl.textContent = `Parse failed: ${error.message}`;
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

export const attachFilesPageEvents = (onSelect = (file) => viewPdf(file.path)) => {
  currentlyViewedPath = null;
  selectHandler = onSelect;
  const statusEl = document.getElementById('status');
  return renderPdfList(statusEl);
};
