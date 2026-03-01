import { safeFetch } from '../utils.ts'

type YahooQuoteResult = {
  symbol?: string
  regularMarketPrice?: number
  regularMarketChangePercent?: number
  currency?: string
  regularMarketTime?: number
}

type YahooQuoteResponse = {
  quoteResponse?: {
    result?: YahooQuoteResult[]
    error?: unknown
  }
}

export type YahooQuote = {
  symbol: string
  price: number
  changePct: number | null
  currency: string | null
  marketTime?: string
  raw: YahooQuoteResult
}

const headers = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  Accept: 'application/json,text/plain,*/*',
}

const parseQuotes = (data?: YahooQuoteResponse | null) => {
  if (!data?.quoteResponse?.result?.length) return []
  return data.quoteResponse.result
    .filter((item) => item.symbol && item.regularMarketPrice != null)
    .map((item) => ({
      symbol: item.symbol ?? '',
      price: item.regularMarketPrice ?? 0,
      changePct: item.regularMarketChangePercent ?? null,
      currency: item.currency ?? null,
      marketTime: item.regularMarketTime
        ? new Date(item.regularMarketTime * 1000).toISOString()
        : undefined,
      raw: item,
    }))
}

export const fetchYahooQuotes = async (symbols: string[]) => {
  if (!symbols.length) return []
  const encoded = encodeURIComponent(symbols.join(','))
  const url1 = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encoded}`
  const { data: data1 } = await safeFetch<YahooQuoteResponse>(url1, { headers })
  const quotes1 = parseQuotes(data1)
  if (quotes1.length) return quotes1

  const url2 = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encoded}`
  const { data: data2 } = await safeFetch<YahooQuoteResponse>(url2, { headers })
  return parseQuotes(data2)
}
