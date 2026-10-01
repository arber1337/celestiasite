# Celestia Architects

Responsive static architecture-studio website hosted on GitHub Pages.

Live: https://arber1337.github.io/celestiasite/

## Pages
- English landing: index.html
- Albanian landing: shqip.html
- Albanian service guides: interior-design-tirane.html, projektim-vilash.html, rikonstruksion-apartamenti.html, leje-ndertimi-rikonstruksioni.html
- Terms and Privacy: terms.html, privacy.html
- Sitemap: sitemap.xml
- Custom error page: 404.html

## Running locally
Run `python3 -m http.server 8000` in this directory, then visit http://localhost:8000.
No build step or runtime dependencies. GitHub Pages publishes main, repository root.

## Vercel deployment
Import `arber1337/celestiasite` with the repository root as the root directory and `main` as the production branch. `vercel.json` configures this as a static site: no installation, no build command, and output from the repository root. Existing `.html` URLs are preserved.

Vercel publication is pending account connection. After Vercel assigns the production domain, update all canonical URLs, hreflang URLs, Open Graph URLs, JSON-LD URLs, sitemap entries and `BASE` in `portfolio-core.mjs` together. Add a root `robots.txt` pointing to that production sitemap. Keep GitHub integration enabled so the owner panel's commits deploy automatically. Verify the production URL, image assets, price calculator, portfolio pages and owner panel before announcing the new site as live.

## Maintenance
Keep fees, contact information, scope and legal text current. Update canonical URLs, hreflang, JSON-LD, navigation and sitemap together if moving to a custom domain. Submit the full sitemap URL in Google Search Console; a sitemap is a discovery aid and does not guarantee indexing or ranking. Project-site robots.txt cannot control crawling for the host origin.

The displayed architecture and interior imagery was supplied by the studio on 1 October 2026 and is credited to Celestia Architects. All ten supplied images are included in three portfolio presentations: the four-villa development, the warm neutral interior and the classic-inspired kitchen. Tirana, Durrës and Vlorë describe the portfolio collectively; individual city assignments and project years have not been invented. Older unreferenced image assets remain in repository history.

Google Fonts are self-hosted; see font-licenses.txt for OFL notices. Displayed images use local responsive WebP variants. No third-party analytics, advertising pixels or backend form is installed. WhatsApp opens a draft message; sending is controlled by the visitor.

## Calculator — updated 30 September 2026
Interior design uses €20/m² for the entire area below 100 m² and €15/m² for the entire area at or above 100 m². Exactly 100 m² is €1,500. Technical plans remain from €5/m² and renovation from €190/m². Decimal areas up to two places are supported.

## Owner portfolio panel
Open https://arber1337.github.io/celestiasite/admin.html.
The panel supports multiple images, a chosen cover, English and optional Albanian text, location, project year, category, implementation status, execution year and implementation notes. Existing projects can be edited. Current project entries use Albania as their individual location until the owner specifies the exact city. Project and execution years remain unspecified.

For online publishing, the owner `arber1337` connects a fine-grained GitHub personal access token scoped only to `celestiasite`, with repository Contents read/write permission. Instructions are in the panel. The token is kept only in page memory and used solely with api.github.com; never commit it or share it in chat. The visitor-facing website has no publishing credentials. GitHub enforces repository write permissions.

Images are decoded and optimized to local 1600px/640px variants before publication (JPG/PNG/WebP, up to 12 images per project). One Git commit updates images, portfolio.json and the server-rendered portfolio.html / portfolio-sq.html pages. GitHub Pages then deploys main. The public landing loads the latest portfolio.json with cache revalidation while retaining its original card as a network fallback. A non-force branch update prevents overwriting a concurrent repository edit. If the branch changes, reconnect before publishing the retained draft.

Save draft on device uses IndexedDB for metadata and optimized image blobs. It does not publish or store the connection token. Refreshing or disconnecting requires reconnecting to publish. Published projects are public. Old image files are retained in git rather than permanently removed by the editor.
