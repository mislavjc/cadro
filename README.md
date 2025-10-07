## Cadro

Add clean borders to images. Drag, adjust, and export crisp PNGs.

![Open Graph preview](public/og.png)

### Tech

- Next.js 15
- React 19
- Tailwind CSS 4

### Quick start

```bash
pnpm install
pnpm dev
```

Visit `http://localhost:3000`.

### Exporting your image

1. Drop an image onto the stage or use the file picker.
2. Adjust border values using the controls.
3. Click Export to download the bordered PNG.

### Open Graph (social) image

The OG image route is implemented in `app/opengraph-image.tsx` and composes:

- The Cadro logo + title set in Geist
- A screenshot at the bottom that is clipped only on the bottom edge to preserve its aspect ratio

The screenshot source is `public/og.png`. Generate it from the real UI with Playwright:

```bash
# one-time if you don't have it yet
pnpm add -D playwright

# boot dev, load a sample photo, and capture the OG screenshot
pnpm og:capture
```

The script in `scripts/capture-og.ts` will:

- Ensure a dev server is running
- Load `public/dummy.jpg` into the app
- Capture `[data-og-paper]` (the whole stage) to `public/og.png`

Preview the final OG composition at:

```
/opengraph-image
```

Notes:

- The OG route runs on the Edge runtime and fetches Geist from Google Fonts at render time. If your environment blocks external requests, vendor a `.woff2` locally and register it in `ImageResponse`.
- If you tweak the layout, keep multi-child containers explicitly `display: 'flex'` to satisfy the Satori renderer.

### Scripts

```bash
pnpm dev        # run the app locally
pnpm build      # production build
pnpm start      # start the built app
pnpm lint       # check lint
pnpm lint:fix   # fix lint
pnpm og:capture # regenerate public/og.png via Playwright
```

### Project structure

- `app/` — Next.js app routes and OG image
- `components/` — UI components
- `lib/` — shared types and utilities
- `public/` — static assets (includes `og.png`)
- `scripts/` — automation, including OG capture
