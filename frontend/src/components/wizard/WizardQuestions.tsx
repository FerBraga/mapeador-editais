import { useState } from 'react'
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
    <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Dúvidas sobre o edital</h2>
        <p className="text-xs text-muted-foreground">
          Pergunte algo pontual sobre este edital. Limitado a {maxQuestions} perguntas por edital.
        </p>
      </div>

      {questions.length > 0 && (
        <ul className="flex flex-col gap-3">
          {questions.map((entry) => (
            <li key={entry.id} className="flex flex-col gap-1 rounded-lg bg-muted p-2.5 text-sm">
              <p className="font-medium text-foreground">{entry.question}</p>
              <p className="whitespace-pre-wrap text-muted-foreground">{entry.answer}</p>
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
          <Button type="submit" size="sm" disabled={!canAsk || isAsking} className="w-fit">
            {isAsking ? 'Perguntando...' : 'Perguntar'}
          </Button>
          <span className="text-xs text-muted-foreground">
            {remaining} pergunta{remaining > 1 ? 's' : ''} restante{remaining > 1 ? 's' : ''}
          </span>
        </form>
      ) : (
        <p className="text-xs text-muted-foreground">Limite de perguntas sobre este edital foi atingido.</p>
      )}
    </section>
  )
}
