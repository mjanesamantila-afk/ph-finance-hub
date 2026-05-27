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
