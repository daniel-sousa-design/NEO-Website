import { createContext, useContext } from 'react'

// ─── Navigation context ───────────────────────────────────────────────────────
// App provides the current page and its transition-aware navigate(), so deep
// components (the page nav's pill row) can switch pages without prop drilling.

export type Navigation = { current: number; navigate: (id: number) => void }

export const NavigationContext = createContext<Navigation>({ current: 0, navigate: () => {} })

export const useNavigation = () => useContext(NavigationContext)

/** Fired (on window) to summon the opening orbital nav overlay — the nav bar's
 *  orbital loader button. OrbitalNav (opening mode) listens. */
export const OPEN_ORBIT_EVENT = 'neo:open-orbit'
