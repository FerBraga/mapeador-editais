import { Link, useParams } from 'react-router-dom'
import { ApiError } from '@/lib/api'
import { useOpportunity } from '@/hooks/use-opportunities'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { formatDate, formatFundingRange } from '@/lib/format'

const DOCUMENT_CATEGORY_LABELS: Record<string, string> = {
  LEGAL: 'Documentação legal',
  TAX: 'Certidões fiscais',
  FINANCIAL: 'Documentação financeira',
  TECHNICAL: 'Documentação técnica',
  DECLARATION: 'Declaração',
  OTHER: 'Outro',
}

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: opportunity, isLoading, isError, error } = useOpportunity(id)

  if (isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">Carregando edital...</p>
  }

  if (isError) {
    const notFound = error instanceof ApiError && error.statusCode === 404
    return (
      <div className="flex flex-col gap-3 p-6">
        <p className="text-sm text-destructive">
          {notFound ? 'Edital não encontrado.' : `Não foi possível carregar o edital: ${error?.message}`}
        </p>
        <Link to="/" className={buttonVariants({ variant: 'outline', size: 'sm', className: 'w-fit' })}>
          Voltar ao mapa
        </Link>
      </div>
    )
  }

  if (!opportunity) return null

  const fundingRange = formatFundingRange(opportunity.fundingMin, opportunity.fundingMax)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <Link to="/" className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'w-fit' })}>
        ← Voltar ao mapa
      </Link>

      <header className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold text-foreground">{opportunity.title}</h1>
          {opportunity.coversEntireState && <Badge variant="accent">Edital estadual</Badge>}
        </div>
        {opportunity.issuingOrganization && (
          <p className="text-sm text-muted-foreground">{opportunity.issuingOrganization}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {opportunity.category && <Badge variant="outline">{opportunity.category.name}</Badge>}
          <span>{opportunity.source.name}</span>
        </div>
        <a
          href={opportunity.officialUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Ver edital na fonte oficial ↗
        </a>
      </header>

      <section className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-card p-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Faixa de valores</p>
          <p>{fundingRange ?? 'Não informado'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Inscrições</p>
          <p>
            {formatDate(opportunity.registrationStartAt) ?? '—'} até{' '}
            {formatDate(opportunity.registrationEndAt) ?? 'sem data definida'}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Municípios contemplados</p>
          <p>
            {opportunity.coversEntireState
              ? 'Todo o estado do Paraná'
              : opportunity.municipalities.length > 0
                ? opportunity.municipalities.map((m) => m.name).join(', ')
                : 'Não identificado'}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Número do edital</p>
          <p>{opportunity.noticeNumber ?? 'Não informado'}</p>
        </div>
      </section>

      {(opportunity.object || opportunity.description) && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-foreground">Objeto</h2>
          <p className="text-sm text-muted-foreground">{opportunity.object ?? opportunity.description}</p>
        </section>
      )}

      {opportunity.requiredDocuments.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-foreground">Documentos exigidos</h2>
          <ul className="flex flex-col gap-2">
            {opportunity.requiredDocuments.map((doc) => (
              <li key={doc.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-2.5 text-sm">
                <div>
                  <p>{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {DOCUMENT_CATEGORY_LABELS[doc.documentCategory] ?? doc.documentCategory}
                  </p>
                </div>
                <Badge variant={doc.isMandatory ? 'accent' : 'outline'}>
                  {doc.isMandatory ? 'Obrigatório' : 'Recomendado'}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      )}

      {opportunity.latestAnalysis && (
        <section className="flex flex-col gap-2 rounded-lg border border-border bg-muted p-4">
          <h2 className="text-sm font-semibold text-foreground">Resumo gerado por IA</h2>
          <p className="text-sm text-foreground">{opportunity.latestAnalysis.summary}</p>
          <p className="text-xs text-muted-foreground">
            ⚠️ Este resumo foi gerado automaticamente por IA e pode conter imprecisões. Consulte sempre{' '}
            <a href={opportunity.officialUrl} target="_blank" rel="noreferrer" className="underline">
              o edital na fonte oficial
            </a>{' '}
            antes de tomar qualquer decisão.
          </p>
        </section>
      )}
    </div>
  )
}
