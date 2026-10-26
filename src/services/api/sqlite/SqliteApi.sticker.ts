import { Capacitor } from '@capacitor/core';
import { v4 as uuidv4 } from 'uuid';
import { MUTATE_TYPES, TABLES, TableTypes } from '../../../common/constants';
import {
  StickerBook,
  StickerMeta,
  UserStickerProgress,
} from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import { ensureLocalStickerBookSvgUri } from '../../../utility/stickerBookAssets';
import { ServiceConfig } from '../../ServiceConfig';
import { SqliteApiRewards } from './SqliteApi.rewards';

export interface SqliteApiSticker {
  [key: string]: any;
}
export class SqliteApiSticker extends SqliteApiRewards {
  // ================================
  // STICKER BOOK (SQLite-first reads, local writes)
  // ================================

  async getAllStickerBooks(): Promise<StickerBook[]> {
    await this.ensureInitialized();
    if (!this._db) return [];

    try {
      const res = await this._db.query(
        `SELECT * FROM ${TABLES.StickerBook} WHERE is_deleted = 0 ORDER BY sort_index ASC`,
      );
      const books = (res?.values ?? []).map((row: any) =>
        this.mapStickerBookRow(row),
      );
      return await Promise.all(
        books.map((book: any) => this.resolveStickerBookAssets(book)),
      );
    } catch (error) {
      logger.error('Error fetching sticker books from sqlite:', error);
      return [];
    }
  }

  async getCurrentStickerBookWithProgress(userId: string): Promise<{
    book: StickerBook;
    progress: UserStickerProgress | null;
  } | null> {
    await this.ensureInitialized();
    if (!this._db) return null;

    try {
      const progressRes = await this._db.query(
        `SELECT * FROM ${TABLES.UserStickerBook}
         WHERE user_id = ? AND status = ? AND is_deleted = 0
         LIMIT 1`,
        [userId, 'in_progress'],
      );

      const activeProgress = progressRes?.values?.[0];
      if (activeProgress) {
        const progress = this.mapUserStickerBookRow(activeProgress);
        const bookRes = await this._db.query(
          `SELECT * FROM ${TABLES.StickerBook}
           WHERE id = ? AND is_deleted = 0
           LIMIT 1`,
          [progress.sticker_book_id],
        );
        const activeBook = bookRes?.values?.[0];
        if (activeBook) {
          return {
            book: await this.resolveStickerBookAssets(
              this.mapStickerBookRow(activeBook),
            ),
            progress,
          };
        }
      }

      const completedRes = await this._db.query(
        `SELECT sticker_book_id FROM ${TABLES.UserStickerBook}
         WHERE user_id = ? AND status = ? AND is_deleted = 0`,
        [userId, 'completed'],
      );
      const completedBookIds: string[] = Array.from(
        new Set(
          (completedRes?.values ?? [])
            .map((row: any) => row.sticker_book_id as string | undefined)
            .filter((id: string | undefined): id is string => Boolean(id)),
        ),
      );

      let query = `SELECT * FROM ${TABLES.StickerBook} WHERE is_deleted = 0`;
      const params: string[] = [];
      if (completedBookIds.length > 0) {
        query += ` AND id NOT IN (${completedBookIds.map(() => '?').join(', ')})`;
        params.push(...completedBookIds);
      }
      query += ` ORDER BY sort_index ASC LIMIT 1`;

      const nextBookRes = await this._db.query(query, params);
      const nextBookRow = nextBookRes?.values?.[0];
      if (!nextBookRow) return null;

      return {
        book: await this.resolveStickerBookAssets(
          this.mapStickerBookRow(nextBookRow),
        ),
        progress: null,
      };
    } catch (error) {
      logger.error('Error fetching active sticker book from sqlite:', error);
      return null;
    }
  }

