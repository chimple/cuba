import { ApiHandler } from '../../../services/api/ApiHandler';
import {
  formatSmsReadyIndianPhone,
  normalizeIndianPhone10,
} from '../../utils/phoneNormalization';

// Runtime config values for MSG91, WhatsApp Cloud, and Maytapi integrations.
const REQUEST_TIMEOUT_MS = 15000;
const MSG91_BATCH_SIZE = 100;
const RETRY_COUNT = 3;

/*
External HTTP APIs (ACTIVE runtime calls):
- Maytapi group fetch via Supabase RPC: parent_wa_get_group_details
- MSG91 report via Supabase RPC: fetch_parent_whatsapp_msg91_report
- MSG91 send flow via Supabase RPC: send_parent_whatsapp_msg91_invites
- WhatsApp media upload via Supabase Edge Function: upload-parent-whatsapp-media
- WhatsApp template/marketing send via Supabase RPC: send_parent_whatsapp_template_message
*/

// Common external API error object propagated to UI and logs.
export type ParentWhatsappApiError = {
  message: string;
  statusCode?: number;
  responseText?: string;
  exceptionMessage?: string;
};

// A single parent invite row generated from UDISE analysis.
export type ParentWhatsappInviteRow = {
  udise: string;
  school: string;
  className: string;
  mobile: string;
  inviteLink: string;
};

// Captures per-group failures during WhatsApp group/member analysis.
export type ParentWhatsappFailedGroupRow = {
  udise: string;
  school: string;
  className: string;
  groupId: string;
  error: string;
  statusCode?: number;
  responseText?: string;
  exceptionMessage?: string;
};

// End-to-end analysis output used by the invite send flow.
export type ParentWhatsappAnalysisResult = {
  processedUdise: string[];
  inviteList: ParentWhatsappInviteRow[];
  failedGroups: ParentWhatsappFailedGroupRow[];
  totalMissing: number;
};

// Details of one failed MSG91 batch send attempt.
export type ParentWhatsappSmsBatchFailure = {
  batchIndex: number;
  recipients: string[];
  inviteRows: ParentWhatsappInviteRow[];
  error: ParentWhatsappApiError;
};

// MSG91 send result summary with success count and failed batches.
export type ParentWhatsappSmsSendResult = {
  successCount: number;
  failedBatches: ParentWhatsappSmsBatchFailure[];
};

// Per-number WhatsApp template send failure details.
export type ParentWhatsappSendFailure = {
  mobile: string;
  error: ParentWhatsappApiError;
};

// Flags showing whether required external endpoints are configured.
export type ParentWhatsappConfigStatus = {
  hasMsg91Send: boolean;
  hasMsg91Report: boolean;
  hasWhatsappMediaUpload: boolean;
  hasWhatsappTemplateSend: boolean;
};

// Parsed WhatsApp group members and invite link for comparison.
type ParsedWhatsappGroup = {
  members: Set<string>;
  inviteLink: string | null;
};

// Maytapi group response shape variants handled by parser.
type MaytapiGroupPayload = {
  data?: {
    participants?: unknown[];
    members?: unknown[];
    invite?: string;
    inviteLink?: string;
  };
  participants?: unknown[];
  members?: unknown[];
  invite?: string;
  inviteLink?: string;
};

// Generic parsed HTTP response with raw text and JSON payload.
type ParsedEndpointResponse = {
  response: Response;
  text: string;
  payload: unknown;
};

// Minimal class row shape needed for invite/group processing.
type DirectClassRow = {
  id: string;
  name: string;
  group_id?: string | null;
  whatsapp_invite_link?: string | null;
};

type ParentWhatsappSchoolRow = {
  id: string;
  name: string;
  whatsapp_bot_number?: string | null;
};

