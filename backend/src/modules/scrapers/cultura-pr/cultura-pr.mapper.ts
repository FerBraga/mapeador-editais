import * as cheerio from 'cheerio';
import { RawOpportunity, RawOpportunityDetails } from '../contracts/raw-opportunity.types';

export const CULTURA_PR_BASE_URL = 'https://www.cultura.pr.gov.br';
const OPEN_NOTICES_MENU_LABEL = 'Editais Abertos';
const ATTACHMENT_EXTENSIONS = /\.(pdf|docx)$/i;

export function parseOpenNoticesFromHome(html: string): RawOpportunity[] {
  const $ = cheerio.load(html);

  const menuLink = $('a').filter(
    (_, el) => $(el).find('span').first().text().trim() === OPEN_NOTICES_MENU_LABEL,
  );
  if (menuLink.length === 0) {
    return [];
  }

  const items = menuLink.first().parent('li').find('> ul > li > a');
  const seen = new Map<string, RawOpportunity>();

  items.each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    const title = $(el).find('span').first().text().trim() || $(el).text().trim();
    const externalId = slugFromUrl(href);
    if (!externalId) return;

    if (!seen.has(externalId)) {
      seen.set(externalId, { externalId, title, officialUrl: href });
    }
  });

  return Array.from(seen.values());
}

export function parseOpportunityDetail(
  html: string,
  fallbackExternalId: string,
  fallbackOfficialUrl: string,
): RawOpportunityDetails {
  const $ = cheerio.load(html);

  const article = $('article#content').first();
  const titleEl = article.find('h1.page-title').first();
  if (article.length === 0 || titleEl.length === 0) {
    throw new Error(
      `Unexpected page structure for "${fallbackExternalId}": could not find article#content or h1.page-title`,
    );
  }

  const title = titleEl.text().trim();
  const canonicalPath = article.attr('about');
  const officialUrl = canonicalPath ? `${CULTURA_PR_BASE_URL}${canonicalPath}` : fallbackOfficialUrl;
  const externalId = canonicalPath ? slugFromUrl(officialUrl) ?? fallbackExternalId : fallbackExternalId;

  const issuingOrganization = issuingOrganizationFromTitleTag($('title').text());

  const attachments = article
    .find('a')
    .filter((_, el) => ATTACHMENT_EXTENSIONS.test($(el).attr('href') ?? ''))
    .map((_, el) => ({
      url: $(el).attr('href') as string,
      label: $(el).text().trim(),
    }))
    .get();

  return { externalId, title, officialUrl, issuingOrganization, attachments };
}

// Preserves the original case: paths on this site are case-sensitive and the result is refetched verbatim.
export function slugFromUrl(url: string): string | null {
  try {
    const { pathname } = new URL(url, CULTURA_PR_BASE_URL);
    const segment = pathname.split('/').filter(Boolean).pop();
    if (!segment) return null;
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}

function issuingOrganizationFromTitleTag(titleTag: string): string | undefined {
  const parts = titleTag.split('|').map((part) => part.trim());
  return parts.length > 1 ? parts[parts.length - 1] : undefined;
}
