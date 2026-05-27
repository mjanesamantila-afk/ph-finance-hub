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
  AlertTriangle,
} from 'lucide-react'
import { useData } from '../../context/DataContext'
import {
  deleteBill,
  setBillPaid,
  setBillMonthAmount,
  endBillFrom,
  effectiveAmount,
  isBillActiveForMonth,
} from '../../lib/bills'
import { formatMoney } from '../../lib/finance'
import { MONTH_NAMES, nextDueDate, daysUntil, monthKeyFromDate } from '../../lib/dates'
import BillForm from '../../components/bills/BillForm'
import BillCalendar from '../../components/bills/BillCalendar'

const DUE_SOON_DAYS = 7

export default function Bills() {
  const { bills, loading, refetch } = useData()

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [monthIndex, setMonthIndex] = useState(now.getMonth())
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const displayedMonthKey = monthKeyFromDate(new Date(year, monthIndex, 1))
  const monthLabelText = `${MONTH_NAMES[monthIndex]} ${year}`

  // Bills that apply to the month being viewed (active, not ended yet).
  const monthBills = useMemo(
    () =>
      bills
        .filter((b) => isBillActiveForMonth(b, displayedMonthKey))
        .sort((a, b) => a.due_day - b.due_day),
    [bills, displayedMonthKey]
  )

  // Upcoming reminders: next due date per bill (skip ended ones).
  const upcoming = useMemo(() => {
    return bills
      .filter((b) => b.active !== false)
      .map((b) => {
        const due = nextDueDate(b.due_day)
        const monthKey = monthKeyFromDate(due)
        return {
          bill: b,
          due,
          monthKey,
          days: daysUntil(due),
          paid: (b.paid_months || []).includes(monthKey),
          ended: Boolean(b.ended_from && monthKey >= b.ended_from),
          amount: effectiveAmount(b, monthKey),
        }
      })
      .filter((u) => !u.ended)
      .sort((a, b) => a.days - b.days)
  }, [bills])

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

  async function handleSetPaid(bill, monthKey, paid) {
    await setBillPaid(bill, monthKey, paid)
    await refetch()
  }
  async function handleSetAmount(bill, value) {
    await setBillMonthAmount(bill, displayedMonthKey, value)
    await refetch()
  }
  async function stopFromThisMonth() {
    await endBillFrom(deleteTarget, displayedMonthKey)
    setDeleteTarget(null)
    await refetch()
  }
  async function deleteEntirely() {
    await deleteBill(deleteTarget.id)
    setDeleteTarget(null)
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
            {dueSoon.map(({ bill, due, days, monthKey, amount }) => (
              <div
                key={bill.id}
                className="flex flex-wrap items-center justify-between gap-2 text-sm text-amber-900"
              >
                <span>
                  {bill.name}
                  {amount ? ` · ${formatMoney(amount)}` : ''}
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
          <h2 className="font-medium text-slate-900">{monthLabelText}</h2>
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
          bills={monthBills}
          onTogglePaid={handleSetPaid}
        />
        <p className="mt-2 text-center text-xs text-slate-400">
          Tap a bill to mark it paid/unpaid for {MONTH_NAMES[monthIndex]} only — other
          months aren’t affected.
        </p>
      </div>

      {/* Per-month bills list */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Your Bills · {monthLabelText}
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
        ) : monthBills.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-400">
            No bills for {monthLabelText}.
          </p>
        ) : (
          <div className="space-y-3">
            {monthBills.map((b) => {
              const paid = (b.paid_months || []).includes(displayedMonthKey)
              return (
                <div key={b.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <span className="text-[9px] uppercase leading-none text-slate-400">Day</span>
                      <span className="text-sm font-semibold leading-tight">{b.due_day}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-slate-800">{b.name}</div>
                      <div className="text-xs text-slate-400">
                        {b.category || 'Uncategorized'}
                        {b.notes ? ` · ${b.notes}` : ''}
                      </div>
                    </div>
                    <button
                      onClick={() => openEdit(b)}
                      className="text-slate-400 hover:text-slate-700"
                      title="Edit bill"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(b)}
                      className="text-slate-300 hover:text-red-500"
                      title="Delete bill"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                    <label className="block">
                      <span className="mb-1 block text-xs text-slate-400">
                        Amount for {MONTH_NAMES[monthIndex]} (₱)
                      </span>
                      <input
                        key={`${b.id}-${displayedMonthKey}`}
                        type="number"
                        step="any"
                        defaultValue={effectiveAmount(b, displayedMonthKey) || ''}
                        onBlur={(e) => handleSetAmount(b, e.target.value)}
                        className="w-40 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                        placeholder="0"
                      />
                    </label>
                    <button
                      onClick={() => handleSetPaid(b, displayedMonthKey, !paid)}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium ${
                        paid
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Check size={14} />
                      {paid ? `Paid for ${MONTH_NAMES[monthIndex]}` : 'Mark paid'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {formOpen && (
        <BillForm bill={editing} onClose={() => setFormOpen(false)} onSaved={refetch} />
      )}

      {/* Delete options dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center gap-2 text-slate-900">
              <AlertTriangle className="text-red-500" size={20} />
              <h2 className="text-base font-semibold">Delete “{deleteTarget.name}”?</h2>
            </div>
            <p className="mt-2 text-sm text-slate-500">Choose how to remove this bill.</p>
            <div className="mt-4 space-y-2">
              <button
                onClick={stopFromThisMonth}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-left hover:bg-slate-50"
              >
                <span className="block text-sm font-medium text-slate-800">
                  Stop from {monthLabelText}
                </span>
                <span className="block text-xs text-slate-500">
                  Removes it from this month and later. Earlier months stay (kept as paid history).
                </span>
              </button>
              <button
                onClick={deleteEntirely}
                className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-left hover:bg-red-100"
              >
                <span className="block text-sm font-medium text-red-700">Delete entirely</span>
                <span className="block text-xs text-red-500">
                  Removes it from all months, including history.
                </span>
              </button>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
