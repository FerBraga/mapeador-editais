import { PDFParse } from 'pdf-parse';

const MIN_TEXT_LENGTH_FOR_EXTRACTABLE = 20;

export type PdfExtractionResult = {
  text: string;
  pageCount: number;
  needsOcr: boolean;
};

export async function extractPdfText(buffer: Buffer): Promise<PdfExtractionResult> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const text = result.text.trim();
    return {
      text,
      pageCount: result.total,
      needsOcr: text.length < MIN_TEXT_LENGTH_FOR_EXTRACTABLE,
    };
  } finally {
    await parser.destroy();
  }
}
