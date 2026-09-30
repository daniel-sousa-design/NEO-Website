# NEO — orbital navigation site

React 19 + TypeScript + Vite 8 + Tailwind CSS v4. Runs entirely locally; no
Figma Make platform dependency.

## Toolchain

Versions are pinned in `.mise.toml` (Node 22, pnpm 10.34.6) and managed by
[mise](https://mise.jdx.dev). With mise activated in the shell, `node` and
`pnpm` resolve automatically inside this directory.

```bash
pnpm install
pnpm dev         # http://localhost:5173 (opens a browser)
pnpm build       # production build → dist/
pnpm preview     # serve dist/ at http://localhost:4173
pnpm typecheck   # tsc --noEmit
pnpm check       # typecheck + build
pnpm format      # oxfmt
```

There is **no** always-running dev server — start one with `pnpm dev`.

## Project structure

Canonical layout. Start with task-relevant files; only follow imports or inspect
other files when required, or when the repo contradicts this guide.

- `src/main.tsx` — entry; imports `src/index.css`, mounts `src/App.tsx` into `#root`
- `src/App.tsx` — page switching, transition overlay, orbital navs
- `src/index.css` — Tailwind import, all `@font-face` rules, global styles
- `src/data/pages.ts` — sitemap (7 pages), per-page colour, asset path constant
- `src/lib/fonts.ts` — font-family name constants (must match `index.css` exactly)
- `src/lib/motion.ts` — `lerp` / `ease` helpers
- `src/hooks/useIntroAnimation.ts` — line → logo → pill → hero intro sequence
- `src/components/` — `OrbitalNav` (orbital card ladder), `RingCursor`, `PageNav`,
  `GlobalNav`, `TransitionOverlay`, `TypedText`, `StaggeredText`
- `src/pages/` — `EarthPage`, `MissionsPage`, `SystemsPage`, `PlaceholderPage`
- `src/imports/` — reference screenshots from design. Not imported by any code.
- `public/assets/` — Figma-exported images and SVGs
- `public/fonts/` — all web fonts, self-hosted
- `index.html` — document shell: title, meta, robots, font preloads
- `vite.config.ts` — plain Vite config (React, Tailwind, `@` → `src` alias)

## Styling

Tailwind CSS v4 via the `@tailwindcss/vite` plugin. `src/index.css` starts with
`@import 'tailwindcss';` — this must stay the first statement, as CSS requires
all `@import` rules before other rules. No `tailwind.config.js` or PostCSS
config is needed; theme tokens live in the `@theme` block in `index.css`.

Much of the styling is inline `style={{...}}` objects rather than utility
classes, because the animation code interpolates numeric values per frame.
Follow the existing pattern in the file you are editing.

## Fonts — read before touching

Font families use a `Family:Style` naming convention inherited from the Figma
export (e.g. `'FAIRE Sprig Sans Trial:Medium'`). The names in `src/lib/fonts.ts`
and in inline styles must match the `@font-face` declarations in
`src/index.css` **character for character** — a mismatch fails silently to the
Inter fallback rather than erroring.

All faces are self-hosted from `public/fonts/`; the app makes no external
network requests at runtime. Inter and Bitcount Single are variable fonts
(OFL-licensed, latin + latin-ext subsets). Bitcount's custom `CRSV` / `ELSH` /
`ELXP` axes are only reachable via `font-variation-settings` — see
`SystemsPage.tsx`.

**FAIRE Sprig Sans is a TRIAL licence.** A commercial licence is required
before this site goes to production.

## Animation

No animation library. Sequencing is hand-rolled with `setTimeout` phase
machines (`useIntroAnimation`) and `requestAnimationFrame` loops driving
`useState` (`App.revealPage`, `OrbitalNav`). When adding motion, match the
surrounding approach unless the task is explicitly to introduce a library.

## Conventions

- Vite 8 bundles with **rolldown**, not Rollup. `build.rollupOptions.output.manualChunks`
  must be a *function*; the Rollup object form is rejected at build time.
- The site is `noindex` in both `index.html` and `public/robots.txt` while
  unreleased. Remove both together when going public.
- `.figma/` holds the original Figma Make scripts. Nothing in the build reads
  them any more; they are kept only as a path back to that platform.
