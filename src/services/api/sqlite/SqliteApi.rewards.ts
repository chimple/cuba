import { TABLES, TableTypes } from '../../../common/constants';
import logger from '../../../utility/logger';
import { SqliteApiOps } from './SqliteApi.ops';

export interface SqliteApiRewards {
  [key: string]: any;
}
export class SqliteApiRewards extends SqliteApiOps {
  async getBadgesByIds(ids: string[]): Promise<TableTypes<'badge'>[]> {
    await this.ensureInitialized();
    if (ids.length === 0) return [];

    const quotedIds = ids.map((id) => `"${id}"`).join(', ');
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

    const quotedIds = ids.map((id) => `"${id}"`).join(`, `);
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
