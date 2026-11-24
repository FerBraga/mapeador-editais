import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileCheck2, LogOut } from 'lucide-react'
import { MapView } from '@/components/map/MapView'
import { FilterBar } from '@/components/filters/FilterBar'
import { OpportunityList } from '@/components/opportunities/OpportunityList'
import { Button } from '@/components/ui/button'
import { useOpportunityFilters } from '@/hooks/use-opportunity-filters'
import { useOpportunities } from '@/hooks/use-opportunities'
import { useMunicipalities } from '@/hooks/use-municipalities'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

export default function MapPage() {
  const { filters, setFilters, setPage } = useOpportunityFilters()
  const municipalitiesQuery = useMunicipalities()
  const opportunitiesQuery = useOpportunities(filters)
  const [view, setView] = useState<'map' | 'list'>('map')
  // Guaranteed non-null: MapPage only renders inside <RequireAuth>.
  const { user, logout } = useAuth()

  const selectedMunicipality = municipalitiesQuery.data?.find((m) => m.id === filters.municipalityId)

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between gap-2 border-b border-border bg-background px-4 py-2">
        <h1 className="text-lg font-semibold text-foreground">Mapa Inteligente de Editais do Paraná</h1>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 lg:hidden">
            <Button type="button" size="sm" variant={view === 'map' ? 'default' : 'outline'} onClick={() => setView('map')}>
              Mapa
            </Button>
            <Button type="button" size="sm" variant={view === 'list' ? 'default' : 'outline'} onClick={() => setView('list')}>
              Lista
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/certidoes"
              className="hidden items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground sm:flex"
            >
              <FileCheck2 className="size-4" />
              Certidões
            </Link>
            <span className="hidden text-sm text-muted-foreground sm:inline">Olá, {user?.name}</span>
            <Button type="button" size="sm" variant="outline" onClick={logout} className="gap-1.5">
              <LogOut className="size-3.5" />
              Sair
            </Button>
          </div>
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
              onSelectMunicipality={(municipalityId) => {
                setFilters({ municipalityId })
                setView('list')
              }}
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
