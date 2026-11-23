import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <img src="/favicon.svg" alt="" className="size-16" />

      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-foreground">Mapa Inteligente de Editais do Paraná</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Entre ou cadastre-se para buscar editais de cultura e educação do Paraná.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-2">
        <Link to="/entrar" className={buttonVariants({ variant: 'default', size: 'lg', className: 'w-full' })}>
          Entrar
        </Link>
        <Link to="/cadastro" className={buttonVariants({ variant: 'outline', size: 'lg', className: 'w-full' })}>
          Cadastre-se
        </Link>
      </div>
    </div>
  )
}
