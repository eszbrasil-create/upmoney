import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (relativePath: string) =>
  readFileSync(join(process.cwd(), relativePath), 'utf8')

describe('responsive guards', () => {
  it('keeps Expenses mobile layout active up to tablet width', () => {
    const expensesPage = read('src/pages/Expenses.tsx')
    expect(expensesPage).toContain("const MOBILE_EXPENSES_MEDIA_QUERY = '(max-width: 1024px)'")
  })

  it('renders mobile quick navigation tabs in App', () => {
    const app = read('src/App.tsx')
    expect(app).toContain('className="mobile-tabs"')
    expect(app).toContain('Dash')
    expect(app).toContain('Cursos')
    expect(app).toContain('Ativos')
    expect(app).toContain('Despesas')
    expect(app).toContain('Menu')
  })

  it('defines tablet responsive layer for critical sections', () => {
    const css = read('src/App.css')
    expect(css).toContain('@media (max-width: 1024px)')
    expect(css).toContain('.dash-panels')
    expect(css).toContain('.simulator-grid')
    expect(css).toContain('.asset-table__header,')
    expect(css).toContain('min-width: 900px;')
  })

  it('keeps small-mobile override to avoid min-width regressions', () => {
    const css = read('src/App.css')
    expect(css).toContain('@media (max-width: 720px)')
    expect(css).toContain('.flow-drilldown__grid')
    expect(css).toContain('min-width: 0;')
  })
})
