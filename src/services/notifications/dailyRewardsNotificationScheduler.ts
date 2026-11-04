import { Capacitor, registerPlugin } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { GrowthBook } from '@growthbook/growthbook-react';
import { getCachedGrowthBookFeatureValue } from '../../growthbook/Growthbook';
import { store } from '../../redux/store';
import { ServiceConfig } from '../ServiceConfig';
import logger from '../../utility/logger';
import {
  CURRENT_STUDENT,
  HOMEHEADERLIST,
  PAGES,
  RESULT_STATUS,
  TableTypes,
} from '../../common/constants';
import {
  DAILY_REWARDS_NOTIFICATIONS_CONFIG,
  DAILY_REWARDS_NOTIFICATIONS_DEFAULT,
  DailyRewardsLanguage,
  DailyRewardsNotificationCampaign,
  DailyRewardsNotificationsConfig,
} from './dailyRewardsNotificationsConfig';
import {
  dateKey,
  matchesCampaign,
  StudentActivity,
} from './dailyRewardsNotificationRules';

type HistoryEntry = { templateId: string; sentAt: string };
type LocalNotification = Parameters<
  typeof LocalNotifications.schedule
>[0]['notifications'][number];
type RichLocalNotificationsPlugin = {
  cacheImages(options: {
    assets: Array<{ imageId: string; url: string }>;
  }): Promise<void>;
  schedule(options: {
    notifications: Array<Record<string, unknown>>;
  }): Promise<void>;
  clearScheduled(): Promise<void>;
};

const richLocalNotifications = registerPlugin<RichLocalNotificationsPlugin>(
  'RichLocalNotifications',
);
const HISTORY_KEY = 'daily_rewards_notification_history_v2';
const EXTRA_TYPE = 'daily_reward_local';
export const DAILY_REWARDS_ACTIVITY_CHANGED =
  'daily-rewards-pathway-activity-changed';

const interpolate = (text: string, childName: string, dailyReward: string) =>
  text
    .replaceAll('{child_name}', childName)
    .replaceAll('{daily_reward}', dailyReward);

export class DailyRewardsNotificationScheduler {
  private static growthbook?: GrowthBook;
  private static scheduleQueue: Promise<void> = Promise.resolve();

  static setGrowthBookClient(growthbook?: GrowthBook): void {
    this.growthbook = growthbook;
  }

  static schedule(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return Promise.resolve();
    const scheduled = this.scheduleQueue.then(() => this.scheduleOnce());
    this.scheduleQueue = scheduled.catch(() => {});
    return scheduled;
  }

