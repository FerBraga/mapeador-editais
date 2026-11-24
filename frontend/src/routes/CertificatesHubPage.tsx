import { Link } from 'react-router-dom'
import { ArrowLeft, Building2, ExternalLink, Landmark, MapPin, Scale } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { CERTIFICATE_GROUPS, MUNICIPAL_CERTIFICATE_GUIDANCE } from '@/lib/certificates'

const GROUP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  fiscal: Landmark,
  fgts: Building2,
  trabalhista: Scale,
}

export default function CertificatesHubPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-4 sm:p-6">
      <Link to="/" className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'w-fit gap-1.5' })}>
        <ArrowLeft className="size-4" />
        Voltar ao mapa
      </Link>

      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-foreground">Central de Certidões</h1>
        <p className="text-sm text-muted-foreground">
          Atalhos para os portais oficiais onde emitir as certidões e documentos mais comuns exigidos em editais.
        </p>
      </header>

      {CERTIFICATE_GROUPS.map((group) => {
        const Icon = GROUP_ICONS[group.id] ?? Landmark
        return (
          <section key={group.id} id={group.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-4" />
              </span>
              <h2 className="text-sm font-semibold text-foreground">{group.title}</h2>
            </div>

            <ul className="flex flex-col gap-2">
              {group.shortcuts.map((shortcut) => (
                <li key={shortcut.url}>
                  <a
                    href={shortcut.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start justify-between gap-3 rounded-xl border border-border p-3 text-sm transition-colors hover:bg-muted"
                  >
                    <div>
                      <p className="font-medium text-foreground">{shortcut.name}</p>
                      <p className="text-xs text-muted-foreground">{shortcut.description}</p>
                    </div>
                    <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )
      })}

      <section id="municipal" className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent-foreground">
            <MapPin className="size-4" />
          </span>
          <h2 className="text-sm font-semibold text-foreground">Municipal</h2>
        </div>
        <p className="text-sm text-muted-foreground">{MUNICIPAL_CERTIFICATE_GUIDANCE}</p>
      </section>
    </div>
  )
}
