import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterInput, LoginInput } from './auth.schemas';
import { JwtPayload } from './jwt-payload.interface';

const BCRYPT_SALT_ROUNDS = 10;

export interface AuthResult {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await this.usersService.findByEmail(input.email);
    if (existing) {
      throw new ConflictException('E-mail já está em uso');
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);
    const user = await this.usersService.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    return this.buildAuthResult(user.id, user.name, user.email, user.role);
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.usersService.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return this.buildAuthResult(user.id, user.name, user.email, user.role);
  }

  private buildAuthResult(
    id: string,
    name: string,
    email: string,
    role: string,
  ): AuthResult {
    const payload: JwtPayload = { sub: id, role: role as JwtPayload['role'] };
    return {
      accessToken: this.jwtService.sign(payload),
      user: { id, name, email, role },
    };
  }
}
