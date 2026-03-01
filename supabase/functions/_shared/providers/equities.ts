import { safeFetch } from '../utils.ts'

type BrapiQuote = {
  results?: Array<{
    symbol?: string
    shortName?: string
    regularMarketPrice?: number
    regularMarketChangePercent?: number
    dividendsData?: {
      cashDividends?: Array<{
        paymentDate?: string
        rate?: number
      }>
    }
  }>
}

export type EquityQuote = {
  price: number
  change24hPct: number | null
  providerSymbol: string
  asOf: string
  raw: unknown
  dividends: Array<{
    eventDate: string
    amount: number
    currency?: string
    eventType?: string
    raw?: unknown
  }>
}

export const fetchEquityQuote = async (symbol: string): Promise<EquityQuote | null> => {
  const url = `https://brapi.dev/api/quote/${encodeURIComponent(symbol)}?fundamental=true`
  const { data, error } = await safeFetch<BrapiQuote>(url)
  if (error || !data?.results?.length) {
    return null
  }
  const result = data.results[0]
  if (!result?.regularMarketPrice) {
    return null
  }
  const dividends =
    result.dividendsData?.cashDividends?.map((item) => ({
      eventDate: item.paymentDate ?? '',
      amount: item.rate ?? 0,
      currency: 'BRL',
      eventType: 'DIVIDEND',
      raw: item,
    })) ?? []

  return {
    price: result.regularMarketPrice,
    change24hPct: result.regularMarketChangePercent ?? null,
    providerSymbol: result.symbol ?? symbol,
    asOf: new Date().toISOString(),
    raw: data,
    dividends,
  }
}
