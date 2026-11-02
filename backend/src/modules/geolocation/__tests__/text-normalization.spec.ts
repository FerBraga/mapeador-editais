import { normalizeMunicipalityName } from '../text-normalization';

describe('normalizeMunicipalityName', () => {
  it('lowercases and strips accents', () => {
    expect(normalizeMunicipalityName('São José dos Pinhais')).toBe(
      'sao jose dos pinhais',
    );
  });

  it('strips common filler prefixes', () => {
    expect(normalizeMunicipalityName('Município de Cascavel')).toBe('cascavel');
    expect(normalizeMunicipalityName('Cidade de Curitiba')).toBe('curitiba');
    expect(normalizeMunicipalityName('Cidade do Rio')).toBe('rio');
    expect(normalizeMunicipalityName('Cidade da Lapa')).toBe('lapa');
  });

  it('collapses extra whitespace', () => {
    expect(normalizeMunicipalityName('  Foz   do   Iguaçu  ')).toBe(
      'foz do iguacu',
    );
  });
});
