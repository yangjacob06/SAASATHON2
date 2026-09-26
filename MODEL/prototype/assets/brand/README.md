# Mandate brand assets

Direction 02: **The right connection**. Open `index.html` here for a visual asset sheet.

| File | Use |
| --- | --- |
| `mandate-lockup.svg` | Primary logo: symbol + outlined wordmark |
| `mandate-lockup-reverse.svg` | Logo on dark teal |
| `mandate-wordmark.svg` | Outlined lettering only |
| `mandate-wordmark-reverse.svg` | Lettering on dark surfaces |
| `mandate-symbol.svg` | Standalone connected symbol |
| `mandate-app-icon.svg` | Square, scalable app artwork |
| `mandate-favicon.svg` | Simplified browser icon |
| `connections.svg` | Connected-line marketing illustration; labels live in accessible HTML |
| `brand.css` | Shared fonts, colours, component styling and theme variants |
| `brand-pdf.js` | Outlined logo for the existing local PDF renderer |

Keep a clear space of at least one quarter of the symbol's width. Minimum suggested sizes: full logo 120px wide, standalone symbol 24px, favicon 16px. Preserve proportions and colours. Use the reverse logo on dark backgrounds. Do not turn the mark into a lender approval seal.

Fonts are hosted locally. Their original source files and OFL licences are in `fonts/`; upstream sources are the Google Fonts `ofl/manrope` and `ofl/dmsans` directories. Web fonts are WOFF2 conversions of these sources. Logo lettering uses Manrope at weight 750 and is outlined in every SVG.

To regenerate logo and font assets, run `python tools/build-brand-assets.py` from the repository root with `fonttools` and `brotli` available. The website requires no Python packages at runtime.

Preview the marketing site with `node tools/preview.mjs` from the repository root, then open `http://127.0.0.1:4318`. The local preview includes the correct SVG and font MIME types. The saved workspace retains its existing server startup command.
