import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Receipt, Bell, Landmark } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { deleteDebt, debtProgress, deleteDebtPayment } from '../../lib/debts'
import { formatMoney } from '../../lib/finance'
import { nextDueDate, daysUntil, MONTH_NAMES } from '../../lib/dates'
import DebtForm from '../../components/debt/DebtForm'
import PayDebtForm from '../../components/debt/PayDebtForm'
import ConfirmDialog from '../../components/ConfirmDialog'

const DUE_SOON_DAYS = 7

export default function Debt() {
  const { debts, debtPayments, loading, refetch } = useData()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [paying, setPaying] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const active = useMemo(() => debts.filter((d) => d.active !== false), [debts])

  const totals = useMemo(() => {
    let balance = 0
    let monthly = 0
    for (const d of active) {
      balance += Number(d.current_balance) || 0
      monthly += Number(d.monthly_payment) || 0
    }
    return { balance, monthly, count: active.length }
  }, [active])

  // Reminders: any active debt with a due_day whose next occurrence is within 7 days.
  const dueSoon = useMemo(() => {
    return active
      .filter((d) => d.due_day)
      .map((d) => {
        const due = nextDueDate(d.due_day)
        return { debt: d, due, days: daysUntil(due) }
      })
      .filter((u) => u.days >= 0 && u.days <= DUE_SOON_DAYS)
      .sort((a, b) => a.days - b.days)
  }, [active])

  function openAdd() {
    setEditing(null)
    setFormOpen(true)
  }
  function openEdit(d) {
    setEditing(d)
    setFormOpen(true)
  }
  async function confirmDeleteDebt() {
    if (!confirmDelete) return
    await deleteDebt(confirmDelete.id)
    setConfirmDelete(null)
    await refetch()
  }

  async function handleDeletePayment(payment, debt) {
    await deleteDebtPayment(payment, debt)
    await refetch()
  }

  function dueLabel(days) {
    if (days === 0) return 'Due today'
    if (days === 1) return 'Due tomorrow'
    return `Due in ${days} days`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Debt Management</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus size={15} />
          Add Debt
        </button>
      </div>

      {/* Reminders */}
      {dueSoon.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-center gap-2 font-medium text-amber-800">
            <Bell size={16} />
            {dueSoon.length} debt payment{dueSoon.length > 1 ? 's' : ''} due in the next{' '}
            {DUE_SOON_DAYS} days
          </div>
          <div className="mt-2 space-y-1">
            {dueSoon.map(({ debt, due, days }) => (
              <div
                key={debt.id}
                className="flex flex-wrap items-center justify-between gap-2 text-sm text-amber-900"
              >
                <span>
                  {debt.name}
                  {debt.monthly_payment ? ` · ${formatMoney(debt.monthly_payment)}` : ''}
                </span>
                <span className="font-medium">
                  {dueLabel(days)} ({MONTH_NAMES[due.getMonth()].slice(0, 3)} {due.getDate()})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Totals */}
      {active.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Total Debt" value={formatMoney(totals.balance)} tone="red" />
          <Stat label="Monthly Payments" value={formatMoney(totals.monthly)} />
          <Stat label="Active Debts" value={totals.count} />
        </div>
      )}

      {loading ? (
        <p className="text-center text-slate-400">Loading…</p>
      ) : debts.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Landmark className="mb-3 text-slate-300" size={32} />
          <p className="text-slate-500">
            No debts tracked yet. Add credit cards, loans, mortgages — anything you owe.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {debts.map((d) => {
            const pct = debtProgress(d)
            const current = Number(d.current_balance) || 0
            const original = Number(d.original_amount) || 0
            const paid = Math.max(original - current, 0)
            return (
              <div key={d.id} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold text-slate-900">{d.name}</h3>
                      {d.active === false && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-400">
                          inactive
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-1.5 text-xs text-slate-400">
                      {d.category && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-500">
                          {d.category}
                        </span>
                      )}
                      {d.payment_method && <span>· {d.payment_method}</span>}
                      {d.due_day && <span>· Due day {d.due_day}</span>}
                      {d.interest_rate ? <span>· {d.interest_rate}% APR</span> : null}
                      {d.term_months ? <span>· {d.term_months} mo term</span> : null}
                      {(() => {
                        const mp = Number(d.monthly_payment) || 0
                        const cb = Number(d.current_balance) || 0
                        if (mp > 0 && cb > 0) {
                          const left = Math.ceil(cb / mp)
                          return <span>· ~{left} mo left</span>
                        }
                        return null
                      })()}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => setPaying(d)}
                      className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                      title="Record a payment"
                    >
                      <Receipt size={13} />
                      Pay
                    </button>
                    <button
                      onClick={() => openEdit(d)}
                      className="text-slate-400 hover:text-slate-700"
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(d)}
                      className="text-slate-300 hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-y-2 text-sm sm:grid-cols-4">
                  <Metric label="Balance" value={formatMoney(current)} tone="red" />
                  <Metric label="Original" value={formatMoney(original)} />
                  <Metric label="Paid" value={formatMoney(paid)} tone="emerald" />
                  <Metric label="Monthly" value={formatMoney(d.monthly_payment)} />
                </div>

                {original > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>{pct.toFixed(0)}% paid</span>
                      <span>{formatMoney(current)} left</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}

                {d.notes && (
                  <p className="mt-3 text-xs text-slate-400">{d.notes}</p>
                )}

                {/* Payment history */}
                {(() => {
                  const payments = debtPayments
                    .filter((p) => p.debt_id === d.id)
                    .slice(0, 5)
                  if (payments.length === 0) return null
                  return (
                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Recent Payments
                      </div>
                      <div className="mt-2 space-y-1">
                        {payments.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <span className="text-slate-400">{p.date}</span>
                            <span className="flex-1 truncate text-slate-600">
                              {p.note || 'Payment'}
                            </span>
                            <span className="font-medium text-emerald-600">
                              {formatMoney(p.amount)}
                            </span>
                            <button
                              onClick={() => handleDeletePayment(p, d)}
                              className="text-slate-300 hover:text-red-500"
                              title="Delete payment (restores balance)"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>
            )
          })}
        </div>
      )}

      {formOpen && (
        <DebtForm
          debt={editing}
          onClose={() => setFormOpen(false)}
          onSaved={refetch}
        />
      )}
      {paying && (
        <PayDebtForm
          debt={paying}
          onClose={() => setPaying(null)}
          onSaved={refetch}
        />
      )}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete debt?"
        message={confirmDelete ? `"${confirmDelete.name}" will be removed.` : ''}
        onConfirm={confirmDeleteDebt}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}

function Stat({ label, value, tone = 'slate' }) {
  const cls =
    tone === 'red' ? 'text-red-600' : tone === 'emerald' ? 'text-emerald-600' : 'text-slate-900'
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${cls}`}>{value}</div>
    </div>
  )
}

function Metric({ label, value, tone = 'slate' }) {
  const cls =
    tone === 'red' ? 'text-red-600' : tone === 'emerald' ? 'text-emerald-600' : 'text-slate-900'
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`font-medium ${cls}`}>{value}</div>
    </div>
  )
}
