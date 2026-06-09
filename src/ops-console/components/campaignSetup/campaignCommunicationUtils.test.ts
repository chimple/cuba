import {
  buildCampaignMessagingPayload,
  formatDateTimeForDatabase,
} from './campaignCommunicationUtils';

describe('campaignCommunicationUtils', () => {
  it('formats communication times as full timestamps for timestamptz columns', () => {
    expect(formatDateTimeForDatabase('2099-05-01', '09:00 AM')).toBe(
      new Date(2099, 4, 1, 9, 0, 0, 0).toISOString(),
    );
    expect(formatDateTimeForDatabase('2099-05-01', '12:00 AM')).toBe(
      new Date(2099, 4, 1, 0, 0, 0, 0).toISOString(),
    );
    expect(formatDateTimeForDatabase('2099-05-01', '12:00 PM')).toBe(
      new Date(2099, 4, 1, 12, 0, 0, 0).toISOString(),
    );
  });

  it('builds messaging rows with per-day message and poll timestamps', () => {
    const rows = buildCampaignMessagingPayload({
      campaignId: 'campaign-1',
      timelineDates: ['2099-05-01'],
      communicationState: {
        messageTime: '09:00 AM',
        pollTime: '05:00 PM',
        rows: {
          '2099-05-01': {
            message: 'Hello',
            mediaLink: '',
            pollQuestion: '',
            pollOptions: ['', ''],
          },
        },
      },
    });

    expect(rows).toEqual([
      expect.objectContaining({
        campaign_id: 'campaign-1',
        scheduled_date: '2099-05-01',
        message_time: new Date(2099, 4, 1, 9, 0, 0, 0).toISOString(),
        poll_time: new Date(2099, 4, 1, 17, 0, 0, 0).toISOString(),
        message: 'Hello',
      }),
    ]);
  });
});
