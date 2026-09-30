# NEO — orbital navigation site

React 19 + TypeScript + Vite 8 + Tailwind CSS v4.

An interactive, scroll-driven orbital navigation system across a 7-page sitemap.

## Getting started

The toolchain is pinned in `.mise.toml` (Node 22, pnpm 10.34.6). With
[mise](https://mise.jdx.dev) installed and activated, the right `node` and
`pnpm` are selected automatically when you `cd` into this directory:

```bash
mise install     # first time only — installs the pinned Node + pnpm
pnpm install
pnpm dev         # → http://localhost:5173
```

Other scripts:

| command | what it does |
| --- | --- |
| `pnpm build` | production build → `dist/` |
| `pnpm preview` | serve the built `dist/` at `http://localhost:4173` |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm check` | typecheck, then build |
| `pnpm format` | format with oxfmt |

To build for a sub-path deploy (GitHub Pages and similar):

```bash
BASE_URL=/NEO-Website/ pnpm build
```

## Branches

- **`main`** — released/stable. Don't commit here directly.
- **`dev`** — day-to-day work. This is the branch to be on.

```bash
git switch dev
# ...work...
git add -A && git commit -m "..."
git push
```

When a batch of work is ready, promote it to `main`:

```bash
git switch main
git merge dev        # fast-forward if main hasn't moved
git push
git switch dev       # go back to working
```

If `main` has moved on independently, `git merge dev` creates a merge commit
instead of fast-forwarding — that's fine and expected.

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
  imports/                 design reference screenshots (not used at runtime)
public/
  assets/                  Figma exports (images/SVGs)
  fonts/                   all web fonts, self-hosted
  robots.txt               Disallow while unreleased
```

## Fonts

Every face is served from `public/fonts/`, so the site has **no external
network dependency** at runtime and works fully offline.

| family | source | licence |
| --- | --- | --- |
| Inter (variable, 300–700) | Google Fonts | OFL |
| Bitcount Single (variable) | Google Fonts | OFL |
| FAIRE Sprig Sans / Sans Mono | trial download | **Trial — see below** |

Inter and Bitcount are subset to latin + latin-ext. Bitcount Single carries the
custom `CRSV`, `ELSH` and `ELXP` axes used by `SystemsPage.tsx`, reachable only
through `font-variation-settings`.

> [!IMPORTANT]
> **FAIRE Sprig Sans is a trial licence.** Buy a commercial licence before this
> site goes to production.

Family names follow a `Family:Style` convention from the Figma export. They must
match between `src/lib/fonts.ts` and the `@font-face` blocks in `src/index.css`
exactly — a mismatch silently falls back to Inter instead of erroring.

## Search indexing

The site is marked `noindex` in two places while unreleased: the `robots` meta
tag in `index.html` and `public/robots.txt`. Remove both together when going
public.

## Relationship to Figma Make

This project began as a Figma Make export and has been fully decoupled from it:

- `vite.config.ts` is a plain Vite config — the four Figma Make plugins
  (site-config injection, error-overlay replay, refresh-boundary fallback, and
  the component-kit route) are gone.
- Document metadata that the site-config plugin used to inject from
  `.figma/make/site.json` now lives directly in `index.html`, and its
  `robots.txt` behaviour moved to `public/robots.txt`.
- The Bitcount font, previously loaded from `static.figma.com`, is self-hosted.

`.figma/` is retained only as a path back to that platform; nothing in the build
reads it. It can be deleted with no effect on the site.
