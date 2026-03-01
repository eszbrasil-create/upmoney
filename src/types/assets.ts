export type AssetType =
  | 'cash'
  | 'fixed_income'
  | 'equity'
  | 'reits'
  | 'etf'
  | 'funds'
  | 'crypto'
  | 'international'
  | 'real_estate'
  | 'other'

export type Position = {
  id: string
  user_id: string
  asset_type: AssetType
  symbol: string
  provider_symbol: string | null
  trade_side: 'buy' | 'sell'
  quantity: number
  entry_price: number
  entry_date: string
  currency: string | null
  created_at: string
  updated_at: string
}

export type MarketPriceCache = {
  id: string
  user_id: string
  position_id: string
  symbol: string
  asset_type: AssetType
  price: number
  change_24h_pct: number | null
  provider: string
  as_of: string
  fetched_at: string
}

export type MarketCache = {
  id: string
  user_id: string
  ticker: string
  price: number | null
  change_pct: number | null
  currency: string | null
  provider: string | null
  updated_at: string
}

export type PositionWithCache = Position & {
  marketCache?: MarketCache | null
}
