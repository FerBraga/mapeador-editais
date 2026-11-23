import { BadRequestException } from '@nestjs/common';
import { ProjectDraftsService } from '../project-drafts.service';

const COMPLETED_ANALYSIS = {
  id: 'analysis-1',
  structuredResult: { titulo: 'Edital Teste', objeto: 'Fomento cultural' },
};

const DRAFT = { id: 'draft-1', userId: 'user-1', opportunityId: 'opp-1' };

function buildPrismaMock(overrides: Record<string, unknown> = {}) {
  return {
    aIAnalysis: {
      findFirst: jest.fn().mockResolvedValue(COMPLETED_ANALYSIS),
    },
    projectDraft: {
      upsert: jest.fn().mockResolvedValue(DRAFT),
    },
    projectDraftSectionEntry: {
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      upsert: jest.fn().mockImplementation(({ create }) => Promise.resolve({ id: 'section-1', regenerationCount: 0, ...create })),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'section-1', ...data })),
    },
    projectDraftQuestion: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'question-1', createdAt: new Date(), ...data })),
      findMany: jest.fn().mockResolvedValue([]),
    },
    ...overrides,
  };
}

function buildConfigServiceMock(overrides: Record<string, unknown> = {}) {
  const defaults: Record<string, unknown> = {
    WIZARD_MAX_SECTION_REGENERATIONS: 2,
    WIZARD_MAX_QUESTIONS_PER_OPPORTUNITY: 3,
    ...overrides,
  };
  return { get: jest.fn((key: string) => defaults[key]) };
}

function buildAiProviderMock(text = 'Texto gerado pela IA') {
  return { generateText: jest.fn().mockResolvedValue({ text, tokensInput: 10, tokensOutput: 20, model: 'test-model' }) };
}

describe('ProjectDraftsService.getDraftState', () => {
  it('throws when the opportunity has no COMPLETED AIAnalysis', async () => {
    const prisma = buildPrismaMock({ aIAnalysis: { findFirst: jest.fn().mockResolvedValue(null) } });
    const service = new ProjectDraftsService(prisma as any, buildConfigServiceMock() as any, buildAiProviderMock() as any);

    await expect(service.getDraftState('user-1', 'opp-1')).rejects.toThrow(BadRequestException);
    expect(prisma.projectDraft.upsert).not.toHaveBeenCalled();
  });

  it('creates/recovers the draft and returns the 4 fixed sections, even unanswered', async () => {
    const prisma = buildPrismaMock();
    const service = new ProjectDraftsService(prisma as any, buildConfigServiceMock() as any, buildAiProviderMock() as any);

    const state = await service.getDraftState('user-1', 'opp-1');

    expect(prisma.projectDraft.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId_opportunityId: { userId: 'user-1', opportunityId: 'opp-1' } } }),
    );
    expect(state.sections).toHaveLength(4);
    expect(state.sections.map((s) => s.section)).toEqual([
      'JUSTIFICATIVA',
      'OBJETIVOS',
      'CONTRAPARTIDAS',
      'ORCAMENTO',
    ]);
    expect(state.sections[0].answers).toBeNull();
    expect(state.maxQuestions).toBe(3);
  });
});

describe('ProjectDraftsService.submitSection', () => {
  const ANSWERS = { problema: 'x', importancia: 'y', experiencia: 'z' };

  it('generates and persists text for a first-time submission', async () => {
    const prisma = buildPrismaMock();
    const aiProvider = buildAiProviderMock('Justificativa gerada');
    const service = new ProjectDraftsService(prisma as any, buildConfigServiceMock() as any, aiProvider as any);

    const result = await service.submitSection('user-1', 'opp-1', 'JUSTIFICATIVA', ANSWERS);

    expect(aiProvider.generateText).toHaveBeenCalledTimes(1);
    expect(result.generatedText).toBe('Justificativa gerada');
    expect(prisma.projectDraftSectionEntry.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ draftId: 'draft-1', section: 'JUSTIFICATIVA', answers: ANSWERS }),
      }),
    );
  });

  it('rejects resubmission once the regeneration limit is reached, without calling the AI', async () => {
    const prisma = buildPrismaMock({
      projectDraftSectionEntry: {
        findUnique: jest.fn().mockResolvedValue({ id: 'section-1', answers: ANSWERS, regenerationCount: 2 }),
        upsert: jest.fn(),
      },
    });
    const aiProvider = buildAiProviderMock();
    const service = new ProjectDraftsService(
      prisma as any,
      buildConfigServiceMock({ WIZARD_MAX_SECTION_REGENERATIONS: 2 }) as any,
      aiProvider as any,
    );

    await expect(service.submitSection('user-1', 'opp-1', 'JUSTIFICATIVA', ANSWERS)).rejects.toThrow(
      BadRequestException,
    );
    expect(aiProvider.generateText).not.toHaveBeenCalled();
  });
});

