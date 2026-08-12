import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import CampaignSchoolPerformanceReport from './CampaignSchoolPerformanceReport';

const mockSetSearchTerm = jest.fn();
const mockSetDaysFilter = jest.fn();
const mockSetPage = jest.fn();
const mockSetSortKey = jest.fn();
const mockSetSortOrder = jest.fn();
const mockSetActiveStudentsFilter = jest.fn();
const mockHandleExport = jest.fn();
const mockUseCampaignSchoolPerformanceReportState = jest.fn();
const mockGetActiveStudentTone = jest.fn();

const mockState = {
  activeStudentsFilter: null,
  appliedFilter: null,
  appliedSort: null,
  daysFilter: 'last7',
  handleExport: mockHandleExport,
  isExporting: false,
  loading: false,
  page: 1,
  pageCount: 3,
  paginatedRows: [
    {
      id: 'school-1',
      schoolName: 'ABCDF School',
      udise: '09900400901',
      block: 'Block 2',
      activeStudents: 150,
      activeStudentsPercent: 75,
      activeStudentsHomework: 200,
      activeStudentsLearningPathway: 180,
      avgTimeSpentMinutes: 29,
      avgTimeSpentLabel: '29m',
      avgActivitiesCompleted: 17,
    },
  ],
  searchTerm: '',
  setActiveStudentsFilter: mockSetActiveStudentsFilter,
  setDaysFilter: mockSetDaysFilter,
  setPage: mockSetPage,
  setSearchTerm: mockSetSearchTerm,
  setSortKey: mockSetSortKey,
  setSortOrder: mockSetSortOrder,
  sortKey: 'schoolName',
  sortOrder: 'asc' as const,
};

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

jest.mock('../SearchAndFilter', () => ({
  __esModule: true,
  default: ({
    searchTerm,
    onSearchChange,
    searchPlaceholder,
  }: {
    searchTerm: string;
    onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    searchPlaceholder: string;
  }) => (
    <input
      aria-label={searchPlaceholder}
      value={searchTerm}
      onChange={(event) =>
        onSearchChange(event as React.ChangeEvent<HTMLInputElement>)
      }
    />
  ),
}));

jest.mock('../SchoolListDateRangeDropdown', () => ({
  __esModule: true,
  default: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => (
    <button type="button" onClick={() => onChange('campaignDays')}>
      {value}
    </button>
  ),
}));

jest.mock('../SchoolListExportButton', () => ({
  __esModule: true,
  default: ({
    onClick,
    disabled,
  }: {
    onClick: () => void;
    disabled: boolean;
  }) => (
    <button type="button" disabled={disabled} onClick={onClick}>
      Export
    </button>
  ),
}));

