import { SPENDING_CATS } from '../config/constants'

// The user's effective spending categories: base categories minus any they
// removed (hidden), plus their custom ones. Single source of truth so the
// Spending, Ledger, and Bills tabs all stay in sync.
export function spendingCategoryGroups(settings) {
  const custom = settings?.custom_categories ?? { manual: [], digital: [] }
  const hidden = custom.hidden ?? { manual: [], digital: [] }
  const manual = [
    ...new Set([
      ...SPENDING_CATS.manual.filter((c) => !(hidden.manual ?? []).includes(c)),
      ...(custom.manual ?? []),
    ]),
  ]
  const digital = [
    ...new Set([
      ...SPENDING_CATS.digital.filter((c) => !(hidden.digital ?? []).includes(c)),
      ...(custom.digital ?? []),
    ]),
  ]
  return { manual, digital }
}

export function allSpendingCategories(settings) {
  const { manual, digital } = spendingCategoryGroups(settings)
  return [...new Set([...manual, ...digital])]
}
