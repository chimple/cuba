import { ApiHandler } from '../../../../services/api/ApiHandler';
import {
  buildApiError,
  chunkInviteRows,
  logParentWhatsappEvent,
  MSG91_BATCH_SIZE,
} from './parentWhatsappHelpers';
import type {
  ParentWhatsappInviteRow,
  ParentWhatsappSmsBatchFailure,
  ParentWhatsappSmsSendResult,
} from './parentWhatsappTypes';

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

  const payloadData = payload?.data;
  if (Array.isArray(payloadData)) {
    return payloadData as Record<string, unknown>[];
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

export const sendParentWhatsappMsg91Invites = async (
  api: ApiHandler,
  inviteRows: ParentWhatsappInviteRow[],
  languageCode: string,
): Promise<ParentWhatsappSmsSendResult> => {
  if (!inviteRows.length) {
    return {
      successCount: 0,
      failedBatches: [],
    };
  }

  const rpcPayload = await api.getParentWhatsappMsg91SendResult(
    inviteRows,
    languageCode,
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
  const payloadFailedBatches = payload?.failedBatches;
  const rawFailedBatches: unknown[] = Array.isArray(payloadFailedBatches)
    ? payloadFailedBatches
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
    const failureRecipients = failure?.recipients;
    const recipients = Array.isArray(failureRecipients)
      ? failureRecipients.map((recipient) => String(recipient))
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
