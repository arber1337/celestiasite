import { BASE, REPOSITORY, validatePortfolio, publishPortfolio, portfolioPage, escapeHTML, safeImagePath, STATUSES, CATEGORIES } from './portfolio-core.mjs?v=20261001-security1';
const $ = selector => document.querySelector(selector);
const fields = ['title', 'location', 'year', 'execution-year', 'category', 'status', 'description', 'execution', 'title-sq', 'description-sq'];
let token = '', head = '', data = { version: 1, projects: [] }, images = [], cover = 0, busy = false, dirty = false;
let lastActivity = 0, deploymentController;
const IDLE_LIMIT = 15 * 60 * 1000;
const ownedURLs = new Set();
const status = (message, error = false) => { $('#admin-status').textContent = message; $('#admin-status').classList.toggle('error', error); };
function setBusy(value) {
  busy = value;
  const connected = Boolean(token && head);
  $('#admin-workspace').hidden = !connected;
  document.querySelectorAll('#project-form button, #project-form input, #project-form textarea, #project-form select, #new-project, #project-list button').forEach(button => { button.disabled = value || !connected; });
  document.querySelectorAll('#connect-form button, #connect-form input').forEach(button => { button.disabled = value; });
  $('#publish-project').disabled = value || !connected;
  $('#project-form').setAttribute('aria-busy', String(value));
}
async function api(path, method = 'GET', body) {
  if (!token) throw new Error('Lidhni GitHub përpara publikimit.');
  const response = await fetch('https://api.github.com/repos/' + REPOSITORY + path, { method, credentials: 'omit', cache: 'no-store', redirect: 'error', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(30000), headers: { Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + token, 'X-GitHub-Api-Version': '2026-03-10', ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  if (!response.ok) {
    if (response.status === 401) disconnect();
    const errors = { 401: 'Kodi nuk është i vlefshëm ose ka skaduar. Lidhuni sërish.', 403: 'GitHub nuk lejon këtë veprim. Kontrolloni lejen Contents: Read and write për celestiasite.', 404: 'Repository ose skedari nuk gjendet. Kontrolloni që token-i ka akses te celestiasite.', 409: 'Repository ka ndryshuar. Rilidhuni për të ngarkuar versionin e fundit.', 422: 'GitHub nuk e pranoi përditësimin. Repository mund të ketë ndryshuar; rilidhuni dhe provoni sërish.' };
    throw new Error(errors[response.status] || 'GitHub nuk përgjigjet (' + response.status + '). Drafti mund të ruhet në pajisje.');
  }
  return response.json();
}
function disconnect(message = 'Lidhja u mbyll. Drafti i hapur mbetet në këtë sesion; rilidhuni për ta hapur.') {
  token = ''; head = ''; $('#github-token').value = ''; $('#connection-badge').textContent = 'Pa lidhje'; $('#connection-badge').classList.remove('connected'); $('#disconnect-button').hidden = true; $('#publish-project').disabled = true;
  lastActivity = 0; data = { version: 1, projects: [] }; $('#project-list').replaceChildren();
  deploymentController?.abort(); $('#deployment-status').hidden = true;
  setBusy(busy); status(message);
}
$('#disconnect-button').addEventListener('click', () => disconnect());
for (const eventName of ['pointerdown', 'keydown']) document.addEventListener(eventName, event => { if (event.isTrusted && token) lastActivity = Date.now(); }, { passive: true });
setInterval(() => { if (token && !busy && lastActivity && Date.now() - lastActivity >= IDLE_LIMIT) disconnect('Sesioni u mbyll pas 15 minutash pa aktivitet. Rilidhuni për të vazhduar; drafti mbetet në këtë sesion.'); }, 15000);
window.addEventListener('pagehide', () => disconnect('Sesioni u mbyll kur dolët nga paneli. Lidhni sërish GitHub.'));
setBusy(false);
$('#connect-form').addEventListener('submit', async event => {
  event.preventDefault(); if (busy) return;
  if (window.self !== window.top || (location.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(location.hostname))) { status('Paneli duhet hapur drejtpërdrejt përmes HTTPS.', true); return; }
  token = $('#github-token').value.trim(); if (!token) return;
  $('#github-token').value = ''; setBusy(true); status('Po verifikoj llogarinë dhe po lexoj projektet…');
  try {
    const userResponse = await fetch('https://api.github.com/user', { credentials: 'omit', cache: 'no-store', redirect: 'error', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(30000), headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2026-03-10' } });
    if (!userResponse.ok) throw new Error('Kodi nuk është i vlefshëm ose ka skaduar.');
    const user = await userResponse.json();
    if (user.login.toLowerCase() !== 'arber1337') throw new Error('Ky panel publikon vetëm për llogarinë arber1337.');
    const repository = await api('');
    if (repository.permissions?.push !== true) throw new Error('Ky kod nuk ka leje shkrimi. Aktivizoni Contents: Read and write vetëm për celestiasite.');
    const reference = await api('/git/ref/heads/main'); head = reference.object.sha;
    const file = await api('/contents/portfolio.json?ref=' + head);
    const bytes = Uint8Array.from(atob(file.content.replace(/\s/g, '')), character => character.charCodeAt(0));
    data = validatePortfolio(JSON.parse(new TextDecoder().decode(bytes)));
    lastActivity = Date.now(); renderList(); $('#connection-badge').textContent = 'Lidhur si arber1337'; $('#connection-badge').classList.add('connected'); $('#disconnect-button').hidden = false;
    status('Lidhja u krye. Zgjidhni një projekt për ndryshim ose krijoni një të ri.');
  } catch (error) { disconnect(); status(error.message || 'Lidhja me GitHub dështoi.', true); }
  finally { setBusy(false); }
});
function renderList() {
  const list = $('#project-list'); list.replaceChildren();
  for (const project of data.projects) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'admin-project-item';
    button.textContent = project.title + (project.year ? ' · ' + project.year : ''); button.addEventListener('click', () => {
      if (dirty && !window.confirm('Të hap projektin tjetër? Ndryshimet e paruajtura të draftit të hapur do të zëvendësohen.')) return;
      loadProject(project); status('Po ndryshoni: ' + project.title);
    }); list.append(button);
  }
}
function clearURLs() { for (const url of ownedURLs) URL.revokeObjectURL(url); ownedURLs.clear(); }
function loadProject(project) {
  clearURLs(); $('#project-form').reset(); $('#project-id').value = project.id || '';
  const values = { title: project.title, location: project.location, year: project.year ?? '', 'execution-year': project.executionYear ?? '', category: project.category || 'architecture', status: project.status || 'concept', description: project.description, execution: project.execution, 'title-sq': project.titleSq, 'description-sq': project.descriptionSq };
  for (const key of fields) $('#project-' + key).value = values[key] ?? '';
  images = (project.images || []).map(image => ({ ...image, preview: image.src })); cover = project.cover || 0; dirty = false;
  $('#editor-title').textContent = project.id ? 'Ndrysho projektin' : 'Projekt i ri'; $('#project-preview').hidden = true; renderImages();
}
$('#new-project').addEventListener('click', () => {
  if (dirty && !window.confirm('Të nis një projekt të ri? Ruani draftin nëse doni t’i mbani ndryshimet.')) return;
  loadProject({}); status('Shtoni informacionin dhe imazhet e projektit të ri.'); $('#project-title').focus();
});
$('#project-form').addEventListener('input', () => { dirty = true; });
window.addEventListener('beforeunload', event => { if (dirty || busy) { event.preventDefault(); event.returnValue = ''; } });

function toBase64(blob) {
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.onerror = () => reject(new Error('Imazhi nuk mund të lexohet.')); reader.readAsDataURL(blob); });
}
async function imageVariant(bitmap, maxWidth) {
  const scale = Math.min(1, maxWidth / bitmap.width); const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d'); context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.84));
  if (!blob) throw new Error('Përpunimi i imazhit dështoi. Provoni një JPG tjetër.');
  return { blob, width: canvas.width, height: canvas.height, extension: blob.type === 'image/webp' ? 'webp' : 'png' };
}
$('#project-images').addEventListener('change', async event => {
  const files = Array.from(event.target.files); event.target.value = ''; if (!files.length || busy) return;
  if (images.length + files.length > 12) { status('Maksimumi 12 imazhe për projekt. Hiqni disa ose zgjidhni më pak.', true); return; }
  setBusy(true); const staged = [];
  try {
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 20 * 1024 * 1024) throw new Error('Përdorni JPG, PNG ose WebP deri në 20 MB për imazh.');
      status('Po optimizoj imazhin ' + (index + 1) + ' nga ' + files.length + '…');
      const bitmap = await createImageBitmap(file);
      if (bitmap.width * bitmap.height > 60000000) { bitmap.close(); throw new Error('Imazhi është shumë i madh. Eksportojeni në më pak se 60 megapixels.'); }
      const large = await imageVariant(bitmap, 1600), small = await imageVariant(bitmap, 640); bitmap.close();
      const name = 'portfolio-img-' + crypto.randomUUID(); const preview = URL.createObjectURL(large.blob); ownedURLs.add(preview);
      staged.push({ src: name + '.' + large.extension, thumb: name + '-thumb.' + small.extension, width: large.width, height: large.height, alt: $('#project-title').value.trim() || file.name.replace(/\.[^.]+$/, ''), preview, blobs: { large: large.blob, small: small.blob } });
    }
    images.push(...staged); dirty = true; renderImages(); status(images.length + ' imazhe gati. Zgjidhni pamjen kryesore.');
  } catch (error) { for (const image of staged) { URL.revokeObjectURL(image.preview); ownedURLs.delete(image.preview); } status(error.message || 'Imazhi nuk mund të përpunohet.', true); }
  finally { setBusy(false); }
});
function renderImages() {
  const list = $('#image-list'); list.replaceChildren();
  images.forEach((image, index) => {
    const card = document.createElement('div'); card.className = 'admin-image-card';
    const picture = document.createElement('img'); picture.src = image.preview; picture.alt = image.alt; picture.width = image.width; picture.height = image.height;
    const label = document.createElement('label'); const radio = document.createElement('input'); radio.type = 'radio'; radio.name = 'cover-image'; radio.checked = index === cover;
    radio.addEventListener('change', () => { cover = index; dirty = true; }); label.append(radio, document.createTextNode(' Pamja kryesore'));
    const altLabel = document.createElement('label'); altLabel.textContent = 'Përshkrimi i imazhit'; const input = document.createElement('input'); input.value = image.alt; input.maxLength = 300; input.addEventListener('input', () => { image.alt = input.value; dirty = true; }); altLabel.append(input);
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'remove-image'; remove.textContent = 'Hiq imazhin'; remove.addEventListener('click', () => { images.splice(index, 1); cover = index < cover ? cover - 1 : index === cover ? 0 : cover; dirty = true; renderImages(); });
    card.append(picture, label, altLabel, remove); list.append(card);
  });
}
function readProject(requireValid = true) {
  if (requireValid && !$('#project-form').reportValidity()) return null;
  if (!images.length) { status('Shtoni të paktën një imazh për projektin.', true); return null; }
  const title = $('#project-title').value.trim();
  const project = { id: $('#project-id').value || ('project-' + crypto.randomUUID()), title, titleSq: $('#project-title-sq').value.trim(), description: $('#project-description').value.trim(), descriptionSq: $('#project-description-sq').value.trim(), location: $('#project-location').value.trim(), year: $('#project-year').value ? Number($('#project-year').value) : null, executionYear: $('#project-execution-year').value ? Number($('#project-execution-year').value) : null, execution: $('#project-execution').value.trim(), category: $('#project-category').value, status: $('#project-status').value, cover, images: images.map(({ src, thumb, width, height, alt }) => ({ src, thumb, width, height, alt })) };
  try { validatePortfolio({ version: 1, projects: [project] }); } catch (error) { status(error.message, true); return null; }
  return project;
}
$('#preview-project').addEventListener('click', () => {
  const project = readProject(); if (!project) return;
  const image = images[cover]; const esc = escapeHTML;
  $('#preview-content').innerHTML = `<img src="${esc(image.preview)}" alt="${esc(image.alt)}" width="${image.width}" height="${image.height}"><span class="eyebrow">${CATEGORIES[project.category][0]} · ${esc(project.location)} · ${project.year}</span><h3>${esc(project.title)}</h3><p class="preview-description">${esc(project.description)}</p><p>${STATUSES[project.status][0]}${project.executionYear ? ' · ' + project.executionYear : ''}</p>${project.execution ? `<p>${esc(project.execution)}</p>` : ''}`;
  $('#project-preview').hidden = false; $('#project-preview').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
});
async function draftDatabase() {
  return new Promise((resolve, reject) => { const request = indexedDB.open('celestia-studio-drafts', 1); request.onupgradeneeded = () => request.result.createObjectStore('drafts'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(new Error('Pajisja nuk lejon ruajtjen lokale të draftit.')); });
}
async function draftOperation(operation, value) {
  const database = await draftDatabase();
  try { return await new Promise((resolve, reject) => { const transaction = database.transaction('drafts', operation === 'get' ? 'readonly' : 'readwrite'); const store = transaction.objectStore('drafts'); const request = operation === 'get' ? store.get('current') : operation === 'put' ? store.put(value, 'current') : store.delete('current'); request.onerror = () => reject(new Error('Drafti nuk mund të ruhet. Kontrolloni hapësirën në pajisje.')); transaction.oncomplete = () => resolve(request.result); transaction.onabort = () => reject(new Error('Ruajtja e draftit dështoi.')); }); }
  finally { database.close(); }
}
$('#save-draft').addEventListener('click', async () => {
  const values = Object.fromEntries(fields.map(key => [key, $('#project-' + key).value]));
  setBusy(true);
  try { await draftOperation('put', { id: $('#project-id').value, values, cover, images: images.map(({ preview, ...image }) => image) }); dirty = false; status('Drafti u ruajt në këtë pajisje. Ende nuk është publik në website.'); }
  catch (error) { status(error.message, true); }
  finally { setBusy(false); }
});
$('#restore-draft').addEventListener('click', async () => {
  if (dirty && !window.confirm('Të hap draftin e ruajtur dhe të zëvendësoj draftin aktual?')) return;
  setBusy(true);
  try {
    const draft = await draftOperation('get'); if (!draft) { status('Nuk ka draft të ruajtur në këtë pajisje.'); return; }
    if (!draft.values || !Array.isArray(draft.images) || draft.images.length > 12 || !Number.isInteger(draft.cover) || draft.cover < 0 || (draft.images.length && draft.cover >= draft.images.length)) throw new Error('Drafti i ruajtur nuk është i vlefshëm.');
    for (const image of draft.images) if (!safeImagePath(image.src) || !safeImagePath(image.thumb) || (image.blobs && (!(image.blobs.large instanceof Blob) || !(image.blobs.small instanceof Blob) || !['image/webp', 'image/png'].includes(image.blobs.large.type) || !['image/webp', 'image/png'].includes(image.blobs.small.type)))) throw new Error('Drafti përmban një imazh të palejuar.');
    clearURLs(); $('#project-form').reset(); $('#project-id').value = draft.id || ''; $('#project-preview').hidden = true;
    for (const key of fields) $('#project-' + key).value = draft.values[key] ?? '';
    images = draft.images.map(image => { const preview = image.blobs ? URL.createObjectURL(image.blobs.large) : image.src; if (image.blobs) ownedURLs.add(preview); return { ...image, preview }; }); cover = draft.cover; dirty = false; renderImages(); status('Drafti u hap. Ende nuk është publik; përdorni “Publiko projektin”.');
  } catch (error) { status(error.message, true); }
  finally { setBusy(false); }
});
$('#clear-draft').addEventListener('click', async () => {
  if (!window.confirm('Të fshij kopjen e draftit të ruajtur në këtë pajisje? Projekti i hapur dhe website-i nuk ndryshojnë.')) return;
  setBusy(true);
  try { await draftOperation('delete'); status('Kopja e draftit u hoq nga kjo pajisje. Projekti i hapur dhe website-i nuk ndryshuan.'); }
  catch (error) { status(error.message, true); }
  finally { setBusy(false); }
});
function deploymentNotice(message, project) {
  const element = $('#deployment-status'); element.hidden = false; element.textContent = message;
  if (project) { const link = document.createElement('a'); link.href = BASE + 'portfolio-sq.html#project-' + project.id; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = ' Shiko projektin ↗'; element.append(link); }
}
async function confirmDeployment(next, project, commit, signal) {
  deploymentNotice('Projekti u ruajt në GitHub. Po pres publikimin automatik në Vercel…');
  const expected = JSON.stringify(next), pages = ['sq', 'en'].map(language => portfolioPage(next, language));
  for (let attempt = 0; attempt < 18 && !signal.aborted; attempt++) {
    try {
      const options = { cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]) };
      const response = await fetch(BASE + 'portfolio.json?deployment=' + commit, options);
      if (response.ok && JSON.stringify(validatePortfolio(await response.json())) === expected) {
        const live = await Promise.all(['portfolio-sq.html', 'portfolio.html'].map(async path => { const page = await fetch(BASE + path + '?deployment=' + commit, options); return page.ok ? page.text() : ''; }));
        if (live.every((page, index) => page === pages[index])) { if (!signal.aborted) deploymentNotice('Publikimi u konfirmua në website. Nuk nevojitet refresh ose redeploy manual në Vercel.', project); return; }
      }
    } catch { if (signal.aborted) return; }
    if (attempt < 17) await new Promise(resolve => {
      const done = () => { clearTimeout(timer); signal.removeEventListener('abort', done); resolve(); };
      const timer = setTimeout(done, 10000); signal.addEventListener('abort', done, { once: true }); if (signal.aborted) done();
    });
  }
  if (!signal.aborted) deploymentNotice('Ndryshimi është në GitHub, por publikimi në website ende nuk u konfirmua. Kontrolloni deployment-in e fundit në Vercel përpara se ta publikoni sërish.', project);
}
$('#project-form').addEventListener('submit', async event => {
  event.preventDefault(); if (busy || !token || !head) return;
  const project = readProject(); if (!project) return;
  setBusy(true); status('Po përgatis publikimin e projektit…');
  try {
    const assets = [];
    for (const image of images) if (image.blobs) {
      assets.push({ path: image.src, content: await toBase64(image.blobs.large), encoding: 'base64' }, { path: image.thumb, content: await toBase64(image.blobs.small), encoding: 'base64' });
    }
    const projects = [...data.projects], index = projects.findIndex(item => item.id === project.id); if (index >= 0) projects[index] = project; else projects.unshift(project);
    const next = { version: 1, projects };
    head = await publishPortfolio({ api, expectedHead: head, data: next, assets, message: 'Publish portfolio project: ' + project.title, onProgress: (done, total) => status('Po publikoj skedarët: ' + done + ' / ' + total + '…') });
    data = next; $('#project-id').value = project.id; images = images.map(({ blobs, ...image }) => image); dirty = false; renderList();
    lastActivity = Date.now(); status('Projekti u ruajt në GitHub. Po verifikoj publikimin në website.');
    deploymentController?.abort(); deploymentController = new AbortController();
    void confirmDeployment(next, project, head, deploymentController.signal);
  } catch (error) { status(error.message || 'Publikimi dështoi. Drafti juaj mbetet këtu; ruajeni në pajisje përpara se të dilni.', true); }
  finally { setBusy(false); }
});
