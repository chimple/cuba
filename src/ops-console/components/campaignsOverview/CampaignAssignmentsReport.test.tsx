import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import CampaignAssignmentsReport from './CampaignAssignmentsReport';
import {
  CAMPAIGN_ASSIGNMENTS_REPORT_SUBTAB,
  buildCampaignAssignmentsSummaryCards,
  mapAssignmentReportRows,
} from './CampaignAssignmentsReport.helpers';
import { ServiceConfig } from '../../../services/ServiceConfig';
import logger from '../../../utility/logger';

type AssignmentSummary = {
  totalAssignments: number;
  assignedStudents: number;
  activeStudents: number;
  averageAssignmentsCompletion: number;
};

type AssignmentRow = {
  subjectId: string;
  subjectName: string;
  lessonsAssigned: number;
  completionPercent: number;
};

type AssignmentReportResponse = {
  summary: AssignmentSummary;
  rows: AssignmentRow[];
};

type DeferredReport = {
  promise: Promise<AssignmentReportResponse>;
  resolve: (value: AssignmentReportResponse) => void;
  reject: (reason?: Error) => void;
};

type MockColumn = {
  key: string;
  label: string;
};

type MockTableRow = {
  id: string;
  subject: string;
  lessonsAssigned: number;
  completionPercent: string;
};

const mockUseMediaQuery = jest.fn<
  boolean,
  [string, { defaultMatches: boolean; noSsr: boolean }]
>(() => false);

const mockDataTableBody = jest.fn<
  React.ReactElement,
  [
    {
      columns: MockColumn[];
      rows: MockTableRow[];
      loading?: boolean;
    },
  ]
>();

jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: (
      query: string,
      options: { defaultMatches: boolean; noSsr: boolean },
    ) => mockUseMediaQuery(query, options),
  };
});

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

jest.mock('../../../services/ServiceConfig', () => ({
  ServiceConfig: {
    getI: jest.fn(),
  },
}));

jest.mock('../../../utility/logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
  },
}));

jest.mock('./CampaignsOverviewInfoTooltip', () => ({
  __esModule: true,
  default: ({ label, message }: { label: string; message: string }) => (
    <span data-testid={`tooltip-${label.replace(/\s+/g, '-')}`}>{message}</span>
  ),
}));

jest.mock('../DataTableBody', () => ({
  __esModule: true,
  default: (props: {
    columns: MockColumn[];
    rows: MockTableRow[];
    loading?: boolean;
  }) => {
    mockDataTableBody(props);
    return (
      <div data-testid="assignments-data-table">
        <span data-testid="assignments-data-table-loading">
          {String(Boolean(props.loading))}
        </span>
        <div data-testid="assignments-data-table-columns">
          {props.columns.map((column) => (
            <span key={column.key}>{column.label}</span>
          ))}
        </div>
        <div data-testid="assignments-data-table-rows">
          {props.rows.map((row) => (
            <div key={row.id}>
              <span>{row.subject}</span>
              <span>{row.lessonsAssigned}</span>
              <span>{row.completionPercent}</span>
            </div>
          ))}
        </div>
      </div>
    );
  },
}));

const apiHandler = {
  getCampaignAssignmentsReport: jest.fn(),
};

const buildAssignmentRow = (
  overrides: Partial<AssignmentRow> = {},
): AssignmentRow => ({
  subjectId: 'subject-1',
  subjectName: 'Mathematics',
  lessonsAssigned: 23,
  completionPercent: 57,
  ...overrides,
});

const buildAssignmentResponse = (
  overrides: Partial<AssignmentReportResponse> = {},
): AssignmentReportResponse => ({
  summary: {
    totalAssignments: 120,
    assignedStudents: 3942,
    activeStudents: 2723,
    averageAssignmentsCompletion: 38,
    ...(overrides.summary ?? {}),
  },
  rows: overrides.rows ?? [
    buildAssignmentRow(),
    buildAssignmentRow({
      subjectId: 'subject-2',
      subjectName: 'Science',
      lessonsAssigned: 31,
      completionPercent: 55,
    }),
    buildAssignmentRow({
      subjectId: 'subject-3',
      subjectName: 'English',
      lessonsAssigned: 23,
      completionPercent: 26,
    }),
    buildAssignmentRow({
      subjectId: 'subject-4',
      subjectName: 'Hindi',
      lessonsAssigned: 36,
      completionPercent: 42,
    }),
  ],
});

