export const LEGACY_EVOLUTION_STORAGE_KEY = 'upmoney_evolution_assets_rows'
export const EVOLUTION_ACTIVE_YEAR_STORAGE_KEY = 'upmoney_evolution_active_year'
export const EVOLUTION_DATA_CHANGED_EVENT = 'upmoney:evolution-data-changed'
export const EVOLUTION_STORAGE_KEY_PREFIX = 'upmoney_evolution_assets_rows_v2'
export const EVOLUTION_HIDDEN_MONTHS_KEY_PREFIX = 'upmoney_evolution_hidden_months_v1'
export const EVOLUTION_VISIBLE_MONTHS_KEY_PREFIX = 'upmoney_evolution_visible_months_v1'

export const EVOLUTION_MONTHS = [
  { key: 'jan', label: 'Jan' },
  { key: 'fev', label: 'Fev' },
  { key: 'mar', label: 'Mar' },
  { key: 'abr', label: 'Abr' },
  { key: 'mai', label: 'Mai' },
  { key: 'jun', label: 'Jun' },
  { key: 'jul', label: 'Jul' },
  { key: 'ago', label: 'Ago' },
  { key: 'set', label: 'Set' },
  { key: 'out', label: 'Out' },
  { key: 'nov', label: 'Nov' },
  { key: 'dez', label: 'Dez' },
] as const

export type EvolutionMonthKey = (typeof EVOLUTION_MONTHS)[number]['key']

export type EvolutionStorageRow = {
  id: string
  name: string
} & Record<EvolutionMonthKey, string>

export const sanitizeCurrencyLike = (value: string) => value.replace(/[^0-9.,]/g, '')

export const parsePtBrNumber = (value: unknown) => {
  if (typeof value !== 'string') return 0
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

export const createEvolutionStorageRow = (): EvolutionStorageRow => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  name: '',
  jan: '',
  fev: '',
  mar: '',
  abr: '',
  mai: '',
  jun: '',
  jul: '',
  ago: '',
  set: '',
  out: '',
  nov: '',
  dez: '',
})

export const getEvolutionStorageKey = (year: number) =>
  `${EVOLUTION_STORAGE_KEY_PREFIX}:${year}`

export const normalizeEvolutionRows = (value: unknown): EvolutionStorageRow[] => {
  if (!Array.isArray(value)) return []

  return value.map((row) => {
    const source = (row ?? {}) as Record<string, unknown>
    return {
      id:
        typeof source.id === 'string' && source.id.trim().length
          ? source.id
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: typeof source.name === 'string' ? source.name : '',
      jan: typeof source.jan === 'string' ? source.jan : '',
      fev: typeof source.fev === 'string' ? source.fev : '',
      mar: typeof source.mar === 'string' ? source.mar : '',
      abr: typeof source.abr === 'string' ? source.abr : '',
      mai: typeof source.mai === 'string' ? source.mai : '',
      jun: typeof source.jun === 'string' ? source.jun : '',
      jul: typeof source.jul === 'string' ? source.jul : '',
      ago: typeof source.ago === 'string' ? source.ago : '',
      set: typeof source.set === 'string' ? source.set : '',
      out: typeof source.out === 'string' ? source.out : '',
      nov: typeof source.nov === 'string' ? source.nov : '',
      dez: typeof source.dez === 'string' ? source.dez : '',
    }
  })
}

export const readEvolutionRowsForYear = (
  storage: Storage,
  year: number,
  opts?: { migrateLegacyCurrentYear?: boolean }
): EvolutionStorageRow[] => {
  const currentYear = new Date().getFullYear()
  const key = getEvolutionStorageKey(year)
  const scopedRaw = storage.getItem(key)

  if (scopedRaw) {
    try {
      return normalizeEvolutionRows(JSON.parse(scopedRaw))
    } catch {
      return []
    }
  }

  const shouldReadLegacy =
    opts?.migrateLegacyCurrentYear === true && year === currentYear

  if (!shouldReadLegacy) {
    return []
  }

  const legacyRaw = storage.getItem(LEGACY_EVOLUTION_STORAGE_KEY)
  if (!legacyRaw) return []

  try {
    const rows = normalizeEvolutionRows(JSON.parse(legacyRaw))
    if (rows.length > 0) {
      storage.setItem(key, JSON.stringify(rows))
    }
    return rows
  } catch {
    return []
  }
}

export const writeEvolutionRowsForYear = (
  storage: Storage,
  year: number,
  rows: EvolutionStorageRow[]
) => {
  storage.setItem(getEvolutionStorageKey(year), JSON.stringify(rows))
}

export const getEvolutionHiddenMonthsKey = (year: number) =>
  `${EVOLUTION_HIDDEN_MONTHS_KEY_PREFIX}:${year}`

export const getEvolutionVisibleMonthsKey = (year: number) =>
  `${EVOLUTION_VISIBLE_MONTHS_KEY_PREFIX}:${year}`

export const readEvolutionHiddenMonthsForYear = (storage: Storage, year: number): EvolutionMonthKey[] => {
  try {
    const raw = storage.getItem(getEvolutionHiddenMonthsKey(year))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    const valid = new Set(EVOLUTION_MONTHS.map((month) => month.key))
    return parsed.filter((item): item is EvolutionMonthKey => typeof item === 'string' && valid.has(item as EvolutionMonthKey))
  } catch {
    return []
  }
}

export const writeEvolutionHiddenMonthsForYear = (
  storage: Storage,
  year: number,
  months: EvolutionMonthKey[]
) => {
  const unique = Array.from(new Set(months))
  storage.setItem(getEvolutionHiddenMonthsKey(year), JSON.stringify(unique))
}

export const readEvolutionVisibleMonthsForYear = (
  storage: Storage,
  year: number
): EvolutionMonthKey[] => {
  const allMonths = EVOLUTION_MONTHS.map((month) => month.key)
  try {
    const visibleRaw = storage.getItem(getEvolutionVisibleMonthsKey(year))
    if (visibleRaw) {
      const parsed = JSON.parse(visibleRaw) as unknown
      if (Array.isArray(parsed)) {
        const valid = new Set(allMonths)
        const visible = parsed.filter(
          (item): item is EvolutionMonthKey =>
            typeof item === 'string' && valid.has(item as EvolutionMonthKey)
        )
        return Array.from(new Set(visible))
      }
    }
  } catch {
    // fall through to compatibility path
  }

  // Compatibility: derive "existing months" from legacy hidden-months control.
  const hidden = new Set(readEvolutionHiddenMonthsForYear(storage, year))
  return allMonths.filter((month) => !hidden.has(month))
}

export const writeEvolutionVisibleMonthsForYear = (
  storage: Storage,
  year: number,
  months: EvolutionMonthKey[]
) => {
  const valid = new Set(EVOLUTION_MONTHS.map((month) => month.key))
  const unique = Array.from(
    new Set(months.filter((month) => valid.has(month)))
  ) as EvolutionMonthKey[]
  storage.setItem(getEvolutionVisibleMonthsKey(year), JSON.stringify(unique))
}

export const clampEvolutionYear = (year: number, fallback = new Date().getFullYear()) => {
  if (!Number.isFinite(year)) return fallback
  const normalized = Math.trunc(year)
  return Math.min(2100, Math.max(2000, normalized))
}

export const notifyEvolutionDataChanged = (year: number) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(EVOLUTION_DATA_CHANGED_EVENT, {
      detail: { year: clampEvolutionYear(year) },
    })
  )
}
