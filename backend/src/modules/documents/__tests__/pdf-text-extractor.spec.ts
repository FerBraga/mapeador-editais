import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { extractPdfText } from '../pdf-text-extractor';

function fixture(name: string): Buffer {
  return readFileSync(join(__dirname, '..', '__fixtures__', name));
}

describe('extractPdfText', () => {
  it('extracts text and page count from a PDF with real text', async () => {
    const result = await extractPdfText(fixture('sample-with-text.pdf'));

    expect(result.text).toContain('Edital de teste');
    expect(result.pageCount).toBe(1);
    expect(result.needsOcr).toBe(false);
  });

  it('flags needsOcr for a PDF without extractable text', async () => {
    const result = await extractPdfText(fixture('sample-without-text.pdf'));

    expect(result.needsOcr).toBe(true);
  });
});
