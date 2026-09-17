import { MUTATE_TYPES, TABLES, TableTypes } from '../../../common/constants';
import { v4 as uuidv4 } from 'uuid';
import { nextBadgeProgress } from '../../../common/Badges/badgeProgress';
import logger from '../../../utility/logger';
import { SqliteApiOpsLearningPath } from './SqliteApi.ops.learningPath';

export interface SqliteApiRewards {
  [key: string]: any;
}
export class SqliteApiRewards extends SqliteApiOpsLearningPath {
  async getUserBadgeProgress(
    userId: string,
  ): Promise<TableTypes<'user_badge_progress'> | undefined> {
    await this.ensureInitialized();
    try {
      const result = await this._db?.query(
        `SELECT * FROM ${TABLES.UserBadgeProgress} WHERE user_id = ? AND is_deleted = 0 LIMIT 1`,
        [userId],
      );
      const progress = result?.values?.[0] as
        | TableTypes<'user_badge_progress'>
        | undefined;
      return progress;
    } catch (error) {
      throw error;
    }
  }

  async recordBadgeLessonCompletion(userId: string): Promise<{
    progress: TableTypes<'user_badge_progress'>;
    milestoneReached: number | null;
  }> {
    await this.ensureInitialized();
    const existing = await this.getUserBadgeProgress(userId);
    // Persist locally first; the shared sync queue uploads this snapshot when available.
    const { progress: nextProgress, milestoneReached } =
      nextBadgeProgress(existing);
    const count = nextProgress.lessons_played_count;
    const now = new Date().toISOString();
    const progress = {
      id: existing?.id ?? uuidv4(),
      user_id: userId,
      lessons_played_count: count,
      latest_badge_milestone: nextProgress.latest_badge_milestone,
      has_unseen_badge: false,
      created_at: existing?.created_at ?? now,
      updated_at: now,
      is_deleted: false,
    } as TableTypes<'user_badge_progress'>;

    await this.executeQuery(
      `INSERT OR REPLACE INTO ${TABLES.UserBadgeProgress} (id, user_id, lessons_played_count, latest_badge_milestone, has_unseen_badge, created_at, updated_at, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        progress.id,
        progress.user_id,
        progress.lessons_played_count,
        progress.latest_badge_milestone,
        0,
        progress.created_at,
        progress.updated_at,
        0,
      ],
    );
    await this.updatePushChanges(
      TABLES.UserBadgeProgress,
      existing ? MUTATE_TYPES.UPDATE : MUTATE_TYPES.INSERT,
      progress,
    );
    return { progress, milestoneReached };
  }

  async getBadgesByIds(ids: string[]): Promise<TableTypes<'badge'>[]> {
    await this.ensureInitialized();
    if (ids.length === 0) return [];

    const quotedIds = ids.map((id: any) => `"${id}"`).join(', ');
    try {
      const res = await this._db?.query(
        `SELECT * FROM ${TABLES.Badge} WHERE id IN (${quotedIds})`,
      );
      if (!res || !res.values || res.values.length < 1) return [];

      return res.values;
    } catch (error) {
      logger.error('Error fetching badges by IDs:', error);
      return [];
    }
  }
  async getBonusesByIds(ids: string[]): Promise<TableTypes<'lesson'>[]> {
    await this.ensureInitialized();
    if (ids.length === 0) return [];

    const quotedIds = ids.map((id: any) => `"${id}"`).join(`, `);
    try {
      const res = await this._db?.query(
        `select * FROM ${TABLES.Lesson} WHERE id IN (${quotedIds})`,
      );
      if (!res || !res.values || res.values.length < 1) return [];
      return res.values;
    } catch (error) {
      logger.error('Error fetching stickers by IDs:', error);
      return [];
    }
  }
  async getRewardsById(
    id: number,
    periodType: string,
  ): Promise<TableTypes<'reward'> | undefined> {
    await this.ensureInitialized();
    try {
      const query = `SELECT ${periodType} FROM ${TABLES.Reward} WHERE year = ${id}`;
      const data = await this._db?.query(query);
      if (!data || !data.values || data.values.length === 0) {
        logger.error('No reward found for the given year.');
        return;
      }
      const periodData = JSON.parse(data.values[0][periodType]);
      try {
        if (periodData) return periodData;
      } catch (parseError) {
        logger.error('Error parsing JSON string:', parseError);
        return undefined;
      }
    } catch (error) {
      logger.error('Error fetching reward by ID:', error);
      return undefined;
    }
  }
  async getUserBadge(userId: string): Promise<TableTypes<'user_badge'>[]> {
    await this.ensureInitialized();
    try {
      const query = `select * from ${TABLES.UserBadge} where user_id = "${userId}"`;
      const data = await this._db?.query(query);

      if (!data || !data.values || data.values.length === 0) {
        logger.error('No badge found for the given user id.');
        return [];
      }

      const periodData = data.values;
      return periodData;
    } catch (error) {
      logger.error('Error fetching user bade by user iD:', error);
      return [];
    }
  }

  async getUserBonus(userId: string): Promise<TableTypes<'user_bonus'>[]> {
    await this.ensureInitialized();
    try {
      const query = `select * from ${TABLES.UserBonus} where user_id = "${userId}"`;
      const data = await this._db?.query(query);

      if (!data || !data.values || data.values.length === 0) {
        logger.error('No bonus found for the given user id.');
        return [];
      }

      const periodData = data.values;
      return periodData;
    } catch (error) {
      logger.error('Error fetching bonus by user ID:', error);
      return [];
    }
  }

  async updateRewardAsSeen(studentId: string): Promise<void> {
    await this.ensureInitialized();
    try {
      const query = `UPDATE ${TABLES.UserSticker} SET is_seen = true WHERE user_id = "${studentId}" AND is_seen = false`;
      await this._db?.query(query);
    } catch (error) {
      logger.error('Error updating rewards as seen:', error);
      throw new Error('Error updating rewards as seen.');
    }
  }
}
