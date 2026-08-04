import { fillTemplate } from './template.js';
import uploadPageHtml from './pages/upload.html?raw';
import placeholderSrc from './images/cd.webp';
import { showToast } from './toast.js';

export const renderUploadPage = () => fillTemplate(uploadPageHtml, { placeholderSrc });

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
      showToast(`'${file.name}' successfully uploaded`, 'success');
    } else {
      showToast(`'${file.name}' failed to upload`, 'error');
    }
  } catch (error) {
    statusEl.textContent = `Upload failed: ${error.message}`;
    showToast(`'${file.name}' failed to upload`, 'error');
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
