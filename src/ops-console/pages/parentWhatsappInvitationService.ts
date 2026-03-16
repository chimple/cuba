import { ApiHandler } from '../../services/api/ApiHandler';
import { StudentInfo, TableTypes } from '../../common/constants';
import {
  formatSmsReadyIndianPhone,
  normalizeIndianPhone10,
} from '../utils/phoneNormalization';

const parseNumberEnv = (
  value: string | undefined,
  fallback: number,
): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const MSG91_SEND_URL = process.env.REACT_APP_PARENT_WA_MSG91_SEND_URL ?? '';
const MSG91_REPORT_URL = process.env.REACT_APP_PARENT_WA_MSG91_REPORT_URL ?? '';
const MSG91_AUTHKEY = process.env.REACT_APP_PARENT_WA_MSG91_AUTHKEY ?? '';
const MSG91_TEMPLATE_ID =
  process.env.REACT_APP_PARENT_WA_MSG91_TEMPLATE_ID ?? '';
const WHATSAPP_MEDIA_UPLOAD_URL =
  process.env.REACT_APP_PARENT_WA_WHATSAPP_MEDIA_UPLOAD_URL ?? '';
const WHATSAPP_TEMPLATE_SEND_URL =
  process.env.REACT_APP_PARENT_WA_WHATSAPP_TEMPLATE_SEND_URL ?? '';
const WHATSAPP_ACCESS_TOKEN =
  process.env.REACT_APP_PARENT_WA_WHATSAPP_ACCESS_TOKEN ?? '';
const MAYTAPI_GROUP_BASE_URL =
  process.env.REACT_APP_PARENT_WA_MAYTAPI_GROUP_BASE_URL ?? '';
const MAYTAPI_PRODUCT_ID =
  process.env.REACT_APP_PARENT_WA_MAYTAPI_PRODUCT_ID ?? '';
const MAYTAPI_PHONE_ID = process.env.REACT_APP_PARENT_WA_MAYTAPI_PHONE_ID ?? '';
const MAYTAPI_API_TOKEN =
  process.env.REACT_APP_PARENT_WA_MAYTAPI_API_TOKEN ?? '';

const REQUEST_TIMEOUT_MS = parseNumberEnv(
  process.env.REACT_APP_PARENT_WA_REQUEST_TIMEOUT_MS,
  15000,
);
const MSG91_BATCH_SIZE = parseNumberEnv(
  process.env.REACT_APP_PARENT_WA_MSG91_BATCH_SIZE,
  100,
);
const RETRY_COUNT = parseNumberEnv(
  process.env.REACT_APP_PARENT_WA_RETRY_COUNT,
  2,
);

export type ParentWhatsappApiError = {
  message: string;
  statusCode?: number;
  responseText?: string;
  exceptionMessage?: string;
};

export type ParentWhatsappInviteRow = {
  udise: string;
  school: string;
  className: string;
  mobile: string;
  inviteLink: string;
};

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

export type ParentWhatsappAnalysisResult = {
  processedUdise: string[];
  inviteList: ParentWhatsappInviteRow[];
  failedGroups: ParentWhatsappFailedGroupRow[];
  totalMissing: number;
};

export type ParentWhatsappSmsBatchFailure = {
  batchIndex: number;
  recipients: string[];
  inviteRows: ParentWhatsappInviteRow[];
  error: ParentWhatsappApiError;
};

export type ParentWhatsappSmsSendResult = {
  successCount: number;
  failedBatches: ParentWhatsappSmsBatchFailure[];
};

export type ParentWhatsappSendFailure = {
  mobile: string;
  error: ParentWhatsappApiError;
};

export type ParentWhatsappConfigStatus = {
  hasMsg91Send: boolean;
  hasMsg91Report: boolean;
  hasWhatsappMediaUpload: boolean;
  hasWhatsappTemplateSend: boolean;
};

type ParsedWhatsappGroup = {
  members: Set<string>;
  inviteLink: string | null;
};

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

type ParsedEndpointResponse = {
  response: Response;
  text: string;
  payload: unknown;
};

type ParentPhoneRow = {
  user?: {
    phone?: string | null;
  } | null;
};

type DirectClassRow = {
  id: string;
  name: string;
  group_id?: string | null;
  whatsapp_invite_link?: string | null;
};

const wait = (ms: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

const logParentWhatsappEvent = (
  event: string,
  details: Record<string, unknown>,
): void => {
  console.info(`[ParentWhatsappInvitation] ${event}`, details);
};

const getSupabaseClientFromApi = (api: ApiHandler): any | null => {
  const service = (api as unknown as { s?: any }).s;
  if (service?.supabase) return service.supabase;
  if (service?._serverApi?.supabase) return service._serverApi.supabase;
  return null;
};

const normalizeUdiseCode = (raw: string): string | null => {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 10) return `0${digits}`;
  if (digits.length === 11) return digits;
  return null;
};

