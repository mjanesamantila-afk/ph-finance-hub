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

export async function createBank(userId, values) {
  const name = String(values.bank_name || '').trim()
  if (!name) throw new Error('Bank name is required')
  const { error } = await supabase.from('digital_banks').insert({
    user_id: userId,
    bank_name: name,
    balance: Number(values.balance) || 0,
    interest_rate: Number(values.interest_rate) || 0,
  })
  if (error) {
    if (error.code === '23505') throw new Error('A bank with that name already exists.')
    throw error
  }
}

// Rename a bank and update all rows that reference its old name as text
// (bank_transactions, interest_history). Other places that reference a bank
// by name (savings_goals.source, payment methods) are independent strings
// and won't be touched.
export async function renameBank(userId, bank, newName) {
  const trimmed = String(newName || '').trim()
  if (!trimmed) throw new Error('Bank name is required')
  if (trimmed === bank.bank_name) return

  const { error: e1 } = await supabase
    .from('digital_banks')
    .update({ bank_name: trimmed })
    .eq('id', bank.id)
  if (e1) {
    if (e1.code === '23505') throw new Error('A bank with that name already exists.')
    throw e1
  }
  await supabase
    .from('bank_transactions')
    .update({ bank_name: trimmed })
    .eq('user_id', userId)
    .eq('bank_name', bank.bank_name)
  await supabase
    .from('interest_history')
    .update({ bank_name: trimmed })
    .eq('user_id', userId)
    .eq('bank_name', bank.bank_name)
}

export async function deleteBank(id) {
  const { error } = await supabase.from('digital_banks').delete().eq('id', id)
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
