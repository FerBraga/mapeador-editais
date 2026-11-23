import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProjectDraftSectionKey, ProjectDraftSectionState } from '@/types/api'

interface WizardStepperProps {
  sections: ProjectDraftSectionState[]
  activeSection: ProjectDraftSectionKey
  onSelect: (section: ProjectDraftSectionKey) => void
}

export function WizardStepper({ sections, activeSection, onSelect }: WizardStepperProps) {
  return (
    <ol className="flex items-start">
      {sections.map((section, index) => {
        const isActive = section.section === activeSection
        const isDone = Boolean(section.generatedText)
        const isLast = index === sections.length - 1

        return (
          <li key={section.section} className={cn('flex items-center', !isLast && 'flex-1')}>
            <button
              type="button"
              onClick={() => onSelect(section.section)}
              className="flex flex-col items-center gap-1.5 text-center"
            >
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors',
                  isActive && 'border-primary bg-primary text-primary-foreground',
                  !isActive && isDone && 'border-primary/60 bg-primary/10 text-primary',
                  !isActive && !isDone && 'border-border bg-background text-muted-foreground',
                )}
              >
                {isDone && !isActive ? <Check className="size-4" /> : index + 1}
              </span>
              <span
                className={cn(
                  'max-w-20 text-xs leading-tight',
                  isActive ? 'font-medium text-foreground' : 'text-muted-foreground',
                )}
              >
                {section.title}
              </span>
            </button>
            {!isLast && (
              <span className={cn('mx-1 mt-[-20px] h-0.5 flex-1', isDone ? 'bg-primary/50' : 'bg-border')} />
            )}
          </li>
        )
      })}
    </ol>
  )
}
