(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const sq = document.documentElement.lang === 'sq';
  const t = (en, al) => sq ? al : en;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if ('IntersectionObserver' in window) {
    document.documentElement.classList.add('js');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal, .philosophy h2').forEach((el) => observer.observe(el));
  }
  const menu = $('.menu-toggle'), mobileNav = $('#mobile-nav');
  const closeMenu = () => { menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', t('Open navigation', 'Hap menunë')); mobileNav.hidden = true; document.body.classList.remove('locked'); };
  menu.addEventListener('click', () => {
    const opened = menu.getAttribute('aria-expanded') === 'true';
    menu.setAttribute('aria-expanded', String(!opened)); menu.setAttribute('aria-label', opened ? t('Open navigation', 'Hap menunë') : t('Close navigation', 'Mbyll menunë'));
    mobileNav.hidden = opened; document.body.classList.toggle('locked', !opened);
  });
  mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { if (!mobileNav.hidden) { closeMenu(); menu.focus(); } } });
  window.matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
  const hero = $('.hero'), heroImg = $('.hero-image'), progress = $('.progress');
  let framePending = false;
  const updateScroll = () => {
    const y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    if (!reduced.matches && y < hero.offsetHeight + window.innerHeight) heroImg.style.translate = `0 ${Math.min(y * 0.17, 180)}px`;
    framePending = false;
  };
  window.addEventListener('scroll', () => { if (!framePending) { framePending = true; requestAnimationFrame(updateScroll); } }, { passive: true });
  window.addEventListener('resize', updateScroll); updateScroll();
  const cover = $('#project-open'), cursor = $('.cursor');
  cover.addEventListener('pointerenter', () => cursor.classList.add('active'));
  cover.addEventListener('pointerleave', () => cursor.classList.remove('active'));
  cover.addEventListener('pointermove', event => { cursor.style.left = `${event.clientX}px`; cursor.style.top = `${event.clientY}px`; });
  const dialog = $('#project-dialog');
  cover.addEventListener('click', () => { dialog.showModal(); document.body.classList.add('locked'); cursor.classList.remove('active'); });
  $('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { document.body.classList.remove('locked'); cover.focus(); });
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  const pricing = { technical: { name: 'Technical plans', low: 5, high: 5, from: true }, interior: { name: 'Interior design', low: 15, high: 20, from: false }, renovation: { name: 'Turnkey renovation', low: 190, high: 190, from: true } };
  const area = $('#area'), service = $('#package'), output = $('#estimate-output'), description = $('#estimate-description');
  const euro = value => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  let currentEstimate = '';
  const calculate = () => {
    if (!area.validity.valid || !area.value || !Number.isFinite(Number(area.value))) { output.textContent = t('Enter a valid area', 'Vendosni një sipërfaqe të vlefshme'); description.textContent = t('Use a whole number between 1 and 100,000 m².', 'Përdorni numër të plotë nga 1 deri në 100,000 m².'); currentEstimate = ''; return; }
    const size = Number(area.value), rate = pricing[service.value];
    currentEstimate = rate.low === rate.high ? `${rate.from ? t('From ', 'Nga ') : ''}${euro(size * rate.low)}` : `${euro(size * rate.low)}–${euro(size * rate.high)}`;
    output.textContent = currentEstimate;
    description.textContent = `${size.toLocaleString('en-IE')} m² × €${rate.low}${rate.low !== rate.high ? `–${rate.high}` : ''}/m²`;
  };
  area.addEventListener('input', calculate); service.addEventListener('change', calculate);
  document.querySelectorAll('[data-package]').forEach(link => link.addEventListener('click', () => { service.value = link.dataset.package; calculate(); }));
  $('#estimate-form').addEventListener('submit', event => {
    event.preventDefault(); calculate(); if (!currentEstimate) return;
    const names = { technical: 'projektin teknik', interior: 'projektimin e interiorit', renovation: 'rikonstruksionin' };
    const message = sq ? `Përshëndetje Celestia, dua të diskutoj ${names[service.value]} për ${area.value} m². Vlerësimi në website është ${currentEstimate}. Mund të flasim për shërbimin dhe ofertën?` : `Hello Celestia, I would like to discuss ${pricing[service.value].name.toLowerCase()} for a ${area.value} m² space. The website estimate is ${currentEstimate}. Could we discuss the scope and a tailored proposal?`;
    window.open(`https://wa.me/355692787302?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  });
  calculate(); $('#year').textContent = String(new Date().getFullYear());
})();