  private static async scheduleOnce(): Promise<void> {
    try {
      const now = new Date();
      const history = this.history().filter(
        (entry) => new Date(entry.sentAt).getTime() <= now.getTime(),
      );
      await this.clearScheduled();
      const api = ServiceConfig.getI().apiHandler;
      const students = await api.getParentStudentProfiles();
      const candidates = (
        await Promise.all(
          students.map(async (student) => {
            try {
              const language = await this.languageForStudent(student);
              return {
                student,
                language,
                config: await this.configForStudent(student, language),
              };
            } catch (error) {
              logger.warn(
                'Unable to evaluate daily rewards for student',
                error,
              );
              return {
                student,
                language: 'en' as DailyRewardsLanguage,
                config: DAILY_REWARDS_NOTIFICATIONS_DEFAULT,
              };
            }
          }),
        )
      ).filter(({ config }) => config.global_enable);
      if (!candidates.length) {
        this.saveHistory(history);
        return;
      }
      const { student, language, config } =
        candidates[Math.floor(Math.random() * candidates.length)];
      const permission = await LocalNotifications.checkPermissions();
      if (permission.display !== 'granted') {
        const requested = await LocalNotifications.requestPermissions();
        if (requested.display !== 'granted') return;
      }
      await Promise.all(
        Object.entries(config.channels).map(([id, channel]) =>
          LocalNotifications.createChannel({
            id,
            name: channel.name,
            description: channel.description,
            importance: 4,
            visibility: 1,
          }),
        ),
      );
      const playedDatesByStudent = await this.getPlayedDatesByStudent([
        student,
      ]);
      const rewardsByStudent = await this.getDailyRewardsByStudent([student]);
      const notifications = [] as Parameters<
        typeof LocalNotifications.schedule
      >[0]['notifications'];
      const selectedHistory = [...history];
      for (
        let offset = 0;
        offset <= Math.max(0, config.max_lookahead_days);
        offset++
      ) {
        const date = new Date(now);
        date.setDate(now.getDate() + offset);
        for (const campaign of config.campaigns) {
          const at = this.toTriggerDate(date, campaign.trigger_time);
          if (at <= now) continue;
          if (
            !matchesCampaign(
              campaign,
              date,
              offset,
              playedDatesByStudent.get(student.id) ?? {
                records: [],
                dates: new Set(),
                completedCount: 0,
                completedDates: [],
              },
            )
          )
            continue;
          const template = this.pickTemplate(
            campaign,
            campaign.cooldown_days ?? config.anti_spam_cooldown_days,
            at,
            selectedHistory,
          );
          if (!template) continue;
          const copy = this.resolveTemplateCopy(template, language);
          const childName = student.name?.trim() || copy.fallbackChildName;
          const deepLink =
            template.deep_links[
              Math.floor(Math.random() * template.deep_links.length)
            ] ?? 'home';
          const imageUrl = this.imageUrl(config, template);
          notifications.push({
            id: this.notificationId(student.id, campaign.id, date),
            title: interpolate(
              copy.title,
              childName,
              rewardsByStudent.get(student.id) ?? 'daily reward',
            ),
            body: interpolate(
              copy.body,
              childName,
              rewardsByStudent.get(student.id) ?? 'daily reward',
            ),
            channelId: campaign.channel_id ?? 'daily_rewards',
            attachments: imageUrl
              ? [
                  {
                    id: this.imageCacheKey(template, imageUrl),
                    url: imageUrl,
                  },
                ]
              : undefined,
            schedule: { at, allowWhileIdle: true },
            extra: {
              notificationType: EXTRA_TYPE,
              target_student_id: student.id,
              deep_link:
                deepLink === 'homework'
                  ? `${PAGES.HOME}?tab=${HOMEHEADERLIST.ASSIGNMENT}`
                  : `${PAGES.HOME}?tab=${HOMEHEADERLIST.HOME}`,
              template_id: copy.id,
              campaign_id: campaign.id,
            },
          });
          selectedHistory.push({
            templateId: template.id,
            sentAt: at.toISOString(),
          });
        }
      }
      if (notifications.length) {
        await this.sendNotifications(config, notifications);
      }
      this.saveHistory(selectedHistory);
    } catch (error) {
      logger.error('Failed to schedule daily reward notifications', error);
    }
  }

  private static async configForStudent(
    student: TableTypes<'user'>,
    language: DailyRewardsLanguage,
  ): Promise<DailyRewardsNotificationsConfig> {
    const growthbook = this.growthbook;
    if (!growthbook || !Object.keys(growthbook.getFeatures()).length) {
      let activeId = growthbook?.getAttributes().student_id;
      if (!activeId) {
        try {
          activeId = JSON.parse(
            localStorage.getItem(CURRENT_STUDENT) ?? 'null',
          )?.id;
        } catch {
          activeId = undefined;
        }
      }
      return activeId === student.id
        ? getCachedGrowthBookFeatureValue(
            DAILY_REWARDS_NOTIFICATIONS_CONFIG,
            DAILY_REWARDS_NOTIFICATIONS_DEFAULT,
          )
        : DAILY_REWARDS_NOTIFICATIONS_DEFAULT;
    }
    const current = growthbook.getAttributes();
    const auth = store.getState().auth;
    const linked =
      await ServiceConfig.getI().apiHandler.getStudentClassesAndSchools(
        student.id,
      );
    const attributes = {
      parent_id: current.parent_id ?? auth.user?.id ?? auth.authUser?.id,
      language,
      device_language: current.device_language,
      platform: current.platform,
      count_of_children: current.count_of_children,
      id: student.id,
      student_id: student.id,
      age: student.age,
      curriculum_id: student.curriculum_id,
      grade_id: student.grade_id,
      gender: student.gender,
      stars: student.stars ?? 0,
      school_ids: linked.schools.map((school) => school.id),
      school_name: linked.schools[0]?.name,
      class_ids: linked.classes.map((studentClass) => studentClass.id),
    };
    const evaluator = new GrowthBook({
      attributes,
      features: growthbook.getFeatures(),
      experiments: growthbook.getExperiments(),
      savedGroups: growthbook.getDecryptedPayload().savedGroups,
      url: growthbook.getUrl(),
      forcedFeatureValues: growthbook.getForcedFeatures(),
      forcedVariations: growthbook.getForcedVariations(),
    });
    return evaluator.getFeatureValue(
      DAILY_REWARDS_NOTIFICATIONS_CONFIG,
      DAILY_REWARDS_NOTIFICATIONS_DEFAULT,
    );
  }

