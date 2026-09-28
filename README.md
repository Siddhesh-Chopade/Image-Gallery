# Gallery Pro — Premium Image Gallery, Editor & Creative Studio

A browser-first image gallery/editor upgraded with commercial-style creative tools.

## Included
- 1,200 local SVG gallery assets.
- 20 replaced gallery assets are original fan-style cartoon posters covering Shinchan-style, Doraemon-style, pocket-creature-inspired, and alien-hero-inspired themes.
- Horror/ghosts, devotional, animals, 3D and other themed collections.
- Pagination, search, sorting, favorites, recent images and local uploads.
- Premium editor: filters, crop ratios, frames, backgrounds, transforms and export.
- Advanced Lab:
  - AI background removal via `@imgly/background-removal` loaded on demand.
  - Background replacement.
  - Drawing, annotation and pixel redaction.
  - Smart text/image watermarks, opacity, size, position and tile mode.
  - HSL-style controls, hue, lightness, gamma/curves-style adjustment, sharpness/vignette controls and stickers.
  - Batch conversion and ZIP export.
  - PNG/JPG/WebP conversion and PDF creation in-browser.
  - Animated WebM slideshow and GIF export.
  - Meme/poster templates for story, YouTube, LinkedIn and quote cards.
  - Local albums, tags, descriptions, share JSON and iframe embed code.
  - Three.js 3D viewer, WebXR/AR capability detection and mouse parallax.
- Existing 3D Studio and Collage Maker retained.

## Run
Open `index.html` in a modern browser. Most features are client-side. Advanced AI, Three.js and encoder libraries are loaded from public CDNs when those tools are used.

For best results, run from a local HTTP server instead of `file://`, for example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/`.

## Cloud sync
The UI contains a connection-ready Supabase/Firebase settings area, but no fake backend is included. Add your own project credentials, authentication flow, database/storage rules and SDK integration before using it as a production cloud service.

## Copyright note
The 20 cartoon-themed replacement assets are original fan-style vector artwork inspired by the requested categories; they are not official promotional images. If you distribute the application commercially, replace them with artwork you own or have licensed.
