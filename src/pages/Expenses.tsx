import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { supabase, supabaseConfigMissing } from '../lib/supabaseClient'
import { notifyExpensesSheetChanged } from '../lib/expensesSheetEvents'

type RowData = {
  id: string
  label: string
  type: 'income' | 'expense'
  values: string[]
  order: number
}

const MONTHS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

const MOBILE_EXPENSES_MEDIA_QUERY = '(max-width: 1024px)'

const getIsMobileExpensesLayout = () =>
  typeof window !== 'undefined' && window.matchMedia(MOBILE_EXPENSES_MEDIA_QUERY).matches

const createRow = (label: string, type: RowData['type'], order: number): RowData => ({
  id: `${(label || type).toLowerCase()}-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`,
  label,
  type,
  values: Array.from({ length: MONTHS.length }, () => ''),
  order,
})

const sanitizeValueInput = (value: string) => {
  const trimmed = value.trim()
  if (trimmed.startsWith('=') || trimmed.includes('+')) {
    return value.replace(/[^0-9.,+=\s]/g, '')
  }
  const cleaned = value.replace(/[^0-9.,]/g, '')
  if (!cleaned) return ''
  if (cleaned.includes(',')) {
    const [intPart, ...rest] = cleaned.split(',')
    const integer = intPart.replace(/[.,]/g, '')
    const decimal = rest.join('').replace(/[.,]/g, '')
    if (decimal.length > 0) return `${integer},${decimal}`
    return cleaned.trim().endsWith(',') ? `${integer},` : integer
  }
  const [intPart, ...rest] = cleaned.split('.')
  const integer = intPart.replace(/[.,]/g, '')
  const decimal = rest.join('').replace(/[.,]/g, '')
  if (decimal.length > 0) return `${integer}.${decimal}`
  return cleaned.trim().endsWith('.') ? `${integer}.` : integer
}

const parseSingleNumber = (value: string) => {
  if (!value) return 0
  const cleaned = value.replace(/[^0-9.,]/g, '')
  if (!cleaned) return 0
  let normalized = ''
  if (cleaned.includes(',')) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.')
  } else {
    const [intPart, ...rest] = cleaned.split('.')
    const integer = intPart.replace(/[.,]/g, '')
    const decimal = rest.join('').replace(/[.,]/g, '')
    normalized = decimal.length > 0 ? `${integer}.${decimal}` : integer
  }
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

const parseFormulaSum = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return null
  const expression = trimmed.startsWith('=') ? trimmed.slice(1).trim() : trimmed
  if (!expression.includes('+')) return null

  const parts = expression
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length < 2) return null

  let sum = 0
  for (const part of parts) {
    if (!/[0-9]/.test(part)) {
      return null
    }
    sum += parseSingleNumber(part)
  }
  return Number.isFinite(sum) ? sum : null
}

const parseValue = (value: string) => {
  const formulaResult = parseFormulaSum(value)
  if (formulaResult != null) return formulaResult
  return parseSingleNumber(value)
}

type ExpensesPageProps = {
  onOpenMenu?: () => void
}

