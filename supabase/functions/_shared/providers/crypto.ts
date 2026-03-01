import { safeFetch } from '../utils.ts'

type CoinGeckoPrice = Record<
  string,
  {
    usd?: number
    brl?: number
    eur?: number
    usd_24h_change?: number
    brl_24h_change?: number
    eur_24h_change?: number
  }
>

type CoinGeckoSearch = {
  coins: Array<{ id: string; symbol: string; name: string }>
}

export type CryptoQuote = {
  price: number
  change24hPct: number | null
  providerSymbol: string
  asOf: string
  raw: unknown
}

const SYMBOL_MAP: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  BNB: 'binancecoin',
  SOL: 'solana',
  XRP: 'ripple',
  ADA: 'cardano',
  DOT: 'polkadot',
  MATIC: 'matic-network',
  AVAX: 'avalanche-2',
}

const resolveCoinId = async (symbol: string) => {
  const upper = symbol.toUpperCase()
  if (SYMBOL_MAP[upper]) {
    return SYMBOL_MAP[upper]
  }
  const searchUrl = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(
    upper
  )}`
  const { data } = await safeFetch<CoinGeckoSearch>(searchUrl)
  const match = data?.coins?.find(
    (coin) => coin.symbol.toUpperCase() === upper
  )
  return match?.id ?? null
}

export const fetchCryptoQuote = async (
  symbol: string,
  currency: string
): Promise<CryptoQuote | null> => {
  const coinId = await resolveCoinId(symbol)
  if (!coinId) return null

  const vsCurrency = currency.toLowerCase()
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=${vsCurrency}&include_24hr_change=true`
  const { data } = await safeFetch<CoinGeckoPrice>(url)
  if (!data || !data[coinId]) {
    return null
  }

  const entry = data[coinId]
  const price = entry[vsCurrency as 'usd' | 'brl' | 'eur']
  if (!price) return null

  const changeKey = `${vsCurrency}_24h_change` as keyof typeof entry
  const change24h = entry[changeKey] ?? null

  return {
    price,
    change24hPct: typeof change24h === 'number' ? change24h : null,
    providerSymbol: coinId,
    asOf: new Date().toISOString(),
    raw: data,
  }
}
