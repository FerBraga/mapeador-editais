import { useState } from 'react'
import { useCategories } from '@/hooks/use-categories'
import { useSources } from '@/hooks/use-sources'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { OpportunityListFilters } from '@/types/api'

interface FilterBarProps {
  filters: OpportunityListFilters
  onChange: (patch: Partial<OpportunityListFilters>) => void
  selectedMunicipalityName: string | undefined
  onClearMunicipality: () => void
}

export function FilterBar({ filters, onChange, selectedMunicipalityName, onClearMunicipality }: FilterBarProps) {
  const { data: categories } = useCategories()
  const { data: sources } = useSources()

  const [expanded, setExpanded] = useState(false)
  const [q, setQ] = useState(filters.q ?? '')
  const [fundingMin, setFundingMin] = useState(filters.fundingMin?.toString() ?? '')
  const [fundingMax, setFundingMax] = useState(filters.fundingMax?.toString() ?? '')

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    onChange({
      q: q.trim() || undefined,
      fundingMin: fundingMin ? Number(fundingMin) : undefined,
      fundingMax: fundingMax ? Number(fundingMax) : undefined,
    })
  }

  return (
    <div className="border-b border-border bg-background">
      <div className="flex items-center justify-between px-3 py-2 lg:hidden">
        <span className="text-sm font-medium text-foreground">Filtros</span>
        <Button type="button" variant="outline" size="sm" onClick={() => setExpanded((prev) => !prev)}>
          {expanded ? 'Ocultar filtros' : 'Mostrar filtros'}
        </Button>
      </div>

      <form
        onSubmit={handleSubmit}
        className={cn('flex flex-wrap items-end gap-3 p-3', expanded ? 'flex' : 'hidden', 'lg:flex')}
      >
      <div className="flex min-w-48 flex-1 flex-col gap-1">
        <label htmlFor="q" className="text-xs font-medium text-muted-foreground">
          Buscar
        </label>
        <Input
          id="q"
          placeholder="Título, descrição ou objeto do edital"
          value={q}
          onChange={(event) => setQ(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="categoryId" className="text-xs font-medium text-muted-foreground">
          Categoria
        </label>
        <Select
          id="categoryId"
          value={filters.categoryId ?? ''}
          onChange={(event) => onChange({ categoryId: event.target.value || undefined })}
        >
          <option value="">Todas</option>
          {categories?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="sourceId" className="text-xs font-medium text-muted-foreground">
          Fonte
        </label>
        <Select
          id="sourceId"
          value={filters.sourceId ?? ''}
          onChange={(event) => onChange({ sourceId: event.target.value || undefined })}
        >
          <option value="">Todas</option>
          {sources?.map((source) => (
            <option key={source.id} value={source.id}>
              {source.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="fundingMin" className="text-xs font-medium text-muted-foreground">
          Valor mínimo (R$)
        </label>
        <Input
          id="fundingMin"
          type="number"
          min={0}
          className="w-32"
          value={fundingMin}
          onChange={(event) => setFundingMin(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="fundingMax" className="text-xs font-medium text-muted-foreground">
          Valor máximo (R$)
        </label>
        <Input
          id="fundingMax"
          type="number"
          min={0}
          className="w-32"
          value={fundingMax}
          onChange={(event) => setFundingMax(event.target.value)}
        />
      </div>

      <label className="flex items-center gap-1.5 pb-1.5 text-sm">
        <input
          type="checkbox"
          checked={filters.onlyOpen ?? false}
          onChange={(event) => onChange({ onlyOpen: event.target.checked || undefined })}
          className="size-4 rounded border-border"
        />
        Só editais com inscrição ainda não encerrada
      </label>

      <Button type="submit" size="sm">
        Aplicar filtros
      </Button>

      {selectedMunicipalityName && (
        <Button type="button" variant="outline" size="sm" onClick={onClearMunicipality}>
          Limpar município: {selectedMunicipalityName}
        </Button>
      )}
      </form>
    </div>
  )
}
