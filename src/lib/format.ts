export const formatBRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export const formatCurrency = (value: number, currency?: string | null) => {
  const safeCurrency = currency || 'BRL'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: safeCurrency,
    maximumFractionDigits: 2,
  }).format(value)
}

export const formatMoney = (value: number, decimals = 2) =>
  new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)

export const formatQty = (value: number, decimals = 4) =>
  new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value)

