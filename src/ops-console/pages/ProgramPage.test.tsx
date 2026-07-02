import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PROGRAM_TAB } from '../../common/constants';
import type { Column } from '../components/DataTableBody';
import type {
  DateRangeValue,
  Filters,
  ProgramListRow,
} from './ProgramPageLogic';
import ProgramPage from './ProgramPage';
import { RoleType } from '../../interface/modelInterfaces';

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

type MockProgramListTableProps = {
  selectedTab: PROGRAM_TAB;
  onTabChange: (value: PROGRAM_TAB) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: Filters;
  tempFilters: Filters;
  isFilterOpen: boolean;
  onOpenFilters: () => void;
  onCloseFilters: () => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  onDeleteFilter: (key: string, value: string) => void;
  onTempFilterChange: (name: string, value: string[]) => void;
  selectedDateRange: DateRangeValue;
  onDateRangeChange: (value: DateRangeValue) => void;
  isExportDisabled: boolean;
  isExporting: boolean;
  onExport: () => void | Promise<void>;
  onNewProgram: () => void;
  columns: Column<ProgramListRow>[];
  rows: ProgramListRow[];
  isLoading: boolean;
  orderBy: string;
  orderDir: 'asc' | 'desc';
  onSort: (key: string) => void;
  page: number;
  pageCount: number;
  onHeaderFilterChange: (filterKey: string, value: string) => void;
  onPageChange: (page: number) => void;
};

jest.mock('../components/ProgramListTable', () => {
  return function MockProgramListTable(props: MockProgramListTableProps) {
    return (
      <div data-testid="program-list-table">
        <span data-testid="selected-tab">{props.selectedTab}</span>
        <span data-testid="search-term">{props.searchTerm}</span>
        <span data-testid="date-range">{props.selectedDateRange}</span>
        <span data-testid="row-count">{props.rows.length}</span>
        <span data-testid="column-count">{props.columns.length}</span>
        <button
          type="button"
          onClick={() => props.onTabChange('at_home' as PROGRAM_TAB)}
        >
          change tab
        </button>
        <button type="button" onClick={() => props.onSearchChange('math')}>
          search
        </button>
        <button type="button" onClick={props.onOpenFilters}>
          open filters
        </button>
        <button type="button" onClick={props.onCloseFilters}>
          close filters
        </button>
        <button type="button" onClick={props.onApplyFilters}>
          apply filters
        </button>
        <button type="button" onClick={props.onClearFilters}>
          clear filters
        </button>
        <button
          type="button"
          onClick={() => props.onDeleteFilter('partner', 'Akshara')}
        >
          delete filter
        </button>
        <button
          type="button"
          onClick={() => props.onTempFilterChange('state', ['KARNATAKA'])}
        >
          temp filter
        </button>
        <button type="button" onClick={() => props.onDateRangeChange('30d')}>
          date range
        </button>
        <button type="button" onClick={() => props.onExport()}>
          export
        </button>
        <button type="button" onClick={props.onNewProgram}>
          new program
        </button>
        <button type="button" onClick={() => props.onSort('totalSchools')}>
          sort
        </button>
        <button
          type="button"
          onClick={() =>
            props.onHeaderFilterChange('onboardedStudentsPct', 'Low')
          }
        >
          column filter
        </button>
        <button type="button" onClick={() => props.onPageChange(2)}>
          page change
        </button>
      </div>
    );
  };
});

const mockSetSelectedTab = jest.fn();
const mockSetSearchTerm = jest.fn();
const mockSetFilters = jest.fn();
const mockSetTempFilters = jest.fn();
const mockSetIsFilterOpen = jest.fn();
const mockSetSelectedDateRange = jest.fn();
const mockSetPage = jest.fn();
const mockHandleClearFilters = jest.fn();
const mockHandleExportPrograms = jest.fn();
const mockHandleSort = jest.fn();
const mockHandleHeaderFilterChange = jest.fn();
const mockHistoryPush = jest.fn();
const mockScrollTo = jest.fn();
let mockRoles: RoleType[] = [RoleType.SUPER_ADMIN];

jest.mock('../../redux/hooks', () => ({
  useAppSelector: () => ({ roles: mockRoles }),
}));