  private static async languageForStudent(
    student: TableTypes<'user'>,
  ): Promise<DailyRewardsLanguage> {
    if (!student.language_id) return 'en';
    try {
      const language = await ServiceConfig.getI().apiHandler.getLanguageWithId(
        student.language_id,
      );
      const code = language?.code?.toLowerCase().split('-')[0];
      if (code === 'hi' || code === 'kn') return code;
    } catch (error) {
      logger.warn('Unable to resolve notification student language', error);
    }
    return 'en';
  }

  private static resolveTemplateCopy(
    template: DailyRewardsNotificationCampaign['templates'][number],
    language: DailyRewardsLanguage,
  ): { id: string; title: string; body: string; fallbackChildName: string } {
    const translation =
      language === 'en' ? undefined : template.translations?.[language];
    return {
      id: translation?.id ?? template.id,
      title: translation?.title ?? template.title,
      body: translation?.body ?? template.body,
      fallbackChildName:
        translation?.fallback_child_name ??
        template.fallback_child_name ??
        'Your child',
    };
  }

  static async prefetchImages(
    config: DailyRewardsNotificationsConfig,
  ): Promise<void> {
    if (Capacitor.getPlatform() !== 'android') return;
    const assets = Array.from(
      new Map(
        config.campaigns
          .flatMap((campaign) => campaign.templates)
          .map((template) => {
            const url = this.imageUrl(config, template);
            return url ? [this.imageCacheKey(template, url), url] : undefined;
          })
          .filter((asset): asset is [string, string] => !!asset),
      ),
    ).map(([imageId, url]) => ({ imageId, url }));
    if (assets.length) await richLocalNotifications.cacheImages({ assets });
  }

  private static async getPlayedDatesByStudent(
    students: TableTypes<'user'>[],
  ): Promise<Map<string, StudentActivity>> {
    const api = ServiceConfig.getI().apiHandler;
    const datesByStudent = new Map<string, StudentActivity>();
    await Promise.all(
      students.map(async (student) => {
        const results = await api.getStudentResult(student.id, true);
        const completed = results.filter(
          (row) =>
            !row.is_deleted &&
            !!row.created_at &&
            row.status === RESULT_STATUS.COMPLETED,
        );
        const records = completed.map((row) => ({
          date: dateKey(new Date(row.created_at)),
          source: row.source ?? null,
        }));
        datesByStudent.set(student.id, {
          records,
          dates: new Set(records.map((record) => record.date)),
          completedCount: completed.length,
          completedDates: records.map((record) => record.date),
        });
      }),
    );
    return datesByStudent;
  }

