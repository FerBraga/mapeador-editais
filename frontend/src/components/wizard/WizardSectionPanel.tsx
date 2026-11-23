import { useEffect, useState } from 'react'
import { Check, Copy, RotateCcw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { ProjectDraftSectionState } from '@/types/api'

interface WizardSectionPanelProps {
  section: ProjectDraftSectionState
  onSubmit: (answers: Record<string, string>) => void
  onRegenerate: () => void
  isSubmitting: boolean
  isRegenerating: boolean
  error: string | null
}

export function WizardSectionPanel({
  section,
  onSubmit,
  onRegenerate,
  isSubmitting,
  isRegenerating,
  error,
}: WizardSectionPanelProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(section.answers ?? {})
  const [copied, setCopied] = useState(false)

  // Section changes when the user switches tabs - resync the local form
  // state with whatever is saved for the newly selected section.
  useEffect(() => {
    setAnswers(section.answers ?? {})
    setCopied(false)
  }, [section.section, section.answers])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    onSubmit(answers)
  }

  async function handleCopy() {
    if (!section.generatedText) return
    try {
      await navigator.clipboard.writeText(section.generatedText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable (permissions, insecure context) - the text
      // is still selectable/visible, so this is a minor convenience loss.
    }
  }

  const regenerationsLeft = section.maxRegenerations - section.regenerationsUsed
  const canRegenerate = Boolean(section.generatedText) && regenerationsLeft > 0

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {section.questions.map((question) => (
          <div key={question.key} className="flex flex-col gap-1.5">
            <label htmlFor={question.key} className="text-sm font-medium text-foreground">
              {question.label}
            </label>
            <Textarea
              id={question.key}
              required
              maxLength={600}
              value={answers[question.key] ?? ''}
              onChange={(event) => setAnswers((prev) => ({ ...prev, [question.key]: event.target.value }))}
            />
          </div>
        ))}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={isSubmitting} className="w-fit gap-1.5">
          <Sparkles className="size-4" />
          {isSubmitting ? 'Gerando...' : section.generatedText ? 'Salvar e gerar novamente' : 'Gerar texto com IA'}
        </Button>
      </form>

      {section.generatedText && (
        <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" />
            Texto gerado pela IA
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{section.generatedText}</p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button type="button" size="sm" variant="outline" onClick={handleCopy} className="gap-1.5">
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? 'Copiado!' : 'Copiar texto'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!canRegenerate || isRegenerating}
              onClick={onRegenerate}
              className="gap-1.5"
            >
              <RotateCcw className={cn('size-3.5', isRegenerating && 'animate-spin')} />
              {isRegenerating ? 'Gerando...' : 'Gerar novamente'}
            </Button>
            <span className="text-xs text-muted-foreground">
              {regenerationsLeft > 0
                ? `${regenerationsLeft} nova${regenerationsLeft > 1 ? 's' : ''} geração${regenerationsLeft > 1 ? 'ões' : ''} disponível${regenerationsLeft > 1 ? 'is' : ''}`
                : 'Limite de gerações desta seção atingido'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