const safeJsonParse = (value: string): unknown => {
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

const isDirectMsg91ControlUrl = (url: string): boolean => {
  try {
    return new URL(url).hostname === 'control.msg91.com';
  } catch {
    return /control\.msg91\.com/i.test(url);
  }
};

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

const isDirectGraphApiUrl = (url: string): boolean => {
  try {
    return /(^|\.)graph\.facebook\.com$/i.test(new URL(url).hostname);
  } catch {
    return /graph\.facebook\.com/i.test(url);
  }
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

const extractParentPhonesFromStudents = (
  students: StudentInfo[],
): Set<string> => {
  const parentPhones = new Set<string>();

  students.forEach((student) => {
    const normalizedParentPhone = normalizeIndianPhone10(
      String(student.parent?.phone ?? ''),
    );
    if (normalizedParentPhone) {
      parentPhones.add(normalizedParentPhone);
    }
  });

  return parentPhones;
};

const fetchParentPhonesForClass = async (
  api: ApiHandler,
  classId: string,
): Promise<Set<string>> => {
  const apiSupabase = getSupabaseClientFromApi(api);

  if (apiSupabase) {
    const { data, error } = await apiSupabase
      .from('class_user')
      .select('user:user_id(phone)')
      .eq('class_id', classId)
      .eq('role', 'parent')
      .eq('is_deleted', false);

    if (!error) {
      const parentPhones = new Set<string>();

      (data as ParentPhoneRow[] | null)?.forEach((row) => {
        const normalizedParentPhone = normalizeIndianPhone10(
          String(row.user?.phone ?? ''),
        );
        if (normalizedParentPhone) {
          parentPhones.add(normalizedParentPhone);
        }
      });

      return parentPhones;
    }

    logParentWhatsappEvent('parent_phone_query_fallback', {
      classId,
      reason: error.message,
    });
  }

  const pageSize = 200;
  const allStudents: StudentInfo[] = [];
  let page = 1;
  let total = 0;

  do {
    const response = await api.getStudentsAndParentsByClassId(
      classId,
      page,
      pageSize,
    );
    total = response.total ?? 0;
    allStudents.push(...(response.data ?? []));
    page += 1;
  } while (allStudents.length < total);

  return extractParentPhonesFromStudents(allStudents);
};

const findSchoolByUdise = async (
  api: ApiHandler,
  udiseCode: string,
): Promise<TableTypes<'school'> | null> => {
  const apiSupabase = getSupabaseClientFromApi(api);
  if (apiSupabase) {
    const { data, error } = await apiSupabase
      .from('school')
      .select('id, name, whatsapp_bot_number')
      .eq('udise', udiseCode)
      .eq('is_deleted', false)
      .limit(1)
      .maybeSingle();

    if (!error && data?.id) {
      return data as TableTypes<'school'>;
    }
  }

  const result = await api.searchSchools({ p_search_text: udiseCode });
  const exactMatch =
    result.schools.find(
      (school) => String(school.udise ?? '').trim() === udiseCode,
    ) ?? null;

  if (!exactMatch?.id) {
    return null;
  }

  const school = await api.getSchoolById(exactMatch.id);
  return school ?? exactMatch;
};

const fetchClassesForSchool = async (
  api: ApiHandler,
  schoolId: string,
): Promise<DirectClassRow[]> => {
  const apiSupabase = getSupabaseClientFromApi(api);
  if (apiSupabase) {
    const { data, error } = await apiSupabase
      .from('class')
      .select('id, name, group_id, whatsapp_invite_link')
      .eq('school_id', schoolId)
      .eq('is_deleted', false);

    if (!error && Array.isArray(data)) {
      return data as DirectClassRow[];
    }
  }

  const classes = await api.getClassesBySchoolId(schoolId);
  return classes.map((classRow) => ({
    id: classRow.id,
    name: classRow.name,
    group_id: classRow.group_id,
    whatsapp_invite_link: null,
  }));
};

const fetchWhatsappGroupDetails = async (
  api: ApiHandler,
  groupId: string,
  botNumber: string,
): Promise<unknown> => {
  if (
    MAYTAPI_GROUP_BASE_URL &&
    MAYTAPI_PRODUCT_ID &&
    MAYTAPI_PHONE_ID &&
    MAYTAPI_API_TOKEN
  ) {
    const url =
      `${MAYTAPI_GROUP_BASE_URL}/${MAYTAPI_PRODUCT_ID}/${MAYTAPI_PHONE_ID}` +
      `/getGroups/${groupId}?invite=true`;

    const response = await requestWithRetry(() =>
      requestWithTimeout(url, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'x-maytapi-key': MAYTAPI_API_TOKEN,
        },
      }),
    );

    try {
      const parsedResponse = await parseEndpointResponse(response);
      assertSuccessfulResponse(
        parsedResponse,
        'Failed to fetch WhatsApp group details.',
      );
      return parsedResponse.payload;
    } catch (error) {
      logParentWhatsappEvent('maytapi_fallback_to_api', {
        groupId,
        statusCode:
          error && typeof error === 'object' && 'statusCode' in error
            ? Number((error as { statusCode?: number }).statusCode)
            : undefined,
      });
    }
  }

  return api.getWhatsappGroupDetails(groupId, botNumber);
};

