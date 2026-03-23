import { act, renderHook, waitFor } from '@testing-library/react';
import {
  buildNameCell,
  INITIAL_FILTERS,
  normalizeAcademicYear,
  normalizeFiltersFromQuery,
  normalizeProgramModel,
  parseJSONParam,
  useMigrateSchoolsPageLogic,
} from './MigrateSchoolsPageLogic';
import logger from '../../utility/logger';

const mockReplace = jest.fn();
let mockLocationSearch = '';

const mockApiHandler = {
  getSchoolFilterOptionsForSchoolListing: jest.fn(),
  getSchoolsWithProgramAccess: jest.fn(),
  migrateSchoolData: jest.fn(),
};

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useHistory: () => ({ replace: mockReplace }),
  useLocation: () => ({ search: mockLocationSearch }),
}));

jest.mock('../../services/ServiceConfig', () => ({
  ServiceConfig: {
    getI: () => ({ apiHandler: mockApiHandler }),
  },
}));

const defaultFilterOptions = {
  program: ['Base Program'],
  programType: ['Gov'],
  state: ['Karnataka'],
  district: ['Bangalore'],
  cluster: ['Cluster A'],
  block: ['Block A'],
};

const emptySchoolsResponse = {
  data: [],
  total: 0,
  page: 1,
  page_size: 20,
  total_pages: 0,
};

const waitForInitialLoad = async (expectSchoolsCall = true) => {
  await waitFor(() =>
    expect(
      mockApiHandler.getSchoolFilterOptionsForSchoolListing,
    ).toHaveBeenCalled(),
  );
  if (expectSchoolsCall) {
    await waitFor(() =>
      expect(mockApiHandler.getSchoolsWithProgramAccess).toHaveBeenCalled(),
    );
  }
};

describe('MigrateSchoolsPageLogic helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // TC 4.22-4.24: Parse valid JSON params and fallback for null or malformed values.
  it('parseJSONParam should parse valid json and fallback on null/malformed', () => {
    expect(parseJSONParam('{"a":1}', {})).toEqual({ a: 1 });
    expect(parseJSONParam(null, { a: 2 })).toEqual({ a: 2 });
    expect(parseJSONParam('{bad', { a: 3 })).toEqual({ a: 3 });
  });

  // TC 4.18-4.21: Normalize query filters to expected arrays and safe defaults.
  it('normalizeFiltersFromQuery should sanitize values and return safe defaults', () => {
    expect(
      normalizeFiltersFromQuery({
        program: ['P1', '  '],
        programType: 'bad',
        district: ['D1'],
      }),
    ).toEqual({
      program: ['P1'],
      programType: [],
      state: [],
      district: ['D1'],
      cluster: [],
      block: [],
    });

    expect(normalizeFiltersFromQuery(null)).toEqual(INITIAL_FILTERS);
    expect(normalizeFiltersFromQuery('bad')).toEqual(INITIAL_FILTERS);
  });

  // TC 4.1-4.7: Normalize academic year from array, JSON string, plain string, and fallbacks.
  it('normalizeAcademicYear should support arrays, json strings, plain strings and fallbacks', () => {
    expect(normalizeAcademicYear(['2024', '2025'])).toBe('2024, 2025');
    expect(normalizeAcademicYear('["2024","2025"]')).toBe('2024, 2025');
    expect(normalizeAcademicYear('2024-25')).toBe('2024-25');
    expect(normalizeAcademicYear('')).toBe('');
    expect(normalizeAcademicYear(undefined)).toBe('');
    expect(normalizeAcademicYear(null)).toBe('');
    expect(normalizeAcademicYear('[bad')).toBe('[bad');
    expect(normalizeAcademicYear(['2024', ' ', '', '2025'])).toBe('2024, 2025');
  });

  // TC 4.8-4.14: Normalize program model labels while preserving unknown or empty values.
  it('normalizeProgramModel should label known models and preserve unknown/empty', () => {
    expect(normalizeProgramModel('at_home')).toBe('At-Home');
    expect(normalizeProgramModel('at_school')).toBe('At-School');
    expect(normalizeProgramModel('hybrid')).toBe('Hybrid');
    expect(normalizeProgramModel(['at_home', 'hybrid'])).toBe(
      'At-Home, Hybrid',
    );
    expect(normalizeProgramModel('["at_home","hybrid"]')).toBe(
      'At-Home, Hybrid',
    );
    expect(normalizeProgramModel('foobar')).toBe('foobar');
    expect(normalizeProgramModel('')).toBe('');
  });

  // TC 4.15-4.17: Build name cell object with value and subtitle fallback rendering.
  it('buildNameCell should include value and subtitle fallback', () => {
    const withDetails = buildNameCell('School A', '12345', 'Karnataka');
    expect(withDetails.value).toBe('School A');
    expect(withDetails.render).toBeTruthy();

    const fallback = buildNameCell('School B', '', '');
    expect(fallback.value).toBe('School B');
    expect(fallback.render).toBeTruthy();
  });
});

