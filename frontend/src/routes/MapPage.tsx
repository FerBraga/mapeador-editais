import { MapView } from '@/components/map/MapView'
import { FilterBar } from '@/components/filters/FilterBar'
import { OpportunityList } from '@/components/opportunities/OpportunityList'
import { useOpportunityFilters } from '@/hooks/use-opportunity-filters'
import { useOpportunities } from '@/hooks/use-opportunities'
import { useMunicipalities } from '@/hooks/use-municipalities'

export default function MapPage() {
  const { filters, setFilters, setPage } = useOpportunityFilters()
  const municipalitiesQuery = useMunicipalities()
  const opportunitiesQuery = useOpportunities(filters)

  const selectedMunicipality = municipalitiesQuery.data?.find((m) => m.id === filters.municipalityId)

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b border-border bg-background px-4 py-2">
        <h1 className="text-lg font-semibold text-foreground">Mapa Inteligente de Editais do Paraná</h1>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="flex-1">
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
            />
          )}
        </div>

        <div className="flex w-[420px] flex-col border-l border-border">
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
