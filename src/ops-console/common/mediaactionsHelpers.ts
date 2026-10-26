import type { MediaUploadItem } from './mediaactions.types';

export const MAX_VIDEO_UPLOAD_MB = 25;
export const MAX_VIDEO_UPLOAD_BYTES = MAX_VIDEO_UPLOAD_MB * 1024 * 1024;

export const inferMediaType = (file: File): MediaUploadItem['mediaType'] => {
  const type = (file.type || '').toLowerCase();
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';

  const name = (file.name || '').toLowerCase();
  const ext = name.includes('.') ? (name.split('.').pop() ?? '') : '';
  const imageExts = new Set([
    'jpg',
    'jpeg',
    'png',
    'webp',
    'gif',
    'bmp',
    'heic',
    'heif',
    'avif',
    'tif',
    'tiff',
    'svg',
  ]);
  const videoExts = new Set([
    'mp4',
    'mov',
    'm4v',
    'webm',
    'mkv',
    'avi',
    '3gp',
    '3gpp',
    '3g2',
    'ogg',
    'ogv',
  ]);
  if (imageExts.has(ext)) return 'image';
  if (videoExts.has(ext)) return 'video';
  return 'file';
};

const createShortId = () => {
  const maybeUuid = globalThis.crypto?.randomUUID?.();
  if (maybeUuid) return maybeUuid.replace(/-/g, '').slice(0, 5);
  return Math.random().toString(36).slice(2, 7);
};

export const createMediaId = () => {
  const maybeUuid = globalThis.crypto?.randomUUID?.();
  if (maybeUuid) return maybeUuid;
  return `media-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const getFileExtension = (file: File) => {
  const type = (file.type || '').toLowerCase();
  if (type === 'image/jpeg') return 'jpg';
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  if (type === 'image/heic') return 'heic';
  if (type === 'image/heif') return 'heif';
  if (type === 'image/avif') return 'avif';
  if (type === 'image/gif') return 'gif';
  if (type === 'video/mp4') return 'mp4';
  if (type === 'video/webm') return 'webm';
  if (type === 'video/quicktime') return 'mov';
  if (type === 'video/x-matroska') return 'mkv';
  if (type === 'video/3gpp') return '3gp';
  if (type === 'video/ogg') return 'ogv';

  const fromName =
    file.name && file.name.includes('.')
      ? (file.name.split('.').pop() ?? '').toLowerCase()
      : '';
  const safeFromName = fromName.replace(/[^a-z0-9]/g, '');
  return safeFromName || 'bin';
};

export const renameFileForUpload = (file: File, schoolId?: string) => {
  const safeSchoolId = (schoolId || 'schoolid').replace(/[^a-z0-9_-]/gi, '-');
  const shortId = createShortId();
  const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const ext = getFileExtension(file);
  const nextName = `${safeSchoolId}_${shortId}_${dateStr}.${ext}`;
  return new File([file], nextName, {
    type: file.type,
    lastModified: file.lastModified,
  });
};
