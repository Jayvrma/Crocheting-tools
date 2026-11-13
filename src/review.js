import { viewPdf } from './upload.js';

const escapeHtml = (text) => String(text)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

// The parsed JSON as loaded from disk, and an editable copy of the parts the user can correct
let original = null;
let draft = null;
let currentFileName = null;

const toDraft = (parsed) => ({
  abbreviations: Object.entries(parsed.abbrev_dict || {}),
  materials: (parsed.materials || []).join('\n'),
  sections: Object.entries(parsed.pattern_sections || {}).map(([name, rounds]) => ({ name, rounds: [...rounds] })),
});

const fromDraft = () => ({
  ...original,
  abbrev_dict: Object.fromEntries(
    draft.abbreviations
      .map(([abbrev, meaning]) => [abbrev.trim(), meaning.trim()])
      .filter(([abbrev]) => abbrev),
  ),
  materials: draft.materials.split('\n').map((line) => line.trim()).filter(Boolean),
  pattern_sections: Object.fromEntries(
    draft.sections.map(({ name, rounds }) => [name.trim(), rounds.map((round) => round.trim()).filter(Boolean)]),
  ),
  reviewed: true,
});

const iconButton = (action, label, title, data = '') => (
  `<button type="button" class="btn btn-secondary btn-icon" data-action="${action}" ${data} title="${title}" aria-label="${title}">${label}</button>`
);

const abbreviationsHtml = () => `
  <section class="review-section">
    <h2>Abbreviations</h2>
    ${draft.abbreviations.map(([abbrev, meaning], i) => `
      <div class="review-row">
        <input class="review-input review-abbrev" data-field="abbrev" data-index="${i}" value="${escapeHtml(abbrev)}" placeholder="sc" />
        <input class="review-input" data-field="meaning" data-index="${i}" value="${escapeHtml(meaning)}" placeholder="single crochet" />
        ${iconButton('delete-abbrev', '✕', 'Delete abbreviation', `data-index="${i}"`)}
      </div>`).join('')}
    <button type="button" class="btn btn-small btn-dashed" data-action="add-abbrev">+ Add abbreviation</button>
  </section>`;

const materialsHtml = () => `
  <section class="review-section">
    <h2>Materials</h2>
    <p class="review-hint">One item per line.</p>
    <textarea class="review-input review-textarea" data-field="materials" rows="${Math.max(4, draft.materials.split('\n').length + 1)}">${escapeHtml(draft.materials)}</textarea>
  </section>`;

const sectionHtml = ({ name, rounds }, s) => `
  <div class="review-pattern-section">
    <div class="review-row">
      <input class="review-input review-section-name" data-field="section-name" data-section="${s}" value="${escapeHtml(name)}" placeholder="Section name" />
      ${iconButton('delete-section', '✕', 'Delete section', `data-section="${s}"`)}
    </div>
    ${rounds.map((round, r) => `
      <div class="review-row">
        <input class="review-input" data-field="round" data-section="${s}" data-index="${r}" value="${escapeHtml(round)}" placeholder="Rnd 1: 6 sc in a magic ring (6)" />
        ${iconButton('move-round-up', '↑', 'Move round up', `data-section="${s}" data-index="${r}" ${r === 0 ? 'disabled' : ''}`)}
        ${iconButton('move-round-down', '↓', 'Move round down', `data-section="${s}" data-index="${r}" ${r === rounds.length - 1 ? 'disabled' : ''}`)}
        ${iconButton('delete-round', '✕', 'Delete round', `data-section="${s}" data-index="${r}"`)}
      </div>`).join('')}
    <button type="button" class="btn btn-small btn-dashed" data-action="add-round" data-section="${s}">+ Add round</button>
  </div>`;

const roundsHtml = () => `
  <section class="review-section">
    <h2>Rounds</h2>
    ${draft.sections.length ? draft.sections.map(sectionHtml).join('') : '<p class="review-empty">No rounds found. Add a section to enter them by hand.</p>'}
    <button type="button" class="btn btn-small btn-dashed" data-action="add-section">+ Add section</button>
  </section>`;

