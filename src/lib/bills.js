import { supabase } from './supabase'
import { monthLabel, todayISO } from './dates'

function toRow(values) {
  return {
    name: values.name,
    amount: values.amount === '' ? 0 : Number(values.amount),
    due_day: Number(values.due_day) || 1,
    category: values.category || null,
    notes: values.notes || null,
    payment_method: values.payment_method || null,
    active: values.active !== false,
  }
}

export async function createBill(userId, values, startMonth) {
  const row = { ...toRow(values), user_id: userId }
  if (startMonth) row.starts_from = startMonth
  const { error } = await supabase.from('bills').insert(row)
  if (error) throw error
}

export async function updateBill(id, values) {
  const { error } = await supabase.from('bills').update(toRow(values)).eq('id', id)
  if (error) throw error
}

export async function deleteBill(id) {
  const { error } = await supabase.from('bills').delete().eq('id', id)
  if (error) throw error
}

// Mark a bill paid (or unpaid) for a given month ('YYYY-MM'). Paid status is
// tracked per month, so the bill reappears in reminders next month.
export async function setBillPaid(bill, monthKey, paid) {
  const current = bill.paid_months || []
  const next = paid
    ? Array.from(new Set([...current, monthKey]))
    : current.filter((m) => m !== monthKey)
  const { error } = await supabase.from('bills').update({ paid_months: next }).eq('id', bill.id)
  if (error) throw error
}

export function isBillPaid(bill, monthKey) {
  return (bill?.paid_months || []).includes(monthKey)
}

// Mark a bill paid for a month AND create a matching ledger out-entry so your
// spending stays in sync (no double typing).
export async function markBillPaid(bill, monthKey, userId) {
  const current = bill.paid_months || []
  const nextPaid = Array.from(new Set([...current, monthKey]))
  const { error: updErr } = await supabase
    .from('bills')
    .update({ paid_months: nextPaid })
    .eq('id', bill.id)
  if (updErr) throw updErr

  const amount = effectiveAmount(bill, monthKey)
  if (amount > 0 && userId) {
    const { error: ledErr } = await supabase.from('ledger_entries').insert({
      user_id: userId,
      date: todayISO(),
      description: `${bill.name} (${monthLabel(monthKey)})`,
      category: bill.category || null,
      amount,
      direction: 'out',
      method: bill.payment_method || null,
    })
    if (ledErr) throw ledErr
  }
}

// Un-mark for a month. Doesn't auto-delete the ledger entry so prior history
// stays intact; you can delete that entry manually in the Ledger if needed.
export async function markBillUnpaid(bill, monthKey) {
  const current = bill.paid_months || []
  const next = current.filter((m) => m !== monthKey)
  const { error } = await supabase
    .from('bills')
    .update({ paid_months: next })
    .eq('id', bill.id)
  if (error) throw error
}

// Amount for a specific month: a per-month override if set, else the default.
export function effectiveAmount(bill, monthKey) {
  const override = bill?.month_amounts?.[monthKey]
  return override === undefined || override === null ? Number(bill?.amount) || 0 : Number(override)
}

// Set (override) the amount for one month only.
export async function setBillMonthAmount(bill, monthKey, amount) {
  const next = { ...(bill.month_amounts || {}), [monthKey]: Number(amount) || 0 }
  const { error } = await supabase.from('bills').update({ month_amounts: next }).eq('id', bill.id)
  if (error) throw error
}

// A bill applies to a month if it's active, the month is on/after its start
// month (the month it was added for — past months aren't back-filled), and it
// hasn't been ended. Falls back to the creation month for older bills.
export function isBillActiveForMonth(bill, monthKey) {
  if (!bill || bill.active === false) return false
  const startMonth = bill.starts_from || (bill.created_at || '').slice(0, 7)
  if (startMonth && monthKey < startMonth) return false
  if (bill.ended_from && monthKey >= bill.ended_from) return false
  return true
}

// Stop a bill from a given month onward (keeps earlier months as history).
export async function endBillFrom(bill, monthKey) {
  const { error } = await supabase.from('bills').update({ ended_from: monthKey }).eq('id', bill.id)
  if (error) throw error
}
