import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, CreditCard } from 'lucide-react'
import { useData } from '../../context/DataContext'
import {
  deleteSubscription,
  monthlyCost,
  yearlyCost,
} from '../../lib/subscriptions'
import { formatMoney } from '../../lib/finance'
import SubscriptionForm from '../../components/subscriptions/SubscriptionForm'
import ConfirmDialog from '../../components/ConfirmDialog'

export default function Subscriptions() {
  const { subscriptions, loading, refetch } = useData()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const active = useMemo(
    () => subscriptions.filter((s) => s.active !== false),
    [subscriptions]
  )

  const { totalMonthly, totalYearly, byMethod } = useMemo(() => {
    let m = 0
    let y = 0
    const methods = {}
    for (const s of active) {
      m += monthlyCost(s)
      y += yearlyCost(s)
      const key = s.payment_method || 'Unspecified'
      methods[key] = (methods[key] || 0) + monthlyCost(s)
    }
    const byMethod = Object.entries(methods)
      .map(([method, amount]) => ({ method, amount }))
      .sort((a, b) => b.amount - a.amount)
    return { totalMonthly: m, totalYearly: y, byMethod }
  }, [active])

  function openAdd() {
    setEditing(null)
    setFormOpen(true)
  }
  function openEdit(sub) {
    setEditing(sub)
    setFormOpen(true)
  }
  async function confirmDeleteSub() {
    if (!confirmDelete) return
    await deleteSubscription(confirmDelete.id)
    setConfirmDelete(null)
    await refetch()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Subscriptions</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus size={15} />
          Add Subscription
        </button>
      </div>

      {active.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Stat label="Total / month" value={formatMoney(totalMonthly)} tone="slate" />
            <Stat label="Total / year" value={formatMoney(totalYearly)} />
            <Stat label="Active" value={active.length} />
          </div>

          {/* Breakdown by payment method */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-medium text-slate-900">By Payment Method</h2>
            <div className="mt-3 space-y-2">
              {byMethod.map((b) => {
                const pct = totalMonthly > 0 ? (b.amount / totalMonthly) * 100 : 0
                return (
                  <div key={b.method}>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">{b.method}</span>
                      <span className="text-slate-500">
                        {formatMoney(b.amount)}/mo{' '}
                        <span className="text-slate-400">({pct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {loading ? (
        <p className="text-center text-slate-400">Loading…</p>
      ) : subscriptions.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <CreditCard className="mb-3 text-slate-300" size={32} />
          <p className="text-slate-500">
            No subscriptions yet. Add Netflix, Spotify, iCloud, and more to track them.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {subscriptions.map((s) => (
            <div key={s.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-slate-800">{s.name}</span>
                  {s.active === false && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-400">
                      inactive
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-500">
                    {s.payment_method || 'Unspecified'}
                  </span>
                  <span>{s.cycle === 'yearly' ? 'Yearly' : 'Monthly'}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-slate-900">{formatMoney(s.amount)}</div>
                <div className="text-xs text-slate-400">
                  {s.cycle === 'yearly' ? `${formatMoney(monthlyCost(s))}/mo` : 'per month'}
                </div>
              </div>
              <button
                onClick={() => openEdit(s)}
                className="text-slate-400 hover:text-slate-700"
                title="Edit"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => setConfirmDelete(s)}
                className="text-slate-300 hover:text-red-500"
                title="Delete"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <SubscriptionForm
          subscription={editing}
          onClose={() => setFormOpen(false)}
          onSaved={refetch}
        />
      )}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete subscription?"
        message={confirmDelete ? `"${confirmDelete.name}" will be removed.` : ''}
        onConfirm={confirmDeleteSub}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}

function Stat({ label, value, tone = 'slate' }) {
  const cls = tone === 'emerald' ? 'text-emerald-600' : 'text-slate-900'
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${cls}`}>{value}</div>
    </div>
  )
}
