import fs from 'node:fs';
const css = fs.readFileSync(new URL('./styles.css', import.meta.url), 'utf8');
for (const name of ['index.html', 'en.html', 'shqip.html']) {
  const file = new URL(name, import.meta.url);
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('<style id="site-styles">')) throw new Error(`Missing embedded styles in ${name}`);
  fs.writeFileSync(file, html.replace(/<style id="site-styles">[\s\S]*?<\/style>/, () => `<style id="site-styles">${css}</style>`));
}
