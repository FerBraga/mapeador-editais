import { useQuery } from '@tanstack/react-query'
import { fetchHealth } from '@/lib/api'

export default function HomePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    retry: false,
  })

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-semibold">Mapa Inteligente de Editais do Paraná</h1>
      <p className="text-muted-foreground">
        Plataforma em construção para centralizar e interpretar editais de fomento no Paraná.
      </p>
      <p className="text-sm">
        {isLoading && 'Verificando conexão com a API...'}
        {isError && 'API indisponível neste momento.'}
        {data && `API online (banco: ${data.database}).`}
      </p>
    </main>
  )
}
