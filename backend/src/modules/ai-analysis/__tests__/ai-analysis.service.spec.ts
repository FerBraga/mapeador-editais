import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AiAnalysisService } from '../ai-analysis.service';
import { PROMPT_VERSION } from '../prompt';

function buildTx() {
  return {
    aIAnalysis: { create: jest.fn() },
    requiredDocument: { create: jest.fn() },
    opportunity: { findUnique: jest.fn(), update: jest.fn() },
  };
}

function buildPrismaMock() {
  const tx = buildTx();
  return {
    document: { findUnique: jest.fn() },
    aIAnalysis: { create: jest.fn() },
    $transaction: jest.fn(
      async (callback: (tx: ReturnType<typeof buildTx>) => Promise<void>) =>
        callback(tx),
    ),
    tx,
  };
}

function buildConfigMock(overrides: Record<string, unknown> = {}) {
  const values: Record<string, unknown> = {
    AI_MAX_INPUT_CHARS: 24000,
    AI_MODEL: 'gemini-3.5-flash-lite',
    ...overrides,
  };
  return { get: jest.fn((key: string) => values[key]) };
}

function buildQueueMock() {
  return { add: jest.fn().mockResolvedValue({ id: 'job-1' }) };
}

function buildGeolocationMock() {
  return {
    enqueueResolution: jest.fn().mockResolvedValue({ jobId: 'geo-job-1' }),
  };
}

const BASE_DOCUMENT = {
  id: 'doc-1',
  opportunityId: 'opp-1',
  extractedText: 'Texto do edital com informações relevantes.',
};

const VALID_RAW_EXTRACTION = {
  titulo: 'Edital Teste',
  orgaoResponsavel: 'Órgão X',
  objeto: 'Objeto do edital',
  resumo: 'Resumo do edital',
  publicoAlvo: 'Público-alvo',
  municipiosContemplados: ['Curitiba'],
  valorMinimo: null,
  valorMaximo: 100000,
  dataInicioInscricao: '2026-01-01',
  dataFimInscricao: '2026-02-01',
  criteriosElegibilidade: ['Critério 1'],
  restricoes: [],
  etapasInscricao: ['Etapa 1'],
  documentosExigidos: [
    {
      nome: 'Certidão X',
      categoria: 'TAX',
      obrigatorio: true,
      evidencia: 'trecho original',
      paginaAproximada: 3,
    },
  ],
  ambiguidadesDetectadas: [],
};

