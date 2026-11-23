import { z } from 'zod';

/**
 * bcrypt silently truncates input beyond 72 bytes - cap password length so
 * validation errors surface instead of silent truncation.
 */
const PasswordSchema = z.string().min(8).max(72);

export const RegisterSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().email(),
  password: PasswordSchema,
});

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: PasswordSchema,
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