const createDeferredReport = (): DeferredReport => {
  let resolve!: (value: AssignmentReportResponse) => void;
  let reject!: (reason?: Error) => void;
  const promise = new Promise<AssignmentReportResponse>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const renderReport = (props?: {
  campaignId?: string;
  totalStudents?: number | null;
}) =>
  render(
    <CampaignAssignmentsReport
      campaignId={props?.campaignId}
      totalStudents={props?.totalStudents}
    />,
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockUseMediaQuery.mockReturnValue(false);
  (ServiceConfig.getI as jest.Mock).mockReturnValue({ apiHandler });
  apiHandler.getCampaignAssignmentsReport.mockResolvedValue(
    buildAssignmentResponse(),
  );
});

describe('CampaignAssignmentsReport helpers', () => {
  it('exports the assignments subtab constant expected by the parent reports page', () => {
    expect(CAMPAIGN_ASSIGNMENTS_REPORT_SUBTAB).toBe('Assignments');
  });

  it('builds summary cards with labels, info text, and numeric formatting', () => {
    const cards = buildCampaignAssignmentsSummaryCards({
      totalAssignments: 120,
      assignedStudents: 3942,
      activeStudents: 2723,
      averageAssignmentsCompletion: 38,
    });

    expect(cards).toHaveLength(4);
    expect(cards[0]).toEqual(
      expect.objectContaining({
        key: 'totalAssignments',
        label: 'Total Assignments',
        value: '120',
      }),
    );
    expect(cards[1]).toEqual(
      expect.objectContaining({
        key: 'assignedStudents',
        label: 'Assigned Students',
        value: '3,942',
      }),
    );
    expect(cards[2]).toEqual(
      expect.objectContaining({
        key: 'activeStudents',
        label: 'Active Students',
        value: '2,723',
      }),
    );
    expect(cards[3]).toEqual(
      expect.objectContaining({
        key: 'averageAssignmentsCompletion',
        label: 'Average Assignments Completion',
        value: '38%',
      }),
    );
    expect(cards[3].info).toBe(
      'Average number of assignments completed per active student during the selected period.',
    );
  });

  it('formats large average assignment completion values with locale separators and percent suffix', () => {
    const cards = buildCampaignAssignmentsSummaryCards({
      totalAssignments: 450,
      assignedStudents: 10987,
      activeStudents: 2789,
      averageAssignmentsCompletion: 1000,
    });

    const averageCard = cards.find(
      (card) => card.key === 'averageAssignmentsCompletion',
    );

    expect(averageCard?.value).toBe('1,000%');
  });

  it('keeps one decimal place for fractional average assignment completion values', () => {
    const cards = buildCampaignAssignmentsSummaryCards({
      totalAssignments: 450,
      assignedStudents: 10987,
      activeStudents: 2789,
      averageAssignmentsCompletion: 1000.4,
    });

    const averageCard = cards.find(
      (card) => card.key === 'averageAssignmentsCompletion',
    );

    expect(averageCard?.value).toBe('1,000.4%');
  });

  it('maps assignment rows into table rows and rounds subject completion percentages', () => {
    const rows = mapAssignmentReportRows([
      buildAssignmentRow({
        subjectId: 'subject-1',
        subjectName: 'Mathematics',
        lessonsAssigned: 14,
        completionPercent: 57.2,
      }),
      buildAssignmentRow({
        subjectId: 'subject-2',
        subjectName: 'Science',
        lessonsAssigned: 18,
        completionPercent: 55.9,
      }),
    ]);

    expect(rows).toEqual([
      {
        id: 'subject-1',
        subject: 'Mathematics',
        lessonsAssigned: 14,
        completionPercent: '57%',
      },
      {
        id: 'subject-2',
        subject: 'Science',
        lessonsAssigned: 18,
        completionPercent: '56%',
      },
    ]);
  });
});

