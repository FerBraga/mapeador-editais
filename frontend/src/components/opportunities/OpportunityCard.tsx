import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatFundingRange } from '@/lib/format'
import type { OpportunitySummary } from '@/types/api'

export function OpportunityCard({ opportunity }: { opportunity: OpportunitySummary }) {
  const fundingRange = formatFundingRange(opportunity.fundingMin, opportunity.fundingMax)
  const deadline = formatDate(opportunity.registrationEndAt)

  return (
    <Link
      to={`/editais/${opportunity.id}`}
      className="flex flex-col gap-1.5 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{opportunity.title}</h3>
        {opportunity.coversEntireState && <Badge variant="accent">Estadual</Badge>}
      </div>
      {opportunity.issuingOrganization && (
        <p className="text-xs text-muted-foreground">{opportunity.issuingOrganization}</p>
      )}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {opportunity.category && <Badge variant="outline">{opportunity.category.name}</Badge>}
        <span>{opportunity.source.name}</span>
        {fundingRange && <span>· {fundingRange}</span>}
        {deadline && <span>· encerra em {deadline}</span>}
      </div>
    </Link>
  )
}
