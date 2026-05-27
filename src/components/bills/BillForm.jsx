import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { SPENDING_CATS } from '../../config/constants'
import { createBill, updateBill } from '../../lib/bills'
import { useAuth } from '../../context/AuthContext'

const EMPTY = { name: '', amount: '', due_day: '1', category: '', notes: '', active: true }

const CATEGORY_OPTIONS = SPENDING_CATS.digital

export default function BillForm({ bill, onClose, onSaved }) {
  const { user } = useAuth()
  const isEdit = Boolean(bill)

  const [values, setValues] = useState(() =>
    bill
      ? {
          name: bill.name ?? '',
          amount: bill.amount ?? '',
          due_day: String(bill.due_day ?? 1),
          category: bill.category ?? '',
          notes: bill.notes ?? '',
          active: bill.active !== false,
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
      if (isEdit) await updateBill(bill.id, values)
      else await createBill(user.id, values)
      await onSaved()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save bill')
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEdit ? 'Edit Bill' : 'Add Bill'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <Field label="Bill name">
            <input
              required
              value={values.name}
              onChange={(e) => update('name', e.target.value)}
              className={inputCls}
              placeholder="e.g. Meralco, Internet, Rent"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Amount (₱)">
              <input
                type="number"
                step="any"
                value={values.amount}
                onChange={(e) => update('amount', e.target.value)}
                className={inputCls}
                placeholder="optional"
              />
            </Field>
            <Field label="Due day of month">
              <select
                value={values.due_day}
                onChange={(e) => update('due_day', e.target.value)}
                className={inputCls}
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={String(d)}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Category (optional)">
            <select
              value={values.category}
              onChange={(e) => update('category', e.target.value)}
              className={inputCls}
            >
              <option value="">None</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Notes (optional)">
            <input
              value={values.notes}
              onChange={(e) => update('notes', e.target.value)}
              className={inputCls}
              placeholder="e.g. account number, autopay"
            />
          </Field>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={values.active}
              onChange={(e) => update('active', e.target.checked)}
              className="h-4 w-4 accent-emerald-600"
            />
            Active (show in calendar &amp; reminders)
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
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {busy && <Loader2 size={16} className="animate-spin" />}
              {isEdit ? 'Save Changes' : 'Add Bill'}
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
