import { ApiHandlerWhatsApp } from './ApiHandler.whatsapp';
import {
  StickerBook,
  UserStickerProgress,
} from '../../../interface/modelInterfaces';

export class ApiHandlerStickerBooks extends ApiHandlerWhatsApp {
  async getAllStickerBooks(): Promise<StickerBook[]> {
    return await this.s.getAllStickerBooks();
  }

  async getCurrentStickerBookWithProgress(userId: string): Promise<{
    book: StickerBook;
    progress: UserStickerProgress | null;
  } | null> {
    return await this.s.getCurrentStickerBookWithProgress(userId);
  }

  async getUserWonStickerBooks(userId: string): Promise<StickerBook[]> {
    return await this.s.getUserWonStickerBooks(userId);
  }

  async getNextWinnableSticker(
    stickerBookId: string,
    userId?: string,
  ): Promise<string | null> {
    return await this.s.getNextWinnableSticker(stickerBookId, userId);
  }

  async updateStickerWon(
    stickerBookId: string,
    stickerId: string,
    userId: string,
  ): Promise<void> {
    return await this.s.updateStickerWon(stickerBookId, stickerId, userId);
  }

  async isSplUser(): Promise<boolean> {
    return await this.s.isSplUser();
  }
}
