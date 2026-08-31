import {
  buildCampaignNotificationPayload,
  hasFutureTimesForPeriod,
  isScheduledTimeInPast,
  isTimeOptionInPast,
} from './MessagesPage.helpers';

describe('MessagesPage time helpers', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-06T11:51:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('treats past AM slots as unavailable for today when the current time is 11:51 AM', () => {
    expect(isTimeOptionInPast('2026-08-06', '01', 'AM')).toBe(true);
    expect(isTimeOptionInPast('2026-08-06', '11', 'AM')).toBe(true);
    expect(hasFutureTimesForPeriod('2026-08-06', 'AM')).toBe(false);
    expect(isScheduledTimeInPast('2026-08-06', '11:00 AM')).toBe(true);
  });

  it('keeps future PM slots available for today', () => {
    expect(isTimeOptionInPast('2026-08-06', '12', 'PM')).toBe(false);
    expect(isTimeOptionInPast('2026-08-06', '03', 'PM')).toBe(false);
    expect(hasFutureTimesForPeriod('2026-08-06', 'PM')).toBe(true);
  });

  it('does not block past checks for future dates', () => {
    expect(isTimeOptionInPast('2026-08-07', '01', 'AM')).toBe(false);
    expect(isScheduledTimeInPast('2026-08-07', '01:00 AM')).toBe(false);
  });

  it('passes through a selected saved audience group id', async () => {
    const payload = await buildCampaignNotificationPayload({
      audience: {
        programId: 'program-1',
        programModel: 'at_school',
        selectedSavedGroupId: 'audience-1',
        userType: 'student',
        activityRecency: 'all',
        isAllSchools: true,
        selectedSchools: [],
        isAllGrades: true,
        selectedGrades: [],
      },
      draft: {
        label: 'Notice',
        title: 'Hello',
        body: 'World',
        imageName: '',
        imageUrl: '',
      },
      deliveryMode: 'send_now',
      imageFile: null,
      selectedDays: [],
      startDate: '2026-08-11',
      sendTime: '01:00 PM',
      endDate: '2026-08-11',
      neverEnds: true,
      isComposeValid: true,
      recurringEndDateError: null,
      uploadPushNotificationImage: jest.fn(),
    });

    expect(payload.savedAudienceGroupId).toBe('audience-1');
  });

  it('allows notification payloads without a program model', async () => {
    const payload = await buildCampaignNotificationPayload({
      audience: {
        programId: 'program-1',
        programModel: '',
        selectedSavedGroupId: '',
        userType: 'student',
        activityRecency: 'all',
        isAllSchools: true,
        selectedSchools: [],
        isAllGrades: true,
        selectedGrades: [],
      },
      draft: {
        label: 'Notice',
        title: 'Hello',
        body: 'World',
        imageName: '',
        imageUrl: '',
      },
      deliveryMode: 'send_now',
      imageFile: null,
      selectedDays: [],
      startDate: '2026-08-11',
      sendTime: '01:00 PM',
      endDate: '2026-08-11',
      neverEnds: true,
      isComposeValid: true,
      recurringEndDateError: null,
      uploadPushNotificationImage: jest.fn(),
    });

    expect(payload.programModel).toBeNull();
  });
});
