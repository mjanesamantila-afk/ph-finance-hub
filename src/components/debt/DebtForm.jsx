import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { paymentMethods } from '../../lib/banks'
import { createDebt, updateDebt, computeLoanTotal } from '../../lib/debts'
import { formatMoney } from '../../lib/finance'

const CATEGORY_SUGGESTIONS = [
  'Credit Card',
  'Personal Loan',
  'Car Loan',
  'Home Loan',
  'Pag-IBIG MPL',
  'SSS Loan',
  'Family',
  'Other',
]

const EMPTY = {
  name: '',
  category: '',
  original_amount: '',
  current_balance: '',
  monthly_payment: '',
  interest_rate: '',
  interest_period: 'monthly',
  due_day: '',
  term_months: '',
  payment_method: '',
  notes: '',
  active: true,
}

export default function DebtForm({ debt, onClose, onSaved }) {
  const { user } = useAuth()
  const { digitalBanks } = useData()
  const METHODS = paymentMethods(digitalBanks)
  const isEdit = Boolean(debt)

  const [values, setValues] = useState(() =>
    debt
      ? {
          name: debt.name ?? '',
          category: debt.category ?? '',
          original_amount: debt.original_amount ?? '',
          current_balance: debt.current_balance ?? '',
          monthly_payment: debt.monthly_payment ?? '',
          interest_rate: debt.interest_rate ?? '',
          interest_period: debt.interest_period || 'monthly',
          due_day: debt.due_day == null ? '' : String(debt.due_day),
          term_months: debt.term_months == null ? '' : String(debt.term_months),
          payment_method: debt.payment_method ?? '',
          notes: debt.notes ?? '',
          active: debt.active !== false,
        }
      : { ...EMPTY }
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function update(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const calc = computeLoanTotal({
    principal: values.original_amount,
    rate: values.interest_rate,
    period: values.interest_period,
    months: values.term_months,
  })
  const showCalc = calc.totalPayable > 0 && Number(values.term_months) > 0

  function applyCalc() {
    // Original amount stays as the principal you borrowed.
    // Current balance becomes the total payable (with interest), which then
    // drops to zero as you record payments.
    setValues((prev) => ({
      ...prev,
      current_balance: String(Math.round(calc.totalPayable * 100) / 100),
      monthly_payment: String(Math.round(calc.monthlyPayment * 100) / 100),
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (isEdit) await updateDebt(debt.id, values)
      else await createDebt(user.id, values)
      await onSaved()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save')
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEdit ? 'Edit Debt' : 'Add Debt'}
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
              placeholder="e.g. BPI Credit Card, Pag-IBIG MPL"
            />
          </Field>

          <Field label="Category (optional)">
            <input
              list="debt-categories"
              value={values.category}
              onChange={(e) => update('category', e.target.value)}
              className={inputCls}
              placeholder="e.g. Credit Card, Personal Loan"
            />
            <datalist id="debt-categories">
              {CATEGORY_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Original amount (₱)">
              <input
                type="number"
                step="any"
                value={values.original_amount}
                onChange={(e) => update('original_amount', e.target.value)}
                className={inputCls}
                placeholder="100000"
              />
            </Field>
            <Field label="Current balance (₱)">
              <input
                type="number"
                step="any"
                value={values.current_balance}
                onChange={(e) => update('current_balance', e.target.value)}
                className={inputCls}
                placeholder="defaults to original"
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Monthly payment (₱)">
              <input
                type="number"
                step="any"
                value={values.monthly_payment}
                onChange={(e) => update('monthly_payment', e.target.value)}
                className={inputCls}
                placeholder="5000"
              />
            </Field>
            <Field label="Interest rate (%)">
              <div className="flex gap-1">
                <input
                  type="number"
                  step="any"
                  value={values.interest_rate}
                  onChange={(e) => update('interest_rate', e.target.value)}
                  className={`${inputCls} flex-1`}
                  placeholder="0.68"
                />
                <select
                  value={values.interest_period}
                  onChange={(e) => update('interest_period', e.target.value)}
                  className="rounded-lg border border-slate-300 px-2 py-2 text-xs"
                  title="Rate period"
                >
                  <option value="monthly">/mo</option>
                  <option value="annual">/yr</option>
                </select>
              </div>
            </Field>
            <Field label="Term (months)">
              <input
                type="number"
                min="1"
                value={values.term_months}
                onChange={(e) => update('term_months', e.target.value)}
                className={inputCls}
                placeholder="12"
              />
            </Field>
          </div>

          {showCalc && (
            <div className="rounded-lg bg-emerald-50 px-3 py-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Total interest</span>
                <span className="font-medium text-slate-800">
                  {formatMoney(calc.totalInterest)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Total payable</span>
                <span className="font-semibold text-emerald-700">
                  {formatMoney(calc.totalPayable)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Monthly payment</span>
                <span className="font-semibold text-emerald-700">
                  {formatMoney(calc.monthlyPayment)}
                </span>
              </div>
              <button
                type="button"
                onClick={applyCalc}
                className="mt-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
              >
                Apply to Current balance &amp; Monthly payment
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Due day of month">
              <select
                value={values.due_day}
                onChange={(e) => update('due_day', e.target.value)}
                className={inputCls}
              >
                <option value="">— None —</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={String(d)}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Payment method">
              <select
                value={values.payment_method}
                onChange={(e) => update('payment_method', e.target.value)}
                className={inputCls}
              >
                <option value="">— None —</option>
                {[...new Set([values.payment_method, ...METHODS].filter(Boolean))].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>
          </div>

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
              {isEdit ? 'Save Changes' : 'Add Debt'}
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
