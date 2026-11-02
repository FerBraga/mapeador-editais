import { useState } from 'react'
import { MapView } from '@/components/map/MapView'
import { FilterBar } from '@/components/filters/FilterBar'
import { OpportunityList } from '@/components/opportunities/OpportunityList'
import { Button } from '@/components/ui/button'
import { useOpportunityFilters } from '@/hooks/use-opportunity-filters'
import { useOpportunities } from '@/hooks/use-opportunities'
import { useMunicipalities } from '@/hooks/use-municipalities'
import { cn } from '@/lib/utils'

export default function MapPage() {
  const { filters, setFilters, setPage } = useOpportunityFilters()
  const municipalitiesQuery = useMunicipalities()
  const opportunitiesQuery = useOpportunities(filters)
  const [view, setView] = useState<'map' | 'list'>('list')

  const selectedMunicipality = municipalitiesQuery.data?.find((m) => m.id === filters.municipalityId)

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border bg-background px-4 py-2">
        <h1 className="text-lg font-semibold text-foreground">Mapa Inteligente de Editais do Paraná</h1>
        <div className="flex gap-1 lg:hidden">
          <Button type="button" size="sm" variant={view === 'map' ? 'default' : 'outline'} onClick={() => setView('map')}>
            Mapa
          </Button>
          <Button type="button" size="sm" variant={view === 'list' ? 'default' : 'outline'} onClick={() => setView('list')}>
            Lista
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className={cn('min-h-0 flex-1', view === 'map' ? 'block' : 'hidden', 'lg:block')}>
          {municipalitiesQuery.isLoading && (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Carregando mapa...
            </div>
          )}
          {municipalitiesQuery.isError && (
            <div className="flex h-full items-center justify-center text-sm text-destructive">
              Não foi possível carregar os municípios.
            </div>
          )}
          {municipalitiesQuery.data && (
            <MapView
              municipalities={municipalitiesQuery.data}
              selectedMunicipalityId={filters.municipalityId}
              onSelectMunicipality={(municipalityId) => setFilters({ municipalityId })}
              resizeTrigger={view}
            />
          )}
        </div>

        <div
          className={cn(
            'min-h-0 w-full flex-col border-border lg:flex lg:w-[420px] lg:border-l',
            view === 'list' ? 'flex' : 'hidden',
          )}
        >
          <FilterBar
            filters={filters}
            onChange={setFilters}
            selectedMunicipalityName={selectedMunicipality?.name}
            onClearMunicipality={() => setFilters({ municipalityId: undefined })}
          />
          <div className="min-h-0 flex-1">
            <OpportunityList result={opportunitiesQuery} onPageChange={setPage} />
          </div>
        </div>
      </div>
    </div>
  )
}
