import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_HOST: z.string().min(1, 'REDIS_HOST is required'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  CORS_ORIGINS: z.string().min(1, 'CORS_ORIGINS is required'),
  STORAGE_LOCAL_DIR: z.string().default('uploads'),

  // AI-based structured extraction (ai-analysis module)
  AI_PROVIDER: z.enum(['gemini', 'openai']).default('gemini'),
  AI_MODEL: z.string().default('gemini-3.5-flash-lite'),
  AI_MAX_INPUT_CHARS: z.coerce.number().int().positive().default(24000),
  GOOGLE_AI_API_KEY: z.string().min(1).optional(),
  OPEN_AI_API_KEY: z.string().min(1).optional(),

  // Municipality name resolution (geolocation module)
  GEOLOCATION_MATCH_THRESHOLD: z.coerce.number().min(0).max(1).default(0.65),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  return result.data;
}
