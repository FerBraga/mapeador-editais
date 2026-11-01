import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DocumentsService } from '../documents.service';
import { downloadDocument, DownloadError } from '../document-downloader';

// Only the network call is mocked; DownloadError stays the real class so `instanceof Error` still holds.
jest.mock('../document-downloader', () => ({
  downloadDocument: jest.fn(),
  DownloadError: jest.requireActual('../document-downloader').DownloadError,
}));

function fixture(name: string): Buffer {
  return readFileSync(join(__dirname, '..', '__fixtures__', name));
}

function buildPrismaMock() {
  return {
    document: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
}

function buildStorageMock() {
  return { upload: jest.fn().mockResolvedValue('some/storage/key.pdf'), getBuffer: jest.fn() };
}

function buildQueueMock() {
  return { add: jest.fn().mockResolvedValue({ id: 'job-1' }) };
}

const BASE_DOCUMENT = {
  id: 'doc-1',
  sourceUrl: 'https://example.test/edital.pdf',
  originalFilename: 'edital.pdf',
  extractionStatus: 'PENDING',
};

describe('DocumentsService.processDocument', () => {
  const mockedDownload = downloadDocument as jest.Mock;

  beforeEach(() => {
    mockedDownload.mockReset();
  });

  it('extracts text and marks the document COMPLETED for a real PDF with text', async () => {
    const prisma = buildPrismaMock();
    prisma.document.findUnique.mockResolvedValue(BASE_DOCUMENT);
    mockedDownload.mockResolvedValue({
      buffer: fixture('sample-with-text.pdf'),
      checksum: 'abc123',
      contentType: 'application/pdf',
    });

    const service = new DocumentsService(prisma as any, buildStorageMock() as any, buildQueueMock() as any);
    await service.processDocument('doc-1');

    const finalUpdate = prisma.document.update.mock.calls.at(-1)[0];
    expect(finalUpdate.data.extractionStatus).toBe('COMPLETED');
    expect(finalUpdate.data.extractedText).toContain('Edital de teste');
    expect(finalUpdate.data.needsOcr).toBe(false);
    expect(finalUpdate.data.pageCount).toBe(1);
  });

  it('flags needsOcr without treating it as a failure for a PDF without extractable text', async () => {
    const prisma = buildPrismaMock();
    prisma.document.findUnique.mockResolvedValue(BASE_DOCUMENT);
    mockedDownload.mockResolvedValue({
      buffer: fixture('sample-without-text.pdf'),
      checksum: 'def456',
      contentType: 'application/pdf',
    });

    const service = new DocumentsService(prisma as any, buildStorageMock() as any, buildQueueMock() as any);
    await service.processDocument('doc-1');

    const finalUpdate = prisma.document.update.mock.calls.at(-1)[0];
    expect(finalUpdate.data.extractionStatus).toBe('COMPLETED');
    expect(finalUpdate.data.needsOcr).toBe(true);
  });

  it('stores a genuine DOCX without attempting text extraction', async () => {
    const prisma = buildPrismaMock();
    prisma.document.findUnique.mockResolvedValue(BASE_DOCUMENT);
    mockedDownload.mockResolvedValue({
      buffer: Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0]),
      checksum: 'ghi789',
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    const service = new DocumentsService(prisma as any, buildStorageMock() as any, buildQueueMock() as any);
    await service.processDocument('doc-1');

    const finalUpdate = prisma.document.update.mock.calls.at(-1)[0];
    expect(finalUpdate.data.extractionStatus).toBe('COMPLETED');
    expect(finalUpdate.data.extractedText).toBeNull();
    expect(finalUpdate.data.documentType).toBe('docx');
  });

  it('marks FAILED with a clear error message for an unsupported file type', async () => {
    const prisma = buildPrismaMock();
    prisma.document.findUnique.mockResolvedValue(BASE_DOCUMENT);
    mockedDownload.mockResolvedValue({
      buffer: Buffer.from([0x00, 0x01, 0x02, 0x03]),
      checksum: 'jkl012',
      contentType: null,
    });

    const service = new DocumentsService(prisma as any, buildStorageMock() as any, buildQueueMock() as any);
    await service.processDocument('doc-1');

    const finalUpdate = prisma.document.update.mock.calls.at(-1)[0];
    expect(finalUpdate.data.extractionStatus).toBe('FAILED');
    expect(finalUpdate.data.errorMessage).toContain('Unsupported file type');
  });

  it('marks FAILED when the download is blocked by the SSRF guard', async () => {
    const prisma = buildPrismaMock();
    prisma.document.findUnique.mockResolvedValue(BASE_DOCUMENT);
    mockedDownload.mockRejectedValue(new DownloadError('Refusing to fetch from private/reserved address'));

    const service = new DocumentsService(prisma as any, buildStorageMock() as any, buildQueueMock() as any);
    await service.processDocument('doc-1');

    const finalUpdate = prisma.document.update.mock.calls.at(-1)[0];
    expect(finalUpdate.data.extractionStatus).toBe('FAILED');
    expect(finalUpdate.data.errorMessage).toContain('private/reserved');
  });

  it('marks FAILED when the download exceeds the size limit', async () => {
    const prisma = buildPrismaMock();
    prisma.document.findUnique.mockResolvedValue(BASE_DOCUMENT);
    mockedDownload.mockRejectedValue(new DownloadError('Response exceeded the maximum allowed size of 26214400 bytes'));

    const service = new DocumentsService(prisma as any, buildStorageMock() as any, buildQueueMock() as any);
    await service.processDocument('doc-1');

    const finalUpdate = prisma.document.update.mock.calls.at(-1)[0];
    expect(finalUpdate.data.extractionStatus).toBe('FAILED');
    expect(finalUpdate.data.errorMessage).toContain('exceeded the maximum allowed size');
  });

  it('does not reprocess a document that is already COMPLETED', async () => {
    const prisma = buildPrismaMock();
    prisma.document.findUnique.mockResolvedValue({ ...BASE_DOCUMENT, extractionStatus: 'COMPLETED' });

    const service = new DocumentsService(prisma as any, buildStorageMock() as any, buildQueueMock() as any);
    await service.processDocument('doc-1');

    expect(mockedDownload).not.toHaveBeenCalled();
    expect(prisma.document.update).not.toHaveBeenCalled();
  });
});

describe('DocumentsService.reprocess', () => {
  it('resets the document to PENDING and enqueues a new job without duplicating it', async () => {
    const prisma = buildPrismaMock();
    prisma.document.findUnique.mockResolvedValue(BASE_DOCUMENT);
    const queue = buildQueueMock();

    const service = new DocumentsService(prisma as any, buildStorageMock() as any, queue as any);
    const result = await service.reprocess('doc-1');

    expect(prisma.document.update).toHaveBeenCalledWith({
      where: { id: 'doc-1' },
      data: { extractionStatus: 'PENDING', errorMessage: null },
    });
    expect(queue.add).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ jobId: 'job-1' });
  });
});