describe('useMigrateSchoolsPageLogic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocationSearch = '';
    mockApiHandler.getSchoolFilterOptionsForSchoolListing.mockResolvedValue(
      defaultFilterOptions,
    );
    mockApiHandler.getSchoolsWithProgramAccess.mockResolvedValue(
      emptySchoolsResponse,
    );
    mockApiHandler.migrateSchoolData.mockResolvedValue(true);
  });

  // TC 13.8-13.13: Initialize state from URL params with safe query parsing fallbacks.
  it('should initialize state from url query params with safe fallbacks', async () => {
    mockLocationSearch =
      '?tab=migrated&page=3&orderDir=desc&search=abc&filters=%7B%22state%22%3A%5B%22Karnataka%22%5D%7D';
    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();

    expect(result.current.activeTab).toBe('migrated');
    expect(result.current.page).toBe(3);
    expect(result.current.orderDir).toBe('desc');
    expect(result.current.searchTerm).toBe('abc');
    expect(result.current.filters.state).toEqual(['Karnataka']);
  });

  // TC 13.11: Fallback invalid query page values to page 1.
  it('should fallback page to 1 for invalid query page', async () => {
    mockLocationSearch = '?page=abc';
    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    expect(result.current.page).toBe(1);
  });

  // TC 11.6: Fallback unknown tab query values to migrate.
  it('should fallback unknown query tab to migrate', async () => {
    mockLocationSearch = '?tab=nonsense';
    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();
    expect(result.current.activeTab).toBe('migrate');
  });

  // TC 3.1-3.2-14.1-14.2: Fetch filter options and schools on mount with academicYears payload.
  it('should fetch options and schools on mount with academicYears payload', async () => {
    renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();

    expect(
      mockApiHandler.getSchoolFilterOptionsForSchoolListing,
    ).toHaveBeenCalledTimes(1);
    expect(mockApiHandler.getSchoolsWithProgramAccess).toHaveBeenCalledTimes(1);

    const request = mockApiHandler.getSchoolsWithProgramAccess.mock.calls[0][0];
    expect(Array.isArray(request.academicYears)).toBe(true);
    expect(request.academicYears).toHaveLength(1);
    expect(request.academicYears[0]).toMatch(/^\d{4}-\d{4}$/);
    expect(request.page).toBe(1);
    expect(request.includeMigratedCounts).toBe(false);
  });

  // TC 13.1: Sync default state to minimal empty URL query.
  it('should sync default state to minimal url query', async () => {
    renderHook(() => useMigrateSchoolsPageLogic());
    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    const lastCall =
      mockReplace.mock.calls[mockReplace.mock.calls.length - 1][0];
    expect(lastCall.search).toBe('');
  });

  // TC 13.2-13.4-13.5: Sync non-default tab, page, and order direction into URL query.
  it('should sync non-default tab/page/orderDir in url query', async () => {
    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();

    act(() => {
      result.current.handleTabChange('migrated');
    });
    await waitFor(() =>
      expect(
        mockReplace.mock.calls[mockReplace.mock.calls.length - 1][0].search,
      ).toContain('tab=migrated'),
    );

    act(() => {
      result.current.handleTabChange('migrate');
      result.current.setPage(2);
    });
    await waitFor(() => {
      const search =
        mockReplace.mock.calls[mockReplace.mock.calls.length - 1][0].search;
      expect(search).toContain('page=2');
    });

    act(() => {
      result.current.handleSort('name');
    });
    await waitFor(() => expect(result.current.orderBy).toBe('name'));

    act(() => {
      result.current.handleSort('name');
    });
    await waitFor(() => {
      const search =
        mockReplace.mock.calls[mockReplace.mock.calls.length - 1][0].search;
      expect(search).toContain('orderDir=desc');
    });
  });

  // TC 2.3: Reset page to first when switching tabs.
  it('should reset page to 1 when tab is switched', async () => {
    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();

    act(() => {
      result.current.setPage(3);
    });
    expect(result.current.page).toBe(3);

    act(() => {
      result.current.handleTabChange('migrated');
    });
    expect(result.current.page).toBe(1);
  });

  // TC 13.3: Sync search term changes into URL query.
  it('should sync search in url query', async () => {
    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();

    act(() => {
      result.current.handleSearchChange('test school');
    });

    await waitFor(() =>
      expect(
        mockReplace.mock.calls[mockReplace.mock.calls.length - 1][0].search,
      ).toContain('search=test+school'),
    );
  });

  // TC 13.6: Sync applied filters into URL query as encoded JSON.
  it('should sync applied filters in url query as json', async () => {
    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();

    act(() => {
      result.current.handleTempFilterChange('state', ['MP']);
    });
    act(() => {
      result.current.handleApplyFilters();
    });

    await waitFor(() => {
      const search =
        mockReplace.mock.calls[mockReplace.mock.calls.length - 1][0].search;
      expect(search).toContain('filters=');
      expect(decodeURIComponent(search)).toContain('"state":["MP"]');
    });
  });

  // TC 2.1-2.4: Fetch schools on migrated tab with next academic year payload.
  it('should fetch schools api on migrated tab with next academic year', async () => {
    mockLocationSearch = '?tab=migrated';
    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();

    const currentYear = new Date().getFullYear();
    const expectedMigratedYear = `${currentYear}-${currentYear + 1}`;
    const request =
      mockApiHandler.getSchoolsWithProgramAccess.mock.calls[
        mockApiHandler.getSchoolsWithProgramAccess.mock.calls.length - 1
      ][0];
    expect(mockApiHandler.getSchoolsWithProgramAccess).toHaveBeenCalled();
    expect(request.academicYears).toEqual([expectedMigratedYear]);
    expect(request.includeMigratedCounts).toBe(true);
    expect(result.current.rows).toEqual([]);
    expect(result.current.pageCount).toBe(0);
  });

  // TC 2.1-2.4: Switching to migrated tab should refresh rows and show empty when response is empty.
  it('should clear rows after switching to migrated tab when migrated response is empty', async () => {
    mockApiHandler.getSchoolsWithProgramAccess
      .mockResolvedValueOnce({
        ...emptySchoolsResponse,
        total: 1,
        data: [
          {
            school: {
              school_name: 'School One',
              state: 'Karnataka',
              district: 'Bangalore',
              block: 'B',
              cluster: 'C',
              academic_year: '2024-25',
            },
            program: { name: 'Program A', model: 'at_home' },
            program_users: [],
          },
        ],
      })
      .mockResolvedValueOnce({
        ...emptySchoolsResponse,
        total: 0,
        data: [],
      });

    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();
    await waitFor(() => expect(result.current.rows).toHaveLength(1));

    act(() => {
      result.current.handleTabChange('migrated');
    });

    await waitFor(() => expect(result.current.rows).toEqual([]));
    expect(result.current.pageCount).toBe(0);
  });

  // TC MIGRATED-YEAR: Migrated tab should display only the migrated academic year in rows.
  it('should show only migrated academic year in migrated tab rows', async () => {
    mockLocationSearch = '?tab=migrated';
    mockApiHandler.getSchoolsWithProgramAccess.mockResolvedValueOnce({
      ...emptySchoolsResponse,
      total: 1,
      data: [
        {
          school: {
            school_name: 'School One',
            academic_year: '["2025-26","2026-27"]',
            state: 'Karnataka',
            district: 'Bangalore',
            block: 'B',
            cluster: 'C',
          },
          program: { name: 'Program A', model: 'at_home' },
          program_users: [],
          migration_metrics: { academic_year: '2026-27' },
        },
      ],
    });

    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();
    await waitFor(() => expect(result.current.rows).toHaveLength(1));
    expect(result.current.rows[0].academicYear).toBe('2026-27');
  });

  // TC 5.1-5.6-16.3-16.4: Map API rows with data fallbacks and merged program filter options.
  it('should map api rows with proper fallbacks and merged program filters', async () => {
    mockApiHandler.getSchoolsWithProgramAccess.mockResolvedValue({
      ...emptySchoolsResponse,
      total: 1,
      data: [
        {
          school: {
            school_name: 'Green School',
            udise_code: 'UD123',
            state: 'Karnataka',
            district: 'D1',
            cluster: 'C1',
            block: 'B1',
            academic_year: '["2024-25","2025-26"]',
          },
          program: {
            name: 'Program X',
            model: 'at_home',
          },
          program_users: 'bad',
        },
      ],
    });

    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();
    await waitFor(() => expect(result.current.rows).toHaveLength(1));

    const row = result.current.rows[0];
    const currentYear = new Date().getFullYear();
    const expectedMigrateYear = `${currentYear - 1}-${String(currentYear).slice(-2)}`;
    expect(row.name.value).toBe('Green School');
    expect(row.programName).toBe('Program X');
    expect(row.programModel).toBe('At-Home');
    expect(row.academicYear).toBe(expectedMigrateYear);
    expect(row.program_users).toEqual([]);
    expect(result.current.filterOptions.program).toEqual(
      expect.arrayContaining(['Base Program', 'Program X']),
    );
  });

  // TC 5.3: Resolve row id through fallback chain ending with generated id.
  it('should resolve row id using fallback chain up to generated id', async () => {
    mockApiHandler.getSchoolsWithProgramAccess.mockResolvedValue({
      ...emptySchoolsResponse,
      total: 1,
      data: [{ school: {}, program: {}, program_users: [] }],
    });

    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();
    await waitFor(() => expect(result.current.rows).toHaveLength(1));
    expect(result.current.rows[0].id).toBe('school-0');
  });

  // TC 7.1-7.3-7.8: Sort supported keys, toggle direction, and reset page to first.
  it('should sort only supported keys, toggle direction and reset page', async () => {
    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();

    act(() => {
      result.current.setPage(4);
      result.current.handleSort('name');
    });
    expect(result.current.orderBy).toBe('name');
    expect(result.current.orderDir).toBe('asc');
    expect(result.current.page).toBe(1);

    act(() => {
      result.current.handleSort('name');
    });
    expect(result.current.orderDir).toBe('desc');

    act(() => {
      result.current.handleSort('name');
    });
    expect(result.current.orderDir).toBe('asc');
  });

  // TC 7.4-7.6: Map sorted UI columns to backend orderBy payload fields.
  it('should map sorted columns to backend orderBy payload', async () => {
    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();

    act(() => {
      result.current.handleSort('name');
    });
    await waitFor(() =>
      expect(
        mockApiHandler.getSchoolsWithProgramAccess,
      ).toHaveBeenLastCalledWith(
        expect.objectContaining({ orderBy: 'school_name' }),
      ),
    );

    act(() => {
      result.current.handleSort('academicYear');
    });
    await waitFor(() =>
      expect(
        mockApiHandler.getSchoolsWithProgramAccess,
      ).toHaveBeenLastCalledWith(
        expect.objectContaining({ orderBy: 'academic_year' }),
      ),
    );

    act(() => {
      result.current.handleSort('district');
    });
    await waitFor(() =>
      expect(
        mockApiHandler.getSchoolsWithProgramAccess,
      ).toHaveBeenLastCalledWith(
        expect.objectContaining({ orderBy: 'district' }),
      ),
    );
  });

  // TC 7.7: Ignore sort action for non-sortable columns.
  it('should ignore sort for non-sortable key', async () => {
    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();
    const callsBefore =
      mockApiHandler.getSchoolsWithProgramAccess.mock.calls.length;

    act(() => {
      result.current.handleSort('programName');
    });

    expect(result.current.orderBy).toBe('');
    expect(mockApiHandler.getSchoolsWithProgramAccess.mock.calls.length).toBe(
      callsBefore,
    );
  });

  // TC 6.1-6.2-6.3-6.4: Update search, reset page, and fetch with latest search value.
  it('should update search, reset page and send updated search to api', async () => {
    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();

    act(() => {
      result.current.setPage(3);
      result.current.handleSearchChange('Green');
    });
    expect(result.current.page).toBe(1);
    await waitFor(() =>
      expect(
        mockApiHandler.getSchoolsWithProgramAccess,
      ).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'Green' })),
    );

    act(() => {
      result.current.handleSearchChange('');
    });
    await waitFor(() =>
      expect(
        mockApiHandler.getSchoolsWithProgramAccess,
      ).toHaveBeenLastCalledWith(expect.objectContaining({ search: '' })),
    );
  });

  // TC 8.1-8.4: Open filter slider, apply temp filters, and call API with cleaned filters.
  it('should open filter, apply temp filters, close slider and call api with cleaned filters', async () => {
    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();

    act(() => {
      result.current.handleOpenFilter();
      result.current.handleTempFilterChange('state', ['Karnataka']);
    });
    act(() => {
      result.current.handleApplyFilters();
    });

    expect(result.current.isFilterOpen).toBe(false);
    await waitFor(() =>
      expect(result.current.filters.state).toEqual(['Karnataka']),
    );
    await waitFor(() =>
      expect(
        mockApiHandler.getSchoolsWithProgramAccess,
      ).toHaveBeenLastCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({ state: ['Karnataka'] }),
        }),
      ),
    );
  });

  // TC 8.2: Close filter slider and restore temp filters from applied filters.
  it('should close filter slider and reset tempFilters from filters', async () => {
    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();

    act(() => {
      result.current.handleOpenFilter();
      result.current.handleTempFilterChange('state', ['Temp']);
      result.current.handleFilterSliderClose();
    });

    expect(result.current.isFilterOpen).toBe(false);
    expect(result.current.tempFilters.state).toEqual(
      result.current.filters.state,
    );
  });

  // TC 8.5-8.7: Delete selected filter, sync temp filters, and reset page.
  it('should delete selected filter and sync temp filters with page reset', async () => {
    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();

    act(() => {
      result.current.handleTempFilterChange('state', ['Karnataka', 'MP']);
    });
    act(() => {
      result.current.handleApplyFilters();
    });
    act(() => {
      result.current.setPage(4);
      result.current.handleDeleteFilter('state', 'Karnataka');
    });

    await waitFor(() => expect(result.current.filters.state).toEqual(['MP']));
    await waitFor(() =>
      expect(result.current.tempFilters.state).toEqual(['MP']),
    );
    expect(result.current.page).toBe(1);
  });

  // TC 8.8-8.9: Clear all filters, close slider, and reset page.
  it('should clear all filters and reset page while closing slider', async () => {
    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();

    act(() => {
      result.current.handleOpenFilter();
      result.current.handleTempFilterChange('state', ['Karnataka']);
      result.current.handleApplyFilters();
      result.current.setPage(2);
      result.current.handleClearFilters();
    });

    expect(result.current.filters).toEqual(INITIAL_FILTERS);
    expect(result.current.tempFilters).toEqual(INITIAL_FILTERS);
    expect(result.current.isFilterOpen).toBe(false);
    expect(result.current.page).toBe(1);
  });

  // TC 8.10-8.12: Populate filter options and safely handle options API errors.
  it('should populate filter options and handle options api error safely', async () => {
    const errorSpy = jest.spyOn(logger, 'error').mockImplementation(() => {});

    mockApiHandler.getSchoolFilterOptionsForSchoolListing.mockRejectedValueOnce(
      new Error('options failed'),
    );
    renderHook(() => useMigrateSchoolsPageLogic());
    await waitFor(() =>
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to fetch filter options',
        expect.any(Error),
      ),
    );

    errorSpy.mockRestore();
  });

  // TC 6.7: Preserve existing program options when options API returns an empty program list.
  it('should preserve program filter options when filter options api returns empty program array', async () => {
    let resolveFilterOptions:
      | ((value: typeof defaultFilterOptions) => void)
      | undefined;

    mockApiHandler.getSchoolFilterOptionsForSchoolListing.mockReturnValueOnce(
      new Promise<typeof defaultFilterOptions>((resolve) => {
        resolveFilterOptions = resolve;
      }),
    );
    mockApiHandler.getSchoolsWithProgramAccess.mockResolvedValueOnce({
      ...emptySchoolsResponse,
      total: 1,
      data: [
        {
          school: {
            school_name: 'Green School',
            udise_code: 'UD123',
            state: 'Karnataka',
            district: 'D1',
            cluster: 'C1',
            block: 'B1',
            academic_year: '2024-25',
          },
          program: {
            name: 'Program X',
            model: 'at_home',
          },
          program_users: [],
        },
      ],
    });

    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitFor(() =>
      expect(mockApiHandler.getSchoolsWithProgramAccess).toHaveBeenCalled(),
    );
    await waitFor(() =>
      expect(result.current.filterOptions.program).toEqual(
        expect.arrayContaining(['Program X']),
      ),
    );

    await act(async () => {
      resolveFilterOptions?.({
        ...defaultFilterOptions,
        program: [],
      });
    });

    await waitFor(() =>
      expect(result.current.filterOptions.program).toEqual(
        expect.arrayContaining(['Program X']),
      ),
    );
  });

  // TC 6.1: Open filter action should make filter slider visible.
  it('should set filter slider open state when opening filters', async () => {
    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();

    act(() => {
      result.current.handleOpenFilter();
    });

    expect(result.current.isFilterOpen).toBe(true);
  });

  // TC 6.5: Reset page to first when applying filters.
  it('should reset page to 1 when applying filters', async () => {
    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();

    act(() => {
      result.current.setPage(4);
      result.current.handleOpenFilter();
      result.current.handleTempFilterChange('state', ['Karnataka']);
      result.current.handleApplyFilters();
    });

    expect(result.current.page).toBe(1);
  });

  // TC 9.1-9.4: Toggle row selection and select/unselect all visible rows.
  it('should toggle row selection and select/unselect all visible rows', async () => {
    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();

    act(() => {
      result.current.handleToggleSchoolSelection('a');
    });
    expect(result.current.selectedSchoolIds).toEqual(['a']);

    act(() => {
      result.current.handleToggleSchoolSelection('a');
    });
    expect(result.current.selectedSchoolIds).toEqual([]);

    act(() => {
      result.current.handleSelectAllVisible(true, [
        { id: 'x' },
        { sch_id: 'y' },
      ]);
    });
    expect(result.current.selectedSchoolIds).toEqual(
      expect.arrayContaining(['x', 'y']),
    );

    act(() => {
      result.current.handleToggleSchoolSelection('z');
      result.current.handleSelectAllVisible(false, [
        { id: 'x' },
        { sch_id: 'y' },
      ]);
    });
    expect(result.current.selectedSchoolIds).toEqual(['z']);
  });

  // TC 9.5-9.6: Clear selected ids on tab switch and hide selection actions in migrated tab.
  it('should clear selected ids on tab switch and hide selection action in migrated tab', async () => {
    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();

    act(() => {
      result.current.handleToggleSchoolSelection('1');
    });
    expect(result.current.isSelectionActionVisible).toBe(true);

    act(() => {
      result.current.handleTabChange('migrated');
    });
    await waitFor(() => expect(result.current.selectedSchoolIds).toEqual([]));
    expect(result.current.isSelectionActionVisible).toBe(false);
  });

  // TC 10.1-10.2-10.5-10.7: Manage migrate dialog state and success popup transition.
  it('should manage migrate confirmation dialog and success state transitions', async () => {
    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();

    act(() => {
      result.current.handleOpenMigrateDialog();
    });
    expect(result.current.isMigrateDialogOpen).toBe(false);

    act(() => {
      result.current.handleToggleSchoolSelection('1');
    });
    act(() => {
      result.current.handleOpenMigrateDialog();
    });
    expect(result.current.isMigrateDialogOpen).toBe(true);

    act(() => {
      result.current.handleCloseMigrateDialog();
    });
    expect(result.current.isMigrateDialogOpen).toBe(false);

    act(() => {
      result.current.handleOpenMigrateDialog();
    });
    await act(async () => {
      await result.current.handleConfirmMigrate();
    });
    expect(result.current.isMigrateDialogOpen).toBe(false);
    expect(result.current.isMigrating).toBe(false);
    expect(mockApiHandler.migrateSchoolData).toHaveBeenCalledWith({
      school_ids: ['1'],
    });
    expect(result.current.isSuccessPopupOpen).toBe(true);
    expect(result.current.isFailurePopupOpen).toBe(false);
  });

  // TC 10.8: Show loading state while migrate request is in progress.
  it('should keep migrating state true while migrate request is pending', async () => {
    let resolveMigrate: ((value: boolean) => void) | undefined;
    mockApiHandler.migrateSchoolData.mockReturnValueOnce(
      new Promise<boolean>((resolve) => {
        resolveMigrate = resolve;
      }),
    );

    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();

    act(() => {
      result.current.handleToggleSchoolSelection('1');
    });
    act(() => {
      result.current.handleOpenMigrateDialog();
    });
    expect(result.current.isMigrateDialogOpen).toBe(true);

    let pendingPromise: Promise<void> | undefined;
    act(() => {
      pendingPromise = result.current.handleConfirmMigrate();
    });
    expect(result.current.isMigrating).toBe(true);
    expect(result.current.isMigrateDialogOpen).toBe(true);

    act(() => {
      resolveMigrate?.(true);
    });
    await act(async () => {
      await pendingPromise!;
    });

    expect(result.current.isMigrating).toBe(false);
    expect(result.current.isMigrateDialogOpen).toBe(false);
    expect(result.current.isSuccessPopupOpen).toBe(true);
  });

  // TC 10.9: Show failure popup when migration returns failure.
  it('should open failure popup when migrate api returns false', async () => {
    mockApiHandler.migrateSchoolData.mockResolvedValueOnce(false);

    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();

    act(() => {
      result.current.handleToggleSchoolSelection('1');
      result.current.handleOpenMigrateDialog();
    });
    await act(async () => {
      await result.current.handleConfirmMigrate();
    });

    expect(result.current.isMigrateDialogOpen).toBe(false);
    expect(result.current.isMigrating).toBe(false);
    expect(result.current.isSuccessPopupOpen).toBe(false);
    expect(result.current.isFailurePopupOpen).toBe(true);
  });

  // TC 11.4-11.5-11.6: Auto-close success popup after 2s and clean timer on unmount.
  it('should auto-close success popup after 2s and cleanup timer on unmount', async () => {
    jest.useFakeTimers();
    const clearTimeoutSpy = jest.spyOn(window, 'clearTimeout');

    const { result, unmount } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();

    act(() => {
      result.current.handleToggleSchoolSelection('1');
    });
    await act(async () => {
      await result.current.handleConfirmMigrate();
    });
    expect(result.current.isSuccessPopupOpen).toBe(true);

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(result.current.isSuccessPopupOpen).toBe(false);
    expect(result.current.activeTab).toBe('migrated');
    expect(result.current.page).toBe(1);

    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
    jest.useRealTimers();
  });

  // TC 9.5: Manual success popup close should switch tab and reset page.
  it('should apply migrated-tab transitions on manual success popup close', async () => {
    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();

    act(() => {
      result.current.handleToggleSchoolSelection('1');
      result.current.setPage(3);
    });
    await act(async () => {
      await result.current.handleConfirmMigrate();
    });
    expect(result.current.isSuccessPopupOpen).toBe(true);

    act(() => {
      result.current.handleCloseSuccessPopup();
    });
    expect(result.current.isSuccessPopupOpen).toBe(false);
    expect(result.current.activeTab).toBe('migrated');
    expect(result.current.page).toBe(1);
  });

  // TC 12.1-12.3-12.4-12.5: Compute page count from total records with ceil behavior.
  it('should compute pageCount from total with ceil behavior', async () => {
    mockApiHandler.getSchoolsWithProgramAccess.mockResolvedValueOnce({
      ...emptySchoolsResponse,
      total: 21,
      data: [{ school: { school_name: 'A' }, program: {}, program_users: [] }],
    });
    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();
    await waitFor(() => expect(result.current.pageCount).toBe(2));
  });

  // TC 10.2: Changing page should refetch using the requested page.
  it('should refetch school list when page is changed', async () => {
    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();

    act(() => {
      result.current.setPage(2);
    });
    await waitFor(() =>
      expect(
        mockApiHandler.getSchoolsWithProgramAccess,
      ).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })),
    );
  });

  // TC 12.2: Handle school list responses that omit the data field.
  it('should treat school list response with missing data field as empty rows', async () => {
    mockApiHandler.getSchoolsWithProgramAccess.mockResolvedValueOnce({
      total: 0,
      page: 1,
      page_size: 20,
      total_pages: 0,
    });

    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();
    expect(result.current.rows).toEqual([]);
    expect(result.current.pageCount).toBe(0);
  });

  // TC 12.3: Handle rows with null school/program payloads without crashing.
  it('should handle rows with null school payload without crashing', async () => {
    mockApiHandler.getSchoolsWithProgramAccess.mockResolvedValueOnce({
      ...emptySchoolsResponse,
      total: 1,
      data: [{ school: null, program: null, program_users: null }],
    });

    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();
    await waitFor(() => expect(result.current.rows).toHaveLength(1));
    expect(result.current.rows[0].name.value).toBe('--');
    expect(result.current.rows[0].program_users).toEqual([]);
  });

  // TC 12.5: Handle null filter-options response without crashing.
  it('should handle null filter options response without crashing', async () => {
    mockApiHandler.getSchoolFilterOptionsForSchoolListing.mockResolvedValueOnce(
      null,
    );

    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitFor(() =>
      expect(mockApiHandler.getSchoolsWithProgramAccess).toHaveBeenCalled(),
    );
    expect(result.current.filterOptions).toEqual(INITIAL_FILTERS);
  });

  // TC 15.1-15.2-15.3: Expose expected table columns and filter config metadata.
  it('should expose expected columns and filter configs', async () => {
    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();

    expect(result.current.columns).toHaveLength(7);
    expect(result.current.columns.map((c) => c.key)).toEqual([
      'name',
      'programName',
      'programModel',
      'academicYear',
      'district',
      'cluster',
      'block',
    ]);
    expect(result.current.columns.every((c) => c.sortable === false)).toBe(
      true,
    );
    expect(result.current.filterConfigsForSchool).toHaveLength(6);
  });

  // TC 15.4: Show migrated tab class metric columns after academic year.
  it('should expose migrated tab columns with ukg and class metrics', async () => {
    mockLocationSearch = '?tab=migrated';
    const { result } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();

    expect(result.current.columns.map((c) => c.key)).toEqual([
      'name',
      'programName',
      'programModel',
      'academicYear',
      'ukg',
      'class2',
      'class3',
      'class4',
      'class5',
    ]);
  });

  // TC 16.1-16.2-3.6: Safely handle null or failed school list API responses.
  it('should handle null/malformed api response and exceptions safely', async () => {
    const errorSpy = jest.spyOn(logger, 'error').mockImplementation(() => {});

    mockApiHandler.getSchoolsWithProgramAccess.mockResolvedValueOnce(null);
    const { result, rerender } = renderHook(() => useMigrateSchoolsPageLogic());
    await waitForInitialLoad();
    expect(result.current.rows).toEqual([]);
    expect(result.current.pageCount).toBe(0);

    mockApiHandler.getSchoolsWithProgramAccess.mockRejectedValueOnce(
      new Error('fetch failed'),
    );
    act(() => {
      result.current.handleSearchChange('next');
    });
    rerender();

    await waitFor(() =>
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to fetch migrate schools list',
        expect.any(Error),
      ),
    );

    errorSpy.mockRestore();
  });
});
