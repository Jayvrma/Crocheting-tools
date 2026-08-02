export const renderUploadPage = () => `
  <section class="page">
    <h1>Upload Files</h1>
    <input type="file" id="filePicker" accept="application/pdf" />
    <p id="status">Choose a PDF to upload.</p>
    <div id="pdfList" class="pdf-list"></div>
    <nav class="nav-links">
      <a href="#/">Back</a>
    </nav>
  </section>
`;

const renderPdfList = async () => {
    const pdfList = document.getElementById('pdfList');
    const statusEl = document.getElementById('status');

    if (!pdfList) {
        return;
    }

    try {
        const result = await window.electronAPI.listUploadedPdfs();

        if (!result.success) {
            pdfList.innerHTML = '<p>No PDFs uploaded yet.</p>';
            return;
        }

        if (!result.files.length) {
            pdfList.innerHTML = '<p>No PDFs uploaded yet.</p>';
            return;
        }

        pdfList.innerHTML = `
      <p>Uploaded PDFs:</p>
      <ul>
        ${result.files.map((file) => `
          <li>
            <span>${file.name}</span>
            <button type="button" class="remove-pdf" data-file-name="${file.name}">Remove</button>
          </li>
        `).join('')}
      </ul>
    `;

        pdfList.querySelectorAll('.remove-pdf').forEach((button) => {
            button.addEventListener('click', async () => {
                const fileName = button.getAttribute('data-file-name');
                if (!fileName) {
                    return;
                }

                statusEl.textContent = 'Removing PDF...';

                try {
                    const result = await window.electronAPI.removePdf(fileName);
                    if (result.success) {
                        statusEl.textContent = 'PDF removed.';
                        await renderPdfList();
                    } else {
                        statusEl.textContent = `Remove failed: ${result.error}`;
                    }
                } catch (error) {
                    statusEl.textContent = `Remove failed: ${error.message}`;
                }
            });
        });
    } catch (error) {
        if (statusEl) {
            statusEl.textContent = `Unable to load PDFs: ${error.message}`;
        }
    }
};

export const attachUploadPageEvents = () => {
    const filePicker = document.getElementById('filePicker');
    const statusEl = document.getElementById('status');

    if (!filePicker || !statusEl) {
        return;
    }

    renderPdfList();

    filePicker.addEventListener('change', async (event) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        statusEl.textContent = 'Uploading...';

        try {
            const fileData = {
                name: file.name,
                mimeType: file.type,
                buffer: await file.arrayBuffer(),
            };

            const result = await window.electronAPI.uploadFile(fileData);

            if (result.success) {
                statusEl.textContent = `Successfully copied to: ${result.savedPath}`;
                await renderPdfList();
            } else {
                statusEl.textContent = `Upload failed: ${result.error}`;
            }
        } catch (error) {
            statusEl.textContent = `Upload failed: ${error.message}`;
        }
    });
};
