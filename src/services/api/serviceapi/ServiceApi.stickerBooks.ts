import {
  StickerBook,
  UserStickerProgress,
} from '../../../interface/modelInterfaces';

export interface ServiceApiStickerBooks {
  getAllStickerBooks(): Promise<StickerBook[]>;

  getCurrentStickerBookWithProgress(userId: string): Promise<{
    book: StickerBook;
    progress: UserStickerProgress | null;
  } | null>;

  getUserWonStickerBooks(userId: string): Promise<StickerBook[]>;

  getNextWinnableSticker(
    stickerBookId: string,
    userId?: string,
  ): Promise<string | null>;

  updateStickerWon(
    stickerBookId: string,
    stickerId: string,
    userId: string,
  ): Promise<void>;

  isSplUser(): Promise<boolean>;
}
