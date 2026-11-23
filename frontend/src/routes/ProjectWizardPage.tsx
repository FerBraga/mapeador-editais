import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '@/lib/api'
import { useOpportunity } from '@/hooks/use-opportunities'
import {
  useAskProjectDraftQuestion,
  useProjectDraft,
  useRegenerateProjectDraftSection,
  useSubmitProjectDraftSection,
} from '@/hooks/use-project-draft'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { WizardSectionPanel } from '@/components/wizard/WizardSectionPanel'
import { WizardQuestions } from '@/components/wizard/WizardQuestions'
import type { ProjectDraftSectionKey } from '@/types/api'

function extractErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  return 'Algo deu errado. Tente novamente.'
}

export default function ProjectWizardPage() {
  const { id } = useParams<{ id: string }>()
  const opportunityQuery = useOpportunity(id)
  const draftQuery = useProjectDraft(id)
  const submitSection = useSubmitProjectDraftSection(id ?? '')
  const regenerateSection = useRegenerateProjectDraftSection(id ?? '')
  const askQuestion = useAskProjectDraftQuestion(id ?? '')
  const [activeSection, setActiveSection] = useState<ProjectDraftSectionKey>('JUSTIFICATIVA')

  if (opportunityQuery.isLoading || draftQuery.isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">Carregando...</p>
  }

  if (draftQuery.isError) {
    return (
      <div className="flex flex-col gap-3 p-6">
        <p className="text-sm text-destructive">{extractErrorMessage(draftQuery.error)}</p>
        {id && (
          <Link to={`/editais/${id}`} className={buttonVariants({ variant: 'outline', size: 'sm', className: 'w-fit' })}>
            ← Voltar ao edital
          </Link>
        )}
      </div>
    )
  }

  if (!opportunityQuery.data || !draftQuery.data || !id) return null

  const draft = draftQuery.data
  const currentSection = draft.sections.find((s) => s.section === activeSection) ?? draft.sections[0]

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-4 sm:p-6">
      <Link to={`/editais/${id}`} className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'w-fit' })}>
        ← Voltar ao edital
      </Link>

      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-foreground">Escrever meu projeto com ajuda da IA</h1>
        <p className="text-sm text-muted-foreground">{opportunityQuery.data.title}</p>
        <p className="text-xs text-muted-foreground">
          Responda as perguntas de cada seção. A IA escreve o texto para você copiar e ajustar como quiser.
        </p>
      </header>

      <nav className="flex flex-wrap gap-2">
        {draft.sections.map((section) => (
          <Button
            key={section.section}
            type="button"
            size="sm"
            variant={section.section === activeSection ? 'default' : 'outline'}
            onClick={() => setActiveSection(section.section)}
            className={cn(section.generatedText && section.section !== activeSection && 'border-primary/50')}
          >
            {section.title}
            {section.generatedText ? ' ✓' : ''}
          </Button>
        ))}
      </nav>

      <WizardSectionPanel
        key={currentSection.section}
        section={currentSection}
        isSubmitting={submitSection.isPending}
        isRegenerating={regenerateSection.isPending}
        error={
          (submitSection.isError && submitSection.variables?.section === currentSection.section) ||
          (regenerateSection.isError && regenerateSection.variables === currentSection.section)
            ? extractErrorMessage(submitSection.error ?? regenerateSection.error)
            : null
        }
        onSubmit={(answers) => submitSection.mutate({ section: currentSection.section, answers })}
        onRegenerate={() => regenerateSection.mutate(currentSection.section)}
      />

      <WizardQuestions
        questions={draft.questions}
        questionsUsed={draft.questionsUsed}
        maxQuestions={draft.maxQuestions}
        isAsking={askQuestion.isPending}
        error={askQuestion.isError ? extractErrorMessage(askQuestion.error) : null}
        onAsk={(question) => askQuestion.mutate(question)}
      />
    </div>
  )
}
