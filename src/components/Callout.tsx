import type { ReactNode } from 'react'

type CalloutTipo = 'ideia'

type CalloutProps = {
  tipo: CalloutTipo
  children: ReactNode
}

export function Callout({ tipo, children }: CalloutProps) {
  return (
    <aside className={`callout callout--${tipo}`}>
      <div className="callout__title">Ideia central</div>
      <div className="callout__body">{children}</div>
    </aside>
  )
}

