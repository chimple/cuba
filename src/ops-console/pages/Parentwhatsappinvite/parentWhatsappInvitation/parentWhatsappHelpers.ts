import { normalizeIndianPhone10 } from '../../../utils/phoneNormalization';
import type {
  MaytapiGroupPayload,
  ParentWhatsappApiError,
  ParsedEndpointResponse,
  ParsedWhatsappGroup,
} from './parentWhatsappTypes';

export const REQUEST_TIMEOUT_MS = 15000;
export const MSG91_BATCH_SIZE = 100;
export const RETRY_COUNT = 3;

export const wait = (ms: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

export const fileToBase64 = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
};

export const logParentWhatsappEvent = (
  event: string,
  details: Record<string, unknown>,
): void => {};

export const normalizeUdiseCode = (raw: string): string | null => {
  const compactRaw = raw.replace(/\s+/g, '');
  const cleanedCode = compactRaw.replace(/[^a-zA-Z0-9]/g, '');
  if (!cleanedCode) return null;

  if (!/^\d+$/.test(cleanedCode)) {
    if (cleanedCode.length !== 11) {
      return null;
    }
    return cleanedCode.toUpperCase();
  }

  if (cleanedCode.length === 10) return `0${cleanedCode}`;
  if (cleanedCode.length === 11) return cleanedCode;
  return null;
};

export const safeJsonParse = (value: string): unknown => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const extractMessageFromPayload = (payload: unknown): string | null => {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;
  const nestedError = record.error;

  if (nestedError && typeof nestedError === 'object') {
    const errorRecord = nestedError as Record<string, unknown>;
    const message =
      typeof errorRecord.message === 'string'
        ? errorRecord.message
        : typeof errorRecord.error_user_msg === 'string'
          ? errorRecord.error_user_msg
          : null;
    const code =
      typeof errorRecord.code === 'number' ||
      typeof errorRecord.code === 'string'
        ? String(errorRecord.code)
        : null;
    const fbTraceId =
      typeof errorRecord.fbtrace_id === 'string'
        ? errorRecord.fbtrace_id
        : null;

    if (message) {
      const suffix = [code ? `code: ${code}` : null, fbTraceId].filter(Boolean);
      return suffix.length > 0 ? `${message} (${suffix.join(', ')})` : message;
    }
  }

  const candidate =
    (typeof record.message === 'string' && record.message) ||
    (typeof record.detail === 'string' && record.detail) ||
    (typeof record.error === 'string' && record.error) ||
    (typeof record.error_message === 'string' && record.error_message);

  return candidate || null;
};

export const buildApiError = (params: {
  message?: string;
  statusCode?: number;
  responseText?: string;
  exceptionMessage?: string;
  payload?: unknown;
}): ParentWhatsappApiError => {
  const payloadMessage = extractMessageFromPayload(params.payload);

  return {
    message:
      (payloadMessage
        ? params.message
          ? `${params.message} ${payloadMessage}`
          : payloadMessage
        : null) ||
      params.message ||
      params.exceptionMessage ||
      'Unexpected external API error',
    statusCode: params.statusCode,
    responseText: params.responseText,
    exceptionMessage: params.exceptionMessage,
  };
};

const isTransientStatus = (status: number): boolean =>
  status === 429 || (status >= 500 && status <= 599);

const shouldRetryError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  return (
    error.name === 'AbortError' ||
    /network/i.test(error.message) ||
    /timeout/i.test(error.message) ||
    /failed to fetch/i.test(error.message)
  );
};

export const parseEndpointResponse = async (
  response: Response,
): Promise<ParsedEndpointResponse> => {
  const text = await response.text();
  return {
    response,
    text,
    payload: safeJsonParse(text),
  };
};

export const requestWithTimeout = async (
  input: RequestInfo,
  init: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<Response> => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timer);
  }
};

export const requestWithRetry = async (
  requestFactory: () => Promise<Response>,
  retries: number = RETRY_COUNT,
): Promise<Response> => {
  let attempt = 0;

  while (true) {
    try {
      const response = await requestFactory();
      if (isTransientStatus(response.status) && attempt < retries) {
        await wait(300 * 2 ** attempt);
        attempt += 1;
        continue;
      }
      return response;
    } catch (error) {
      if (attempt >= retries || !shouldRetryError(error)) {
        throw error;
      }
      await wait(300 * 2 ** attempt);
      attempt += 1;
    }
  }
};

export const chunkInviteRows = <T>(rows: T[], batchSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let index = 0; index < rows.length; index += batchSize) {
    chunks.push(rows.slice(index, index + batchSize));
  }
  return chunks;
};

const parseMemberPhone = (member: unknown): string | null => {
  if (typeof member === 'string') {
    return normalizeIndianPhone10(member.replace('@c.us', ''));
  }

  if (member && typeof member === 'object') {
    const candidate = member as {
      id?: string;
      phone?: string;
      user?: string;
      number?: string;
      jid?: string;
      wid?: string;
      contact?: string;
    };

    return normalizeIndianPhone10(
      String(
        candidate.phone ??
          candidate.user ??
          candidate.id ??
          candidate.number ??
          candidate.jid ??
          candidate.wid ??
          candidate.contact ??
          '',
      ).replace('@c.us', ''),
    );
  }

  return null;
};

export const parseWhatsappGroupDetails = (
  raw: unknown,
): ParsedWhatsappGroup => {
  const parsedGroup =
    typeof raw === 'object' && raw !== null && !Array.isArray(raw)
      ? (raw as MaytapiGroupPayload)
      : null;

  const container: MaytapiGroupPayload['data'] | MaytapiGroupPayload =
    parsedGroup?.data && typeof parsedGroup.data === 'object'
      ? parsedGroup.data
      : (parsedGroup ?? {});
  const members = Array.isArray(container?.participants)
    ? container.participants
    : Array.isArray(container?.members)
      ? container.members
      : [];

  return {
    members: new Set(
      members
        .map(parseMemberPhone)
        .filter((member): member is string => Boolean(member)),
    ),
    inviteLink:
      typeof container?.inviteLink === 'string'
        ? container.inviteLink
        : typeof (container as { invite_link?: unknown })?.invite_link ===
            'string'
          ? String((container as { invite_link?: unknown }).invite_link)
          : typeof (container as { whatsapp_invite_link?: unknown })
                ?.whatsapp_invite_link === 'string'
            ? String(
                (container as { whatsapp_invite_link?: unknown })
                  .whatsapp_invite_link,
              )
            : typeof container?.invite === 'string'
              ? container.invite
              : null,
  };
};

export const assertSuccessfulResponse = (
  parsedResponse: ParsedEndpointResponse,
  defaultMessage: string,
): void => {
  const isPayloadFailure =
    typeof parsedResponse.payload === 'object' &&
    parsedResponse.payload !== null &&
    'success' in parsedResponse.payload &&
    parsedResponse.payload.success === false;

  if (parsedResponse.response.ok && !isPayloadFailure) {
    return;
  }

  throw buildApiError({
    message: defaultMessage,
    statusCode: parsedResponse.response.status,
    responseText: parsedResponse.text,
    payload: parsedResponse.payload,
  });
};
