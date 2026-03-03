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
const expensesBudgetStorageKey = (year: number, monthIndex: number) =>
  `upmoney_expenses_budget:${year}:${monthIndex}`
const SUBSCRIPTION_KEYWORDS = [
  'assinatura',
  'netflix',
  'spotify',
  'prime',
  'amazon',
  'disney',
  'hbo',
  'youtube',
  'deezer',
  'icloud',
  'adobe',
  'canva',
]
const BASE_INCOME_SUGGESTIONS = [
  'Salário',
  'Freelance',
  'Comissão',
  'Pró-labore',
  'Bônus',
  '13º salário',
  'Dividendos',
  'Rendimentos',
  'Aluguel recebido',
  'Reembolso',
  'Venda de ativo',
]
const BASE_EXPENSE_SUGGESTIONS = [
  'Aluguel',
  'Condomínio',
  'Energia elétrica',
  'Água',
  'Internet',
  'Telefone',
  'Mercado',
  'Transporte',
  'Combustível',
  'Seguro',
  'Plano de saúde',
  'Farmácia',
  'Educação',
  'Lazer',
  'Assinaturas',
]

const canonicalizeExpenseSuggestion = (label: string) => {
  const trimmed = label.trim()
  if (!trimmed) return ''
  const normalized = trimmed
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
  if (/^despesa\s+\d+$/.test(normalized)) {
    return ''
  }
  if (normalized.includes('consorcio') && normalized.includes('cota')) {
    return 'Consórcio'
  }
  return trimmed
}

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

