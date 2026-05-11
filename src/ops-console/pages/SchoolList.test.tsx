import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PAGES } from '../../common/constants';
import { RoleType } from '../../interface/modelInterfaces';
import { useAppSelector } from '../../redux/hooks';
import { RootState } from '../../redux/store';
import { AuthState } from '../../redux/slices/auth/authSlice';
import { Util } from '../../utility/util';
import { runBackgroundWorkerTask } from '../../workers/backgroundWorkerClient';
import SchoolList from './SchoolList';

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useHistory: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useLocation: () => ({
    search: '',
  }),
}));

jest.mock('../../redux/hooks', () => ({
  useAppSelector: jest.fn(),
}));

const mockApiHandler = {
  getSchoolFilterOptionsForSchoolListing: jest.fn(),
  getFilteredSchoolsForSchoolListing: jest.fn(),
};

jest.mock('../../services/ServiceConfig', () => ({
  ServiceConfig: {
    getI: () => ({
      apiHandler: mockApiHandler,
    }),
  },
}));

jest.mock('xlsx-js-style', () => ({
  utils: {
    book_new: jest.fn(() => ({ Sheets: {}, SheetNames: [] })),
    aoa_to_sheet: jest.fn(() => ({ A1: { v: 'sheet' } })),
    encode_cell: jest.fn(({ r, c }: { r: number; c: number }) => {
      const column = String.fromCharCode(65 + c);
      return `${column}${r + 1}`;
    }),
    book_append_sheet: jest.fn(),
  },
  write: jest.fn(() => new ArrayBuffer(8)),
}));

const mockJsZipFile = jest.fn();
const mockJsZipGenerateAsync = jest.fn();
const mockJsZipLoadAsync = jest.fn();

jest.mock('jszip', () => ({
  __esModule: true,
  default: {
    loadAsync: (...args: unknown[]) => mockJsZipLoadAsync(...args),
  },
}));

jest.mock('../../utility/util', () => ({
  Util: {
    handleBlobDownloadAndSave: jest.fn(),
  },
}));

jest.mock('../components/DataTableBody', () => {
  return function MockDataTableBody() {
    return <div data-testid="data-table-body">table</div>;
  };
});

jest.mock('../components/DataTablePagination', () => {
  return function MockPagination() {
    return <div data-testid="pagination">pagination</div>;
  };
});

type MockSearchAndFilterProps = {
  searchTerm?: string;
  onSearchChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFilterClick?: () => void;
};

jest.mock('../components/SearchAndFilter', () => {
  return function MockSearchAndFilter({
    searchTerm,
    onSearchChange,
    onFilterClick,
  }: MockSearchAndFilterProps) {
    return (
      <div data-testid="search-filter">
        <input
          aria-label="Search schools"
          value={searchTerm}
          onChange={onSearchChange}
        />
        <button type="button" onClick={onFilterClick}>
          filter
        </button>
      </div>
    );
  };
});

jest.mock('../components/FilterSlider', () => {
  return function MockFilterSlider() {
    return <div data-testid="filter-slider" />;
  };
});

jest.mock('../components/SelectedFilters', () => {
  return function MockSelectedFilters() {
    return <div data-testid="selected-filters" />;
  };
});

jest.mock('../components/FileUpload', () => {
  return function MockFileUpload() {
    return <div data-testid="file-upload">upload page</div>;
  };
});

const mockUseAppSelector = useAppSelector as jest.MockedFunction<
  typeof useAppSelector
>;

const renderPage = (roles: RoleType[] = [RoleType.SUPER_ADMIN]) => {
  const authState = {
    roles,
  } as AuthState;

  mockUseAppSelector.mockImplementation((selector) =>
    selector({
      auth: authState,
    } as RootState),
  );
  render(<SchoolList />);
};

const openActionsMenu = async () => {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Actions' }));
  return user;
};

beforeEach(() => {
  jest.clearAllMocks();

  mockApiHandler.getSchoolFilterOptionsForSchoolListing.mockResolvedValue({
    programType: [],
    partner: [],
    programManager: [],
    fieldCoordinator: [],
    state: [],
    district: [],
    block: [],
    cluster: [],
  });
  mockApiHandler.getFilteredSchoolsForSchoolListing.mockResolvedValue({
    data: [],
    total: 0,
  });
  mockRunBackgroundWorkerTask.mockResolvedValue({
    fileBuffer: new ArrayBuffer(8),
  } as Awaited<ReturnType<typeof runBackgroundWorkerTask>>);
  mockJsZipFile.mockImplementation((path: string, content?: string) => {
    if (typeof content !== 'undefined') return undefined;
    return {
      async: jest
        .fn()
        .mockResolvedValue(
          '<worksheet><sheetViews><sheetView workbookViewId="0"/></sheetViews></worksheet>',
        ),
    };
  });
  mockJsZipGenerateAsync.mockResolvedValue(new ArrayBuffer(8));
  mockJsZipLoadAsync.mockResolvedValue({
    file: mockJsZipFile,
    generateAsync: mockJsZipGenerateAsync,
  });
});

