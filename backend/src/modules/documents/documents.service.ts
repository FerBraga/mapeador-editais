import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DocumentExtractionStatus } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { StorageService } from '../../shared/storage/storage.service';
import { DOCUMENTS_QUEUE, DOWNLOAD_TIMEOUT_MS, MAX_DOWNLOAD_BYTES, PROCESS_DOCUMENT_JOB } from './documents.constants';
import { downloadDocument } from './document-downloader';
import { detectFileType } from './file-type-detector';
import { extractPdfText } from './pdf-text-extractor';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    @InjectQueue(DOCUMENTS_QUEUE) private readonly queue: Queue,
  ) {}

  async enqueueNewDocument(documentId: string): Promise<void> {
    await this.queue.add(PROCESS_DOCUMENT_JOB, { documentId });
  }

  async reprocess(documentId: string): Promise<{ jobId: string }> {
    const document = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!document) {
      throw new NotFoundException(`Document "${documentId}" not found`);
    }

    await this.prisma.document.update({
      where: { id: documentId },
      data: { extractionStatus: DocumentExtractionStatus.PENDING, errorMessage: null },
    });

    const job = await this.queue.add(PROCESS_DOCUMENT_JOB, { documentId });
    return { jobId: job.id as string };
  }

  async processDocument(documentId: string): Promise<void> {
    const document = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!document) {
      this.logger.warn(`Document "${documentId}" not found, skipping`);
      return;
    }
    if (document.extractionStatus === DocumentExtractionStatus.COMPLETED) {
      return;
    }
    if (!document.sourceUrl) {
      await this.markFailed(documentId, 'Document has no sourceUrl to download from');
      return;
    }

    await this.prisma.document.update({
      where: { id: documentId },
      data: { extractionStatus: DocumentExtractionStatus.PROCESSING },
    });

    try {
      const { buffer, checksum, contentType } = await downloadDocument(document.sourceUrl, {
        maxBytes: MAX_DOWNLOAD_BYTES,
        timeoutMs: DOWNLOAD_TIMEOUT_MS,
      });

      const fileType = detectFileType(buffer);
      if (fileType === 'unknown') {
        await this.markFailed(documentId, 'Unsupported file type (not a recognized PDF or DOCX signature)');
        return;
      }

      const storageKey = await this.storage.upload(
        `${documentId}/${document.originalFilename}`,
        buffer,
        contentType ?? 'application/octet-stream',
      );

      if (fileType === 'pdf') {
        const extraction = await extractPdfText(buffer);
        await this.prisma.document.update({
          where: { id: documentId },
          data: {
            storageKey,
            checksum,
            fileSize: buffer.length,
            mimeType: contentType,
            documentType: fileType,
            extractionStatus: DocumentExtractionStatus.COMPLETED,
            extractedText: extraction.text,
            pageCount: extraction.pageCount,
            needsOcr: extraction.needsOcr,
            errorMessage: null,
          },
        });
        return;
      }

      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          storageKey,
          checksum,
          fileSize: buffer.length,
          mimeType: contentType,
          documentType: fileType,
          extractionStatus: DocumentExtractionStatus.COMPLETED,
          extractedText: null,
          errorMessage: null,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to process document "${documentId}": ${message}`);
      await this.markFailed(documentId, message);
    }
  }

  private async markFailed(documentId: string, message: string) {
    await this.prisma.document.update({
      where: { id: documentId },
      data: { extractionStatus: DocumentExtractionStatus.FAILED, errorMessage: message },
    });
  }
}