describe('AiAnalysisService.analyzeDocument', () => {
  it('persists a completed analysis, required documents, and fills empty opportunity fields', async () => {
    const prisma = buildPrismaMock();
    prisma.document.findUnique.mockResolvedValue(BASE_DOCUMENT);
    prisma.tx.opportunity.findUnique.mockResolvedValue({
      id: 'opp-1',
      description: null,
      object: null,
      fundingMin: null,
      fundingMax: null,
      registrationStartAt: null,
      registrationEndAt: null,
    });

    const provider = {
      extract: jest.fn().mockResolvedValue({
        raw: VALID_RAW_EXTRACTION,
        tokensInput: 100,
        tokensOutput: 50,
        model: 'gemini-3.5-flash-lite',
      }),
    };

    const geolocation = buildGeolocationMock();
    const service = new AiAnalysisService(
      prisma as any,
      buildConfigMock() as any,
      buildQueueMock() as any,
      provider as any,
      geolocation as any,
    );
    await service.analyzeDocument('doc-1');

    expect(prisma.tx.aIAnalysis.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        opportunityId: 'opp-1',
        documentId: 'doc-1',
        model: 'gemini-3.5-flash-lite',
        promptVersion: PROMPT_VERSION,
        status: 'COMPLETED',
        tokensInput: 100,
        tokensOutput: 50,
      }),
    });
    expect(geolocation.enqueueResolution).toHaveBeenCalledWith('opp-1');
    expect(prisma.tx.requiredDocument.create).toHaveBeenCalledTimes(1);
    expect(prisma.tx.requiredDocument.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        opportunityId: 'opp-1',
        name: 'Certidão X',
        documentCategory: 'TAX',
        isMandatory: true,
        evidence: 'trecho original',
        sourceDocumentId: 'doc-1',
        sourcePage: 3,
      }),
    });
    expect(prisma.tx.opportunity.update).toHaveBeenCalledWith({
      where: { id: 'opp-1' },
      data: expect.objectContaining({
        description: 'Resumo do edital',
        object: 'Objeto do edital',
        fundingMax: 100000,
      }),
    });
  });

  it('never overwrites opportunity fields that are already filled', async () => {
    const prisma = buildPrismaMock();
    prisma.document.findUnique.mockResolvedValue(BASE_DOCUMENT);
    prisma.tx.opportunity.findUnique.mockResolvedValue({
      id: 'opp-1',
      description: 'Descrição oficial já existente',
      object: 'Objeto oficial já existente',
      fundingMin: 5000,
      fundingMax: 50000,
      registrationStartAt: new Date('2025-01-01'),
      registrationEndAt: new Date('2025-02-01'),
    });

    const provider = {
      extract: jest.fn().mockResolvedValue({
        raw: VALID_RAW_EXTRACTION,
        tokensInput: 100,
        tokensOutput: 50,
        model: 'gemini-3.5-flash-lite',
      }),
    };

    const service = new AiAnalysisService(
      prisma as any,
      buildConfigMock() as any,
      buildQueueMock() as any,
      provider as any,
      buildGeolocationMock() as any,
    );
    await service.analyzeDocument('doc-1');

    expect(prisma.tx.opportunity.update).not.toHaveBeenCalled();
  });

  it('marks the analysis FAILED without creating required documents when the response fails schema validation', async () => {
    const prisma = buildPrismaMock();
    prisma.document.findUnique.mockResolvedValue(BASE_DOCUMENT);

    const invalidRaw = {
      ...VALID_RAW_EXTRACTION,
      documentosExigidos: [{ categoria: 'TAX' }],
    };
    const provider = {
      extract: jest.fn().mockResolvedValue({
        raw: invalidRaw,
        tokensInput: 10,
        tokensOutput: 5,
        model: 'gemini-3.5-flash-lite',
      }),
    };

    const geolocation = buildGeolocationMock();
    const service = new AiAnalysisService(
      prisma as any,
      buildConfigMock() as any,
      buildQueueMock() as any,
      provider as any,
      geolocation as any,
    );
    await service.analyzeDocument('doc-1');

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.aIAnalysis.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: 'FAILED',
        opportunityId: 'opp-1',
        documentId: 'doc-1',
      }),
    });
    expect(
      prisma.aIAnalysis.create.mock.calls[0][0].data.errorMessage,
    ).toContain('não segue o schema esperado');
    expect(geolocation.enqueueResolution).not.toHaveBeenCalled();
  });

  it('marks the analysis FAILED when the provider call throws', async () => {
    const prisma = buildPrismaMock();
    prisma.document.findUnique.mockResolvedValue(BASE_DOCUMENT);

    const provider = {
      extract: jest
        .fn()
        .mockRejectedValue(new Error('Gemini API returned HTTP 429')),
    };

    const geolocation = buildGeolocationMock();
    const service = new AiAnalysisService(
      prisma as any,
      buildConfigMock() as any,
      buildQueueMock() as any,
      provider as any,
      geolocation as any,
    );
    await service.analyzeDocument('doc-1');

    expect(geolocation.enqueueResolution).not.toHaveBeenCalled();
    expect(prisma.aIAnalysis.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: 'FAILED',
        errorMessage: 'Gemini API returned HTTP 429',
      }),
    });
  });

  it('skips analysis entirely when the document has no extracted text', async () => {
    const prisma = buildPrismaMock();
    prisma.document.findUnique.mockResolvedValue({
      ...BASE_DOCUMENT,
      extractedText: null,
    });

    const provider = { extract: jest.fn() };
    const service = new AiAnalysisService(
      prisma as any,
      buildConfigMock() as any,
      buildQueueMock() as any,
      provider as any,
      buildGeolocationMock() as any,
    );
    await service.analyzeDocument('doc-1');

    expect(provider.extract).not.toHaveBeenCalled();
    expect(prisma.aIAnalysis.create).not.toHaveBeenCalled();
  });
});

describe('AiAnalysisService.enqueueAnalysis', () => {
  it('throws NotFoundException when the document does not exist', async () => {
    const prisma = buildPrismaMock();
    prisma.document.findUnique.mockResolvedValue(null);

    const service = new AiAnalysisService(
      prisma as any,
      buildConfigMock() as any,
      buildQueueMock() as any,
      {} as any,
      buildGeolocationMock() as any,
    );
    await expect(service.enqueueAnalysis('missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws BadRequestException when the document has no extracted text', async () => {
    const prisma = buildPrismaMock();
    prisma.document.findUnique.mockResolvedValue({
      ...BASE_DOCUMENT,
      extractedText: null,
    });

    const service = new AiAnalysisService(
      prisma as any,
      buildConfigMock() as any,
      buildQueueMock() as any,
      {} as any,
      buildGeolocationMock() as any,
    );
    await expect(service.enqueueAnalysis('doc-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('enqueues a job and returns its id when the document has extracted text', async () => {
    const prisma = buildPrismaMock();
    prisma.document.findUnique.mockResolvedValue(BASE_DOCUMENT);
    const queue = buildQueueMock();

    const service = new AiAnalysisService(
      prisma as any,
      buildConfigMock() as any,
      queue as any,
      {} as any,
      buildGeolocationMock() as any,
    );
    const result = await service.enqueueAnalysis('doc-1');

    expect(queue.add).toHaveBeenCalledWith('analyze-document', {
      documentId: 'doc-1',
    });
    expect(result).toEqual({ jobId: 'job-1' });
  });
});