const mockHandleBlobDownloadAndSave =
  Util.handleBlobDownloadAndSave as jest.Mock;
const mockRunBackgroundWorkerTask =
  runBackgroundWorkerTask as jest.MockedFunction<
    typeof runBackgroundWorkerTask
  >;

describe('SchoolList actions menu', () => {
  it('shows migrate, upload and add school actions for privileged users', async () => {
    renderPage();

    await waitFor(() =>
      expect(
        mockApiHandler.getFilteredSchoolsForSchoolListing,
      ).toHaveBeenCalled(),
    );

    await openActionsMenu();

    expect(
      screen.getByRole('menuitem', { name: 'Migrate' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Upload' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Add School' }),
    ).toBeInTheDocument();
  });

  it('navigates to migrate schools from the actions menu', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() =>
      expect(
        mockApiHandler.getFilteredSchoolsForSchoolListing,
      ).toHaveBeenCalled(),
    );

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'Migrate' }));

    expect(mockPush).toHaveBeenCalledWith(
      `${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}${PAGES.MIGRATE_SCHOOLS_PAGE}`,
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('menuitem', { name: 'Migrate' }),
      ).not.toBeInTheDocument(),
    );
  });

  it('navigates to add school and closes the menu after selection', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() =>
      expect(
        mockApiHandler.getFilteredSchoolsForSchoolListing,
      ).toHaveBeenCalled(),
    );

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'Add School' }));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: `${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}${PAGES.ADD_SCHOOL_PAGE}`,
    });
    await waitFor(() =>
      expect(
        screen.queryByRole('menuitem', { name: 'Add School' }),
      ).not.toBeInTheDocument(),
    );
  });

  it('opens the upload flow from the actions menu', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() =>
      expect(
        mockApiHandler.getFilteredSchoolsForSchoolListing,
      ).toHaveBeenCalled(),
    );

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'Upload' }));

    expect(screen.getByTestId('file-upload')).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Upload' }),
    ).not.toBeInTheDocument();
  });

  it('closes the actions menu when clicking outside', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() =>
      expect(
        mockApiHandler.getFilteredSchoolsForSchoolListing,
      ).toHaveBeenCalled(),
    );

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    expect(
      screen.getByRole('menuitem', { name: 'Upload' }),
    ).toBeInTheDocument();

    const backdrop = document.querySelector('.MuiBackdrop-root');
    expect(backdrop).toBeTruthy();

    await user.click(backdrop as HTMLElement);

    await waitFor(() =>
      expect(
        screen.queryByRole('menuitem', { name: 'Upload' }),
      ).not.toBeInTheDocument(),
    );
  });
});

