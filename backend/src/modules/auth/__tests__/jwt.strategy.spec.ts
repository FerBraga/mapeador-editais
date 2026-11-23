import { JwtStrategy } from '../jwt.strategy';

function buildConfigServiceMock(secret: string | undefined = 'test-secret') {
  return { get: jest.fn().mockReturnValue(secret) };
}

describe('JwtStrategy.validate', () => {
  it('maps a valid payload to { id, role }', () => {
    const strategy = new JwtStrategy(buildConfigServiceMock() as any);

    const result = strategy.validate({ sub: 'user-1', role: 'PROPONENTE' });

    expect(result).toEqual({ id: 'user-1', role: 'PROPONENTE' });
  });
});

/**
 * Signature/expiration validation itself is delegated to passport-jwt's
 * Strategy (via `ignoreExpiration: false` + `secretOrKey`), configured in the
 * constructor - not reimplemented here. passport-jwt verifies the token
 * asynchronously inside `authenticate()`, not at construction time, so
 * missing/expired/invalid-token rejection is covered at the guard/integration
 * level (manual validation in tasks.md 5.1/5.2) rather than re-testing the
 * passport-jwt library itself.
 */
