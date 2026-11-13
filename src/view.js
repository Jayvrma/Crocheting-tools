import { attachFilesPageEvents } from './upload.js';

const escapeHtml = (text) => String(text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Same round/range formats parse.py accepts: R7, Rnd 7-9, R7–R9, Round 7 to 9, Rows 7 & 8...
const ROUND_PREFIX = '(?:Rounds?|Rnds?|Rows?|R)';
const RANGE_RE = new RegExp(`^${ROUND_PREFIX}\\s*(\\d+)(?:\\s*(?:[-–—]|to|t/m|,|&|and)\\s*(?:${ROUND_PREFIX}\\s*)?(\\d+))?`, 'i');
const MAX_RANGE = 500;

// Turns each pattern line into one entry per row, so "R5-10: sc around" becomes rows 5 through 10
const expandRows = (sections) => Object.entries(sections).flatMap(([section, lines]) => lines.flatMap((line) => {
    const match = line.match(RANGE_RE);
    const start = match ? Number(match[1]) : null;
    const end = match?.[2] ? Number(match[2]) : start;
    if (start === null || end < start || end - start > MAX_RANGE) {
        return [{ section, line, number: start }];
    }

    const size = end - start + 1;
    return Array.from({ length: size }, (_, i) => ({ section, line, number: start + i, rangePos: i + 1, rangeSize: size }));
}));

// Row progress per PDF, kept in Electron's localStorage so it survives switching files and restarting the app
const PROGRESS_KEY = 'rowProgress';

const loadAllProgress = () => {
    try {
        return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
    } catch {
        return {};
    }
};

const saveProgress = (fileName, index) => {
    try {
        const all = loadAllProgress();
        all[fileName] = index;
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
    } catch {
        // Progress just won't be remembered
    }
};

// Remembered across tab changes so coming back to View shows the same pattern
let selectedFile = null;
// Expanded rows of the selected pattern, and the index of the row being worked on (rows.length means finished)
let rows = [];
let current = 0;

const rowLabel = (row) => {
    if (row.number === null) {
        return '';
    }
    const rangeNote = row.rangeSize > 1 ? ` <span class="row-range">(${row.rangePos} of ${row.rangeSize})</span>` : '';
    return `<span class="row-num">${row.number}</span>${rangeNote}`;
};

const renderRows = () => {
    const rowsEl = document.getElementById('viewRows');
    let html = '';
    let openSection = null;

    rows.forEach((row, index) => {
        if (row.section !== openSection) {
            html += `${openSection === null ? '' : '</ol>'}<h3>${escapeHtml(row.section)}</h3><ol>`;
            openSection = row.section;
        }
        html += `<li class="tracker-row" data-index="${index}">${rowLabel(row)}<span class="row-text">${escapeHtml(row.line)}</span></li>`;
    });

    rowsEl.innerHTML = openSection === null ? html : `${html}</ol>`;
};

// Marks finished rows, highlights the current one and updates the counter, without rebuilding the list
const updateProgress = (scroll = true) => {
    document.querySelectorAll('#viewRows .tracker-row').forEach((li) => {
        const index = Number(li.dataset.index);
        li.classList.toggle('row-done', index < current);
        li.classList.toggle('row-current', index === current);
    });

    const counterEl = document.getElementById('rowCounter');
    if (!rows.length) {
        counterEl.textContent = 'No rows';
    } else if (current >= rows.length) {
        counterEl.textContent = `Finished! (${rows.length} of ${rows.length})`;
    } else {
        const row = rows[current];
        const round = row.number === null ? '' : ` · Row ${row.number}`;
        counterEl.textContent = `${row.section}${round} (${current + 1} of ${rows.length})`;
    }

    document.querySelectorAll('.row-tracker-controls button').forEach((button) => {
        button.disabled = !rows.length;
    });

    if (scroll) {
        document.querySelector('#viewRows .row-current')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
};

const goToRow = (index) => {
    if (!rows.length || !selectedFile) {
        return;
    }
    current = Math.min(Math.max(index, 0), rows.length);
    saveProgress(selectedFile.name, current);
    updateProgress();
};

const showPattern = async (file) => {
    const materialsEl = document.getElementById('viewMaterials');
    const abbrevsEl = document.getElementById('viewAbbrevs');
    const statusEl = document.getElementById('status');
    const editBtn = document.getElementById('editPatternBtn');

    const result = await window.electronAPI.loadParsed(file.name);
    // Another file was clicked while this one was loading
    if (file.name !== selectedFile?.name) {
        return;
    }

    // Only parsed PDFs have anything for the review page to edit
    editBtn.disabled = !result.success;
    if (!result.success) {
        materialsEl.innerHTML = '';
        abbrevsEl.innerHTML = '';
        rows = [];
        renderRows();
        updateProgress(false);
        statusEl.textContent = result.error === 'Not parsed yet'
            ? 'Click Analyze on this PDF first.'
            : `Could not load pattern: ${result.error}`;
        return;
    }

    const { materials = [], abbrev_dict: abbrevs = {}, pattern_sections: sections = {} } = result.parsed;
    statusEl.textContent = '';
    materialsEl.innerHTML = materials.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    abbrevsEl.innerHTML = Object.entries(abbrevs)
        .map(([abbrev, meaning]) => `<li><strong>${escapeHtml(abbrev)}</strong> – ${escapeHtml(meaning)}</li>`)
        .join('');

    rows = expandRows(sections);
    // Clamp in case rows were removed on the review page since progress was saved
    current = Math.min(loadAllProgress()[file.name] ?? 0, rows.length);
    renderRows();
    updateProgress();
};

// Arrow keys and Space step through rows while the view page is open
document.addEventListener('keydown', (event) => {
    if (!document.getElementById('viewRows') || !rows.length || event.target.closest('input, textarea, select, button')) {
        return;
    }

    if (event.key === 'ArrowDown' || event.key === ' ') {
        event.preventDefault();
        goToRow(current + 1);
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        goToRow(current - 1);
    }
});

// Shown in the navbar's top-right corner while on the view page
export const viewNavbarActions = '<button type="button" id="editPatternBtn" class="btn btn-secondary" disabled>Edit pattern</button>';

const selectFile = (file) => {
    selectedFile = file;
    showPattern(file);
};

export const attachViewPageEvents = async () => {
    rows = [];
    updateProgress(false);

    document.getElementById('editPatternBtn').addEventListener('click', () => {
        window.location.hash = `#/review?file=${encodeURIComponent(selectedFile.name)}`;
    });

    document.querySelector('.row-tracker-controls').addEventListener('click', (event) => {
        const action = event.target.closest('button')?.dataset.rowAction;
        if (action === 'prev') {
            goToRow(current - 1);
        } else if (action === 'next') {
            goToRow(current + 1);
        } else if (action === 'reset') {
            goToRow(0);
        }
    });

    document.getElementById('viewRows').addEventListener('click', (event) => {
        const row = event.target.closest('.tracker-row');
        if (row) {
            goToRow(Number(row.dataset.index));
        }
    });

    await attachFilesPageEvents(selectFile);
    if (!selectedFile) {
        return;
    }

    const button = document.querySelector(`#pdfList .remove-pdf[data-file-name="${CSS.escape(selectedFile.name)}"]`);
    if (!button) {
        // The PDF was removed while we were on another tab
        selectedFile = null;
        return;
    }

    button.closest('.list-group-item').classList.add('list-group-item-selected');
    showPattern(selectedFile);
};
