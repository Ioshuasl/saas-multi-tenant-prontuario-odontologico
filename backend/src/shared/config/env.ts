import { config } from 'dotenv';
import { resolve } from 'node:path';
import { z } from 'zod';

config({ path: resolve(process.cwd(), '../.env') });
config({ path: resolve(process.cwd(), '.env') });

/** Decodifica chave PEM de env (Base64 ou PEM literal com \\n). */
export function decodePemKey(value: string): string {
  if (value.includes('BEGIN')) {
    return value.replace(/\\n/g, '\n');
  }
  return Buffer.from(value, 'base64').toString('utf8');
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3333),
  WORKER_HEALTH_PORT: z.coerce.number().default(3334),
  DATABASE_URL: z.string().min(1),
  DATABASE_MIGRATION_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_PRIVATE_KEY: z.string().min(1),
  JWT_PUBLIC_KEY: z.string().min(1),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(30),
  STORAGE_ENDPOINT: z.string().url(),
  STORAGE_BUCKET: z.string().min(1),
  STORAGE_REGION: z.string().default('sa-east-1'),
  STORAGE_ACCESS_KEY: z.string().min(1),
  STORAGE_SECRET_KEY: z.string().min(1),
  ATTACHMENT_QUOTA_BYTES: z.coerce.number().int().positive().default(1_073_741_824),
  WHATSAPP_APP_SECRET: z.string().min(1),
  WHATSAPP_VERIFY_TOKEN: z.string().min(1),
  MESSAGING_PROVIDER: z.enum(['waha', 'cloud', 'fake']).optional(),
  WAHA_BASE_URL: z.string().url().default('https://waha.ioshuavps.com.br'),
  WAHA_API_KEY: z.string().min(1).optional(),
  WAHA_HMAC_KEY: z.string().min(1).optional(),
  WAHA_WEBHOOK_URL: z.string().url().optional(),
  WAHA_ENGINE: z.enum(['WEBJS', 'GOWS', 'NOWEB']).default('WEBJS'),
  WAHA_SESSION_NAME: z.string().min(1).optional(),
  MAIL_DSN: z.string().min(1),
  MAIL_FROM: z.string().min(1).default('noreply@localhost'),
  RESEND_API_KEY: z.string().optional(),
  APP_PUBLIC_URL: z.string().url(),
  CORS_ORIGINS: z.string().min(1),
  SENTRY_DSN: z.string().optional(),
  KEK_LOCAL_BASE64: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);

export const jwtPrivateKey = decodePemKey(env.JWT_PRIVATE_KEY);
export const jwtPublicKey = decodePemKey(env.JWT_PUBLIC_KEY);

export function messagingMode(): 'waha' | 'cloud' | 'fake' {
  if (process.env.NODE_ENV === 'test') return 'fake';
  if (env.MESSAGING_PROVIDER) return env.MESSAGING_PROVIDER;
  return env.NODE_ENV === 'production' ? 'waha' : 'fake';
}

export function wahaHmacKey(): string {
  return env.WAHA_HMAC_KEY ?? env.WHATSAPP_APP_SECRET;
}

export function wahaWebhookUrl(): string {
  if (env.WAHA_WEBHOOK_URL) return env.WAHA_WEBHOOK_URL;
  return 'http://localhost:3333/api/v1/webhooks/whatsapp';
}