  async getUserWonStickerBooks(userId: string): Promise<StickerBook[]> {
    await this.ensureInitialized();
    if (!this._db) return [];

    try {
      const res = await this._db.query(
        `SELECT sb.*
         FROM ${TABLES.StickerBook} sb
         INNER JOIN ${TABLES.UserStickerBook} usb
           ON sb.id = usb.sticker_book_id
         WHERE usb.user_id = ?
           AND usb.status = ?
           AND usb.is_deleted = 0
           AND sb.is_deleted = 0
         ORDER BY sb.sort_index ASC`,
        [userId, 'completed'],
      );
      const books = (res?.values ?? []).map((row: any) =>
        this.mapStickerBookRow(row),
      );
      return await Promise.all(
        books.map((book: any) => this.resolveStickerBookAssets(book)),
      );
    } catch (error) {
      logger.error(
        'Error fetching completed sticker books from sqlite:',
        error,
      );
      return [];
    }
  }

  async getNextWinnableSticker(
    stickerBookId: string,
    userId?: string,
  ): Promise<string | null> {
    await this.ensureInitialized();
    if (!this._db) return null;

    const resolvedUserId = userId?.trim();
    let effectiveUserId = resolvedUserId;
    if (!effectiveUserId) {
      const user = await ServiceConfig.getI().authHandler.getCurrentUser();
      if (!user?.id) return null;
      effectiveUserId = user.id;
    }

    try {
      const bookRes = await this._db.query(
        `SELECT * FROM ${TABLES.StickerBook}
         WHERE id = ? AND is_deleted = 0
         LIMIT 1`,
        [stickerBookId],
      );
      const bookRow = bookRes?.values?.[0];
      if (!bookRow) return null;

      const progressRes = await this._db.query(
        `SELECT * FROM ${TABLES.UserStickerBook}
         WHERE user_id = ? AND sticker_book_id = ? AND is_deleted = 0
         LIMIT 1`,
        [effectiveUserId, stickerBookId],
      );
      const book = this.mapStickerBookRow(bookRow);
      const progressRow = progressRes?.values?.[0];
      const progress = progressRow
        ? this.mapUserStickerBookRow(progressRow)
        : null;
      const collected = progress?.stickers_collected ?? [];
      const sorted = [...(book.stickers_metadata ?? [])].sort(
        (a: StickerMeta, b: StickerMeta) => a.sequence - b.sequence,
      );
      const next = sorted.find((sticker) => !collected.includes(sticker.id));
      return next?.id ?? null;
    } catch (error) {
      logger.error('Error fetching next sticker from sqlite:', error);
      return null;
    }
  }

