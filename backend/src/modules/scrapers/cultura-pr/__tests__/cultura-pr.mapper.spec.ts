import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseOpenNoticesFromHome, parseOpportunityDetail } from '../cultura-pr.mapper';

function fixture(name: string): string {
  return readFileSync(join(__dirname, '..', '__fixtures__', name), 'utf-8');
}

describe('parseOpenNoticesFromHome', () => {
  it('extracts the open notices listed under "Editais Abertos"', () => {
    const html = fixture('home-with-open-editais-menu.html');

    const result = parseOpenNoticesFromHome(html);

    expect(result).toEqual([
      {
        externalId: 'Edital-MOVCEU-Parana',
        title: 'Edital MOVCEU Paraná',
        officialUrl: 'https://www.cultura.pr.gov.br/Pagina/Edital-MOVCEU-Parana',
      },
      {
        externalId: 'Edital-de-Pareceristas-0',
        title: 'Edital de Pareceristas',
        officialUrl: 'https://www.cultura.pr.gov.br/Pagina/Edital-de-Pareceristas-0',
      },
      {
        externalId: 'Mobilidade-Cultural-2a-edicao',
        title: 'Mobilidade Cultural - 2.ª edição',
        officialUrl: 'https://www.cultura.pr.gov.br/Pagina/Mobilidade-Cultural-2a-edicao',
      },
    ]);
  });

  it('returns an empty list when the "Editais Abertos" submenu is absent', () => {
    const html = fixture('home-without-open-editais-menu.html');

    const result = parseOpenNoticesFromHome(html);

    expect(result).toEqual([]);
  });
});

describe('parseOpportunityDetail', () => {
  it('extracts title, official URL, issuing organization and attachments', () => {
    const html = fixture('edital-movceu-parana.html');

    const result = parseOpportunityDetail(
      html,
      'Edital-MOVCEU-Parana',
      'https://www.cultura.pr.gov.br/Pagina/Edital-MOVCEU-Parana',
    );

    expect(result.title).toBe('Edital MOVCEU Paraná');
    expect(result.externalId).toBe('Edital-MOVCEU-Parana');
    expect(result.officialUrl).toBe('https://www.cultura.pr.gov.br/Pagina/Edital-MOVCEU-Parana');
    expect(result.issuingOrganization).toBe('Secretaria da Cultura');
    expect(result.attachments).toHaveLength(3);
    expect(result.attachments[0]).toEqual({
      url: 'https://www.cultura.pr.gov.br/sites/default/arquivos_restritos/files/documento/2026-09/0.edital_movceu_parana_-_2026.docx_0.pdf',
      label: 'EDITAL MOVCEU PARANÁ - CHAMAMENTO PÚBLICO Nº 015/2026',
    });
    // The non-PDF/DOCX "Edital acessível" link must not be treated as an attachment.
    expect(result.attachments.some((a) => a.url.includes('Edital-Acessivel'))).toBe(false);
  });

  it('throws when the page does not follow the expected notice layout', () => {
    const html = fixture('edital-unexpected-structure.html');

    expect(() => parseOpportunityDetail(html, 'unexpected', 'https://example.test/unexpected')).toThrow(
      /Unexpected page structure/,
    );
  });
});
