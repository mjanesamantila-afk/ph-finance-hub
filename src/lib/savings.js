import { supabase } from './supabase'

function toRow(values) {
  return {
    name: values.name,
    target_amount: values.target_amount === '' ? 0 : Number(values.target_amount),
    saved_amount: values.saved_amount === '' ? 0 : Number(values.saved_amount),
    target_date: values.target_date || null,
    source: values.source || null,
  }
}

export async function createGoal(userId, values) {
  const { error } = await supabase
    .from('savings_goals')
    .insert({ ...toRow(values), user_id: userId })
  if (error) throw error
}

export async function updateGoal(id, values) {
  const { error } = await supabase.from('savings_goals').update(toRow(values)).eq('id', id)
  if (error) throw error
}

export async function deleteGoal(id) {
  const { error } = await supabase.from('savings_goals').delete().eq('id', id)
  if (error) throw error
}

// Add a contribution to a goal — increases its saved amount.
export async function addToSavings(goal, amount) {
  const add = Number(amount) || 0
  if (add === 0) return
  const next = (Number(goal.saved_amount) || 0) + add
  const { error } = await supabase
    .from('savings_goals')
    .update({ saved_amount: next })
    .eq('id', goal.id)
  if (error) throw error
}

// Whole months from `from` until the goal's target month.
export function monthsUntil(targetDate, from = new Date()) {
  if (!targetDate) return 0
  const t = new Date(targetDate)
  return (t.getFullYear() - from.getFullYear()) * 12 + (t.getMonth() - from.getMonth())
}

// Amount still needed to reach the target.
export function remainingAmount(goal) {
  return Math.max((Number(goal?.target_amount) || 0) - (Number(goal?.saved_amount) || 0), 0)
}

// How much to set aside each month to hit the target by its date.
export function monthlySaving(goal) {
  const remaining = remainingAmount(goal)
  const months = monthsUntil(goal?.target_date)
  if (months <= 0) return remaining // due this month / overdue → need it all now
  return remaining / months
}

// Progress toward the goal, 0–100.
export function goalProgress(goal) {
  const target = Number(goal?.target_amount) || 0
  const saved = Number(goal?.saved_amount) || 0
  return target > 0 ? Math.min((saved / target) * 100, 100) : 0
}
