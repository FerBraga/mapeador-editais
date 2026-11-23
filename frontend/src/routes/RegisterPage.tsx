import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { ApiError } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await register({ name, email, password })
      navigate('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível criar sua conta. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UserPlus className="size-5" />
        </span>
        <h1 className="text-lg font-semibold text-foreground">Criar conta</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre-se como proponente para usar o copiloto de escrita.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-xs font-medium text-muted-foreground">
            Nome
          </label>
          <Input
            id="name"
            autoComplete="name"
            required
            className="h-10"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-xs font-medium text-muted-foreground">
            E-mail
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            className="h-10"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-xs font-medium text-muted-foreground">
            Senha
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className="h-10"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <span className="text-xs text-muted-foreground">Mínimo de 8 caracteres.</span>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={isSubmitting} size="lg" className="mt-2">
          {isSubmitting ? 'Criando conta...' : 'Criar conta'}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        Já tem conta?{' '}
        <Link to="/entrar" className="font-medium text-primary underline-offset-4 hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}
