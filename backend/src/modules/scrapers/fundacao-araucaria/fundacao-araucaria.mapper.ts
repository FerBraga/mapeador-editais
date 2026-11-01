import * as cheerio from 'cheerio';
import { RawOpportunityDetails } from '../contracts/raw-opportunity.types';

export const FUNDACAO_ARAUCARIA_LISTING_URL = 'https://www.fappr.pr.gov.br/Programas-Abertos';
const ATTACHMENT_EXTENSIONS = /\.(pdf|docx)$/i;

export function parseOpenCalls(html: string, referenceDate: Date): RawOpportunityDetails[] {
  const $ = cheerio.load(html);
  const results: RawOpportunityDetails[] = [];

  $('.row.two-col-right').each((_, row) => {
    const mainCol = $(row).find('.col-main').first();
    const sidebarCol = $(row).find('.col-sidebar').first();
    const h3 = mainCol.find('h3').first();
    if (h3.length === 0) return;

    const [code, title] = splitCodeAndTitle(h3.text());
    if (!code) return;

    if (isInscriptionExpired(sidebarCol.text(), referenceDate)) return;

    const attachments = mainCol
      .find('a')
      .filter((__, el) => ATTACHMENT_EXTENSIONS.test($(el).attr('href') ?? ''))
      .map((__, el) => ({
        url: $(el).attr('href') as string,
        label: $(el).text().trim(),
      }))
      .get();

    results.push({
      externalId: slugFromCode(code),
      title,
      officialUrl: FUNDACAO_ARAUCARIA_LISTING_URL,
      issuingOrganization: issuingOrganizationFromSidebar(sidebarCol.text()),
      description: mainCol.find('p').first().text().trim() || undefined,
      attachments,
    });
  });

  return results;
}

function splitCodeAndTitle(rawHeading: string): [string, string] {
  const heading = rawHeading.replace(/\s+/g, ' ').trim();
  const separatorIndex = heading.indexOf(':');
  if (separatorIndex === -1) return ['', heading];
  return [heading.slice(0, separatorIndex).trim(), heading.slice(separatorIndex + 1).trim()];
}

function slugFromCode(code: string): string {
  return code
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function issuingOrganizationFromSidebar(sidebarText: string): string | undefined {
  const match = sidebarText.match(/(?:Setor\s+)?Resp\.?:\s*([^\n]+?)(?:\s{2,}|N[°º]|Dota|Inscri|$)/i);
  return match ? match[1].trim() : undefined;
}

function isInscriptionExpired(sidebarText: string, referenceDate: Date): boolean {
  const inscriptionMatch = sidebarText.match(/Inscri[çc][õo]es?:?\s*([^]*?)(?=Resp\.|Dota|N[°º]|$)/i);
  const inscriptionText = inscriptionMatch ? inscriptionMatch[1] : sidebarText;

  const dateMatches = [...inscriptionText.matchAll(/(\d{2})\/(\d{2})\/(\d{2,4})/g)];
  if (dateMatches.length === 0) return false;

  const last = dateMatches[dateMatches.length - 1];
  const [, day, month, rawYear] = last;
  const year = rawYear.length === 2 ? Number(`20${rawYear}`) : Number(rawYear);
  const endDate = new Date(year, Number(month) - 1, Number(day), 23, 59, 59);

  return endDate.getTime() < referenceDate.getTime();
}
