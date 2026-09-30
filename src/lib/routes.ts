import { PAGES } from '../data/pages'

// URL <-> page mapping. Uses the History API directly; no router library.
// Paths are relative to Vite's `base` so a sub-path deploy still works.

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

const SITE_TITLE = 'NEO — Orbital Navigation'

/** Canonical path for a page. Earth is the site root. */
export function pathFor(id: number) {
  return id === 0 ? `${BASE}/` : `${BASE}/${PAGES[id].slug}`
}

/** Page id for a pathname, or null if it matches no page. */
export function pageFromPath(pathname: string): number | null {
  const rest = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname
  const slug = rest.replace(/^\/+|\/+$/g, '')
  if (slug === '') return 0
  const page = PAGES.find(p => p.slug === slug)
  return page ? page.id : null
}

export function titleFor(id: number) {
  return id === 0 ? SITE_TITLE : `${PAGES[id].title} — NEO`
}
