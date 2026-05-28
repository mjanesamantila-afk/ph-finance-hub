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
    term_months:
      values.term_months === '' || values.term_months == null
        ? null
        : Number(values.term_months),
    interest_period: values.interest_period || 'monthly',
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

// Record a payment: drop the current balance, save the payment to the
// debt_payments history, and log a Money Out entry in the Ledger.
export async function makeDebtPayment(debt, userId, { amount, date, note } = {}) {
  const amt = Number(amount) || 0
  if (amt <= 0) return
  const prev = Number(debt.current_balance) || 0
  const next = Math.max(prev - amt, 0)
  const paymentDate = date || todayISO()

  const { error: e1 } = await supabase
    .from('debts')
    .update({ current_balance: next })
    .eq('id', debt.id)
  if (e1) throw e1

  const { error: e2 } = await supabase.from('debt_payments').insert({
    user_id: userId,
    debt_id: debt.id,
    amount: amt,
    date: paymentDate,
    note: note || null,
  })
  if (e2) throw e2

  const { error: e3 } = await supabase.from('ledger_entries').insert({
    user_id: userId,
    date: paymentDate,
    description: `${debt.name} payment`,
    category: debt.category || 'Debt',
    amount: amt,
    direction: 'out',
    method: debt.payment_method || null,
  })
  if (e3) throw e3
}

// Delete a payment record. Restores the amount to the debt's current balance
// (doesn't touch the linked Ledger entry — delete that manually if you want).
export async function deleteDebtPayment(payment, debt) {
  const restored = (Number(debt.current_balance) || 0) + (Number(payment.amount) || 0)
  const { error: e1 } = await supabase
    .from('debts')
    .update({ current_balance: restored })
    .eq('id', debt.id)
  if (e1) throw e1
  const { error: e2 } = await supabase
    .from('debt_payments')
    .delete()
    .eq('id', payment.id)
  if (e2) throw e2
}

// Simple add-on interest loan calc (common in PH consumer loans, Pag-IBIG MPL):
// totalInterest = principal × monthlyRate × months. Returns total payable +
// monthly payment so the form can suggest current_balance + monthly_payment.
export function computeLoanTotal({ principal, rate, period, months }) {
  const p = Number(principal) || 0
  const r = Number(rate) || 0
  const m = Number(months) || 0
  if (p <= 0 || m <= 0 || r < 0) {
    return { totalInterest: 0, totalPayable: p, monthlyPayment: 0 }
  }
  const monthlyRate = period === 'annual' ? r / 12 : r
  const totalInterest = p * (monthlyRate / 100) * m
  const totalPayable = p + totalInterest
  const monthlyPayment = m > 0 ? totalPayable / m : 0
  return { totalInterest, totalPayable, monthlyPayment }
}

export function debtProgress(debt) {
  const original = Number(debt?.original_amount) || 0
  const current = Number(debt?.current_balance) || 0
  if (original <= 0) return 0
  const paid = Math.max(original - current, 0)
  return Math.min((paid / original) * 100, 100)
}
