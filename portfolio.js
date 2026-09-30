import { validatePortfolio, projectCard } from './portfolio-core.mjs';
const grid = document.querySelector('#portfolio-grid');
if (grid) {
  fetch('portfolio.json', { cache: 'no-cache' }).then(response => {
    if (!response.ok) throw new Error('Portfolio unavailable');
    return response.json();
  }).then(validatePortfolio).then(data => {
    grid.innerHTML = data.projects.slice(0, 6).map(project => projectCard(project, document.documentElement.lang)).join('');
  }).catch(() => { /* Keep the crawlable original project when the network is unavailable. */ });
}