// Small async delay helper used in retry backoff.
const wait = (ms: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

// Encodes a File into plain base64 content for RPC/Edge payloads.
const fileToBase64 = async (file: File): Promise<string> => {
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

// Structured console logger for parent WhatsApp workflow events.
const logParentWhatsappEvent = (
  event: string,
  details: Record<string, unknown>,
): void => {};

// Normalizes UDISE input into expected 11-digit code format.
const normalizeUdiseCode = (raw: string): string | null => {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 10) return `0${digits}`;
  if (digits.length === 11) return digits;
  return null;
};

// Safely parses JSON payload text without throwing.
const safeJsonParse = (value: string): unknown => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

// Extracts a readable error message from nested API error payloads.
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

// Builds a normalized ParentWhatsappApiError from mixed error inputs.
const buildApiError = (params: {
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

// Detects direct MSG91 control domain usage (blocked by browser CORS).
const isDirectMsg91ControlUrl = (url: string): boolean => {
  try {
    return new URL(url).hostname === 'control.msg91.com';
  } catch {
    return /control\.msg91\.com/i.test(url);
  }
};

// Blocks direct MSG91 browser URLs and guides users to backend/proxy endpoints.
const ensureBrowserSafeExternalUrl = (
  url: string,
  action: string,
  envKey: string,
): string => {
  if (typeof window === 'undefined') {
    return url;
  }

  if (isDirectMsg91ControlUrl(url)) {
    throw buildApiError({
      message:
        `${action} cannot call MSG91 directly from browser due to CORS. ` +
        `Set ${envKey} to your backend/proxy endpoint instead of control.msg91.com.`,
      exceptionMessage: `Browser CORS blocked direct MSG91 URL: ${url}`,
    });
  }

  return url;
};

// Marks retryable HTTP statuses (429 and 5xx).
const isTransientStatus = (status: number): boolean =>
  status === 429 || (status >= 500 && status <= 599);

// Marks retryable network/runtime fetch failures.
const shouldRetryError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  return (
    error.name === 'AbortError' ||
    /network/i.test(error.message) ||
    /timeout/i.test(error.message) ||
    /failed to fetch/i.test(error.message)
  );
};

// Parses fetch response into response/text/json payload bundle.
const parseEndpointResponse = async (
  response: Response,
): Promise<ParsedEndpointResponse> => {
  const text = await response.text();
  return {
    response,
    text,
    payload: safeJsonParse(text),
  };
};

// Runs fetch with AbortController timeout protection.
const requestWithTimeout = async (
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

// Retries transient network/status failures with exponential backoff.
const requestWithRetry = async (
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

// Splits invite rows into fixed-size batches for MSG91 sends.
const chunkInviteRows = (
  inviteRows: ParentWhatsappInviteRow[],
  batchSize: number,
): ParentWhatsappInviteRow[][] => {
  const chunks: ParentWhatsappInviteRow[][] = [];
  for (let index = 0; index < inviteRows.length; index += batchSize) {
    chunks.push(inviteRows.slice(index, index + batchSize));
  }
  return chunks;
};

// Extracts and normalizes a member phone from mixed Maytapi participant shapes.
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

// Converts raw group payload into normalized members + invite link.
const parseWhatsappGroupDetails = (raw: unknown): ParsedWhatsappGroup => {
  const parsedGroup =
    typeof raw === 'object' && raw !== null && !Array.isArray(raw)
      ? (raw as MaytapiGroupPayload)
      : null;

  const container =
    parsedGroup?.data && typeof parsedGroup.data === 'object'
      ? parsedGroup.data
      : parsedGroup;
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

// Fetches parent phones for a class via dedicated parent WhatsApp API method.
const fetchParentPhonesForClass = async (
  api: ApiHandler,
  classId: string,
): Promise<Set<string>> => {
  const rawPhones = await api.getParentWhatsappParentPhonesByClassId(classId);
  const parentPhones = new Set<string>();
  rawPhones.forEach((phone) => {
    const normalizedParentPhone = normalizeIndianPhone10(phone);
    if (normalizedParentPhone) {
      parentPhones.add(normalizedParentPhone);
    }
  });

  return parentPhones;
};

// Finds an exact UDISE school via dedicated parent WhatsApp API method.
const findSchoolByUdise = async (
  api: ApiHandler,
  udiseCode: string,
): Promise<ParentWhatsappSchoolRow | null> => {
  return await api.getParentWhatsappSchoolByUdise(udiseCode);
};

// Fetches classes for a school via dedicated parent WhatsApp API method.
const fetchClassesForSchool = async (
  api: ApiHandler,
  schoolId: string,
): Promise<DirectClassRow[]> => {
  return await api.getParentWhatsappClassesBySchoolId(schoolId);
};

// Fetches WhatsApp group details via parent WhatsApp dedicated RPC path.
const fetchWhatsappGroupDetails = async (
  api: ApiHandler,
  groupId: string,
): Promise<unknown> => {
  try {
    return await api.getParentWhatsappGroupDetails(groupId);
  } catch (error) {
    throw buildApiError({
      message: 'Failed to fetch WhatsApp group details.',
      exceptionMessage: error instanceof Error ? error.message : String(error),
      payload: error,
    });
  }
};

// Throws a normalized error when HTTP response or payload indicates failure.
const assertSuccessfulResponse = (
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

// Returns which parent WhatsApp integration endpoints are currently configured.
export const getParentWhatsappConfigStatus =
  (): ParentWhatsappConfigStatus => ({
    hasMsg91Send: true,
    hasMsg91Report: true,
    hasWhatsappMediaUpload: true,
    hasWhatsappTemplateSend: true,
  });

// Runs UDISE analysis to compute missing parents and build invite rows.
export const processParentWhatsappUdiseCodes = async (params: {
  api: ApiHandler;
  udiseCodes: string[];
  limit: number;
}): Promise<ParentWhatsappAnalysisResult> => {
  const { api, udiseCodes, limit } = params;
  const processedUdise: string[] = [];
  const inviteList: ParentWhatsappInviteRow[] = [];
  const failedGroups: ParentWhatsappFailedGroupRow[] = [];

  outerLoop: for (const rawUdise of udiseCodes) {
    const udise = normalizeUdiseCode(rawUdise);
    if (!udise) continue;

    const school = await findSchoolByUdise(api, udise);
    if (!school) continue;

    const classes = await fetchClassesForSchool(api, school.id);

    for (const classRow of classes) {
      const groupId = String(classRow.group_id ?? '').trim();

      if (!groupId) {
        continue;
      }

      try {
        const rawGroup = await fetchWhatsappGroupDetails(api, groupId);
        const group = parseWhatsappGroupDetails(rawGroup);
        const inviteLink =
          group.inviteLink ??
          String(classRow.whatsapp_invite_link ?? '').trim();
        const parentPhones = await fetchParentPhonesForClass(api, classRow.id);
        const missingPhones = Array.from(parentPhones).filter(
          (phone) => !group.members.has(phone),
        );

        logParentWhatsappEvent('analysis_class', {
          udise,
          schoolId: school.id,
          schoolName: school.name,
          classId: classRow.id,
          className: classRow.name,
          groupId,
          countParents: parentPhones.size,
          countMembers: group.members.size,
          countMissing: missingPhones.length,
        });

        for (const phone of missingPhones) {
          if (inviteList.length >= limit) {
            processedUdise.push(udise);
            break outerLoop;
          }

          if (!inviteLink) {
            continue;
          }

          const mobile = formatSmsReadyIndianPhone(phone);
          if (!mobile) {
            continue;
          }

          inviteList.push({
            udise,
            school: school.name,
            className: classRow.name,
            mobile,
            inviteLink,
          });
        }
      } catch (error) {
        const apiError =
          error instanceof Error
            ? buildApiError({
                message: error.message,
                exceptionMessage: error.message,
              })
            : buildApiError({
                message: 'Failed to fetch WhatsApp group details.',
              });

        logParentWhatsappEvent('analysis_group_failed', {
          udise,
          schoolId: school.id,
          schoolName: school.name,
          classId: classRow.id,
          className: classRow.name,
          groupId,
          statusCode: apiError.statusCode,
          exceptionMessage: apiError.exceptionMessage,
        });

        failedGroups.push({
          udise,
          school: school.name,
          className: classRow.name,
          groupId,
          error: apiError.message,
          statusCode: apiError.statusCode,
          responseText: apiError.responseText,
          exceptionMessage: apiError.exceptionMessage,
        });
      }
    }

    if (!processedUdise.includes(udise)) {
      processedUdise.push(udise);
    }

    if (inviteList.length >= limit) {
      break;
    }
  }

  return {
    processedUdise,
    inviteList,
    failedGroups,
    totalMissing: inviteList.length,
  };
};

// Fetches MSG91 report rows for the selected date range.
export const fetchParentWhatsappMsg91Report = async (params: {
  api: ApiHandler;
  startDate: string;
  endDate: string;
}): Promise<Record<string, unknown>[]> => {
  const rpcPayload = await params.api.getParentWhatsappMsg91ReportRows(
    params.startDate,
    params.endDate,
  );
  const payload =
    rpcPayload && typeof rpcPayload === 'object'
      ? (rpcPayload as {
          success?: unknown;
          statusCode?: unknown;
          responseText?: unknown;
          data?: unknown;
          raw?: unknown;
        })
      : null;

  const isSuccess = payload?.success === undefined || payload.success === true;

  if (!isSuccess) {
    const statusCode =
      typeof payload?.statusCode === 'number'
        ? payload.statusCode
        : typeof payload?.statusCode === 'string'
          ? Number(payload.statusCode)
          : undefined;
    throw buildApiError({
      message: 'Failed to fetch MSG91 report.',
      statusCode,
      responseText:
        typeof payload?.responseText === 'string'
          ? payload.responseText
          : undefined,
      payload,
    });
  }

  if (Array.isArray(payload?.data)) {
    return payload.data as Record<string, unknown>[];
  }

  if (
    payload?.raw &&
    typeof payload.raw === 'object' &&
    'data' in payload.raw &&
    Array.isArray((payload.raw as { data?: unknown[] }).data)
  ) {
    return (payload.raw as { data: Record<string, unknown>[] }).data;
  }

  if (payload?.raw && Array.isArray(payload.raw)) {
    return payload.raw as Record<string, unknown>[];
  }

  return [];
};

// Sends invite batches to MSG91 via Supabase RPC and returns detailed failures.
export const sendParentWhatsappMsg91Invites = async (
  api: ApiHandler,
  inviteRows: ParentWhatsappInviteRow[],
): Promise<ParentWhatsappSmsSendResult> => {
  if (!inviteRows.length) {
    return {
      successCount: 0,
      failedBatches: [],
    };
  }

  const rpcPayload = await api.getParentWhatsappMsg91SendResult(
    inviteRows,
    MSG91_BATCH_SIZE,
  );
  const payload =
    rpcPayload && typeof rpcPayload === 'object'
      ? (rpcPayload as {
          successCount?: unknown;
          failedBatches?: unknown;
        })
      : null;

  const successCountRaw = Number(payload?.successCount ?? 0);
  const successCount =
    Number.isFinite(successCountRaw) && successCountRaw >= 0
      ? successCountRaw
      : 0;

  const chunkedInviteRows = chunkInviteRows(inviteRows, MSG91_BATCH_SIZE);
  const rawFailedBatches = Array.isArray(payload?.failedBatches)
    ? payload?.failedBatches
    : [];
  const failedBatches: ParentWhatsappSmsBatchFailure[] = [];

  for (const [index, rawFailure] of rawFailedBatches.entries()) {
    const failure =
      rawFailure && typeof rawFailure === 'object'
        ? (rawFailure as {
            batchIndex?: unknown;
            recipients?: unknown;
            statusCode?: unknown;
            responseText?: unknown;
            exceptionMessage?: unknown;
            error?: unknown;
          })
        : null;

    const batchIndexRaw = Number(failure?.batchIndex);
    const batchIndex =
      Number.isFinite(batchIndexRaw) && batchIndexRaw > 0
        ? batchIndexRaw
        : index + 1;

    const inviteBatch = chunkedInviteRows[batchIndex - 1] ?? [];
    const recipients = Array.isArray(failure?.recipients)
      ? failure.recipients.map((recipient) => String(recipient))
      : inviteBatch.map((row) => row.mobile);

    const statusCode =
      typeof failure?.statusCode === 'number'
        ? failure.statusCode
        : typeof failure?.statusCode === 'string'
          ? Number(failure.statusCode)
          : undefined;

    const responseText =
      typeof failure?.responseText === 'string'
        ? failure.responseText
        : undefined;
    const exceptionMessage =
      typeof failure?.exceptionMessage === 'string'
        ? failure.exceptionMessage
        : undefined;

    const apiError = buildApiError({
      message: 'Failed to send MSG91 batch.',
      statusCode: Number.isFinite(statusCode ?? NaN) ? statusCode : undefined,
      responseText,
      exceptionMessage,
      payload: failure?.error ?? failure,
    });

    logParentWhatsappEvent('msg91_batch_send_failed', {
      batchIndex,
      batchSize: recipients.length,
      statusCode: apiError.statusCode,
      exceptionMessage: apiError.exceptionMessage,
    });

    failedBatches.push({
      batchIndex,
      recipients,
      inviteRows: inviteBatch,
      error: apiError,
    });
  }

  return {
    successCount,
    failedBatches,
  };
};

// Uploads WhatsApp media and returns the generated media id.
export const uploadParentWhatsappMedia = async (
  api: ApiHandler,
  file: File,
): Promise<string> => {
  const fileB64 = await fileToBase64(file);
  const rpcPayload = await api.uploadParentWhatsappMediaRpc(
    fileB64,
    file.name,
    file.type || 'application/octet-stream',
  );
  const payload =
    rpcPayload && typeof rpcPayload === 'object'
      ? (rpcPayload as {
          success?: unknown;
          statusCode?: unknown;
          responseText?: unknown;
          id?: unknown;
          mediaId?: unknown;
          raw?: unknown;
        })
      : null;

  const isSuccess = payload?.success === undefined || payload.success === true;
  if (!isSuccess) {
    const statusCode =
      typeof payload?.statusCode === 'number'
        ? payload.statusCode
        : typeof payload?.statusCode === 'string'
          ? Number(payload.statusCode)
          : undefined;
    throw buildApiError({
      message: 'Failed to upload WhatsApp media.',
      statusCode,
      responseText:
        typeof payload?.responseText === 'string'
          ? payload.responseText
          : undefined,
      payload,
    });
  }

  const mediaId =
    (typeof payload?.id === 'string' ? payload.id : null) ??
    (typeof payload?.mediaId === 'string' ? payload.mediaId : null) ??
    (payload?.raw &&
    typeof payload.raw === 'object' &&
    typeof (payload.raw as { id?: unknown }).id === 'string'
      ? ((payload.raw as { id?: string }).id ?? null)
      : null);

  if (!mediaId) {
    throw buildApiError({
      message: 'WhatsApp media upload succeeded but no media id was returned.',
      payload,
    });
  }

  return mediaId;
};

// Sends one WhatsApp template message (with optional header media).
export const sendParentWhatsappTemplateMessage = async (
  api: ApiHandler,
  params: {
    to: string;
    templateName: string;
    templateLang: string;
    messageType: 'utility' | 'marketing';
    mediaId?: string | null;
    mediaType?: 'image' | 'video' | null;
  },
): Promise<void> => {
  const rpcPayload = await api.sendParentWhatsappTemplateMessageRpc(params);
  const payload =
    rpcPayload && typeof rpcPayload === 'object'
      ? (rpcPayload as {
          success?: unknown;
          statusCode?: unknown;
          responseText?: unknown;
          raw?: unknown;
        })
      : null;

  const isSuccess = payload?.success === undefined || payload.success === true;
  if (isSuccess) {
    return;
  }

  const statusCode =
    typeof payload?.statusCode === 'number'
      ? payload.statusCode
      : typeof payload?.statusCode === 'string'
        ? Number(payload.statusCode)
        : undefined;

  throw buildApiError({
    message: 'Failed to send WhatsApp template message.',
    statusCode,
    responseText:
      typeof payload?.responseText === 'string'
        ? payload.responseText
        : undefined,
    payload: payload?.raw ?? payload,
  });
};
