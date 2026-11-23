import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {section.questions.map((question) => (
          <div key={question.key} className="flex flex-col gap-1">
            <label htmlFor={question.key} className="text-sm text-foreground">
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

        <Button type="submit" disabled={isSubmitting} className="w-fit">
          {isSubmitting ? 'Gerando...' : section.generatedText ? 'Salvar e gerar novamente' : 'Gerar texto'}
        </Button>
      </form>

      {section.generatedText && (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted p-3">
          <p className="whitespace-pre-wrap text-sm text-foreground">{section.generatedText}</p>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="outline" onClick={handleCopy}>
              {copied ? 'Copiado!' : 'Copiar texto'}
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={!canRegenerate || isRegenerating} onClick={onRegenerate}>
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
