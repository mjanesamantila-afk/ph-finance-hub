import { useState } from 'react'
import { Plus, PiggyBank, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { DB_COLORS } from '../../config/constants'
import { formatMoney } from '../../lib/finance'
import { currentMonthKey, monthLabel, todayISO } from '../../lib/dates'
import {
  updateBank,
  addBankTransaction,
  recordInterest,
} from '../../lib/budget'

export default function DigitalBankCard({ bank, transactions, interestRows, onChanged }) {
  const { user } = useAuth()
  const color = DB_COLORS[bank.bank_name] || '#3266ad'

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [txn, setTxn] = useState({
    direction: 'in',
    amount: '',
    note: '',
    date: todayISO(),
  })

  const balance = Number(bank.balance) || 0
  const rate = Number(bank.interest_rate) || 0
  const monthlyInterest = (balance * (rate / 100)) / 12

  const thisMonth = currentMonthKey()
  const alreadyRecorded = interestRows.some((r) => r.month === thisMonth)

  async function saveField(patch) {
    await updateBank(bank.id, patch)
    await onChanged()
  }

  async function submitTxn(e) {
    e.preventDefault()
    if (!txn.amount) return
    setBusy(true)
    setError('')
    try {
      await addBankTransaction(user.id, bank, txn)
      setTxn({ direction: 'in', amount: '', note: '', date: todayISO() })
      await onChanged()
    } finally {
      setBusy(false)
    }
  }

  async function handleRecordInterest() {
    setBusy(true)
    setError('')
    try {
      await recordInterest(user.id, bank, thisMonth)
      await onChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
          style={{ backgroundColor: color }}
        >
          <PiggyBank size={16} />
        </span>
        <h3 className="font-semibold text-slate-900">{bank.bank_name}</h3>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-slate-400">Balance (₱)</span>
          <input
            type="number"
            defaultValue={balance}
            onBlur={(e) => saveField({ balance: Number(e.target.value) || 0 })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          />
        </label>
        <label className="block">
          <span className="text-xs text-slate-400">Interest rate (% p.a.)</span>
          <input
            type="number"
            step="any"
            defaultValue={rate}
            onBlur={(e) => saveField({ interest_rate: Number(e.target.value) || 0 })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          />
        </label>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
        <span className="text-slate-500">Est. monthly interest</span>
        <span className="font-medium text-emerald-600">{formatMoney(monthlyInterest)}</span>
      </div>

      <button
        onClick={handleRecordInterest}
        disabled={busy || alreadyRecorded}
        className="mt-3 w-full rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
      >
        {alreadyRecorded
          ? `Interest recorded for ${monthLabel(thisMonth)}`
          : 'Record this month’s interest'}
      </button>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {/* Add transaction */}
      <form onSubmit={submitTxn} className="mt-4 space-y-2 border-t border-slate-100 pt-4">
        <div className="grid grid-cols-2 gap-2">
          <select
            value={txn.direction}
            onChange={(e) => setTxn({ ...txn, direction: e.target.value })}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="in">Money In</option>
            <option value="out">Money Out</option>
          </select>
          <input
            type="number"
            step="any"
            placeholder="Amount"
            value={txn.amount}
            onChange={(e) => setTxn({ ...txn, amount: e.target.value })}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            placeholder="Note"
            value={txn.note}
            onChange={(e) => setTxn({ ...txn, note: e.target.value })}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          />
          <input
            type="date"
            value={txn.date}
            onChange={(e) => setTxn({ ...txn, date: e.target.value })}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Add transaction
        </button>
      </form>

      {/* Transaction log */}
      {transactions.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Transactions
          </div>
          <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
            {transactions.map((t) => (
              <div key={t.id} className="flex justify-between text-xs">
                <span className="truncate text-slate-500">{t.note || t.date}</span>
                <span
                  className={t.direction === 'in' ? 'text-emerald-600' : 'text-red-600'}
                >
                  {t.direction === 'in' ? '+' : '−'}
                  {formatMoney(t.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interest history */}
      {interestRows.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Interest history
          </div>
          <div className="mt-2 space-y-1">
            {interestRows.map((r) => (
              <div key={r.id} className="flex justify-between text-xs text-slate-500">
                <span>{monthLabel(r.month)}</span>
                <span className="text-emerald-600">{formatMoney(r.interest)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
