import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, PieChart } from 'lucide-react'
import { useData } from '../../context/DataContext'
import { deleteAllocation } from '../../lib/investments'
import { formatMoney } from '../../lib/finance'
import InvestmentAllocationForm from './InvestmentAllocationForm'
import ConfirmDialog from '../ConfirmDialog'

export default function InvestmentPlan() {
  const { investmentAllocations, settings, refetch } = useData()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const active = useMemo(
    () => investmentAllocations.filter((a) => a.active !== false),
    [investmentAllocations]
  )

  const planTotal = active.reduce((s, a) => s + (Number(a.amount) || 0), 0)
  const income = Number(settings?.income) || 0
  const investPct = Number(settings?.money_system?.invest) || 0
  const target = (income * investPct) / 100
  const difference = target - planTotal
  const overTarget = target > 0 && planTotal > target
  const onTrack = target > 0 && planTotal >= target

  function openAdd() {
    setEditing(null)
    setFormOpen(true)
  }
  function openEdit(a) {
    setEditing(a)
    setFormOpen(true)
  }
  async function confirmDeleteAllocation() {
    if (!confirmDelete) return
    await deleteAllocation(confirmDelete.id)
    setConfirmDelete(null)
    await refetch()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Monthly Investment Plan</h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus size={15} />
          Add Allocation
        </button>
      </div>

      {/* Summary card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">Plan total</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              {formatMoney(planTotal)}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Money System target
            </div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              {formatMoney(target)}
            </div>
            <div className="text-xs text-slate-400">
              {investPct}% of {formatMoney(income)}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">
              {difference >= 0 ? 'Remaining to allocate' : 'Over target'}
            </div>
            <div
              className={`mt-1 text-lg font-semibold ${
                overTarget ? 'text-red-600' : onTrack ? 'text-emerald-600' : 'text-slate-900'
              }`}
            >
              {formatMoney(Math.abs(difference))}
            </div>
          </div>
        </div>
        {target > 0 && (
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${
                overTarget ? 'bg-red-500' : onTrack ? 'bg-emerald-500' : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min((planTotal / target) * 100, 100)}%` }}
            />
          </div>
        )}
        {target === 0 && (
          <p className="mt-3 text-xs text-slate-400">
            Tip: set your monthly income and Money System Invest % under <strong>Budget →
            Money System</strong> to see your target.
          </p>
        )}
      </div>

      {investmentAllocations.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <PieChart className="mb-3 text-slate-300" size={32} />
          <p className="text-slate-500">
            No allocations yet. Add things like MP2 Pag-IBIG, VUL, PSE stocks, etc.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {investmentAllocations.map((a) => {
            const pct = planTotal > 0 ? ((Number(a.amount) || 0) / planTotal) * 100 : 0
            return (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-slate-800">{a.name}</span>
                    {a.active === false && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-400">
                        inactive
                      </span>
                    )}
                  </div>
                  {a.notes && <div className="text-xs text-slate-400">{a.notes}</div>}
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-slate-900">{formatMoney(a.amount)}</div>
                  <div className="text-xs text-slate-400">{pct.toFixed(0)}%</div>
                </div>
                <button
                  onClick={() => openEdit(a)}
                  className="text-slate-400 hover:text-slate-700"
                  title="Edit"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => setConfirmDelete(a)}
                  className="text-slate-300 hover:text-red-500"
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {formOpen && (
        <InvestmentAllocationForm
          allocation={editing}
          onClose={() => setFormOpen(false)}
          onSaved={refetch}
        />
      )}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete allocation?"
        message={confirmDelete ? `"${confirmDelete.name}" will be removed.` : ''}
        onConfirm={confirmDeleteAllocation}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
