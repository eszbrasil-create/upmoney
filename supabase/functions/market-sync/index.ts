import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.0'
import { fetchBrapiDividends, fetchBrapiQuotes } from '../_shared/providers/brapi.ts'
import { normalizeTicker } from '../_shared/utils.ts'

type PositionRow = {
  symbol: string
  asset_type: string
}

type MarketCacheRow = {
  ticker: string
  price: number | null
  change_pct: number | null
  currency: string | null
  updated_at: string | null
}

type MarketSyncStatusRow = {
  ticker: string
  last_success_at: string | null
}

type DividendSyncStateRow = {
  ticker: string
  last_attempt_at: string | null
  last_success_at: string | null
}

const getTodayDate = () => new Date().toISOString().slice(0, 10)
const parseIsoTime = (value: string | null | undefined) => {
  if (!value) return null
  const t = new Date(value).getTime()
  return Number.isFinite(t) ? t : null
}

const DIVIDEND_HISTORY_START_DATE = '2025-06-01'

const getUserTickers = async (
  client: ReturnType<typeof createClient>,
  userId: string
) => {
  const tickers = new Set<string>()

  const { data: assets, error } = await client
    .from('user_assets')
    .select('ticker,type')
    .eq('user_id', userId)

  if (!error && assets?.length) {
    assets.forEach((row) => {
      tickers.add(normalizeTicker(row.ticker))
    })
  }

  const { data: positions, error: positionsError } = await client
    .from('positions')
    .select('symbol,asset_type')
    .eq('user_id', userId)

  if (!positionsError && positions?.length) {
    positions.forEach((row: PositionRow) => {
      const symbol = row.symbol?.trim()
      if (!symbol) return
      tickers.add(normalizeTicker(symbol))
    })
  }

  return Array.from(tickers)
}

const buildQuotePayload = (ticker: string, cache: MarketCacheRow | null) => ({
  ticker,
  price: cache?.price ?? null,
  changePct: cache?.change_pct ?? null,
  currency: cache?.currency ?? null,
  updatedAt: cache?.updated_at ?? null,
})

