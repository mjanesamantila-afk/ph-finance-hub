import { useState } from 'react'
import { Plus, PiggyBank, Loader2, Pencil, Trash2, Check, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { formatMoney } from '../../lib/finance'
import { currentMonthKey, monthLabel, todayISO } from '../../lib/dates'
import { bankColor } from '../../lib/banks'
import {
  updateBank,
  addBankTransaction,
  recordInterest,
  renameBank,
  deleteBank,
} from '../../lib/budget'
import ConfirmDialog from '../ConfirmDialog'

export default function DigitalBankCard({ bank, transactions, interestRows, onChanged }) {
  const { user } = useAuth()
  const color = bankColor(bank.bank_name)
  const [isRenaming, setIsRenaming] = useState(false)
  const [nameDraft, setNameDraft] = useState(bank.bank_name)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [renameError, setRenameError] = useState('')

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

  async function saveRename() {
    const next = nameDraft.trim()
    if (!next || next === bank.bank_name) {
      setIsRenaming(false)
      setRenameError('')
      return
    }
    setBusy(true)
    setRenameError('')
    try {
      await renameBank(user.id, bank, next)
      setIsRenaming(false)
      await onChanged()
    } catch (err) {
      setRenameError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    setBusy(true)
    try {
      await deleteBank(bank.id)
      setConfirmDelete(false)
      await onChanged()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
          style={{ backgroundColor: color }}
        >
          <PiggyBank size={16} />
        </span>
        {isRenaming ? (
          <div className="flex flex-1 items-center gap-1">
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveRename()
                if (e.key === 'Escape') {
                  setIsRenaming(false)
                  setNameDraft(bank.bank_name)
                  setRenameError('')
                }
              }}
              className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1 text-sm font-semibold"
            />
            <button
              onClick={saveRename}
              disabled={busy}
              className="text-emerald-600 hover:text-emerald-700"
              title="Save"
            >
              <Check size={16} />
            </button>
            <button
              onClick={() => {
                setIsRenaming(false)
                setNameDraft(bank.bank_name)
                setRenameError('')
              }}
              className="text-slate-400 hover:text-slate-600"
              title="Cancel"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <h3 className="flex-1 truncate font-semibold text-slate-900">{bank.bank_name}</h3>
            <button
              onClick={() => {
                setNameDraft(bank.bank_name)
                setIsRenaming(true)
              }}
              className="text-slate-400 hover:text-slate-700"
              title="Rename"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-slate-300 hover:text-red-500"
              title="Delete bank"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
      {renameError && (
        <p className="mt-2 text-xs text-red-600">{renameError}</p>
      )}

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

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete "${bank.bank_name}"?`}
        message="Past transactions and interest history for this bank will be preserved, but the bank itself will be removed from your list. References elsewhere (savings goals' source, payment methods on bills/subscriptions) still keep the old name — update them yourself if needed."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
