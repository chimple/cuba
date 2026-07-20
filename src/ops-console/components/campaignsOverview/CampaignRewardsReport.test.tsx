import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import CampaignRewardsReport from './CampaignRewardsReport';
import CampaignRewardsSummaryCards from './CampaignRewardsSummaryCards';
import CampaignRewardsTable, {
  CampaignRewardsReportHeader,
} from './CampaignRewardsTable';
import type { CampaignRewardRow } from './CampaignRewardsReport.helpers';
import { ServiceConfig } from '../../../services/ServiceConfig';

const mockDownload = jest.fn();

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

jest.mock('../../../services/ServiceConfig', () => ({
  ServiceConfig: {
    getI: jest.fn(),
  },
}));

jest.mock('../../../utility/util', () => ({
  Util: {
    handleBlobDownloadAndSave: (...args: unknown[]) => mockDownload(...args),
  },
}));

jest.mock('../DataTableBody', () => ({
  __esModule: true,
  default: ({
    columns,
    rows,
    loading,
    onSort,
    order,
    orderBy,
  }: {
    columns: Array<{
      key: string;
      label: string;
      render?: (row: CampaignRewardRow) => React.ReactNode;
    }>;
    rows: CampaignRewardRow[];
    loading: boolean;
    onSort: (key: string) => void;
    order: 'asc' | 'desc';
    orderBy: string;
  }) => (
    <div data-testid="rewards-data-table">
      <span data-testid="table-loading">{String(loading)}</span>
      <span data-testid="table-order">{`${orderBy}:${order}`}</span>
      {columns.map((column) => (
        <button
          key={column.key}
          type="button"
          onClick={() => onSort(column.key)}
        >
          {column.label}
        </button>
      ))}
      {rows.map((row) => (
        <div key={row.id}>
          <span>{row.studentName}</span>
          <span>{row.school}</span>
          <span>{row.className}</span>
          <span>{row.rewardLabel}</span>
          <span>{columnText(columns, 'completionPercent', row)}</span>
          <span>{columnText(columns, 'rewardRank', row)}</span>
        </div>
      ))}
    </div>
  ),
}));

jest.mock('../DataTablePagination', () => ({
  __esModule: true,
  default: ({
    page,
    pageCount,
    onPageChange,
  }: {
    page: number;
    pageCount: number;
    onPageChange: (page: number) => void;
  }) => (
    <button type="button" onClick={() => onPageChange(page + 1)}>
      {`page-${page}-of-${pageCount}`}
    </button>
  ),
}));

const columnText = (
  columns: Array<{
    key: string;
    render?: (row: CampaignRewardRow) => React.ReactNode;
  }>,
  key: string,
  row: CampaignRewardRow,
) => {
  const rendered = columns.find((column) => column.key === key)?.render?.(row);
  if (React.isValidElement(rendered)) {
    return rendered.props.label ?? rendered.props.children;
  }
  return rendered ?? '';
};

const buildRewardRow = (
  overrides: Partial<CampaignRewardRow> = {},
): CampaignRewardRow => ({
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
  ...overrides,
});

const apiHandler = {
  getCampaignRewardsReport: jest.fn(),
};

