import { DailyRewardsNotificationScheduler } from './dailyRewardsNotificationScheduler';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { ServiceConfig } from '../ServiceConfig';
import logger from '../../utility/logger';
import {
  matchesTrigger,
  matchesTriggerCondition,
  StudentActivity,
} from './dailyRewardsNotificationRules';
import {
  DailyRewardsNotificationCampaign,
  DailyRewardsTriggerCondition,
  DAILY_REWARDS_NOTIFICATIONS_DEFAULT,
} from './dailyRewardsNotificationsConfig';

type Activity = StudentActivity;

const matches = (
  condition: DailyRewardsTriggerCondition,
  activityDates: string[],
) => {
  const activity = makeActivity(activityDates);
  return matchesTriggerCondition(condition, new Date(2026, 10, 3, 9), activity);
};

const makeActivity = (activityDates: string[]): Activity => ({
  records: activityDates.map((date) => ({ date, source: null })),
  dates: new Set(activityDates),
  completedCount: activityDates.length,
  completedDates: activityDates,
});

describe('daily rewards readable GrowthBook conditions', () => {
  it('checks yesterday and today independently for a morning reminder', () => {
    expect(matches({ type: 'played', day: 'yesterday' }, ['2026-11-02'])).toBe(
      true,
    );
    expect(matches({ type: 'not_played', day: 'today' }, ['2026-11-02'])).toBe(
      true,
    );
    expect(matches({ type: 'not_played', day: 'today' }, ['2026-11-03'])).toBe(
      false,
    );
  });

  it('suppresses a morning reminder after a lesson today', () => {
    const trigger = {
      match: 'all' as const,
      conditions: [
        { type: 'played' as const, day: 'yesterday' as const },
        { type: 'not_played' as const, day: 'today' as const },
      ],
    };
    const check = matchesTrigger;
    expect(
      check(trigger, new Date(2026, 10, 3, 9), makeActivity(['2026-11-02'])),
    ).toBe(true);
    expect(
      check(
        trigger,
        new Date(2026, 10, 3, 9),
        makeActivity(['2026-11-02', '2026-11-03']),
      ),
    ).toBe(false);
  });

  it('allows a four-day inactivity rule', () => {
    expect(
      matches({ type: 'inactive_for_days', days: 4 }, ['2026-10-30']),
    ).toBe(true);
    expect(
      matches({ type: 'inactive_for_days', days: 4 }, ['2026-10-31']),
    ).toBe(false);
  });

  it('matches a four-day playing streak ending yesterday', () => {
    const condition = {
      type: 'played_streak' as const,
      days: 4,
      ending: 'yesterday' as const,
    };
    expect(
      matches(condition, [
        '2026-10-30',
        '2026-10-31',
        '2026-11-01',
        '2026-11-02',
      ]),
    ).toBe(true);
    expect(matches(condition, ['2026-10-30', '2026-11-01', '2026-11-02'])).toBe(
      false,
    );
  });

  it('matches a completed lesson exactly four days ago', () => {
    expect(matches({ type: 'played_days_ago', days: 4 }, ['2026-10-30'])).toBe(
      true,
    );
    expect(matches({ type: 'played_days_ago', days: 4 }, ['2026-10-31'])).toBe(
      false,
    );
  });

  it('keeps existing numeric conditions working', () => {
    expect(
      matches(
        {
          metric: 'active_days',
          operator: 'eq',
          value: 0,
          window_days: 1,
          relative_days: -1,
        },
        ['2026-11-03'],
      ),
    ).toBe(true);
  });
});

describe('daily rewards student-language copy', () => {
  const template: DailyRewardsNotificationCampaign['templates'][number] = {
    id: 'reminder_en',
    weight: 1,
    title: 'English title',
    body: 'English {child_name}',
    deep_links: ['home'],
    translations: {
      hi: {
        id: 'reminder_hi',
        title: 'हिन्दी शीर्षक',
        body: 'हिन्दी {child_name}',
        fallback_child_name: 'आपके बच्चे',
      },
      kn: {
        id: 'reminder_kn',
        title: 'ಕನ್ನಡ ಶೀರ್ಷಿಕೆ',
        body: 'ಕನ್ನಡ {child_name}',
      },
    },
  };

  it('uses the matching title, body, and analytics label', () => {
    const resolve = DailyRewardsNotificationScheduler['resolveTemplateCopy'];
    expect(resolve(template, 'hi')).toEqual({
      id: 'reminder_hi',
      title: 'हिन्दी शीर्षक',
      body: 'हिन्दी {child_name}',
      fallbackChildName: 'आपके बच्चे',
    });
    expect(resolve(template, 'kn').id).toBe('reminder_kn');
  });

  it('uses English when a translation is unavailable', () => {
    const resolve = DailyRewardsNotificationScheduler['resolveTemplateCopy'];
    expect(resolve(template, 'en')).toEqual({
      id: 'reminder_en',
      title: 'English title',
      body: 'English {child_name}',
      fallbackChildName: 'Your child',
    });
  });

  it('reads the selected student language rather than the active app language', async () => {
    const getLanguageWithId = jest.fn().mockResolvedValue({ code: 'kn' });
    jest.spyOn(ServiceConfig, 'getI').mockReturnValue({
      apiHandler: { getLanguageWithId },
    } as never);
    const language = await DailyRewardsNotificationScheduler[
      'languageForStudent'
    ]({ language_id: 'kannada-language-id' } as never);
    expect(language).toBe('kn');
    expect(getLanguageWithId).toHaveBeenCalledWith('kannada-language-id');
  });
});

