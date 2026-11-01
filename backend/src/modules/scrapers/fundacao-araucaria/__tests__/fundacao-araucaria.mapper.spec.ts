import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseOpenCalls } from '../fundacao-araucaria.mapper';

function fixture(name: string): string {
  return readFileSync(join(__dirname, '..', '__fixtures__', name), 'utf-8');
}

describe('parseOpenCalls', () => {
  const html = fixture('programas-abertos.html');
  const referenceDate = new Date(2026, 10, 1); // 2026-11-01, matches the fixture's expired/open examples

  it('excludes calls whose inscription deadline has already passed', () => {
    const result = parseOpenCalls(html, referenceDate);

    expect(result.some((call) => call.title === 'GMC Conicet')).toBe(false);
  });

  it('includes a call with a future single deadline ("até DD/MM/AAAA")', () => {
    const result = parseOpenCalls(html, referenceDate);

    const call = result.find((c) => c.externalId === 'cp-20-26');
    expect(call).toBeDefined();
    expect(call?.title).toBe('Top Managers Fase II');
    expect(call?.issuingOrganization).toBe('SECET');
    expect(call?.attachments).toHaveLength(2);
  });

  it('includes a call with "Fluxo Contínuo" (no deadline) by default', () => {
    const result = parseOpenCalls(html, referenceDate);

    const call = result.find((c) => c.externalId === 'cp-15-24');
    expect(call).toBeDefined();
    expect(call?.title).toBe('Permanência de Ucranianos');
  });

  it('derives a stable externalId from the call code', () => {
    const result = parseOpenCalls(html, referenceDate);

    const codes = result.map((c) => c.externalId);
    expect(codes).toEqual(expect.arrayContaining(['cp-20-26', 'cp-15-24']));
  });
});
