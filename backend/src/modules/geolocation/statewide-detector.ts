import { normalizeMunicipalityName } from './text-normalization';

/**
 * Curated list of normalized phrases that refer to the whole state of Paraná,
 * not a specific municipality. Checked BEFORE municipality matching: a bare
 * "Paraná" scores 0.58 trigram similarity against the real municipality "Alto
 * Paraná" (validated empirically), a dangerous false positive if not caught here.
 */
const STATEWIDE_PHRASES = new Set([
  'parana',
  'pr',
  'estado do parana',
  'estado do pr',
  'todo o parana',
  'todo o estado',
  'todo o estado do parana',
  'todo o territorio paranaense',
  'territorio paranaense',
  'ambito estadual',
  'nivel estadual',
  'todos os municipios do parana',
  'todos os municipios do estado',
]);

/**
 * Catches open-ended "remaining/other municipalities of the state" phrasings
 * (e.g. "Demais municípios do Estado do Paraná", found in a real edital
 * during validation) that a fixed phrase list can't enumerate exhaustively.
 */
const STATEWIDE_PATTERN =
  /\b(demais|outros|todos)\s+municipios\s+do\s+(estado|parana)\b/;

export function isStatewideMention(raw: string): boolean {
  const normalized = normalizeMunicipalityName(raw);
  return (
    STATEWIDE_PHRASES.has(normalized) || STATEWIDE_PATTERN.test(normalized)
  );
}
