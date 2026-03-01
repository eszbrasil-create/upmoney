export type FetchResult<T> = {
  data: T | null
  error?: string
}

export const TTL_MINUTES = 10

export const toProviderSymbol = (symbol: string, assetType: 'equity' | 'crypto') => {
  const trimmed = symbol.trim().toUpperCase()
  if (assetType === 'equity') {
    return trimmed
  }
  return trimmed
}

export const normalizeTicker = (ticker: string) => {
  const trimmed = ticker.trim().toUpperCase()
  return trimmed.endsWith('.SA') ? trimmed.slice(0, -3) : trimmed
}

export const toYahooSymbol = (ticker: string) => `${normalizeTicker(ticker)}.SA`

export const fromYahooSymbol = (symbol: string) => {
  const trimmed = symbol.trim().toUpperCase()
  return trimmed.endsWith('.SA') ? trimmed.slice(0, -3) : trimmed
}

export const safeFetch = async <T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = 10_000
): Promise<FetchResult<T>> => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(input, { ...init, signal: controller.signal })
    if (!response.ok) {
      return { data: null, error: `HTTP ${response.status}` }
    }
    const json = (await response.json()) as T
    return { data: json }
  } catch (error) {
    return { data: null, error: (error as Error).message }
  } finally {
    clearTimeout(timeout)
  }
}

export const shouldSkip = (lastFetched?: string | null) => {
  if (!lastFetched) return false
  const last = new Date(lastFetched).getTime()
  const diffMinutes = (Date.now() - last) / 1000 / 60
  return diffMinutes < TTL_MINUTES
}
