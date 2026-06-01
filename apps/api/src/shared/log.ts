function errorFields(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return { errorName: err.name, errorMessage: err.message, stack: err.stack };
  }
  return { errorMessage: String(err) };
}

function write(level: 'info' | 'warn' | 'error', tag: string, message: string, meta?: Record<string, unknown>, err?: unknown): void {
  const line = {
    level,
    tag,
    message,
    ts: new Date().toISOString(),
    ...meta,
    ...(err !== undefined ? errorFields(err) : {}),
  };
  const out = JSON.stringify(line);
  if (level === 'error') console.error(out);
  else console.log(out);
}

/** Structured logs for PM2 (`pm2 logs nutriplan-api`). */
export function logInfo(tag: string, message: string, meta?: Record<string, unknown>): void {
  write('info', tag, message, meta);
}

export function logWarn(tag: string, message: string, meta?: Record<string, unknown>): void {
  write('warn', tag, message, meta);
}

export function logError(
  tag: string,
  message: string,
  meta?: Record<string, unknown>,
  err?: unknown,
): void {
  write('error', tag, message, meta, err);
}
