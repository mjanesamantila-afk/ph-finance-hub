import { useState } from 'react'
import { X, Loader2, ShoppingCart } from 'lucide-react'
import { buyMoreHolding } from '../../lib/holdings'
import { formatMoney } from '../../lib/finance'

export default function BuyMoreForm({ holding, onClose, onSaved }) {
  const cur = holding.currency || 'PHP'
  const [shares, setShares] = useState('')
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const addShares = Number(shares) || 0
  const addCost = Number(amount) || 0
  const addPrice = addShares > 0 ? addCost / addShares : 0

  const prevShares = Number(holding.shares) || 0
  const prevInvested =
    Number(holding.invested) || prevShares * (Number(holding.price_per_share) || 0)
  const newShares = prevShares + addShares
  const newInvested = prevInvested + addCost
  const newAvg = newShares > 0 ? newInvested / newShares : 0

  async function submit(e) {
    e.preventDefault()
    if (addShares <= 0 || addCost <= 0) {
      setError('Enter how many shares you bought and the amount you invested.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await buyMoreHolding(holding, { shares: addShares, price: addPrice })
      await onSaved()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to record purchase')
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <ShoppingCart size={18} />
            Buy More — {holding.name}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 px-5 py-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Shares / Units bought
              </span>
              <input
                type="number"
                step="any"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                className={inputCls}
                autoFocus
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Amount Invested ({cur})
              </span>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputCls}
              />
            </label>
          </div>

          <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-3 text-sm">
            <Row label="This purchase" value={formatMoney(addCost, cur)} />
            <Row label="New total shares" value={newShares ? newShares.toLocaleString() : '—'} />
            <Row label="New total invested" value={formatMoney(newInvested, cur)} strong />
            <Row label="New average cost / share" value={formatMoney(newAvg, cur)} />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-2">
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
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {busy && <Loader2 size={16} className="animate-spin" />}
              Add Purchase
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200'

function Row({ label, value, strong }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={strong ? 'font-semibold text-slate-900' : 'text-slate-700'}>
        {value}
      </span>
    </div>
  )
}
