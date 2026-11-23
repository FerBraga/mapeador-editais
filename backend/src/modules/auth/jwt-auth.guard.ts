import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Validates the JWT sent as `Authorization: Bearer <token>` (via JwtStrategy)
 * and populates `request.user` with { id, role }. Reused by any route that
 * requires an authenticated proponent (e.g. the writing wizard endpoints).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