export function ExpensesPage({ onOpenMenu }: ExpensesPageProps) {
  const buildDefaultRows = () => {
    const incomeRows = Array.from({ length: 2 }, (_, index) =>
      createRow('', 'income', index + 1)
    )
    const expenseRows = Array.from({ length: 7 }, (_, index) =>
      createRow('', 'expense', incomeRows.length + index + 1)
    )
    return [...incomeRows, ...expenseRows]
  }
  const currentYear = new Date().getFullYear()
  const currentMonthIndex = new Date().getMonth()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(currentMonthIndex)
  const [rows, setRows] = useState<RowData[]>(buildDefaultRows())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [dirtyRowIds, setDirtyRowIds] = useState<Set<string>>(new Set())
  const [showTitheRow, setShowTitheRow] = useState(true)
  const saveTimerRef = useRef<number | null>(null)
  const skipNextSaveRef = useRef(true)
  const focusRowIdRef = useRef<string | null>(null)
  const latestRowsRef = useRef<RowData[]>(rows)
  const latestSelectedYearRef = useRef(selectedYear)
  const latestDirtyCountRef = useRef(0)
  const [isMobileLayout, setIsMobileLayout] = useState(getIsMobileExpensesLayout)

  const totals = useMemo(() => {
    const incomeTotalsByMonth = Array.from({ length: MONTHS.length }, () => 0)
    const expenseTotalsByMonth = Array.from({ length: MONTHS.length }, () => 0)

    rows.forEach((row) => {
      row.values.forEach((value, index) => {
        const parsed = parseValue(value)
        if (row.type === 'income') {
          incomeTotalsByMonth[index] += parsed
        } else {
          expenseTotalsByMonth[index] += parsed
        }
      })
    })

    const incomeTotal = incomeTotalsByMonth.reduce((sum, value) => sum + value, 0)
    const expenseTotal = expenseTotalsByMonth.reduce((sum, value) => sum + value, 0)

    return { incomeTotalsByMonth, expenseTotalsByMonth, incomeTotal, expenseTotal }
  }, [rows])

  const formatPercent = (expense: number, income: number) => {
    if (income <= 0) {
      return expense > 0 ? '—' : '0%'
    }
    return `${Math.round((expense / income) * 100)}%`
  }

  const percentClassName = (expense: number, income: number) => {
    if (income <= 0) return ''
    const pct = (expense / income) * 100
    if (pct > 100) return 'pct-over'
    if (pct < 80) return 'pct-good'
    return 'pct-warn'
  }

  const formatBRL = useMemo(
    () =>
      new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  )

  const setCellValue = (rowId: string, monthIndex: number, value: string) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row
        const nextValues = [...row.values]
        nextValues[monthIndex] = value
        return { ...row, values: nextValues }
      })
    )
  }

  const markRowDirty = (rowId: string) => {
    setDirtyRowIds((prev) => {
      if (prev.has(rowId)) return prev
      const next = new Set(prev)
      next.add(rowId)
      return next
    })
  }

  const updateCell = (rowId: string, monthIndex: number, value: string) => {
    setCellValue(rowId, monthIndex, sanitizeValueInput(value))
    markRowDirty(rowId)
  }

  const formatCellOnBlur = (rowId: string, monthIndex: number, value: string) => {
    if (!value.trim()) {
      setCellValue(rowId, monthIndex, '')
      return
    }
    const trimmed = value.trim()
    if (trimmed.startsWith('=') || trimmed.includes('+')) {
      const formulaResult = parseFormulaSum(value)
      if (formulaResult == null) {
        return
      }
      setCellValue(rowId, monthIndex, formatBRL.format(formulaResult))
      markRowDirty(rowId)
      return
    }
    const parsed = parseValue(value)
    if (!Number.isFinite(parsed)) {
      setCellValue(rowId, monthIndex, '')
      return
    }
    setCellValue(rowId, monthIndex, formatBRL.format(parsed))
    markRowDirty(rowId)
  }

  const updateLabel = (rowId: string, value: string) => {
    markRowDirty(rowId)
    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, label: value } : row))
    )
  }

  const removeRow = (rowId: string) => {
    setRows((prev) => prev.filter((row) => row.id !== rowId))
    setDirtyRowIds((prev) => {
      if (!prev.has(rowId)) return prev
      const next = new Set(prev)
      next.delete(rowId)
      return next
    })
  }

  const addRow = (type: RowData['type']) => {
    setRows((prev) => {
      const maxOrder = prev.reduce((max, row) => Math.max(max, row.order), 0)
      const next = createRow('', type, maxOrder + 1)
      focusRowIdRef.current = next.id
      setDirtyRowIds((prevDirty) => {
        const nextDirty = new Set(prevDirty)
        nextDirty.add(next.id)
        return nextDirty
      })
      return [...prev, next]
    })
  }

  const displayRows = useMemo(() => {
    const typeRank = (type: RowData['type']) => (type === 'income' ? 0 : 1)
    return [...rows].sort((a, b) => {
      const rank = typeRank(a.type) - typeRank(b.type)
      if (rank !== 0) return rank
      return a.order - b.order
    })
  }, [rows])

  const mobileMonthSummary = useMemo(() => {
    const income = totals.incomeTotalsByMonth[selectedMonthIndex] ?? 0
    const expense = totals.expenseTotalsByMonth[selectedMonthIndex] ?? 0
    const balance = income - expense
    return {
      income,
      expense,
      balance,
      percentSpent: formatPercent(expense, income),
      percentClassName: percentClassName(expense, income),
    }
  }, [totals, selectedMonthIndex])

  const focusCell = (rowId: string, colIndex: number) => {
    const selector =
      colIndex === -1
        ? `[data-row-id="${rowId}"][data-col="label"]`
        : `[data-row-id="${rowId}"][data-col-index="${colIndex}"]`
    const input = document.querySelector<HTMLInputElement>(selector)
    if (!input) return
    input.focus()
    input.select()
    input.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }

  const handleCellNavigation = (
    event: React.KeyboardEvent<HTMLInputElement>,
    rowId: string,
    colIndex: number
  ) => {
    const rowIndex = displayRows.findIndex((row) => row.id === rowId)
    if (rowIndex === -1) return

    const moveTo = (nextRowIndex: number, nextColIndex: number) => {
      const nextRow = displayRows[nextRowIndex]
      if (!nextRow) return
      focusCell(nextRow.id, nextColIndex)
    }

    const moveTab = (direction: 1 | -1) => {
      const maxCol = MONTHS.length - 1

      if (direction === 1) {
        if (colIndex === -1) {
          moveTo(rowIndex, 0)
          return
        }
        if (colIndex < maxCol) {
          moveTo(rowIndex, colIndex + 1)
          return
        }
        moveTo(rowIndex + 1, -1)
        return
      }

      if (colIndex === -1) {
        moveTo(rowIndex - 1, maxCol)
        return
      }
      if (colIndex > 0) {
        moveTo(rowIndex, colIndex - 1)
        return
      }
      moveTo(rowIndex, -1)
    }

    switch (event.key) {
      case 'ArrowRight': {
        event.preventDefault()
        const nextCol = colIndex < MONTHS.length - 1 ? colIndex + 1 : colIndex
        if (colIndex === -1) {
          moveTo(rowIndex, 0)
        } else {
          moveTo(rowIndex, nextCol)
        }
        break
      }
      case 'ArrowLeft': {
        event.preventDefault()
        if (colIndex === -1) return
        const nextCol = colIndex > 0 ? colIndex - 1 : -1
        moveTo(rowIndex, nextCol)
        break
      }
      case 'ArrowUp': {
        event.preventDefault()
        moveTo(rowIndex - 1, colIndex)
        break
      }
      case 'ArrowDown': {
        event.preventDefault()
        moveTo(rowIndex + 1, colIndex)
        break
      }
      case 'Enter': {
        event.preventDefault()
        moveTo(rowIndex + 1, colIndex)
        break
      }
      case 'Tab': {
        event.preventDefault()
        moveTab(event.shiftKey ? -1 : 1)
        break
      }
      case 'Escape': {
        event.preventDefault()
        event.currentTarget.blur()
        break
      }
      default:
        break
    }
  }

  const serializeRows = (input: RowData[]) =>
    input.map((row) => ({
      id: row.id,
      label: row.label,
      type: row.type,
      values: row.values.map((value) => (value ?? '').toString()),
      order: row.order,
    }))

  useEffect(() => {
    latestRowsRef.current = rows
    latestSelectedYearRef.current = selectedYear
    latestDirtyCountRef.current = dirtyRowIds.size
  }, [rows, selectedYear, dirtyRowIds])

  const normalizeRows = (input: unknown): RowData[] => {
    if (!Array.isArray(input)) {
      return buildDefaultRows()
    }
    return input.map((raw, index) => {
      const row = typeof raw === 'object' && raw ? (raw as Partial<RowData>) : {}
      const type = row.type === 'income' || row.type === 'expense' ? row.type : 'expense'
      const label =
        typeof row.label === 'string'
          ? row.label
          : type === 'income'
            ? `Receita ${index + 1}`
            : `Despesa ${index + 1}`
      const valuesSource = Array.isArray(row.values) ? row.values : []
      const values = Array.from({ length: MONTHS.length }, (_, idx) => {
        const value = valuesSource[idx]
        return value === undefined || value === null ? '' : String(value)
      })
      const order = typeof row.order === 'number' ? row.order : index + 1
      const id = typeof row.id === 'string' && row.id.length > 0 ? row.id : createRow(label, type, order).id
      return { id, label, type, values, order }
    })
  }

  const loadSheet = async (year: number) => {
    setLoading(true)
    setError(null)
    if (supabaseConfigMissing || !supabase) {
      setError('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para salvar despesas.')
      setLoading(false)
      return
    }
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      setError('Faça login para acessar suas despesas.')
      setLoading(false)
      return
    }

    const { data, error: loadError } = await supabase
      .from('expenses_sheets')
      .select('rows, updated_at')
      .eq('user_id', user.id)
      .eq('year', year)
      .maybeSingle()

    if (loadError) {
      setError('Não foi possível carregar sua planilha.')
      setRows(buildDefaultRows())
      setLoading(false)
      return
    }

    if (data?.rows) {
      let rowsPayload: unknown = data.rows
      if (typeof data.rows === 'string') {
        try {
          rowsPayload = JSON.parse(data.rows)
        } catch {
          rowsPayload = null
        }
      }
      setRows(normalizeRows(rowsPayload))
      setLastSavedAt(data.updated_at ? new Date(data.updated_at) : null)
      setDirtyRowIds(new Set())
    } else {
      setRows(buildDefaultRows())
      setLastSavedAt(null)
      setDirtyRowIds(new Set())
    }
    setLoading(false)
  }

  useEffect(() => {
    skipNextSaveRef.current = true
    const timer = window.setTimeout(() => {
      loadSheet(selectedYear)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [selectedYear])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia(MOBILE_EXPENSES_MEDIA_QUERY)
    const sync = () => setIsMobileLayout(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (loading) return
    if (supabaseConfigMissing || !supabase) return
    const sb = supabase
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false
      return
    }
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current)
    }
    saveTimerRef.current = window.setTimeout(async () => {
      setSaving(true)
      setError(null)
      const {
        data: { user },
        error: userError,
      } = await sb.auth.getUser()
      if (userError || !user) {
        setError('Sessão expirada. Faça login novamente.')
        setSaving(false)
        return
      }
      const { error: upsertError } = await sb
        .from('expenses_sheets')
        .upsert(
          {
            user_id: user.id,
            year: selectedYear,
            rows: serializeRows(rows),
          },
          { onConflict: 'user_id,year' }
        )

      if (upsertError) {
        setError('Não foi possível salvar automaticamente.')
        setSaving(false)
        return
      }
      notifyExpensesSheetChanged(selectedYear)
      setLastSavedAt(new Date())
      setDirtyRowIds(new Set())
      setSaving(false)
    }, 700)
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }, [rows, selectedYear, loading])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
      if (latestDirtyCountRef.current === 0) return
      if (supabaseConfigMissing || !supabase) return

      const sb = supabase
      const rowsToPersist = latestRowsRef.current
      const yearToPersist = latestSelectedYearRef.current

      void (async () => {
        const {
          data: { user },
          error: userError,
        } = await sb.auth.getUser()
        if (userError || !user) return

        const { error: upsertError } = await sb
          .from('expenses_sheets')
          .upsert(
            {
              user_id: user.id,
              year: yearToPersist,
              rows: serializeRows(rowsToPersist),
            },
            { onConflict: 'user_id,year' }
          )

        if (!upsertError) {
          notifyExpensesSheetChanged(yearToPersist)
        }
      })()
    }
  }, [])

  useEffect(() => {
    const targetId = focusRowIdRef.current
    if (!targetId) return
    const input = document.querySelector<HTMLInputElement>(
      `[data-row-label-id="${targetId}"]`
    )
    if (input) {
      input.focus()
      input.select()
      focusRowIdRef.current = null
    }
  }, [rows])

  const saveStatusText = loading
    ? 'Carregando...'
    : saving
      ? 'Salvando...'
      : error
        ? 'Erro ao salvar'
        : lastSavedAt
          ? `Salvo em ${lastSavedAt.toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}`
          : 'Alterações não salvas'

  const incomeRows = displayRows.filter((row) => row.type === 'income')
  const expenseRows = displayRows.filter((row) => row.type === 'expense')

  return (
    <section className="expenses-page">
      <header className="expenses-header">
        <div>
          {onOpenMenu ? (
            <button className="course-back" onClick={onOpenMenu}>
              Menu
            </button>
          ) : null}
          <h1 className="expenses-title">Gestão</h1>
        </div>
        <div className="expenses-actions">
          <div className="expenses-year-control">
            <input
              className="expenses-year-input"
              type="number"
              min={1900}
              max={2100}
              value={selectedYear}
              aria-label="Ano"
              onChange={(event) => {
                const next = Number(event.target.value)
                if (!Number.isFinite(next)) return
                setSelectedYear(next)
              }}
            />
          </div>
          <button className="btn small" onClick={() => addRow('expense')}>
            + despesa
          </button>
          <button className="btn small" onClick={() => addRow('income')}>
            + receita
          </button>
        </div>
      </header>

      {error ? <div className="alert error">{error}</div> : null}

      <div className="expenses-sheet">
        {isMobileLayout ? (
          <div className="expenses-mobile">
            <div className="expenses-mobile__month-picker" role="tablist" aria-label="Meses">
              {MONTHS.map((month, index) => (
                <button
                  key={month}
                  type="button"
                  role="tab"
                  aria-selected={selectedMonthIndex === index}
                  className={`expenses-mobile__month-chip ${
                    selectedMonthIndex === index ? 'is-active' : ''
                  }`}
                  onClick={() => setSelectedMonthIndex(index)}
                >
                  {month}
                </button>
              ))}
            </div>

            <div className="expenses-mobile__summary">
              <article className="expenses-mobile__metric">
                <span>Receitas ({MONTHS[selectedMonthIndex]})</span>
                <strong>{formatBRL.format(mobileMonthSummary.income)}</strong>
              </article>
              <article className="expenses-mobile__metric">
                <span>Despesas ({MONTHS[selectedMonthIndex]})</span>
                <strong>{formatBRL.format(mobileMonthSummary.expense)}</strong>
              </article>
              <article className="expenses-mobile__metric">
                <span>Saldo do mês</span>
                <strong
                  className={
                    mobileMonthSummary.balance < 0 ? 'expenses-mobile__metric-negative' : undefined
                  }
                >
                  {formatBRL.format(mobileMonthSummary.balance)}
                </strong>
              </article>
              <article className="expenses-mobile__metric">
                <span>% gasto</span>
                <strong className={mobileMonthSummary.percentClassName || undefined}>
                  {mobileMonthSummary.percentSpent}
                </strong>
              </article>
            </div>

            <section className="expenses-mobile__section" aria-labelledby="expenses-mobile-income">
              <div className="expenses-mobile__section-head">
                <h2 id="expenses-mobile-income">Receitas</h2>
                <span>{incomeRows.length} itens</span>
              </div>
              <div className="expenses-mobile__list">
                {incomeRows.map((row) => {
                  const monthValue = row.values[selectedMonthIndex] ?? ''
                  const isDirty = dirtyRowIds.has(row.id)
                  const annualTotal = row.values.reduce((sum, value) => sum + parseValue(value), 0)
                  return (
                    <article
                      key={row.id}
                      className={`expenses-mobile__item ${isDirty ? 'is-dirty' : ''}`}
                    >
                      <div className="expenses-mobile__item-head">
                        <div className="expenses-mobile__item-meta">
                          <button
                            className="expenses-sheet__trash"
                            type="button"
                            aria-label="Excluir linha"
                            onClick={() => removeRow(row.id)}
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path
                                d="M5 7h14m-9 0V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2m1 0-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M10 11v6m4-6v6"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                          {isDirty ? (
                            <span
                              className="expenses-sheet__dirty-indicator"
                              aria-label="Alteração pendente"
                            />
                          ) : null}
                          <span className="expenses-mobile__item-tag">Receita</span>
                        </div>
                        <span className="expenses-mobile__item-total">
                          Ano: {formatBRL.format(annualTotal)}
                        </span>
                      </div>

                      <input
                        className="expenses-sheet__input expenses-sheet__label-input expenses-mobile__label-input"
                        value={row.label}
                        onChange={(event) => updateLabel(row.id, event.target.value)}
                        placeholder="Digite o nome da receita"
                        data-row-label-id={row.id}
                        aria-label={`Nome da receita (${MONTHS[selectedMonthIndex]})`}
                      />

                      <div className="expenses-mobile__value-row">
                        <label htmlFor={`mobile-value-${row.id}`}>
                          Valor em {MONTHS[selectedMonthIndex]}
                        </label>
                        <input
                          id={`mobile-value-${row.id}`}
                          className="expenses-sheet__input expenses-mobile__value-input"
                          inputMode="decimal"
                          placeholder="0,00"
                          value={monthValue}
                          onChange={(event) =>
                            updateCell(row.id, selectedMonthIndex, event.target.value)
                          }
                          onFocus={() => {
                            if (!monthValue) return
                            const sanitized = sanitizeValueInput(monthValue)
                            if (sanitized !== monthValue) {
                              setCellValue(row.id, selectedMonthIndex, sanitized)
                            }
                          }}
                          onBlur={() =>
                            formatCellOnBlur(row.id, selectedMonthIndex, row.values[selectedMonthIndex] ?? '')
                          }
                          aria-label={`Valor da receita ${row.label || 'sem nome'} em ${
                            MONTHS[selectedMonthIndex]
                          }`}
                        />
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>

            <section className="expenses-mobile__section" aria-labelledby="expenses-mobile-expense">
              <div className="expenses-mobile__section-head">
                <h2 id="expenses-mobile-expense">Despesas</h2>
                <span>{expenseRows.length} itens</span>
              </div>
              <div className="expenses-mobile__list">
                {expenseRows.map((row) => {
                  const monthValue = row.values[selectedMonthIndex] ?? ''
                  const isDirty = dirtyRowIds.has(row.id)
                  const annualTotal = row.values.reduce((sum, value) => sum + parseValue(value), 0)
                  return (
                    <article
                      key={row.id}
                      className={`expenses-mobile__item ${isDirty ? 'is-dirty' : ''}`}
                    >
                      <div className="expenses-mobile__item-head">
                        <div className="expenses-mobile__item-meta">
                          <button
                            className="expenses-sheet__trash"
                            type="button"
                            aria-label="Excluir linha"
                            onClick={() => removeRow(row.id)}
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path
                                d="M5 7h14m-9 0V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2m1 0-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M10 11v6m4-6v6"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                          {isDirty ? (
                            <span
                              className="expenses-sheet__dirty-indicator"
                              aria-label="Alteração pendente"
                            />
                          ) : null}
                          <span className="expenses-mobile__item-tag is-expense">Despesa</span>
                        </div>
                        <span className="expenses-mobile__item-total">
                          Ano: {formatBRL.format(annualTotal)}
                        </span>
                      </div>

                      <input
                        className="expenses-sheet__input expenses-sheet__label-input expenses-mobile__label-input"
                        value={row.label}
                        onChange={(event) => updateLabel(row.id, event.target.value)}
                        placeholder="Digite o nome da despesa"
                        data-row-label-id={row.id}
                        aria-label={`Nome da despesa (${MONTHS[selectedMonthIndex]})`}
                      />

                      <div className="expenses-mobile__value-row">
                        <label htmlFor={`mobile-value-${row.id}`}>
                          Valor em {MONTHS[selectedMonthIndex]}
                        </label>
                        <input
                          id={`mobile-value-${row.id}`}
                          className="expenses-sheet__input expenses-mobile__value-input"
                          inputMode="decimal"
                          placeholder="0,00"
                          value={monthValue}
                          onChange={(event) =>
                            updateCell(row.id, selectedMonthIndex, event.target.value)
                          }
                          onFocus={() => {
                            if (!monthValue) return
                            const sanitized = sanitizeValueInput(monthValue)
                            if (sanitized !== monthValue) {
                              setCellValue(row.id, selectedMonthIndex, sanitized)
                            }
                          }}
                          onBlur={() =>
                            formatCellOnBlur(row.id, selectedMonthIndex, row.values[selectedMonthIndex] ?? '')
                          }
                          aria-label={`Valor da despesa ${row.label || 'sem nome'} em ${
                            MONTHS[selectedMonthIndex]
                          }`}
                        />
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          </div>
        ) : (
          <div className="expenses-sheet__scroll">
            <table className="expenses-sheet__table">
              <colgroup>
                <col className="expenses-col expenses-col--label" />
                {MONTHS.map((month) => (
                  <col key={`col-${month}`} className="expenses-col expenses-col--month" />
                ))}
                <col className="expenses-col expenses-col--total" />
              </colgroup>
              <thead>
                <tr>
                  <th>Tipo</th>
                  {MONTHS.map((month) => (
                    <th key={month}>{month}</th>
                  ))}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row, rowIndex) => {
                  const isGroupBreak =
                    rowIndex > 0 && displayRows[rowIndex - 1]?.type !== row.type
                  const nextIsDifferent =
                    rowIndex === displayRows.length - 1 ||
                    displayRows[rowIndex + 1]?.type !== row.type
                  const isDirty = dirtyRowIds.has(row.id)
                  const rowClassName = [
                    isGroupBreak ? 'expenses-sheet__group-separator' : '',
                    isDirty ? 'expenses-sheet__row--dirty' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')

                  return (
                    <Fragment key={row.id}>
                      <tr className={rowClassName || undefined}>
                        <td className="expenses-sheet__label">
                          <div className="expenses-sheet__label-wrap">
                            <button
                              className="expenses-sheet__trash"
                              type="button"
                              aria-label="Excluir linha"
                              onClick={() => removeRow(row.id)}
                            >
                              <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path
                                  d="M5 7h14m-9 0V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2m1 0-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.6"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M10 11v6m4-6v6"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.6"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                            {isDirty ? (
                              <span
                                className="expenses-sheet__dirty-indicator"
                                aria-label="Alteração pendente"
                              />
                            ) : null}
                            <input
                              className="expenses-sheet__input expenses-sheet__label-input"
                              value={row.label}
                              onChange={(event) => updateLabel(row.id, event.target.value)}
                              onKeyDown={(event) => handleCellNavigation(event, row.id, -1)}
                              placeholder={
                                row.type === 'income'
                                  ? 'Digite o nome da receita'
                                  : 'Digite o nome da despesa'
                              }
                              data-row-label-id={row.id}
                              data-row-id={row.id}
                              data-col="label"
                            />
                          </div>
                        </td>
                        {row.values.map((value, monthIndex) => (
                          <td key={`${row.id}-${monthIndex}`}>
                            <input
                              className="expenses-sheet__input"
                              inputMode="decimal"
                              placeholder="0,00"
                              value={value}
                              onChange={(event) =>
                                updateCell(row.id, monthIndex, event.target.value)
                              }
                              onKeyDown={(event) => handleCellNavigation(event, row.id, monthIndex)}
                              onFocus={() => {
                                if (!value) return
                                const sanitized = sanitizeValueInput(value)
                                if (sanitized !== value) {
                                  setCellValue(row.id, monthIndex, sanitized)
                                }
                              }}
                              onBlur={() => formatCellOnBlur(row.id, monthIndex, value)}
                              data-row-id={row.id}
                              data-col-index={monthIndex}
                            />
                          </td>
                        ))}
                        <td className="expenses-sheet__total">
                          {formatBRL.format(
                            row.values.reduce((sum, value) => sum + parseValue(value), 0)
                          )}
                        </td>
                      </tr>
                      {nextIsDifferent && row.type === 'income' ? (
                        <>
                          <tr className="expenses-sheet__total-row income-total">
                            <td className="expenses-sheet__label">Total de Receitas</td>
                            {totals.incomeTotalsByMonth.map((value, index) => (
                              <td key={`income-total-${index}`} className="expenses-sheet__total">
                                {formatBRL.format(value)}
                              </td>
                            ))}
                            <td className="expenses-sheet__total">
                              {formatBRL.format(totals.incomeTotal)}
                            </td>
                          </tr>
                          {showTitheRow ? (
                            <tr className="expenses-sheet__total-row income-total">
                              <td className="expenses-sheet__label">
                                <div className="expenses-sheet__label-wrap">
                                  <button
                                    className="expenses-sheet__trash"
                                    type="button"
                                    aria-label="Excluir linha de dízimo"
                                    onClick={() => setShowTitheRow(false)}
                                    title="Excluir linha de dízimo"
                                  >
                                    <svg viewBox="0 0 24 24" aria-hidden="true">
                                      <path
                                        d="M5 7h14m-9 0V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2m1 0-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.6"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                      <path
                                        d="M10 11v6m4-6v6"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.6"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </button>
                                  <span>Dízimo</span>
                                </div>
                              </td>
                              {totals.incomeTotalsByMonth.map((value, index) => (
                                <td key={`income-tithe-${index}`} className="expenses-sheet__total">
                                  {formatBRL.format(value * 0.1)}
                                </td>
                              ))}
                              <td className="expenses-sheet__total">
                                {formatBRL.format(totals.incomeTotal * 0.1)}
                              </td>
                            </tr>
                          ) : null}
                        </>
                      ) : null}
                    </Fragment>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="expenses-sheet__total-row expense-total">
                  <td className="expenses-sheet__label">Total de Despesas</td>
                  {totals.expenseTotalsByMonth.map((value, index) => (
                    <td key={`expense-total-${index}`} className="expenses-sheet__total">
                      {formatBRL.format(value)}
                    </td>
                  ))}
                  <td className="expenses-sheet__total">{formatBRL.format(totals.expenseTotal)}</td>
                </tr>
                <tr className="expenses-sheet__total-row expense-pct">
                  <td className="expenses-sheet__label">Percentual gasto</td>
                  {totals.expenseTotalsByMonth.map((value, index) => (
                    <td
                      key={`expense-pct-${index}`}
                      className={`expenses-sheet__total ${percentClassName(
                        value,
                        totals.incomeTotalsByMonth[index]
                      )}`}
                    >
                      {formatPercent(value, totals.incomeTotalsByMonth[index])}
                    </td>
                  ))}
                  <td
                    className={`expenses-sheet__total ${percentClassName(
                      totals.expenseTotal,
                      totals.incomeTotal
                    )}`}
                  >
                    {formatPercent(totals.expenseTotal, totals.incomeTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
      <div className="expenses-save-status expenses-save-status--bottom">{saveStatusText}</div>
    </section>
  )
}
