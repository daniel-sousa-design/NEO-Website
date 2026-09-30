import { PAGES } from '../data/pages'

// ─── Global top nav ───────────────────────────────────────────────────────────

export function GlobalNav({ currentPage, onNavigate, visible }: { currentPage: number; onNavigate: (id: number) => void; visible: boolean }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8"
      style={{
        height: 56,
        background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,.06)',
        transform: visible ? 'translateY(0)' : 'translateY(-110%)',
        transition: 'transform .5s cubic-bezier(.4,0,.2,1)',
      }}>
      <div className="flex items-center gap-2">
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: PAGES[currentPage].color, boxShadow: `0 0 8px ${PAGES[currentPage].color}`, transition: 'all .4s' }} />
        <span style={{ color: 'rgba(255,255,255,.45)', fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', fontWeight: 500 }}>NEO</span>
      </div>
      <nav className="flex items-center gap-5">
        {PAGES.map((page, i) => {
          const active = i === currentPage
          return (
            <button key={page.id} onClick={() => onNavigate(page.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: active ? 1 : .35, transition: 'opacity .3s', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}>
              <div style={{ width: active ? 20 : 5, height: 2, borderRadius: 2, background: active ? page.color : 'rgba(255,255,255,.5)', transition: 'all .4s cubic-bezier(.4,0,.2,1)' }} />
              {active && <span style={{ color: page.color, fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase' }}>{page.title}</span>}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
