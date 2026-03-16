import pino, { LevelWithSilent, Logger } from 'pino';

/**
 * Log levels supported
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';
type LogMethod = 'debug' | 'info' | 'warn' | 'error';

/**
 * Context object attached to logs
 */
type LogContext = Record<string, unknown>;

export type StructuredLogPayload = {
  message: string;
  error?: unknown;
  context?: LogContext;
  service?: string;
  environment?: string;
  correlation_id?: string;
  page_name?: string;
  page_url?: string;
  file_name?: string;
  component_name?: string;
  function_name?: string;
  line_number?: number;
};

/**
 * Default environment
 */
const ENV = process.env.REACT_APP_ENV || process.env.NODE_ENV || 'development';

/**
 * Validate string
 */
const isString = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length > 0;

/**
 * Check if plain object
 */
const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * Detect log level from environment
 */
const getInitialLevel = (): LogLevel => {
  const level = (
    process.env.REACT_APP_LOG_LEVEL || ''
  ).toLowerCase() as LogLevel;
  if (['debug', 'info', 'warn', 'error', 'silent'].includes(level)) {
    return level;
  }

  return process.env.NODE_ENV === 'production' ? 'warn' : 'debug';
};

let currentLevel: LogLevel = getInitialLevel();

/**
 * Base pino logger
 */
const baseLogger: Logger = pino({
  level: currentLevel,
  base: undefined,
  timestamp: false,
  formatters: {
    level: () => ({}),
  },
  browser: { asObject: true },
});

/**
 * Safe serializer
 */
const sanitize = (value: unknown): unknown => {
  if (
    value === undefined ||
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  try {
    return JSON.parse(
      JSON.stringify(value, (_k, v) => {
        if (typeof v === 'bigint') return v.toString();

        if (v instanceof Error) {
          return {
            name: v.name,
            message: v.message,
            stack: v.stack,
          };
        }

        return v;
      }),
    );
  } catch {
    return String(value);
  }
};

/**
 * Detect page name
 */
const getPageName = () => {
  if (typeof window === 'undefined') return;
  const path = window.location.pathname.replace(/\/+$/, '');
  if (!path || path === '/') return 'root';
  return path.split('/').pop();
};

/**
 * Detect page url
 */
const getPageUrl = () => {
  if (typeof window === 'undefined') return;

  return window.location.href;
};

/**
 * Extract error object
 */
const findError = (args: unknown[]) => {
  return args.find((a) => a instanceof Error) as Error | undefined;
};

/**
 * Normalize message
 */
const getMessage = (first: unknown, second: unknown) => {
  if (isString(first)) return first;
  if (first instanceof Error) return first.message;
  if (isString(second)) return second;

  return 'Log event';
};

/**
 * Build base log payload
 */
const buildPayload = (level: LogMethod, args: unknown[]) => {
  const [first, second] = args;

  const message = getMessage(first, second);
  const error = findError(args);

  const payload: StructuredLogPayload & {
    timestamp: string;
    level: string;
  } = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message,
  };

  if (ENV !== 'development') payload.environment = ENV;

  const page = getPageName();
  const url = getPageUrl();

  if (page) payload.page_name = page;
  if (url) payload.page_url = url;

  if (error) {
    payload.error = {
      message: error.message,
      stack_trace: error.stack,
    };
  }

  const contextArgs = args.filter(
    (a) => !(a instanceof Error) && a !== message,
  );

  if (contextArgs.length === 1)
    payload.context = sanitize(contextArgs[0]) as LogContext;
  else if (contextArgs.length > 1)
    payload.context = { args: sanitize(contextArgs) };

  return payload;
};

/**
 * Emit log
 */
const emit = (level: LogMethod, args: unknown[]) => {
  const payload = buildPayload(level, args);
  const writer = baseLogger[level] as (...args: unknown[]) => void;

  writer.call(baseLogger, payload);
};

/**
 * Create log method
 */
const createMethod =
  (level: LogMethod) =>
  (...args: unknown[]) =>
    emit(level, args);

/**
 * Public logger
 */
export const logger = {
  setLevel(level: LogLevel) {
    currentLevel = level;
    baseLogger.level = level as LevelWithSilent;
  },

  getLevel() {
    return currentLevel;
  },

  debug: createMethod('debug'),
  info: createMethod('info'),
  warn: createMethod('warn'),
  error: createMethod('error'),
};

export default logger;
