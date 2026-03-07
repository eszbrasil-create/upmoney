import { useEffect, useMemo, useState } from 'react'
import { AssetModal, type AssetFormPayload } from '../components/assets/AssetModal'
import { AssetTable } from '../components/assets/AssetTable'
import { AssetOperationsModal } from '../components/assets/AssetOperationsModal'
import { supabase, supabaseConfigMissing } from '../lib/supabaseClient'
import {
  applyOperation,
  type Operation,
  type Position as PortfolioPosition,
} from '../lib/portfolioEngine'
import type { MarketCache, Position, PositionWithCache } from '../types/assets'

type MarketSyncResponse = {
  updated: boolean
  updatedAt: string | null
  quotes?: Array<{
    ticker: string
    price: number | null
    changePct: number | null
    currency?: string | null
    updatedAt: string | null
  }>
  errors?: Array<{ ticker: string; message: string }>
}

type AssetsPageProps = {
  onOpenMenu?: () => void
  onAssetAdded?: () => void
}

export function AssetsPage({ onOpenMenu, onAssetAdded }: AssetsPageProps) {
  const [positions, setPositions] = useState<PositionWithCache[]>([])
  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Position | null>(null)
  const [opsOpen, setOpsOpen] = useState(false)
  const [opsPositions, setOpsPositions] = useState<PositionWithCache[]>([])
  const emptyState = useMemo(() => !loading && positions.length === 0, [loading, positions])
  const cooldownActive = cooldownUntil != null
  const lastUpdatedLabel = lastUpdatedAt
    ? new Date(lastUpdatedAt).toLocaleString('pt-BR')
    : '—'

  const summaryByType = useMemo(() => {
    if (!positions.length) {
      return []
    }

    const typeLabels: Record<string, string> = {
      cash: 'Caixa',
      fixed_income: 'Renda fixa',
      equity: 'Ações',
      reits: 'FIIs',
      etf: 'ETFs',
      funds: 'Fundos',
      crypto: 'Cripto',
      international: 'Exterior',
      real_estate: 'Imóveis',
      other: 'Outros',
    }

    const sortByOperationDate = (a: PositionWithCache, b: PositionWithCache) => {
      const aDate = new Date(a.entry_date).getTime()
      const bDate = new Date(b.entry_date).getTime()
      if (aDate !== bDate) return aDate - bDate
      const aCreated = new Date(a.created_at).getTime()
      const bCreated = new Date(b.created_at).getTime()
      if (aCreated !== bCreated) return aCreated - bCreated
      return a.id.localeCompare(b.id)
    }

    const grouped = new Map<string, PortfolioPosition>()
    const typeByKey = new Map<string, string>()
    const latestPriceByKey = new Map<string, number>()
    const sorted = [...positions].sort(sortByOperationDate)

    for (const position of sorted) {
      const key = `${position.symbol}::${position.asset_type}::${position.currency ?? ''}`
      if (!grouped.has(key)) {
        grouped.set(key, {
          assetId: key,
          quantity: 0,
          avgPrice: 0,
          totalCost: 0,
          realizedPnL: 0,
          lastUpdated: '',
        })
      }
      if (!typeByKey.has(key)) {
        typeByKey.set(key, position.asset_type)
      }
      if (position.marketCache?.price != null) {
        latestPriceByKey.set(key, Number(position.marketCache.price))
      }

      const current = grouped.get(key)!
      const op: Operation = {
        id: position.id,
        assetId: key,
        type: position.trade_side === 'sell' ? 'SELL' : 'BUY',
        date: position.entry_date,
        quantity: Math.abs(Number(position.quantity)),
        price: Number(position.entry_price),
        fees: 0,
      }
      const result = applyOperation(current, op)
      grouped.set(key, result.positionAfter)
    }

    const totalsByType = new Map<string, number>()
    let grandTotal = 0

    for (const [key, aggregated] of grouped.entries()) {
      if (aggregated.quantity <= 0) continue
      const unitPrice = latestPriceByKey.get(key) ?? aggregated.avgPrice
      const totalValue = aggregated.quantity * unitPrice
      if (totalValue <= 0) continue
      const assetType = typeByKey.get(key) ?? 'other'
      const next = (totalsByType.get(assetType) ?? 0) + totalValue
      totalsByType.set(assetType, next)
      grandTotal += totalValue
    }

    if (grandTotal <= 0) {
      return []
    }

    return Array.from(totalsByType.entries())
      .map(([type, value]) => ({
        type,
        label: typeLabels[type] ?? type,
        value,
        total: grandTotal,
        percent: Math.round((value / grandTotal) * 100),
      }))
      .sort((a, b) => b.percent - a.percent)
  }, [positions])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const payload = {
      updatedAt: new Date().toISOString(),
      summary: summaryByType,
    }
    if (!summaryByType.length) {
      window.localStorage.removeItem('upmoney_assets_summary')
    } else {
      window.localStorage.setItem('upmoney_assets_summary', JSON.stringify(payload))
    }

    if (supabaseConfigMissing || !supabase || !authUserId) return
    const sb = supabase
    void sb.from('user_assets_summary').upsert(
      {
        user_id: authUserId,
        summary: summaryByType,
      },
      { onConflict: 'user_id' }
    )
  }, [summaryByType, authUserId])

  const normalizeTicker = (ticker: string) => ticker.trim().toUpperCase().replace(/\\.SA$/, '')

  const loadPositions = async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false
    if (!silent) {
      setLoading(true)
    }
    setError(null)
    if (supabaseConfigMissing || !supabase) {
      setError('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para usar Ativos.')
      if (!silent) setLoading(false)
      return { hasUser: false }
    }
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      setAuthUserId(null)
      setError('Faça login para acessar seus ativos.')
      if (!silent) setLoading(false)
      return { hasUser: false }
    }
    setAuthUserId(user.id)

    const { data: positionsData, error: positionsError } = await supabase
      .from('positions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (positionsError) {
      setError('Não foi possível carregar suas posições.')
      if (!silent) setLoading(false)
      return { hasUser: true }
    }

    const tickers = Array.from(
      new Set((positionsData ?? []).map((pos) => normalizeTicker(pos.symbol)))
    )
    let cacheData: MarketCache[] = []
    if (tickers.length > 0) {
      const { data: cacheRows, error: cacheError } = await supabase
        .from('market_cache')
        .select('*')
        .eq('user_id', user.id)
        .in('ticker', tickers)
        .order('updated_at', { ascending: false })

      if (!cacheError && cacheRows) {
        cacheData = cacheRows as MarketCache[]
      }
    }

    const cacheByTicker = new Map<string, MarketCache>()
    cacheData.forEach((cache) => {
      if (!cacheByTicker.has(cache.ticker)) {
        cacheByTicker.set(cache.ticker, cache)
      }
    })

    const merged = (positionsData ?? []).map((position) => ({
      ...(position as Position),
      marketCache: cacheByTicker.get(normalizeTicker(position.symbol)) ?? null,
    }))

    setPositions(merged)
    if (!silent) setLoading(false)
    const latestCache = cacheData[0]?.updated_at ?? null
    if (latestCache) {
      setLastUpdatedAt(latestCache)
    }
    return { hasUser: true, tickersCount: tickers.length, cacheCount: cacheData.length }
  }

  const syncMarket = async (force: boolean, opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false
    if (supabaseConfigMissing || !supabase) {
      if (!silent) {
        setError('Configure o Supabase para atualizar preços.')
      }
      return
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      if (!silent) {
        setError('Faça login para atualizar preços.')
      }
      return
    }

    if (!silent) {
      setRefreshing(true)
      setError(null)
    }

    const { data, error: refreshError } = await supabase.functions.invoke('market-sync', {
      body: { force },
    })

    if (refreshError) {
      if (!silent) {
        setError(`Falha ao atualizar preços: ${refreshError.message}`)
        setRefreshing(false)
      }
      console.error('market-sync error:', refreshError.message)
      return
    }

    const summary = data as MarketSyncResponse
    if (summary?.updatedAt) {
      setLastUpdatedAt(summary.updatedAt)
    }
    if (!silent) {
      if (summary?.errors?.length) {
        setToast(`Atualização concluída com ${summary.errors.length} ativos sem cotação.`)
      } else if (summary?.updated) {
        setToast('Cotações atualizadas com sucesso.')
      } else {
        setToast('Cache atualizado: nenhuma nova cotação encontrada hoje.')
      }
    }
    await loadPositions({ silent: true })
    if (!silent) {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadPositions().then((result) => {
        if (result?.hasUser) {
          // If we don't have any cached prices yet, force the first refresh.
          const shouldForce = (result.tickersCount ?? 0) > 0 && (result.cacheCount ?? 0) === 0
          void syncMarket(shouldForce, { silent: true })
        }
      })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Keep the "preco atual" reasonably fresh while the user stays on the page.
    // The edge function applies its own cooldown to avoid provider hammering.
    const intervalMs = 5 * 60 * 1000
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      void syncMarket(false, { silent: true })
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!cooldownUntil) return
    const remaining = cooldownUntil - Date.now()
    if (remaining <= 0) {
      const timer = setTimeout(() => setCooldownUntil(null), 0)
      return () => clearTimeout(timer)
    }
    const timer = setTimeout(() => setCooldownUntil(null), remaining)
    return () => clearTimeout(timer)
  }, [cooldownUntil])

  const handleSave = async (payload: AssetFormPayload) => {
    if (supabaseConfigMissing || !supabase) {
      setError('Configure o Supabase para salvar ativos.')
      return
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError('Sessão expirada. Faça login novamente.')
      return
    }

    const signedQuantity =
      payload.trade_side === 'sell'
        ? -Math.abs(payload.quantity)
        : Math.abs(payload.quantity)

    if (editing) {
      const { error: updateError } = await supabase
        .from('positions')
        .update({
          trade_side: payload.trade_side,
          quantity: signedQuantity,
          entry_price: payload.entry_price,
          entry_date: payload.entry_date,
          currency: payload.currency,
          symbol: payload.symbol,
          asset_type: payload.asset_type,
        })
        .eq('id', editing.id)
        .eq('user_id', user.id)

      if (updateError) {
        setError('Não foi possível atualizar o ativo.')
        return
      }
      setToast('Ativo atualizado com sucesso.')
    } else {
      const { error: insertError } = await supabase.from('positions').insert({
        user_id: user.id,
        asset_type: payload.asset_type,
        symbol: payload.symbol,
        trade_side: payload.trade_side,
        quantity: signedQuantity,
        entry_price: payload.entry_price,
        entry_date: payload.entry_date,
        currency: payload.currency,
      })

      if (insertError) {
        setError('Não foi possível adicionar o ativo.')
        return
      }
      setToast('Ativo adicionado com sucesso.')
      onAssetAdded?.()
    }

    setModalOpen(false)
    setEditing(null)
    await loadPositions({ silent: true })
    await syncMarket(true, { silent: true })
    await loadPositions({ silent: true })
  }


  const handleRemove = async (position: PositionWithCache) => {
    if (supabaseConfigMissing || !supabase) {
      setError('Configure o Supabase para remover ativos.')
      return
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError('Sessão expirada. Faça login novamente.')
      return
    }
    const confirmed = window.confirm(`Remover ${position.symbol}?`)
    if (!confirmed) {
      return
    }
    const { error: deleteError } = await supabase
      .from('positions')
      .delete()
      .eq('id', position.id)
      .eq('user_id', user.id)

    if (deleteError) {
      setError('Não foi possível remover o ativo.')
      return
    }
    setToast('Ativo removido.')
    loadPositions()
  }

  const handleRefresh = async () => {
    const cooldownMs = 30_000
    if (cooldownUntil && Date.now() < cooldownUntil) {
      setToast('Aguarde alguns segundos antes de atualizar novamente.')
      return
    }
    setCooldownUntil(Date.now() + cooldownMs)
    await syncMarket(true)
  }

  return (
    <section className="assets-page">
      <header className="assets-header">
        <div className="assets-header__main">
          {onOpenMenu ? (
            <button className="course-back" onClick={onOpenMenu}>
              Voltar
            </button>
          ) : null}
          <div>
            <div className="assets-title-row">
              <h1 className="assets-title">Ativos</h1>
              <button
                className="btn ghost assets-refresh"
                onClick={handleRefresh}
                disabled={refreshing || cooldownActive}
              >
                {refreshing ? 'Atualizando...' : 'Atualizar agora'}
              </button>
            </div>
            <p className="assets-subtitle">
              Cadastre suas posições e acompanhe preço e lucro/prejuízo com
              atualização automática.
            </p>
            <p className="assets-updated">Última atualização: {lastUpdatedLabel}</p>
          </div>
        </div>
        <div className="assets-actions">
          <button
            className="btn primary"
            onClick={() => {
              setEditing(null)
              setModalOpen(true)
            }}
          >
            Adicionar ativo
          </button>
        </div>
      </header>

      {summaryByType.length > 0 ? (
        <section className="wallet-summary">
          <div className="wallet-summary__title">Investimentos Resumo</div>
          <div className="wallet-summary__bars">
            {summaryByType.map((item) => (
              <div className="wallet-summary__row" key={item.type}>
                <span>{item.label}</span>
                <div className="wallet-summary__track">
                  <span style={{ width: `${item.percent}%` }} />
                </div>
                <strong>{item.percent}%</strong>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {error ? <div className="alert error">{error}</div> : null}
      {toast ? <div className="alert success">{toast}</div> : null}

      {supabaseConfigMissing || !supabase ? (
        <div className="asset-empty">
          <h3>Supabase não configurado</h3>
          <p>Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para usar Ativos.</p>
        </div>
      ) : null}

      {loading ? (
        <div className="asset-skeleton">
          {[0, 1, 2].map((item) => (
            <div className="asset-skeleton__row" key={item}>
              <div className="skeleton-line wide" />
              <div className="skeleton-line" />
              <div className="skeleton-line" />
              <div className="skeleton-line" />
              <div className="skeleton-line" />
              <div className="skeleton-line actions" />
            </div>
          ))}
        </div>
      ) : emptyState ? (
        <div className="asset-empty">
          <h3>Nenhum ativo cadastrado</h3>
          <p>Comece adicionando seu primeiro ativo.</p>
          <button
            className="btn primary"
            onClick={() => {
              setEditing(null)
              setModalOpen(true)
            }}
          >
            Adicionar ativo
          </button>
        </div>
      ) : (
        <AssetTable
          positions={positions}
          onEdit={(position) => {
            setEditing(position)
            setModalOpen(true)
          }}
          onRemove={handleRemove}
          onViewOperations={(positionsToView) => {
            setOpsPositions(positionsToView)
            setOpsOpen(true)
          }}
        />
      )}

      <button
        className="assets-fab"
        onClick={() => {
          setEditing(null)
          setModalOpen(true)
        }}
        aria-label="Adicionar ativo"
      >
        +
      </button>

      <AssetModal
        open={modalOpen}
        initial={editing}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onSubmit={handleSave}
      />
      <AssetOperationsModal
        open={opsOpen}
        positions={opsPositions}
        onClose={() => {
          setOpsOpen(false)
          setOpsPositions([])
        }}
      />
    </section>
  )
}
