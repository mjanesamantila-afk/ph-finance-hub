import { useState } from 'react'
import { X, Loader2, Receipt } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { makeDebtPayment } from '../../lib/debts'
import { formatMoney } from '../../lib/finance'
import { todayISO } from '../../lib/dates'

export default function PayDebtForm({ debt, onClose, onSaved }) {
  const { user } = useAuth()
  const [amount, setAmount] = useState(debt.monthly_payment ? String(debt.monthly_payment) : '')
  const [date, setDate] = useState(todayISO())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const pay = Number(amount) || 0
  const current = Number(debt.current_balance) || 0
  const newBalance = Math.max(current - pay, 0)
  const cleared = pay > 0 && newBalance === 0

  async function submit(e) {
    e.preventDefault()
    if (pay <= 0) {
      setError('Enter an amount.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await makeDebtPayment(debt, user.id, { amount: pay, date })
      await onSaved()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to record payment')
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Receipt size={18} />
            Pay {debt.name}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 px-5 py-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">Amount (₱)</span>
              <input
                type="number"
                step="any"
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">Date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputCls}
              />
            </label>
          </div>

          <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-3 text-sm">
            <Row label="Current balance" value={formatMoney(current)} />
            <Row label="Paying" value={formatMoney(pay)} />
            <Row label="New balance" value={formatMoney(newBalance)} strong />
            <Row label="Recorded as" value={debt.payment_method || 'Unspecified'} />
          </div>

          {cleared && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              🎉 This clears the debt!
            </p>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <p className="text-xs text-slate-400">
            A Money Out entry will be added to your Ledger automatically.
          </p>

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
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'

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