describe('CampaignAssignmentsReport desktop rendering', () => {
  it('renders the assignment report title, widgets, tooltips, and desktop rows', async () => {
    renderReport({
      campaignId: 'campaign-1',
      totalStudents: 3942,
    });

    expect(await screen.findByText('Assignment Report')).toBeInTheDocument();
    expect(screen.getByText('Total Assignments')).toBeInTheDocument();
    expect(screen.getByText('Assigned Students')).toBeInTheDocument();
    expect(screen.getByText('Active Students')).toBeInTheDocument();
    expect(
      screen.getByText('Average Assignments Completion'),
    ).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('3,942')).toBeInTheDocument();
    expect(screen.getByText('2,723')).toBeInTheDocument();
    expect(screen.getByText('38%')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-Total-Assignments')).toHaveTextContent(
      'Total number of assignments assigned through the campaign while creating the campaign.',
    );
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('Science')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Hindi')).toBeInTheDocument();
    expect(screen.getByText('57%')).toBeInTheDocument();
    expect(screen.getByText('55%')).toBeInTheDocument();
    expect(screen.getByText('26%')).toBeInTheDocument();
    expect(screen.getByText('42%')).toBeInTheDocument();
    expect(apiHandler.getCampaignAssignmentsReport).toHaveBeenCalledWith(
      'campaign-1',
      { totalStudents: 3942 },
    );
    expect(mockDataTableBody.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('passes the expected columns into DataTableBody for the desktop table', async () => {
    renderReport({
      campaignId: 'campaign-1',
      totalStudents: 3942,
    });

    await screen.findByText('Assignment Report');

    const latestCall = mockDataTableBody.mock.calls.at(-1);
    const props = latestCall?.[0];

    expect(props?.columns).toEqual([
      {
        key: 'subject',
        label: 'Subject',
        sortable: false,
        width: '40%',
      },
      {
        key: 'lessonsAssigned',
        label: 'Lessons Assigned',
        sortable: false,
        width: '30%',
      },
      {
        key: 'completionPercent',
        label: 'Completion %',
        sortable: false,
        width: '30%',
      },
    ]);
    expect(props?.rows).toEqual([
      {
        id: 'subject-1',
        subject: 'Mathematics',
        lessonsAssigned: 23,
        completionPercent: '57%',
      },
      {
        id: 'subject-2',
        subject: 'Science',
        lessonsAssigned: 31,
        completionPercent: '55%',
      },
      {
        id: 'subject-3',
        subject: 'English',
        lessonsAssigned: 23,
        completionPercent: '26%',
      },
      {
        id: 'subject-4',
        subject: 'Hindi',
        lessonsAssigned: 36,
        completionPercent: '42%',
      },
    ]);
  });

  it('renders very large average assignment completion values with separators and percent suffix', async () => {
    apiHandler.getCampaignAssignmentsReport.mockResolvedValueOnce(
      buildAssignmentResponse({
        summary: {
          totalAssignments: 500,
          assignedStudents: 25000,
          activeStudents: 2500,
          averageAssignmentsCompletion: 1000,
        },
      }),
    );

    renderReport({
      campaignId: 'campaign-2',
      totalStudents: 25000,
    });

    expect(await screen.findByText('1,000%')).toBeInTheDocument();
  });

  it('shows loading true in the shared table before the API resolves', async () => {
    const deferred = createDeferredReport();
    apiHandler.getCampaignAssignmentsReport.mockReturnValueOnce(
      deferred.promise,
    );

    renderReport({
      campaignId: 'campaign-loading',
      totalStudents: 100,
    });

    await waitFor(() =>
      expect(
        screen.getByTestId('assignments-data-table-loading'),
      ).toHaveTextContent('true'),
    );

    deferred.resolve(buildAssignmentResponse());

    await waitFor(() =>
      expect(
        screen.getByTestId('assignments-data-table-loading'),
      ).toHaveTextContent('false'),
    );
  });

  it('renders fallback summary values when the API request fails', async () => {
    apiHandler.getCampaignAssignmentsReport.mockRejectedValueOnce(
      new Error('report failed'),
    );

    renderReport({
      campaignId: 'campaign-error',
      totalStudents: 900,
    });

    expect(await screen.findByText('Assignment Report')).toBeInTheDocument();
    expect(screen.getByText('900')).toBeInTheDocument();
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    expect(logger.error).toHaveBeenCalled();
  });

  it('does not call the API when the campaign id is missing and shows default zeros', () => {
    renderReport({
      campaignId: undefined,
      totalStudents: 888,
    });

    expect(screen.getByText('Assignment Report')).toBeInTheDocument();
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(apiHandler.getCampaignAssignmentsReport).not.toHaveBeenCalled();
  });

  it('re-fetches the report when totalStudents changes because assignedStudents comes from the overview page', async () => {
    const { rerender } = render(
      <CampaignAssignmentsReport campaignId="campaign-1" totalStudents={100} />,
    );

    await screen.findByText('Assignment Report');

    rerender(
      <CampaignAssignmentsReport campaignId="campaign-1" totalStudents={200} />,
    );

    await waitFor(() =>
      expect(apiHandler.getCampaignAssignmentsReport).toHaveBeenLastCalledWith(
        'campaign-1',
        { totalStudents: 200 },
      ),
    );
    expect(apiHandler.getCampaignAssignmentsReport).toHaveBeenCalledTimes(2);
  });
});

describe('CampaignAssignmentsReport mobile rendering', () => {
  it('renders mobile cards instead of the shared table when the media query matches', async () => {
    mockUseMediaQuery.mockReturnValue(true);

    renderReport({
      campaignId: 'campaign-mobile',
      totalStudents: 3942,
    });

    expect(await screen.findByText('Assignment Report')).toBeInTheDocument();
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('Science')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Hindi')).toBeInTheDocument();
    expect(screen.getAllByText('Lessons Assigned').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Completion %').length).toBeGreaterThan(0);
    expect(
      screen.queryByTestId('assignments-data-table'),
    ).not.toBeInTheDocument();
    expect(mockDataTableBody).not.toHaveBeenCalled();
  });

  it('still renders the formatted average widget value on mobile', async () => {
    mockUseMediaQuery.mockReturnValue(true);
    apiHandler.getCampaignAssignmentsReport.mockResolvedValueOnce(
      buildAssignmentResponse({
        summary: {
          totalAssignments: 100,
          assignedStudents: 3000,
          activeStudents: 400,
          averageAssignmentsCompletion: 1000.4,
        },
      }),
    );

    renderReport({
      campaignId: 'campaign-mobile-format',
      totalStudents: 3000,
    });

    expect(await screen.findByText('1,000.4%')).toBeInTheDocument();
  });
});

describe('CampaignAssignmentsReport data contract coverage', () => {
  it('sends zero totalStudents when the parent passes null so the API gets a stable numeric payload', async () => {
    renderReport({
      campaignId: 'campaign-null-students',
      totalStudents: null,
    });

    await screen.findByText('Assignment Report');

    expect(apiHandler.getCampaignAssignmentsReport).toHaveBeenCalledWith(
      'campaign-null-students',
      { totalStudents: 0 },
    );
  });

  it('renders an empty rows state cleanly when the API returns no subject rows', async () => {
    apiHandler.getCampaignAssignmentsReport.mockResolvedValueOnce(
      buildAssignmentResponse({
        summary: {
          totalAssignments: 0,
          assignedStudents: 50,
          activeStudents: 0,
          averageAssignmentsCompletion: 0,
        },
        rows: [],
      }),
    );

    renderReport({
      campaignId: 'campaign-empty',
      totalStudents: 50,
    });

    expect(await screen.findByText('Assignment Report')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();

    const latestCall = mockDataTableBody.mock.calls.at(-1);
    expect(latestCall?.[0].rows).toEqual([]);
  });

  it('keeps row ordering exactly as provided by the API layer because sorting is owned by the backend payload', async () => {
    apiHandler.getCampaignAssignmentsReport.mockResolvedValueOnce(
      buildAssignmentResponse({
        rows: [
          buildAssignmentRow({
            subjectId: 'subject-10',
            subjectName: 'Zulu',
            lessonsAssigned: 4,
            completionPercent: 12,
          }),
          buildAssignmentRow({
            subjectId: 'subject-11',
            subjectName: 'Alpha',
            lessonsAssigned: 6,
            completionPercent: 18,
          }),
        ],
      }),
    );

    renderReport({
      campaignId: 'campaign-ordered',
      totalStudents: 80,
    });

    expect(await screen.findByText('Zulu')).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();

    const latestCall = mockDataTableBody.mock.calls.at(-1);
    expect(latestCall?.[0].rows).toEqual([
      {
        id: 'subject-10',
        subject: 'Zulu',
        lessonsAssigned: 4,
        completionPercent: '12%',
      },
      {
        id: 'subject-11',
        subject: 'Alpha',
        lessonsAssigned: 6,
        completionPercent: '18%',
      },
    ]);
  });

  it('renders all tooltip copy so report help text remains attached to the cards', async () => {
    renderReport({
      campaignId: 'campaign-tooltips',
      totalStudents: 3942,
    });

    await screen.findByText('Assignment Report');

    expect(screen.getByTestId('tooltip-Total-Assignments')).toHaveTextContent(
      'Total number of assignments assigned through the campaign while creating the campaign.',
    );
    expect(screen.getByTestId('tooltip-Assigned-Students')).toHaveTextContent(
      'Total number of students who received at least one assignment through the campaign.',
    );
    expect(screen.getByTestId('tooltip-Active-Students')).toHaveTextContent(
      'Total number of students who completed at least one assignment during the campaign period.',
    );
    expect(
      screen.getByTestId('tooltip-Average-Assignments-Completion'),
    ).toHaveTextContent(
      'Average number of assignments completed per active student during the selected period.',
    );
  });

  it('renders a zero-percent average widget on default state even though the metric can exceed one hundred later', () => {
    renderReport({
      campaignId: undefined,
      totalStudents: undefined,
    });

    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('supports four-digit assigned student formatting independently from the average widget formatting', async () => {
    apiHandler.getCampaignAssignmentsReport.mockResolvedValueOnce(
      buildAssignmentResponse({
        summary: {
          totalAssignments: 24,
          assignedStudents: 1000,
          activeStudents: 250,
          averageAssignmentsCompletion: 123.4,
        },
      }),
    );

    renderReport({
      campaignId: 'campaign-thousand-students',
      totalStudents: 1000,
    });

    expect(await screen.findByText('1,000')).toBeInTheDocument();
    expect(screen.getByText('123.4%')).toBeInTheDocument();
  });

  it('keeps the assignment report shell visible while data is being loaded so layout does not jump', async () => {
    const deferred = createDeferredReport();
    apiHandler.getCampaignAssignmentsReport.mockReturnValueOnce(
      deferred.promise,
    );

    renderReport({
      campaignId: 'campaign-shell',
      totalStudents: 20,
    });

    expect(screen.getByText('Assignment Report')).toBeInTheDocument();
    expect(
      screen.getByTestId('assignments-data-table-loading'),
    ).toHaveTextContent('true');

    deferred.resolve(buildAssignmentResponse());

    await screen.findByText('Mathematics');
  });

  it('maps subject completion percentages using the helper formatter before they reach the table', async () => {
    apiHandler.getCampaignAssignmentsReport.mockResolvedValueOnce(
      buildAssignmentResponse({
        rows: [
          buildAssignmentRow({
            subjectId: 'subject-99',
            subjectName: 'Art',
            lessonsAssigned: 3,
            completionPercent: 49.6,
          }),
        ],
      }),
    );

    renderReport({
      campaignId: 'campaign-rounding',
      totalStudents: 10,
    });

    expect(await screen.findByText('Art')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();

    const latestCall = mockDataTableBody.mock.calls.at(-1);
    expect(latestCall?.[0].rows).toEqual([
      {
        id: 'subject-99',
        subject: 'Art',
        lessonsAssigned: 3,
        completionPercent: '50%',
      },
    ]);
  });
});
