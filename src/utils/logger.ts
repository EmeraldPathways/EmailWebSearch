type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Only these fields are safe to log — never log tokens, passwords, or PII
const SAFE_FIELDS = new Set([
  'username', 'actorId', 'runId', 'datasetId', 'status',
  'durationMs', 'itemCount', 'page', 'pageSize', 'requestId',
  'method', 'path', 'statusCode', 'message', 'code',
]);

function sanitize(obj: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SAFE_FIELDS.has(key)) {
      safe[key] = value;
    }
  }
  return safe;
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  const entry: Record<string, unknown> = {
    level,
    timestamp: new Date().toISOString(),
    message,
  };
  if (meta) {
    Object.assign(entry, sanitize(meta));
  }
  const output = JSON.stringify(entry);
  if (level === 'error' || level === 'warn') {
    process.stderr.write(output + '\n');
  } else {
    process.stdout.write(output + '\n');
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => log('debug', message, meta),
  info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
};
