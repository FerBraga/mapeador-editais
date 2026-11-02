import { Route, Routes } from 'react-router-dom'
import MapPage from '@/routes/MapPage'
import OpportunityDetailPage from '@/routes/OpportunityDetailPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MapPage />} />
      <Route path="/editais/:id" element={<OpportunityDetailPage />} />
    </Routes>
  )
}
