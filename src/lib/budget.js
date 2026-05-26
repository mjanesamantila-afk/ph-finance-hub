import { supabase } from './supabase'

// ---- Spending budgets -------------------------------------------------------
export async function upsertBudget(userId, category, amount) {
  const { error } = await supabase
    .from('spend_budgets')
    .upsert(
      { user_id: userId, category, budget_amount: Number(amount) || 0 },
      { onConflict: 'user_id,category' }
    )
  if (error) throw error
}

// ---- Ledger -----------------------------------------------------------------
export async function addLedgerEntry(userId, values) {
  const { error } = await supabase.from('ledger_entries').insert({
    user_id: userId,
    date: values.date,
    description: values.description || null,
    category: values.category || null,
    amount: Number(values.amount),
    direction: values.direction,
    method: values.method || null,
  })
  if (error) throw error
}

export async function deleteLedgerEntry(id) {
  const { error } = await supabase.from('ledger_entries').delete().eq('id', id)
  if (error) throw error
}

// ---- Digital banks ----------------------------------------------------------
export async function updateBank(id, patch) {
  const { error } = await supabase.from('digital_banks').update(patch).eq('id', id)
  if (error) throw error
}

// Insert a bank transaction and adjust the bank's running balance.
export async function addBankTransaction(userId, bank, values) {
  const amount = Number(values.amount) || 0
  const { error } = await supabase.from('bank_transactions').insert({
    user_id: userId,
    bank_name: bank.bank_name,
    direction: values.direction,
    amount,
    note: values.note || null,
    date: values.date,
  })
  if (error) throw error

  const delta = values.direction === 'in' ? amount : -amount
  await updateBank(bank.id, {
    balance: (Number(bank.balance) || 0) + delta,
    last_updated: values.date,
  })
}

// Record monthly interest for a bank — once per calendar month (unique
// constraint on user_id+bank_name+month). interest = balance × (rate/100) / 12.
export async function recordInterest(userId, bank, monthKey) {
  const balance = Number(bank.balance) || 0
  const rate = Number(bank.interest_rate) || 0
  const interest = (balance * (rate / 100)) / 12

  const { error } = await supabase.from('interest_history').insert({
    user_id: userId,
    bank_name: bank.bank_name,
    month: monthKey,
    interest,
    balance_at_time: balance,
    rate_at_time: rate,
  })
  if (error) {
    // 23505 = unique violation (already recorded this month)
    if (error.code === '23505') {
      throw new Error('Interest already recorded for this month.')
    }
    throw error
  }

  await updateBank(bank.id, { balance: balance + interest })
  return interest
}
