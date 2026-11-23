import { Route, Routes } from 'react-router-dom'
import MapPage from '@/routes/MapPage'
import OpportunityDetailPage from '@/routes/OpportunityDetailPage'
import LoginPage from '@/routes/LoginPage'
import RegisterPage from '@/routes/RegisterPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MapPage />} />
      <Route path="/editais/:id" element={<OpportunityDetailPage />} />
      <Route path="/entrar" element={<LoginPage />} />
      <Route path="/cadastro" element={<RegisterPage />} />
    </Routes>
  )
}
