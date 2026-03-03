import type { AppPage } from '../types/app'

type SidebarProps = {
  activePage: AppPage
  open: boolean
  setOpen: (open: boolean) => void
  onNavigate: (page: AppPage) => void
  onSignOut: () => void
}

export function Sidebar({
  activePage,
  open,
  setOpen,
  onNavigate,
  onSignOut,
}: SidebarProps) {
  const handleNavigate = (page: AppPage) => {
    setOpen(false)
    onNavigate(page)
  }

  return (
    <>
      {open ? (
        <button
          className="sidebar-overlay open"
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Fechar menu"
        />
      ) : null}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <button className="sidebar-close" type="button" onClick={() => setOpen(false)}>
          Fechar
        </button>
        <div className="sidebar__brand">Upmoney</div>
        <nav className="sidebar__nav">
          <button
            className={`nav-btn ${activePage === 'dash' ? 'active' : ''}`}
            type="button"
            onClick={() => handleNavigate('dash')}
          >
            <span className="nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
              </svg>
            </span>
            Dash
          </button>

          <button
            className={`nav-btn ${activePage === 'courses' ? 'active' : ''}`}
            type="button"
            onClick={() => handleNavigate('courses')}
          >
            <span className="nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 6h14M5 12h14M5 18h8"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            Cursos
          </button>

          <button
            className={`nav-btn ${activePage === 'assets' ? 'active' : ''}`}
            type="button"
            onClick={() => handleNavigate('assets')}
          >
            <span className="nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 14l4-4 4 4 6-6"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 8h4v4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            Investimentos
          </button>

          <button
            className={`nav-btn ${activePage === 'expenses' ? 'active' : ''}`}
            type="button"
            onClick={() => handleNavigate('expenses')}
          >
            <span className="nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 5h14v4H5zM7 13h10M7 17h7"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            Despesas
          </button>

          <button
            className={`nav-btn ${activePage === 'wallets' ? 'active' : ''}`}
            type="button"
            onClick={() => handleNavigate('wallets')}
          >
            <span className="nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 7h16M6 7v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <path
                  d="M9 11h6"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            Carteiras
          </button>

          <button
            className={`nav-btn ${activePage === 'simulator' ? 'active' : ''}`}
            type="button"
            onClick={() => handleNavigate('simulator')}
          >
            <span className="nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 12h7m-7 4h11M4 8h16"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <circle
                  cx="16"
                  cy="12"
                  r="3.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
              </svg>
            </span>
            Simulador
          </button>
        </nav>

        <button className="nav-btn logout" type="button" onClick={onSignOut}>
          <span className="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M9 4h6a2 2 0 0 1 2 2v4M17 14v4a2 2 0 0 1-2 2H9"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M13 12H4m0 0l3-3m-3 3l3 3"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          Sair
        </button>
      </aside>
    </>
  )
}
