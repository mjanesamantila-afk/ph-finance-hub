import { useState } from 'react'
import { X, Loader2, PiggyBank } from 'lucide-react'
import { addToSavings } from '../../lib/savings'
import { formatMoney } from '../../lib/finance'

export default function AddSavingsForm({ goal, onClose, onSaved }) {
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const add = Number(amount) || 0
  const currentSaved = Number(goal.saved_amount) || 0
  const target = Number(goal.target_amount) || 0
  const newSaved = currentSaved + add
  const newPct = target > 0 ? Math.min((newSaved / target) * 100, 100) : 0
  const reached = target > 0 && newSaved >= target

  async function submit(e) {
    e.preventDefault()
    if (add <= 0) {
      setError('Enter an amount to add.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await addToSavings(goal, add)
      await onSaved()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to add to savings')
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <PiggyBank size={18} />
            Add to {goal.name}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 px-5 py-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Amount to add ({goal.source || 'Cash'}) ₱
            </span>
            <input
              type="number"
              step="any"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              placeholder="e.g. 7272"
            />
          </label>

          <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-3 text-sm">
            <Row label="Currently saved" value={formatMoney(currentSaved)} />
            <Row label="Adding" value={formatMoney(add)} />
            <Row label="New total" value={formatMoney(newSaved)} strong />
            <Row label="Progress" value={`${Math.round(newPct)}% of ${formatMoney(target)}`} />
          </div>

          {reached && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              🎉 This reaches your goal!
            </p>
          )}
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
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {busy && <Loader2 size={16} className="animate-spin" />}
              Add to Savings
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

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
