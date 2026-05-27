import { useMemo, useState } from 'react'
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarClock,
  Pencil,
  Trash2,
  Bell,
  Check,
} from 'lucide-react'
import { useData } from '../../context/DataContext'
import { deleteBill, setBillPaid } from '../../lib/bills'
import { formatMoney } from '../../lib/finance'
import { MONTH_NAMES, nextDueDate, daysUntil, monthKeyFromDate } from '../../lib/dates'
import BillForm from '../../components/bills/BillForm'
import BillCalendar from '../../components/bills/BillCalendar'
import ConfirmDialog from '../../components/ConfirmDialog'

const DUE_SOON_DAYS = 7

export default function Bills() {
  const { bills, loading, refetch } = useData()

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [monthIndex, setMonthIndex] = useState(now.getMonth())
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const activeBills = useMemo(() => bills.filter((b) => b.active !== false), [bills])

  // Upcoming reminders: each active bill's next due date, sorted soonest first.
  const upcoming = useMemo(() => {
    return activeBills
      .map((b) => {
        const due = nextDueDate(b.due_day)
        const monthKey = monthKeyFromDate(due)
        return {
          bill: b,
          due,
          monthKey,
          days: daysUntil(due),
          paid: (b.paid_months || []).includes(monthKey),
        }
      })
      .sort((a, b) => a.days - b.days)
  }, [activeBills])

  // Paid bills drop off the reminders.
  const dueSoon = upcoming.filter((u) => !u.paid && u.days >= 0 && u.days <= DUE_SOON_DAYS)

  function prevMonth() {
    setMonthIndex((m) => {
      if (m === 0) {
        setYear((y) => y - 1)
        return 11
      }
      return m - 1
    })
  }
  function nextMonth() {
    setMonthIndex((m) => {
      if (m === 11) {
        setYear((y) => y + 1)
        return 0
      }
      return m + 1
    })
  }

  function openAdd() {
    setEditing(null)
    setFormOpen(true)
  }
  function openEdit(bill) {
    setEditing(bill)
    setFormOpen(true)
  }
  async function confirmDeleteBill() {
    if (!confirmDelete) return
    await deleteBill(confirmDelete.id)
    setConfirmDelete(null)
    await refetch()
  }

  async function handleSetPaid(bill, monthKey, paid) {
    await setBillPaid(bill, monthKey, paid)
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
        <h1 className="text-2xl font-semibold text-slate-900">Bills Payment</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus size={15} />
          Add Bill
        </button>
      </div>

      {/* Upcoming reminders */}
      {dueSoon.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-center gap-2 font-medium text-amber-800">
            <Bell size={16} />
            {dueSoon.length} bill{dueSoon.length > 1 ? 's' : ''} due in the next{' '}
            {DUE_SOON_DAYS} days
          </div>
          <div className="mt-2 space-y-1.5">
            {dueSoon.map(({ bill, due, days, monthKey }) => (
              <div
                key={bill.id}
                className="flex flex-wrap items-center justify-between gap-2 text-sm text-amber-900"
              >
                <span>
                  {bill.name}
                  {bill.amount ? ` · ${formatMoney(bill.amount)}` : ''}
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-medium">
                    {dueLabel(days)} ({MONTH_NAMES[due.getMonth()].slice(0, 3)} {due.getDate()})
                  </span>
                  <button
                    onClick={() => handleSetPaid(bill, monthKey, true)}
                    className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    <Check size={13} />
                    Mark as Paid
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="font-medium text-slate-900">
            {MONTH_NAMES[monthIndex]} {year}
          </h2>
          <button
            onClick={nextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <BillCalendar
          year={year}
          monthIndex={monthIndex}
          bills={activeBills}
          onSelectBill={openEdit}
        />
      </div>

      {/* Manage list */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Your Bills
        </h2>
        {loading ? (
          <p className="text-center text-slate-400">Loading…</p>
        ) : bills.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <CalendarClock className="mb-3 text-slate-300" size={32} />
            <p className="text-slate-500">
              No bills yet. Add your recurring monthly bills to see them on the calendar.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {[...bills]
              .sort((a, b) => a.due_day - b.due_day)
              .map((b) => {
                const dueMonthKey = monthKeyFromDate(nextDueDate(b.due_day))
                const paid = (b.paid_months || []).includes(dueMonthKey)
                return (
                <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <span className="text-[9px] uppercase leading-none text-slate-400">Day</span>
                    <span className="text-sm font-semibold leading-tight">{b.due_day}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-slate-800">{b.name}</span>
                      {b.active === false && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-400">
                          inactive
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      {b.amount ? formatMoney(b.amount) : 'No amount'}
                      {b.category ? ` · ${b.category}` : ''}
                      {b.notes ? ` · ${b.notes}` : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => handleSetPaid(b, dueMonthKey, !paid)}
                    className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium ${
                      paid
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                    }`}
                    title={paid ? 'Paid this month — tap to undo' : 'Mark paid this month'}
                  >
                    <Check size={13} />
                    {paid ? 'Paid' : 'Mark paid'}
                  </button>
                  <button
                    onClick={() => openEdit(b)}
                    className="text-slate-400 hover:text-slate-700"
                    title="Edit"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(b)}
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
      </div>

      {formOpen && (
        <BillForm bill={editing} onClose={() => setFormOpen(false)} onSaved={refetch} />
      )}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete bill?"
        message={confirmDelete ? `"${confirmDelete.name}" will be removed.` : ''}
        onConfirm={confirmDeleteBill}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