const ensureConfiguredUrl = (url: string, action: string): string => {
  if (!url) {
    throw buildApiError({
      message: `${action} is not configured. Add the required React env URL first.`,
    });
  }
  return url;
};

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

export const getParentWhatsappConfigStatus =
  (): ParentWhatsappConfigStatus => ({
    hasMsg91Send: Boolean(MSG91_SEND_URL),
    hasMsg91Report: Boolean(MSG91_REPORT_URL),
    hasWhatsappMediaUpload: Boolean(WHATSAPP_MEDIA_UPLOAD_URL),
    hasWhatsappTemplateSend: Boolean(WHATSAPP_TEMPLATE_SEND_URL),
  });

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
      const botNumber = String(school.whatsapp_bot_number ?? '').trim();

      if (!botNumber || !groupId) {
        continue;
      }

      try {
        const rawGroup = await fetchWhatsappGroupDetails(
          api,
          groupId,
          botNumber,
        );
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

export const fetchParentWhatsappMsg91Report = async (params: {
  startDate: string;
  endDate: string;
}): Promise<Record<string, unknown>[]> => {
  const url = ensureBrowserSafeExternalUrl(
    ensureConfiguredUrl(MSG91_REPORT_URL, 'MSG91 report'),
    'MSG91 report',
    'REACT_APP_PARENT_WA_MSG91_REPORT_URL',
  );
  const requestUrl = `${url}?startDate=${encodeURIComponent(params.startDate)}&endDate=${encodeURIComponent(params.endDate)}`;
  const response = await requestWithRetry(() =>
    requestWithTimeout(requestUrl, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        ...(MSG91_AUTHKEY ? { authkey: MSG91_AUTHKEY } : {}),
      },
      body: '',
    }),
  );

  const parsedResponse = await parseEndpointResponse(response);
  assertSuccessfulResponse(parsedResponse, 'Failed to fetch MSG91 report.');

  if (Array.isArray(parsedResponse.payload)) {
    return parsedResponse.payload as Record<string, unknown>[];
  }

  if (
    parsedResponse.payload &&
    typeof parsedResponse.payload === 'object' &&
    'data' in parsedResponse.payload &&
    Array.isArray(parsedResponse.payload.data)
  ) {
    return parsedResponse.payload.data as Record<string, unknown>[];
  }

  return parsedResponse.payload
    ? [parsedResponse.payload as Record<string, unknown>]
    : [];
};

export const sendParentWhatsappMsg91Invites = async (
  inviteRows: ParentWhatsappInviteRow[],
): Promise<ParentWhatsappSmsSendResult> => {
  const url = ensureBrowserSafeExternalUrl(
    ensureConfiguredUrl(MSG91_SEND_URL, 'MSG91 send'),
    'MSG91 send',
    'REACT_APP_PARENT_WA_MSG91_SEND_URL',
  );
  const failedBatches: ParentWhatsappSmsBatchFailure[] = [];
  let successCount = 0;

  const batches = chunkInviteRows(inviteRows, MSG91_BATCH_SIZE);

  for (const [index, batch] of batches.entries()) {
    const recipients = batch.map((row) => ({
      mobiles: row.mobile,
      var1: row.inviteLink,
    }));

    logParentWhatsappEvent('msg91_batch_send_start', {
      batchIndex: index + 1,
      batchSize: recipients.length,
    });

    try {
      const response = await requestWithRetry(() =>
        requestWithTimeout(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(MSG91_AUTHKEY ? { authkey: MSG91_AUTHKEY } : {}),
          },
          body: JSON.stringify({
            template_id: MSG91_TEMPLATE_ID,
            short_url: '1',
            recipients,
          }),
        }),
      );

      const parsedResponse = await parseEndpointResponse(response);
      assertSuccessfulResponse(parsedResponse, 'Failed to send MSG91 batch.');
      successCount += batch.length;
    } catch (error) {
      const apiError =
        error instanceof Error
          ? buildApiError({
              message: error.message,
              exceptionMessage: error.message,
            })
          : (error as ParentWhatsappApiError);

      logParentWhatsappEvent('msg91_batch_send_failed', {
        batchIndex: index + 1,
        batchSize: recipients.length,
        statusCode: apiError.statusCode,
        exceptionMessage: apiError.exceptionMessage,
      });

      failedBatches.push({
        batchIndex: index + 1,
        recipients: recipients.map((recipient) => recipient.mobiles),
        inviteRows: batch,
        error: apiError,
      });
    }
  }

  return {
    successCount,
    failedBatches,
  };
};