describe('ProjectDraftsService.regenerateSection', () => {
  it('rejects regenerating a section that was never answered', async () => {
    const prisma = buildPrismaMock();
    const aiProvider = buildAiProviderMock();
    const service = new ProjectDraftsService(prisma as any, buildConfigServiceMock() as any, aiProvider as any);

    await expect(service.regenerateSection('user-1', 'opp-1', 'JUSTIFICATIVA')).rejects.toThrow(BadRequestException);
    expect(aiProvider.generateText).not.toHaveBeenCalled();
  });

  it('regenerates using the stored answers and increments the counter', async () => {
    const storedAnswers = { problema: 'x', importancia: 'y', experiencia: 'z' };
    const prisma = buildPrismaMock({
      projectDraftSectionEntry: {
        findUnique: jest.fn().mockResolvedValue({ id: 'section-1', answers: storedAnswers, regenerationCount: 0 }),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'section-1', ...data })),
      },
    });
    const aiProvider = buildAiProviderMock('Nova versão');
    const service = new ProjectDraftsService(prisma as any, buildConfigServiceMock() as any, aiProvider as any);

    const result = await service.regenerateSection('user-1', 'opp-1', 'JUSTIFICATIVA');

    expect(result.generatedText).toBe('Nova versão');
    expect(result.regenerationCount).toBe(1);
  });
});

describe('AI failures do not consume limits', () => {
  const ANSWERS = { problema: 'x', importancia: 'y', experiencia: 'z' };

  it('submitSection: does not persist/increment when the AI call fails', async () => {
    const prisma = buildPrismaMock();
    const aiProvider = { generateText: jest.fn().mockRejectedValue(new Error('Gemini API returned HTTP 429')) };
    const service = new ProjectDraftsService(prisma as any, buildConfigServiceMock() as any, aiProvider as any);

    await expect(service.submitSection('user-1', 'opp-1', 'JUSTIFICATIVA', ANSWERS)).rejects.toThrow('HTTP 429');
    expect(prisma.projectDraftSectionEntry.upsert).not.toHaveBeenCalled();
  });

  it('regenerateSection: does not increment the counter when the AI call fails', async () => {
    const prisma = buildPrismaMock({
      projectDraftSectionEntry: {
        findUnique: jest.fn().mockResolvedValue({ id: 'section-1', answers: ANSWERS, regenerationCount: 0 }),
        update: jest.fn(),
      },
    });
    const aiProvider = { generateText: jest.fn().mockRejectedValue(new Error('Gemini API returned HTTP 429')) };
    const service = new ProjectDraftsService(prisma as any, buildConfigServiceMock() as any, aiProvider as any);

    await expect(service.regenerateSection('user-1', 'opp-1', 'JUSTIFICATIVA')).rejects.toThrow('HTTP 429');
    expect(prisma.projectDraftSectionEntry.update).not.toHaveBeenCalled();
  });

  it('askQuestion: does not persist the question when the AI call fails', async () => {
    const prisma = buildPrismaMock();
    const aiProvider = { generateText: jest.fn().mockRejectedValue(new Error('Gemini API returned HTTP 429')) };
    const service = new ProjectDraftsService(prisma as any, buildConfigServiceMock() as any, aiProvider as any);

    await expect(service.askQuestion('user-1', 'opp-1', 'Pergunta?')).rejects.toThrow('HTTP 429');
    expect(prisma.projectDraftQuestion.create).not.toHaveBeenCalled();
  });
});

describe('ProjectDraftsService.askQuestion', () => {
  it('answers and persists the question when under the limit', async () => {
    const prisma = buildPrismaMock();
    const aiProvider = buildAiProviderMock('Resposta da IA');
    const service = new ProjectDraftsService(prisma as any, buildConfigServiceMock() as any, aiProvider as any);

    const result = await service.askQuestion('user-1', 'opp-1', 'Posso me inscrever sendo MEI?');

    expect(result.answer).toBe('Resposta da IA');
    expect(prisma.projectDraftQuestion.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ draftId: 'draft-1', question: 'Posso me inscrever sendo MEI?' }) }),
    );
  });

  it('rejects a new question once the limit is reached, without calling the AI', async () => {
    const prisma = buildPrismaMock({ projectDraftQuestion: { count: jest.fn().mockResolvedValue(3), create: jest.fn() } });
    const aiProvider = buildAiProviderMock();
    const service = new ProjectDraftsService(
      prisma as any,
      buildConfigServiceMock({ WIZARD_MAX_QUESTIONS_PER_OPPORTUNITY: 3 }) as any,
      aiProvider as any,
    );

    await expect(service.askQuestion('user-1', 'opp-1', 'Mais uma pergunta?')).rejects.toThrow(BadRequestException);
    expect(aiProvider.generateText).not.toHaveBeenCalled();
  });
});
