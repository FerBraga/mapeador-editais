import 'leaflet/dist/leaflet.css'
import { CircleMarker, MapContainer, TileLayer, Tooltip } from 'react-leaflet'
import type { Municipality } from '@/types/api'

const PARANA_CENTER: [number, number] = [-24.68, -51.4]
const DEFAULT_ZOOM = 7

const MIN_RADIUS = 4
const MAX_RADIUS = 18

function radiusFor(opportunityCount: number, maxCount: number): number {
  if (opportunityCount === 0) return MIN_RADIUS
  if (maxCount === 0) return MIN_RADIUS
  const scale = Math.sqrt(opportunityCount) / Math.sqrt(maxCount)
  return MIN_RADIUS + scale * (MAX_RADIUS - MIN_RADIUS)
}

interface MapViewProps {
  municipalities: Municipality[]
  selectedMunicipalityId: string | undefined
  onSelectMunicipality: (municipalityId: string) => void
}

export function MapView({ municipalities, selectedMunicipalityId, onSelectMunicipality }: MapViewProps) {
  const maxCount = municipalities.reduce((max, m) => Math.max(max, m.opportunityCount), 0)

  return (
    <MapContainer center={PARANA_CENTER} zoom={DEFAULT_ZOOM} className="h-full w-full" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {municipalities.map((municipality) => {
        const isSelected = municipality.id === selectedMunicipalityId
        return (
          <CircleMarker
            key={municipality.id}
            center={[municipality.latitude, municipality.longitude]}
            radius={radiusFor(municipality.opportunityCount, maxCount)}
            pathOptions={{
              color: isSelected ? '#b91c1c' : '#2563eb',
              fillColor: isSelected ? '#ef4444' : '#3b82f6',
              fillOpacity: municipality.opportunityCount > 0 ? 0.6 : 0.2,
              weight: isSelected ? 3 : 1,
            }}
            eventHandlers={{ click: () => onSelectMunicipality(municipality.id) }}
          >
            <Tooltip>
              {municipality.name} — {municipality.opportunityCount}{' '}
              {municipality.opportunityCount === 1 ? 'edital' : 'editais'}
            </Tooltip>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
