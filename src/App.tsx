import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { User as SupabaseAuthUser } from '@supabase/supabase-js'
import { createPortal } from 'react-dom'
import meuDividendoImg from './assets/curso-dividendo.png'
import rendaFixaAposentImg from './assets/carteira-rf-aposent.png'
import carteiraCriptoImg from './assets/carteira-cripto.png'
import rendaFixaCuponsImg from './assets/carteira-rf-cupons.png'
import carteiraFiisImg from './assets/carteira-fis.png'
import { AssetsPage } from './pages/Assets'
import { ExpensesPage } from './pages/Expenses'
import { SimulatorPage } from './pages/Simulator'
import { EvolutionAssetsPage } from './pages/EvolutionAssets'
import { MinhaPrevidenciaPage } from './pages/MinhaPrevidencia'
import { LoginPage } from './pages/Login'
import { supabase, supabaseConfigMissing } from './lib/supabaseClient'
import { Sidebar } from './layout/Sidebar'
import type { AppPage } from './types/app'
import { formatBRL } from './lib/format'
import { EXPENSES_SHEET_CHANGED_EVENT } from './lib/expensesSheetEvents'
import {
  EVOLUTION_ACTIVE_YEAR_STORAGE_KEY,
  EVOLUTION_DATA_CHANGED_EVENT,
  EVOLUTION_MONTHS,
  clampEvolutionYear,
  createEvolutionStorageRow,
  notifyEvolutionDataChanged,
  normalizeEvolutionRows,
  parsePtBrNumber,
  readEvolutionVisibleMonthsForYear,
  readEvolutionRowsForYear,
  sanitizeCurrencyLike,
  writeEvolutionVisibleMonthsForYear,
  writeEvolutionRowsForYear,
  type EvolutionMonthKey,
  type EvolutionStorageRow,
} from './lib/evolutionAssets'
import { COURSES } from './features/courses/coursesData'
import { getProgressPercent } from './features/courses/courseProgress'
import { CoursePage } from './features/courses/CoursePage'
import { CoursesListPage } from './features/courses/CoursesListPage'
import { PrevidenciaPrivadaModulo01Page } from './pages/PrevidenciaPrivadaModulo01'
import { AssistantDock } from './components/AssistantDock'
import { applyOperation, type Operation, type Position as PortfolioPosition } from './lib/portfolioEngine'
import './App.css'

const NAV_TELEMETRY_STORAGE_KEY = 'upmoney_navigation_telemetry'

type EvolutionEditorAsset = {
  id: string
  sourceId?: string
  name: string
  value: string
}

const createEvolutionEditorAsset = (): EvolutionEditorAsset => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  name: '',
  value: '',
})

type ExpensesSheetRow = {
  label?: string
  type?: 'income' | 'expense'
  values?: unknown[]
}

type FlowCategoryRow = {
  label: string
  value: number
}

type AssetsSummaryRow = {
  type: string
  label: string
  value: number
  total: number
  percent: number
}

type AssetsSummaryPayload = {
  updatedAt: string
  summary: AssetsSummaryRow[]
}

type DashboardPositionRow = {
  id: string
  symbol: string
  asset_type: string
  currency: string | null
  trade_side: 'buy' | 'sell'
  quantity: number
  entry_price: number
  entry_date: string
  created_at: string
}

type EvolutionSheetRecord = {
  year: number
  rows: unknown
  visible_months: unknown
}

type EvolutionSheetUpsertPayload = {
  user_id: string
  year: number
  rows: EvolutionStorageRow[]
  visible_months: EvolutionMonthKey[]
}

const hasEvolutionContent = (rows: EvolutionStorageRow[], months: EvolutionMonthKey[]) =>
  rows.some(
    (row) =>
      row.name.trim().length > 0 ||
      months.some((month) => typeof row[month] === 'string' && row[month].trim().length > 0)
  )

const getEvolutionPendingStorageKey = (userId: string) =>
  `upmoney_evolution_pending_v1:${userId}`

type ActivityCounts = {
  assetsAdded: number
  coursesOpened: number
  expensesOpened: number
}

type AuthUser = {
  id: string
  email?: string
  name?: string
}

const resolveAuthUserName = (value: unknown) => {
  if (!value || typeof value !== 'object') return undefined
  const meta = value as Record<string, unknown>
  const fullName = typeof meta.full_name === 'string' ? meta.full_name.trim() : ''
  if (fullName) return fullName
  const name = typeof meta.name === 'string' ? meta.name.trim() : ''
  if (name) return name
  const displayName = typeof meta.display_name === 'string' ? meta.display_name.trim() : ''
  if (displayName) return displayName
  return undefined
}

const fallbackNameFromEmail = (email?: string) => {
  if (!email) return ''
  const prefix = email.split('@')[0]?.trim()
  if (!prefix) return ''
  return prefix
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')
}

const normalizeAssetsSummaryPayload = (value: unknown): AssetsSummaryPayload | null => {
  if (!value || typeof value !== 'object') return null
  const source = value as Record<string, unknown>
  if (typeof source.updatedAt !== 'string') return null
  if (!Array.isArray(source.summary)) return null
  const summary = source.summary
    .map((item) => {
      const row = (item ?? {}) as Record<string, unknown>
      const type = typeof row.type === 'string' ? row.type : ''
      const label = typeof row.label === 'string' ? row.label : ''
      const valueNum = Number(row.value)
      const totalNum = Number(row.total)
      const percentNum = Number(row.percent)
      if (!type || !label) return null
      if (!Number.isFinite(valueNum) || !Number.isFinite(totalNum) || !Number.isFinite(percentNum)) {
        return null
      }
      return {
        type,
        label,
        value: valueNum,
        total: totalNum,
        percent: percentNum,
      }
    })
    .filter((item): item is AssetsSummaryRow => item !== null)

  return {
    updatedAt: source.updatedAt,
    summary,
  }
}

const normalizeActivityCountsFromDb = (value: unknown): ActivityCounts | null => {
  if (!value || typeof value !== 'object') return null
  const source = value as Record<string, unknown>
  const assetsAdded = Number(source.assets_added)
  const coursesOpened = Number(source.courses_opened)
  const expensesOpened = Number(source.expenses_opened)
  if (!Number.isFinite(assetsAdded) || !Number.isFinite(coursesOpened) || !Number.isFinite(expensesOpened)) {
    return null
  }
  return {
    assetsAdded: Math.max(0, Math.trunc(assetsAdded)),
    coursesOpened: Math.max(0, Math.trunc(coursesOpened)),
    expensesOpened: Math.max(0, Math.trunc(expensesOpened)),
  }
}

const getPreviousMonthInvestmentBase = (positions: DashboardPositionRow[]) => {
  const now = new Date()
  const previousMonthEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59,
    999
  ).getTime()

  const sortByOperationDate = (a: DashboardPositionRow, b: DashboardPositionRow) => {
    const aDate = new Date(a.entry_date).getTime()
    const bDate = new Date(b.entry_date).getTime()
    if (aDate !== bDate) return aDate - bDate
    const aCreated = new Date(a.created_at).getTime()
    const bCreated = new Date(b.created_at).getTime()
    if (aCreated !== bCreated) return aCreated - bCreated
    return a.id.localeCompare(b.id)
  }

  const grouped = new Map<string, PortfolioPosition>()
  const sorted = [...positions]
    .filter((position) => {
      const entryTs = new Date(position.entry_date).getTime()
      return Number.isFinite(entryTs) && entryTs <= previousMonthEnd
    })
    .sort(sortByOperationDate)

  for (const position of sorted) {
    const key = `${position.symbol}::${position.asset_type}::${position.currency ?? ''}`
    if (!grouped.has(key)) {
      grouped.set(key, {
        assetId: key,
        quantity: 0,
        avgPrice: 0,
        totalCost: 0,
        realizedPnL: 0,
        lastUpdated: '',
      })
    }
    const current = grouped.get(key)!
    const operation: Operation = {
      id: position.id,
      assetId: key,
      type: position.trade_side === 'sell' ? 'SELL' : 'BUY',
      date: position.entry_date,
      quantity: Math.abs(Number(position.quantity)),
      price: Number(position.entry_price),
      fees: 0,
    }
    const result = applyOperation(current, operation)
    grouped.set(key, result.positionAfter)
  }

  let total = 0
  for (const aggregated of grouped.values()) {
    if (aggregated.quantity <= 0) continue
    total += aggregated.totalCost
  }

  return total
}

