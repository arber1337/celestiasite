export const BASE = 'https://www.celestia.archi/';
export const REPOSITORY = 'arber1337/celestiasite';
export const VERSION = '20261001-projects1';
export const STATUSES = { concept: ['Concept design', 'Koncept'], design: ['Design development', 'Projektim'], construction: ['Under construction', 'Në zbatim'], completed: ['Completed', 'Përfunduar'] };
export const CATEGORIES = { architecture: ['Architecture', 'Arkitekturë'], interior: ['Interiors', 'Interior'], facade: ['Façades', 'Fasada'] };
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
export function safeImagePath(path) {
  return typeof path === 'string' && /^(?:portfolio-img-[a-z0-9-]+\.(?:webp|jpg|png)|residence-(?:640|1600)\.webp)$/.test(path);
}
export function validatePortfolio(data) {
  if (!data || data.version !== 1 || !Array.isArray(data.projects) || data.projects.length > 200) throw new Error('Invalid portfolio data.');
  const ids = new Set();
  for (const project of data.projects) {
    if (!/^[a-z0-9-]{1,80}$/.test(project.id) || ids.has(project.id)) throw new Error('Invalid or duplicate project ID.');
    ids.add(project.id);
    if (typeof project.title !== 'string' || !project.title.trim() || project.title.length > 120) throw new Error('Project title is required (maximum 120 characters).');
    if (typeof project.description !== 'string' || !project.description.trim() || project.description.length > 5000 || typeof project.location !== 'string' || project.location.length > 160) throw new Error('Invalid description or location.');
    if (!Object.hasOwn(STATUSES, project.status) || !Object.hasOwn(CATEGORIES, project.category)) throw new Error('Invalid project status or category.');
    for (const key of ['year', 'executionYear']) if (project[key] !== null && (!Number.isInteger(project[key]) || project[key] < 1900 || project[key] > 2100)) throw new Error('Invalid project year.');
    if (typeof project.execution !== 'string' || project.execution.length > 1500) throw new Error('Invalid implementation description.');
    if (!Array.isArray(project.images) || !project.images.length || project.images.length > 12) throw new Error('Add between 1 and 12 images.');
    for (const image of project.images) {
      if (!safeImagePath(image.src) || !safeImagePath(image.thumb) || !Number.isInteger(image.width) || !Number.isInteger(image.height) || image.width < 1 || image.height < 1 || image.width > 16000 || image.height > 16000 || typeof image.alt !== 'string' || image.alt.length > 300) throw new Error('Invalid project image.');
    }
    if (!Number.isInteger(project.cover) || project.cover < 0 || project.cover >= project.images.length) throw new Error('Invalid cover image.');
    for (const key of ['titleSq', 'descriptionSq']) if (project[key] !== undefined && (typeof project[key] !== 'string' || project[key].length > (key === 'titleSq' ? 120 : 5000))) throw new Error('Invalid Albanian project text.');
  }
  return data;
}
export function projectText(project, language = 'en') {
  const sq = language === 'sq';
  return { title: sq && project.titleSq ? project.titleSq : project.title, description: sq && project.descriptionSq ? project.descriptionSq : project.description };
}
export function projectCard(project, language = 'en') {
  const sq = language === 'sq', { title } = projectText(project, language), image = project.images[project.cover];
  return `<a class="portfolio-card" href="${sq ? 'portfolio-sq.html' : 'portfolio.html'}#project-${project.id}"><div class="portfolio-image"><img src="${escapeHTML(image.thumb)}" width="${image.width}" height="${image.height}" loading="lazy" decoding="async" alt="${escapeHTML(image.alt || title)}"><span class="portfolio-category">${CATEGORIES[project.category][sq ? 1 : 0]}</span><span class="portfolio-arrow" aria-hidden="true">↗</span></div><div class="portfolio-card-copy"><span class="eyebrow">${escapeHTML(project.location || (sq ? 'Koncept rezidencial' : 'Residential concept'))}${project.year ? ' · ' + project.year : ''}</span><h3>${escapeHTML(title)}</h3><span class="portfolio-status">${STATUSES[project.status][sq ? 1 : 0]}</span></div></a>`;
}
export function portfolioPage(data, language = 'en') {
  validatePortfolio(data);
  const sq = language === 'sq', path = sq ? 'portfolio-sq.html' : 'portfolio.html', title = sq ? 'Portofoli | Celestia Architects' : 'Architecture & Interior Portfolio | Celestia Architects';
  const intro = sq ? 'Projekte të realizuara nga Celestia Architects në Tiranë, Durrës dhe Vlorë. Arkitekturë dhe interior të menduar në detaj.' : 'Projects realized by Celestia Architects in Tirana, Durrës and Vlorë. Architecture and interiors, considered in every detail.';
  const esc = escapeHTML;
  const graph = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, url: BASE + path, inLanguage: language, hasPart: data.projects.map(project => ({ '@type': 'CreativeWork', name: projectText(project, language).title, description: projectText(project, language).description, creator: { '@type': 'Organization', name: 'Celestia Architects', url: BASE }, image: project.images.map(image => BASE + image.src), url: BASE + path + '#project-' + project.id })) };
  const projects = data.projects.map(project => {
    const text = projectText(project, language);
    const metadata = [[sq ? 'Vendndodhja' : 'Location', project.location || (sq ? 'E papërcaktuar' : 'Not specified')], ...(project.year ? [[sq ? 'Viti i projektit' : 'Project year', project.year]] : []), [sq ? 'Zbatimi' : 'Execution', STATUSES[project.status][sq ? 1 : 0]], ...(project.executionYear ? [[sq ? 'Viti i zbatimit' : 'Execution year', project.executionYear]] : [])];
    return `<article class="portfolio-project" id="project-${project.id}"><div class="project-intro"><div><span class="eyebrow">${CATEGORIES[project.category][sq ? 1 : 0]} / CELESTIA</span><h2>${esc(text.title)}</h2></div><dl>${metadata.map(([label, value]) => `<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl></div><p class="project-description">${esc(text.description)}</p>${project.execution ? `<p class="execution-note"><strong>${sq ? 'Mbi zbatimin' : 'Implementation notes'}:</strong> ${esc(project.execution)}</p>` : ''}<div class="project-gallery">${project.images.map((image, index) => `<a href="${esc(image.src)}" target="_blank" rel="noopener" aria-label="${esc((sq ? 'Hap imazhin: ' : 'Open image: ') + (image.alt || text.title))}"><img src="${esc(image.src)}" width="${image.width}" height="${image.height}" alt="${esc(image.alt || text.title)}" loading="lazy" decoding="async">${index === project.cover ? `<span>${sq ? 'Pamja kryesore' : 'Cover image'}</span>` : ''}</a>`).join('')}</div></article>`;
  }).join('');
  return `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(intro)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${BASE + path}"><link rel="alternate" hreflang="en" href="${BASE}portfolio.html"><link rel="alternate" hreflang="sq-AL" href="${BASE}portfolio-sq.html"><link rel="alternate" hreflang="x-default" href="${BASE}portfolio-sq.html"><link rel="icon" href="favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="styles.css?v=${VERSION}"><script type="application/ld+json">${JSON.stringify(graph).replace(/</g, '\\u003c')}</script></head><body class="content-page"><a class="skip" href="#main">${sq ? 'Kalo te përmbajtja' : 'Skip to content'}</a><header class="content-header"><a class="brand" href="${sq ? 'index.html' : 'en.html'}"><img src="logo.webp?v=20260929-2" alt="" width="48" height="48"><span>CELESTIA<span class="brand-sub">ARCHITECTS</span></span></a><nav aria-label="Main navigation"><a href="${sq ? 'index.html' : 'en.html'}#estimate">${sq ? 'Llogarit çmimin' : 'Estimate your project'}</a><a href="portfolio.html" lang="en">EN</a><a href="portfolio-sq.html" lang="sq">SQ</a><a class="button" href="https://wa.me/355692787302">WhatsApp ↗</a></nav></header><main id="main" class="portfolio-page section-pad"><span class="eyebrow">CELESTIA / SELECTED PROJECTS</span><h1>${sq ? 'Hapësira me' : 'Spaces with'} <em>${sq ? 'identitet.' : 'identity.'}</em></h1><p class="article-lead">${intro}</p><nav class="portfolio-index" aria-label="Project index">${data.projects.map(project => `<a href="#project-${project.id}">${esc(projectText(project, language).title)} ↗</a>`).join('')}</nav>${projects || `<p>${sq ? 'Projektet do të shfaqen këtu sapo të publikohen.' : 'Projects will appear here as they are published.'}</p>`}<a class="button" href="https://wa.me/355692787302">${sq ? 'Diskutoni projektin tuaj' : 'Discuss your project'} ↗</a></main><footer class="content-footer"><a href="${sq ? 'index.html' : 'en.html'}">Celestia Architects</a><a href="tel:+355692787302">+355 69 278 7302</a><a href="terms.html">Terms & Conditions</a><a href="privacy.html">Privacy</a><a href="admin.html">${sq ? 'Paneli i studios' : 'Studio panel'}</a></footer></body></html>`;
}

// A single Git commit publishes metadata, images and crawlable portfolio pages together.
// Updating the branch without force prevents overwriting a concurrent owner edit.
export async function publishPortfolio({ api, expectedHead, data, assets = [], message = 'Update Celestia portfolio', onProgress = () => {} }) {
  validatePortfolio(data);
  if (typeof api !== 'function' || !/^[a-f0-9]{40}$/.test(expectedHead)) throw new Error('Invalid publishing session.');
  if (!Array.isArray(assets) || assets.length > 24) throw new Error('Too many uploaded images.');
  const referencedImages = new Set(data.projects.flatMap(project => project.images.flatMap(image => [image.src, image.thumb])));
  const assetPaths = new Set();
  for (const file of assets) {
    if (!file || !safeImagePath(file.path) || file.path.length > 200 || !referencedImages.has(file.path) || assetPaths.has(file.path) || file.encoding !== 'base64' || typeof file.content !== 'string' || !file.content || file.content.length > 28 * 1024 * 1024 || file.content.length % 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(file.content)) throw new Error('Unsupported image upload.');
    const prefix = atob(file.content.slice(0, 32));
    const validType = file.path.endsWith('.webp') ? prefix.startsWith('RIFF') && prefix.slice(8, 12) === 'WEBP' : file.path.endsWith('.png') ? prefix.startsWith('\u0089PNG\r\n\u001a\n') : prefix.startsWith('\u00ff\u00d8\u00ff');
    if (!validType) throw new Error('The image content does not match its file type.');
    assetPaths.add(file.path);
  }
  const ref = await api('/git/ref/heads/main');
  if (ref.object.sha !== expectedHead) throw new Error('Repository changed. Reconnect to load the latest projects; your draft is still available.');
  const head = await api('/git/commits/' + expectedHead);
  const uploads = [...assets, { path: 'portfolio.json', content: JSON.stringify(data, null, 2), encoding: 'utf-8' }, { path: 'portfolio.html', content: portfolioPage(data, 'en'), encoding: 'utf-8' }, { path: 'portfolio-sq.html', content: portfolioPage(data, 'sq'), encoding: 'utf-8' }];
  const tree = [];
  for (let i = 0; i < uploads.length; i++) {
    const file = uploads[i];
    if (!['portfolio.json', 'portfolio.html', 'portfolio-sq.html'].includes(file.path) && !safeImagePath(file.path)) throw new Error('Unsupported upload path.');
    onProgress(i, uploads.length);
    const blob = await api('/git/blobs', 'POST', { content: file.content, encoding: file.encoding });
    tree.push({ path: file.path, mode: '100644', type: 'blob', sha: blob.sha });
  }
  const createdTree = await api('/git/trees', 'POST', { base_tree: head.tree.sha, tree });
  const commit = await api('/git/commits', 'POST', { message, tree: createdTree.sha, parents: [expectedHead] });
  await api('/git/refs/heads/main', 'PATCH', { sha: commit.sha, force: false });
  onProgress(uploads.length, uploads.length);
  return commit.sha;
}
