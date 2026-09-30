// Sitemap, brand colours and asset paths shared across the site.

/** `slug` is the page's URL path segment; Earth (id 0) lives at the site root. */
export type Page = { id: number; title: string; slug: string; color: string; rgb: string }

export const PAGES: Page[] = [
  { id: 0, title: 'Earth',           slug: 'earth',           color: '#d94040', rgb: '217,64,64'  },
  { id: 1, title: 'Missions',        slug: 'missions',        color: '#33a6d9', rgb: '51,166,217' },
  { id: 2, title: 'Systems',         slug: 'systems',         color: '#4dcc66', rgb: '77,204,102' },
  { id: 3, title: 'Engineering',     slug: 'engineering',     color: '#e5b226', rgb: '229,178,38' },
  { id: 4, title: 'Access to Space', slug: 'access-to-space', color: '#a855f7', rgb: '168,85,247' },
  { id: 5, title: 'Ecosystem',       slug: 'ecosystem',       color: '#f97316', rgb: '249,115,22' },
  { id: 6, title: 'Insights',        slug: 'insights',        color: '#ec4899', rgb: '236,72,153' },
]

/** Brand blue. The only brand colour; shades live in index.css (--color-neo-blue-*). */
export const BLUE = '#55A6FF'

/** Primary blue (#55A6FF) as an "r,g,b" triplet for rgba(). */
export const SEL = '85,166,255'

/** Public asset folder (Figma exports). */
export const A = '/assets'
