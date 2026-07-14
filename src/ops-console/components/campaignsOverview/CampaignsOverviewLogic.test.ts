import {
  buildCampaignsOverviewFields,
  buildCampaignsOverviewMetrics,
  buildCampaignsOverviewViewModel,
  CAMPAIGN_LISTING_STATUS,
  CAMPAIGN_STATUS,
  CampaignsOverviewApiResponse,
  CampaignsOverviewDisplayObject,
} from './CampaignsOverviewLogic';
import {
  buildCampaignRewardExportWorkbook,
  buildCampaignRewardExportRows,
  buildCampaignRewardSummaryCards,
  filterCampaignRewardRows,
  formatCampaignRewardLastUpdated,
  getCampaignRewardClassOptions,
  getCampaignRewardFilterOptions,
  getNextClassFilter,
  getNextSchoolAndClassFilters,
  getCampaignRewardTypeLabel,
  getLatestCalculatedAt,
  mapCampaignPerformanceRowsToRewardRows,
  paginateCampaignRewardRows,
  parseCampaignRewards,
  sortCampaignRewardRows,
  type CampaignRewardRow,
} from './CampaignRewardsReport.helpers';
import type { CampaignStudentPerformanceRow } from '../../../services/api/ServiceApi';

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
          manager: {
            name: 'Teacher 11 22',
          },
          program: {
            name: 'Satya Bharti',
            institutes_count: null,
            students_count: null,
          },
        },
        cancellationData: {
          canceledBy: 'Ops Admin',
          canceledOn: '2026-05-25T11:39:22.148553+00:00',
          messageToAdmin: null,
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

describe('CampaignRewardsReport helpers', () => {
  const rewards = {
    type: 'physical_rewards' as const,
    rules: [
      { rank: 1, min: 85, reward: 'Book' },
      { rank: 2, min: 75, reward: 'Pen' },
      { rank: 3, min: 65, reward: 'Pencil' },
    ],
  };

  const createPerformanceRow = (
    overrides: Partial<CampaignStudentPerformanceRow> = {},
  ): CampaignStudentPerformanceRow => ({
    calculated_at: '2026-07-10T10:00:00.000Z',
    campaign_id: 'campaign-1',
    class_id: 'class-1',
    class_name: '1A',
    completion_percentage: 95,
    created_at: '2026-07-10T10:00:00.000Z',
    id: 'performance-1',
    is_deleted: false,
    program_id: 'program-1',
    rank: 1,
    school_id: 'school-1',
    school_name: 'Delhi Public School',
    student_id: 'student-1',
    student_name: 'Rahul Sharma',
    updated_at: '2026-07-10T10:00:00.000Z',
    ...overrides,
  });

  const mappedRows: CampaignRewardRow[] = [
    {
      id: 'row-1',
      studentId: 'student-1',
      classId: 'class-1',
      studentName: 'Rahul Sharma',
      school: 'Delhi Public School',
      className: '1A',
      completionPercent: 95,
      rewardRank: 1,
      rewardLabel: 'Book',
      calculatedAt: '2026-07-10T10:00:00.000Z',
    },
    {
      id: 'row-2',
      studentId: 'student-2',
      classId: 'class-1',
      studentName: 'Priya Verma',
      school: 'Modern School Noida',
      className: '1A',
      completionPercent: 76,
      rewardRank: 2,
      rewardLabel: 'Pen',
      calculatedAt: '2026-07-11T10:00:00.000Z',
    },
    {
      id: 'row-3',
      studentId: 'student-3',
      classId: 'class-2',
      studentName: 'Amit Kumar',
      school: 'Delhi Public School',
      className: '2B',
      completionPercent: 40,
      rewardRank: null,
      rewardLabel: '---',
      calculatedAt: null,
    },
  ];

  it('should parse valid campaign reward JSON and ignore invalid rewards', () => {
    expect(parseCampaignRewards(JSON.stringify(rewards))).toEqual(rewards);
    expect(parseCampaignRewards(rewards)).toEqual(rewards);
    expect(parseCampaignRewards('not-json')).toBeNull();
    expect(parseCampaignRewards(null)).toBeNull();
    expect(
      parseCampaignRewards('{"type":"physical_rewards","rules":[]}'),
    ).toBeNull();
  });

  it('should label physical rewards separately from generic rewards', () => {
    expect(getCampaignRewardTypeLabel(rewards)).toBe('Physical Reward');
    expect(
      getCampaignRewardTypeLabel({
        type: 'digital_rewards',
        rules: [{ rank: 1, min: 90, reward: 'Badge' }],
      }),
    ).toBe('Reward');
    expect(getCampaignRewardTypeLabel(null)).toBe('Reward');
  });

  it('should map student performance rows into display rows with reward labels', () => {
    const rows = mapCampaignPerformanceRowsToRewardRows(
      [
        createPerformanceRow(),
        createPerformanceRow({
          id: 'performance-2',
          student_id: 'student-2',
          student_name: 'Priya Verma',
          school_name: 'Modern School Noida',
          completion_percentage: 75.4,
          rank: 2,
        }),
      ],
      rewards,
    );

    expect(rows).toEqual([
      expect.objectContaining({
        studentName: 'Rahul Sharma',
        school: 'Delhi Public School',
        completionPercent: 95,
        rewardRank: 1,
        rewardLabel: 'Book',
      }),
      expect.objectContaining({
        studentName: 'Priya Verma',
        completionPercent: 75,
        rewardRank: 2,
        rewardLabel: 'Pen',
      }),
    ]);
  });

  it('should dedupe student performance rows by latest calculated time', () => {
    const older = createPerformanceRow({
      id: 'older-row',
      completion_percentage: 20,
      calculated_at: '2026-07-09T10:00:00.000Z',
    });
    const newer = createPerformanceRow({
      id: 'newer-row',
      completion_percentage: 88,
      calculated_at: '2026-07-11T10:00:00.000Z',
    });

    expect(
      mapCampaignPerformanceRowsToRewardRows([older, newer], rewards),
    ).toEqual([
      expect.objectContaining({
        id: 'newer-row',
        completionPercent: 88,
      }),
    ]);
  });

  it('should remove invalid reward ranks from display rows', () => {
    const rows = mapCampaignPerformanceRowsToRewardRows(
      [
        createPerformanceRow({
          rank: 4,
          completion_percentage: 100,
        }),
      ],
      rewards,
    );

    expect(rows[0]).toEqual(
      expect.objectContaining({
        rewardRank: null,
        rewardLabel: '---',
      }),
    );
  });

  it('should build stable school dropdown options from all rows', () => {
    expect(getCampaignRewardFilterOptions(mappedRows)).toEqual({
      schools: ['All Schools', 'Delhi Public School', 'Modern School Noida'],
    });
  });

  it('should scope class dropdown options to the selected school', () => {
    expect(getCampaignRewardClassOptions(mappedRows, 'All Schools')).toEqual([
      'All Classes',
      '1A',
      '2B',
    ]);
    expect(
      getCampaignRewardClassOptions(mappedRows, 'Delhi Public School'),
    ).toEqual(['All Classes', '1A', '2B']);
    expect(
      getCampaignRewardClassOptions(mappedRows, 'Modern School Noida'),
    ).toEqual(['All Classes', '1A']);
  });

  it('should filter reward rows by selected school and class', () => {
    expect(
      filterCampaignRewardRows(
        mappedRows,
        'Delhi Public School',
        'All Classes',
      ),
    ).toEqual([mappedRows[0], mappedRows[2]]);
    expect(filterCampaignRewardRows(mappedRows, 'All Schools', '1A')).toEqual([
      mappedRows[0],
      mappedRows[1],
    ]);
    expect(
      filterCampaignRewardRows(mappedRows, 'Delhi Public School', '2B'),
    ).toEqual([mappedRows[2]]);
  });

  it('should sort reward rows by numbers and strings', () => {
    expect(
      sortCampaignRewardRows(mappedRows, 'completionPercent', 'desc').map(
        (row) => row.studentName,
      ),
    ).toEqual(['Rahul Sharma', 'Priya Verma', 'Amit Kumar']);
    expect(
      sortCampaignRewardRows(mappedRows, 'studentName', 'asc').map(
        (row) => row.studentName,
      ),
    ).toEqual(['Amit Kumar', 'Priya Verma', 'Rahul Sharma']);
  });

  it('should always place null values at the end for string sorting', () => {
    expect(
      sortCampaignRewardRows(
        [
          ...mappedRows,
          {
            ...mappedRows[0],
            id: 'row-4',
            studentId: 'student-4',
            studentName: 'Zara',
            school: 'Jaipur Public School',
            className: '3A',
            rewardLabel: 'Medal',
            calculatedAt: '2026-07-12T10:00:00.000Z',
          },
          {
            ...mappedRows[0],
            id: 'row-5',
            studentId: 'student-5',
            studentName: 'Neha',
            school: null as unknown as string,
            className: '3B',
            rewardLabel: 'Badge',
            calculatedAt: '2026-07-12T10:00:00.000Z',
          },
        ],
        'school',
        'asc',
      ).map((row) => row.studentName),
    ).toEqual(['Rahul Sharma', 'Amit Kumar', 'Zara', 'Priya Verma', 'Neha']);
  });

  it('should derive safe filter transitions and pagination slices', () => {
    expect(
      getNextSchoolAndClassFilters({
        allClassesLabel: 'All Classes',
        allSchoolsLabel: 'All Schools',
        currentClassFilter: '2B',
        nextSchoolFilter: 'Modern School Noida',
        rows: mappedRows,
      }),
    ).toEqual({
      schoolFilter: 'Modern School Noida',
      classFilter: 'All Classes',
    });

    expect(
      getNextClassFilter({
        allClassesLabel: 'All Classes',
        classFilter: '2B',
        classOptions: ['All Classes', '1A'],
      }),
    ).toBe('All Classes');

    expect(
      paginateCampaignRewardRows(
        Array.from({ length: 12 }, (_, index) => ({
          ...mappedRows[0],
          id: `row-${index}`,
          studentId: `student-${index}`,
          studentName: `Student ${index}`,
        })),
        2,
      ),
    ).toHaveLength(2);
  });

  it('should build campaign reward summary cards', () => {
    expect(buildCampaignRewardSummaryCards(mappedRows)).toEqual([
      expect.objectContaining({ key: 'rank1', count: 1, percent: 33 }),
      expect.objectContaining({ key: 'rank2', count: 1, percent: 33 }),
      expect.objectContaining({ key: 'rank3', count: 0, percent: 0 }),
      expect.objectContaining({ key: 'nonRank', count: 1, percent: 33 }),
      expect.objectContaining({
        key: 'totalStudents',
        count: 3,
        percent: null,
      }),
    ]);
  });

  it('should find and format the latest calculated timestamp', () => {
    expect(getLatestCalculatedAt(mappedRows)).toBe('2026-07-11T10:00:00.000Z');
    expect(formatCampaignRewardLastUpdated('2026-07-10T10:00:00.000Z')).toBe(
      '10 July 2026',
    );
    expect(formatCampaignRewardLastUpdated(null)).toBe('Not calculated yet');
    expect(formatCampaignRewardLastUpdated('bad-date')).toBe(
      'Not calculated yet',
    );
  });

  it('should build CSV-safe export rows for the visible reward table', () => {
    const rows = buildCampaignRewardExportRows(mappedRows, 'Physical Reward');

    expect(rows[0]).toEqual([
      'Student Name',
      'School',
      'Class',
      'Completion %',
      'Reward Rank',
      'Physical Reward',
      'Calculated At',
    ]);
    expect(rows[1]).toEqual([
      'Rahul Sharma',
      'Delhi Public School',
      '1A',
      '95%',
      1,
      'Book',
      '10 July 2026',
    ]);
  });

  it('should build an XLSX workbook for campaign rewards export', async () => {
    const workbook = await buildCampaignRewardExportWorkbook(
      [
        {
          ...mappedRows[0],
          studentName: 'Rahul, Sharma',
          rewardLabel: 'Book "A"',
        },
      ],
      'Physical Reward',
    );

    expect(workbook).toBeInstanceOf(ArrayBuffer);
    expect(workbook.byteLength).toBeGreaterThan(0);
  });
});