function App() {
  const [activePage, setActivePage] = useState<AppPage>('dash')
  const [completedModulesCourse1, setCompletedModulesCourse1] = useState<
    number[]
  >([])
  const [completedModulesCourse2, setCompletedModulesCourse2] = useState<
    number[]
  >([])
  const [completedModulesCourse3, setCompletedModulesCourse3] = useState<
    number[]
  >([])
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [passwordRecoveryMode, setPasswordRecoveryMode] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.location.hash.includes('type=recovery')
  })
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(max-width: 720px)').matches
  })
  const contentRef = useRef<HTMLElement | null>(null)
  const askedNameForUserRef = useRef<string | null>(null)
  const [dividendGoal, setDividendGoal] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null
    const storedGoal = window.localStorage.getItem('upmoney_dividend_goal')
    if (!storedGoal) return null
    const parsed = Number(storedGoal)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  })
  const [dividendGoalInput, setDividendGoalInput] = useState(() => {
    if (typeof window === 'undefined') return ''
    const storedGoal = window.localStorage.getItem('upmoney_dividend_goal')
    if (!storedGoal) return ''
    const parsed = Number(storedGoal)
    if (!Number.isFinite(parsed) || parsed <= 0) return ''
    return parsed.toString().replace('.', ',')
  })
  const [onboardingStep, setOnboardingStep] = useState(() => {
    if (typeof window === 'undefined') return 0
    const storedStep = window.localStorage.getItem('upmoney_onboarding_step')
    if (!storedStep) return 0
    const parsed = Number(storedStep)
    return Number.isFinite(parsed) ? parsed : 0
  })
  const [activityCounts, setActivityCounts] = useState<ActivityCounts>(() => {
    const defaults = { assetsAdded: 0, coursesOpened: 0, expensesOpened: 0 }
    if (typeof window === 'undefined') return defaults
    const raw = window.localStorage.getItem('upmoney_activity')
    if (!raw) return defaults
    try {
      const parsed = JSON.parse(raw) as Partial<typeof defaults>
      return {
        assetsAdded: parsed.assetsAdded ?? defaults.assetsAdded,
        coursesOpened: parsed.coursesOpened ?? defaults.coursesOpened,
        expensesOpened: parsed.expensesOpened ?? defaults.expensesOpened,
      }
    } catch {
      return defaults
    }
  })
  const [assetsSummary, setAssetsSummary] = useState<AssetsSummaryPayload | null>(() => {
    if (typeof window === 'undefined') return null
    const summaryRaw = window.localStorage.getItem('upmoney_assets_summary')
    if (!summaryRaw) return null
    try {
      return normalizeAssetsSummaryPayload(JSON.parse(summaryRaw))
    } catch {
      return null
    }
  })
  const [assetsPreviousMonthBase, setAssetsPreviousMonthBase] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null
    const raw = window.localStorage.getItem('upmoney_assets_previous_month_base')
    const parsed = Number(raw)
    return Number.isFinite(parsed) ? parsed : null
  })
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [evolutionDataVersion, setEvolutionDataVersion] = useState(0)
  const [expensesSheetDataVersion, setExpensesSheetDataVersion] = useState(0)
  const [evolutionEditorOpen, setEvolutionEditorOpen] = useState(false)
  const [evolutionMonthPickerOpen, setEvolutionMonthPickerOpen] = useState(false)
  const [evolutionActiveYear, setEvolutionActiveYear] = useState(() => {
    if (typeof window === 'undefined') return new Date().getFullYear()
    const raw = Number(window.localStorage.getItem(EVOLUTION_ACTIVE_YEAR_STORAGE_KEY))
    return clampEvolutionYear(raw)
  })
  const [evolutionEditorYear, setEvolutionEditorYear] = useState(() => {
    if (typeof window === 'undefined') return new Date().getFullYear()
    const raw = Number(window.localStorage.getItem(EVOLUTION_ACTIVE_YEAR_STORAGE_KEY))
    return clampEvolutionYear(raw)
  })
  const [evolutionEditorMonth, setEvolutionEditorMonth] = useState<EvolutionMonthKey>(
    () => EVOLUTION_MONTHS[new Date().getMonth()]?.key ?? 'jan'
  )
  const [evolutionEditorAssets, setEvolutionEditorAssets] = useState<EvolutionEditorAsset[]>([
    createEvolutionEditorAsset(),
  ])
  const [activeEvolutionBar, setActiveEvolutionBar] = useState<EvolutionMonthKey | null>(null)
  const evolutionTooltipHideTimeoutRef = useRef<number | null>(null)
  const evolutionChartRef = useRef<HTMLDivElement | null>(null)
  const [monthlyFlowTotals, setMonthlyFlowTotals] = useState<{
    income: number[]
    expense: number[]
  }>(() => ({
    income: EVOLUTION_MONTHS.map(() => 0),
    expense: EVOLUTION_MONTHS.map(() => 0),
  }))
  const [monthlyFlowBreakdown, setMonthlyFlowBreakdown] = useState<
    Array<{ income: FlowCategoryRow[]; expense: FlowCategoryRow[] }>
  >(() =>
    EVOLUTION_MONTHS.map(() => ({
      income: [],
      expense: [],
    }))
  )
  const [flowPeriod, setFlowPeriod] = useState<3 | 6 | 12>(12)
  const [flowLegend, setFlowLegend] = useState({
    income: true,
    expense: true,
    saldo: true,
  })
  const [selectedFlowMonthIndex, setSelectedFlowMonthIndex] = useState<number | null>(null)
  const [flowTargetPct] = useState(70)
  const MODEL_DY_12M = 0.08

  const storageAvailable = typeof window !== 'undefined'
  const currentYear = new Date().getFullYear()
  const evolutionMonthKeys = useMemo(
    () => EVOLUTION_MONTHS.map((month) => month.key),
    []
  )
  const evolutionStorageScope = authUser?.id

  const readPendingEvolutionSheets = (userId: string): EvolutionSheetUpsertPayload[] => {
    if (!storageAvailable) return []
    const raw = window.localStorage.getItem(getEvolutionPendingStorageKey(userId))
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw) as unknown
      if (!Array.isArray(parsed)) return []
      return parsed
        .map((item) => {
          const source = (item ?? {}) as Record<string, unknown>
          const year = clampEvolutionYear(Number(source.year), currentYear)
          const rows = normalizeEvolutionRows(source.rows)
          const visibleRaw = Array.isArray(source.visible_months) ? source.visible_months : []
          const visible = Array.from(
            new Set(
              visibleRaw.filter(
                (month): month is EvolutionMonthKey =>
                  typeof month === 'string' &&
                  evolutionMonthKeys.includes(month as EvolutionMonthKey)
              )
            )
          )
          return {
            user_id: userId,
            year,
            rows,
            visible_months: visible.length ? visible : [...evolutionMonthKeys],
          }
        })
    } catch {
      return []
    }
  }

  const writePendingEvolutionSheets = (userId: string, items: EvolutionSheetUpsertPayload[]) => {
    if (!storageAvailable) return
    const key = getEvolutionPendingStorageKey(userId)
    if (!items.length) {
      window.localStorage.removeItem(key)
      return
    }
    window.localStorage.setItem(key, JSON.stringify(items))
  }

  const enqueuePendingEvolutionSheet = (payload: EvolutionSheetUpsertPayload) => {
    const current = readPendingEvolutionSheets(payload.user_id)
    const deduped = current.filter((item) => item.year !== payload.year)
    deduped.push(payload)
    writePendingEvolutionSheets(payload.user_id, deduped)
  }

  const removePendingEvolutionSheet = (userId: string, year: number) => {
    const current = readPendingEvolutionSheets(userId)
    const next = current.filter((item) => item.year !== year)
    writePendingEvolutionSheets(userId, next)
  }

  const upsertEvolutionSheetWithQueue = async (
    sb: NonNullable<typeof supabase>,
    payload: EvolutionSheetUpsertPayload
  ) => {
    const { error } = await sb.from('evolution_sheets').upsert(payload, {
      onConflict: 'user_id,year',
    })
    if (error) {
      enqueuePendingEvolutionSheet(payload)
      return false
    }
    removePendingEvolutionSheet(payload.user_id, payload.year)
    return true
  }

  const flushPendingEvolutionSheets = async (
    sb: NonNullable<typeof supabase>,
    userId: string
  ) => {
    const pending = readPendingEvolutionSheets(userId).sort((a, b) => a.year - b.year)
    if (!pending.length) return

    const remaining: EvolutionSheetUpsertPayload[] = []
    for (const payload of pending) {
      const { error } = await sb.from('evolution_sheets').upsert(payload, {
        onConflict: 'user_id,year',
      })
      if (error) {
        remaining.push(payload)
      }
    }
    writePendingEvolutionSheets(userId, remaining)
  }

  const parseEvolutionRowsFromStorage = (year: number): EvolutionStorageRow[] => {
    if (!storageAvailable) return []
    return readEvolutionRowsForYear(window.localStorage, year, {
      scope: evolutionStorageScope,
    })
  }

  const readStoredEvolutionActiveYear = () => {
    if (!storageAvailable) return currentYear
    const raw = Number(window.localStorage.getItem(EVOLUTION_ACTIVE_YEAR_STORAGE_KEY))
    return clampEvolutionYear(raw, currentYear)
  }

  const setSharedEvolutionYear = (year: number) => {
    const nextYear = clampEvolutionYear(year, currentYear)
    setEvolutionActiveYear(nextYear)
    if (storageAvailable) {
      window.localStorage.setItem(EVOLUTION_ACTIVE_YEAR_STORAGE_KEY, String(nextYear))
    }
    return nextYear
  }

  const computeEvolutionTotals = (rows: EvolutionStorageRow[]) =>
    EVOLUTION_MONTHS.map((month) =>
      rows.reduce((sum, row) => sum + parsePtBrNumber(row[month.key]), 0)
    )

  const refreshEvolutionDashboard = (preferredYear?: number) => {
    if (!storageAvailable) return
    const targetYear =
      preferredYear != null
        ? clampEvolutionYear(preferredYear, currentYear)
        : readStoredEvolutionActiveYear()

    if (targetYear !== evolutionActiveYear) {
      setEvolutionActiveYear(targetYear)
    }
    if (targetYear !== evolutionEditorYear) {
      setEvolutionEditorYear(targetYear)
    }
    setEvolutionDataVersion((prev) => prev + 1)
  }

  const clearEvolutionTooltipHideTimer = () => {
    if (typeof window === 'undefined') return
    if (evolutionTooltipHideTimeoutRef.current === null) return
    window.clearTimeout(evolutionTooltipHideTimeoutRef.current)
    evolutionTooltipHideTimeoutRef.current = null
  }

  const showEvolutionBarTooltip = (month: EvolutionMonthKey) => {
    clearEvolutionTooltipHideTimer()
    setActiveEvolutionBar(month)
  }

  const toggleEvolutionBarTooltip = (month: EvolutionMonthKey) => {
    clearEvolutionTooltipHideTimer()
    setActiveEvolutionBar((current) => (current === month ? null : month))
  }

  const scheduleHideEvolutionBarTooltip = (delayMs = 900) => {
    if (typeof window === 'undefined') return
    clearEvolutionTooltipHideTimer()
    evolutionTooltipHideTimeoutRef.current = window.setTimeout(() => {
      setActiveEvolutionBar(null)
      evolutionTooltipHideTimeoutRef.current = null
    }, delayMs)
  }

  const resolveEvolutionMonthFromTouch = (touchPoint: {
    clientX: number
    clientY: number
  }): EvolutionMonthKey | null => {
    if (typeof document === 'undefined') return null
    const target = document.elementFromPoint(touchPoint.clientX, touchPoint.clientY)
    if (!(target instanceof Element)) return null
    const column = target.closest('.evolution-col')
    const month = column?.getAttribute('data-month')
    if (!month) return null
    return evolutionMonthKeys.includes(month as EvolutionMonthKey) ? (month as EvolutionMonthKey) : null
  }

  const persistEvolutionRows = (rows: EvolutionStorageRow[]) => {
    if (!storageAvailable) return
    const savedYear = evolutionEditorYear
    writeEvolutionRowsForYear(window.localStorage, savedYear, rows, evolutionStorageScope)
    const currentVisibleMonths = readEvolutionVisibleMonthsForYear(
      window.localStorage,
      savedYear,
      evolutionStorageScope
    )
    const nextVisibleMonths = currentVisibleMonths.includes(evolutionEditorMonth)
      ? currentVisibleMonths
      : [...currentVisibleMonths, evolutionEditorMonth]
    writeEvolutionVisibleMonthsForYear(
      window.localStorage,
      savedYear,
      nextVisibleMonths,
      evolutionStorageScope
    )

    if (!supabaseConfigMissing && supabase && authUser?.id) {
      const sb = supabase
      const userId = authUser.id
      const payload: EvolutionSheetUpsertPayload = {
        user_id: userId,
        year: savedYear,
        rows,
        visible_months: nextVisibleMonths,
      }
      void upsertEvolutionSheetWithQueue(sb, payload)
    }

    setSharedEvolutionYear(savedYear)
    notifyEvolutionDataChanged(savedYear)
    setEvolutionDataVersion((prev) => prev + 1)
  }

  const evolutionMonthlyTotals = useMemo(() => {
    if (!storageAvailable) {
      return EVOLUTION_MONTHS.map(() => 0)
    }
    const rows = readEvolutionRowsForYear(window.localStorage, evolutionActiveYear, {
      scope: evolutionStorageScope,
    })
    const visibleMonths = new Set(
      readEvolutionVisibleMonthsForYear(
        window.localStorage,
        evolutionActiveYear,
        evolutionStorageScope
      )
    )
    if (!rows.length) {
      return EVOLUTION_MONTHS.map(() => 0)
    }
    return computeEvolutionTotals(rows).map((value, index) =>
      visibleMonths.has(EVOLUTION_MONTHS[index]!.key) ? value : 0
    )
  }, [activePage, storageAvailable, evolutionActiveYear, evolutionDataVersion, evolutionStorageScope])

  const visibleEvolutionChartMonths = useMemo(() => {
    if (!storageAvailable) return EVOLUTION_MONTHS
    const visible = new Set(
      readEvolutionVisibleMonthsForYear(
        window.localStorage,
        evolutionActiveYear,
        evolutionStorageScope
      )
    )
    return EVOLUTION_MONTHS.filter((month) => visible.has(month.key))
  }, [storageAvailable, evolutionActiveYear, evolutionDataVersion, evolutionStorageScope])

  const buildEditorAssetsForMonth = (
    rows: EvolutionStorageRow[],
    month: EvolutionMonthKey
  ): EvolutionEditorAsset[] => {
    const assets = rows
      .filter((row) => row[month].trim())
      .map((row) => ({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        sourceId: row.id,
        name: row.name,
        value: row[month],
      }))

    return assets.length ? assets : [createEvolutionEditorAsset()]
  }

  const evolutionEditorMonthLabel = useMemo(() => {
    const month = EVOLUTION_MONTHS.find((item) => item.key === evolutionEditorMonth)
    return `${month?.label ?? 'Jan'}/${evolutionEditorYear}`
  }, [evolutionEditorMonth, evolutionEditorYear])

  const openEvolutionEditor = (
    month = evolutionEditorMonth,
    year = evolutionActiveYear
  ) => {
    const rows = parseEvolutionRowsFromStorage(year)
    setSharedEvolutionYear(year)
    setEvolutionEditorYear(year)
    setEvolutionEditorMonth(month)
    setEvolutionEditorAssets(buildEditorAssetsForMonth(rows, month))
    setEvolutionEditorOpen(true)
  }

  const updateEvolutionEditorAsset = (
    id: string,
    field: 'name' | 'value',
    value: string
  ) => {
    setEvolutionEditorAssets((prev) =>
      prev.map((asset) =>
        asset.id === id
          ? {
              ...asset,
              [field]: field === 'value' ? sanitizeCurrencyLike(value) : value,
            }
          : asset
      )
    )
  }

  const addEvolutionEditorAsset = () => {
    setEvolutionEditorAssets((prev) => [...prev, createEvolutionEditorAsset()])
  }

  const removeEvolutionEditorAsset = (id: string) => {
    setEvolutionEditorAssets((prev) => {
      const next = prev.filter((asset) => asset.id !== id)
      return next.length ? next : [createEvolutionEditorAsset()]
    })
  }

  const loadEvolutionEditorMonth = (month: EvolutionMonthKey) => {
    const rows = parseEvolutionRowsFromStorage(evolutionEditorYear)
    setEvolutionEditorMonth(month)
    setEvolutionEditorAssets(buildEditorAssetsForMonth(rows, month))
  }

  const loadEvolutionEditorYear = (year: number) => {
    const nextYear = setSharedEvolutionYear(year)
    const rows = parseEvolutionRowsFromStorage(nextYear)
    setEvolutionEditorYear(nextYear)
    setEvolutionEditorAssets(buildEditorAssetsForMonth(rows, evolutionEditorMonth))
  }

  const shiftEvolutionEditorYear = (direction: -1 | 1) => {
    loadEvolutionEditorYear(evolutionEditorYear + direction)
  }

  const copyEvolutionFromPreviousMonth = () => {
    const monthIndex = EVOLUTION_MONTHS.findIndex((month) => month.key === evolutionEditorMonth)
    const prevIndex = monthIndex <= 0 ? EVOLUTION_MONTHS.length - 1 : monthIndex - 1
    const previousMonth = EVOLUTION_MONTHS[prevIndex]?.key ?? 'jan'
    const sourceYear = monthIndex <= 0 ? evolutionEditorYear - 1 : evolutionEditorYear
    const rows = parseEvolutionRowsFromStorage(sourceYear)
    setEvolutionEditorAssets(buildEditorAssetsForMonth(rows, previousMonth))
  }

  const clearEvolutionEditorMonth = () => {
    setEvolutionEditorAssets([createEvolutionEditorAsset()])
  }

  const saveEvolutionEditor = () => {
    const rows = parseEvolutionRowsFromStorage(evolutionEditorYear)
    const nextRows = rows.map((row) => ({ ...row, [evolutionEditorMonth]: '' }))
    const usedTargetIds = new Set<string>()

    const normalizeAssetName = (value: string) =>
      value
        .trim()
        .toLocaleLowerCase('pt-BR')
        .replace(/\s+/g, ' ')

    const upsertRow = (assetName: string, sourceId?: string) => {
      if (sourceId) {
        const existing = nextRows.find((row) => row.id === sourceId)
        if (existing && !usedTargetIds.has(existing.id)) {
          usedTargetIds.add(existing.id)
          return existing
        }
      }

      const normalizedName = normalizeAssetName(assetName)
      if (normalizedName) {
        const existingByName = nextRows.find(
          (row) =>
            !usedTargetIds.has(row.id) && normalizeAssetName(row.name) === normalizedName
        )
        if (existingByName) {
          usedTargetIds.add(existingByName.id)
          return existingByName
        }
      }

      const created = createEvolutionStorageRow()
      nextRows.push(created)
      usedTargetIds.add(created.id)
      return created
    }

    for (const asset of evolutionEditorAssets) {
      const name = asset.name.trim()
      const value = sanitizeCurrencyLike(asset.value)
      if (!name && !value) continue
      const target = upsertRow(name, asset.sourceId)
      target.name = name || target.name
      target[evolutionEditorMonth] = value
    }

    const prunedRows = nextRows.filter((row) => {
      if (row.name.trim()) return true
      return EVOLUTION_MONTHS.some((month) => row[month.key].trim())
    })

    persistEvolutionRows(prunedRows)
    setEvolutionMonthPickerOpen(false)
    setEvolutionEditorOpen(false)
  }

  const evolutionEditorMonthTotal = evolutionEditorAssets.reduce(
    (sum, asset) => sum + parsePtBrNumber(asset.value),
    0
  )

  const writeActivity = (next: ActivityCounts) => {
    if (!storageAvailable) return
    try {
      window.localStorage.setItem('upmoney_activity', JSON.stringify(next))
    } catch {
      // Ignore storage failures (common in restricted mobile/private contexts).
    }

    if (supabaseConfigMissing || !supabase || !authUser?.id) return
    void supabase.from('user_activity_stats').upsert(
      {
        user_id: authUser.id,
        assets_added: next.assetsAdded,
        courses_opened: next.coursesOpened,
        expenses_opened: next.expensesOpened,
      },
      { onConflict: 'user_id' }
    )
  }

  const incrementActivity = (key: keyof typeof activityCounts) => {
    setActivityCounts((prev) => {
      const next = { ...prev, [key]: prev[key] + 1 }
      writeActivity(next)
      return next
    })
  }

  const logNavigationTelemetry = (payload: {
    source: string
    action: 'navigate' | 'menu'
    from: AppPage
    to: AppPage
    ok: boolean
    detail?: string
  }) => {
    if (!storageAvailable) return
    try {
      const raw = window.localStorage.getItem(NAV_TELEMETRY_STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : []
      const events = Array.isArray(parsed) ? parsed : []
      events.push({
        ...payload,
        timestamp: new Date().toISOString(),
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        userAgent: window.navigator.userAgent,
      })
      window.localStorage.setItem(
        NAV_TELEMETRY_STORAGE_KEY,
        JSON.stringify(events.slice(-200))
      )
    } catch {
      // Do not block app flow when telemetry fails.
    }
  }

  const setSidebarOpen = (open: boolean, source: string) => {
    setIsSidebarOpen(open)
    logNavigationTelemetry({
      source,
      action: 'menu',
      from: activePage,
      to: activePage,
      ok: true,
      detail: open ? 'open' : 'close',
    })
  }

  const navigate = (page: AppPage, source = 'app') => {
    const from = activePage
    try {
      setActivePage(page)
      logNavigationTelemetry({
        source,
        action: 'navigate',
        from,
        to: page,
        ok: true,
      })
      if (!storageAvailable) return
      if (
        page === 'courses' ||
        page === 'course1' ||
        page === 'course2' ||
        page === 'course3'
      ) {
        incrementActivity('coursesOpened')
      }
      if (page === 'expenses') {
        incrementActivity('expensesOpened')
      }
    } catch (error) {
      logNavigationTelemetry({
        source,
        action: 'navigate',
        from,
        to: page,
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
      })
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const isMobile = window.matchMedia('(max-width: 720px)').matches
    const target = contentRef.current
    requestAnimationFrame(() => {
      if (!isMobile || !target) {
        return
      }
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [activePage])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(max-width: 720px)')
    const syncSidebar = (event: MediaQueryList | MediaQueryListEvent) => {
      setIsSidebarOpen(event.matches)
    }
    syncSidebar(media)
    media.addEventListener('change', syncSidebar)
    return () => media.removeEventListener('change', syncSidebar)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const isMobile = window.matchMedia('(max-width: 720px)').matches
    if (!isMobile) {
      document.body.classList.remove('menu-open')
      return
    }
    if (isSidebarOpen) {
      document.body.classList.add('menu-open')
    } else {
      document.body.classList.remove('menu-open')
    }
  }, [isSidebarOpen])

  useEffect(() => {
    if (!storageAvailable) return
    const timer = window.setTimeout(async () => {
      const readLocalFallback = () => {
        const summaryRaw = window.localStorage.getItem('upmoney_assets_summary')
        if (!summaryRaw) {
          setAssetsSummary(null)
          return
        }
        try {
          setAssetsSummary(normalizeAssetsSummaryPayload(JSON.parse(summaryRaw)))
        } catch {
          setAssetsSummary(null)
        }
      }

      if (supabaseConfigMissing || !supabase || !authUser?.id) {
        readLocalFallback()
        return
      }

      const { data, error } = await supabase
        .from('user_assets_summary')
        .select('updated_at, summary')
        .eq('user_id', authUser.id)
        .maybeSingle()

      if (error || !data) {
        readLocalFallback()
        return
      }

      const payload = normalizeAssetsSummaryPayload({
        updatedAt:
          typeof data.updated_at === 'string'
            ? data.updated_at
            : new Date().toISOString(),
        summary: data.summary,
      })

      if (!payload) {
        readLocalFallback()
        return
      }

      setAssetsSummary(payload)
      window.localStorage.setItem('upmoney_assets_summary', JSON.stringify(payload))
    }, 0)
    return () => window.clearTimeout(timer)
  }, [activePage, authUser?.id, storageAvailable])

  useEffect(() => {
    if (!storageAvailable) return
    const timer = window.setTimeout(async () => {
      const readLocalFallback = () => {
        const raw = window.localStorage.getItem('upmoney_assets_previous_month_base')
        const parsed = Number(raw)
        setAssetsPreviousMonthBase(Number.isFinite(parsed) ? parsed : null)
      }

      if (supabaseConfigMissing || !supabase || !authUser?.id) {
        readLocalFallback()
        return
      }

      const { data, error } = await supabase
        .from('positions')
        .select('id, symbol, asset_type, currency, trade_side, quantity, entry_price, entry_date, created_at')
        .eq('user_id', authUser.id)

      if (error || !data) {
        readLocalFallback()
        return
      }

      const base = getPreviousMonthInvestmentBase(data as DashboardPositionRow[])
      setAssetsPreviousMonthBase(base)
      window.localStorage.setItem('upmoney_assets_previous_month_base', String(base))
    }, 0)

    return () => window.clearTimeout(timer)
  }, [activePage, authUser?.id, storageAvailable])

  useEffect(() => {
    if (!storageAvailable || supabaseConfigMissing || !supabase || !authUser?.id) return
    const sb = supabase
    let cancelled = false
    const syncActivity = async () => {
      const { data, error } = await sb
        .from('user_activity_stats')
        .select('assets_added, courses_opened, expenses_opened')
        .eq('user_id', authUser.id)
        .maybeSingle()

      if (cancelled) return

      if (error || !data) {
        void sb.from('user_activity_stats').upsert(
          {
            user_id: authUser.id,
            assets_added: activityCounts.assetsAdded,
            courses_opened: activityCounts.coursesOpened,
            expenses_opened: activityCounts.expensesOpened,
          },
          { onConflict: 'user_id' }
        )
        return
      }

      const remote = normalizeActivityCountsFromDb(data)
      if (!remote) return
      setActivityCounts(remote)
      try {
        window.localStorage.setItem('upmoney_activity', JSON.stringify(remote))
      } catch {
        // ignore local cache failures
      }
    }

    void syncActivity()
    return () => {
      cancelled = true
    }
  }, [authUser?.id, storageAvailable])

  useEffect(() => {
    if (!storageAvailable) return
    const timer = window.setTimeout(() => {
      refreshEvolutionDashboard()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [activePage, storageAvailable, evolutionActiveYear, evolutionEditorYear])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleEvolutionChange = (event: Event) => {
      const custom = event as CustomEvent<{ year?: number }>
      refreshEvolutionDashboard(custom.detail?.year)
    }
    window.addEventListener(EVOLUTION_DATA_CHANGED_EVENT, handleEvolutionChange as EventListener)
    return () =>
      window.removeEventListener(
        EVOLUTION_DATA_CHANGED_EVENT,
        handleEvolutionChange as EventListener
      )
  }, [storageAvailable, evolutionActiveYear, evolutionEditorYear])

  useEffect(
    () => () => {
      clearEvolutionTooltipHideTimer()
    },
    []
  )

  useEffect(() => {
    if (
      !storageAvailable ||
      supabaseConfigMissing ||
      !supabase ||
      !authUser?.id
    ) {
      return
    }

    const sb = supabase
    const userId = authUser.id
    let cancelled = false
    const targetYears = Array.from(
      new Set(
        [currentYear - 1, currentYear, evolutionActiveYear, evolutionEditorYear].map((year) =>
          clampEvolutionYear(year, currentYear)
        )
      )
    )

    const syncEvolutionSheets = async () => {
      await flushPendingEvolutionSheets(sb, userId)
      const pendingYears = new Set(
        readPendingEvolutionSheets(userId).map((item) =>
          clampEvolutionYear(item.year, currentYear)
        )
      )

      const { data, error } = await sb
        .from('evolution_sheets')
        .select('year, rows, visible_months')
        .eq('user_id', userId)
        .in('year', targetYears)

      if (cancelled || error) return

      const remoteByYear = new Map<number, EvolutionSheetRecord>()
      for (const row of (data ?? []) as EvolutionSheetRecord[]) {
        remoteByYear.set(clampEvolutionYear(Number(row.year), currentYear), row)
      }

      for (const year of targetYears) {
        const remote = remoteByYear.get(year)
        if (!remote) continue

        const remoteRowsPayload =
          typeof remote.rows === 'string'
            ? (() => {
                try {
                  return JSON.parse(remote.rows)
                } catch {
                  return []
                }
              })()
            : remote.rows

        const remoteRows = normalizeEvolutionRows(remoteRowsPayload)
        writeEvolutionRowsForYear(window.localStorage, year, remoteRows, evolutionStorageScope)

        const remoteVisibleRaw = Array.isArray(remote.visible_months)
          ? remote.visible_months
          : []
        const remoteVisible = Array.from(
          new Set(
            remoteVisibleRaw.filter(
              (item): item is EvolutionMonthKey =>
                typeof item === 'string' &&
                evolutionMonthKeys.includes(item as EvolutionMonthKey)
            )
          )
        )
        writeEvolutionVisibleMonthsForYear(
          window.localStorage,
          year,
          remoteVisible.length ? remoteVisible : evolutionMonthKeys,
          evolutionStorageScope
        )
      }

      for (const year of targetYears) {
        if (remoteByYear.has(year) || pendingYears.has(year)) continue
        writeEvolutionRowsForYear(window.localStorage, year, [], evolutionStorageScope)
        writeEvolutionVisibleMonthsForYear(
          window.localStorage,
          year,
          evolutionMonthKeys,
          evolutionStorageScope
        )
      }

      // If the current active year has no content, move focus to the newest year with remote data.
      const activeYearRows = readEvolutionRowsForYear(window.localStorage, evolutionActiveYear, {
        scope: evolutionStorageScope,
      })
      if (!hasEvolutionContent(activeYearRows, evolutionMonthKeys)) {
        const remoteYearsWithData = Array.from(remoteByYear.entries())
          .map(([year, row]) => {
            const payload =
              typeof row.rows === 'string'
                ? (() => {
                    try {
                      return JSON.parse(row.rows)
                    } catch {
                      return []
                    }
                  })()
                : row.rows
            const normalized = normalizeEvolutionRows(payload)
            return hasEvolutionContent(normalized, evolutionMonthKeys) ? year : null
          })
          .filter((year): year is number => year != null)

        if (remoteYearsWithData.length) {
          const nextYear = Math.max(...remoteYearsWithData)
          setSharedEvolutionYear(nextYear)
          setEvolutionEditorYear(nextYear)
        }
      }

      if (!cancelled) {
        notifyEvolutionDataChanged(readStoredEvolutionActiveYear())
        setEvolutionDataVersion((prev) => prev + 1)
      }
    }

    void syncEvolutionSheets()

    return () => {
      cancelled = true
    }
  }, [
    authUser?.id,
    currentYear,
    evolutionActiveYear,
    evolutionEditorYear,
    evolutionMonthKeys,
    evolutionStorageScope,
    storageAvailable,
  ])

  useEffect(() => {
    if (
      !storageAvailable ||
      supabaseConfigMissing ||
      !supabase ||
      !authUser?.id
    ) {
      return
    }

    const sb = supabase
    const userId = authUser.id
    let cancelled = false

    const flushNow = async () => {
      if (cancelled) return
      await flushPendingEvolutionSheets(sb, userId)
    }

    const handleOnline = () => {
      void flushNow()
    }
    const handleFocus = () => {
      void flushNow()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('focus', handleFocus)
    void flushNow()

    return () => {
      cancelled = true
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('focus', handleFocus)
    }
  }, [authUser?.id, storageAvailable])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleExpensesSheetChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ year?: number } | undefined>).detail
      const changedYear = typeof detail?.year === 'number' ? detail.year : null
      const currentYear = new Date().getFullYear()
      if (changedYear != null && changedYear !== currentYear) return
      setExpensesSheetDataVersion((prev) => prev + 1)
    }

    window.addEventListener(
      EXPENSES_SHEET_CHANGED_EVENT,
      handleExpensesSheetChanged as EventListener
    )
    return () =>
      window.removeEventListener(
        EXPENSES_SHEET_CHANGED_EVENT,
        handleExpensesSheetChanged as EventListener
      )
  }, [])

  useEffect(() => {
    if (!storageAvailable || supabaseConfigMissing || !supabase) {
      setMonthlyFlowTotals({
        income: EVOLUTION_MONTHS.map(() => 0),
        expense: EVOLUTION_MONTHS.map(() => 0),
      })
      setMonthlyFlowBreakdown(
        EVOLUTION_MONTHS.map(() => ({
          income: [],
          expense: [],
        }))
      )
      return
    }
    const sb = supabase
    let cancelled = false
    const timer = window.setTimeout(async () => {
      const {
        data: { user },
        error: userError,
      } = await sb.auth.getUser()
      if (cancelled || userError || !user) {
        return
      }

      const currentYear = new Date().getFullYear()
      const { data, error } = await sb
        .from('expenses_sheets')
        .select('rows')
        .eq('user_id', user.id)
        .eq('year', currentYear)
        .maybeSingle()

      if (cancelled || error || !data?.rows) {
        setMonthlyFlowTotals({
          income: EVOLUTION_MONTHS.map(() => 0),
          expense: EVOLUTION_MONTHS.map(() => 0),
        })
        setMonthlyFlowBreakdown(
          EVOLUTION_MONTHS.map(() => ({
            income: [],
            expense: [],
          }))
        )
        return
      }

      let rowsPayload: unknown = data.rows
      if (typeof rowsPayload === 'string') {
        try {
          rowsPayload = JSON.parse(rowsPayload)
        } catch {
          rowsPayload = null
        }
      }

      if (!Array.isArray(rowsPayload)) {
        setMonthlyFlowTotals({
          income: EVOLUTION_MONTHS.map(() => 0),
          expense: EVOLUTION_MONTHS.map(() => 0),
        })
        setMonthlyFlowBreakdown(
          EVOLUTION_MONTHS.map(() => ({
            income: [],
            expense: [],
          }))
        )
        return
      }

      const income = EVOLUTION_MONTHS.map(() => 0)
      const expense = EVOLUTION_MONTHS.map(() => 0)
      const breakdownByMonth = EVOLUTION_MONTHS.map(() => ({
        income: new Map<string, number>(),
        expense: new Map<string, number>(),
      }))
      rowsPayload.forEach((raw) => {
        const row = (raw ?? {}) as ExpensesSheetRow
        if (row.type !== 'income' && row.type !== 'expense') return
        const values = Array.isArray(row.values) ? row.values : []
        const label = typeof row.label === 'string' && row.label.trim()
          ? row.label.trim()
          : row.type === 'income'
            ? 'Receitas diversas'
            : 'Despesas diversas'
        values.forEach((value, index) => {
          if (index < 0 || index >= EVOLUTION_MONTHS.length) return
          const parsed = parsePtBrNumber(value)
          if (!parsed) return
          if (row.type === 'income') {
            income[index] += parsed
            const current = breakdownByMonth[index].income.get(label) ?? 0
            breakdownByMonth[index].income.set(label, current + parsed)
            return
          }
          expense[index] += parsed
          const current = breakdownByMonth[index].expense.get(label) ?? 0
          breakdownByMonth[index].expense.set(label, current + parsed)
        })
      })

      if (!cancelled) {
        setMonthlyFlowTotals({ income, expense })
        setMonthlyFlowBreakdown(
          breakdownByMonth.map((month) => ({
            income: Array.from(month.income.entries())
              .map(([label, value]) => ({ label, value }))
              .sort((a, b) => b.value - a.value)
              .slice(0, 5),
            expense: Array.from(month.expense.entries())
              .map(([label, value]) => ({ label, value }))
              .sort((a, b) => b.value - a.value)
              .slice(0, 5),
          }))
        )
      }
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [activePage, storageAvailable, expensesSheetDataVersion])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    if (supabaseConfigMissing || !supabase) {
      const timer = window.setTimeout(() => setAuthLoading(false), 0)
      return () => window.clearTimeout(timer)
    }
    const sb = supabase

    const maybePersistMissingName = async (user: SupabaseAuthUser, allowPrompt = true) => {
      const currentName = resolveAuthUserName(user.user_metadata)
      if (currentName) return currentName
      if (!allowPrompt || askedNameForUserRef.current === user.id) return undefined
      askedNameForUserRef.current = user.id

      const suggestedName = fallbackNameFromEmail(user.email ?? undefined)
      const answer = window.prompt(
        'Como você gostaria de ser chamado no Upmoney?',
        suggestedName
      )
      const trimmedName = answer?.trim()
      if (!trimmedName) return undefined

      const { error } = await sb.auth.updateUser({
        data: {
          ...(user.user_metadata ?? {}),
          full_name: trimmedName,
        },
      })

      return error ? undefined : trimmedName
    }

    const syncAuthUser = async () => {
      const { data } = await sb.auth.getUser()
      const user = data.user
      if (!user) {
        setAuthUser(null)
        setAuthLoading(false)
        return
      }

      const name = resolveAuthUserName(user.user_metadata) ?? (await maybePersistMissingName(user))
      setAuthUser({
        id: user.id,
        email: user.email ?? undefined,
        name,
      })
      setAuthLoading(false)
    }

    void syncAuthUser()

    const { data: authListener } = sb.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setPasswordRecoveryMode(true)
        }
        const user = session?.user
        if (!user) {
          setAuthUser(null)
          return
        }

        const currentName = resolveAuthUserName(user.user_metadata)
        setAuthUser({
          id: user.id,
          email: user.email ?? undefined,
          name: currentName,
        })

        if (!currentName && event !== 'PASSWORD_RECOVERY') {
          void maybePersistMissingName(user).then((savedName) => {
            if (!savedName) return
            setAuthUser((prev) =>
              prev && prev.id === user.id
                ? {
                    ...prev,
                    name: savedName,
                  }
                : prev
            )
          })
        }
      }
    )
    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])


  const course1Progress = getProgressPercent(
    completedModulesCourse1,
    COURSES.course1.modules.length
  )
  const course2Progress = getProgressPercent(
    completedModulesCourse2,
    COURSES.course2.modules.length
  )
  const course3Progress = getProgressPercent(
    completedModulesCourse3,
    COURSES.course3.modules.length
  )

  const overallCourseProgress = Math.round(
    (course1Progress + course2Progress + course3Progress) / 3
  )

  const requiredCapital =
    dividendGoal && dividendGoal > 0
      ? (dividendGoal * 12) / MODEL_DY_12M
      : null

  const portfolioTypeSummary = assetsSummary?.summary ?? []
  const dashboardInvestmentsTotal = useMemo(
    () => portfolioTypeSummary.reduce((sum, item) => sum + (Number(item.value) || 0), 0),
    [portfolioTypeSummary]
  )
  const investmentsVsPreviousMonthPct =
    assetsPreviousMonthBase != null && assetsPreviousMonthBase > 0
      ? ((dashboardInvestmentsTotal - assetsPreviousMonthBase) / assetsPreviousMonthBase) * 100
      : null

  const healthScore = useMemo(() => {
    const courseScore = Math.min(overallCourseProgress, 100) * 0.4
    const assetsScore = Math.min(activityCounts.assetsAdded * 10, 100) * 0.3
    const expensesScore = Math.min(activityCounts.expensesOpened * 10, 100) * 0.3
    return Math.round(courseScore + assetsScore + expensesScore)
  }, [overallCourseProgress, activityCounts])
  const maxEvolutionTotal = Math.max(...evolutionMonthlyTotals, 0)
  const allFlowMonths = useMemo(() => {
    return EVOLUTION_MONTHS.map((month, index) => {
      const income = monthlyFlowTotals.income[index] ?? 0
      const expense = monthlyFlowTotals.expense[index] ?? 0
      return {
        ...month,
        index,
        income,
        expense,
      }
    })
  }, [monthlyFlowTotals])
  const flowMonths = useMemo(() => {
    const currentMonthIndex = new Date().getMonth()
    const lastMonthWithData = allFlowMonths.reduce((lastIndex, month) => {
      if (month.income > 0 || month.expense > 0) return month.index
      return lastIndex
    }, -1)
    const endIndex = Math.max(currentMonthIndex, lastMonthWithData)
    const start = Math.max(endIndex - (flowPeriod - 1), 0)
    return allFlowMonths.slice(start, endIndex + 1)
  }, [allFlowMonths, flowPeriod])
  const maxFlowValue = Math.max(
    ...flowMonths.map((item) => Math.max(item.income, item.expense)),
    0
  )
  const flowHasData = flowMonths.some((item) => item.income > 0 || item.expense > 0)
  const flowAxisTicks = [1, 0.75, 0.5, 0.25, 0].map((ratio) =>
    Math.round(maxFlowValue * ratio)
  )
  const flowSaldoByMonth = flowMonths.map((item) => item.income - item.expense)
  const flowSaldoMin = Math.min(...flowSaldoByMonth, 0)
  const flowSaldoMax = Math.max(...flowSaldoByMonth, 0)
  const flowSaldoRange = flowSaldoMax - flowSaldoMin || 1
  const flowSaldoPoints = flowSaldoByMonth
    .map((value, index) => {
      const x = flowMonths.length > 1 ? (index / (flowMonths.length - 1)) * 100 : 50
      const y = 100 - ((value - flowSaldoMin) / flowSaldoRange) * 100
      return `${x},${y}`
    })
    .join(' ')
  const flowSaldoZeroY = 100 - ((0 - flowSaldoMin) / flowSaldoRange) * 100
  const flowTargetPoints = flowMonths
    .map((item, index) => {
      const target = item.income * (flowTargetPct / 100)
      const x = flowMonths.length > 1 ? (index / (flowMonths.length - 1)) * 100 : 50
      const y = 100 - ((target - flowSaldoMin) / flowSaldoRange) * 100
      return `${x},${y}`
    })
    .join(' ')
  const flowIncomeTotal = flowMonths.reduce((sum, item) => sum + item.income, 0)
  const flowExpenseTotal = flowMonths.reduce((sum, item) => sum + item.expense, 0)
  const flowNet = flowIncomeTotal - flowExpenseTotal
  const flowExpensePct =
    flowIncomeTotal > 0 ? Math.round((flowExpenseTotal / flowIncomeTotal) * 100) : null
  const flowIncomeAvg = flowIncomeTotal / Math.max(flowMonths.length, 1)
  const flowExpenseAvg = flowExpenseTotal / Math.max(flowMonths.length, 1)
  const flowBestMonth = flowMonths.reduce(
    (best, item) =>
      item.income - item.expense > best.income - best.expense ? item : best,
    flowMonths[0]
  )
  const flowWorstMonth = flowMonths.reduce(
    (worst, item) =>
      item.income - item.expense < worst.income - worst.expense ? item : worst,
    flowMonths[0]
  )
  const currentMonthIndex = new Date().getMonth()
  const monthsElapsedInYear = currentMonthIndex + 1
  const ytdIncomeTotalForAverage = monthlyFlowTotals.income
    .slice(0, monthsElapsedInYear)
    .reduce((sum, value) => sum + value, 0)
  const ytdExpenseTotalForAverage = monthlyFlowTotals.expense
    .slice(0, monthsElapsedInYear)
    .reduce((sum, value) => sum + value, 0)
  const averageMonthlyIncomeYtd = ytdIncomeTotalForAverage / Math.max(monthsElapsedInYear, 1)
  const averageMonthlyExpenseYtd = ytdExpenseTotalForAverage / Math.max(monthsElapsedInYear, 1)
  const ytdAverageLabel = 'Média mês'
  const currentMonthIncome = monthlyFlowTotals.income[currentMonthIndex] ?? 0
  const previousMonthIncome = currentMonthIndex > 0 ? (monthlyFlowTotals.income[currentMonthIndex - 1] ?? 0) : 0
  const currentMonthExpense = monthlyFlowTotals.expense[currentMonthIndex] ?? 0
  const previousMonthExpense =
    currentMonthIndex > 0 ? (monthlyFlowTotals.expense[currentMonthIndex - 1] ?? 0) : 0
  const incomeVsPreviousPct =
    currentMonthIndex > 0 && previousMonthIncome > 0
      ? ((currentMonthIncome - previousMonthIncome) / previousMonthIncome) * 100
      : null
  const expenseVsPreviousPct =
    currentMonthIndex > 0 && previousMonthExpense > 0
      ? ((currentMonthExpense - previousMonthExpense) / previousMonthExpense) * 100
      : null
  const flowAnomalyStats = useMemo(() => {
    const avgIncome =
      flowMonths.reduce((sum, item) => sum + item.income, 0) / Math.max(flowMonths.length, 1)
    const avgExpense =
      flowMonths.reduce((sum, item) => sum + item.expense, 0) / Math.max(flowMonths.length, 1)
    const monthsOverTarget = flowMonths.filter(
      (item) => item.income > 0 && (item.expense / item.income) * 100 > flowTargetPct
    ).length
    const anomalousMonths = flowMonths.filter((item) => {
      const highExpense = avgExpense > 0 && item.expense > avgExpense * 1.25
      const lowIncome = avgIncome > 0 && item.income < avgIncome * 0.75
      return highExpense || lowIncome
    }).length
    return { monthsOverTarget, anomalousMonths }
  }, [flowMonths, flowTargetPct])
  const selectedFlowMonth =
    selectedFlowMonthIndex !== null
      ? flowMonths.find((month) => month.index === selectedFlowMonthIndex) ?? null
      : null
  const selectedFlowBreakdown =
    selectedFlowMonthIndex !== null ? monthlyFlowBreakdown[selectedFlowMonthIndex] : null
  const summaryMonthIndex = useMemo(() => {
    const visibleIndexes = visibleEvolutionChartMonths.map((month) =>
      EVOLUTION_MONTHS.findIndex((item) => item.key === month.key)
    )
    for (let idx = visibleIndexes.length - 1; idx >= 0; idx -= 1) {
      const monthIndex = visibleIndexes[idx]
      if (monthIndex >= 0 && (evolutionMonthlyTotals[monthIndex] ?? 0) > 0) return monthIndex
    }
    const fallbackVisible = visibleIndexes[visibleIndexes.length - 1]
    if (typeof fallbackVisible === 'number' && fallbackVisible >= 0) return fallbackVisible
    return new Date().getMonth()
  }, [evolutionMonthlyTotals, visibleEvolutionChartMonths])
  const summaryPeriodLabel = `${EVOLUTION_MONTHS[summaryMonthIndex]?.label ?? '—'}/${evolutionActiveYear}`
  const summaryCurrentValue = evolutionMonthlyTotals[summaryMonthIndex] ?? 0
  const summaryPast1 = evolutionMonthlyTotals[(summaryMonthIndex - 1 + 12) % 12] ?? 0
  const summaryPast3 = evolutionMonthlyTotals[(summaryMonthIndex - 3 + 12) % 12] ?? 0
  const summaryPast6 = evolutionMonthlyTotals[(summaryMonthIndex - 6 + 12) % 12] ?? 0
  const summaryPast12 = evolutionMonthlyTotals[(summaryMonthIndex - 11 + 12) % 12] ?? 0
  const summaryComparisons = [
    { label: 'vs mês anterior', value: summaryPast1 },
    { label: 'vs 3 meses', value: summaryPast3 },
    { label: 'vs 6 meses', value: summaryPast6 },
    { label: 'vs 12 meses', value: summaryPast12 },
  ]
  const summaryEvolutionDistribution = useMemo(() => {
    if (!storageAvailable) return []
    const monthKey = EVOLUTION_MONTHS[summaryMonthIndex]?.key
    if (!monthKey) return []
    const rows = readEvolutionRowsForYear(window.localStorage, evolutionActiveYear, {
      scope: evolutionStorageScope,
    })
    const visibleMonths = new Set(
      readEvolutionVisibleMonthsForYear(
        window.localStorage,
        evolutionActiveYear,
        evolutionStorageScope
      )
    )
    if (!visibleMonths.has(monthKey)) return []

    const groupedByAsset = new Map<string, { key: string; label: string; value: number }>()
    const normalizeAssetLabel = (value: string) =>
      value.trim().toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ')

    rows.forEach((row) => {
      const value = parsePtBrNumber(row[monthKey])
      if (value <= 0) return

      const label = row.name.trim() || 'Sem nome'
      const normalized = normalizeAssetLabel(label)
      const mapKey = normalized || `sem-nome:${row.id}`
      const current = groupedByAsset.get(mapKey)

      if (current) {
        current.value += value
        return
      }

      groupedByAsset.set(mapKey, {
        key: mapKey,
        label,
        value,
      })
    })

    const items = Array.from(groupedByAsset.values())

    const total = items.reduce((sum, item) => sum + item.value, 0)
    if (total <= 0) return []

    return items
      .map((item) => ({
        ...item,
        percent: Math.round((item.value / total) * 100),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [
    storageAvailable,
    evolutionActiveYear,
    summaryMonthIndex,
    evolutionDataVersion,
    activePage,
    evolutionStorageScope,
  ])

  // Course UI extracted to src/features/courses/*

  if (supabaseConfigMissing) {
    return (
      <div className="login-page">
        <div className="auth-card">
          <h2>Supabase não configurado</h2>
          <p>Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.</p>
        </div>
      </div>
    )
  }

  if (authLoading) {
    return (
      <div className="login-page">
        <div className="auth-card">
          <h2>Carregando...</h2>
          <p>Verificando sessão.</p>
        </div>
      </div>
    )
  }

  if (!authUser || passwordRecoveryMode) {
    return (
      <LoginPage
        passwordRecoveryMode={passwordRecoveryMode}
        onPasswordResetDone={() => setPasswordRecoveryMode(false)}
      />
    )
  }

  const usesHamburgerSidebar = activePage === 'expenses'

  return (
    <div
      className={`page ${activePage === 'expenses' ? 'page--fixed' : ''} ${
        usesHamburgerSidebar ? 'page--sidebar-hamburger' : ''
      }`}
    >
      <Sidebar
        activePage={activePage}
        open={isSidebarOpen}
        setOpen={(open) => setSidebarOpen(open, 'sidebar')}
        onNavigate={(page) => navigate(page, 'sidebar')}
        onSignOut={() => supabase?.auth.signOut()}
        userName={authUser?.name}
      />

      <main className="content" ref={contentRef}>
        {activePage === 'dash' ? (
          <div className="dash-stack">
            <button className="course-back" onClick={() => setSidebarOpen(true, 'dash_page')}>
              Menu
            </button>
            <section className="dash-section">
              <div className="dash-section__head">
                <span className="dash-section__kicker">Visão geral</span>
              </div>
              <div className="dash-section__body">
                <section className="kpi-grid">
                  <article className="kpi-card">
                    <span className="kpi-label">Patrimônio total</span>
                    <h2>{formatBRL.format(summaryCurrentValue)}</h2>
                    <p className="kpi-trend">{summaryPeriodLabel}</p>
                  </article>
                  <article className="kpi-card">
                    <span className="kpi-label">Investimentos ativos</span>
                    <h2>{formatBRL.format(dashboardInvestmentsTotal)}</h2>
                    <p
                      className={`kpi-trend ${
                        investmentsVsPreviousMonthPct === null
                          ? ''
                          : investmentsVsPreviousMonthPct >= 0
                            ? 'up'
                            : 'down'
                      }`}
                    >
                      {investmentsVsPreviousMonthPct !== null
                        ? `${investmentsVsPreviousMonthPct >= 0 ? '+' : ''}${investmentsVsPreviousMonthPct.toFixed(1)}% vs mês anterior`
                        : 'Sem base no mês anterior'}
                    </p>
                  </article>
                  <article className="kpi-card">
                    <span className="kpi-label">Despesa mensal</span>
                    <h2>{formatBRL.format(averageMonthlyExpenseYtd)}</h2>
                    <p className={`kpi-trend ${expenseVsPreviousPct === null ? '' : expenseVsPreviousPct >= 0 ? 'up' : 'down'}`}>
                      {ytdAverageLabel}
                      {expenseVsPreviousPct !== null
                        ? ` • ${expenseVsPreviousPct >= 0 ? '+' : ''}${expenseVsPreviousPct.toFixed(1)}% vs mês anterior`
                        : ' • sem base de comparação'}
                    </p>
                  </article>
                  <article className="kpi-card">
                    <span className="kpi-label">Receita mensal</span>
                    <h2>{formatBRL.format(averageMonthlyIncomeYtd)}</h2>
                    <p className={`kpi-trend ${incomeVsPreviousPct === null ? '' : incomeVsPreviousPct >= 0 ? 'up' : 'down'}`}>
                      {ytdAverageLabel}
                      {incomeVsPreviousPct !== null
                        ? ` • ${incomeVsPreviousPct >= 0 ? '+' : ''}${incomeVsPreviousPct.toFixed(1)}% vs mês anterior`
                        : ' • sem base de comparação'}
                    </p>
                  </article>
                </section>
              </div>
            </section>

            <AssistantDock open={assistantOpen} setOpen={setAssistantOpen}>
              <section className="assistant-panel">
                <div className="assistant-panel__header">
                  <div className="assistant-identity">
                    <div className="assistant-avatar" aria-hidden="true">
                      U
                    </div>
                    <div>
                      <span className="assistant-kicker">Upmoney IA</span>
                      <h2>Seu plano de dividendos começa aqui</h2>
                      <span className="assistant-status">Online • Pronta para te guiar</span>
                    </div>
                  </div>
                  <div className="assistant-score">
                    <span>Saúde financeira</span>
                    <strong>{healthScore}/100</strong>
                  </div>
                </div>
                <div className="assistant-chat">
                  <div className="chat-row assistant">
                    <div className="assistant-avatar" aria-hidden="true">
                      U
                    </div>
                    <div className="chat-bubble assistant">
                      Bem-vindo ao seu app de Dividendos. Se você está aqui, seu objetivo é
                      receber renda recorrente. Vamos montar a base juntos?
                    </div>
                  </div>
                  {onboardingStep >= 1 ? (
                    <div className="chat-row assistant">
                      <div className="assistant-avatar" aria-hidden="true">
                        U
                      </div>
                      <div className="chat-bubble assistant">
                        Quanto você espera receber de dividendos por mês?
                      </div>
                    </div>
                  ) : null}
                  {dividendGoal ? (
                    <div className="chat-row user">
                      <div className="chat-bubble user">
                        Quero receber {formatBRL.format(dividendGoal)} por mês.
                      </div>
                    </div>
                  ) : null}
                  {dividendGoal ? (
                    <div className="chat-row assistant">
                      <div className="assistant-avatar" aria-hidden="true">
                        U
                      </div>
                      <div className="chat-bubble assistant">
                        Com base no DY médio de 12 meses da carteira “Meu primeiro
                        dividendo”, você precisaria de aproximadamente{' '}
                        <strong>{formatBRL.format(requiredCapital ?? 0)}</strong> em
                        aportes. Isso é educativo e a decisão final é pessoal.
                      </div>
                    </div>
                  ) : null}
                  {dividendGoal ? (
                    <div className="chat-row assistant">
                      <div className="assistant-avatar" aria-hidden="true">
                        U
                      </div>
                      <div className="chat-bubble assistant">
                        Primeiro passo: inicie o curso “Meu primeiro dividendo” na aba
                        Cursos. Ele traz os conceitos necessários para você começar a
                        receber dividendos recorrentes.
                      </div>
                    </div>
                  ) : null}
                  {dividendGoal ? (
                    <div className="chat-row assistant">
                      <div className="assistant-avatar" aria-hidden="true">
                        U
                      </div>
                      <div className="chat-bubble assistant">
                        Você tem 3 horas de acompanhamento individual. Essa é a chave do
                        seu sucesso. Aproveite!
                      </div>
                    </div>
                  ) : null}
                  {dividendGoal ? (
                    <div className="chat-row assistant">
                      <div className="assistant-avatar" aria-hidden="true">
                        U
                      </div>
                      <div className="chat-bubble assistant">
                        Lembre-se: controle suas despesas no Dash para sobrar mais dinheiro
                        para investir e ter mais tranquilidade no futuro.
                      </div>
                    </div>
                  ) : null}
                  {dividendGoal ? (
                    <div className="chat-row assistant">
                      <div className="assistant-avatar" aria-hidden="true">
                        U
                      </div>
                      <div className="chat-bubble assistant">
                        Progresso nos cursos hoje: {overallCourseProgress}%.
                      </div>
                    </div>
                  ) : null}
                  {onboardingStep === 0 ? (
                    <button
                      className="btn primary assistant-cta"
                      onClick={() => {
                        setOnboardingStep(1)
                        if (storageAvailable) {
                          window.localStorage.setItem('upmoney_onboarding_step', '1')
                        }
                      }}
                    >
                      Começar agora
                    </button>
                  ) : null}
                  {onboardingStep === 1 && !dividendGoal ? (
                    <>
                      <form
                        className="assistant-input"
                        onSubmit={(event) => {
                          event.preventDefault()
                          const normalized = dividendGoalInput.replace(',', '.')
                          const parsed = Number(normalized)
                          if (!Number.isFinite(parsed) || parsed <= 0) return
                          setDividendGoal(parsed)
                          setOnboardingStep(2)
                          if (storageAvailable) {
                            window.localStorage.setItem(
                              'upmoney_dividend_goal',
                              parsed.toString()
                            )
                            window.localStorage.setItem('upmoney_onboarding_step', '2')
                          }
                        }}
                      >
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="Ex.: 500"
                          value={dividendGoalInput}
                          onChange={(event) => setDividendGoalInput(event.target.value)}
                          required
                        />
                        <button className="btn primary" type="submit">
                          Confirmar meta
                        </button>
                      </form>
                      <div className="assistant-typing">
                        <span>Upmoney IA está ouvindo</span>
                        <span className="typing-dots" aria-hidden="true">
                          <i />
                          <i />
                          <i />
                        </span>
                      </div>
                    </>
                  ) : null}
                  {dividendGoal ? (
                    <div className="assistant-actions">
                      <button
                        className="btn ghost"
                        onClick={() => navigate('courses', 'assistant_actions')}
                      >
                        Ir para cursos
                      </button>
                      <button
                        className="btn ghost"
                        onClick={() => navigate('assets', 'assistant_actions')}
                      >
                        Ver ativos
                      </button>
                      <button
                        className="btn ghost"
                        onClick={() => navigate('expenses', 'assistant_actions')}
                      >
                        Controlar despesas
                      </button>
                    </div>
                  ) : null}
                </div>
              </section>
            </AssistantDock>

            <section className="dash-section">
              <div className="dash-section__head">
                <span className="dash-section__kicker">Insights</span>
              </div>
              <div className="dash-section__body">
                <section className="dash-panels dash-panels--insights">
              <article className="panel-card panel-card--compact">
                <div className="panel-card__header">
                  <span className="insight-chip-title">Atividades recentes</span>
                  <span className="panel-meta insight-chip-meta">Este mês</span>
                </div>
                <div className="summary-list summary-list--compact">
                  <div className="summary-row">
                    <span className="summary-label">Aportes realizados</span>
                    <span className="summary-value">{activityCounts.assetsAdded}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Acessos aos cursos</span>
                    <span className="summary-value">{activityCounts.coursesOpened}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Controle de despesas</span>
                    <span className="summary-value">{activityCounts.expensesOpened}</span>
                  </div>
                </div>
              </article>

              <article className="panel-card panel-card--compact">
                <div className="panel-card__header">
                  <span className="insight-chip-title">Investimentos Resumo</span>
                </div>
                {portfolioTypeSummary.length ? (
                  <div className="wallet-summary__bars dash-type-summary">
                    {portfolioTypeSummary.map((item) => (
                      <div className="wallet-summary__row" key={item.type}>
                        <span>{item.label}</span>
                        <div className="wallet-summary__track">
                          <span style={{ width: `${item.percent}%` }} />
                        </div>
                        <strong title={formatBRL.format(item.value)}>{item.percent}%</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="summary-list summary-list--compact">
                    <div className="summary-row">
                      <span className="summary-label">Adicione ativos para ver o resumo.</span>
                    </div>
                  </div>
                )}

                {/* no actions */}
              </article>

              <article className="panel-card panel-card--evolution">
                <div className="panel-card__header">
                  <h3>Evolução Patrimonial</h3>
                  <div className="evolution-header-actions">
                    <button
                      className="btn small evolution-add-btn"
                      onClick={() => openEvolutionEditor()}
                    >
                      Editar ativos
                    </button>
                  </div>
                </div>
                <div className="evolution-scroll">
                  <div
                    className="evolution-chart"
                    ref={evolutionChartRef}
                    onTouchStart={(event) => {
                      const touch = event.touches[0]
                      if (!touch) return
                      const month = resolveEvolutionMonthFromTouch(touch)
                      if (month) {
                        showEvolutionBarTooltip(month)
                      }
                    }}
                    onTouchMove={(event) => {
                      const touch = event.touches[0]
                      if (!touch) return
                      const month = resolveEvolutionMonthFromTouch(touch)
                      if (month) {
                        showEvolutionBarTooltip(month)
                      }
                    }}
                    onTouchEnd={() => scheduleHideEvolutionBarTooltip(1200)}
                    onTouchCancel={() => scheduleHideEvolutionBarTooltip(1200)}
                  >
                    {visibleEvolutionChartMonths.map((month) => {
                      const index = EVOLUTION_MONTHS.findIndex((item) => item.key === month.key)
                      const value = evolutionMonthlyTotals[index] ?? 0
                      const height =
                        maxEvolutionTotal > 0
                          ? `${Math.max((value / maxEvolutionTotal) * 100, 6)}%`
                          : '8%'
                      const valueLabel = formatBRL.format(value)
                      const isBarActive = activeEvolutionBar === month.key
                      return (
                        <div
                          className={`evolution-col ${isBarActive ? 'is-active' : ''}`.trim()}
                          key={month.key}
                          data-month={month.key}
                        >
                          <div className="evolution-bar-wrap">
                            <span className="evolution-tooltip">{valueLabel}</span>
                            <div
                              className="evolution-bar"
                              style={{ height }}
                              role="button"
                              tabIndex={0}
                              aria-label={`${month.label.toUpperCase()} ${evolutionActiveYear}: ${valueLabel}`}
                              onMouseEnter={() => showEvolutionBarTooltip(month.key)}
                              onMouseLeave={() => scheduleHideEvolutionBarTooltip(0)}
                              onFocus={() => showEvolutionBarTooltip(month.key)}
                              onBlur={() => scheduleHideEvolutionBarTooltip(0)}
                              onClick={() => {
                                if (typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches) {
                                  toggleEvolutionBarTooltip(month.key)
                                }
                              }}
                              onTouchStart={() => showEvolutionBarTooltip(month.key)}
                              onTouchEnd={() => scheduleHideEvolutionBarTooltip()}
                              onTouchCancel={() => scheduleHideEvolutionBarTooltip(0)}
                            />
                          </div>
                          <span className="evolution-month-label">
                            <span>{month.label.toUpperCase()}</span>
                            <span className="evolution-month-label__year">{evolutionActiveYear}</span>
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </article>

              <article className="panel-card panel-card--summary">
                <div className="panel-card__header">
                  <h3>Resumo</h3>
                  <span className="panel-meta">{summaryPeriodLabel}</span>
                </div>
                <div className="summary-list summary-list--tight">
                  <div className="summary-row">
                    <span className="summary-label">Patrimônio atual</span>
                    <span className="summary-value">{formatBRL.format(summaryCurrentValue)}</span>
                  </div>
                  {summaryComparisons.map((item) => {
                    const hasBase = item.value > 0
                    const deltaPct = hasBase
                      ? ((summaryCurrentValue - item.value) / item.value) * 100
                      : null
                    const deltaClass = deltaPct !== null && deltaPct >= 0 ? 'up' : 'down'
                    return (
                      <div className="summary-row" key={item.label}>
                        <span className="summary-label">{item.label}</span>
                        <span className="summary-value">
                          {formatBRL.format(item.value)}{' '}
                          {deltaPct !== null ? (
                            <strong className={`summary-delta ${deltaClass}`}>
                              {`${deltaPct >= 0 ? '+' : ''}${deltaPct.toFixed(1)}%`}
                            </strong>
                          ) : (
                            <strong className="summary-delta">—</strong>
                          )}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <div className="summary-section">Distribuição da carteira</div>
                <div className="summary-bars">
                  {summaryEvolutionDistribution.length ? (
                    <>
                      {summaryEvolutionDistribution.map((item) => (
                        <div className="summary-bar" key={item.key}>
                          <span>{item.label}</span>
                          <div className="summary-bar__track">
                            <span style={{ width: `${item.percent}%` }} />
                          </div>
                          <span title={formatBRL.format(item.value)}>{item.percent}%</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="summary-row">
                      <span className="summary-label">Sem ativos para exibir distribuição.</span>
                    </div>
                  )}
                </div>
              </article>

                </section>
              </div>
            </section>

            <section className="dash-section">
              <div className="dash-section__head">
                <span className="dash-section__kicker">Fluxo do mês</span>
              </div>
              <div className="dash-section__body">
                <section className="dash-panels">
              <article className="panel-card wide">
                <div className="panel-card__header">
                  <h3>Receitas e despesas</h3>
                  <div className="flow-header-actions">
                    <div className="flow-period-toggle" role="group" aria-label="Período do fluxo">
                      {[3, 6, 12].map((period) => (
                        <button
                          key={period}
                          className={`flow-period-btn ${flowPeriod === period ? 'active' : ''}`}
                          onClick={() => setFlowPeriod(period as 3 | 6 | 12)}
                        >
                          {period}M
                        </button>
                      ))}
                    </div>
                    <span className="panel-meta">
                      {flowMonths[0]?.label}-{flowMonths[flowMonths.length - 1]?.label}
                    </span>
                  </div>
                </div>
                {flowHasData ? (
                  <>
                    <div className="flow-alerts">
                      <span className="flow-alert">
                        Meta de gasto: até {flowTargetPct}% da receita
                      </span>
                      <span
                        className={`flow-alert ${flowAnomalyStats.monthsOverTarget > 0 ? 'warn' : 'ok'}`}
                      >
                        {flowAnomalyStats.monthsOverTarget} mês(es) acima da meta
                      </span>
                      <span
                        className={`flow-alert ${flowAnomalyStats.anomalousMonths > 0 ? 'warn' : 'ok'}`}
                      >
                        {flowAnomalyStats.anomalousMonths} anomalia(s) detectada(s)
                      </span>
                    </div>
                    <div className="income-expense-layout">
                      <div className="flow-y-axis" aria-hidden="true">
                        {flowAxisTicks.map((tick, index) => (
                          <span key={`${tick}-${index}`}>{formatBRL.format(tick)}</span>
                        ))}
                      </div>
                      <div className="income-expense-bars">
                        <div
                          className="flow-saldo-overlay"
                          aria-label="Linha de saldo mensal"
                        >
                          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                            <line
                              x1="0"
                              y1={flowSaldoZeroY}
                              x2="100"
                              y2={flowSaldoZeroY}
                              className="flow-saldo-baseline"
                            />
                            <polyline
                              points={flowTargetPoints}
                              className="flow-target-line"
                            />
                            {flowLegend.saldo ? (
                              <polyline points={flowSaldoPoints} className="flow-saldo-line" />
                            ) : null}
                          </svg>
                        </div>
                        {flowMonths.map((month) => {
                          const monthPct =
                            month.income > 0 ? Math.round((month.expense / month.income) * 100) : null
                          const monthNet = month.income - month.expense
                          const isAnomalous =
                            (flowIncomeAvg > 0 && month.income < flowIncomeAvg * 0.75) ||
                            (flowExpenseAvg > 0 && month.expense > flowExpenseAvg * 1.25)
                          return (
                            <button
                              className={`bar-group ${selectedFlowMonthIndex === month.index ? 'selected' : ''}`}
                              key={month.key}
                              onClick={() =>
                                setSelectedFlowMonthIndex((prev) =>
                                  prev === month.index ? null : month.index
                                )
                              }
                            >
                              <div className="flow-tooltip">
                                <strong>{month.label}</strong>
                                <span>Receitas: {formatBRL.format(month.income)}</span>
                                <span>Despesas: {formatBRL.format(month.expense)}</span>
                                <span>
                                  Saldo:{' '}
                                  <em className={monthNet >= 0 ? 'up' : 'down'}>
                                    {formatBRL.format(monthNet)}
                                  </em>
                                </span>
                                <span>
                                  Comprometimento: {monthPct === null ? '—' : `${monthPct}%`}
                                </span>
                              </div>
                              <div className="bar-pair">
                                {flowLegend.income ? (
                                  <span
                                    className="bar income"
                                    style={{
                                      height:
                                        maxFlowValue > 0
                                          ? `${Math.max((month.income / maxFlowValue) * 100, 6)}%`
                                          : '8%',
                                    }}
                                  />
                                ) : null}
                                {flowLegend.expense ? (
                                  <span
                                    className="bar expense"
                                    style={{
                                      height:
                                        maxFlowValue > 0
                                          ? `${Math.max((month.expense / maxFlowValue) * 100, 6)}%`
                                          : '8%',
                                    }}
                                  />
                                ) : null}
                              </div>
                              <span className="bar-label">
                                {month.label}
                                {isAnomalous ? <i className="flow-anomaly-dot" aria-hidden="true" /> : null}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div className="bars-legend">
                      <button
                        className={`legend-item legend-toggle ${flowLegend.income ? 'active' : ''}`}
                        onClick={() =>
                          setFlowLegend((prev) => ({ ...prev, income: !prev.income }))
                        }
                      >
                        <span className="legend-swatch income" />
                        <span>Receitas</span>
                      </button>
                      <button
                        className={`legend-item legend-toggle ${flowLegend.expense ? 'active' : ''}`}
                        onClick={() =>
                          setFlowLegend((prev) => ({ ...prev, expense: !prev.expense }))
                        }
                      >
                        <span className="legend-swatch expense" />
                        <span>Despesas</span>
                      </button>
                      <button
                        className={`legend-item legend-toggle ${flowLegend.saldo ? 'active' : ''}`}
                        onClick={() =>
                          setFlowLegend((prev) => ({ ...prev, saldo: !prev.saldo }))
                        }
                      >
                        <span className="legend-swatch saldo" />
                        <span>Linha de saldo</span>
                      </button>
                    </div>
                    <div className="flow-metrics flow-metrics--executive">
                      <div className="flow-metric">
                        <span>Média receitas</span>
                        <strong>{formatBRL.format(flowIncomeAvg)}</strong>
                      </div>
                      <div className="flow-metric">
                        <span>Média despesas</span>
                        <strong>{formatBRL.format(flowExpenseAvg)}</strong>
                      </div>
                      <div className="flow-metric">
                        <span>Melhor mês</span>
                        <strong className="up">
                          {flowBestMonth.label} {formatBRL.format(flowBestMonth.income - flowBestMonth.expense)}
                        </strong>
                      </div>
                      <div className="flow-metric">
                        <span>Pior mês</span>
                        <strong className="down">
                          {flowWorstMonth.label} {formatBRL.format(flowWorstMonth.income - flowWorstMonth.expense)}
                        </strong>
                      </div>
                      <div className="flow-metric">
                        <span>Saldo anual</span>
                        <strong className={flowNet >= 0 ? 'up' : 'down'}>
                          {formatBRL.format(flowNet)}
                        </strong>
                      </div>
                      <div className="flow-metric">
                        <span>Comprometimento</span>
                        <strong>{flowExpensePct === null ? '—' : `${flowExpensePct}%`}</strong>
                      </div>
                    </div>
                    {selectedFlowMonth && selectedFlowBreakdown ? (
                      <div className="flow-drilldown">
                        <div className="flow-drilldown__head">
                          <strong>Detalhamento de {selectedFlowMonth.label}</strong>
                          <button
                            className="btn ghost small"
                            onClick={() => setSelectedFlowMonthIndex(null)}
                          >
                            Fechar
                          </button>
                        </div>
                        <div className="flow-drilldown__grid">
                          <div>
                            <h4>Receitas</h4>
                            {selectedFlowBreakdown.income.length ? (
                              <ul>
                                {selectedFlowBreakdown.income.map((row) => (
                                  <li key={`i-${row.label}`}>
                                    <span>{row.label}</span>
                                    <strong>{formatBRL.format(row.value)}</strong>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p>Sem receitas categorizadas.</p>
                            )}
                          </div>
                          <div>
                            <h4>Despesas</h4>
                            {selectedFlowBreakdown.expense.length ? (
                              <ul>
                                {selectedFlowBreakdown.expense.map((row) => (
                                  <li key={`e-${row.label}`}>
                                    <span>{row.label}</span>
                                    <strong>{formatBRL.format(row.value)}</strong>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p>Sem despesas categorizadas.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="flow-empty">
                    <p>Sem dados de receitas e despesas ainda.</p>
                    <button className="btn small" onClick={() => navigate('expenses', 'dash_flow_empty')}>
                      Preencher despesas
                    </button>
                  </div>
                )}
              </article>
                </section>
              </div>
            </section>

          </div>
        ) : activePage === 'assets' ? (
          <AssetsPage
            onOpenMenu={() => setSidebarOpen(true, 'assets_page')}
            onAssetAdded={() => incrementActivity('assetsAdded')}
          />
        ) : activePage === 'expenses' ? (
          <ExpensesPage onOpenMenu={() => setSidebarOpen(true, 'expenses_page')} />
        ) : activePage === 'minha_previdencia' ? (
          <MinhaPrevidenciaPage onOpenMenu={() => setSidebarOpen(true, 'minha_previdencia_page')} />
        ) : activePage === 'simulator' ? (
          <SimulatorPage
            onOpenMenu={() => setSidebarOpen(true, 'simulator_page')}
          />
        ) : activePage === 'evolution_assets' ? (
          <EvolutionAssetsPage />
        ) : activePage === 'courses' ? (
          <CoursesListPage
            course1Progress={course1Progress}
            course2Progress={course2Progress}
            course3Progress={course3Progress}
            onOpenMenu={() => setSidebarOpen(true, 'courses_list')}
            onOpenCourse={(id) => navigate(id, 'courses_list')}
          />
        ) : activePage === 'course1' ? (
          <CoursePage
            course={COURSES.course1}
            completed={completedModulesCourse1}
            setCompleted={setCompletedModulesCourse1}
            onBack={() => navigate('courses', 'course1_back')}
          />
        ) : activePage === 'course2' ? (
          <CoursePage
            course={COURSES.course2}
            completed={completedModulesCourse2}
            setCompleted={setCompletedModulesCourse2}
            onBack={() => navigate('courses', 'course2_back')}
          />
        ) : activePage === 'course3' ? (
          <CoursePage
            course={COURSES.course3}
            completed={completedModulesCourse3}
            setCompleted={setCompletedModulesCourse3}
            onBack={() => navigate('courses', 'course3_back')}
          />
        ) : activePage === 'previdencia_mod01' ? (
          <PrevidenciaPrivadaModulo01Page onBack={() => navigate('courses', 'previdencia_back')} />
        ) : activePage === 'wallets' ? (
          <>
            <header className="wallets-hero">
              <button
                className="course-back"
                onClick={() => setSidebarOpen(true, 'wallets_page')}
              >
                Voltar ao menu
              </button>
              <div className="wallets-headline">
                <h1 className="wallets-title title-lg">Sugestões UpMoney</h1>
                <p className="wallets-subtitle subtitle-md">
                  Carteiras-modelo para aprender alocação por objetivo — conteúdo
                  educacional.
                </p>
              </div>
              <div className="wallets-warning">
                <div className="wallets-warning__title">
                  <span className="warning-icon" aria-hidden="true">
                    ⚠
                  </span>
                  Aviso educacional
                </div>
                <div className="wallets-warning__text">
                  Carteiras-modelo para estudo. Não representam recomendação.
                </div>
              </div>
            </header>

            <section className="wallets-grid">
              <article className="wallet-card featured active">
                <div className="wallet-visual primary">
                  <span className="wallet-chip active">Ativa</span>
                  <img
                    className="wallet-visual__image"
                    src={meuDividendoImg}
                    alt=""
                  />
                </div>
                <div className="wallet-body">
                  <h2 className="card-title-md">Meu Primeiro Dividendo</h2>
                  <ul className="wallet-bullets bullet-list">
                    <li>Do zero à renda passiva</li>
                    <li>Ações</li>
                    <li>FII's</li>
                  </ul>
                  <div className="wallet-footer">
                    <p>Clique para ver detalhes da carteira</p>
                    <button
                      className="btn small course-action continue"
                      onClick={() => navigate('wallet1', 'wallets_open_wallet1')}
                    >
                      Abrir
                    </button>
                  </div>
                </div>
              </article>

              <article className="wallet-card active">
                <div className="wallet-visual">
                  <span className="wallet-chip active">Ativa</span>
                  <img
                    className="wallet-visual__image"
                    src={rendaFixaAposentImg}
                    alt=""
                  />
                </div>
                <div className="wallet-body">
                  <h2 className="card-title-md">Renda Fixa — Aposentadoria</h2>
                  <div className="wallet-footer">
                    <p>Clique para ver detalhes da carteira</p>
                    <button
                      className="btn small course-action continue"
                      onClick={() => navigate('wallet2', 'wallets_open_wallet2')}
                    >
                      Abrir
                    </button>
                  </div>
                </div>
              </article>

              <article className="wallet-card locked">
                <div className="wallet-visual">
                  <span className="wallet-chip locked">Em breve</span>
                  <span className="wallet-lock" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M7 11V8a5 5 0 0 1 10 0v3"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                      <rect
                        x="5"
                        y="11"
                        width="14"
                        height="9"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                    </svg>
                  </span>
                  <img
                    className="wallet-visual__image"
                    src={carteiraFiisImg}
                    alt=""
                  />
                </div>
                <div className="wallet-body">
                  <h2 className="card-title-md">Carteira Fundos Imobiliários</h2>
                  <div className="wallet-footer">
                    <p>Clique para ver detalhes da carteira</p>
                    <button className="btn small course-action continue" disabled>
                      Bloqueada
                    </button>
                  </div>
                </div>
              </article>

              <article className="wallet-card locked">
                <div className="wallet-visual">
                  <span className="wallet-chip locked">Em breve</span>
                  <span className="wallet-lock" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M7 11V8a5 5 0 0 1 10 0v3"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                      <rect
                        x="5"
                        y="11"
                        width="14"
                        height="9"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                    </svg>
                  </span>
                  <img
                    className="wallet-visual__image"
                    src={rendaFixaCuponsImg}
                    alt=""
                  />
                </div>
                <div className="wallet-body">
                  <h2 className="card-title-md">Renda Fixa com Cupons</h2>
                  <div className="wallet-footer">
                    <p>Clique para ver detalhes da carteira</p>
                    <button className="btn small course-action continue" disabled>
                      Bloqueada
                    </button>
                  </div>
                </div>
              </article>

              <article className="wallet-card locked">
                <div className="wallet-visual">
                  <span className="wallet-chip locked">Em breve</span>
                  <span className="wallet-lock" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M7 11V8a5 5 0 0 1 10 0v3"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                      <rect
                        x="5"
                        y="11"
                        width="14"
                        height="9"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                    </svg>
                  </span>
                  <img
                    className="wallet-visual__image"
                    src={carteiraCriptoImg}
                    alt=""
                  />
                </div>
                <div className="wallet-body">
                  <h2 className="card-title-md">Carteira Criptoativos</h2>
                  <div className="wallet-footer">
                    <p>Clique para ver detalhes da carteira</p>
                    <button className="btn small course-action continue" disabled>
                      Bloqueada
                    </button>
                  </div>
                </div>
              </article>
            </section>
          </>
        ) : activePage === 'wallet1' ? (
          <div className="wallet-detail">
            <header className="wallet-detail-hero">
              <button
                className="course-back"
                onClick={() => navigate('wallets', 'wallet1_back')}
              >
                Voltar
              </button>
              <div>
                <h1 className="wallet-detail-title title-lg">
                  Carteira de Dividendos (renda recorrente)
                </h1>
                <p className="wallet-detail-subtitle subtitle-md">
                  Modelo educacional para aprender renda recorrente com Caixa +
                  Ações + FIIs.
                </p>
              </div>
              <div className="wallet-detail-actions">
                <button
                  className="btn small ghost"
                  onClick={() => navigate('wallets', 'wallet1_back_button')}
                >
                  Voltar às carteiras
                </button>
                <span className="wallet-detail-badge">Novo</span>
              </div>
            </header>

            <section className="wallet-summary">
              <div className="wallet-summary__title">Resumo da carteira</div>
              <div className="wallet-summary__bars">
                <div className="wallet-summary__row">
                  <span>Caixa</span>
                  <div className="wallet-summary__track">
                    <span style={{ width: '20%' }} />
                  </div>
                  <strong>20%</strong>
                </div>
                <div className="wallet-summary__row">
                  <span>Ações</span>
                  <div className="wallet-summary__track">
                    <span style={{ width: '34%' }} />
                  </div>
                  <strong>34%</strong>
                </div>
                <div className="wallet-summary__row">
                  <span>FIIs</span>
                  <div className="wallet-summary__track">
                    <span style={{ width: '46%' }} />
                  </div>
                  <strong>46%</strong>
                </div>
              </div>
            </section>

            <section className="wallet-table wallet-table--detailed">
              <div className="wallet-table__header">
                <span>Tipo</span>
                <span>Nome</span>
                <span>Ticker</span>
                <span>Peso</span>
                <span>Setor</span>
                <span>Frequência</span>
              </div>
              <details className="wallet-group">
                <summary className="wallet-group__summary">
                  <span>Caixa</span>
                  <strong>20%</strong>
                </summary>
                <div className="wallet-table__row">
                  <span className="wallet-type" data-label="Tipo">Caixa</span>
                  <span data-label="Nome">Tesouro Selic / CDB liquidez diária</span>
                  <span data-label="Ticker">—</span>
                  <span data-label="Peso">20%</span>
                  <span data-label="Setor">—</span>
                  <span data-label="Frequência">—</span>
                </div>
              </details>
              <details className="wallet-group">
                <summary className="wallet-group__summary">
                  <span>Ações</span>
                  <strong>34%</strong>
                </summary>
                <div className="wallet-table__row">
                  <span className="wallet-type" data-label="Tipo">Ação</span>
                  <span data-label="Nome">Petrobras</span>
                  <span data-label="Ticker">PETR4</span>
                  <span data-label="Peso">5%</span>
                  <span data-label="Setor">Petróleo e Gás</span>
                  <span data-label="Frequência">Trimestral</span>
                </div>
                <div className="wallet-table__row">
                  <span className="wallet-type" data-label="Tipo">Ação</span>
                  <span data-label="Nome">Gerdau</span>
                  <span data-label="Ticker">GGBR4</span>
                  <span data-label="Peso">5%</span>
                  <span data-label="Setor">Mineração e Siderurgia</span>
                  <span data-label="Frequência">Trimestral</span>
                </div>
                <div className="wallet-table__row">
                  <span className="wallet-type" data-label="Tipo">Ação</span>
                  <span data-label="Nome">Itaú Unibanco</span>
                  <span data-label="Ticker">ITUB4</span>
                  <span data-label="Peso">8%</span>
                  <span data-label="Setor">Financeiro</span>
                  <span data-label="Frequência">Mensal</span>
                </div>
                <div className="wallet-table__row">
                  <span className="wallet-type" data-label="Tipo">Ação</span>
                  <span data-label="Nome">Direcional</span>
                  <span data-label="Ticker">DIRR3</span>
                  <span data-label="Peso">5%</span>
                  <span data-label="Setor">Construção Civil</span>
                  <span data-label="Frequência">Irregular</span>
                </div>
                <div className="wallet-table__row">
                  <span className="wallet-type" data-label="Tipo">Ação</span>
                  <span data-label="Nome">Vivo</span>
                  <span data-label="Ticker">VIVT3</span>
                  <span data-label="Peso">5%</span>
                  <span data-label="Setor">Telecomunicações</span>
                  <span data-label="Frequência">Semestral</span>
                </div>
                <div className="wallet-table__row">
                  <span className="wallet-type" data-label="Tipo">Ação</span>
                  <span data-label="Nome">Vale</span>
                  <span data-label="Ticker">VALE3</span>
                  <span data-label="Peso">6%</span>
                  <span data-label="Setor">Mineração</span>
                  <span data-label="Frequência">Irregular</span>
                </div>
              </details>
              <details className="wallet-group">
                <summary className="wallet-group__summary">
                  <span>FIIs</span>
                  <strong>46%</strong>
                </summary>
                <div className="wallet-table__row">
                  <span className="wallet-type" data-label="Tipo">FII</span>
                  <span data-label="Nome">TRX Real Estate FII</span>
                  <span data-label="Ticker">TRXF11</span>
                  <span data-label="Peso">10%</span>
                  <span data-label="Setor">Renda Urbana</span>
                  <span data-label="Frequência">Mensal</span>
                </div>
                <div className="wallet-table__row">
                  <span className="wallet-type" data-label="Tipo">FII</span>
                  <span data-label="Nome">RBR Crédito Imobiliário Estruturado FII</span>
                  <span data-label="Ticker">RBRY11</span>
                  <span data-label="Peso">10%</span>
                  <span data-label="Setor">Crédito</span>
                  <span data-label="Frequência">Mensal</span>
                </div>
                <div className="wallet-table__row">
                  <span className="wallet-type" data-label="Tipo">FII</span>
                  <span data-label="Nome">Kinea Rendimentos Imobiliários FII</span>
                  <span data-label="Ticker">KNCR11</span>
                  <span data-label="Peso">16%</span>
                  <span data-label="Setor">Crédito</span>
                  <span data-label="Frequência">Mensal</span>
                </div>
                <div className="wallet-table__row">
                  <span className="wallet-type" data-label="Tipo">FII</span>
                  <span data-label="Nome">Kinea Oportunidades Real Estate</span>
                  <span data-label="Ticker">KORE11</span>
                  <span data-label="Peso">5%</span>
                  <span data-label="Setor">Lajes Corporativas</span>
                  <span data-label="Frequência">Mensal</span>
                </div>
                <div className="wallet-table__row">
                  <span className="wallet-type" data-label="Tipo">FII</span>
                  <span data-label="Nome">Bocaina FIC FI-Infra</span>
                  <span data-label="Ticker">BOBD11</span>
                  <span data-label="Peso">5%</span>
                  <span data-label="Setor">Infraestrutura</span>
                  <span data-label="Frequência">Mensal</span>
                </div>
              </details>
              <div className="wallet-table__total">
                <span>Total da Carteira</span>
                <span>100%</span>
              </div>
            </section>
            <p className="wallet-detail-note">
              Este modelo é educacional. Ajuste pesos e ativos conforme seu
              perfil e objetivos.
            </p>
          </div>
        ) : activePage === 'wallet2' ? (
          <div className="wallet-detail">
            <header className="wallet-detail-hero">
              <button
                className="course-back"
                onClick={() => navigate('wallets', 'wallet2_back')}
              >
                Voltar
              </button>
              <div>
                <h1 className="wallet-detail-title title-lg">
                  Renda Fixa — Aposentadoria (longo prazo)
                </h1>
                <p className="wallet-detail-subtitle subtitle-md">
                  Modelo educacional para proteção de poder de compra e
                  previsibilidade no longo prazo.
                </p>
              </div>
              <div className="wallet-detail-actions">
                <button
                  className="btn small ghost"
                  onClick={() => navigate('wallets', 'wallet2_back_button')}
                >
                  Voltar às carteiras
                </button>
                <span className="wallet-detail-badge">Novo</span>
              </div>
            </header>

            <section className="wallet-summary">
              <div className="wallet-summary__title">Resumo da carteira</div>
              <div className="wallet-summary__bars">
                <div className="wallet-summary__row">
                  <span>Caixa</span>
                  <div className="wallet-summary__track">
                    <span style={{ width: '20%' }} />
                  </div>
                  <strong>20%</strong>
                </div>
                <div className="wallet-summary__row">
                  <span>IPCA+</span>
                  <div className="wallet-summary__track">
                    <span style={{ width: '80%' }} />
                  </div>
                  <strong>80%</strong>
                </div>
              </div>
            </section>

            <section className="wallet-table wallet-table--simple">
              <div className="wallet-table__header">
                <span>Classe</span>
                <span>Papel</span>
                <span>Percentual</span>
                <span>Função</span>
              </div>
              <details className="wallet-group">
                <summary className="wallet-group__summary">
                  <span>Caixa</span>
                  <strong>20%</strong>
                </summary>
                <div className="wallet-table__row">
                  <span className="wallet-type" data-label="Classe">Caixa</span>
                  <span data-label="Papel">DI simples</span>
                  <span data-label="Percentual">20%</span>
                  <span data-label="Função">Flexibilidade</span>
                </div>
              </details>
              <details className="wallet-group">
                <summary className="wallet-group__summary">
                  <span>IPCA+</span>
                  <strong>80%</strong>
                </summary>
                <div className="wallet-table__row">
                  <span className="wallet-type" data-label="Classe">IPCA+</span>
                  <span data-label="Papel">2029</span>
                  <span data-label="Percentual">20%</span>
                  <span data-label="Função">Checkpoint / reinvestimento</span>
                </div>
                <div className="wallet-table__row">
                  <span className="wallet-type" data-label="Classe">IPCA+</span>
                  <span data-label="Papel">2040</span>
                  <span data-label="Percentual">35%</span>
                  <span data-label="Função">Crescimento real</span>
                </div>
                <div className="wallet-table__row">
                  <span className="wallet-type" data-label="Classe">IPCA+</span>
                  <span data-label="Papel">2050</span>
                  <span data-label="Percentual">25%</span>
                  <span data-label="Função">Proteção de longo prazo</span>
                </div>
              </details>
              <div className="wallet-table__total">
                <span>Total</span>
                <span>100%</span>
              </div>
            </section>
            <div className="strategy-note">
              <div className="strategy-note__title">
                <span className="strategy-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V18h5v-2.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 21h6"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M10 18h4"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                Conceito da Estratégia
              </div>
              <ul>
                <li>Separar o dinheiro por função, não por produto.</li>
                <li>O caixa garante flexibilidade e tranquilidade.</li>
                <li>Os títulos IPCA+ travam ganho real de longo prazo.</li>
                <li>O tempo faz o resto do trabalho.</li>
              </ul>
            </div>
            <p className="wallet-detail-note">
              UpMoney — conteúdo educacional. Não constitui recomendação de
              investimento.
            </p>
          </div>
        ) : null}
      </main>
      {evolutionEditorOpen && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="modal-backdrop"
              role="dialog"
              aria-modal="true"
              aria-labelledby="evolution-editor-title"
              onClick={() => setEvolutionEditorOpen(false)}
            >
              <div
                className="modal-card evolution-editor-modal"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="modal-header">
                  <h2 id="evolution-editor-title">Editar ativos</h2>
                  <button className="modal-close" onClick={() => setEvolutionEditorOpen(false)}>
                    ✕
                  </button>
                </div>

                <div className="evolution-editor-toolbar">
                  <label>
                    Mês/Ano
                    <button
                      type="button"
                      className="evolution-month-trigger"
                      onClick={() => setEvolutionMonthPickerOpen(true)}
                      aria-label={`Selecionar mês e ano. Atual: ${evolutionEditorMonthLabel}`}
                    >
                      {evolutionEditorMonthLabel}
                    </button>
                  </label>

                  <div className="evolution-editor-toolbar__actions">
                    <button
                      className="btn ghost"
                      type="button"
                      onClick={copyEvolutionFromPreviousMonth}
                    >
                      Copiar mês anterior
                    </button>
                    <button
                      className="btn primary"
                      type="button"
                      onClick={addEvolutionEditorAsset}
                    >
                      + Adicionar linha
                    </button>
                  </div>
                </div>

                {evolutionMonthPickerOpen ? (
                  <div
                    className="evolution-month-picker-backdrop"
                    onClick={() => setEvolutionMonthPickerOpen(false)}
                    aria-hidden="true"
                  >
                    <div
                      className="evolution-month-picker"
                      onClick={(event) => event.stopPropagation()}
                      role="dialog"
                      aria-modal="true"
                      aria-label="Selecionar mês e ano da evolução patrimonial"
                    >
                      <div className="evolution-month-picker__header">
                        <button
                          type="button"
                          className="evolution-month-picker__arrow"
                          onClick={() => shiftEvolutionEditorYear(-1)}
                          aria-label="Ano anterior"
                        >
                          ←
                        </button>
                        <strong>{evolutionEditorYear}</strong>
                        <button
                          type="button"
                          className="evolution-month-picker__arrow"
                          onClick={() => shiftEvolutionEditorYear(1)}
                          aria-label="Próximo ano"
                        >
                          →
                        </button>
                      </div>
                      <div className="evolution-month-picker__grid">
                        {EVOLUTION_MONTHS.map((month) => {
                          const isActive = month.key === evolutionEditorMonth
                          return (
                            <button
                              key={`picker-${month.key}`}
                              type="button"
                              className={`evolution-month-picker__month${isActive ? ' is-active' : ''}`}
                              onClick={() => {
                                loadEvolutionEditorMonth(month.key)
                                setEvolutionMonthPickerOpen(false)
                              }}
                            >
                              {month.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="evolution-editor-table">
                  <div className="evolution-editor-table__head">
                    <span>Nome do ativo</span>
                    <span>Valor (R$)</span>
                    <span>Ação</span>
                  </div>
                  <div className="evolution-editor-table__body">
                    {evolutionEditorAssets.map((asset) => {
                      const isOnlyRow = evolutionEditorAssets.length === 1
                      const isEmptyRow = !asset.name.trim() && !asset.value.trim()
                      const disableRemove = isOnlyRow && isEmptyRow
                      return (
                        <div className="evolution-editor-row" key={asset.id}>
                          <input
                            type="text"
                            value={asset.name}
                            placeholder="Ex.: Tesouro Selic, Caixa, PETR4"
                            onChange={(event) =>
                              updateEvolutionEditorAsset(asset.id, 'name', event.target.value)
                            }
                          />
                          <input
                            type="text"
                            inputMode="decimal"
                            value={asset.value}
                            placeholder="0,00"
                            onChange={(event) =>
                              updateEvolutionEditorAsset(asset.id, 'value', event.target.value)
                            }
                          />
                          <button
                            className="btn small ghost"
                            type="button"
                            disabled={disableRemove}
                            onClick={() => removeEvolutionEditorAsset(asset.id)}
                            aria-label={`Remover linha ${asset.name || 'sem nome'}`}
                            title={
                              disableRemove
                                ? 'A última linha vazia não pode ser removida'
                                : undefined
                            }
                          >
                            Remover
                          </button>
                        </div>
                      )
                    })}
                  </div>
                  <div className="evolution-editor-table__foot" aria-label="Total do mês">
                    <span aria-hidden="true" />
                    <div className="evolution-editor-total">
                      <span>Total do mês</span>
                      <strong>{formatBRL.format(evolutionEditorMonthTotal)}</strong>
                    </div>
                    <span aria-hidden="true" />
                  </div>
                </div>

                <div className="modal-actions evolution-editor-modal__actions">
                  <button
                    className="btn ghost"
                    type="button"
                    onClick={() => navigate('evolution_assets', 'dash_modal_open_sheet')}
                  >
                    Ver planilha
                  </button>
                  <button className="btn danger" type="button" onClick={clearEvolutionEditorMonth}>
                    Zerar este mês
                  </button>
                  <button className="btn primary" type="button" onClick={saveEvolutionEditor}>
                    Salvar alterações
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  )
}

export default App
