import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { createGoal, updateGoal, monthlySaving } from '../../lib/savings'
import { formatMoney } from '../../lib/finance'

const EMPTY = {
  name: '',
  target_amount: '',
  saved_amount: '',
  target_date: '',
  source: 'Cash',
}

export default function SavingsGoalForm({ goal, onClose, onSaved }) {
  const { user } = useAuth()
  const { digitalBanks } = useData()
  const isEdit = Boolean(goal)

  const [values, setValues] = useState(() =>
    goal
      ? {
          name: goal.name ?? '',
          target_amount: goal.target_amount ?? '',
          saved_amount: goal.saved_amount ?? '',
          // date -> month input value (YYYY-MM)
          target_date: goal.target_date ? String(goal.target_date).slice(0, 7) : '',
          source: goal.source ?? 'Cash',
        }
      : { ...EMPTY }
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const sources = ['Cash', ...digitalBanks.map((b) => b.bank_name)]

  function update(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  // Live monthly estimate using the entered values (month -> first of month).
  const preview = monthlySaving({
    target_amount: values.target_amount,
    saved_amount: values.saved_amount,
    target_date: values.target_date ? `${values.target_date}-01` : null,
  })

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const payload = {
      ...values,
      target_date: values.target_date ? `${values.target_date}-01` : '',
    }
    try {
      if (isEdit) await updateGoal(goal.id, payload)
      else await createGoal(user.id, payload)
      await onSaved()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save goal')
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEdit ? 'Edit Goal' : 'Add Savings Goal'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <Field label="Goal name">
            <input
              required
              value={values.name}
              onChange={(e) => update('name', e.target.value)}
              className={inputCls}
              placeholder="e.g. Travel Fund, Emergency Fund"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Target amount (₱)">
              <input
                type="number"
                step="any"
                required
                value={values.target_amount}
                onChange={(e) => update('target_amount', e.target.value)}
                className={inputCls}
                placeholder="100000"
              />
            </Field>
            <Field label="Already saved (₱)">
              <input
                type="number"
                step="any"
                value={values.saved_amount}
                onChange={(e) => update('saved_amount', e.target.value)}
                className={inputCls}
                placeholder="0"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Target month">
              <input
                type="month"
                required
                value={values.target_date}
                onChange={(e) => update('target_date', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Save in">
              <select
                value={values.source}
                onChange={(e) => update('source', e.target.value)}
                className={inputCls}
              >
                {sources.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {values.target_amount && values.target_date && (
            <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
              Save about <span className="font-semibold">{formatMoney(preview)}</span> per month
              to reach this goal.
            </div>
          )}

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
              {isEdit ? 'Save Changes' : 'Add Goal'}
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
