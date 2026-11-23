import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  askProjectDraftQuestion,
  fetchProjectDraft,
  regenerateProjectDraftSection,
  shouldRetryQuery,
  submitProjectDraftSection,
} from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import type { ProjectDraftSectionKey } from '@/types/api'

export function useProjectDraft(opportunityId: string | undefined) {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['project-draft', opportunityId],
    queryFn: () => fetchProjectDraft(opportunityId as string, token as string),
    enabled: Boolean(opportunityId && token),
    retry: shouldRetryQuery,
  })
}

export function useSubmitProjectDraftSection(opportunityId: string) {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ section, answers }: { section: ProjectDraftSectionKey; answers: Record<string, string> }) =>
      submitProjectDraftSection(opportunityId, section, answers, token as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-draft', opportunityId] })
    },
  })
}

export function useRegenerateProjectDraftSection(opportunityId: string) {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (section: ProjectDraftSectionKey) =>
      regenerateProjectDraftSection(opportunityId, section, token as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-draft', opportunityId] })
    },
  })
}

export function useAskProjectDraftQuestion(opportunityId: string) {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (question: string) => askProjectDraftQuestion(opportunityId, question, token as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-draft', opportunityId] })
    },
  })
}
