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
