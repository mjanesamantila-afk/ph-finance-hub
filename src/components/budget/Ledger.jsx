import { useMemo, useState } from 'react'
import { Plus, Trash2, Loader2, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'
import { SPENDING_CATS, PAYMENT_METHODS } from '../../config/constants'
import { formatMoney } from '../../lib/finance'
import { currentMonthKey, monthKeyOf, todayISO } from '../../lib/dates'
import { addLedgerEntry, deleteLedgerEntry } from '../../lib/budget'
import MonthSelector from './MonthSelector'

export default function Ledger() {
  const { user } = useAuth()
  const { ledgerEntries, settings, refetch } = useData()

  const [month, setMonth] = useState(currentMonthKey())
  const [filter, setFilter] = useState('all') // all | in | out
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    direction: 'out',
    amount: '',
    category: '',
    method: '',
    date: todayISO(),
    description: '',
  })

  const custom = settings?.custom_categories ?? { manual: [], digital: [] }
  const allCategories = [
    ...SPENDING_CATS.manual,
    ...SPENDING_CATS.digital,
    ...(custom.manual ?? []),
    ...(custom.digital ?? []),
  ]

  const visible = useMemo(() => {
    return ledgerEntries
      .filter((e) => monthKeyOf(e.date) === month)
      .filter((e) => (filter === 'all' ? true : e.direction === filter))
  }, [ledgerEntries, month, filter])

  const totals = useMemo(() => {
    let inSum = 0
    let outSum = 0
    for (const e of visible) {
      const amt = Number(e.amount) || 0
      if (e.direction === 'in') inSum += amt
      else outSum += amt
    }
    return { inSum, outSum, net: inSum - outSum }
  }, [visible])

  async function submit(e) {
    e.preventDefault()
    if (!form.amount || !form.date) return
    setBusy(true)
    try {
      await addLedgerEntry(user.id, form)
      setForm({
        direction: 'out',
        amount: '',
        category: '',
        method: '',
        date: todayISO(),
        description: '',
      })
      await refetch()
    } finally {
      setBusy(false)
    }
  }

  async function remove(id) {
    await deleteLedgerEntry(id)
    await refetch()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthSelector value={month} onChange={setMonth} />
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-sm">
          {['all', 'in', 'out'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 font-medium capitalize transition ${
                filter === f ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {f === 'all' ? 'All' : f === 'in' ? 'Money In' : 'Money Out'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Money In" value={formatMoney(totals.inSum)} cls="text-emerald-600" />
        <Stat label="Money Out" value={formatMoney(totals.outSum)} cls="text-red-600" />
        <Stat
          label="Net"
          value={formatMoney(totals.net)}
          cls={totals.net >= 0 ? 'text-emerald-600' : 'text-red-600'}
        />
      </div>

      {/* Add entry */}
      <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <select
            value={form.direction}
            onChange={(e) => setForm({ ...form, direction: e.target.value })}
            className={inputCls}
          >
            <option value="out">Money Out</option>
            <option value="in">Money In</option>
          </select>
          <input
            type="number"
            step="any"
            placeholder="Amount"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className={inputCls}
          />
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className={inputCls}
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className={inputCls}
          >
            <option value="">Category…</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={form.method}
            onChange={(e) => setForm({ ...form, method: e.target.value })}
            className={inputCls}
          >
            <option value="">Method…</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <input
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={inputCls}
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="mt-3 flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          Add Entry
        </button>
      </form>

      {/* Entry list */}
      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-400">
          No entries for this month.
        </p>
      ) : (
        <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {visible.map((e) => (
            <div key={e.id} className="flex items-center gap-3 px-4 py-3">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  e.direction === 'in'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {e.direction === 'in' ? (
                  <ArrowDownLeft size={16} />
                ) : (
                  <ArrowUpRight size={16} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-slate-800">
                  {e.description || e.category || '(no description)'}
                </div>
                <div className="mt-0.5 flex flex-wrap gap-1.5">
                  <span className="text-xs text-slate-400">{e.date}</span>
                  {e.category && <Tag>{e.category}</Tag>}
                  {e.method && <Tag>{e.method}</Tag>}
                </div>
              </div>
              <span
                className={`text-sm font-semibold ${
                  e.direction === 'in' ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {e.direction === 'in' ? '+' : '−'}
                {formatMoney(e.amount)}
              </span>
              <button
                onClick={() => remove(e.id)}
                className="text-slate-300 hover:text-red-500"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'

function Stat({ label, value, cls }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${cls}`}>{value}</div>
    </div>
  )
}

function Tag({ children }) {
  return (
    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
      {children}
    </span>
  )
}
