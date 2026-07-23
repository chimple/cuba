export interface StickerBookModalData {
  source: 'learning_pathway' | 'homework_pathway';
  stickerBookId: string;
  stickerBookTitle: string;
  stickerBookSvgUrl: string;
  collectedStickerIds: string[];
  nextStickerId?: string;
  nextStickerName?: string;
  nextStickerImage?: string;
  totalStickerCount?: number;
}

export type StickerBookPreviewVariant = 'preview' | 'drag_collect';
export type StickerBookPreviewMode = 'preview' | 'completion';

export const fallbackStickerBookLayoutUrl =
  'https://aeakbcdznktpsbrfsgys.supabase.co/storage/v1/object/public/sticker-books/newWhole_layout.svg';

export const STICKER_DROP_SUCCESS_AUDIO_URL =
  '/assets/audios/common/crowd_cheer.mp3';
