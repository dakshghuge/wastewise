const state = {
  categories: [],
  maxUploadBytes: 5 * 1024 * 1024,
  selectedFile: null
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const html = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};

async function api(path, options = {}) {
  const response = await fetch(path, { credentials: 'omit', ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
  return data;
}

function showMessage(element, message, error = false) {
  element.textContent = message;
  element.classList.toggle('error', error);
}

function setView(name) {
  const safe = ['home', 'scanner', 'ideas', 'guides', 'learn'].includes(name) ? name : 'home';
  $$('.view').forEach((view) => view.classList.toggle('active', view.id === `view-${safe}`));
  $$('[data-view]').forEach((link) => {
    if (link.dataset.view === safe) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  $('#navigation').classList.remove('open');
  $('#menu-toggle').setAttribute('aria-expanded', 'false');
  if (safe === 'ideas') loadIdeas();
  if (safe === 'guides') renderGuide($('#guide-category').value);
  if (safe === 'learn') loadResources();
}

function fillCategories(select, includeAll = false) {
  select.replaceChildren();
  const first = document.createElement('option');
  first.value = '';
  first.textContent = includeAll ? 'All categories' : 'Choose a category';
  select.append(first);
  for (const category of state.categories) {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;
    select.append(option);
  }
}

async function initialize() {
  try {
    const config = await api('/api/config');
    if (Number.isFinite(config.maxUploadBytes) && config.maxUploadBytes > 0) state.maxUploadBytes = config.maxUploadBytes;
    const uploadLimit = `${Math.round(state.maxUploadBytes / (1024 * 1024) * 10) / 10} MB`;
    $('.dropzone span:not(.upload-icon)').textContent = `or browse JPEG, PNG, or WebP · max ${uploadLimit}`;
    const { categories } = await api('/api/waste/categories');
    state.categories = categories;
    fillCategories($('#manual-category'));
    fillCategories($('#idea-category'), true);
    fillCategories($('#guide-category'));
    $('#guide-category').value = 'plastic';
    renderHomeCategories();
    await renderGuide('plastic');
    await loadIdeas();
  } catch (error) {
    console.error(error);
    showMessage($('#scan-message'), 'The application could not load its categories. Refresh to try again.', true);
  }
}

function renderHomeCategories() {
  const grid = $('#home-categories');
  const symbols = ['♻', '▤', '▧', '◇', '▰', '❋', '⌘', '▱', '▥', '◌', '▦', '⚠', '◈', '?'];
  grid.replaceChildren();
  state.categories.forEach((category, index) => {
    const card = html('a', 'category-card');
    card.href = '#scanner';
    card.append(html('span', '', symbols[index] || '♻'), html('strong', '', category.name));
    card.addEventListener('click', () => { $('#manual-category').value = category.id; });
    grid.append(card);
  });
}

function goToHash() {
  setView(location.hash.slice(1) || 'home');
}

$('#navigation').addEventListener('click', (event) => {
  if (event.target.matches('[data-view]')) setView(event.target.dataset.view);
});
window.addEventListener('hashchange', goToHash);
$('#menu-toggle').addEventListener('click', () => {
  const open = $('#navigation').classList.toggle('open');
  $('#menu-toggle').setAttribute('aria-expanded', String(open));
});

function clearSelectedImage() {
  const preview = $('#image-preview');
  if (preview.dataset.objectUrl) URL.revokeObjectURL(preview.dataset.objectUrl);
  preview.removeAttribute('src');
  delete preview.dataset.objectUrl;
  state.selectedFile = null;
  $('#image-file').value = '';
  $('#preview-wrap').classList.add('hidden');
  $('#dropzone').classList.remove('hidden');
}

function validateFile(file) {
  const types = ['image/jpeg', 'image/png', 'image/webp'];
  if (!types.includes(file.type)) throw new Error('Choose a JPEG, PNG, or WebP image.');
  if (file.size > state.maxUploadBytes) throw new Error(`Image must be ${Math.round(state.maxUploadBytes / (1024 * 1024) * 10) / 10} MB or smaller.`);
  if (!file.size) throw new Error('The selected image is empty.');
}

function selectFile(file) {
  const message = $('#scan-message');
  try {
    validateFile(file);
    clearSelectedImage();
    state.selectedFile = file;
    const preview = $('#image-preview');
    const objectUrl = URL.createObjectURL(file);
    preview.src = objectUrl;
    preview.dataset.objectUrl = objectUrl;
    $('#preview-wrap').classList.remove('hidden');
    $('#dropzone').classList.add('hidden');
    showMessage(message, '');
  } catch (error) {
    $('#image-file').value = '';
    showMessage(message, error.message, true);
  }
}

$('#image-file').addEventListener('change', (event) => {
  if (event.target.files[0]) selectFile(event.target.files[0]);
});
$('#remove-image').addEventListener('click', clearSelectedImage);
const dropzone = $('#dropzone');
dropzone.addEventListener('dragover', (event) => { event.preventDefault(); dropzone.classList.add('dragging'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragging'));
dropzone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropzone.classList.remove('dragging');
  if (event.dataTransfer.files[0]) selectFile(event.dataTransfer.files[0]);
});

$('#scan-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const message = $('#scan-message');
  if (!state.selectedFile && !$('#manual-category').value) return showMessage(message, 'Choose an image or select a category for manual mode.', true);
  const body = new FormData();
  if (state.selectedFile) body.append('image', state.selectedFile);
  if ($('#manual-category').value) body.append('category', $('#manual-category').value);
  $('#progress-wrap').classList.remove('hidden');
  $('#analyze-button').disabled = true;
  $('#processing-status').textContent = 'Uploading image for temporary processing…';
  showMessage(message, '');
  try {
    const result = await xhrUpload('/api/waste/analyze', body, (percent) => {
      $('#upload-progress').value = percent;
      if (percent === 100) $('#processing-status').textContent = 'Analyzing image…';
    });
    renderResult(result);
    showMessage(message, result.mode === 'manual' ? 'Manual category selected. No AI recognition was performed.' : 'Analysis complete. Your image was discarded and the result was not saved.');
  } catch (error) {
    showMessage(message, error.message, true);
  } finally {
    clearSelectedImage();
    $('#analyze-button').disabled = false;
    $('#progress-wrap').classList.add('hidden');
    $('#upload-progress').value = 0;
  }
});

function xhrUpload(url, body, onProgress) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', url);
    request.withCredentials = false;
    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) onProgress(Math.round(event.loaded / event.total * 100));
    });
    request.addEventListener('load', () => {
      let data;
      try { data = JSON.parse(request.responseText); } catch { data = {}; }
      if (request.status >= 200 && request.status < 300) resolve(data);
      else reject(new Error(data.error || `Analysis failed (${request.status}).`));
    });
    request.addEventListener('error', () => reject(new Error('Network error. Check your connection and try again.')));
    request.addEventListener('timeout', () => reject(new Error('The request timed out. Try again.')));
    request.timeout = 45000;
    request.send(body);
  });
}

