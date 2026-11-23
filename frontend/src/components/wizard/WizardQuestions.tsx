import { useState } from 'react'
import { HelpCircle, Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { ProjectDraftQuestionEntry } from '@/types/api'

interface WizardQuestionsProps {
  questions: ProjectDraftQuestionEntry[]
  questionsUsed: number
  maxQuestions: number
  onAsk: (question: string) => void
  isAsking: boolean
  error: string | null
}

export function WizardQuestions({ questions, questionsUsed, maxQuestions, onAsk, isAsking, error }: WizardQuestionsProps) {
  const [question, setQuestion] = useState('')
  const remaining = maxQuestions - questionsUsed
  const canAsk = remaining > 0 && question.trim().length >= 3

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!canAsk) return
    onAsk(question.trim())
    setQuestion('')
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent-foreground">
          <HelpCircle className="size-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Dúvidas sobre o edital</h2>
          <p className="text-xs text-muted-foreground">
            {remaining}/{maxQuestions} pergunta{maxQuestions > 1 ? 's' : ''} restante{remaining !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {questions.length > 0 && (
        <ul className="flex flex-col gap-3">
          {questions.map((entry) => (
            <li key={entry.id} className="flex flex-col gap-2">
              <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-secondary px-3 py-2 text-sm text-secondary-foreground">
                {entry.question}
              </div>
              <div className="flex max-w-[85%] items-start gap-2">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="size-3.5" />
                </span>
                <div className="rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-sm whitespace-pre-wrap text-foreground">
                  {entry.answer}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {remaining > 0 ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <Textarea
            placeholder="Ex.: posso me inscrever sendo MEI?"
            maxLength={300}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" size="sm" disabled={!canAsk || isAsking} className="w-fit gap-1.5">
            <Send className="size-3.5" />
            {isAsking ? 'Perguntando...' : 'Perguntar'}
          </Button>
        </form>
      ) : (
        <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          Limite de perguntas sobre este edital foi atingido.
        </p>
      )}
    </section>
  )
}
