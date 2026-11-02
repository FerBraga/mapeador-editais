const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

export function formatCurrency(value: number | null): string | null {
  return value === null ? null : currencyFormatter.format(value)
}

export function formatFundingRange(min: number | null, max: number | null): string | null {
  if (min === null && max === null) return null
  if (min !== null && max !== null) {
    if (min === max) return formatCurrency(min)
    return `${formatCurrency(min)} – ${formatCurrency(max)}`
  }
  return formatCurrency(min ?? max)
}

export function formatDate(value: string | null): string | null {
  return value === null ? null : dateFormatter.format(new Date(value))
}

interface NamedRequiredDocument {
  name: string
  isMandatory: boolean
}

/**
 * Multiple AI analyses of the same opportunity (reprocessing, non-determinism
 * across runs) each persist their own required documents without deduping
 * against prior analyses - that's deliberate for audit history, but shows up
 * as visible duplicates in the UI. Group by name here, display-only; nothing
 * is removed from the underlying data. When occurrences disagree on
 * mandatory/recommended, the stricter "mandatory" wins, since it's the safer
 * reading for someone preparing an application.
 */
export function dedupeRequiredDocuments<T extends NamedRequiredDocument>(docs: T[]): T[] {
  const byName = new Map<string, T>()
  for (const doc of docs) {
    const key = doc.name.trim().toLowerCase()
    const existing = byName.get(key)
    if (!existing) {
      byName.set(key, doc)
    } else if (doc.isMandatory && !existing.isMandatory) {
      byName.set(key, doc)
    }
  }
  return Array.from(byName.values())
}
