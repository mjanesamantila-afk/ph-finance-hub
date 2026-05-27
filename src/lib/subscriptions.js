import { supabase } from './supabase'

function toRow(values) {
  return {
    name: values.name,
    amount: values.amount === '' ? 0 : Number(values.amount),
    cycle: values.cycle || 'monthly',
    payment_method: values.payment_method || null,
    active: values.active !== false,
  }
}

export async function createSubscription(userId, values) {
  const { error } = await supabase
    .from('subscriptions')
    .insert({ ...toRow(values), user_id: userId })
  if (error) throw error
}

export async function updateSubscription(id, values) {
  const { error } = await supabase.from('subscriptions').update(toRow(values)).eq('id', id)
  if (error) throw error
}

export async function deleteSubscription(id) {
  const { error } = await supabase.from('subscriptions').delete().eq('id', id)
  if (error) throw error
}

// Normalize to a monthly cost (yearly subscriptions ÷ 12).
export function monthlyCost(sub) {
  const a = Number(sub?.amount) || 0
  return sub?.cycle === 'yearly' ? a / 12 : a
}

export function yearlyCost(sub) {
  const a = Number(sub?.amount) || 0
  return sub?.cycle === 'yearly' ? a : a * 12
}