serve(async (req) => {
  const requestId = crypto.randomUUID()
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  const jwt = authHeader.startsWith('Bearer ')
    ? authHeader.replace('Bearer ', '').trim()
    : authHeader.trim()
  
  console.log('[market-sync]', requestId, 'auth_header_received:', authHeader.substring(0, 50) + '...')
  console.log('[market-sync]', requestId, 'jwt_length:', jwt.length)
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  if (!supabaseUrl || !anonKey || !serviceKey) {
    console.error('[market-sync]', requestId, 'missing_env')
    return new Response('Missing Supabase environment variables.', {
      status: 500,
      headers: corsHeaders,
    })
  }

  if (!jwt) {
    console.warn('[market-sync]', requestId, 'missing_auth_header')
    return new Response(
      JSON.stringify({
        error: 'missing_auth',
        message: 'Authorization header ausente.',
        requestId,
      }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  // Validate the JWT via Supabase Auth (more reliable than manual JWT checks, and
  // works even when issuer/custom domains differ).
  const { data: authData, error: authError } = await admin.auth.getUser(jwt)
  const userId = authData?.user?.id ?? null
  if (authError || !userId) {
    console.warn('[market-sync]', requestId, 'unauthorized', authError?.message ?? 'no_user')
    return new Response(
      JSON.stringify({
        error: 'unauthorized',
        message: 'Token inválido ou expirado.',
        requestId,
      }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const body = await req.json().catch(() => ({}))
  const force = Boolean(body?.force)

  const tickers = await getUserTickers(admin, userId)
  if (!tickers.length) {
    return new Response(
      JSON.stringify({ updated: false, updatedAt: null, quotes: [], errors: [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { data: cacheRows } = await admin
    .from('market_cache')
    .select('ticker,price,change_pct,currency,updated_at')
    .eq('user_id', userId)
    .in('ticker', tickers)

  const { data: previousStatusRows } = await admin
    .from('market_sync_status')
    .select('ticker,last_success_at')
    .eq('user_id', userId)
    .in('ticker', tickers)

  const { data: dividendSyncStateRows } = await admin
    .from('market_dividend_sync_state')
    .select('ticker,last_attempt_at,last_success_at')
    .eq('provider', 'brapi')
    .in('ticker', tickers)

  const cacheByTicker = new Map<string, MarketCacheRow>()
  ;(cacheRows ?? []).forEach((row) => {
    if (!cacheByTicker.has(row.ticker)) {
      cacheByTicker.set(row.ticker, row)
    }
  })
  const previousSuccessByTicker = new Map<string, string | null>()
  ;((previousStatusRows ?? []) as MarketSyncStatusRow[]).forEach((row) => {
    previousSuccessByTicker.set(row.ticker, row.last_success_at ?? null)
  })
  const dividendLastAttemptByTicker = new Map<string, string | null>()
  const dividendLastSuccessByTicker = new Map<string, string | null>()
  ;((dividendSyncStateRows ?? []) as DividendSyncStateRow[]).forEach((row) => {
    dividendLastAttemptByTicker.set(row.ticker, row.last_attempt_at ?? null)
    dividendLastSuccessByTicker.set(row.ticker, row.last_success_at ?? null)
  })

  const { data: logRow } = await admin
    .from('user_market_update_log')
    .select('last_update_date,last_update_at')
    .eq('user_id', userId)
    .maybeSingle()

  const today = getTodayDate()
  const minIntervalSeconds = Number(Deno.env.get('MARKET_SYNC_MIN_INTERVAL_SECONDS') ?? '300')
  const minIntervalMs =
    Number.isFinite(minIntervalSeconds) && minIntervalSeconds > 0
      ? minIntervalSeconds * 1000
      : 300_000
  const lastUpdateMs = parseIsoTime(logRow?.last_update_at ?? null)
  const nowMs = Date.now()

  // If we have cache and we refreshed recently, just return cache.
  // This enables "preco atual" behavior without hammering providers.
  if (
    !force &&
    lastUpdateMs != null &&
    nowMs - lastUpdateMs < minIntervalMs &&
    (cacheRows?.length ?? 0) > 0
  ) {
    const quotes = tickers.map((ticker) =>
      buildQuotePayload(ticker, cacheByTicker.get(ticker) ?? null)
    )

    return new Response(
      JSON.stringify({
        updated: false,
        updatedAt: logRow?.last_update_at ?? null,
        quotes,
        errors: [],
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const now = new Date().toISOString()
  const nowTimestamp = Date.now()
  const dividendMinIntervalHours = Number(
    Deno.env.get('MARKET_DIVIDEND_MIN_SYNC_HOURS') ?? '24'
  )
  const dividendMinIntervalMs =
    Number.isFinite(dividendMinIntervalHours) && dividendMinIntervalHours > 0
      ? dividendMinIntervalHours * 60 * 60 * 1000
      : 24 * 60 * 60 * 1000
  type ProviderQuote = {
    source: 'brapi'
    quote: {
      symbol: string
      price: number
      changePct: number | null
      currency: string | null
      marketTime?: string
    }
  }
  const quoteByTicker = new Map<string, ProviderQuote>()

  console.log('[market-sync]', requestId, 'brapi_request', { tickers: tickers.length })
  const brapiQuotes = await fetchBrapiQuotes(tickers)
  brapiQuotes.forEach((quote) => {
    const ticker = normalizeTicker(quote.symbol)
    quoteByTicker.set(ticker, { source: 'brapi', quote })
  })

  const upsertRows = tickers
    .map((ticker) => {
      const entry = quoteByTicker.get(ticker)
      if (!entry) return null
      const quote = entry.quote
      return {
        user_id: userId,
        ticker,
        price: quote.price,
        change_pct: quote.changePct,
        currency: quote.currency,
        provider: entry.source,
        updated_at: quote.marketTime ?? now,
      }
    })
    .filter(Boolean)

  if (upsertRows.length) {
    await admin.from('market_cache').upsert(upsertRows, {
      onConflict: 'user_id,ticker',
    })
  }

  const dividendEventsRows: Array<{
    provider: 'brapi'
    ticker: string
    event_key: string
    payment_date: string
    ex_date: string | null
    approved_on: string | null
    rate: number
    label: string | null
    raw: unknown
    last_seen_at: string
  }> = []
  const dividendSyncRows: Array<{
    provider: 'brapi'
    ticker: string
    status: 'updated' | 'no_change' | 'provider_error' | 'provider_empty'
    message: string | null
    last_attempt_at: string
    last_success_at: string | null
  }> = []

  for (const ticker of tickers) {
    const lastAttemptMs = parseIsoTime(dividendLastAttemptByTicker.get(ticker) ?? null)
    const isDue =
      force ||
      lastAttemptMs == null ||
      nowTimestamp - lastAttemptMs >= dividendMinIntervalMs
    if (!isDue) continue

    const { result, error: dividendError } = await fetchBrapiDividends(ticker)
    if (dividendError) {
      dividendSyncRows.push({
        provider: 'brapi',
        ticker,
        status: 'provider_error',
        message: `Falha ao consultar dividendos (${dividendError}).`,
        last_attempt_at: now,
        last_success_at: dividendLastSuccessByTicker.get(ticker) ?? null,
      })
      continue
    }

    const normalizedTicker = normalizeTicker(result?.symbol ?? ticker)
    const filteredEvents =
      result?.dividends.filter((event) => event.paymentDate >= DIVIDEND_HISTORY_START_DATE) ?? []

    if (!filteredEvents.length) {
      dividendSyncRows.push({
        provider: 'brapi',
        ticker: normalizedTicker,
        status: 'no_change',
        message: 'Sem novos dividendos/JCP para salvar.',
        last_attempt_at: now,
        last_success_at: now,
      })
      continue
    }

    filteredEvents.forEach((event) => {
      const label = event.label?.trim().toUpperCase() ?? null
      const exDate = event.exDate ?? ''
      const key = ['brapi', normalizedTicker, event.paymentDate, exDate, event.rate, label ?? '']
        .join('|')
      dividendEventsRows.push({
        provider: 'brapi',
        ticker: normalizedTicker,
        event_key: key,
        payment_date: event.paymentDate,
        ex_date: event.exDate,
        approved_on: event.approvedOn,
        rate: event.rate,
        label,
        raw: event.raw,
        last_seen_at: now,
      })
    })

    dividendSyncRows.push({
      provider: 'brapi',
      ticker: normalizedTicker,
      status: 'updated',
      message: `${filteredEvents.length} evento(s) de dividendos/JCP processado(s).`,
      last_attempt_at: now,
      last_success_at: now,
    })
  }

  if (dividendEventsRows.length) {
    await admin.from('market_dividend_events').upsert(dividendEventsRows, {
      onConflict: 'event_key',
    })
  }

  if (dividendSyncRows.length) {
    await admin.from('market_dividend_sync_state').upsert(dividendSyncRows, {
      onConflict: 'provider,ticker',
    })
  }

  const syncStatusRows = tickers.map((ticker) => {
    const entry = quoteByTicker.get(ticker)
    const updated = Boolean(entry)
    return {
      user_id: userId,
      ticker,
      provider: 'brapi',
      status: updated ? 'updated' : 'provider_empty',
      message: updated ? null : 'Ticker não retornou cotação no provedor.',
      last_attempt_at: now,
      last_success_at: updated ? now : previousSuccessByTicker.get(ticker) ?? null,
    }
  })
  await admin.from('market_sync_status').upsert(syncStatusRows, {
    onConflict: 'user_id,ticker',
  })

  // Only advance the "last_update_*" markers when we actually got fresh quotes.
  // Otherwise we might "lock" the user out of refreshes due to a transient provider failure.
  if (upsertRows.length) {
    await admin.from('user_market_update_log').upsert(
      {
        user_id: userId,
        last_update_date: today,
        last_update_at: now,
      },
      { onConflict: 'user_id' }
    )
  }

  const errors = tickers
    .filter((ticker) => !quoteByTicker.has(ticker))
    .map((ticker) => ({ ticker, message: 'Ticker não retornou cotação' }))

  const quotes = tickers
    .map((ticker) => {
      const entry = quoteByTicker.get(ticker)
      if (entry) {
        const quote = entry.quote
        return {
          ticker,
          price: quote.price,
          changePct: quote.changePct,
          currency: quote.currency,
          updatedAt: quote.marketTime ?? now,
        }
      }
      return buildQuotePayload(ticker, cacheByTicker.get(ticker) ?? null)
    })

  return new Response(
    JSON.stringify({
      updated: Boolean(upsertRows.length),
      updatedAt: now,
      quotes,
      errors,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
