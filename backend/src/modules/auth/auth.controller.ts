import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ZodValidationPipe } from '../../shared/validators/zod-validation.pipe';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { LoginInput, LoginSchema, RegisterInput, RegisterSchema } from './auth.schemas';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthenticatedUser } from './jwt-payload.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Cadastra um novo proponente e retorna um token JWT' })
  register(@Body(new ZodValidationPipe(RegisterSchema)) body: RegisterInput) {
    return this.authService.register(body);
  }

  @Post('login')
  @ApiOperation({ summary: 'Autentica um proponente e retorna um token JWT' })
  login(@Body(new ZodValidationPipe(LoginSchema)) body: LoginInput) {
    return this.authService.login(body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Retorna os dados do proponente autenticado' })
  async me(@Req() request: Request) {
    const authenticatedUser = request.user as AuthenticatedUser;
    const user = await this.usersService.findById(authenticatedUser.id);
    if (!user) {
      return null;
    }
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }
}