function renderResult(result) {
  const root = $('#result-panel');
  root.replaceChildren();
  root.classList.remove('hidden');
  const heading = html('article', 'panel result-heading');
  const summary = html('div');
  summary.append(html('p', 'eyebrow', result.mode === 'manual' ? 'Manual category' : 'Image recognition'));
  summary.append(html('h2', '', result.recognition.objectName));
  const category = state.categories.find((item) => item.id === result.recognition.category);
  summary.append(html('p', '', `Category: ${category ? category.name : 'Unknown'} · Material: ${result.recognition.material || 'unknown'}`));
  if (result.recognition.needsConfirmation) summary.append(html('span', 'badge uncertain', 'Please confirm this result'));
  else summary.append(html('span', 'badge', result.mode === 'manual' ? 'Selected by you' : `Confidence ${Math.round(result.recognition.confidence * 100)}%`));
  summary.append(html('p', 'field-note', 'Images and analysis results are not saved by this app.'));
  heading.append(summary);
  root.append(heading);

  const columns = html('div', 'result-columns');
  const reuse = html('article', 'panel');
  reuse.append(html('h3', '', 'Reuse ideas'));
  if (!result.reuseIdeas.length) reuse.append(html('p', '', 'No reviewed reuse suggestions are available for this category yet.'));
  result.reuseIdeas.forEach((idea) => {
    const entry = html('div');
    entry.append(html('strong', '', idea.title), html('p', '', `${idea.description} Difficulty: ${idea.difficulty}; about ${idea.estimatedTime}.`));
    const list = html('ol');
    idea.steps.forEach((step) => list.append(html('li', '', step)));
    entry.append(list);
    idea.safetyNotes.forEach((note) => entry.append(html('p', 'field-note', `Safety: ${note}`)));
    reuse.append(entry);
  });

  const recycle = html('article', 'panel');
  recycle.append(html('h3', '', 'Recycling preparation'));
  appendList(recycle, 'Preparation', result.recycling.preparationSteps);
  appendList(recycle, 'Often accepted (check locally)', result.recycling.acceptedMaterials);
  appendList(recycle, 'Often not accepted', result.recycling.rejectedMaterials);
  recycle.append(html('p', 'guide-source', result.recycling.source));

  const disposal = html('article', 'panel');
  disposal.append(html('h3', '', 'Safer disposal'));
  disposal.append(html('p', '', result.disposal.handling));
  disposal.append(html('p', '', result.disposal.channel));
  if (result.disposal.locationSpecific !== true) disposal.append(html('p', 'field-note', 'Local facility information has not been verified.'));
  columns.append(reuse, recycle, disposal);
  root.append(columns);

  const actions = html('div', 'result-actions');
  const another = html('a', 'button primary', 'Analyze another item');
  another.href = '#scanner';
  another.addEventListener('click', () => root.classList.add('hidden'));
  actions.append(another);
  root.append(actions);
  root.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function appendList(parent, title, items) {
  parent.append(html('h4', '', title));
  const ul = html('ul');
  if (!items || !items.length) ul.append(html('li', '', 'No specific information available; check with your local authority.'));
  else items.forEach((item) => ul.append(html('li', '', item)));
  parent.append(ul);
}

function renderIdeaCard(idea) {
  const card = html('article', 'idea-card');
  const top = html('div', 'card-top');
  top.append(html('span', 'badge', state.categories.find((category) => category.id === idea.category)?.name || idea.category));
  top.append(html('span', 'idea-meta', `${idea.difficulty} · ${idea.estimatedTime}`));
  card.append(top, html('h3', '', idea.title), html('p', '', idea.description));
  card.append(html('p', 'idea-meta', `Materials: ${Array.isArray(idea.materials) ? idea.materials.join(', ') : ''}`));
  const steps = html('ol');
  (idea.steps || []).forEach((step) => steps.append(html('li', '', step)));
  card.append(steps);
  (idea.safetyNotes || []).forEach((note) => card.append(html('p', 'field-note', `Safety: ${note}`)));
  return card;
}

async function loadIdeas() {
  try {
    const params = new URLSearchParams();
    if ($('#idea-search').value.trim()) params.set('q', $('#idea-search').value.trim());
    if ($('#idea-category').value) params.set('category', $('#idea-category').value);
    if ($('#idea-difficulty').value) params.set('difficulty', $('#idea-difficulty').value);
    const { ideas } = await api(`/api/ideas?${params}`);
    $('#ideas-list').replaceChildren(...ideas.map(renderIdeaCard));
    $('#ideas-empty').classList.toggle('hidden', ideas.length > 0);
  } catch (error) {
    $('#ideas-list').replaceChildren(html('p', 'empty-state', error.message));
  }
}

let ideaTimer;
['#idea-search', '#idea-category', '#idea-difficulty'].forEach((selector) => {
  $(selector).addEventListener('input', () => { clearTimeout(ideaTimer); ideaTimer = setTimeout(loadIdeas, 180); });
  $(selector).addEventListener('change', loadIdeas);
});

async function renderGuide(category) {
  const selected = category || 'plastic';
  try {
    const { guide } = await api(`/api/recycling/${encodeURIComponent(selected)}`);
    const panel = $('#guide-detail');
    panel.replaceChildren(html('h2', '', state.categories.find((item) => item.id === selected)?.name || selected));
    appendList(panel, 'Preparation', guide.preparationSteps);
    appendList(panel, 'Accepted materials (verify locally)', guide.acceptedMaterials);
    appendList(panel, 'Commonly rejected materials', guide.rejectedMaterials);
    appendList(panel, 'Safety', guide.safetyNotes);
    panel.append(html('p', 'guide-source', guide.source));
  } catch (error) {
    $('#guide-detail').replaceChildren(html('p', 'form-message error', error.message));
  }
}

$('#guide-category').addEventListener('change', (event) => renderGuide(event.target.value));

async function loadResources() {
  try {
    const { resources } = await api('/api/learn');
    $('#resources-list').replaceChildren(...resources.map((resource) => {
      const card = html('article', 'resource-card');
      card.append(html('span', 'eyebrow', resource.category), html('h3', '', resource.title), html('p', '', resource.summary));
      return card;
    }));
  } catch (error) {
    $('#resources-list').replaceChildren(html('p', 'form-message error', error.message));
  }
}

$('#privacy-open').addEventListener('click', () => $('#privacy-dialog').showModal());
$('#privacy-close').addEventListener('click', () => $('#privacy-dialog').close());
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    $('#navigation').classList.remove('open');
    $('#menu-toggle').setAttribute('aria-expanded', 'false');
  }
});

initialize().then(goToHash);
