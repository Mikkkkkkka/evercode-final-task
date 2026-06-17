export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogContext = {
  requestId?: string;
  error?: unknown;
  [key: string]: unknown;
};

export type AppLogger = {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  child(context?: LogContext): AppLogger;
};

const logLevels: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

function readLogLevel(): LogLevel {
  const value = process.env.LOG_LEVEL?.toLowerCase();
  if (value === 'debug' || value === 'info' || value === 'warn' || value === 'error') {
    return value;
  }
  return process.env.NODE_ENV === 'test' ? 'error' : 'info';
}

function readAppName(): string {
  return process.env.APP_NAME ?? 'crypto-tracker-api';
}

function shouldLog(level: LogLevel, minLevel: LogLevel): boolean {
  return logLevels[level] >= logLevels[minLevel];
}

function formatContext(context: LogContext): string {
  const entries = Object.entries(context).filter(([key, value]) => key !== 'requestId' && key !== 'error' && value !== undefined);
  if (entries.length === 0) {
    return '';
  }

  const serialized = Object.fromEntries(entries);
  return ` ${JSON.stringify(serialized)}`;
}

function formatLogEntry({
  timestamp,
  level,
  scope,
  requestId,
  message,
  context
}: {
  timestamp: string;
  level: LogLevel;
  scope: string;
  requestId?: string;
  message: string;
  context: LogContext;
}): string {
  const requestContext = requestId ? ` [requestId=${requestId}]` : '';
  return `[${timestamp}] [${level.toUpperCase()}] [${scope}]${requestContext} ${message}${formatContext(context)}`;
}

function extractErrorStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined;
}

function writeLog(level: LogLevel, entry: string, error: unknown): void {
  if (level === 'error') {
    console.error(entry);

    const stack = extractErrorStack(error);
    if (stack) {
      console.error(stack);
    }

    return;
  }

  if (level === 'warn') {
    console.warn(entry);
    return;
  }

  console.log(entry);
}

export function createLogger(scope = readAppName(), baseContext: LogContext = {}): AppLogger {
  const minLevel = readLogLevel();

  function log(level: LogLevel, message: string, context: LogContext = {}): void {
    if (!shouldLog(level, minLevel)) {
      return;
    }

    const mergedContext = { ...baseContext, ...context };
    const entry = formatLogEntry({
      timestamp: new Date().toISOString(),
      level,
      scope,
      requestId: mergedContext.requestId,
      message,
      context: mergedContext
    });

    writeLog(level, entry, mergedContext.error);
  }

  return {
    debug(message, context) {
      log('debug', message, context);
    },
    info(message, context) {
      log('info', message, context);
    },
    warn(message, context) {
      log('warn', message, context);
    },
    error(message, context) {
      log('error', message, context);
    },
    child(context = {}) {
      return createLogger(scope, { ...baseContext, ...context });
    }
  };
}

export default createLogger;
