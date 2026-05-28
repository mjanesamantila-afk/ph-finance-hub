import { DB_COLORS } from '../config/constants'

const COLOR_POOL = [
  '#E24B4A', '#1D9E75', '#3266ad', '#BA7517', '#1273E6', '#0A2472',
  '#7F77DD', '#D4537E', '#E8A020', '#0F6E56', '#993C1D',
]

// Deterministic color for a bank: use the known palette if we have one, else
// hash the name into the pool so custom banks always get a stable color.
export function bankColor(name = '') {
  if (DB_COLORS[name]) return DB_COLORS[name]
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) - h + name.charCodeAt(i)) | 0
  }
  return COLOR_POOL[Math.abs(h) % COLOR_POOL.length]
}

// Payment methods used in dropdowns across Bills, Subscriptions, Ledger.
// Includes cards/auto debit and the user's actual banks.
export function paymentMethods(digitalBanks) {
  const banks = (digitalBanks || []).map((b) => b.bank_name).filter(Boolean)
  return [...new Set(['Cash', 'Credit Card', 'Auto Debit', ...banks])]
}
