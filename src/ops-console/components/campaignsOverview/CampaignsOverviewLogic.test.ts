import {
  buildCampaignsOverviewFields,
  buildCampaignsOverviewMetrics,
  buildCampaignsOverviewViewModel,
  CAMPAIGN_LISTING_STATUS,
  CAMPAIGN_STATUS,
  CampaignsOverviewApiResponse,
  CampaignsOverviewDisplayObject,
} from './CampaignsOverviewLogic';

describe('CampaignsOverviewLogic', () => {
  it('should normalize generic summary object keys and values', () => {
    const data: CampaignsOverviewDisplayObject = {
      campaignName: 'Drive',
      program_type: 'Math',
      emptyValue: '',
      nullValue: null,
      enabled: true,
    };

    expect(buildCampaignsOverviewFields(data)).toEqual([
      {
        key: 'campaignName',
        label: 'Campaign Name',
        value: 'Drive',
        durationDayCount: undefined,
        isStatus: false,
        statusTone: undefined,
      },
      {
        key: 'program_type',
        label: 'Program Type',
        value: 'Math',
        durationDayCount: undefined,
        isStatus: false,
        statusTone: undefined,
      },
      {
        key: 'emptyValue',
        label: 'Empty Value',
        value: '--',
        durationDayCount: undefined,
        isStatus: false,
        statusTone: undefined,
      },
      {
        key: 'nullValue',
        label: 'Null Value',
        value: '--',
        durationDayCount: undefined,
        isStatus: false,
        statusTone: undefined,
      },
      {
        key: 'enabled',
        label: 'Enabled',
        value: 'Yes',
        durationDayCount: undefined,
        isStatus: false,
        statusTone: undefined,
      },
    ]);
  });

  it('should mark status fields for pill rendering', () => {
    expect(buildCampaignsOverviewFields({ Status: 'Active' })).toEqual([
      {
        key: 'Status',
        label: 'Status',
        value: 'Active',
        durationDayCount: undefined,
        isStatus: true,
        statusTone: 'success',
      },
    ]);
  });

  it('should resolve status pill tones', () => {
    expect(
      buildCampaignsOverviewFields({
        Status: CAMPAIGN_LISTING_STATUS.IN_PROGRESS,
      })[0].statusTone,
    ).toBe('success');
    expect(
      buildCampaignsOverviewFields({
        Status: CAMPAIGN_LISTING_STATUS.NOT_STARTED,
      })[0].statusTone,
    ).toBe('warning');
    expect(
      buildCampaignsOverviewFields({
        Status: CAMPAIGN_LISTING_STATUS.CANCELLED,
      })[0].statusTone,
    ).toBe('danger');
    expect(
      buildCampaignsOverviewFields({
        Status: CAMPAIGN_LISTING_STATUS.COMPLETED,
      })[0].statusTone,
    ).toBe('neutral');
  });

  it('should split campaign duration day count for emphasis', () => {
    expect(
      buildCampaignsOverviewFields({
        'Campaign Duration': 'May 25 2026 to May 30 2026 (6 Days)',
      }),
    ).toEqual([
      {
        key: 'Campaign Duration',
        label: 'Campaign Duration',
        value: 'May 25 2026 to May 30 2026',
        durationDayCount: '6',
        isStatus: false,
        statusTone: undefined,
      },
    ]);
  });

  it('should normalize metrics and ignore info text companion keys', () => {
    const data: CampaignsOverviewDisplayObject = {
      totalStudents: 897,
      totalStudentsInfo: 'Calculated from active campaign schools',
      activeStudents: false,
    };

    expect(buildCampaignsOverviewMetrics(data)).toEqual([
      {
        key: 'totalStudents',
        label: 'Total Students',
        value: '897',
        hasInfo: true,
        info: 'Calculated from active campaign schools',
      },
      {
        key: 'activeStudents',
        label: 'Active Students',
        value: 'No',
        hasInfo: true,
        info: 'Displays the total number of unique active students during the last 7 days.',
      },
    ]);
  });

  it('should provide default tooltip text for known performance metrics', () => {
    expect(
      buildCampaignsOverviewMetrics({
        'Participating Schools': 22,
        'Campaign Completion': '78%',
      }),
    ).toEqual([
      {
        key: 'Participating Schools',
        label: 'Participating Schools',
        value: '22',
        hasInfo: true,
        info: 'Total number of schools that are part of this campaign.',
      },
      {
        key: 'Campaign Completion',
        label: 'Campaign Completion',
        value: '78%',
        hasInfo: true,
        info: 'Displays the percentage of the campaign duration completed.',
      },
    ]);
  });

  it('should normalize campaign overview API response values', () => {
    const response: CampaignsOverviewApiResponse = {
      data: {
        campaignId: '8ccc0fe6-d47c-4c75-bdae-307126bcc27a',
        avgWeeklyActiveUsers: 1,
        avgWeeklyEngagementTimeMinutes: 282,
        status: 'Cancelled',
        dashboardMetrics: {
          campaign_id: '8ccc0fe6-d47c-4c75-bdae-307126bcc27a',
          campaign_name: 'Test3',
          program_id: '50349e68-1430-4144-88e5-66f75dd6c3ca',
          target_audience_id: '7ee7fe4b-c2da-47bf-8428-57272d210089',
          is_all_schools: true,
          is_all_grades: false,
          participating_schools: 98,
          total_students: 608,
          average_weekly_engagement_time: 282,
          active_students: 1,
        },
        campaign: {
          name: 'Test3',
          objective: 'homework_campaign',
          start_date: '2026-05-25',
          end_date: '2026-05-30',
          updated_at: '2026-05-25T11:39:22.148553+00:00',
          cancelled_by_user: {
            name: 'Ops Admin',
          },
          manager: {
            name: 'Teacher 11 22',
          },
          program: {
            name: 'Satya Bharti',
            institutes_count: null,
            students_count: null,
          },
        },
      },
    };

    expect(buildCampaignsOverviewViewModel(response)).toEqual({
      breadcrumb: ['Campaigns', 'Test3'],
      campaignStatus: CAMPAIGN_LISTING_STATUS.CANCELLED,
      summaryData: {
        'Campaign Name': 'Test3',
        Program: 'Satya Bharti',
        Objective: 'Homework Campaign',
        'Campaign Manager': 'Teacher 11 22',
        'Campaign Duration': 'May 25 2026 to May 30 2026 (6 Days)',
        Status: 'Cancelled',
      },
      performanceData: {
        'Participating Schools': 98,
        'Total Students': 608,
        'Avg Weekly Engagement Time': '282m',
        'Campaign Completion': '100%',
        'Active Participants': 1,
      },
      cancellationDetails: {
        canceledBy: 'Ops Admin',
        canceledOn: 'May 25, 2026, 5:09 PM',
        messageToAdmin: '--',
      },
    });
  });

  it('should map campaign status enum values to listing statuses', () => {
    expect(
      buildCampaignsOverviewViewModel({
        data: {
          campaign: {
            campaign_status: CAMPAIGN_STATUS.ACTIVE,
          },
        },
      }).campaignStatus,
    ).toBe(CAMPAIGN_LISTING_STATUS.IN_PROGRESS);

    expect(
      buildCampaignsOverviewViewModel({
        data: {
          campaign: {
            campaign_status: CAMPAIGN_STATUS.INACTIVE,
          },
        },
      }).campaignStatus,
    ).toBe(CAMPAIGN_LISTING_STATUS.COMPLETED);
  });
});