export const uploadParentWhatsappMedia = async (
  file: File,
): Promise<string> => {
  const url = ensureConfiguredUrl(
    WHATSAPP_MEDIA_UPLOAD_URL,
    'WhatsApp media upload',
  );
  const formData = new FormData();
  formData.append('file', file);
  formData.append('messaging_product', 'whatsapp');

  if (isDirectGraphApiUrl(url) && !WHATSAPP_ACCESS_TOKEN) {
    throw buildApiError({
      message:
        'WhatsApp access token is missing for direct Graph API media upload.',
      exceptionMessage:
        'Set REACT_APP_PARENT_WA_WHATSAPP_ACCESS_TOKEN or use a backend proxy endpoint.',
    });
  }

  const headers: Record<string, string> = {};
  if (WHATSAPP_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${WHATSAPP_ACCESS_TOKEN}`;
  }

  const response = await requestWithRetry(() =>
    requestWithTimeout(url, {
      method: 'POST',
      ...(Object.keys(headers).length > 0 ? { headers } : {}),
      body: formData,
    }),
  );

  const parsedResponse = await parseEndpointResponse(response);
  assertSuccessfulResponse(parsedResponse, 'Failed to upload WhatsApp media.');

  const payload =
    parsedResponse.payload && typeof parsedResponse.payload === 'object'
      ? (parsedResponse.payload as { id?: string; mediaId?: string })
      : null;
  const mediaId = payload?.id ?? payload?.mediaId;

  if (!mediaId) {
    throw buildApiError({
      message: 'WhatsApp media upload succeeded but no media id was returned.',
      responseText: parsedResponse.text,
    });
  }

  return mediaId;
};

export const sendParentWhatsappTemplateMessage = async (params: {
  to: string;
  templateName: string;
  templateLang: string;
  messageType: 'utility' | 'marketing';
  mediaId?: string | null;
  mediaType?: 'image' | 'video' | null;
}): Promise<void> => {
  const configuredUrl = ensureConfiguredUrl(
    WHATSAPP_TEMPLATE_SEND_URL,
    'WhatsApp template send',
  );
  const isDirectGraphApi = isDirectGraphApiUrl(configuredUrl);
  const requestUrl =
    isDirectGraphApi && params.messageType === 'marketing'
      ? configuredUrl.replace(/\/messages(\?.*)?$/i, '/marketing_messages$1')
      : configuredUrl;

  if (isDirectGraphApi && !WHATSAPP_ACCESS_TOKEN) {
    throw buildApiError({
      message:
        'WhatsApp access token is missing for direct Graph API template send.',
      exceptionMessage:
        'Set REACT_APP_PARENT_WA_WHATSAPP_ACCESS_TOKEN or use a backend proxy endpoint.',
    });
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (WHATSAPP_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${WHATSAPP_ACCESS_TOKEN}`;
  }

  const graphApiPayload: Record<string, unknown> = {
    messaging_product: 'whatsapp',
    to: params.to,
    type: 'template',
    template: {
      name: params.templateName,
      language: { code: params.templateLang },
    },
  };

  if (params.mediaId && params.mediaType) {
    graphApiPayload.template = {
      ...(graphApiPayload.template as Record<string, unknown>),
      components: [
        {
          type: 'header',
          parameters: [
            {
              type: params.mediaType,
              [params.mediaType]: {
                id: params.mediaId,
              },
            },
          ],
        },
      ],
    };
  }

  const response = await requestWithRetry(() =>
    requestWithTimeout(requestUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(isDirectGraphApi ? graphApiPayload : params),
    }),
  );

  const parsedResponse = await parseEndpointResponse(response);
  assertSuccessfulResponse(
    parsedResponse,
    'Failed to send WhatsApp template message.',
  );
};
