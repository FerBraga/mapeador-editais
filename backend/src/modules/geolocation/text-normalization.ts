const COMMON_PREFIXES = [
  /^municipio de\s+/,
  /^cidade de\s+/,
  /^cidade do\s+/,
  /^cidade da\s+/,
];

function stripDiacritics(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Normalizes a free-text place name the same way SQL-side matching does
 * (lower(unaccent(name))), plus stripping common filler prefixes, so JS-side
 * comparisons (statewide detection, exact-match lookups) line up with the DB.
 */
export function normalizeMunicipalityName(raw: string): string {
  let text = stripDiacritics(raw).toLowerCase().trim();
  for (const prefix of COMMON_PREFIXES) {
    text = text.replace(prefix, '');
  }
  return text.replace(/\s+/g, ' ').trim();
}
