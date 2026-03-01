type BrapiQuoteResult = {
  symbol?: string
  regularMarketPrice?: number
  regularMarketChangePercent?: number
  currency?: string
  regularMarketTime?: number
  regularMarketPreviousClose?: number
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

export const fetchBrapiQuotes = async (symbols: string[]) => {
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

  if (!data?.results?.length) {
    return []
  }

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
