import Big from 'big.js'

export type OperationType = 'BUY' | 'SELL'

export type OperationFees = {
  brokerageFee?: number
  exchangeFee?: number
  taxFee?: number
}

export type Operation = {
  id: string
  assetId: string
  type: OperationType
  date: string
  quantity: number
  price: number
  fees?: number
  feeDetails?: OperationFees
  notes?: string
}

export type Position = {
  assetId: string
  quantity: number
  avgPrice: number
  totalCost: number
  realizedPnL: number
  lastUpdated: string
}

export type TradeSummary = {
  proceeds: number
  costBasisSold: number
}

export type TradeResult = {
  positionAfter: Position
  realizedPnLThisTrade: number
  summaryThisTrade?: TradeSummary
}

export type PrecisionConfig = {
  avgPrice: number
  money: number
  quantity: number
}

export type AssetPrecisionConfig = Partial<PrecisionConfig>

export type EngineConfig = {
  method?: 'AVG_COST' | 'FIFO'
  defaultPrecision?: PrecisionConfig
  assetPrecision?: Record<string, AssetPrecisionConfig>
}

const DEFAULT_PRECISION: PrecisionConfig = {
  avgPrice: 4,
  money: 2,
  quantity: 8,
}

const withPrecision = (
  assetId: string,
  config?: EngineConfig
): PrecisionConfig => {
  const defaults = config?.defaultPrecision ?? DEFAULT_PRECISION
  const asset = config?.assetPrecision?.[assetId]
  return {
    avgPrice: asset?.avgPrice ?? defaults.avgPrice,
    money: asset?.money ?? defaults.money,
    quantity: asset?.quantity ?? defaults.quantity,
  }
}

const toBig = (value: number | string | Big) => new Big(value || 0)

const sumFees = (operation: Operation) => {
  const base = operation.fees ?? 0
  const details = operation.feeDetails
  if (!details) return base
  return (
    base +
    (details.brokerageFee ?? 0) +
    (details.exchangeFee ?? 0) +
    (details.taxFee ?? 0)
  )
}

const roundBig = (value: Big, decimals: number) =>
  value.round(decimals, Big.roundHalfUp)

const buildPosition = (
  assetId: string,
  quantity: Big,
  avgPrice: Big,
  totalCost: Big,
  realizedPnL: Big,
  lastUpdated: string,
  precision: PrecisionConfig
): Position => ({
  assetId,
  quantity: roundBig(quantity, precision.quantity).toNumber(),
  avgPrice: roundBig(avgPrice, precision.avgPrice).toNumber(),
  totalCost: roundBig(totalCost, precision.money).toNumber(),
  realizedPnL: roundBig(realizedPnL, precision.money).toNumber(),
  lastUpdated,
})

const assertOperation = (operation: Operation) => {
  if (!operation.assetId) {
    throw new Error('assetId is required')
  }
  if (operation.quantity <= 0 || operation.price <= 0) {
    throw new Error('quantity and price must be greater than 0')
  }
  if (sumFees(operation) < 0) {
    throw new Error('fees must be zero or positive')
  }
}

const toPosition = (position: Position | null | undefined, assetId: string) => {
  if (position) return position
  return {
    assetId,
    quantity: 0,
    avgPrice: 0,
    totalCost: 0,
    realizedPnL: 0,
    lastUpdated: '',
  }
}

export const applyOperation = (
  position: Position | null | undefined,
  operation: Operation,
  config?: EngineConfig
): TradeResult => {
  // Average cost method: sells reduce quantity but do not change avg price.
  assertOperation(operation)
  if (config?.method && config.method !== 'AVG_COST') {
    throw new Error('Unsupported method')
  }

  const precision = withPrecision(operation.assetId, config)
  const current = toPosition(position, operation.assetId)

  const qtyPrev = toBig(current.quantity)
  const pmPrev = toBig(current.avgPrice)
  const costPrev = qtyPrev.times(pmPrev)
  const realizedPrev = toBig(current.realizedPnL)
  const qty = toBig(operation.quantity)
  const price = toBig(operation.price)
  const fees = toBig(sumFees(operation))

  if (operation.type === 'BUY') {
    const totalCostNewBuy = qty.times(price).plus(fees)
    const qtyNew = qtyPrev.plus(qty)
    const totalCostNew = costPrev.plus(totalCostNewBuy)
    const pmNew = qtyNew.eq(0) ? new Big(0) : totalCostNew.div(qtyNew)

    const positionAfter = buildPosition(
      operation.assetId,
      qtyNew,
      pmNew,
      totalCostNew,
      realizedPrev,
      operation.date,
      precision
    )

    return {
      positionAfter,
      realizedPnLThisTrade: 0,
    }
  }

  if (qty.gt(qtyPrev)) {
    throw new Error('cannot sell more than current quantity')
  }

  const proceeds = qty.times(price).minus(fees)
  const costBasisSold = qty.times(pmPrev)
  const realizedThis = proceeds.minus(costBasisSold)
  const qtyNew = qtyPrev.minus(qty)
  const totalCostNew = qtyNew.eq(0) ? new Big(0) : qtyNew.times(pmPrev)
  const pmNew = qtyNew.eq(0) ? new Big(0) : pmPrev

  const positionAfter = buildPosition(
    operation.assetId,
    qtyNew,
    pmNew,
    totalCostNew,
    realizedPrev.plus(realizedThis),
    operation.date,
    precision
  )

  return {
    positionAfter,
    realizedPnLThisTrade: roundBig(realizedThis, precision.money).toNumber(),
    summaryThisTrade: {
      proceeds: roundBig(proceeds, precision.money).toNumber(),
      costBasisSold: roundBig(costBasisSold, precision.money).toNumber(),
    },
  }
}

export const rebuildPositions = (
  operations: Operation[],
  config?: EngineConfig
): Map<string, Position> => {
  const sorted = [...operations].sort((a, b) => {
    const aDate = new Date(a.date).getTime()
    const bDate = new Date(b.date).getTime()
    if (aDate === bDate) return 0
    return aDate - bDate
  })

  const positions = new Map<string, Position>()
  for (const operation of sorted) {
    const current = positions.get(operation.assetId)
    const { positionAfter } = applyOperation(current, operation, config)
    positions.set(operation.assetId, positionAfter)
  }
  return positions
}

export const getAssetLedger = (
  operations: Operation[],
  assetId: string,
  config?: EngineConfig
) => {
  const filtered = operations.filter((op) => op.assetId === assetId)
  const sorted = [...filtered].sort((a, b) => {
    const aDate = new Date(a.date).getTime()
    const bDate = new Date(b.date).getTime()
    if (aDate === bDate) return 0
    return aDate - bDate
  })

  const ledger: TradeResult[] = []
  let current: Position | undefined
  for (const operation of sorted) {
    const result = applyOperation(current, operation, config)
    ledger.push(result)
    current = result.positionAfter
  }

  return ledger
}

