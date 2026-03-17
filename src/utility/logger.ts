/* eslint-disable no-console */
// Pure object logger (no stringify, no native logic)

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';
type LogMethod = 'debug' | 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;

export type LogPayload = {
  timestamp: string;
  level: string;
  message: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
  };
  page?: string;
};

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

let currentLevel: LogLevel =
  process.env.NODE_ENV === 'production' ? 'warn' : 'debug';

// 🔹 page
const getPage = () => {
  if (typeof window === 'undefined') return undefined;
  return window.location.pathname;
};

// 🔹 extract error
const extractError = (args: unknown[]) => {
  const err = args.find((a) => a instanceof Error) as Error | undefined;
  if (!err) return undefined;

  return {
    message: err.message,
    stack: err.stack,
  };
};

// 🔹 message
const getMessage = (args: unknown[]) => {
  for (const arg of args) {
    if (typeof arg === 'string') return arg;
    if (arg instanceof Error) return arg.message;
  }
  return 'Log';
};

// 🔹 payload
const buildPayload = (level: LogMethod, args: unknown[]): LogPayload => {
  const message = getMessage(args);
  const error = extractError(args);

  const contextArg = args.find(
    (a) => typeof a === 'object' && !(a instanceof Error),
  ) as LogContext | undefined;

  return {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message,
    page: getPage(),
    ...(contextArg ? { context: contextArg } : {}),
    ...(error ? { error } : {}),
  };
};

// 🔹 emit (OBJECT ONLY)
const emit = (level: LogMethod, args: unknown[]) => {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[currentLevel]) return;

  const payload = buildPayload(level, args);
  const message = `[${payload.level}] ${payload.message}`;

  if (level === 'error') {
    console.error(message, payload); // 🔴 object
    return;
  }

  if (level === 'warn') {
    console.warn(message, payload);
    return;
  }

  console.log(message, payload);
};

// 🔹 API
const create =
  (level: LogMethod) =>
  (...args: unknown[]) =>
    emit(level, args);

export const logger = {
  setLevel(level: LogLevel) {
    currentLevel = level;
  },

  getLevel() {
    return currentLevel;
  },

  debug: create('debug'),
  info: create('info'),
  warn: create('warn'),
  error: create('error'),
};

export default logger;