const renderForm = () => {
  const contentEl = document.getElementById('reviewContent');
  contentEl.innerHTML = `
    ${original.reviewed ? '<p class="review-badge">Reviewed</p>' : ''}
    ${abbreviationsHtml()}
    ${materialsHtml()}
    ${roundsHtml()}
    <div class="review-actions">
      <button type="button" class="btn" data-action="save">Save corrections</button>
    </div>`;
};

const setStatus = (text) => {
  document.getElementById('status').textContent = text;
};

const markUnsaved = () => setStatus('Unsaved changes');

// Typing only updates the draft; re-rendering here would steal focus from the input
const handleInput = (event) => {
  const { field, index, section } = event.target.dataset;
  const value = event.target.value;

  if (field === 'abbrev') draft.abbreviations[index][0] = value;
  else if (field === 'meaning') draft.abbreviations[index][1] = value;
  else if (field === 'materials') draft.materials = value;
  else if (field === 'section-name') draft.sections[section].name = value;
  else if (field === 'round') draft.sections[section].rounds[index] = value;
  else return;

  markUnsaved();
};

const moveItem = (list, from, to) => {
  const [item] = list.splice(from, 1);
  list.splice(to, 0, item);
};

const validate = () => {
  const names = draft.sections.map(({ name }) => name.trim());
  if (names.some((name) => !name)) {
    return 'Every section needs a name.';
  }
  const duplicate = names.find((name, i) => names.indexOf(name) !== i);
  if (duplicate) {
    return `Two sections are named "${duplicate}". Give each section a different name.`;
  }
  return null;
};

const save = async () => {
  const problem = validate();
  if (problem) {
    setStatus(problem);
    return;
  }

  setStatus('Saving...');
  try {
    const updated = fromDraft();
    const result = await window.electronAPI.saveParsed(currentFileName, updated);
    if (!result.success) {
      setStatus(`Save failed: ${result.error}`);
      return;
    }

    original = updated;
    draft = toDraft(updated);
    renderForm();
    setStatus('Corrections saved.');
  } catch (error) {
    setStatus(`Save failed: ${error.message}`);
  }
};

const handleClick = (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) {
    return;
  }

  const { action } = button.dataset;
  const section = Number(button.dataset.section);
  const index = Number(button.dataset.index);

  if (action === 'save') {
    save();
    return;
  }

  if (action === 'add-abbrev') draft.abbreviations.push(['', '']);
  else if (action === 'delete-abbrev') draft.abbreviations.splice(index, 1);
  else if (action === 'add-section') draft.sections.push({ name: '', rounds: [''] });
  else if (action === 'delete-section') draft.sections.splice(section, 1);
  else if (action === 'add-round') draft.sections[section].rounds.push('');
  else if (action === 'delete-round') draft.sections[section].rounds.splice(index, 1);
  else if (action === 'move-round-up') moveItem(draft.sections[section].rounds, index, index - 1);
  else if (action === 'move-round-down') moveItem(draft.sections[section].rounds, index, index + 1);
  else return;

  renderForm();
  markUnsaved();
};

export const attachReviewPageEvents = async (fileName) => {
  const contentEl = document.getElementById('reviewContent');
  const titleEl = document.getElementById('reviewTitle');

  if (!fileName) {
    setStatus('No PDF selected. Go to Files and click Analyze on a PDF.');
    return;
  }

  currentFileName = fileName;
  titleEl.textContent = fileName;
  contentEl.addEventListener('input', handleInput);
  contentEl.addEventListener('click', handleClick);

  try {
    const listResult = await window.electronAPI.listUploadedPdfs();
    const file = (listResult.files || []).find((entry) => entry.name === fileName);
    if (file) {
      viewPdf(file.path, '.review-pdf');
    } else {
      setStatus('This PDF is no longer in your uploads.');
    }

    const parsedResult = await window.electronAPI.loadParsed(fileName);
    if (!parsedResult.success) {
      setStatus(`Could not load parsed pattern: ${parsedResult.error}`);
      return;
    }

    original = parsedResult.parsed;
    draft = toDraft(original);
    renderForm();
  } catch (error) {
    setStatus(`Could not load review: ${error.message}`);
  }
};