jest.mock('./ProgramPageLogic', () => ({
  useProgramPageLogic: () => ({
    selectedTab: 'all',
    setSelectedTab: mockSetSelectedTab,
    searchTerm: '',
    setSearchTerm: mockSetSearchTerm,
    filters: { partner: ['Akshara'] },
    tempFilters: { state: ['KARNATAKA'] },
    setFilters: mockSetFilters,
    setTempFilters: mockSetTempFilters,
    filterOptions: {},
    isFilterOpen: false,
    setIsFilterOpen: mockSetIsFilterOpen,
    handleClearFilters: mockHandleClearFilters,
    selectedDateRange: '7d',
    setSelectedDateRange: mockSetSelectedDateRange,
    isExportDisabled: false,
    isExporting: false,
    handleExportPrograms: mockHandleExportPrograms,
    history: { push: mockHistoryPush },
    newProgramPath: '/admin-home-page/new-program',
    columns: [{ key: 'programName', label: 'Program Name' }],
    rows: [
      {
        id: 'program-1',
        programName: {
          value: 'Math',
          text: 'Math',
          exportValueText: 'Math',
          exportPercentText: '--',
          render: 'Math',
        },
      },
    ],
    isLoading: false,
    orderBy: 'programName',
    orderDir: 'asc',
    handleSort: mockHandleSort,
    tableScrollRef: { current: { scrollTo: mockScrollTo } },
    page: 1,
    pageCount: 3,
    handleHeaderFilterChange: mockHandleHeaderFilterChange,
    setPage: mockSetPage,
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockRoles = [RoleType.SUPER_ADMIN];
});

it('renders the Program page and wires table actions to page logic', async () => {
  const user = userEvent.setup();
  render(<ProgramPage />);

  expect(screen.getByText('Programs')).toBeInTheDocument();
  expect(screen.getByTestId('program-list-table')).toBeInTheDocument();
  expect(screen.getByTestId('selected-tab')).toHaveTextContent(PROGRAM_TAB.ALL);
  expect(screen.getByTestId('date-range')).toHaveTextContent('7d');
  expect(screen.getByTestId('row-count')).toHaveTextContent('1');
  expect(screen.getByTestId('column-count')).toHaveTextContent('1');

  await user.click(screen.getByRole('button', { name: 'change tab' }));
  expect(mockSetSelectedTab).toHaveBeenCalledWith(PROGRAM_TAB.AT_HOME);
  expect(mockSetPage).toHaveBeenCalledWith(1);

  await user.click(screen.getByRole('button', { name: 'search' }));
  expect(mockSetSearchTerm).toHaveBeenCalledWith('math');
  expect(mockSetPage).toHaveBeenCalledWith(1);

  await user.click(screen.getByRole('button', { name: 'open filters' }));
  expect(mockSetIsFilterOpen).toHaveBeenCalledWith(true);

  await user.click(screen.getByRole('button', { name: 'close filters' }));
  expect(mockSetIsFilterOpen).toHaveBeenCalledWith(false);
  expect(mockSetTempFilters).toHaveBeenCalledWith({ partner: ['Akshara'] });

  await user.click(screen.getByRole('button', { name: 'apply filters' }));
  expect(mockSetFilters).toHaveBeenCalledWith({ state: ['KARNATAKA'] });
  expect(mockSetIsFilterOpen).toHaveBeenCalledWith(false);
  expect(mockSetPage).toHaveBeenCalledWith(1);

  await user.click(screen.getByRole('button', { name: 'clear filters' }));
  expect(mockHandleClearFilters).toHaveBeenCalled();

  await user.click(screen.getByRole('button', { name: 'delete filter' }));
  expect(mockSetFilters).toHaveBeenCalledWith(expect.any(Function));
  expect(mockSetPage).toHaveBeenCalledWith(1);

  await user.click(screen.getByRole('button', { name: 'temp filter' }));
  expect(mockSetTempFilters).toHaveBeenCalledWith(expect.any(Function));

  await user.click(screen.getByRole('button', { name: 'date range' }));
  expect(mockSetSelectedDateRange).toHaveBeenCalledWith('30d');
  expect(mockSetPage).toHaveBeenCalledWith(1);

  await user.click(screen.getByRole('button', { name: 'export' }));
  expect(mockHandleExportPrograms).toHaveBeenCalled();

  await user.click(screen.getByRole('button', { name: 'new program' }));
  expect(mockHistoryPush).toHaveBeenCalledWith('/admin-home-page/new-program');

  await user.click(screen.getByRole('button', { name: 'sort' }));
  expect(mockHandleSort).toHaveBeenCalledWith('totalSchools');

  await user.click(screen.getByRole('button', { name: 'column filter' }));
  expect(mockHandleHeaderFilterChange).toHaveBeenCalledWith(
    'onboardedStudentsPct',
    'Low',
  );

  await user.click(screen.getByRole('button', { name: 'page change' }));
  expect(mockSetPage).toHaveBeenCalledWith(2);
  expect(mockScrollTo).toHaveBeenCalledWith({
    top: 0,
    behavior: 'smooth',
  });
});

it('does not render Program page for non-admin roles', () => {
  mockRoles = [RoleType.EXTERNAL_USER, RoleType.FIELD_COORDINATOR];

  render(<ProgramPage />);

  expect(screen.queryByText('Programs')).not.toBeInTheDocument();
  expect(screen.queryByTestId('program-list-table')).not.toBeInTheDocument();
});