jest.mock('../SelectedFilters', () => ({
  __esModule: true,
  default: ({
    filters,
    extraFilters,
    onDeleteFilter,
    getFilterLabel,
  }: {
    filters: Record<string, string[]>;
    extraFilters?: Array<{ key: string; value: string; label: string }>;
    onDeleteFilter: (key: string, value: string) => void;
    getFilterLabel?: (key: string, value: string) => React.ReactNode;
  }) => (
    <div>
      {Object.entries(filters).flatMap(([key, values]) =>
        values.map((value) => (
          <button
            key={`${key}-${value}`}
            type="button"
            onClick={() => onDeleteFilter(key, value)}
          >
            {String(getFilterLabel?.(key, value) ?? value)}
          </button>
        )),
      )}
      {(extraFilters ?? []).map((filter) => (
        <button
          key={filter.key}
          type="button"
          onClick={() => onDeleteFilter(filter.key, filter.value)}
        >
          {filter.label}
        </button>
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

jest.mock('../DataTableBody', () => ({
  __esModule: true,
  default: ({
    columns,
    rows,
    renderHeaderActions,
  }: {
    columns: Array<{
      key: string;
      label: React.ReactNode;
      render?: (
        row: Record<string, React.ReactNode | string | number>,
      ) => React.ReactNode;
    }>;
    rows: Array<Record<string, React.ReactNode | string | number>>;
    renderHeaderActions?: (column: { key: string }) => React.ReactNode;
  }) => (
    <div>
      {columns.map((column) => (
        <div key={column.key}>
          <span>
            {typeof column.label === 'string' ? column.label : column.key}
          </span>
          {renderHeaderActions?.({ key: column.key })}
        </div>
      ))}
      {rows.map((row) => (
        <div key={String(row.id)}>
          {columns.map((column) => (
            <span key={column.key}>
              {column.render
                ? column.render(row)
                : String(row[column.key] ?? '')}
            </span>
          ))}
        </div>
      ))}
    </div>
  ),
}));

jest.mock('./CampaignsOverviewInfoTooltip', () => ({
  __esModule: true,
  default: ({ label }: { label: string }) => <span>{`${label} info`}</span>,
}));

jest.mock('./CampaignSchoolPerformanceReport.helpers', () => ({
  __esModule: true,
  getActiveStudentTone: (...args: unknown[]) =>
    mockGetActiveStudentTone(...args),
  SCHOOL_PERFORMANCE_ACTIVE_STUDENT_FILTERS: [
    {
      key: 'low',
      label: 'Low',
      chipLabel: '<= 30%',
      color: '#EF6C5B',
      bg: '#FCE8E6',
    },
    {
      key: 'mid',
      label: 'Mid',
      chipLabel: '31% - 69%',
      color: '#D6921D',
      bg: '#FEF3C7',
    },
    {
      key: 'high',
      label: 'High',
      chipLabel: '>= 70%',
      color: '#2BA980',
      bg: '#DFF7EB',
    },
  ],
  SCHOOL_PERFORMANCE_COLUMNS: [
    {
      key: 'schoolName',
      label: 'School Name',
      width: 220,
      align: 'left',
      headerAlign: 'left',
    },
    {
      key: 'activeStudents',
      label: 'Active Students',
      width: 138,
      align: 'center',
      headerAlign: 'center',
      tooltip: 'Active students tip',
    },
    {
      key: 'activeStudentsHomework',
      label: 'Active Students Homework',
      width: 156,
      align: 'center',
      headerAlign: 'center',
      tooltip: 'Homework tip',
    },
    {
      key: 'activeStudentsLearningPathway',
      label: 'Active Students Learning Pathway',
      width: 164,
      align: 'center',
      headerAlign: 'center',
      tooltip: 'Pathway tip',
    },
    {
      key: 'avgTimeSpent',
      label: 'Average Time Spent',
      width: 118,
      align: 'center',
      headerAlign: 'center',
      tooltip: 'Time tip',
    },
    {
      key: 'avgActivitiesCompleted',
      label: 'Average Activities Completed',
      width: 144,
      align: 'center',
      headerAlign: 'center',
      tooltip: 'Activities tip',
    },
  ],
  SCHOOL_PERFORMANCE_DAY_FILTERS: [
    { key: 'last7', label: 'Last 7 Days' },
    { key: 'campaignDays', label: 'Campaign Days' },
  ],
  useCampaignSchoolPerformanceReportState: (...args: unknown[]) =>
    mockUseCampaignSchoolPerformanceReportState(...args),
}));

describe('CampaignSchoolPerformanceReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCampaignSchoolPerformanceReportState.mockReturnValue(mockState);
    mockGetActiveStudentTone.mockReturnValue({
      bg: '#DFF7EB',
      color: '#2BA980',
    });
  });

  it('renders the school performance toolbar and table row', () => {
    render(<CampaignSchoolPerformanceReport campaignId="campaign-1" />);

    expect(screen.getByText('Campaign Schools')).toBeInTheDocument();
    expect(screen.getByLabelText('Search School')).toBeInTheDocument();
    expect(screen.getByText('ABCDF School')).toBeInTheDocument();
    expect(screen.getByText('09900400901 - Block 2')).toBeInTheDocument();
    expect(screen.getByText('29m')).toBeInTheDocument();
    expect(screen.getByText('page-1-of-3')).toBeInTheDocument();
  });

  it('forwards search, day filter, export, and pagination actions', () => {
    render(<CampaignSchoolPerformanceReport campaignId="campaign-1" />);

    fireEvent.change(screen.getByLabelText('Search School'), {
      target: { value: 'XYZ' },
    });
    fireEvent.click(screen.getByText('last7'));
    fireEvent.click(screen.getByText('Export'));
    fireEvent.click(screen.getByText('page-1-of-3'));

    expect(mockSetSearchTerm).toHaveBeenCalled();
    expect(mockSetDaysFilter).toHaveBeenCalledWith('campaignDays');
    expect(mockHandleExport).toHaveBeenCalledTimes(1);
    expect(mockSetPage).toHaveBeenCalledWith(2);
  });

  it('opens the active students menu and applies sorting and filters', () => {
    render(<CampaignSchoolPerformanceReport campaignId="campaign-1" />);

    fireEvent.click(screen.getAllByRole('button')[3]);
    fireEvent.click(screen.getByText('Sort Low → High'));
    expect(mockSetSortKey).toHaveBeenCalledWith('activeStudents');
    expect(mockSetSortOrder).toHaveBeenCalledWith('asc');

    fireEvent.click(screen.getAllByRole('button')[3]);
    fireEvent.click(screen.getByText('31% - 69%'));
    expect(mockSetActiveStudentsFilter).toHaveBeenCalledWith('mid');
  });

  it('clears selected chips through the shared chip area', () => {
    mockUseCampaignSchoolPerformanceReportState.mockReturnValueOnce({
      ...mockState,
      appliedFilter: { key: 'mid', label: 'Mid', chipLabel: '31% - 69%' },
      appliedSort: 'Sort Low → High',
    });

    render(<CampaignSchoolPerformanceReport campaignId="campaign-1" />);

    fireEvent.click(screen.getByText('Active Students: 31% - 69%'));
    fireEvent.click(screen.getByText('Sort Low → High'));

    expect(mockSetActiveStudentsFilter).toHaveBeenCalledWith(null);
    expect(mockSetSortKey).toHaveBeenCalledWith('schoolName');
    expect(mockSetSortOrder).toHaveBeenCalledWith('asc');
  });
});