  async updateStickerWon(
    stickerBookId: string,
    stickerId: string,
    userId?: string,
  ): Promise<void> {
    await this.ensureInitialized();
    if (!this._db) return;

    const resolvedUserId = userId?.trim();
    let effectiveUserId = resolvedUserId;
    if (!effectiveUserId) {
      const user = await ServiceConfig.getI().authHandler.getCurrentUser();
      if (!user?.id) return;
      effectiveUserId = user.id;
    }

    try {
      const bookRes = await this._db.query(
        `SELECT * FROM ${TABLES.StickerBook}
         WHERE id = ? AND is_deleted = 0
         LIMIT 1`,
        [stickerBookId],
      );
      const bookRow = bookRes?.values?.[0];
      if (!bookRow) return;

      const progressRes = await this._db.query(
        `SELECT * FROM ${TABLES.UserStickerBook}
         WHERE user_id = ? AND sticker_book_id = ? AND is_deleted = 0
         LIMIT 1`,
        [effectiveUserId, stickerBookId],
      );
      const book = this.mapStickerBookRow(bookRow);
      const total = book.total_stickers || book.stickers_metadata?.length || 0;
      const progressRow = progressRes?.values?.[0];
      const progress = progressRow
        ? this.mapUserStickerBookRow(progressRow)
        : null;

      if (!progress) {
        const id = uuidv4();
        const stickersCollected = [stickerId];
        const status = total === 1 ? 'completed' : 'in_progress';
        const createdAt = new Date().toISOString();

        await this.executeQuery(
          `INSERT INTO ${TABLES.UserStickerBook}
            (id, user_id, sticker_book_id, stickers_collected, status, created_at, is_seen, is_deleted)
           VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
          [
            id,
            effectiveUserId,
            stickerBookId,
            JSON.stringify(stickersCollected),
            status,
            createdAt,
            0,
          ],
        );

        await this.updatePushChanges(
          TABLES.UserStickerBook,
          MUTATE_TYPES.INSERT,
          {
            id,
            user_id: effectiveUserId,
            sticker_book_id: stickerBookId,
            stickers_collected: stickersCollected,
            status,
            created_at: createdAt,
            is_seen: false,
            is_deleted: false,
          },
        );
        return;
      }

      const currentCollected = progress.stickers_collected ?? [];
      const updated = currentCollected.includes(stickerId)
        ? currentCollected
        : [...currentCollected, stickerId];
      const status =
        total > 0 && updated.length >= total ? 'completed' : progress.status;

      if (
        updated.length === currentCollected.length &&
        status === progress.status
      ) {
        return;
      }

      await this.executeQuery(
        `UPDATE ${TABLES.UserStickerBook}
         SET stickers_collected = ?, status = ?, is_seen = ?
         WHERE id = ? AND is_deleted = 0`,
        [JSON.stringify(updated), status, 0, progress.id],
      );

      await this.updatePushChanges(
        TABLES.UserStickerBook,
        MUTATE_TYPES.UPDATE,
        {
          id: progress.id,
          user_id: progress.user_id,
          sticker_book_id: progress.sticker_book_id,
          stickers_collected: updated,
          status,
          is_seen: false,
        },
      );
    } catch (error) {
      logger.error('Error updating sticker progress in sqlite:', error);
    }
  }

  async getStickersByIds(ids: string[]): Promise<TableTypes<'sticker'>[]> {
    await this.ensureInitialized();
    if (ids.length === 0) return [];

    const quotedIds = ids.map((id: any) => `"${id}"`).join(`, `);
    try {
      const res = await this._db?.query(
        `select * FROM ${TABLES.Sticker} WHERE id IN (${quotedIds})`,
      );
      if (!res || !res.values || res.values.length < 1) return [];
      return res.values;
    } catch (error) {
      logger.error('Error fetching stickers by IDs:', error);
      return [];
    }
  }

  async getUserSticker(userId: string): Promise<TableTypes<'user_sticker'>[]> {
    await this.ensureInitialized();
    try {
      const query = `select * from ${TABLES.UserSticker} where user_id = "${userId}"`;
      const data = await this._db?.query(query);

      if (!data || !data.values || data.values.length === 0) {
        logger.warn('No sticker found for the given user id.');
        return [];
      }

      const periodData = data.values;
      return periodData;
    } catch (error) {
      logger.error('Error fetching sticker by user ID:', error);
      return [];
    }
  }

  async getUserStickerBook(
    userId: string,
  ): Promise<TableTypes<'user_sticker_book'>[]> {
    await this.ensureInitialized();
    try {
      const query = `select * from ${TABLES.UserStickerBook} where user_id = "${userId}" AND is_deleted = 0`;
      const data = await this._db?.query(query);

      if (!data || !data.values || data.values.length === 0) {
        logger.warn('No sticker found for the given user id.');
        return [];
      }

      const periodData = data.values;
      return periodData;
    } catch (error) {
      logger.error('Error fetching sticker by user ID:', error);
      return [];
    }
  }

  private parseSqliteJsonArray<T>(value: unknown): T[] {
    if (Array.isArray(value)) return value as T[];
    if (typeof value !== 'string') return [];

    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed as T[];
      if (typeof parsed === 'string' && parsed.trim() !== trimmed) {
        return this.parseSqliteJsonArray<T>(parsed);
      }
    } catch {
      // Fall back below for legacy/comma-separated rows.
    }

    const commaSeparated = trimmed
      .split(',')
      .map((item: any) => item.trim().replace(/^"(.*)"$/, '$1'))
      .filter(Boolean);
    return commaSeparated as T[];
  }

  private mapStickerBookRow(row: any): StickerBook {
    return {
      ...row,
      sort_index: Number(row?.sort_index ?? 0),
      total_stickers: Number(row?.total_stickers ?? 0),
      stickers_metadata: this.parseSqliteJsonArray<StickerMeta>(
        row?.stickers_metadata,
      ),
    };
  }

  private async resolveStickerBookAssets(
    book: StickerBook,
  ): Promise<StickerBook> {
    if (!book?.svg_url) return book;

    try {
      const localSvgUri = await ensureLocalStickerBookSvgUri(book.svg_url);
      return { ...book, svg_url: localSvgUri };
    } catch (error) {
      logger.warn(
        '[StickerBook] Failed to resolve local sticker book svg uri',
        {
          bookId: book.id,
          error,
        },
      );
      return book;
    }
  }

  private async prefetchStickerBookAssetsAfterSync(): Promise<void> {
    if (!this._db || !Capacitor.isNativePlatform()) return;

    try {
      const booksToPrefetch: StickerBook[] = [];
      const currentStudentId = this.currentStudent?.id;

      if (currentStudentId) {
        const current =
          await this.getCurrentStickerBookWithProgress(currentStudentId);
        if (current?.book) {
          booksToPrefetch.push(current.book);
        }
      }

      const allBooks = await this.getAllStickerBooks();
      for (const book of allBooks) {
        if (!booksToPrefetch.some((existing) => existing.id === book.id)) {
          booksToPrefetch.push(book);
        }
      }

      for (const book of booksToPrefetch) {
        if (!book?.svg_url) continue;
        await ensureLocalStickerBookSvgUri(book.svg_url);
      }
    } catch (error) {
      logger.warn(
        '[StickerBook] Failed to prefetch sticker book assets after sync',
        error,
      );
    }
  }

  private mapUserStickerBookRow(row: any): UserStickerProgress {
    return {
      id: row.id,
      user_id: row.user_id,
      sticker_book_id: row.sticker_book_id,
      stickers_collected: this.parseSqliteJsonArray<string>(
        row?.stickers_collected,
      ),
      status: row.status,
    };
  }

  async markStciekercolledasTrue(userId: string): Promise<void> {
    await this.ensureInitialized();
    try {
      const updatedAt = new Date().toISOString();

      const rowsToUpdateQuery = `SELECT id FROM ${TABLES.UserStickerBook}
        WHERE user_id = ? AND is_deleted = 0 AND (is_seen = 0 OR is_seen IS NULL)`;
      const rowsToUpdate = await this._db?.query(rowsToUpdateQuery, [userId]);
      const rowIds =
        rowsToUpdate?.values
          ?.map((row: { id?: string }) => row.id)
          .filter((id: string | undefined): id is string => Boolean(id)) ?? [];

      if (!rowIds.length) {
        return;
      }

      const query = `UPDATE ${TABLES.UserStickerBook}
        SET is_seen = 1, updated_at = ?
        WHERE user_id = ? AND is_deleted = 0 AND (is_seen = 0 OR is_seen IS NULL)`;
      await this.executeQuery(query, [updatedAt, userId]);

      for (const id of rowIds) {
        await this.updatePushChanges(
          TABLES.UserStickerBook,
          MUTATE_TYPES.UPDATE,
          {
            id,
            user_id: userId,
            is_seen: true,
            updated_at: updatedAt,
          },
        );
      }
    } catch (error) {
      logger.warn('Failed to update stickers as seen on server:', error);
    }
  }
}
