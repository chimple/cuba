export type NativeBridgePayload =
  | null
  | undefined
  | string
  | number
  | bigint
  | boolean
  | symbol
  | ((...args: never[]) => NativeBridgePayload)
  | Error
  | NativeBridgePayload[]
  | { [key: string]: NativeBridgePayload };

export type SafeNativeBridgePayload =
  | null
  | string
  | number
  | boolean
  | SafeNativeBridgePayload[]
  | { [key: string]: SafeNativeBridgePayload };

const MAX_STRING_LENGTH = 500;
const MAX_ARRAY_ITEMS = 10;
const MAX_OBJECT_KEYS = 20;
const MAX_DEPTH = 3;
const LARGE_FIELD_NAMES = new Set([
  'payload',
  'response',
  'rows',
  'records',
  'data',
  'metadata',
  'students',
  'profiles',
  'lessons',
  'results',
  'image',
  'base64',
  'blob',
  'file',
  'children',
]);

const BYTE_LENGTH_DIVISOR = 4;

const summarizeString = (value: string): SafeNativeBridgePayload => {
  if (value.length <= MAX_STRING_LENGTH) return value;

  return {
    type: 'string',
    length: value.length,
    preview: value.slice(0, MAX_STRING_LENGTH),
    truncated: true,
  };
};

const summarizeLargeField = (
  key: string,
  value: NativeBridgePayload,
): SafeNativeBridgePayload => {
  if (Array.isArray(value)) {
    return {
      field: key,
      type: 'array',
      count: value.length,
      summarized: true,
    };
  }

  if (typeof value === 'string') {
    return {
      field: key,
      type: 'string',
      length: value.length,
      approximateBytes: Math.ceil(value.length / BYTE_LENGTH_DIVISOR) * 3,
      summarized: true,
    };
  }

  if (value && typeof value === 'object') {
    return {
      field: key,
      type: value instanceof Error ? 'error' : 'object',
      keyCount: value instanceof Error ? 2 : Object.keys(value).length,
      summarized: true,
    };
  }

  return sanitizeNativeBridgePayload(value);
};

const sanitizeObject = (
  value: { [key: string]: NativeBridgePayload },
  depth: number,
  seen: WeakSet<object>,
): SafeNativeBridgePayload => {
  if (seen.has(value)) {
    return '[Circular]';
  }
  seen.add(value);

  const entries = Object.entries(value);
  const sanitizedEntries = entries
    .slice(0, MAX_OBJECT_KEYS)
    .map(([key, item]) => {
      if (LARGE_FIELD_NAMES.has(key)) {
        return [key, summarizeLargeField(key, item)] as const;
      }

      return [key, sanitizeNativeBridgePayload(item, depth + 1, seen)] as const;
    });

  const result: { [key: string]: SafeNativeBridgePayload } = {};
  for (const [key, item] of sanitizedEntries) {
    result[key] = item;
  }

  if (entries.length > MAX_OBJECT_KEYS) {
    result.__truncatedKeys = entries.length - MAX_OBJECT_KEYS;
  }

  return result;
};

export const sanitizeNativeBridgePayload = (
  value: NativeBridgePayload,
  depth: number = 0,
  seen: WeakSet<object> = new WeakSet<object>(),
): SafeNativeBridgePayload => {
  if (value === null || value === undefined) return null;

  if (typeof value === 'string') return summarizeString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'symbol') return value.toString();
  if (typeof value === 'function') {
    return {
      type: 'function',
      name: value.name || 'anonymous',
      summarized: true,
    };
  }

  if (value instanceof Error) {
    return {
      message: value.message,
      stack: value.stack ? summarizeString(value.stack) : null,
    };
  }

  if (depth >= MAX_DEPTH) {
    return Array.isArray(value)
      ? { type: 'array', count: value.length, summarized: true }
      : {
          type: 'object',
          keyCount: Object.keys(value).length,
          summarized: true,
        };
  }

  if (Array.isArray(value)) {
    const result = value
      .slice(0, MAX_ARRAY_ITEMS)
      .map((item) => sanitizeNativeBridgePayload(item, depth + 1, seen));

    if (value.length > MAX_ARRAY_ITEMS) {
      result.push({
        type: 'array',
        truncatedItems: value.length - MAX_ARRAY_ITEMS,
        summarized: true,
      });
    }

    return result;
  }

  return sanitizeObject(value, depth, seen);
};
