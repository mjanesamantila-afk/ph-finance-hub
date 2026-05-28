import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { createBank } from '../../lib/budget'

export default function AddBankForm({ onClose, onSaved }) {
  const { user } = useAuth()
  const [values, setValues] = useState({ bank_name: '', balance: '', interest_rate: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function update(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  async function submit(e) {
    e.preventDefault()
    if (!values.bank_name.trim()) {
      setError('Bank name is required.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await createBank(user.id, values)
      await onSaved()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to add bank')
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-lg font-semibold text-slate-900">Add Bank</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 px-5 py-4">
          <Field label="Bank name">
            <input
              required
              autoFocus
              value={values.bank_name}
              onChange={(e) => update('bank_name', e.target.value)}
              className={inputCls}
              placeholder="e.g. UnionBank, SeaBank, BPI"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Starting balance (₱)">
              <input
                type="number"
                step="any"
                value={values.balance}
                onChange={(e) => update('balance', e.target.value)}
                className={inputCls}
                placeholder="0"
              />
            </Field>
            <Field label="Interest rate (% p.a.)">
              <input
                type="number"
                step="any"
                value={values.interest_rate}
                onChange={(e) => update('interest_rate', e.target.value)}
                className={inputCls}
                placeholder="0"
              />
            </Field>
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
              Add Bank
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
