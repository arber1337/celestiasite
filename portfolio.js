const grid = document.getElementById('portfolio-grid');
async function loadPortfolio() {
  try {
    const { validatePortfolio, projectCard } = await import('./portfolio-core.mjs');
    const response = await fetch('portfolio.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error('Portfolio unavailable');
    const data = validatePortfolio(await response.json());
    grid.innerHTML = data.projects.slice(0, 6).map(project => projectCard(project, document.documentElement.lang)).join('');
  } catch { /* The original, crawlable project cards remain usable offline. */ }
}
if (grid) {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); loadPortfolio(); }
    }, { rootMargin: '500px' });
    observer.observe(grid);
  } else loadPortfolio();
}
