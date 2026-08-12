import { ApiHandler } from '../../../../services/api/ApiHandler';
import { buildApiError, fileToBase64 } from './parentWhatsappHelpers';

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
