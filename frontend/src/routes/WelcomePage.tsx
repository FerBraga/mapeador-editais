import { Link } from 'react-router-dom'
import { LogIn, UserPlus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex size-24 items-center justify-center rounded-full bg-primary/10">
        <img src="/favicon.svg" alt="" className="size-12" />
      </div>

      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold text-foreground">Mapa Inteligente de Editais do Paraná</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Entre ou cadastre-se para buscar editais de cultura e educação do Paraná e escrever seu projeto com ajuda
          de IA.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-2.5">
        <Link
          to="/entrar"
          className={buttonVariants({ variant: 'default', size: 'lg', className: 'w-full gap-2' })}
        >
          <LogIn className="size-4" />
          Entrar
        </Link>
        <Link
          to="/cadastro"
          className={buttonVariants({ variant: 'outline', size: 'lg', className: 'w-full gap-2' })}
        >
          <UserPlus className="size-4" />
          Cadastre-se
        </Link>
      </div>
    </div>
  )
}
