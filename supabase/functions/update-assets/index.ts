import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.0'
import { fetchEquityQuote } from '../_shared/providers/equities.ts'
import { fetchCryptoQuote } from '../_shared/providers/crypto.ts'
import { shouldSkip, toProviderSymbol } from '../_shared/utils.ts'

type PositionRow = {
  id: string
  user_id: string
  asset_type:
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
  symbol: string
  provider_symbol: string | null
  currency: string | null
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return new Response('Missing Supabase environment variables.', { status: 500 })
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  })
  const {
    data: { user },
  } = await userClient.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  const body = await req.json().catch(() => ({}))
  const force = Boolean(body?.force)

  const { data: positions, error: positionsError } = await admin
    .from('positions')
    .select('*')
    .eq('user_id', user.id)

  if (positionsError) {
    return new Response('Failed to load positions', { status: 500 })
  }

  const positionRows = (positions ?? []) as PositionRow[]
  if (!positionRows.length) {
    return new Response(
      JSON.stringify({ updated: 0, skipped: 0, failed: 0, message: 'Nenhum ativo.' }),
      { status: 200 }
    )
  }

  const positionIds = positionRows.map((row) => row.id)
  const { data: cacheRows } = await admin
    .from('market_prices_cache')
    .select('position_id,fetched_at')
    .in('position_id', positionIds)

  const cacheByPosition = new Map<string, string>()
  ;(cacheRows ?? []).forEach((row) => {
    if (!cacheByPosition.has(row.position_id)) {
      cacheByPosition.set(row.position_id, row.fetched_at)
    }
  })

  let updated = 0
  let skipped = 0
  let failed = 0

  for (const position of positionRows) {
    const lastFetched = cacheByPosition.get(position.id)
    if (!force && shouldSkip(lastFetched)) {
      skipped += 1
      continue
    }

    if (position.asset_type !== 'equity' && position.asset_type !== 'crypto') {
      skipped += 1
      continue
    }

    const providerSymbol = toProviderSymbol(
      position.provider_symbol ?? position.symbol,
      position.asset_type
    )
    if (position.asset_type === 'equity') {
      const quote = await fetchEquityQuote(providerSymbol)
      if (!quote) {
        failed += 1
        continue
      }
      await admin.from('market_prices_cache').upsert(
        {
          user_id: position.user_id,
          position_id: position.id,
          symbol: providerSymbol,
          asset_type: position.asset_type,
          price: quote.price,
          change_24h_pct: quote.change24hPct,
          provider: 'brapi',
          as_of: quote.asOf,
          fetched_at: new Date().toISOString(),
          raw: quote.raw,
        },
        { onConflict: 'user_id,position_id' }
      )

      if (quote.dividends.length) {
        for (const event of quote.dividends) {
          if (!event.eventDate) continue
          await admin.from('dividends_cache').upsert(
            {
              user_id: position.user_id,
              position_id: position.id,
              symbol: providerSymbol,
              provider: 'brapi',
              event_date: event.eventDate,
              amount: event.amount,
              currency: event.currency ?? position.currency ?? 'BRL',
              event_type: event.eventType ?? 'DIVIDEND',
              raw: event.raw ?? null,
            },
            { onConflict: 'user_id,position_id,event_date,provider' }
          )
        }
      }

      if (position.provider_symbol !== quote.providerSymbol) {
        await admin
          .from('positions')
          .update({ provider_symbol: quote.providerSymbol })
          .eq('id', position.id)
          .eq('user_id', position.user_id)
      }

      updated += 1
      continue
    }

    const currency = position.currency ?? 'USD'
    const quote = await fetchCryptoQuote(providerSymbol, currency)
    if (!quote) {
      failed += 1
      continue
    }

    await admin.from('market_prices_cache').upsert(
      {
        user_id: position.user_id,
        position_id: position.id,
        symbol: providerSymbol,
        asset_type: position.asset_type,
        price: quote.price,
        change_24h_pct: quote.change24hPct,
        provider: 'coingecko',
        as_of: quote.asOf,
        fetched_at: new Date().toISOString(),
        raw: quote.raw,
      },
      { onConflict: 'user_id,position_id' }
    )

    if (position.provider_symbol !== quote.providerSymbol) {
      await admin
        .from('positions')
        .update({ provider_symbol: quote.providerSymbol })
        .eq('id', position.id)
        .eq('user_id', position.user_id)
    }

    updated += 1
  }

  return new Response(
    JSON.stringify({
      updated,
      skipped,
      failed,
      message: `Atualização concluída. ${updated} atualizados, ${skipped} pulados, ${failed} com erro.`,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
