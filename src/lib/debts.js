import { supabase } from './supabase'
import { todayISO } from './dates'

function toRow(values) {
  return {
    name: values.name,
    category: values.category || null,
    original_amount: values.original_amount === '' ? 0 : Number(values.original_amount),
    current_balance: values.current_balance === '' ? 0 : Number(values.current_balance),
    monthly_payment: values.monthly_payment === '' ? 0 : Number(values.monthly_payment),
    interest_rate: values.interest_rate === '' ? 0 : Number(values.interest_rate),
    due_day: values.due_day === '' || values.due_day == null ? null : Number(values.due_day),
    payment_method: values.payment_method || null,
    notes: values.notes || null,
    active: values.active !== false,
  }
}

export async function createDebt(userId, values) {
  const row = { ...toRow(values), user_id: userId }
  // If only "original" was set on a new debt, default current balance to it.
  if (!row.current_balance && row.original_amount) row.current_balance = row.original_amount
  const { error } = await supabase.from('debts').insert(row)
  if (error) throw error
}

export async function updateDebt(id, values) {
  const { error } = await supabase.from('debts').update(toRow(values)).eq('id', id)
  if (error) throw error
}

export async function deleteDebt(id) {
  const { error } = await supabase.from('debts').delete().eq('id', id)
  if (error) throw error
}

// Record a payment: drop the current balance and log a Money Out entry in
// the Ledger so the payment shows up in your spending.
export async function makeDebtPayment(debt, userId, { amount, date } = {}) {
  const amt = Number(amount) || 0
  if (amt <= 0) return
  const prev = Number(debt.current_balance) || 0
  const next = Math.max(prev - amt, 0)
  const { error: e1 } = await supabase
    .from('debts')
    .update({ current_balance: next })
    .eq('id', debt.id)
  if (e1) throw e1

  const { error: e2 } = await supabase.from('ledger_entries').insert({
    user_id: userId,
    date: date || todayISO(),
    description: `${debt.name} payment`,
    category: debt.category || 'Debt',
    amount: amt,
    direction: 'out',
    method: debt.payment_method || null,
  })
  if (e2) throw e2
}

export function debtProgress(debt) {
  const original = Number(debt?.original_amount) || 0
  const current = Number(debt?.current_balance) || 0
  if (original <= 0) return 0
  const paid = Math.max(original - current, 0)
  return Math.min((paid / original) * 100, 100)
}
