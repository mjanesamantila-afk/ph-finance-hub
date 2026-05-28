import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { createAllocation, updateAllocation } from '../../lib/investments'

const EMPTY = { name: '', amount: '', notes: '', active: true }

export default function InvestmentAllocationForm({ allocation, onClose, onSaved }) {
  const { user } = useAuth()
  const isEdit = Boolean(allocation)

  const [values, setValues] = useState(() =>
    allocation
      ? {
          name: allocation.name ?? '',
          amount: allocation.amount ?? '',
          notes: allocation.notes ?? '',
          active: allocation.active !== false,
        }
      : { ...EMPTY }
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function update(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (isEdit) await updateAllocation(allocation.id, values)
      else await createAllocation(user.id, values)
      await onSaved()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save')
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEdit ? 'Edit Allocation' : 'Add Investment Allocation'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <Field label="Name">
            <input
              required
              value={values.name}
              onChange={(e) => update('name', e.target.value)}
              className={inputCls}
              placeholder="e.g. MP2 Pag-IBIG, BDO VUL, PSE Stocks"
            />
          </Field>

          <Field label="Amount per month (₱)">
            <input
              type="number"
              step="any"
              value={values.amount}
              onChange={(e) => update('amount', e.target.value)}
              className={inputCls}
              placeholder="4000"
            />
          </Field>

          <Field label="Notes (optional)">
            <input
              value={values.notes}
              onChange={(e) => update('notes', e.target.value)}
              className={inputCls}
              placeholder="e.g. account number, auto-debit"
            />
          </Field>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={values.active}
              onChange={(e) => update('active', e.target.checked)}
              className="h-4 w-4 accent-blue-600"
            />
            Active
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
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
              {isEdit ? 'Save Changes' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200'

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  )
}
