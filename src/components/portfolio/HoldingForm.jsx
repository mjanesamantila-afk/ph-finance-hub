import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { INVESTMENT_TYPES, BROKERS } from '../../config/constants'
import { createHolding, updateHolding } from '../../lib/holdings'
import { useAuth } from '../../context/AuthContext'

const EMPTY = {
  type: INVESTMENT_TYPES[0],
  broker: '',
  name: '',
  ticker: '',
  shares: '',
  price_per_share: '',
  invested: '',
  current_value: '',
  last_price: '',
  date_added: '',
  stop_loss_pct: '',
  currency: 'PHP',
}

const currencyForBroker = (broker) => (broker === 'GoTrade' ? 'USD' : 'PHP')

export default function HoldingForm({ holding, defaultStopLoss = 10, onClose, onSaved }) {
  const { user } = useAuth()
  const isEdit = Boolean(holding)

  const [values, setValues] = useState(() => {
    if (!holding) return { ...EMPTY, stop_loss_pct: String(defaultStopLoss) }
    return {
      type: holding.type ?? INVESTMENT_TYPES[0],
      broker: holding.broker ?? '',
      name: holding.name ?? '',
      ticker: holding.ticker ?? '',
      shares: holding.shares ?? '',
      price_per_share: holding.price_per_share ?? '',
      invested: holding.invested ?? '',
      current_value: holding.current_value ?? '',
      last_price: holding.last_price ?? '',
      date_added: holding.date_added ?? '',
      stop_loss_pct: holding.stop_loss_pct ?? '',
      currency: holding.currency ?? 'PHP',
    }
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const brokerOptions = BROKERS[values.type] ?? []

  function update(field, value) {
    setValues((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'type') {
        next.broker = '' // reset broker when type changes
      }
      if (field === 'broker') {
        next.currency = currencyForBroker(value)
      }
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (isEdit) {
        await updateHolding(holding.id, values)
      } else {
        await createHolding(user.id, values)
      }
      await onSaved()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save holding')
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEdit ? 'Edit Investment' : 'Add Investment'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type">
              <select
                value={values.type}
                onChange={(e) => update('type', e.target.value)}
                className={inputCls}
              >
                {INVESTMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Broker">
              <select
                value={values.broker}
                onChange={(e) => update('broker', e.target.value)}
                className={inputCls}
              >
                <option value="">Select broker…</option>
                {brokerOptions.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Name">
            <input
              required
              value={values.name}
              onChange={(e) => update('name', e.target.value)}
              className={inputCls}
              placeholder="e.g. BDO Unibank"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Ticker">
              <input
                value={values.ticker}
                onChange={(e) => update('ticker', e.target.value.toUpperCase())}
                className={inputCls}
                placeholder="e.g. BDO"
              />
            </Field>
            <Field label={`Currency (${values.currency})`}>
              <input value={values.currency} readOnly className={`${inputCls} bg-slate-50`} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Shares / Units">
              <input
                type="number"
                step="any"
                value={values.shares}
                onChange={(e) => update('shares', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Entry Price / Share">
              <input
                type="number"
                step="any"
                value={values.price_per_share}
                onChange={(e) => update('price_per_share', e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Invested (optional)">
              <input
                type="number"
                step="any"
                value={values.invested}
                onChange={(e) => update('invested', e.target.value)}
                className={inputCls}
                placeholder="auto: shares × entry"
              />
            </Field>
            <Field label="Current Value (optional)">
              <input
                type="number"
                step="any"
                value={values.current_value}
                onChange={(e) => update('current_value', e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Date Added">
              <input
                type="date"
                value={values.date_added}
                onChange={(e) => update('date_added', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Stop Loss %">
              <input
                type="number"
                step="any"
                value={values.stop_loss_pct}
                onChange={(e) => update('stop_loss_pct', e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {busy && <Loader2 size={16} className="animate-spin" />}
              {isEdit ? 'Save Changes' : 'Add Investment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  )
}
