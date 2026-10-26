import { ApiHandlerLiveQuiz } from './ApiHandler.liveQuiz';
import { TableTypes, LeaderboardRewards } from '../../../common/constants';

export class ApiHandlerRewards extends ApiHandlerLiveQuiz {
  getUserBadgeProgress(
    userId: string,
  ): Promise<TableTypes<'user_badge_progress'> | undefined> {
    // Forward the child profile id without adding storage-specific behavior here.
    return this.s.getUserBadgeProgress(userId);
  }

  markUserBadgeSeen(userId: string): Promise<void> {
    // Forward the child ID to the active storage implementation.
    return this.s.markUserBadgeSeen(userId);
  }

  recordBadgeLessonCompletion(userId: string) {
    // Keep the API handler thin so storage-specific progress logic stays in the service.
    return this.s.recordBadgeLessonCompletion(userId);
  }

  async getBadgesByIds(ids: string[]): Promise<TableTypes<'badge'>[]> {
    return this.s.getBadgesByIds(ids);
  }

  async getStickersByIds(ids: string[]): Promise<TableTypes<'sticker'>[]> {
    return this.s.getStickersByIds(ids);
  }

  async getRewardsById(
    id: number,
    periodType: string,
  ): Promise<TableTypes<'reward'> | undefined> {
    return this.s.getRewardsById(id, periodType);
  }

  async getUserSticker(userId: string): Promise<TableTypes<'user_sticker'>[]> {
    return this.s.getUserSticker(userId);
  }

  async getUserStickerBook(
    userId: string,
  ): Promise<TableTypes<'user_sticker_book'>[]> {
    return this.s.getUserStickerBook(userId);
  }

  async getUserBonus(userId: string): Promise<TableTypes<'user_bonus'>[]> {
    return this.s.getUserBonus(userId);
  }

  async getUserBadge(userId: string): Promise<TableTypes<'user_badge'>[]> {
    return this.s.getUserBadge(userId);
  }

  async markStciekercolledasTrue(userId: string): Promise<void> {
    return await this.s.markStciekercolledasTrue(userId);
  }

  async updateRewardAsSeen(studentId: string): Promise<void> {
    return await this.s.updateRewardAsSeen(studentId);
  }

  async updateRewardsForStudent(
    studentId: string,
    unlockedReward: LeaderboardRewards,
  ) {
    return await this.s.updateRewardsForStudent(studentId, unlockedReward);
  }

  getRewardById(
    rewardId: string,
  ): Promise<TableTypes<'rive_reward'> | undefined> {
    return this.s.getRewardById(rewardId);
  }

  getAllRewards(): Promise<TableTypes<'rive_reward'>[] | []> {
    return this.s.getAllRewards();
  }

  updateUserReward(
    userId: string,
    rewardId: string,
    created_at?: string,
  ): Promise<void> {
    return this.s.updateUserReward(userId, rewardId, created_at);
  }
}
