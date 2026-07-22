import { SupabaseApiProgramSchoolStats } from './SupabaseApi.program.schoolStats';
import { TABLES, TableTypes } from '../../../common/constants';
import logger from '../../../utility/logger';

export interface SupabaseApiRewards {
  [key: string]: any;
}
export class SupabaseApiRewards extends SupabaseApiProgramSchoolStats {
  async getBadgesByIds(ids: string[]): Promise<TableTypes<'badge'>[]> {
    if (!this.supabase || ids.length === 0) return [];

    const { data, error } = await this.supabase
      .from('badge')
      .select('*')
      .in('id', ids)
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error fetching badges by IDs:', error);
      return [];
    }

    return data ?? [];
  }
  async getRewardsById(
    id: number,
    periodType: string,
  ): Promise<TableTypes<'reward'> | undefined> {
    if (!this.supabase) return;

    try {
      const { data, error } = await this.supabase
        .from('reward')
        .select(`${periodType}`)
        .eq('year', id)
        .single();

      if (error) {
        logger.error('Error fetching reward by ID:', error);
        return;
      }

      if (
        typeof data !== 'object' ||
        data === null ||
        Array.isArray(data) ||
        !(periodType in data)
      ) {
        logger.error('No reward found for the given year or periodType.');
        return;
      }
      const rewardPayload = data[periodType as keyof typeof data];

      if (!rewardPayload) {
        logger.error('No reward found for the given year or periodType.');
        return;
      }

      try {
        return typeof rewardPayload === 'string'
          ? JSON.parse(rewardPayload)
          : (rewardPayload as TableTypes<'reward'>);
      } catch (parseError) {
        logger.error('Error parsing JSON from reward data:', parseError);
        return;
      }
    } catch (error) {
      logger.error('Unexpected error in getRewardsById:', error);
      return;
    }
  }
  async getUserBadge(userId: string): Promise<TableTypes<'user_badge'>[]> {
    if (!this.supabase) return [];

    try {
      const { data, error } = await this.supabase
        .from('user_badge')
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', false);

      if (error) {
        logger.error('Error fetching user badge by user ID:', error);
        return [];
      }

      if (!data || data.length === 0) {
        logger.error('No badge found for the given user ID.');
        return [];
      }

      return data;
    } catch (error) {
      logger.error('Unexpected error in getUserBadge:', error);
      return [];
    }
  }
  async getUserBonus(userId: string): Promise<TableTypes<'user_bonus'>[]> {
    if (!this.supabase) return [];

    try {
      const { data, error } = await this.supabase
        .from('user_bonus')
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', false);

      if (error) {
        logger.error('Error fetching user bonus by user ID:', error);
        return [];
      }

      if (!data || data.length === 0) {
        logger.error('No bonus found for the given user ID.');
        return [];
      }

      return data;
    } catch (error) {
      logger.error('Unexpected error in getUserBonus:', error);
      return [];
    }
  }

  async updateRewardAsSeen(studentId: string): Promise<void> {
    if (!this.supabase) return;

    try {
      const { error } = await this.supabase
        .from(TABLES.UserSticker)
        .update({ is_seen: true })
        .eq('user_id', studentId)
        .eq('is_seen', false)
        .eq('is_deleted', false);

      if (error) {
        logger.error('Error updating rewards as seen:', error);
        throw new Error('Error updating rewards as seen.');
      }
    } catch (err) {
      logger.error('Unexpected error updating rewards as seen:', err);
      throw new Error('Unexpected error updating rewards as seen.');
    }
  }
  async getBonusesByIds(ids: string[]): Promise<TableTypes<'lesson'>[]> {
    if (!this.supabase || ids.length === 0) return [];

    const { data, error } = await this.supabase
      .from('lesson')
      .select('*')
      .in('id', ids)
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error fetching bonuses by IDs:', error);
      return [];
    }

    return data ?? [];
  }
}