  private static async getDailyRewardsByStudent(
    students: TableTypes<'user'>[],
  ): Promise<Map<string, string>> {
    const api = ServiceConfig.getI().apiHandler;
    const rewards = new Map<string, string>();
    await Promise.all(
      students.map(async (student) => {
        try {
          const rewardId = student.reward
            ? JSON.parse(student.reward).reward_id
            : undefined;
          if (!rewardId) return;
          const reward = await api.getRewardById(rewardId);
          const name =
            (reward as { name?: string; display_name?: string })
              ?.display_name ?? (reward as { name?: string })?.name;
          if (name) rewards.set(student.id, name);
        } catch {
          // A malformed local reward must not prevent scheduling reminders.
        }
      }),
    );
    return rewards;
  }

  private static imageUrl(
    config: DailyRewardsNotificationsConfig,
    template: DailyRewardsNotificationCampaign['templates'][number],
  ): string | undefined {
    if (/^https:\/\//.test(template.image_url ?? '')) return template.image_url;
    return template.image_id && config.asset_base_url
      ? [
          config.asset_base_url,
          encodeURIComponent(template.image_id) + '.png',
        ].join('/')
      : undefined;
  }

  private static imageCacheKey(
    template: DailyRewardsNotificationCampaign['templates'][number],
    imageUrl?: string,
  ): string {
    if (template.image_id) return template.image_id;
    return 'url_' + this.hash(imageUrl ?? '');
  }

  private static hash(value: string): string {
    let hash = 5381;
    for (let index = 0; index < value.length; index++) {
      hash = (hash * 33) ^ value.charCodeAt(index);
    }
    return (hash >>> 0).toString(36);
  }

  private static async sendNotifications(
    config: DailyRewardsNotificationsConfig,
    notifications: LocalNotification[],
  ): Promise<void> {
    if (Capacitor.getPlatform() !== 'android') {
      await LocalNotifications.schedule({ notifications });
      return;
    }
    await richLocalNotifications.schedule({
      notifications: notifications.map((notification) => ({
        id: notification.id,
        title: notification.title,
        body: notification.body,
        channelId: notification.channelId,
        at: notification.schedule?.at?.getTime() ?? 0,
        imageId: notification.attachments?.[0]?.id,
        extra: notification.extra,
      })),
    });
    void this.prefetchImages(config).catch((error) =>
      logger.warn('[Daily Rewards] image prefetch failed', error),
    );
  }

  private static async clearScheduled(): Promise<void> {
    if (Capacitor.getPlatform() === 'android') {
      await richLocalNotifications.clearScheduled();
      return;
    }
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }
  }

  private static toTriggerDate(date: Date, value: string): Date {
    const [hours, minutes] = value.split(':').map(Number);
    const at = new Date(date);
    at.setHours(hours || 0, minutes || 0, 0, 0);
    return at;
  }

  private static notificationId(
    studentId: string,
    campaignId: string,
    date: Date,
  ): number {
    return (
      ((`${studentId}:${campaignId}:${dateKey(date)}`
        .split('')
        .reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) | 0, 0) >>>
        0) %
        2_147_483_646) +
      1
    );
  }

  private static pickTemplate(
    campaign: DailyRewardsNotificationCampaign,
    cooldownDays: number,
    scheduledAt: Date,
    history: HistoryEntry[],
  ) {
    const cutoff = scheduledAt.getTime() - cooldownDays * 86_400_000;
    const recentHistory = history.filter((entry) => {
      const sentAt = new Date(entry.sentAt).getTime();
      return sentAt >= cutoff && sentAt <= scheduledAt.getTime();
    });
    const eligible = campaign.templates.filter(
      (template) =>
        !recentHistory.some((entry) => entry.templateId === template.id),
    );
    if (!eligible.length) return undefined;
    const weight = eligible.reduce(
      (total, template) => total + Math.max(1, template.weight),
      0,
    );
    let cursor = Math.random() * weight;
    return eligible.find(
      (template) => (cursor -= Math.max(1, template.weight)) < 0,
    );
  }

  private static history(): HistoryEntry[] {
    try {
      return JSON.parse(
        localStorage.getItem(HISTORY_KEY) ?? '[]',
      ) as HistoryEntry[];
    } catch {
      return [];
    }
  }

  private static saveHistory(history: HistoryEntry[]): void {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-100)));
  }
}
