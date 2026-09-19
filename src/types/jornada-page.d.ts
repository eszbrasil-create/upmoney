declare module './pages/JornadaPage.jsx' {
  import type { AppPage } from './app'
  import type { ComponentType } from 'react'

  export const JornadaPage: ComponentType<{
    onNavigate: (page: AppPage) => void
  }>
}
