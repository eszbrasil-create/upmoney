import { useEffect, useRef } from 'react'

type AssistantDockProps = {
  open: boolean
  setOpen: (open: boolean) => void
  children: React.ReactNode
}

export function AssistantDock({ open, setOpen, children }: AssistantDockProps) {
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    // When opening, try to bring focus into the panel for keyboard users.
    const el = panelRef.current
    if (!el) return
    const timer = window.setTimeout(() => {
      el.focus()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [open])

  return (
    <>
      <button
        className={`assistant-overlay ${open ? 'open' : ''}`}
        onClick={() => setOpen(false)}
        aria-label="Fechar Upmoney IA"
      />

      <div className={`assistant-dock ${open ? 'open' : ''}`}>
        <button
          className="assistant-fab"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Fechar Upmoney IA' : 'Abrir Upmoney IA'}
          aria-expanded={open}
        >
          IA
        </button>

        <div
          className={`assistant-dock__panel ${open ? 'open' : ''}`}
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-label="Upmoney IA"
        >
          <div className="assistant-dock__panel-header">
            <span>Upmoney IA</span>
            <button className="btn small ghost" onClick={() => setOpen(false)}>
              Fechar
            </button>
          </div>
          <div className="assistant-dock__panel-body">{children}</div>
        </div>
      </div>
    </>
  )
}

