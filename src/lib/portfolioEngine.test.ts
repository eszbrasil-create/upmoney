import { describe, expect, it } from 'vitest'
import { applyOperation, rebuildPositions, type Operation } from './portfolioEngine'

let opId = 0
const baseOp = (partial: Partial<Operation>): Operation => ({
  id: `op-${++opId}`,
  assetId: 'PETR4',
  type: 'BUY',
  date: '2026-01-01',
  quantity: 1,
  price: 1,
  fees: 0,
  ...partial,
})

describe('portfolioEngine', () => {
  it('compra unica: 10 a 100 => PM=100', () => {
    const op = baseOp({ quantity: 10, price: 100 })
    const result = applyOperation(undefined, op)
    expect(result.positionAfter.avgPrice).toBe(100)
    expect(result.positionAfter.quantity).toBe(10)
  })

  it('duas compras: 10 a 100 + 10 a 110 => PM=105', () => {
    const op1 = baseOp({ quantity: 10, price: 100, date: '2026-01-01' })
    const op2 = baseOp({ quantity: 10, price: 110, date: '2026-01-02' })
    const positions = rebuildPositions([op1, op2])
    const pos = positions.get('PETR4')!
    expect(pos.avgPrice).toBe(105)
    expect(pos.quantity).toBe(20)
  })

  it('venda parcial: compra 20 a 100, vende 5 a 120 => PM permanece 100', () => {
    const buy = baseOp({ quantity: 20, price: 100, date: '2026-01-01' })
    const sell = baseOp({
      type: 'SELL',
      quantity: 5,
      price: 120,
      date: '2026-01-02',
    })
    const positions = rebuildPositions([buy, sell])
    const pos = positions.get('PETR4')!
    expect(pos.avgPrice).toBe(100)
    expect(pos.quantity).toBe(15)
  })

  it('compra apos venda: compra 20 a 100, vende 10 a 120, compra 10 a 80', () => {
    const buy1 = baseOp({ quantity: 20, price: 100, date: '2026-01-01' })
    const sell = baseOp({
      type: 'SELL',
      quantity: 10,
      price: 120,
      date: '2026-01-02',
    })
    const buy2 = baseOp({ quantity: 10, price: 80, date: '2026-01-03' })
    const positions = rebuildPositions([buy1, sell, buy2])
    const pos = positions.get('PETR4')!
    expect(pos.quantity).toBe(20)
    expect(pos.avgPrice).toBe(90)
  })

  it('venda total: zera posicao e reseta PM', () => {
    const buy = baseOp({ quantity: 10, price: 50, date: '2026-01-01' })
    const sell = baseOp({
      type: 'SELL',
      quantity: 10,
      price: 60,
      date: '2026-01-02',
    })
    const positions = rebuildPositions([buy, sell])
    const pos = positions.get('PETR4')!
    expect(pos.quantity).toBe(0)
    expect(pos.avgPrice).toBe(0)
    expect(pos.totalCost).toBe(0)
  })

  it('erro: vender mais do que tem', () => {
    const buy = baseOp({ quantity: 5, price: 100, date: '2026-01-01' })
    const sell = baseOp({
      type: 'SELL',
      quantity: 10,
      price: 110,
      date: '2026-01-02',
    })
    expect(() => rebuildPositions([buy, sell])).toThrow(
      /cannot sell more than current quantity/i
    )
  })

  it('cripto decimal: 0.1 BTC a 40000 + 0.05 a 42000 => PM correto', () => {
    const buy1 = baseOp({
      assetId: 'BTC',
      quantity: 0.1,
      price: 40000,
      date: '2026-01-01',
    })
    const buy2 = baseOp({
      assetId: 'BTC',
      quantity: 0.05,
      price: 42000,
      date: '2026-01-02',
    })

    const positions = rebuildPositions([buy1, buy2], {
      assetPrecision: {
        BTC: { avgPrice: 8, quantity: 8 },
      },
    })

    const pos = positions.get('BTC')!
    expect(pos.quantity).toBeCloseTo(0.15, 8)
    expect(pos.avgPrice).toBeCloseTo(40666.66666667, 6)
  })
})
