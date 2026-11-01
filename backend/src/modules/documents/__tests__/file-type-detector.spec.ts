import { detectFileType } from '../file-type-detector';

describe('detectFileType', () => {
  it('detects a PDF by its magic bytes', () => {
    const buffer = Buffer.from('%PDF-1.4\n...rest of file', 'latin1');
    expect(detectFileType(buffer)).toBe('pdf');
  });

  it('detects a DOCX/ZIP-based file by its magic bytes', () => {
    const buffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);
    expect(detectFileType(buffer)).toBe('docx');
  });

  it('returns unknown for an unrecognized signature', () => {
    const buffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);
    expect(detectFileType(buffer)).toBe('unknown');
  });

  it('ignores a misleading file extension and relies only on the real bytes', () => {
    // Simulates "anexo.docx_0.pdf" where the URL extension lies about the real content.
    const buffer = Buffer.from('%PDF-1.4\n', 'latin1');
    expect(detectFileType(buffer)).toBe('pdf');
  });
});
