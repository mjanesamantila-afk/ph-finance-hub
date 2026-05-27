import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, PiggyBank } from 'lucide-react'
import { useData } from '../../context/DataContext'
import {
  deleteGoal,
  monthlySaving,
  goalProgress,
  remainingAmount,
  monthsUntil,
} from '../../lib/savings'
import { formatMoney } from '../../lib/finance'
import { MONTH_NAMES } from '../../lib/dates'
import { DB_COLORS } from '../../config/constants'
import GoalDonut from '../../components/savings/GoalDonut'
import SavingsGoalForm from '../../components/savings/SavingsGoalForm'
import ConfirmDialog from '../../components/ConfirmDialog'

function sourceColor(source) {
  return DB_COLORS[source] || '#1D9E75'
}

function targetLabel(targetDate) {
  if (!targetDate) return '—'
  const d = new Date(targetDate)
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
}

export default function Savings() {
  const { savingsGoals, loading, refetch } = useData()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const totals = useMemo(() => {
    let saved = 0
    let target = 0
    let monthly = 0
    for (const g of savingsGoals) {
      saved += Number(g.saved_amount) || 0
      target += Number(g.target_amount) || 0
      monthly += monthlySaving(g)
    }
    return { saved, target, monthly }
  }, [savingsGoals])

  function openAdd() {
    setEditing(null)
    setFormOpen(true)
  }
  function openEdit(goal) {
    setEditing(goal)
    setFormOpen(true)
  }
  async function confirmDeleteGoal() {
    if (!confirmDelete) return
    await deleteGoal(confirmDelete.id)
    setConfirmDelete(null)
    await refetch()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Savings</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus size={15} />
          Add Goal
        </button>
      </div>

      {/* Totals */}
      {savingsGoals.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Total Saved" value={formatMoney(totals.saved)} tone="emerald" />
          <Stat label="Total Target" value={formatMoney(totals.target)} />
          <Stat label="Needed / month" value={formatMoney(totals.monthly)} />
        </div>
      )}

      {loading ? (
        <p className="text-center text-slate-400">Loading…</p>
      ) : savingsGoals.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <PiggyBank className="mb-3 text-slate-300" size={32} />
          <p className="text-slate-500">
            No savings goals yet. Add one — like a Travel Fund or Emergency Fund.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {savingsGoals.map((g) => {
            const pct = goalProgress(g)
            const color = sourceColor(g.source)
            const months = monthsUntil(g.target_date)
            return (
              <div key={g.id} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold text-slate-900">{g.name}</h3>
                    <span
                      className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: color }}
                    >
                      {g.source || 'Cash'}
                    </span>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => openEdit(g)}
                      className="text-slate-400 hover:text-slate-700"
                      title="Edit goal"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(g)}
                      className="text-slate-300 hover:text-red-500"
                      title="Delete goal"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-5">
                  <GoalDonut pct={pct} color={color} />
                  <div className="min-w-0 flex-1 space-y-2 text-sm">
                    <Row label="Saved" value={formatMoney(g.saved_amount)} strong />
                    <Row label="Target" value={formatMoney(g.target_amount)} />
                    <Row label="Remaining" value={formatMoney(remainingAmount(g))} />
                    <Row
                      label="Target date"
                      value={`${targetLabel(g.target_date)}${
                        months > 0 ? ` · ${months} mo left` : ''
                      }`}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm">
                  <span className="text-emerald-700">Save per month</span>
                  <span className="font-semibold text-emerald-700">
                    {formatMoney(monthlySaving(g))}
                    {months <= 0 ? ' (due now)' : ''}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {formOpen && (
        <SavingsGoalForm
          goal={editing}
          onClose={() => setFormOpen(false)}
          onSaved={refetch}
        />
      )}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete goal?"
        message={confirmDelete ? `"${confirmDelete.name}" will be removed.` : ''}
        onConfirm={confirmDeleteGoal}
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

function Row({ label, value, strong }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-400">{label}</span>
      <span className={strong ? 'font-semibold text-slate-900' : 'text-slate-700'}>
        {value}
      </span>
    </div>
  )
}
