import type { PositionWithCache } from '../../types/assets'
import {
  applyOperation,
  type Operation,
  type Position,
  type TradeResult,
} from '../../lib/portfolioEngine'
import { formatCurrency } from '../../lib/format'

type AssetOperationsModalProps = {
  open: boolean
  onClose: () => void
  positions: PositionWithCache[]
}

type LedgerEntry = {
  position: PositionWithCache
  operation: Operation
  result: TradeResult
}

export function AssetOperationsModal({
  open,
  onClose,
  positions,
}: AssetOperationsModalProps) {
  if (!open) {
    return null
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

  const ascending = [...positions].sort(sortByOperationDate)
  const sorted = [...ascending].reverse()

  const headerSymbol = sorted[0]?.symbol ?? 'Ativo'
  const assetKey = ascending[0]
    ? `${ascending[0].symbol}::${ascending[0].asset_type}::${ascending[0].currency ?? ''}`
    : 'asset'

  const ledgerState = ascending.reduce(
    (
      acc: { current: Position | undefined; ledger: LedgerEntry[] },
      position: PositionWithCache
    ) => {
      const operation: Operation = {
        id: position.id,
        assetId: assetKey,
        type: position.trade_side === 'sell' ? 'SELL' : 'BUY',
        date: position.entry_date,
        quantity: Math.abs(Number(position.quantity)),
        price: Number(position.entry_price),
        fees: 0,
      }
      const result = applyOperation(acc.current, operation)
      return {
        current: result.positionAfter,
        ledger: [...acc.ledger, { position, operation, result }],
      }
    },
    { current: undefined as Position | undefined, ledger: [] as LedgerEntry[] }
  )

  const ledgerDisplay = [...ledgerState.ledger].reverse()

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card asset-ops-modal">
        <div className="modal-header">
          <h2>Operações de {headerSymbol}</h2>
          <button className="modal-close" onClick={onClose}>
            Fechar
          </button>
        </div>
        <div className="asset-ops-table">
          <div className="asset-ops-header">
            <span>Data</span>
            <span>Operação</span>
            <span>Quantidade</span>
            <span>Preço</span>
            <span>Total</span>
            <span>PM</span>
            <span>Resultado</span>
          </div>
          {ledgerDisplay.map(({ position, result }) => {
            const qty = Math.abs(position.quantity)
            const total = qty * position.entry_price
            const isSell = position.trade_side === 'sell'
            const realized = result.realizedPnLThisTrade
            return (
              <div className="asset-ops-row" key={position.id}>
                <span>{new Date(position.entry_date).toLocaleDateString('pt-BR')}</span>
                <span
                  className={`asset-op ${position.trade_side === 'sell' ? 'sell' : 'buy'}`}
                >
                  {position.trade_side === 'sell' ? 'Venda' : 'Compra'}
                </span>
                <span>{qty}</span>
                <span>{formatCurrency(position.entry_price, position.currency)}</span>
                <span>{formatCurrency(total, position.currency)}</span>
                <span>{formatCurrency(result.positionAfter.avgPrice, position.currency)}</span>
                <span className={realized < 0 ? 'neg' : 'pos'}>
                  {isSell ? formatCurrency(realized, position.currency) : '—'}
                </span>
              </div>
            )
          })}
        </div>
        <p className="asset-ops-note">
          Resultado de venda = (preco * quantidade - taxas) - (PM * quantidade).
        </p>
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
