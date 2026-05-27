import { supabase } from './supabase'

function toRow(values) {
  return {
    name: values.name,
    amount: values.amount === '' ? 0 : Number(values.amount),
    due_day: Number(values.due_day) || 1,
    category: values.category || null,
    notes: values.notes || null,
    active: values.active !== false,
  }
}

export async function createBill(userId, values) {
  const { error } = await supabase
    .from('bills')
    .insert({ ...toRow(values), user_id: userId })
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
