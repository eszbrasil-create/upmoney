import { useEffect, useRef, useState } from 'react'
import {
  EVOLUTION_ACTIVE_YEAR_STORAGE_KEY,
  EVOLUTION_MONTHS,
  clampEvolutionYear,
  createEvolutionStorageRow,
  notifyEvolutionDataChanged,
  parsePtBrNumber,
  readEvolutionVisibleMonthsForYear,
  readEvolutionRowsForYear,
  sanitizeCurrencyLike,
  writeEvolutionVisibleMonthsForYear,
  writeEvolutionRowsForYear,
  type EvolutionMonthKey,
  type EvolutionStorageRow,
} from '../lib/evolutionAssets'

type AssetMonthRow = EvolutionStorageRow

const createEmptyRow = (): AssetMonthRow => createEvolutionStorageRow()
const MONTH_FIELDS = EVOLUTION_MONTHS.map((month) => month.key)
const MONTH_LABELS = Object.fromEntries(
  EVOLUTION_MONTHS.map((month) => [month.key, month.label])
) as Record<(typeof MONTH_FIELDS)[number], string>

export function EvolutionAssetsPage() {
  const [selectedYear] = useState(() => {
    if (typeof window === 'undefined') return new Date().getFullYear()
    const raw = Number(window.localStorage.getItem(EVOLUTION_ACTIVE_YEAR_STORAGE_KEY))
    return clampEvolutionYear(raw)
  })
  const [rows, setRows] = useState<AssetMonthRow[]>(() => {
    if (typeof window === 'undefined') return [createEmptyRow()]
    const parsed = readEvolutionRowsForYear(window.localStorage, selectedYear)
    return parsed.length ? parsed : [createEmptyRow()]
  })
  const [visibleMonths, setVisibleMonths] = useState<EvolutionMonthKey[]>(() => {
    if (typeof window === 'undefined') return []
    return readEvolutionVisibleMonthsForYear(window.localStorage, selectedYear)
  })
  const [isEditingEnabled, setIsEditingEnabled] = useState(false)
  const loadedYearRef = useRef(selectedYear)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const parsed = readEvolutionRowsForYear(window.localStorage, selectedYear)
    const visible = readEvolutionVisibleMonthsForYear(window.localStorage, selectedYear)
    loadedYearRef.current = selectedYear
    setVisibleMonths(visible)
    setRows(parsed.length ? parsed : [createEmptyRow()])
  }, [selectedYear])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (loadedYearRef.current !== selectedYear) return
    window.localStorage.setItem(EVOLUTION_ACTIVE_YEAR_STORAGE_KEY, String(selectedYear))
    writeEvolutionRowsForYear(window.localStorage, selectedYear, rows)
    notifyEvolutionDataChanged(selectedYear)
  }, [rows, selectedYear])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (loadedYearRef.current !== selectedYear) return
    writeEvolutionVisibleMonthsForYear(window.localStorage, selectedYear, visibleMonths)
    notifyEvolutionDataChanged(selectedYear)
  }, [visibleMonths, selectedYear])

  const updateRow = (
    id: string,
    field: keyof Pick<
      AssetMonthRow,
      'name' | 'jan' | 'fev' | 'mar' | 'abr' | 'mai' | 'jun' | 'jul' | 'ago' | 'set' | 'out' | 'nov' | 'dez'
    >,
    value: string
  ) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]: field === 'name' ? value : sanitizeCurrencyLike(value),
            }
          : row
      )
    )
  }

  const removeRow = (id: string) => {
    setRows((prev) => {
      const next = prev.filter((row) => row.id !== id)
      return next.length ? next : [createEmptyRow()]
    })
  }

  const clearMonthColumn = (month: (typeof MONTH_FIELDS)[number]) => {
    const confirmed = window.confirm(
      `Excluir o período ${MONTH_LABELS[month]}/${selectedYear} da planilha e do gráfico?`
    )
    if (!confirmed) return

    setRows((prev) => {
      const next = prev.map((row) => ({
        ...row,
        [month]: '',
      }))

      if (typeof window !== 'undefined') {
        writeEvolutionRowsForYear(window.localStorage, selectedYear, next)
        notifyEvolutionDataChanged(selectedYear)
      }

      return next
    })

    setVisibleMonths((prev) => prev.filter((item) => item !== month))
  }

  const visibleMonthFields = MONTH_FIELDS.filter((month) => visibleMonths.includes(month))

  const totals = rows.reduce(
    (acc, row) => {
      MONTH_FIELDS.forEach((month) => {
        acc[month] += parsePtBrNumber(row[month])
      })
      return acc
    },
    {
      jan: 0,
      fev: 0,
      mar: 0,
      abr: 0,
      mai: 0,
      jun: 0,
      jul: 0,
      ago: 0,
      set: 0,
      out: 0,
      nov: 0,
      dez: 0,
    }
  )

  return (
    <section className="evolution-assets-page">
      <header className="evolution-assets-header">
        <div>
          <h1 className="title-lg">Evolução Patrimonial</h1>
          <p className="subtitle-md">
            Adicione ativos e preencha os valores por mês para acompanhar sua evolução.
          </p>
        </div>
        <div className="evolution-assets-actions">
          <button
            type="button"
            className={`btn small ${isEditingEnabled ? 'ghost' : ''}`.trim()}
            onClick={() => setIsEditingEnabled((prev) => !prev)}
          >
            {isEditingEnabled ? 'Bloquear edição' : 'Editar ativos'}
          </button>
        </div>
      </header>

      <article className="evolution-assets-card">
        <div className="evolution-assets-table-wrap">
          <table className="evolution-assets-table">
            <colgroup>
              <col className="evolution-col evolution-col--asset" />
              {visibleMonthFields.map((month) => (
                <col key={`col-${month}`} className="evolution-col evolution-col--month" />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th>Ativo</th>
                {visibleMonthFields.map((month) => (
                  <th key={month}>
                    <div className="evolution-month-header">
                      <span>{`${MONTH_LABELS[month]}/${selectedYear}`}</span>
                      <button
                        type="button"
                        className="evolution-month-header__delete"
                        onClick={() => clearMonthColumn(month)}
                        disabled={!isEditingEnabled}
                        aria-label={`Apagar coluna ${MONTH_LABELS[month]}/${selectedYear}`}
                        title={`Apagar ${MONTH_LABELS[month]}/${selectedYear}`}
                      >
                        🗑
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="evolution-asset-cell">
                      <input
                        className="evolution-input evolution-input--asset"
                        type="text"
                        value={row.name}
                        disabled={!isEditingEnabled}
                        onChange={(event) => updateRow(row.id, 'name', event.target.value)}
                        placeholder="Ex.: ITSA4"
                      />
                      <button
                        className="evolution-asset-delete"
                        type="button"
                        disabled={!isEditingEnabled}
                        onClick={() => removeRow(row.id)}
                        aria-label={`Excluir linha do ativo ${row.name || 'sem nome'}`}
                        title="Excluir linha"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                  {visibleMonthFields.map((month) => (
                    <td key={`${row.id}-${month}`}>
                      <input
                        className="evolution-input evolution-input--month"
                        type="text"
                        inputMode="decimal"
                        disabled={!isEditingEnabled}
                        value={row[month]}
                        onChange={(event) => updateRow(row.id, month, event.target.value)}
                        placeholder=""
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th>Total</th>
                {visibleMonthFields.map((month) => (
                  <th key={`total-${month}`}>
                    {totals[month].toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </th>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </article>
    </section>
  )
}