describe('Campaign rewards TSX components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ServiceConfig.getI as jest.Mock).mockReturnValue({ apiHandler });
    apiHandler.getCampaignRewardsReport.mockResolvedValue({
      rows: [
        {
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
        },
        {
          calculated_at: '2026-07-10T10:00:00.000Z',
          campaign_id: 'campaign-1',
          class_id: 'class-2',
          class_name: '2B',
          completion_percentage: 88,
          created_at: '2026-07-10T10:00:00.000Z',
          id: 'performance-2',
          is_deleted: false,
          program_id: 'program-1',
          rank: 2,
          school_id: 'school-1',
          school_name: 'Delhi Public School',
          student_id: 'student-2',
          student_name: 'Priya Verma',
          updated_at: '2026-07-10T10:00:00.000Z',
        },
        {
          calculated_at: '2026-07-10T10:00:00.000Z',
          campaign_id: 'campaign-1',
          class_id: 'class-3',
          class_name: '3A',
          completion_percentage: 72,
          created_at: '2026-07-10T10:00:00.000Z',
          id: 'performance-3',
          is_deleted: false,
          program_id: 'program-1',
          rank: 3,
          school_id: 'school-2',
          school_name: 'Modern School Noida',
          student_id: 'student-3',
          student_name: 'Amit Kumar',
          updated_at: '2026-07-10T10:00:00.000Z',
        },
      ],
      total: 3,
    });
  });

  it('renders summary cards with counts, percentages, and labels', () => {
    render(
      <CampaignRewardsSummaryCards
        cards={[
          {
            key: 'rank1',
            label: 'Reward Rank 1',
            count: 3,
            percent: 30,
            info: 'Rank one info',
          },
          {
            key: 'total',
            label: 'Total No. Students',
            count: 10,
            percent: null,
            info: 'Total info',
          },
        ]}
      />,
    );

    expect(screen.getByText('Reward Rank 1')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
    expect(screen.getByText('Total No. Students')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('renders rewards header filters and triggers export', () => {
    const onExport = jest.fn();
    const onSchoolFilterChange = jest.fn();
    const onClassFilterChange = jest.fn();

    render(
      <CampaignRewardsReportHeader
        classFilter="All Classes"
        classOptions={['All Classes', '1A']}
        isExporting={false}
        lastUpdated="10 July 2026"
        schoolFilter="All Schools"
        schoolOptions={['All Schools', 'Delhi Public School']}
        onClassFilterChange={onClassFilterChange}
        onExport={onExport}
        onSchoolFilterChange={onSchoolFilterChange}
      />,
    );

    expect(screen.getByText('Students Reward Report')).toBeInTheDocument();
    expect(screen.getByText('10 July 2026')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(screen.getByText('Delhi Public School'));
    expect(onSchoolFilterChange).toHaveBeenCalledWith('Delhi Public School');
    fireEvent.click(screen.getByText('Export'));
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it('passes reward rows, sort, and pagination events into the shared table', () => {
    const onSort = jest.fn();
    const onPageChange = jest.fn();

    render(
      <CampaignRewardsTable
        loading={false}
        order="desc"
        orderBy="completionPercent"
        page={1}
        pageCount={2}
        rewardTypeLabel="Physical Reward"
        rows={[buildRewardRow()]}
        onPageChange={onPageChange}
        onSort={onSort}
      />,
    );

    expect(screen.getByTestId('table-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('table-order')).toHaveTextContent(
      'completionPercent:desc',
    );
    expect(screen.getByText('Rahul Sharma')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
    fireEvent.click(screen.getByText('COMPLETION %'));
    expect(onSort).toHaveBeenCalledWith('completionPercent');
    fireEvent.click(screen.getByText('page-1-of-2'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('loads rewards report data once and scopes classes to the selected school', async () => {
    render(
      <CampaignRewardsReport
        campaignId="campaign-1"
        rewards={{
          type: 'physical_rewards',
          rules: [{ rank: 1, min: 85, reward: 'Book' }],
        }}
      />,
    );

    expect(apiHandler.getCampaignRewardsReport).toHaveBeenCalledWith(
      'campaign-1',
    );
    await screen.findByText('Rahul Sharma');

    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(
      within(screen.getByRole('listbox')).getByText('Delhi Public School'),
    );

    fireEvent.mouseDown(screen.getAllByRole('combobox')[1]);
    expect(
      within(screen.getByRole('listbox')).queryByText('3A'),
    ).not.toBeInTheDocument();
    fireEvent.click(within(screen.getByRole('listbox')).getByText('2B'));

    expect(screen.getByText('Priya Verma')).toBeInTheDocument();
    expect(screen.queryByText('Amit Kumar')).not.toBeInTheDocument();

    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(
      within(screen.getByRole('listbox')).getByText('All Schools'),
    );

    await waitFor(() => {
      expect(screen.getByText('Amit Kumar')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('All Classes')).toBeInTheDocument();
    expect(apiHandler.getCampaignRewardsReport).toHaveBeenCalledTimes(1);
  });
});