type FlowTypeFilter = 'all' | RowData['type']
type GroupMode = 'none' | 'type'
type AnalysisAlert = {
  id: string
  type: 'warn' | 'info'
  text: string
  focusLabel?: string
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
  const [visibleMonthIndexes, setVisibleMonthIndexes] = useState<number[]>(
    MONTHS.map((_, index) => index)
  )
  const [showTotalColumn, setShowTotalColumn] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [analysisOpen, setAnalysisOpen] = useState(false)
  const [flowTypeFilter, setFlowTypeFilter] = useState<FlowTypeFilter>('all')
  const [labelFilter, setLabelFilter] = useState('')
  const [groupMode, setGroupMode] = useState<GroupMode>('type')
  const [focusMode, setFocusMode] = useState(false)
  const [monthlyBudgetInput, setMonthlyBudgetInput] = useState('')
  const [incomeLabelHistory, setIncomeLabelHistory] = useState<string[]>([])
  const [expenseLabelHistory, setExpenseLabelHistory] = useState<string[]>([])
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

  const visibleMonths = useMemo(
    () =>
      visibleMonthIndexes.map((index) => ({
        index,
        label: MONTHS[index],
      })),
    [visibleMonthIndexes]
  )

  const displayRows = useMemo(() => {
    const typeRank = (type: RowData['type']) => (type === 'income' ? 0 : 1)
    return [...rows]
      .sort((a, b) => {
        const rank = typeRank(a.type) - typeRank(b.type)
        if (rank !== 0) return rank
        return a.order - b.order
      })
      .filter((row) => (flowTypeFilter === 'all' ? true : row.type === flowTypeFilter))
      .filter((row) => {
        const query = labelFilter.trim().toLowerCase()
        if (!query) return true
        return row.label.toLowerCase().includes(query)
      })
  }, [rows, flowTypeFilter, labelFilter])

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

  const incomeLabelSuggestions = useMemo(() => {
    const suggestions = new Set(BASE_INCOME_SUGGESTIONS)
    incomeLabelHistory.forEach((label) => suggestions.add(label))
    rows.forEach((row) => {
      if (row.type !== 'income') return
      const label = row.label.trim()
      if (label.length < 2) return
      suggestions.add(label)
    })
    return Array.from(suggestions).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [rows, incomeLabelHistory])

  const expenseLabelSuggestions = useMemo(() => {
    const suggestions = new Set<string>(BASE_EXPENSE_SUGGESTIONS)
    expenseLabelHistory.forEach((label) => {
      const canonical = canonicalizeExpenseSuggestion(label)
      if (canonical.length >= 2) suggestions.add(canonical)
    })
    rows.forEach((row) => {
      if (row.type !== 'expense') return
      const label = canonicalizeExpenseSuggestion(row.label)
      if (label.length < 2) return
      suggestions.add(label)
    })
    return Array.from(suggestions).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [rows, expenseLabelHistory])

  const monthIncome = totals.incomeTotalsByMonth[selectedMonthIndex] ?? 0
  const monthExpense = totals.expenseTotalsByMonth[selectedMonthIndex] ?? 0
  const previousMonthExpense =
    selectedMonthIndex > 0 ? (totals.expenseTotalsByMonth[selectedMonthIndex - 1] ?? 0) : null
  const customBudget = parseSingleNumber(monthlyBudgetInput)
  const budgetValue = customBudget > 0 ? customBudget : monthIncome
  const budgetUsedPct = budgetValue > 0 ? (monthExpense / budgetValue) * 100 : null
  const potentialSavings = Math.max(budgetValue - monthExpense, 0)
  const budgetOverrun = Math.max(monthExpense - budgetValue, 0)
  const monthVariationPct =
    previousMonthExpense != null && previousMonthExpense > 0
      ? ((monthExpense - previousMonthExpense) / previousMonthExpense) * 100
      : null

  const expenseRowsRaw = useMemo(
    () =>
      rows.filter((row) => row.type === 'expense' && row.label.trim().length > 0),
    [rows]
  )

  const paretoItems = useMemo(() => {
    const byLabel = new Map<string, number>()
    expenseRowsRaw.forEach((row) => {
      const value = parseValue(row.values[selectedMonthIndex] ?? '')
      if (value <= 0) return
      const label = row.label.trim()
      byLabel.set(label, (byLabel.get(label) ?? 0) + value)
    })
    const sorted = Array.from(byLabel.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
    const total = sorted.reduce((sum, item) => sum + item.value, 0)
    let cumulative = 0
    return sorted.map((item) => {
      const share = total > 0 ? (item.value / total) * 100 : 0
      cumulative += share
      return {
        ...item,
        share,
        cumulative,
        isParetoCore: cumulative <= 80,
      }
    })
  }, [expenseRowsRaw, selectedMonthIndex])

  const weeklyExpenseSeries = useMemo(() => {
    const prev = previousMonthExpense ?? 0
    const weeks = [
      { label: 'S-4', value: prev / 4 },
      { label: 'S-3', value: prev / 4 },
      { label: 'S-2', value: prev / 4 },
      { label: 'S-1', value: prev / 4 },
      { label: 'S1', value: monthExpense / 4 },
      { label: 'S2', value: monthExpense / 4 },
      { label: 'S3', value: monthExpense / 4 },
      { label: 'S4', value: monthExpense / 4 },
    ]
    const max = weeks.reduce((highest, item) => Math.max(highest, item.value), 0)
    return {
      max,
      weeks,
    }
  }, [monthExpense, previousMonthExpense])

  const recurringVsVariable = useMemo(() => {
    let recurring = 0
    let variable = 0
    expenseRowsRaw.forEach((row) => {
      const activeMonths = row.values.filter((value) => parseValue(value) > 0).length
      const currentValue = parseValue(row.values[selectedMonthIndex] ?? '')
      if (currentValue <= 0) return
      if (activeMonths >= 6) {
        recurring += currentValue
      } else {
        variable += currentValue
      }
    })
    const total = recurring + variable
    return {
      recurring,
      variable,
      recurringPct: total > 0 ? (recurring / total) * 100 : 0,
      variablePct: total > 0 ? (variable / total) * 100 : 0,
    }
  }, [expenseRowsRaw, selectedMonthIndex])

  const analysisAlerts = useMemo<AnalysisAlert[]>(() => {
    const alerts: AnalysisAlert[] = []

    const spikeCandidates = expenseRowsRaw
      .map((row) => {
        const current = parseValue(row.values[selectedMonthIndex] ?? '')
        const prevValues = [1, 2, 3]
          .map((offset) => selectedMonthIndex - offset)
          .filter((index) => index >= 0)
          .map((index) => parseValue(row.values[index] ?? ''))
        const avg = prevValues.length
          ? prevValues.reduce((sum, value) => sum + value, 0) / prevValues.length
          : 0
        if (current <= 0 || avg <= 0) return null
        const change = ((current - avg) / avg) * 100
        if (change < 35) return null
        return { label: row.label.trim(), change }
      })
      .filter((item): item is { label: string; change: number } => item !== null)
      .sort((a, b) => b.change - a.change)

    if (spikeCandidates[0]) {
      alerts.push({
        id: 'spike',
        type: 'warn',
        text: `${spikeCandidates[0].label} +${spikeCandidates[0].change.toFixed(0)}% vs média dos 3 meses`,
        focusLabel: spikeCandidates[0].label,
      })
    }

    const inactiveSubscription = expenseRowsRaw.find((row) => {
      const label = row.label.toLowerCase()
      const isSubscription = SUBSCRIPTION_KEYWORDS.some((keyword) => label.includes(keyword))
      if (!isSubscription) return false
      const current = parseValue(row.values[selectedMonthIndex] ?? '')
      const previous = parseValue(row.values[Math.max(selectedMonthIndex - 1, 0)] ?? '')
      return current <= 0 && previous <= 0
    })

    if (inactiveSubscription) {
      alerts.push({
        id: 'subscription',
        type: 'info',
        text: 'Assinatura sem lançamento há ~60 dias. Validar se ainda está ativa.',
        focusLabel: inactiveSubscription.label.trim(),
      })
    }

    const duplicateKeys = new Map<string, number>()
    const duplicateLabelByKey = new Map<string, string>()
    expenseRowsRaw.forEach((row) => {
      const current = parseValue(row.values[selectedMonthIndex] ?? '')
      if (current <= 0) return
      const normalized = row.label
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
      const key = `${normalized}::${current.toFixed(2)}`
      duplicateKeys.set(key, (duplicateKeys.get(key) ?? 0) + 1)
      if (!duplicateLabelByKey.has(key)) {
        duplicateLabelByKey.set(key, row.label.trim())
      }
    })
    const duplicateKey = Array.from(duplicateKeys.entries()).find(([, count]) => count > 1)?.[0]
    if (duplicateKey) {
      alerts.push({
        id: 'duplicate',
        type: 'warn',
        text: 'Despesa duplicada provável: mesmo nome e valor no mês atual.',
        focusLabel: duplicateLabelByKey.get(duplicateKey),
      })
    }

    return alerts
  }, [expenseRowsRaw, selectedMonthIndex])

  const applyAlertFilter = (alert: AnalysisAlert) => {
    setFlowTypeFilter('expense')
    if (alert.focusLabel) {
      setLabelFilter(alert.focusLabel)
    }
    setAnalysisOpen(false)
  }

  const rowGroups = useMemo(() => {
    if (groupMode === 'none') {
      return [{ id: 'all', label: 'Itens', rows: displayRows }]
    }
    const groups = [
      {
        id: 'income',
        label: 'Receitas',
        rows: displayRows.filter((row) => row.type === 'income'),
      },
      {
        id: 'expense',
        label: 'Despesas',
        rows: displayRows.filter((row) => row.type === 'expense'),
      },
    ].filter((group) => group.rows.length > 0)

    return groups
  }, [displayRows, groupMode])

  const calculateGroupTotals = (groupRows: RowData[]) => {
    const monthly = MONTHS.map(() => 0)
    groupRows.forEach((row) => {
      row.values.forEach((value, monthIndex) => {
        monthly[monthIndex] += parseValue(value)
      })
    })
    const total = monthly.reduce((sum, value) => sum + value, 0)
    return { monthly, total }
  }

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
      const firstVisibleMonth = visibleMonthIndexes[0]
      const lastVisibleMonth = visibleMonthIndexes[visibleMonthIndexes.length - 1]
      const currentVisiblePosition = visibleMonthIndexes.indexOf(colIndex)

      if (direction === 1) {
        if (colIndex === -1) {
          if (firstVisibleMonth !== undefined) {
            moveTo(rowIndex, firstVisibleMonth)
          }
          return
        }
        if (currentVisiblePosition >= 0 && currentVisiblePosition < visibleMonthIndexes.length - 1) {
          moveTo(rowIndex, visibleMonthIndexes[currentVisiblePosition + 1])
          return
        }
        moveTo(rowIndex + 1, -1)
        return
      }

      if (colIndex === -1) {
        if (lastVisibleMonth !== undefined) {
          moveTo(rowIndex - 1, lastVisibleMonth)
        }
        return
      }
      if (currentVisiblePosition > 0) {
        moveTo(rowIndex, visibleMonthIndexes[currentVisiblePosition - 1])
        return
      }
      moveTo(rowIndex, -1)
    }

    switch (event.key) {
      case 'ArrowRight': {
        event.preventDefault()
        if (colIndex === -1) {
          const firstVisibleMonth = visibleMonthIndexes[0]
          if (firstVisibleMonth !== undefined) {
            moveTo(rowIndex, firstVisibleMonth)
          }
        } else {
          const currentVisiblePosition = visibleMonthIndexes.indexOf(colIndex)
          if (currentVisiblePosition >= 0 && currentVisiblePosition < visibleMonthIndexes.length - 1) {
            moveTo(rowIndex, visibleMonthIndexes[currentVisiblePosition + 1])
          }
        }
        break
      }
      case 'ArrowLeft': {
        event.preventDefault()
        if (colIndex === -1) return
        const currentVisiblePosition = visibleMonthIndexes.indexOf(colIndex)
        const nextCol = currentVisiblePosition > 0 ? visibleMonthIndexes[currentVisiblePosition - 1] : -1
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

  const toggleVisibleMonth = (monthIndex: number) => {
    setVisibleMonthIndexes((prev) => {
      if (prev.includes(monthIndex)) {
        if (prev.length === 1) return prev
        return prev.filter((index) => index !== monthIndex)
      }
      return [...prev, monthIndex].sort((a, b) => a - b)
    })
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

  const loadLabelHistory = async () => {
    if (supabaseConfigMissing || !supabase) return
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) return

    const { data, error: historyError } = await supabase
      .from('expenses_sheets')
      .select('rows')
      .eq('user_id', user.id)

    if (historyError || !data) return

    const incomeSet = new Set<string>()
    const expenseSet = new Set<string>()

    data.forEach((record) => {
      const source = record?.rows
      let rowsPayload: unknown = source
      if (typeof source === 'string') {
        try {
          rowsPayload = JSON.parse(source)
        } catch {
          rowsPayload = null
        }
      }
      if (!Array.isArray(rowsPayload)) return
      rowsPayload.forEach((item) => {
        const row = typeof item === 'object' && item ? (item as Partial<RowData>) : null
        if (!row) return
        const label = typeof row.label === 'string' ? row.label.trim() : ''
        if (label.length < 2) return
        if (row.type === 'income') {
          incomeSet.add(label)
          return
        }
        if (row.type === 'expense') {
          expenseSet.add(label)
        }
      })
    })

    setIncomeLabelHistory(Array.from(incomeSet).sort((a, b) => a.localeCompare(b, 'pt-BR')))
    setExpenseLabelHistory(Array.from(expenseSet).sort((a, b) => a.localeCompare(b, 'pt-BR')))
  }

  useEffect(() => {
    skipNextSaveRef.current = true
    const timer = window.setTimeout(() => {
      loadSheet(selectedYear)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [selectedYear])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLabelHistory()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia(MOBILE_EXPENSES_MEDIA_QUERY)
    const sync = () => setIsMobileLayout(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = window.localStorage.getItem(
      expensesBudgetStorageKey(selectedYear, selectedMonthIndex)
    )
    if (!raw) {
      setMonthlyBudgetInput('')
      return
    }
    const parsed = Number(raw)
    if (Number.isFinite(parsed) && parsed > 0) {
      setMonthlyBudgetInput(formatBRL.format(parsed))
      return
    }
    setMonthlyBudgetInput('')
  }, [selectedYear, selectedMonthIndex, formatBRL])

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
    <section className={`expenses-page ${focusMode ? 'expenses-page--focus' : ''}`}>
      {incomeLabelSuggestions.length ? (
        <datalist id="income-label-suggestions">
          {incomeLabelSuggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      ) : null}
      {expenseLabelSuggestions.length ? (
        <datalist id="expense-label-suggestions">
          {expenseLabelSuggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      ) : null}
      <header className="expenses-header">
        <div className="expenses-header__title-row">
          {onOpenMenu ? (
            <button className="expenses-menu-btn" type="button" onClick={onOpenMenu}>
              ☰ Menu
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
          <button className="btn small" type="button" onClick={() => setFiltersOpen(true)}>
            Filtros e colunas
          </button>
          <button className="btn small" type="button" onClick={() => setAnalysisOpen(true)}>
            Análises
          </button>
          <button className="btn small" type="button" onClick={() => setFocusMode((prev) => !prev)}>
            {focusMode ? 'Sair do foco' : 'Modo foco'}
          </button>
        </div>
      </header>

      {error ? <div className="alert error">{error}</div> : null}

      {filtersOpen ? (
        <>
          <button
            className="expenses-filters-overlay"
            type="button"
            aria-label="Fechar painel de filtros"
            onClick={() => setFiltersOpen(false)}
          />
          <aside className="expenses-filters-drawer" role="dialog" aria-label="Filtros e colunas">
            <div className="expenses-filters-drawer__header">
              <h2>Filtros e colunas</h2>
              <button className="btn small" type="button" onClick={() => setFiltersOpen(false)}>
                Fechar
              </button>
            </div>
            <div className="expenses-filters-drawer__section">
              <label htmlFor="expense-filter-type">Tipo</label>
              <select
                id="expense-filter-type"
                value={flowTypeFilter}
                onChange={(event) => setFlowTypeFilter(event.target.value as FlowTypeFilter)}
              >
                <option value="all">Todos</option>
                <option value="income">Receitas</option>
                <option value="expense">Despesas</option>
              </select>
            </div>
            <div className="expenses-filters-drawer__section">
              <label htmlFor="expense-filter-label">Buscar por nome</label>
              <input
                id="expense-filter-label"
                type="text"
                value={labelFilter}
                placeholder="Ex.: aluguel"
                onChange={(event) => setLabelFilter(event.target.value)}
              />
            </div>
            <div className="expenses-filters-drawer__section">
              <span>Meses visíveis</span>
              <div className="expenses-filters-drawer__chips">
                {MONTHS.map((month, index) => (
                  <label key={month} className="expenses-filters-drawer__chip">
                    <input
                      type="checkbox"
                      checked={visibleMonthIndexes.includes(index)}
                      onChange={() => toggleVisibleMonth(index)}
                    />
                    <span>{month}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="expenses-filters-drawer__section">
              <label className="expenses-filters-drawer__inline">
                <input
                  type="checkbox"
                  checked={showTotalColumn}
                  onChange={(event) => setShowTotalColumn(event.target.checked)}
                />
                <span>Mostrar coluna Total</span>
              </label>
            </div>
            <div className="expenses-filters-drawer__section">
              <label htmlFor="expense-group-mode">Agrupar tabela</label>
              <select
                id="expense-group-mode"
                value={groupMode}
                onChange={(event) => setGroupMode(event.target.value as GroupMode)}
              >
                <option value="type">Por tipo (receitas/despesas)</option>
                <option value="none">Sem agrupamento</option>
              </select>
            </div>
          </aside>
        </>
      ) : null}

      {analysisOpen ? (
        <>
          <button
            className="expenses-filters-overlay"
            type="button"
            aria-label="Fechar painel de análises"
            onClick={() => setAnalysisOpen(false)}
          />
          <aside className="expenses-analysis-drawer" role="dialog" aria-label="Análises de despesas">
            <div className="expenses-analysis-drawer__header">
              <h2>Análises do mês</h2>
              <button className="btn small" type="button" onClick={() => setAnalysisOpen(false)}>
                Fechar
              </button>
            </div>
            <p className="expenses-analysis-drawer__period">
              {MONTHS[selectedMonthIndex]} / {selectedYear}
            </p>
            <div className="expenses-analysis-budget">
              <label htmlFor="expense-monthly-budget">Orçamento do mês</label>
              <input
                id="expense-monthly-budget"
                type="text"
                inputMode="decimal"
                placeholder={monthIncome > 0 ? formatBRL.format(monthIncome) : '0,00'}
                value={monthlyBudgetInput}
                onChange={(event) =>
                  setMonthlyBudgetInput(event.target.value.replace(/[^0-9.,]/g, ''))
                }
                onBlur={() => {
                  const parsed = parseSingleNumber(monthlyBudgetInput)
                  const key = expensesBudgetStorageKey(selectedYear, selectedMonthIndex)
                  if (typeof window === 'undefined') return
                  if (parsed > 0) {
                    setMonthlyBudgetInput(formatBRL.format(parsed))
                    window.localStorage.setItem(key, String(parsed))
                    return
                  }
                  setMonthlyBudgetInput('')
                  window.localStorage.removeItem(key)
                }}
              />
              <small>
                Se vazio, usamos sua receita do mês ({formatBRL.format(monthIncome)}) como orçamento.
              </small>
            </div>
            <div className="expenses-analysis-kpis">
              <article className="expenses-analysis-kpi">
                <span>Gasto do mês</span>
                <strong>{formatBRL.format(monthExpense)}</strong>
                <small>{MONTHS[selectedMonthIndex]}</small>
              </article>
              <article className="expenses-analysis-kpi">
                <span>Variação vs mês anterior</span>
                <strong
                  className={
                    monthVariationPct == null
                      ? ''
                      : monthVariationPct >= 0
                        ? 'expenses-analysis-kpi__up'
                        : 'expenses-analysis-kpi__down'
                  }
                >
                  {monthVariationPct == null
                    ? '—'
                    : `${monthVariationPct >= 0 ? '+' : ''}${monthVariationPct.toFixed(1)}%`}
                </strong>
                <small>
                  {previousMonthExpense == null
                    ? 'Sem base de comparação'
                    : `Mês anterior: ${formatBRL.format(previousMonthExpense)}`}
                </small>
              </article>
              <article className="expenses-analysis-kpi">
                <span>% orçamento usado</span>
                <strong className={budgetUsedPct != null && budgetUsedPct > 100 ? 'pct-over' : ''}>
                  {budgetUsedPct == null ? '—' : `${budgetUsedPct.toFixed(1)}%`}
                </strong>
                <small>Orçamento base: {formatBRL.format(budgetValue)}</small>
              </article>
              <article className="expenses-analysis-kpi">
                <span>Economia potencial</span>
                <strong>{formatBRL.format(potentialSavings)}</strong>
                <small>
                  {budgetOverrun > 0
                    ? `Estouro atual: ${formatBRL.format(budgetOverrun)}`
                    : 'Dentro do orçamento'}
                </small>
              </article>
            </div>

            <section className="expenses-analysis-section" aria-label="Pareto de categorias">
              <div className="expenses-analysis-section__head">
                <h3>Pareto de categorias (80/20)</h3>
              </div>
              {paretoItems.length ? (
                <div className="expenses-pareto-list">
                  {paretoItems.slice(0, 6).map((item) => (
                    <article key={item.label} className="expenses-pareto-item">
                      <div className="expenses-pareto-item__meta">
                        <span>{item.label}</span>
                        <strong>{item.share.toFixed(1)}%</strong>
                      </div>
                      <div className="expenses-pareto-item__track">
                        <span
                          className={item.isParetoCore ? 'is-core' : ''}
                          style={{ width: `${Math.max(item.share, 4)}%` }}
                        />
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="expenses-analysis-empty">Sem despesas para o mês selecionado.</p>
              )}
            </section>

            <section className="expenses-analysis-section" aria-label="Evolução semanal estimada">
              <div className="expenses-analysis-section__head">
                <h3>Evolução semanal (estimada)</h3>
              </div>
              <div className="expenses-weekly-chart">
                {weeklyExpenseSeries.weeks.map((week) => (
                  <div key={week.label} className="expenses-weekly-chart__bar">
                    <span
                      style={{
                        height: `${
                          weeklyExpenseSeries.max > 0
                            ? Math.max((week.value / weeklyExpenseSeries.max) * 100, 8)
                            : 8
                        }%`,
                      }}
                    />
                    <small>{week.label}</small>
                  </div>
                ))}
              </div>
            </section>

            <section className="expenses-analysis-section" aria-label="Recorrentes e variáveis">
              <div className="expenses-analysis-section__head">
                <h3>Recorrentes x variáveis</h3>
              </div>
              <div className="expenses-mix">
                <article className="expenses-mix__item">
                  <span>Recorrentes</span>
                  <strong>{formatBRL.format(recurringVsVariable.recurring)}</strong>
                  <small>{recurringVsVariable.recurringPct.toFixed(1)}%</small>
                </article>
                <article className="expenses-mix__item">
                  <span>Variáveis</span>
                  <strong>{formatBRL.format(recurringVsVariable.variable)}</strong>
                  <small>{recurringVsVariable.variablePct.toFixed(1)}%</small>
                </article>
              </div>
            </section>

            <section className="expenses-analysis-section" aria-label="Alertas inteligentes">
              <div className="expenses-analysis-section__head">
                <h3>Alertas inteligentes</h3>
              </div>
              {analysisAlerts.length ? (
                <ul className="expenses-alerts">
                  {analysisAlerts.map((alert) => (
                    <li key={alert.id} className={alert.type === 'warn' ? 'is-warn' : 'is-info'}>
                      <button
                        type="button"
                        className="expenses-alerts__action"
                        onClick={() => applyAlertFilter(alert)}
                      >
                        {alert.text}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="expenses-analysis-empty">Sem alertas relevantes no momento.</p>
              )}
            </section>
          </aside>
        </>
      ) : null}

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

            <section className="expenses-mobile__section" aria-label="Lista de receitas">
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
                        list="income-label-suggestions"
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

            <section className="expenses-mobile__section" aria-label="Lista de despesas">
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
                        list="expense-label-suggestions"
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
                {visibleMonths.map((month) => (
                  <col key={`col-${month.label}`} className="expenses-col expenses-col--month" />
                ))}
                {showTotalColumn ? <col className="expenses-col expenses-col--total" /> : null}
              </colgroup>
              <thead>
                <tr>
                  <th>Tipo</th>
                  {visibleMonths.map((month) => (
                    <th key={month.label}>{month.label}</th>
                  ))}
                  {showTotalColumn ? <th>Total</th> : null}
                </tr>
              </thead>
              <tbody>
                {rowGroups.map((group) => {
                  const groupTotals = calculateGroupTotals(group.rows)
                  return (
                    <Fragment key={group.id}>
                      {group.rows.map((row, rowIndex) => {
                        const isDirty = dirtyRowIds.has(row.id)
                        const rowClassName = [
                          groupMode === 'none' && rowIndex > 0 ? 'expenses-sheet__group-separator' : '',
                          isDirty ? 'expenses-sheet__row--dirty' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')

                        return (
                          <tr key={row.id} className={rowClassName || undefined}>
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
                                  list={
                                    row.type === 'income'
                                      ? 'income-label-suggestions'
                                      : 'expense-label-suggestions'
                                  }
                                  data-row-label-id={row.id}
                                  data-row-id={row.id}
                                  data-col="label"
                                />
                              </div>
                            </td>
                            {visibleMonths.map(({ index: monthIndex, label: month }) => {
                              const value = row.values[monthIndex] ?? ''
                              return (
                                <td key={`${row.id}-${monthIndex}`}>
                                  <input
                                    className="expenses-sheet__input"
                                    inputMode="decimal"
                                    placeholder="0,00"
                                    value={value}
                                    onChange={(event) =>
                                      updateCell(row.id, monthIndex, event.target.value)
                                    }
                                    onKeyDown={(event) =>
                                      handleCellNavigation(event, row.id, monthIndex)
                                    }
                                    onFocus={() => {
                                      if (!value) return
                                      const sanitized = sanitizeValueInput(value)
                                      if (sanitized !== value) {
                                        setCellValue(row.id, monthIndex, sanitized)
                                      }
                                    }}
                                    onBlur={() => formatCellOnBlur(row.id, monthIndex, value)}
                                    aria-label={`Valor em ${month}`}
                                    data-row-id={row.id}
                                    data-col-index={monthIndex}
                                  />
                                </td>
                              )
                            })}
                            {showTotalColumn ? (
                              <td className="expenses-sheet__total">
                                {formatBRL.format(
                                  row.values.reduce((sum, value) => sum + parseValue(value), 0)
                                )}
                              </td>
                            ) : null}
                          </tr>
                        )
                      })}
                      {groupMode === 'type' ? (
                        <>
                          <tr className="expenses-sheet__total-row expenses-sheet__subtotal-row">
                            <td className="expenses-sheet__label">Subtotal de {group.label}</td>
                            {visibleMonths.map(({ index }) => (
                              <td key={`subtotal-${group.id}-${index}`} className="expenses-sheet__total">
                                {formatBRL.format(groupTotals.monthly[index] ?? 0)}
                              </td>
                            ))}
                            {showTotalColumn ? (
                              <td className="expenses-sheet__total">{formatBRL.format(groupTotals.total)}</td>
                            ) : null}
                          </tr>
                          {group.id === 'income' && showTitheRow ? (
                            <tr className="expenses-sheet__total-row expenses-sheet__subtotal-row">
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
                              {visibleMonths.map(({ index }) => (
                                <td key={`income-tithe-${index}`} className="expenses-sheet__total">
                                  {formatBRL.format((groupTotals.monthly[index] ?? 0) * 0.1)}
                                </td>
                              ))}
                              {showTotalColumn ? (
                                <td className="expenses-sheet__total">
                                  {formatBRL.format(groupTotals.total * 0.1)}
                                </td>
                              ) : null}
                            </tr>
                          ) : null}
                        </>
                      ) : null}
                    </Fragment>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="expenses-sheet__total-row expense-net">
                  <td className="expenses-sheet__label">Total final</td>
                  {visibleMonths.map(({ index }) => {
                    const tithe = showTitheRow ? (totals.incomeTotalsByMonth[index] ?? 0) * 0.1 : 0
                    const net =
                      (totals.incomeTotalsByMonth[index] ?? 0) -
                      ((totals.expenseTotalsByMonth[index] ?? 0) + tithe)
                    return (
                      <td
                        key={`expense-net-${index}`}
                        className={`expenses-sheet__total ${percentClassName(
                          totals.expenseTotalsByMonth[index] ?? 0,
                          totals.incomeTotalsByMonth[index] ?? 0
                        )}`}
                      >
                        {formatBRL.format(net)}
                      </td>
                    )
                  })}
                  {showTotalColumn ? (
                    <td
                      className={`expenses-sheet__total ${percentClassName(
                        totals.expenseTotal,
                        totals.incomeTotal
                      )}`}
                    >
                      {formatBRL.format(
                        totals.incomeTotal -
                          (totals.expenseTotal + (showTitheRow ? totals.incomeTotal * 0.1 : 0))
                      )}
                    </td>
                  ) : null}
                </tr>
                <tr className="expenses-sheet__total-row expense-pct">
                  <td className="expenses-sheet__label">Percentual gasto</td>
                  {visibleMonths.map(({ index }) => (
                    <td
                      key={`expense-pct-${index}`}
                      className={`expenses-sheet__total ${percentClassName(
                        totals.expenseTotalsByMonth[index] ?? 0,
                        totals.incomeTotalsByMonth[index] ?? 0
                      )}`}
                    >
                      {formatPercent(
                        totals.expenseTotalsByMonth[index] ?? 0,
                        totals.incomeTotalsByMonth[index] ?? 0
                      )}
                    </td>
                  ))}
                  {showTotalColumn ? (
                    <td
                      className={`expenses-sheet__total ${percentClassName(
                        totals.expenseTotal,
                        totals.incomeTotal
                      )}`}
                    >
                      {formatPercent(totals.expenseTotal, totals.incomeTotal)}
                    </td>
                  ) : null}
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
