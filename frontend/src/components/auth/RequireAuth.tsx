import type { ReactNode } from 'react'
import { useAuth } from '@/lib/auth-context'
import WelcomePage from '@/routes/WelcomePage'

/**
 * Gates a route behind an authenticated session: shows the welcome screen
 * (with the Entrar/Cadastre-se entry points) instead of the protected page
 * when there is no logged-in proponent, so browsing editais requires an
 * account up front rather than only writing a project (wizard) later.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Carregando...
      </div>
    )
  }

  if (!user) {
    return <WelcomePage />
  }

  return children
}
