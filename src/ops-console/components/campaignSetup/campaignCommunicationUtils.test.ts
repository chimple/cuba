import {
  buildCommunicationTimelineDates,
  buildCampaignMessagingPayload,
  formatDateTimeForDatabase,
} from './campaignCommunicationUtils';
import { CAMPAIGN_OBJECTIVE } from '../../../common/constants';

describe('campaignCommunicationUtils', () => {
  it('formats communication times as full timestamps for timestamptz columns', () => {
    expect(formatDateTimeForDatabase('2099-05-01', '09:00 AM')).toBe(
      '2099-05-01T09:00:00.000Z',
    );
    expect(formatDateTimeForDatabase('2099-05-01', '12:00 AM')).toBe(
      '2099-05-01T00:00:00.000Z',
    );
    expect(formatDateTimeForDatabase('2099-05-01', '12:00 PM')).toBe(
      '2099-05-01T12:00:00.000Z',
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
        message_time: '2099-05-01T09:00:00.000Z',
        poll_time: '2099-05-01T17:00:00.000Z',
        message: 'Hello',
      }),
    ]);
  });

  it('uses campaign duration dates for homepage learning pathway campaigns', () => {
    expect(
      buildCommunicationTimelineDates([], {
        objective: CAMPAIGN_OBJECTIVE.HOMEPAGE_LEARNING_PATHWAY,
        targetType: 'percentage_completion',
        targetValue: '',
        learningPathCount: '5',
        campaignName: 'Pathway Campaign',
        managerId: 'manager-1',
        startDate: '2099-05-01',
        endDate: '2099-05-03',
        programId: 'program-1',
        groupName: 'Group A',
        rewardType: '',
        rewardRanks: [],
      }),
    ).toEqual(['2099-05-01', '2099-05-02', '2099-05-03']);
  });
});
