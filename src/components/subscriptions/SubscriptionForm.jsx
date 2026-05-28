import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { paymentMethods } from '../../lib/banks'
import { createSubscription, updateSubscription } from '../../lib/subscriptions'

const EMPTY = {
  name: '',
  amount: '',
  cycle: 'monthly',
  payment_method: 'Credit Card',
  renewal_date: '',
  active: true,
}

export default function SubscriptionForm({ subscription, onClose, onSaved }) {
  const { user } = useAuth()
  const { digitalBanks } = useData()
  const METHODS = paymentMethods(digitalBanks)
  const isEdit = Boolean(subscription)

  const [values, setValues] = useState(() =>
    subscription
      ? {
          name: subscription.name ?? '',
          amount: subscription.amount ?? '',
          cycle: subscription.cycle ?? 'monthly',
          payment_method: subscription.payment_method ?? 'Credit Card',
          renewal_date: subscription.renewal_date ?? '',
          active: subscription.active !== false,
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
      if (isEdit) await updateSubscription(subscription.id, values)
      else await createSubscription(user.id, values)
      await onSaved()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save subscription')
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEdit ? 'Edit Subscription' : 'Add Subscription'}
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
              placeholder="e.g. Netflix, Spotify, iCloud"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Amount (₱)">
              <input
                type="number"
                step="any"
                required
                value={values.amount}
                onChange={(e) => update('amount', e.target.value)}
                className={inputCls}
                placeholder="149"
              />
            </Field>
            <Field label="Billing cycle">
              <select
                value={values.cycle}
                onChange={(e) => update('cycle', e.target.value)}
                className={inputCls}
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Payment method">
              <select
                value={values.payment_method}
                onChange={(e) => update('payment_method', e.target.value)}
                className={inputCls}
              >
                {[...new Set([values.payment_method, ...METHODS].filter(Boolean))].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Next renewal date">
              <input
                type="date"
                value={values.renewal_date}
                onChange={(e) => update('renewal_date', e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={values.active}
              onChange={(e) => update('active', e.target.checked)}
              className="h-4 w-4 accent-emerald-600"
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
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {busy && <Loader2 size={16} className="animate-spin" />}
              {isEdit ? 'Save Changes' : 'Add Subscription'}
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
