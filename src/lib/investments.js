import { supabase } from './supabase'

function toRow(values) {
  return {
    name: values.name,
    amount: values.amount === '' ? 0 : Number(values.amount),
    notes: values.notes || null,
    active: values.active !== false,
  }
}

export async function createAllocation(userId, values) {
  const { error } = await supabase
    .from('investment_allocations')
    .insert({ ...toRow(values), user_id: userId })
  if (error) throw error
}

export async function updateAllocation(id, values) {
  const { error } = await supabase
    .from('investment_allocations')
    .update(toRow(values))
    .eq('id', id)
  if (error) throw error
}

export async function deleteAllocation(id) {
  const { error } = await supabase.from('investment_allocations').delete().eq('id', id)
  if (error) throw error
}
