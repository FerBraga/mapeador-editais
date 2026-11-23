import { z } from 'zod';
import { ProjectDraftSectionKey } from '@prisma/client';
import {
  ANSWER_MAX_LENGTH,
  QUESTION_MAX_LENGTH,
  SECTION_DEFINITIONS,
  getSectionDefinition,
} from './project-drafts.constants';

const SECTION_KEYS = SECTION_DEFINITIONS.map((s) => s.section) as [
  ProjectDraftSectionKey,
  ...ProjectDraftSectionKey[],
];

export const SectionParamSchema = z.object({
  section: z.enum(SECTION_KEYS),
});

/**
 * Builds a per-section Zod schema requiring exactly the fixed question keys
 * for that section, each a short, length-capped answer - the wizard's
 * closed-form inputs, not an open text field.
 */
export function buildAnswersSchema(section: ProjectDraftSectionKey) {
  const definition = getSectionDefinition(section);
  const shape: Record<string, z.ZodString> = {};
  for (const question of definition.questions) {
    shape[question.key] = z.string().trim().min(1).max(ANSWER_MAX_LENGTH);
  }
  return z.object({ answers: z.object(shape).strict() });
}

export type SubmitSectionInput = Record<string, string>;

export const AskQuestionSchema = z.object({
  question: z.string().trim().min(3).max(QUESTION_MAX_LENGTH),
});

export type AskQuestionInput = z.infer<typeof AskQuestionSchema>;
