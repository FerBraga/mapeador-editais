import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

function buildUsersServiceMock() {
  return {
    findByEmail: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  };
}

function buildJwtServiceMock() {
  return {
    sign: jest.fn().mockReturnValue('signed.jwt.token'),
  };
}

const REGISTER_INPUT = {
  name: 'Maria Produtora',
  email: 'maria@example.com',
  password: 'senha-forte-123',
};

describe('AuthService.register', () => {
  it('creates a user with a hashed password and returns a signed token', async () => {
    const usersService = buildUsersServiceMock();
    const jwtService = buildJwtServiceMock();
    usersService.findByEmail.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    usersService.create.mockResolvedValue({
      id: 'user-1',
      name: REGISTER_INPUT.name,
      email: REGISTER_INPUT.email,
      role: 'PROPONENTE',
    });
    const service = new AuthService(usersService as any, jwtService as any);

    const result = await service.register(REGISTER_INPUT);

    expect(usersService.create).toHaveBeenCalledWith({
      name: REGISTER_INPUT.name,
      email: REGISTER_INPUT.email,
      passwordHash: 'hashed-password',
    });
    expect(jwtService.sign).toHaveBeenCalledWith({ sub: 'user-1', role: 'PROPONENTE' });
    expect(result).toEqual({
      accessToken: 'signed.jwt.token',
      user: { id: 'user-1', name: REGISTER_INPUT.name, email: REGISTER_INPUT.email, role: 'PROPONENTE' },
    });
  });

  it('rejects registration when the email is already in use', async () => {
    const usersService = buildUsersServiceMock();
    const jwtService = buildJwtServiceMock();
    usersService.findByEmail.mockResolvedValue({ id: 'existing-user' });
    const service = new AuthService(usersService as any, jwtService as any);

    await expect(service.register(REGISTER_INPUT)).rejects.toThrow(ConflictException);
    expect(usersService.create).not.toHaveBeenCalled();
  });
});

describe('AuthService.login', () => {
  const LOGIN_INPUT = { email: 'maria@example.com', password: 'senha-forte-123' };
  const EXISTING_USER = {
    id: 'user-1',
    name: 'Maria Produtora',
    email: LOGIN_INPUT.email,
    passwordHash: 'hashed-password',
    role: 'PROPONENTE',
  };

  it('returns a signed token when credentials are correct', async () => {
    const usersService = buildUsersServiceMock();
    const jwtService = buildJwtServiceMock();
    usersService.findByEmail.mockResolvedValue(EXISTING_USER);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    const service = new AuthService(usersService as any, jwtService as any);

    const result = await service.login(LOGIN_INPUT);

    expect(bcrypt.compare).toHaveBeenCalledWith(LOGIN_INPUT.password, EXISTING_USER.passwordHash);
    expect(result.accessToken).toBe('signed.jwt.token');
    expect(result.user.id).toBe('user-1');
  });

  it('rejects login when the email does not exist', async () => {
    const usersService = buildUsersServiceMock();
    const jwtService = buildJwtServiceMock();
    usersService.findByEmail.mockResolvedValue(null);
    const service = new AuthService(usersService as any, jwtService as any);

    await expect(service.login(LOGIN_INPUT)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects login when the password does not match, without revealing which part failed', async () => {
    const usersService = buildUsersServiceMock();
    const jwtService = buildJwtServiceMock();
    usersService.findByEmail.mockResolvedValue(EXISTING_USER);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    const service = new AuthService(usersService as any, jwtService as any);

    await expect(service.login(LOGIN_INPUT)).rejects.toThrow(UnauthorizedException);
  });
});
