import { useState } from 'react'
import type { PositionWithCache } from '../../types/assets'
import {
  applyOperation,
  type Operation,
  type Position,
} from '../../lib/portfolioEngine'
import { formatCurrency, formatQty } from '../../lib/format'

const formatPercentSigned = (ratio: number) => {
  const prefix = ratio > 0 ? '+' : ratio < 0 ? '-' : ''
  return `${prefix}${new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(ratio))}`
}

type AssetTableProps = {
  positions: PositionWithCache[]
  onEdit: (position: PositionWithCache) => void
  onRemove: (position: PositionWithCache) => void
  onViewOperations: (positions: PositionWithCache[]) => void
}

export function AssetTable({
  positions,
  onEdit,
  onRemove,
  onViewOperations,
}: AssetTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(() => new Set())

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

  const qtyDecimalsByType: Record<string, number> = {
    cash: 2,
    fixed_income: 2,
    equity: 0,
    reits: 0,
    etf: 0,
    funds: 2,
    crypto: 8,
    international: 4,
    real_estate: 2,
    other: 4,
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

  const aggregated = (() => {
    const grouped = new Map<
      string,
      {
        id: string
        symbol: string
        asset_type: string
        currency: string | null
        positions: PositionWithCache[]
        position: Position
      }
    >()

    const sorted = [...positions].sort(sortByOperationDate)

    for (const position of sorted) {
      const key = `${position.symbol}::${position.asset_type}::${position.currency ?? ''}`
      if (!grouped.has(key)) {
        const emptyPosition: Position = {
          assetId: key,
          quantity: 0,
          avgPrice: 0,
          totalCost: 0,
          realizedPnL: 0,
          lastUpdated: '',
        }
        grouped.set(key, {
          id: position.id,
          symbol: position.symbol,
          asset_type: position.asset_type,
          currency: position.currency ?? null,
          positions: [],
          position: emptyPosition,
        })
      }

      const entry = grouped.get(key)!
      entry.positions.push(position)
      const op: Operation = {
        id: position.id,
        assetId: key,
        type: position.trade_side === 'sell' ? 'SELL' : 'BUY',
        date: position.entry_date,
        quantity: Math.abs(Number(position.quantity)),
        price: Number(position.entry_price),
        fees: 0,
      }
      const result = applyOperation(entry.position, op)
      entry.position = result.positionAfter
    }

    return Array.from(grouped.values()).filter((entry) => entry.position.quantity > 0)
  })()

  const getLatestPrice = (entry: { positions: PositionWithCache[] }) => {
    for (const position of entry.positions) {
      if (position.marketCache) return position.marketCache
    }
    return null
  }

  return (
    <div className="asset-table">
      <div className="asset-table__header">
        <span>Ativo</span>
        <span>Tipo</span>
        <span>Quantidade</span>
        <span>Preço médio</span>
        <span>Preço atual</span>
        <span>Valor total</span>
        <span>Ações</span>
      </div>
      {aggregated.map((entry) => {
        const latestPrice = getLatestPrice(entry)
        const unitPriceForTotal = latestPrice?.price ?? entry.position.avgPrice
        const totalValue = entry.position.quantity * unitPriceForTotal
        const hasLivePrice = latestPrice?.price != null
        const costBasis = entry.position.totalCost
        const variationValue = hasLivePrice ? totalValue - costBasis : null
        const variationPct =
          hasLivePrice && costBasis > 0 ? (totalValue - costBasis) / costBasis : null
        const totalTrend = hasLivePrice
          ? totalValue > costBasis
            ? 'up'
            : totalValue < costBasis
              ? 'down'
              : 'flat'
          : null
        const actionTarget = entry.positions[entry.positions.length - 1]
        const qtyDecimals =
          qtyDecimalsByType[entry.asset_type] ?? qtyDecimalsByType.other
        const isExpanded = expandedRows.has(entry.id)
        return (
          <div
            className={`asset-table__row ${isExpanded ? 'expanded' : 'collapsed'}`}
            key={entry.id}
          >
            <div className="asset-main">
              <span className="asset-link">{entry.symbol}</span>
            </div>
            <span className="asset-type">
              {typeLabels[entry.asset_type] ?? entry.asset_type}
            </span>
            <span className="asset-qty">
              {formatQty(entry.position.quantity, qtyDecimals)}
            </span>
            <span className="asset-avg">
              {formatCurrency(entry.position.avgPrice, entry.currency)}
            </span>
            <span className="asset-current">
              {latestPrice?.price != null ? (
                <>
                  <span className="asset-current-main">
                    {formatCurrency(latestPrice.price, entry.currency)}
                    {totalTrend ? (
                      <span
                        className={`asset-total-trend asset-total-trend--${totalTrend}`}
                        aria-label={
                          totalTrend === 'up'
                            ? 'Valor acima do custo de entrada'
                            : totalTrend === 'down'
                              ? 'Valor abaixo do custo de entrada'
                              : 'Valor igual ao custo de entrada'
                        }
                        title={
                          totalTrend === 'up'
                            ? 'Acima do custo de entrada'
                            : totalTrend === 'down'
                              ? 'Abaixo do custo de entrada'
                              : 'Igual ao custo de entrada'
                        }
                      >
                        {totalTrend === 'up' ? '↑' : totalTrend === 'down' ? '↓' : '•'}
                      </span>
                    ) : null}
                  </span>
                  {isExpanded && totalTrend && variationValue != null && variationPct != null ? (
                    <span
                      className={`asset-current-meta asset-current-meta--${totalTrend}`}
                    >
                      {`${variationValue > 0 ? '+' : ''}${formatCurrency(
                        variationValue,
                        entry.currency
                      )} (${formatPercentSigned(variationPct)})`}
                    </span>
                  ) : null}
                </>
              ) : (
                '—'
              )}
            </span>
            <div className="asset-total-wrap">
              <span className="asset-total">
                {formatCurrency(totalValue, entry.currency)}
              </span>
              <button
                className="btn small ghost asset-toggle"
                onClick={() =>
                  setExpandedRows((prev) => {
                    const next = new Set(prev)
                    if (next.has(entry.id)) {
                      next.delete(entry.id)
                    } else {
                      next.add(entry.id)
                    }
                    return next
                  })
                }
                aria-expanded={isExpanded}
                aria-label={isExpanded ? 'Recolher detalhes' : 'Expandir detalhes'}
              >
                {isExpanded ? 'Fechar' : 'Abrir'}
              </button>
            </div>
            <div className="asset-actions">
              <button
                className="btn small ghost"
                onClick={() => onViewOperations(entry.positions)}
              >
                Operações
              </button>
              <button
                className="btn small ghost"
                onClick={() => onEdit(actionTarget)}
              >
                Editar
              </button>
              <button
                className="btn small danger"
                onClick={() => onRemove(actionTarget)}
              >
                Remover
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
