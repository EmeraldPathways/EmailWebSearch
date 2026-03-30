import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnvInt(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be an integer, got: ${value}`);
  }
  return parsed;
}

export const config = {
  apifyApiToken: requireEnv('APIFY_API_TOKEN'),
  apiSecretKey: requireEnv('API_SECRET_KEY'),
  port: optionalEnvInt('PORT', 3000),
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  apifyRunTimeoutSecs: optionalEnvInt('APIFY_RUN_TIMEOUT_SECS', 180),
  maxConcurrentApifyRuns: optionalEnvInt('MAX_CONCURRENT_APIFY_RUNS', 3),
  apifyActorId: process.env['APIFY_ACTOR_ID'] ?? 'logical_scrapers/extract-email-from-any-website',
  sqliteDbPath: process.env['SQLITE_DB_PATH'] ?? path.resolve(__dirname, '..', 'data', 'extractions.db'),
  cache: {
    extractionTtlMs: optionalEnvInt('CACHE_TTL_EXTRACT', 600) * 1000,
  },
} as const;
