import { isStatewideMention } from '../statewide-detector';

describe('isStatewideMention', () => {
  it('recognizes bare and qualified state references', () => {
    expect(isStatewideMention('Paraná')).toBe(true);
    expect(isStatewideMention('Estado do Paraná')).toBe(true);
    expect(isStatewideMention('todo o território paranaense')).toBe(true);
    expect(isStatewideMention('PR')).toBe(true);
  });

  it('recognizes "demais/outros municípios do estado" phrasing (found in a real edital)', () => {
    expect(isStatewideMention('Demais municípios do Estado do Paraná')).toBe(
      true,
    );
    expect(isStatewideMention('outros municípios do Paraná')).toBe(true);
  });

  it('does not treat a real municipality name as statewide', () => {
    expect(isStatewideMention('Alto Paraná')).toBe(false);
    expect(isStatewideMention('Curitiba')).toBe(false);
  });

  it('does not treat a named micro-region as statewide', () => {
    expect(isStatewideMention('Região Metropolitana de Curitiba')).toBe(false);
  });
});