describe('SchoolList export', () => {
  it('disables export when there are no schools in the table', async () => {
    renderPage();

    const exportButton = await screen.findByRole('button', { name: 'Export' });

    await waitFor(() => expect(exportButton).toBeDisabled());
  });

  it('exports the filtered school metrics rows to an xlsx file', async () => {
    const user = userEvent.setup();
    mockApiHandler.getFilteredSchoolsForSchoolListing.mockResolvedValue({
      data: [
        {
          school_id: 'school-1',
          school_name: 'Alpha School',
          school_performance: 'green',
          state: 'Maharashtra',
          district: 'Pune',
          udise: '1234567890',
          num_students: 120,
          num_teachers: 8,
          onboarded_students: 100,
          activated_students: 80,
          active_students: 60,
          avg_time_spent: 45,
          active_teachers: 6,
          activities_assigned: 14,
          avg_assignments_completed: 10,
          avg_activities_completed: 8,
          program_managers: ['Program Manager 1'],
          field_coordinators: ['Field Coordinator 1'],
        },
      ],
      total: 1,
    });

    renderPage();

    const exportButton = await screen.findByRole('button', { name: 'Export' });
    await waitFor(() => expect(exportButton).toBeEnabled());

    await user.click(exportButton);

    expect(
      mockApiHandler.getFilteredSchoolsForSchoolListing,
    ).toHaveBeenCalledTimes(2);
    expect(
      mockApiHandler.getFilteredSchoolsForSchoolListing,
    ).toHaveBeenLastCalledWith(
      expect.objectContaining({
        page: 1,
        page_size: 500,
        date_range: '7d',
      }),
    );
    expect(mockRunBackgroundWorkerTask).toHaveBeenCalledWith(
      'BUILD_XLSX_FILE',
      {
        sheetNames: ['Schools'],
        sheets: {
          Schools: [
            [
              'School Name',
              'School Performance',
              'Onboarded Students',
              'Activated Students',
              'Activated Students',
              'Active Students',
              'Active Students',
              'Avg Time Spent',
              'Active Teachers',
              'Active Teachers',
              'Activities Assigned',
              'Avg Assignments Completed',
              'Avg Activities Completed',
            ],
            [
              'Alpha School\n1234567890 - Pune',
              'Performing Well',
              '100',
              '80',
              '80%',
              '60',
              '75%',
              '45m',
              '6',
              '100%',
              '14',
              '10',
              '8',
            ],
          ],
        },
        sheetFormats: {
          Schools: 'aoa',
        },
        sheetWrapColumns: {
          Schools: [0],
        },
        sheetFreeze: {
          Schools: {
            xSplit: 1,
            ySplit: 1,
            topLeftCell: 'B2',
            activePane: 'bottomRight',
          },
        },
        sheetMerges: {
          Schools: [
            {
              s: { r: 0, c: 3 },
              e: { r: 0, c: 4 },
            },
            {
              s: { r: 0, c: 5 },
              e: { r: 0, c: 6 },
            },
            {
              s: { r: 0, c: 8 },
              e: { r: 0, c: 9 },
            },
          ],
        },
      },
    );
    expect(mockHandleBlobDownloadAndSave).toHaveBeenCalledWith(
      expect.any(Blob),
      'SchoolMetrics.xlsx',
    );
  });

  it('keeps export disabled while the debounced search is still pending', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    mockApiHandler.getFilteredSchoolsForSchoolListing.mockResolvedValue({
      data: [
        {
          school_id: 'school-1',
          school_name: 'Alpha School',
          school_performance: 'green',
          district: 'Pune',
          udise: '1234567890',
          num_students: 120,
          num_teachers: 8,
          onboarded_students: 100,
          activated_students: 80,
          active_students: 60,
          avg_time_spent: 45,
          active_teachers: 6,
          activities_assigned: 14,
          avg_assignments_completed: 10,
          avg_activities_completed: 8,
          program_managers: ['Program Manager 1'],
          field_coordinators: ['Field Coordinator 1'],
        },
      ],
      total: 1,
    });

    renderPage();

    const exportButton = await screen.findByRole('button', { name: 'Export' });
    await waitFor(() => expect(exportButton).toBeEnabled());

    await user.type(screen.getByLabelText('Search schools'), 'new');

    expect(exportButton).toBeDisabled();

    jest.advanceTimersByTime(500);

    await waitFor(() => expect(exportButton).toBeEnabled());
    jest.useRealTimers();
  });

  it('falls back to the main thread workbook builder when the worker fails', async () => {
    const user = userEvent.setup();
    mockRunBackgroundWorkerTask.mockRejectedValueOnce(
      new Error('worker failed'),
    );
    mockApiHandler.getFilteredSchoolsForSchoolListing.mockResolvedValue({
      data: [
        {
          school_id: 'school-1',
          school_name: 'Alpha School',
          school_performance: 'green',
          district: 'Pune',
          udise: '1234567890',
          num_students: 120,
          num_teachers: 8,
          onboarded_students: 100,
          activated_students: 80,
          active_students: 60,
          avg_time_spent: 45,
          active_teachers: 6,
          activities_assigned: 14,
          avg_assignments_completed: 10,
          avg_activities_completed: 8,
          program_managers: ['Program Manager 1'],
          field_coordinators: ['Field Coordinator 1'],
        },
      ],
      total: 1,
    });

    renderPage();

    const exportButton = await screen.findByRole('button', { name: 'Export' });
    await waitFor(() => expect(exportButton).toBeEnabled());

    await user.click(exportButton);

    await waitFor(() =>
      expect(mockHandleBlobDownloadAndSave).toHaveBeenCalledWith(
        expect.any(Blob),
        'SchoolMetrics.xlsx',
      ),
    );
    expect(mockJsZipLoadAsync).toHaveBeenCalled();
  });
});
