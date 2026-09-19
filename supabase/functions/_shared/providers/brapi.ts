type BrapiQuoteResult = {
  symbol?: string
  regularMarketPrice?: number
  regularMarketChangePercent?: number
  currency?: string
  regularMarketTime?: number
  regularMarketPreviousClose?: number
  dividendsData?: {
    cashDividends?: Array<{
      paymentDate?: string
      lastDatePrior?: string
      approvedOn?: string
      rate?: number
      label?: string
    }>
  }
}

type BrapiQuoteResponse = {
  results?: BrapiQuoteResult[]
}

export type BrapiQuote = {
  symbol: string
  price: number
  changePct: number | null
  currency: string | null
  marketTime?: string
  raw: BrapiQuoteResult
}

export type BrapiDividend = {
  paymentDate: string
  exDate: string | null
  approvedOn: string | null
  rate: number
  label: string | null
  raw: unknown
}

const toDateOnly = (value: string | null | undefined) => {
  if (!value) return null
  const time = Date.parse(value)
  if (!Number.isFinite(time)) return null
  return new Date(time).toISOString().slice(0, 10)
}

const getMaxQuotesPerRequest = () => {
  const raw = Deno.env.get('BRAPI_QUOTES_PER_REQUEST')?.trim()
  const parsed = raw ? Number(raw) : NaN
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.floor(parsed)
  }
  // Free plans commonly allow a single ticker per request.
  return 1
}

const getBrapiToken = () => {
  const candidates = [
    'BRAPI_TOKEN',
    'BRAPI_TOKEN_PUBLIC',
    'BRAPI_PUBLIC_TOKEN',
    'BRAPI_API_KEY',
  ] as const

  for (const key of candidates) {
    const value = Deno.env.get(key)?.trim()
    if (value) return value
  }

  return null
}

const headers = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  Accept: 'application/json,text/plain,*/*',
}

const toIsoFromMarketTime = (value: unknown) => {
  if (value == null) return undefined
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return undefined

  // Brapi may return seconds (unix) or milliseconds depending on endpoint/version.
  const millis = numeric > 1_000_000_000_000 ? numeric : numeric * 1000
  const date = new Date(millis)
  if (!Number.isFinite(date.getTime())) return undefined
  return date.toISOString()
}

const fetchChunk = async (symbols: string[]) => {
  if (!symbols.length) return []
  const joined = symbols.join(',')
  const token = getBrapiToken()
  const url = new URL(`https://brapi.dev/api/quote/${encodeURIComponent(joined)}`)
  if (token) {
    url.searchParams.set('token', token)
  } else {
    console.warn('[brapi]', 'missing_token_env', 'using anonymous request (rate-limited)')
  }

  let data: BrapiQuoteResponse | null = null
  try {
    const response = await fetch(url.toString(), { headers })
    if (!response.ok) {
      console.warn('[brapi]', 'http_error', response.status, url.origin + url.pathname)
      return []
    }
    data = (await response.json()) as BrapiQuoteResponse
  } catch (error) {
    console.warn('[brapi]', 'fetch_error', (error as Error).message, url.origin + url.pathname)
    return []
  }

  if (!data?.results?.length) return []

  return data.results
    .filter((item) => item.symbol && item.regularMarketPrice != null)
    .map((item) => {
      let changePct = item.regularMarketChangePercent ?? null
      if (changePct == null && item.regularMarketPreviousClose && item.regularMarketPrice != null) {
        const prev = item.regularMarketPreviousClose
        if (prev > 0) {
          changePct = ((item.regularMarketPrice - prev) / prev) * 100
        }
      }
      return {
        symbol: item.symbol ?? '',
        price: item.regularMarketPrice ?? 0,
        changePct,
        currency: item.currency ?? null,
        marketTime: toIsoFromMarketTime(item.regularMarketTime),
        raw: item,
      }
    })
}

export const fetchBrapiDividends = async (symbol: string) => {
  const token = getBrapiToken()
  const url = new URL(`https://brapi.dev/api/quote/${encodeURIComponent(symbol)}`)
  url.searchParams.set('dividends', 'true')
  if (token) {
    url.searchParams.set('token', token)
  } else {
    return { result: null, error: 'missing_token_env' }
  }

  let data: BrapiQuoteResponse | null = null
  try {
    const response = await fetch(url.toString(), { headers })
    if (!response.ok) {
      return { result: null, error: `http_${response.status}` }
    }
    data = (await response.json()) as BrapiQuoteResponse
  } catch (error) {
    return { result: null, error: (error as Error).message }
  }

  const first = data?.results?.[0]
  if (!first?.symbol) {
    return { result: { symbol, dividends: [] as BrapiDividend[] } }
  }

  const dividends =
    first.dividendsData?.cashDividends
      ?.map((item) => {
        const paymentDate = toDateOnly(item.paymentDate)
        const rate = Number(item.rate ?? 0)
        if (!paymentDate || !Number.isFinite(rate) || rate <= 0) return null
        return {
          paymentDate,
          exDate: toDateOnly(item.lastDatePrior),
          approvedOn: toDateOnly(item.approvedOn),
          rate,
          label: item.label?.trim() || null,
          raw: item,
        }
      })
      .filter((item): item is BrapiDividend => Boolean(item)) ?? []

  return {
    result: {
      symbol: first.symbol,
      dividends,
    },
  }
}

export const fetchBrapiQuotes = async (symbols: string[]) => {
  if (!symbols.length) return []

  const maxPerRequest = getMaxQuotesPerRequest()
  const quotes: BrapiQuote[] = []

  for (let i = 0; i < symbols.length; i += maxPerRequest) {
    const chunk = symbols.slice(i, i + maxPerRequest)
    const chunkQuotes = await fetchChunk(chunk)
    quotes.push(...chunkQuotes)
  }

  return quotes
}
