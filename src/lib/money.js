// Money System buckets — flexible per-user allocation pots.
// Older users may have a flat object like {tithes:10,invest:20,...} stored;
// the helpers below normalize either shape into an array of buckets.

export const DEFAULT_BUCKETS = [
  { key: 'tithes', label: 'Generosity', color: '#D4537E', pct: 10 },
  { key: 'invest', label: 'Invest', color: '#1D9E75', pct: 20 },
  { key: 'savings', label: 'Savings', color: '#3266ad', pct: 20 },
  { key: 'spend', label: 'Spend', color: '#E8A020', pct: 50 },
]

const COLOR_POOL = [
  '#D4537E', '#1D9E75', '#3266ad', '#E8A020',
  '#7F77DD', '#BA7517', '#0F6E56', '#993C1D', '#E24B4A',
]

export function readBuckets(settings) {
  const ms = settings?.money_system
  if (Array.isArray(ms?.buckets)) {
    return ms.buckets.map((b) => ({
      key: b.key,
      label: b.label,
      color: b.color || '#1D9E75',
      pct: Number(b.pct) || 0,
    }))
  }
  if (ms && typeof ms === 'object') {
    // Legacy flat format — map known keys; ignore unknown keys.
    return DEFAULT_BUCKETS.map((b) => ({ ...b, pct: Number(ms[b.key]) || 0 }))
  }
  return DEFAULT_BUCKETS
}

// Build the payload to save: buckets[] + flat key:pct so other tabs that read
// settings.money_system.invest etc. keep working.
export function toMoneySystemPayload(buckets) {
  const flat = Object.fromEntries(buckets.map((b) => [b.key, Number(b.pct) || 0]))
  return { ...flat, buckets }
}

// Pick the first color from the palette not already used by another bucket.
export function pickColor(existingBuckets) {
  const used = new Set(existingBuckets.map((b) => b.color))
  return COLOR_POOL.find((c) => !used.has(c)) || COLOR_POOL[existingBuckets.length % COLOR_POOL.length]
}

export function newBucketKey(label) {
  const slug = String(label || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
  return `${slug || 'bucket'}_${Date.now().toString(36)}`
}
