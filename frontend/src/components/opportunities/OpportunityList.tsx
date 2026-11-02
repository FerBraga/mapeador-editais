import type { UseQueryResult } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { OpportunityCard } from './OpportunityCard'
import type { OpportunityListResponse } from '@/types/api'

interface OpportunityListProps {
  result: UseQueryResult<OpportunityListResponse, Error>
  onPageChange: (page: number) => void
}

export function OpportunityList({ result, onPageChange }: OpportunityListProps) {
  const { data, isLoading, isError, error } = result

  if (isLoading) {
    return <p className="p-4 text-sm text-muted-foreground">Carregando editais...</p>
  }

  if (isError) {
    return (
      <p className="p-4 text-sm text-destructive">
        Não foi possível carregar os editais{error ? `: ${error.message}` : ''}.
      </p>
    )
  }

  if (!data || data.data.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">Nenhum edital encontrado para esses filtros.</p>
  }

  const { meta } = data

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-3">
      <p className="text-xs text-muted-foreground">{meta.total} editais encontrados</p>
      <div className="flex flex-col gap-2">
        {data.data.map((opportunity) => (
          <OpportunityCard key={opportunity.id} opportunity={opportunity} />
        ))}
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
        >
          Anterior
        </Button>
        <span className="text-xs text-muted-foreground">
          Página {meta.page} de {meta.totalPages || 1}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Próxima
        </Button>
      </div>
    </div>
  )
}
