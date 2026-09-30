# NEO — orbital navigation site

React 19 + TypeScript + Vite + Tailwind CSS v4.

```bash
pnpm install   # or npm install
pnpm dev       # local dev server
pnpm build     # production build → dist/
```

## Structure

```
src/
  main.tsx                 entry — mounts <App/>, imports index.css
  App.tsx                  page switching, transitions, opening/closing orbital navs
  index.css                Tailwind import, @font-face rules, globals
  data/pages.ts            sitemap (7 pages), primary blue, asset path
  lib/fonts.ts             font-family names
  lib/motion.ts            lerp / ease helpers
  hooks/useIntroAnimation  nav → logo → pill → hero intro sequence
  components/
    OrbitalNav.tsx         orbital card ladder — `closing` (page bottom) and `opening` (scroll up at top)
    RingCursor.tsx         outline (loading) / filled (orbiting) ring cursors
    PageNav.tsx            sticky glass page nav with logo + page pill
    GlobalNav.tsx, TransitionOverlay.tsx, TypedText.tsx, StaggeredText.tsx
  pages/                   Earth, Missions, Systems, Placeholder
public/
  assets/                  Figma exports (images/SVGs)
  fonts/                   FAIRE Sprig Sans Trial woff2 files
```

## Moving off Figma Make

`vite.config.ts` includes Figma Make–specific plugins and reads `.figma/make/site.json`.
On another platform, replace it with:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})
```

The `.figma/` folder and `src/imports/` (reference screenshots) are not needed at runtime.
The FAIRE Sprig Sans fonts are **trial** licences, so get a commercial licence before going to production.
