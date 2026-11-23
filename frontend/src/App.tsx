import { Route, Routes } from 'react-router-dom'
import { RequireAuth } from '@/components/auth/RequireAuth'
import MapPage from '@/routes/MapPage'
import OpportunityDetailPage from '@/routes/OpportunityDetailPage'
import LoginPage from '@/routes/LoginPage'
import RegisterPage from '@/routes/RegisterPage'

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <RequireAuth>
            <MapPage />
          </RequireAuth>
        }
      />
      <Route
        path="/editais/:id"
        element={
          <RequireAuth>
            <OpportunityDetailPage />
          </RequireAuth>
        }
      />
      <Route path="/entrar" element={<LoginPage />} />
      <Route path="/cadastro" element={<RegisterPage />} />
    </Routes>
  )
}
