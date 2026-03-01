import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { AssetType, Position } from '../../types/assets'

type AssetModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (payload: AssetFormPayload) => Promise<void>
  initial?: Position | null
}

export type AssetFormPayload = {
  asset_type: AssetType
  symbol: string
  trade_side: 'buy' | 'sell'
  quantity: number
  entry_price: number
  entry_date: string
  currency: string
}

const defaultPayload: AssetFormPayload = {
  asset_type: 'equity',
  symbol: '',
  trade_side: 'buy',
  quantity: 0,
  entry_price: 0,
  entry_date: '',
  currency: 'BRL',
}

export function AssetModal({ open, onClose, onSubmit, initial }: AssetModalProps) {
  const [form, setForm] = useState<AssetFormPayload>(defaultPayload)
  const [quantityInput, setQuantityInput] = useState('')
  const [priceInput, setPriceInput] = useState('')
  const [saving, setSaving] = useState(false)
  const isEditing = Boolean(initial)

  const parseNumberInput = (value: string) => {
    const normalized = value.replace(',', '.')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const sanitizeNumberInput = (value: string) => {
    const cleaned = value.replace(/[^0-9.,]/g, '')
    const firstComma = cleaned.indexOf(',')
    if (firstComma === -1) {
      return cleaned.replace(/\./g, '')
    }
    const before = cleaned.slice(0, firstComma).replace(/\./g, '')
    const after = cleaned
      .slice(firstComma + 1)
      .replace(/[.,]/g, '')
    return `${before},${after}`
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (initial) {
        setForm({
          asset_type: initial.asset_type,
          symbol: initial.symbol,
          trade_side:
            initial.trade_side ?? (Number(initial.quantity) < 0 ? 'sell' : 'buy'),
          quantity: Math.abs(Number(initial.quantity)),
          entry_price: Number(initial.entry_price),
          entry_date: initial.entry_date,
          currency: initial.currency ?? 'BRL',
        })
        setQuantityInput(String(Math.abs(Number(initial.quantity))).replace('.', ','))
        setPriceInput(String(Number(initial.entry_price)).replace('.', ','))
      } else {
        setForm(defaultPayload)
        setQuantityInput('')
        setPriceInput('')
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [initial])

  const canSubmit = useMemo(() => {
    return (
      form.symbol.trim().length > 0 &&
      form.quantity > 0 &&
      form.entry_price > 0 &&
      Boolean(form.entry_date)
    )
  }, [form])

  if (!open) {
    return null
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit || saving) {
      return
    }
    setSaving(true)
    await onSubmit(form)
    setSaving(false)
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <h2>{isEditing ? 'Editar ativo' : 'Adicionar ativo'}</h2>
          <button className="modal-close" onClick={onClose}>
            Fechar
          </button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <label>
            Tipo
            <select
              value={form.asset_type}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  asset_type: event.target.value as AssetType,
                }))
              }
            >
              <option value="cash">Caixa</option>
              <option value="fixed_income">Renda fixa</option>
              <option value="equity">Ações</option>
              <option value="reits">FIIs</option>
              <option value="etf">ETFs</option>
              <option value="funds">Fundos</option>
              <option value="crypto">Cripto</option>
              <option value="international">Exterior</option>
              <option value="real_estate">Imóveis</option>
              <option value="other">Outros</option>
            </select>
          </label>
          <label>
            Ticker / Símbolo
            <input
              type="text"
              value={form.symbol}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, symbol: event.target.value.toUpperCase() }))
              }
              placeholder="Ex.: PETR4, BTC, CDB, Fundo XPTO"
              required
            />
          </label>
          <label>
            Operação
            <select
              value={form.trade_side}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  trade_side: event.target.value as 'buy' | 'sell',
                }))
              }
            >
              <option value="buy">Compra</option>
              <option value="sell">Venda</option>
            </select>
          </label>
          <div className="modal-grid">
            <label>
              Quantidade
              <input
                type="text"
                inputMode="decimal"
                value={quantityInput}
                onChange={(event) => {
                  const next = sanitizeNumberInput(event.target.value)
                  setQuantityInput(next)
                  setForm((prev) => ({
                    ...prev,
                    quantity: parseNumberInput(next),
                  }))
                }}
                required
              />
            </label>
            <label>
              Preço
              <input
                type="text"
                inputMode="decimal"
                value={priceInput}
                onChange={(event) => {
                  const next = sanitizeNumberInput(event.target.value)
                  setPriceInput(next)
                  setForm((prev) => ({
                    ...prev,
                    entry_price: parseNumberInput(next),
                  }))
                }}
                required
              />
            </label>
          </div>
          <div className="modal-grid">
            <label>
              Data de entrada
              <input
                type="date"
                value={form.entry_date}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, entry_date: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Moeda
              <select
                value={form.currency}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, currency: event.target.value }))
                }
              >
                <option value="BRL">BRL</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn ghost" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn primary" type="submit" disabled={!canSubmit || saving}>
              {saving ? 'Salvando...' : isEditing ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
