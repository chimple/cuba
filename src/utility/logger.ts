/* eslint-disable no-console */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';
type LogMethod = 'debug' | 'info' | 'warn' | 'error';
type LogContext = Record<string, unknown>;

export type LogPayload = {
  timestamp?: string;
  level: string;
  message: string;
  context?: LogContext;
  meta?: {
    file_name?: string;
    line_number?: number;
    function_name?: string;
  };
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

const getEnvLogLevel = (): LogLevel => {
  const envLevel = process.env.REACT_APP_LOG_LEVEL as LogLevel;

  if (envLevel && LEVEL_ORDER[envLevel] !== undefined) {
    return envLevel;
  }

  return process.env.NODE_ENV === 'production' ? 'warn' : 'debug';
};

let currentLevel: LogLevel = getEnvLogLevel();

// Opt 1: cache the window guard once instead of repeating typeof checks
const HAS_WINDOW = typeof window !== 'undefined';

const IS_NATIVE =
  HAS_WINDOW &&
  !!(window as any).Capacitor &&
  (window as any).Capacitor.getPlatform() !== 'web';

let cachedPage: string | undefined = HAS_WINDOW
  ? window.location.pathname
  : undefined;

if (HAS_WINDOW) {
  window.addEventListener('popstate', () => {
    cachedPage = window.location.pathname;
  });
}

/**
 * Parse args
 */
const parseArgs = (args: unknown[]) => {
  let message = 'Log';
  const context: unknown[] = [];
  let hasContext = false;
  let error: LogPayload['error'] | undefined;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];

    if (message === 'Log') {
      if (typeof a === 'string') {
        message = a;
        continue;
      }
      if (a instanceof Error) {
        message = a.message;
        // Note: intentionally no `continue` here — the second instanceof
        // check below must still run to populate `error`. Do not "fix" this.
      }
    }

    if (!error && a instanceof Error) {
      error = { message: a.message, stack: a.stack };
      continue;
    }

    if (typeof a !== 'string' && typeof a !== 'undefined') {
      context.push(a);
      hasContext = true;
    }
  }

  return {
    message,
    context: hasContext ? context : undefined,
    error,
  };
};

/**
 * Extract meta
 * Opt 4: skip spread + deletes when no meta keys are present on the object
 */
const extractMetaFromArray = (arr: unknown[]) => {
  let file_name: string | undefined;
  let line_number: number | undefined;
  let function_name: string | undefined;

  const cleanData: unknown[] = [];

  for (let i = 0; i < arr.length; i++) {
    const item: any = arr[i];

    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const hasMeta = item.file_name || item.line_number || item.function_name;

      if (hasMeta) {
        if (!file_name && item.file_name) file_name = item.file_name;
        if (!line_number && item.line_number) line_number = item.line_number;
        if (!function_name && item.function_name)
          function_name = item.function_name;

        const rest = { ...item };
        delete rest.file_name;
        delete rest.line_number;
        delete rest.function_name;

        if (Object.keys(rest).length > 0) {
          cleanData.push(rest);
        }
      } else {
        cleanData.push(item);
      }
    } else {
      cleanData.push(item);
    }
  }

  return {
    meta:
      file_name || line_number || function_name
        ? { file_name, line_number, function_name }
        : undefined,
    cleanData,
  };
};

/**
 * Build payload
 */
const buildPayload = (level: LogMethod, args: unknown[]): LogPayload => {
  const isDetailedLog = level === 'warn' || level === 'error';

  const { message, context, error } = parseArgs(args);

  let meta: LogPayload['meta'] | undefined;
  let cleanContext: LogContext | undefined;

  if (context) {
    const { meta: extractedMeta, cleanData } = extractMetaFromArray(context);

    if (isDetailedLog && extractedMeta) {
      meta = extractedMeta;
    }

    if (cleanData.length > 0) {
      cleanContext = { data: cleanData };
    }
  }

  const payload: LogPayload = {
    level: level.toUpperCase(),
    message,
  };

  if (isDetailedLog) {
    payload.timestamp = new Date().toISOString();
    payload.page = cachedPage;
  }

  if (meta) payload.meta = meta;
  if (cleanContext) payload.context = cleanContext;
  if (error) payload.error = error;

  return payload;
};

const formatForNative = (obj: unknown): string => {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return '[Object]';
  }
};

/**
 * Emit
 */
const emit = (level: LogMethod, args: unknown[]) => {
  // Opt 2: cache currentLevel rank to avoid double hash lookup
  const currentRank = LEVEL_ORDER[currentLevel];
  if (LEVEL_ORDER[level] < currentRank) return;

  // SIMPLE MODE — debug / info
  if (level === 'debug' || level === 'info') {
    const [first, ...rest] = args;

    const message =
      typeof first === 'string'
        ? first
        : first instanceof Error
          ? first.message
          : 'Log';

    const rawArgs = typeof first === 'string' ? rest : args;

    // Opt 5: single reduce pass instead of map + filter (also preserves 0 / false values)
    const cleanedArgs = rawArgs.reduce<unknown[]>((acc, arg) => {
      if (arg && typeof arg === 'object' && !Array.isArray(arg)) {
        const obj = { ...(arg as any) };
        delete obj.file_name;
        delete obj.line_number;
        delete obj.function_name;
        if (Object.keys(obj).length) acc.push(obj);
      } else if (arg != null) {
        acc.push(arg);
      }
      return acc;
    }, []);

    if (IS_NATIVE) {
      const serialized = cleanedArgs.map((a) =>
        a && typeof a === 'object' ? formatForNative(a) : a,
      );
      return console.log(`[${level.toUpperCase()}] ${message}`, ...serialized);
    }

    return console.log(
      `#### [${level.toUpperCase()}] ${message}`,
      ...cleanedArgs,
    );
  }

  // DETAILED MODE — warn / error
  const payload = buildPayload(level, args);
  const message = `[${payload.level}] ${payload.message}`;

  if (IS_NATIVE) {
    const log = `${message}\n${formatForNative(payload)}`;

    if (level === 'error') return console.error(log);
    if (level === 'warn') return console.warn(log);
  }

  const prefix = `#### ${message}`;

  if (level === 'error') return console.error(prefix, payload);
  if (level === 'warn') return console.warn(prefix, payload);
};

// Opt 6: named inner function for better devtools stack traces
const create = (level: LogMethod) =>
  function log(...args: unknown[]) {
    return emit(level, args);
  };

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