describe('daily rewards image caching', () => {
  it('uses a new cache key when a GrowthBook image URL changes', () => {
    const template: DailyRewardsNotificationCampaign['templates'][number] = {
      id: 'reminder',
      image_id: 'reward',
      weight: 1,
      title: '',
      body: '',
      deep_links: ['home'],
    };
    expect(
      DailyRewardsNotificationScheduler['imageCacheKey'](
        template,
        'https://example.com/reward-v1.png',
      ),
    ).not.toBe(
      DailyRewardsNotificationScheduler['imageCacheKey'](
        template,
        'https://example.com/reward-v2.png',
      ),
    );
  });
});

describe('daily rewards rescheduling', () => {
  const schedulerInternals = DailyRewardsNotificationScheduler as unknown as {
    configForStudent: (typeof DailyRewardsNotificationScheduler)['configForStudent'];
    getPlayedDatesByStudent: (typeof DailyRewardsNotificationScheduler)['getPlayedDatesByStudent'];
    getDailyRewardsByStudent: (typeof DailyRewardsNotificationScheduler)['getDailyRewardsByStudent'];
    sendNotifications: (typeof DailyRewardsNotificationScheduler)['sendNotifications'];
    clearScheduled: (typeof DailyRewardsNotificationScheduler)['clearScheduled'];
  };

  it('queues Android alarms for trigger-time checks without reading activity first', async () => {
    jest.mocked(Capacitor.getPlatform).mockReturnValue('android');
    Object.assign(LocalNotifications, {
      checkPermissions: jest.fn().mockResolvedValue({ display: 'granted' }),
      createChannel: jest.fn().mockResolvedValue(undefined),
    });
    const student = { id: 'offline-student', name: 'A', language_id: null };
    jest.spyOn(ServiceConfig, 'getI').mockReturnValue({
      apiHandler: {
        getParentStudentProfiles: jest.fn().mockResolvedValue([student]),
      },
    } as never);
    jest.spyOn(schedulerInternals, 'configForStudent').mockResolvedValue({
      ...DAILY_REWARDS_NOTIFICATIONS_DEFAULT,
      global_enable: true,
      max_lookahead_days: 1,
      campaigns: [
        {
          id: 'morning_played',
          trigger_time: '12:00',
          trigger: {
            conditions: [{ type: 'played', day: 'yesterday' }],
          },
          templates: [
            {
              id: 'offline-trigger-test',
              weight: 1,
              title: 'Title',
              body: 'Body',
              deep_links: ['home'],
            },
            {
              id: 'offline-trigger-alternative',
              weight: 2,
              title: 'Alternative title',
              body: 'Alternative body',
              deep_links: ['homework'],
            },
          ],
        },
      ],
    });
    const readActivity = jest.spyOn(
      schedulerInternals,
      'getPlayedDatesByStudent',
    );
    jest
      .spyOn(schedulerInternals, 'getDailyRewardsByStudent')
      .mockResolvedValue(new Map());
    const send = jest
      .spyOn(schedulerInternals, 'sendNotifications')
      .mockResolvedValue(undefined);

    await DailyRewardsNotificationScheduler['scheduleOnce']();

    expect(readActivity).not.toHaveBeenCalled();
    expect(send).toHaveBeenCalled();
    expect(send.mock.calls[0][1]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          extra: expect.objectContaining({
            target_student_id: student.id,
            guard: expect.objectContaining({
              trigger: { conditions: [{ type: 'played', day: 'yesterday' }] },
              variants: expect.arrayContaining([
                expect.objectContaining({
                  template_id: 'offline-trigger-test',
                }),
                expect.objectContaining({
                  template_id: 'offline-trigger-alternative',
                  weight: 2,
                  title: 'Alternative title',
                }),
              ]),
            }),
          }),
        }),
      ]),
    );
  });

  it('keeps existing alarms when offline activity cannot be read', async () => {
    jest.spyOn(logger, 'error').mockImplementation(() => {});
    const clearScheduled = jest
      .spyOn(schedulerInternals, 'clearScheduled')
      .mockResolvedValue(undefined);
    jest.spyOn(ServiceConfig, 'getI').mockReturnValue({
      apiHandler: {
        getParentStudentProfiles: jest
          .fn()
          .mockRejectedValue(new Error('Database unavailable')),
      },
    } as never);

    await DailyRewardsNotificationScheduler['scheduleOnce']();

    expect(clearScheduled).not.toHaveBeenCalled();
  });
});
