// Sitemap, brand colours and asset paths shared across the site.

export type Page = { id: number; title: string; color: string; rgb: string }

export const PAGES: Page[] = [
  { id: 0, title: 'Earth',           color: '#d94040', rgb: '217,64,64'  },
  { id: 1, title: 'Missions',        color: '#33a6d9', rgb: '51,166,217' },
  { id: 2, title: 'Systems',         color: '#4dcc66', rgb: '77,204,102' },
  { id: 3, title: 'Engineering',     color: '#e5b226', rgb: '229,178,38' },
  { id: 4, title: 'Access to Space', color: '#a855f7', rgb: '168,85,247' },
  { id: 5, title: 'Ecosystem',       color: '#f97316', rgb: '249,115,22' },
  { id: 6, title: 'Insights',        color: '#ec4899', rgb: '236,72,153' },
]

/** Primary blue (#55A6FF) as an "r,g,b" triplet for rgba(). */
export const SEL = '85,166,255'

/** Public asset folder (Figma exports). */
export const A = '/assets'
