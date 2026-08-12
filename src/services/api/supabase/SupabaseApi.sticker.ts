import { SupabaseApiRewards } from './SupabaseApi.rewards';
import { TABLES, TableTypes } from '../../../common/constants';
import {
  StickerBook,
  StickerMeta,
  UserStickerProgress,
} from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import { ServiceConfig } from '../../ServiceConfig';

const mapStickerBookRow = (book: TableTypes<'sticker_book'>): StickerBook => ({
  id: book.id,
  title: book.title,
  svg_url: book.svg_url,
  sort_index: book.sort_index,
  stickers_metadata: Array.isArray(book.stickers_metadata)
    ? (book.stickers_metadata as unknown as StickerMeta[])
    : [],
  total_stickers: book.total_stickers,
});

export interface SupabaseApiSticker {
  [key: string]: any;
}
export class SupabaseApiSticker extends SupabaseApiRewards {
  async getAllStickerBooks(): Promise<StickerBook[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from('sticker_book')
      .select('*')
      .eq('is_deleted', false)
      .order('sort_index', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(mapStickerBookRow);
  }

  async getCurrentStickerBookWithProgress(userId: string): Promise<{
    book: StickerBook;
    progress: UserStickerProgress | null;
  } | null> {
    if (!this.supabase) return null;

    // 1️⃣ Try existing in_progress row
    const { data: progress } = await this.supabase
      .from('user_sticker_book')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .or('is_deleted.is.false,is_deleted.is.null')
      .maybeSingle();

    // 2️⃣ If user already has active progress
    if (progress) {
      const { data: book } = await this.supabase
        .from('sticker_book')
        .select('*')
        .eq('id', progress.sticker_book_id)
        .eq('is_deleted', false)
        .single();

      if (!book) return null;

      return {
        book: mapStickerBookRow(book),
        progress: progress as UserStickerProgress,
      };
    }

    // 3️⃣ No active row → pick the first unfinished book by sort_index.
    const { data: completedRows } = await this.supabase
      .from('user_sticker_book')
      .select('sticker_book_id')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .or('is_deleted.is.false,is_deleted.is.null');

    const completedBookIds = Array.from(
      new Set(
        (completedRows ?? [])
          .map((row: any) => row.sticker_book_id)
          .filter(Boolean),
      ),
    );

    let nextBookQuery = this.supabase
      .from('sticker_book')
      .select('*')
      .eq('is_deleted', false)
      .order('sort_index', { ascending: true })
      .limit(1);

    if (completedBookIds.length > 0) {
      nextBookQuery = nextBookQuery.not(
        'id',
        'in',
        `(${completedBookIds.map((id) => `"${id}"`).join(',')})`,
      );
    }

    const { data: nextBooks } = await nextBookQuery;
    const nextBook = nextBooks?.[0];

    if (nextBook) {
      return {
        book: mapStickerBookRow(nextBook),
        progress: null,
      };
    }

    // 4️⃣ All books are completed → no active sticker book remains.
    return null;
  }

  async getUserWonStickerBooks(userId: string): Promise<StickerBook[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from('user_sticker_book')
      .select(
        `
      *,
      sticker_book (*)
    `,
      )
      .eq('user_id', userId)
      .eq('status', 'completed')
      .or('is_deleted.is.false,is_deleted.is.null')
      .eq('sticker_book.is_deleted', false);

    if (error) {
      logger.error('getUserWonStickerBooks error:', error);
      return [];
    }

    const rows = (data ?? []) as Array<{
      sticker_book: TableTypes<'sticker_book'> | null;
    }>;

    return rows
      .map((row) => row.sticker_book)
      .filter((book): book is TableTypes<'sticker_book'> => Boolean(book))
      .map(mapStickerBookRow);
  }
  async getStickersByIds(ids: string[]): Promise<TableTypes<'sticker'>[]> {
    if (!this.supabase || ids.length === 0) return [];

    const { data, error } = await this.supabase
      .from('sticker')
      .select('*')
      .in('id', ids)
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error fetching stickers by IDs:', error);
      return [];
    }

    return data ?? [];
  }
  async getUserSticker(userId: string): Promise<TableTypes<'user_sticker'>[]> {
    if (!this.supabase) return [];

    try {
      const { data, error } = await this.supabase
        .from('user_sticker')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        logger.error('Error fetching stickers by user ID:', error);
        return [];
      }

      if (!data || data.length === 0) {
        logger.warn('No sticker found for the given user id.');
        return [];
      }

      return data;
    } catch (error) {
      logger.error('Unexpected error in getUserSticker:', error);
      return [];
    }
  }

  async getUserStickerBook(
    userId: string,
  ): Promise<TableTypes<'user_sticker_book'>[]> {
    if (!this.supabase) return [];

    try {
      const { data, error } = await this.supabase
        .from('user_sticker_book')
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', false);

      if (error) {
        logger.error('Error fetching sticker books by user ID:', error);
        return [];
      }

      if (!data || data.length === 0) {
        logger.warn('No sticker book found for the given user id.');
        return [];
      }

      return data.map((row) => {
        const rawCollected = row.stickers_collected;
        let stickersCollected: string[] = [];
        if (Array.isArray(rawCollected)) {
          stickersCollected = rawCollected.filter(
            (value): value is string => typeof value === 'string',
          );
        } else if (typeof rawCollected === 'string') {
          try {
            const parsed = JSON.parse(rawCollected);
            if (Array.isArray(parsed)) {
              stickersCollected = parsed.filter(
                (value): value is string => typeof value === 'string',
              );
            }
          } catch {
            stickersCollected = [];
          }
        }

        return {
          ...row,
          stickers_collected: stickersCollected,
        };
      }) as TableTypes<'user_sticker_book'>[];
    } catch (error) {
      logger.error('Unexpected error in getUserStickerBook:', error);
      return [];
    }
  }

  async getNextWinnableSticker(
    stickerBookId: string,
    userId?: string,
  ): Promise<string | null> {
    if (!this.supabase) return null;

    const resolvedUserId = userId?.trim();
    let effectiveUserId = resolvedUserId;
    if (!effectiveUserId) {
      const user = await ServiceConfig.getI().authHandler.getCurrentUser();
      if (!user?.id) return null;
      effectiveUserId = user.id;
    }

    const { data: book } = await this.supabase
      .from('sticker_book')
      .select('*')
      .eq('id', stickerBookId)
      .eq('is_deleted', false)
      .single();

    if (!book) return null;

    const { data: progress } = await this.supabase
      .from('user_sticker_book')
      .select('*')
      .eq('user_id', effectiveUserId)
      .eq('sticker_book_id', stickerBookId)
      .or('is_deleted.is.false,is_deleted.is.null')
      .maybeSingle();

    const collected = progress?.stickers_collected ?? [];

    const sorted = [...mapStickerBookRow(book).stickers_metadata].sort(
      (a: StickerMeta, b: StickerMeta) => a.sequence - b.sequence,
    );

    const next = sorted.find((s: any) => !collected.includes(s.id));

    return next?.id ?? null;
  }

  async updateStickerWon(
    stickerBookId: string,
    stickerId: string,
    userId: string,
  ): Promise<void> {
    if (!this.supabase) return;
    if (!userId?.trim()) return;

    // get book
    const { data: book } = await this.supabase
      .from('sticker_book')
      .select('*')
      .eq('id', stickerBookId)
      .eq('is_deleted', false)
      .single();

    if (!book) return;

    const total = book.total_stickers;

    const { data: progress } = await this.supabase
      .from('user_sticker_book')
      .select('*')
      .eq('user_id', userId)
      .eq('sticker_book_id', stickerBookId)
      .or('is_deleted.is.false,is_deleted.is.null')
      .maybeSingle();

    // create
    if (!progress) {
      const status = total === 1 ? 'completed' : 'in_progress';

      await this.supabase.from('user_sticker_book').insert({
        user_id: userId,
        sticker_book_id: stickerBookId,
        stickers_collected: [stickerId],
        status,
        is_seen: false,
        is_deleted: false,
      });

      return;
    }

    let updated = progress.stickers_collected ?? [];
    updated = updated.includes(stickerId) ? updated : [...updated, stickerId];

    let status = progress.status;

    if (updated.length === total) {
      status = 'completed';
    }

    await this.supabase
      .from('user_sticker_book')
      .update({
        stickers_collected: updated,
        status,
        is_seen: false,
        is_deleted: false,
      })
      .eq('id', progress.id)
      .or('is_deleted.is.false,is_deleted.is.null');
  }

  async markAllStickersAsSeen(userId: string): Promise<void> {
    if (!this.supabase) return;

    try {
      const { error } = await this.supabase
        .from(TABLES.UserStickerBook)
        .update({ is_seen: true })
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .or('is_seen.eq.false,is_seen.is.null');

      if (error) {
        logger.error('Error updating stickers as seen:', error);
        throw new Error('Error updating stickers as seen.');
      }
    } catch (err) {
      logger.error('Unexpected error updating stickers as seen:', err);
      throw new Error('Unexpected error updating stickers as seen.');
    }
  }

  async markStciekercolledasTrue(userId: string): Promise<void> {
    await this.markAllStickersAsSeen(userId);
  }
}
