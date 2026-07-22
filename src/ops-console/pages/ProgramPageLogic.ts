import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router';
import { PAGES, PROGRAM_TAB } from '../../common/constants';
import type { ServiceApi } from '../../services/api/ServiceApi';
import { ServiceConfig } from '../../services/ServiceConfig';
import logger from '../../utility/logger';
import { useDebouncedValue } from './SchoolList.fetcher';
import {
  DATE_RANGE_OPTIONS,
  DEFAULT_DATE_RANGE,
  DEFAULT_PROGRAM_PAGE_SIZE,
  createEmptyProgramFilters,
  getProgramSelectedFilterLabel,
  getProgramSelectedFilterText,
  programFilterConfigs,
  programTabOptions,
  PROGRAM_HEADER_PERCENT_FILTER_BY_COLUMN,
  PROGRAM_PERCENT_FILTERS,
  type DateRangeValue,
  type Filters,
} from './ProgramPageConfig';
import { useProgramListExport } from './ProgramPageExport';
import {
  fetchProgramListPage,
  getProgramListColumns,
  hasProgramListFilters,
  mapProgramFilterOptions,
  mapProgramRowsToRenderRows,
  parseProgramListJsonParam,
  SORTABLE_PROGRAM_COLUMNS,
  type ProgramListSourceRow,
} from './ProgramPageRows';

export { DATE_RANGE_OPTIONS };
export {
  DEFAULT_DATE_RANGE,
  DEFAULT_PROGRAM_PAGE_SIZE,
  createEmptyProgramFilters,
  getProgramSelectedFilterLabel,
  getProgramSelectedFilterText,
  programFilterConfigs,
  programTabOptions,
  PROGRAM_HEADER_PERCENT_FILTER_BY_COLUMN,
  PROGRAM_PERCENT_FILTERS,
} from './ProgramPageConfig';
export {
  buildProgramListRequest,
  fetchProgramListPage,
  formatNullablePercent,
  formatProgramMetric,
  getProgramListColumns,
  getProgramPercentMeta,
  getProgramStatusMeta,
  hasProgramListFilters,
  mapProgramFilterOptions,
  mapProgramRowsToRenderRows,
  parseProgramListJsonParam,
  resolveProgramId,
  sumProgramNumbers,
} from './ProgramPageRows';
export type { DateRangeValue, Filters } from './ProgramPageConfig';
export type {
  ProgramListRow,
  ProgramListSourceRow,
  ProgramMetricCell,
} from './ProgramPageRows';

const useProgramListData = ({
  api,
  filters,
  selectedTab,
  page,
  pageSize,
  orderBy,
  orderDir,
  searchTerm,
  selectedDateRange,
}: {
  api: ServiceApi;
  filters: Filters;
  selectedTab: PROGRAM_TAB;
  page: number;
  pageSize: number;
  orderBy: string;
  orderDir: 'asc' | 'desc';
  searchTerm: string;
  selectedDateRange: DateRangeValue;
}) => {
  const [programs, setPrograms] = useState<ProgramListSourceRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchData = async (): Promise<void> => {
      setIsLoading(true);
      try {
        const response = await fetchProgramListPage({
          api,
          filters,
          selectedTab,
          page,
          pageSize,
          orderBy,
          orderDir,
          searchTerm,
          selectedDateRange,
        });
        if (!active) return;
        setPrograms(response.data);
        setTotal(response.total ?? response.data.length);
      } catch {
        if (!active) return;
        setPrograms([]);
        setTotal(0);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchData();
    return () => {
      active = false;
    };
  }, [
    api,
    filters,
    orderBy,
    orderDir,
    page,
    pageSize,
    searchTerm,
    selectedDateRange,
    selectedTab,
  ]);

  return { programs, total, isLoading };
};

export const useProgramPageLogic = () => {
  const api = ServiceConfig.getI().apiHandler;
  const location = useLocation();
  const history = useHistory();
  const qs = new URLSearchParams(location.search);
  const [selectedTab, setSelectedTab] = useState<PROGRAM_TAB>(() => {
    const queryTab = qs.get('tab') as PROGRAM_TAB | null;
    return queryTab === PROGRAM_TAB.AT_SCHOOL ||
      queryTab === PROGRAM_TAB.AT_HOME ||
      queryTab === PROGRAM_TAB.HYBRID
      ? queryTab
      : PROGRAM_TAB.ALL;
  });
  const [searchTerm, setSearchTerm] = useState(() => qs.get('search') || '');
  const [filters, setFilters] = useState<Filters>(() =>
    parseProgramListJsonParam(qs.get('filters'), createEmptyProgramFilters()),
  );
  const [tempFilters, setTempFilters] = useState<Filters>(() =>
    createEmptyProgramFilters(),
  );
  const [selectedDateRange, setSelectedDateRange] = useState<DateRangeValue>(
    () => {
      const range = qs.get('range');
      return range === '15d' || range === '30d' ? range : DEFAULT_DATE_RANGE;
    },
  );
  const [page, setPage] = useState(() => {
    const value = parseInt(qs.get('page') || '', 10);
    return isNaN(value) || value < 1 ? 1 : value;
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState<Filters>(() =>
    createEmptyProgramFilters(),
  );
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [orderBy, setOrderBy] = useState('programName');
  const [orderDir, setOrderDir] = useState<'asc' | 'desc'>('asc');
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 500);
  const isSearchPending = searchTerm !== debouncedSearchTerm;
  const pageSize = DEFAULT_PROGRAM_PAGE_SIZE;
  const {
    programs,
    total,
    isLoading: isDataLoading,
  } = useProgramListData({
    api,
    filters,
    selectedTab,
    page,
    pageSize,
    orderBy,
    orderDir,
    searchTerm: debouncedSearchTerm,
    selectedDateRange,
  });
  const rows = useMemo(() => mapProgramRowsToRenderRows(programs), [programs]);
  const columns = useMemo(() => getProgramListColumns(), []);
  const isLoading = isFilterLoading || isDataLoading;
  const { isExporting, isExportDisabled, handleExportPrograms } =
    useProgramListExport({
      api,
      filters,
      selectedTab,
      orderBy,
      orderDir,
      searchTerm: debouncedSearchTerm,
      selectedDateRange,
      total,
      isLoading,
      isSearchPending,
      visibleColumns: columns,
    });

  useEffect(() => setTempFilters(filters), [filters]);

  useEffect(() => {
    const fetchFilterOptions = async (): Promise<void> => {
      setIsFilterLoading(true);
      try {
        setFilterOptions(
          mapProgramFilterOptions(await api.getProgramFilterOptions()),
        );
      } catch (error) {
        logger.error('Failed to fetch program filters', error);
      } finally {
        setIsFilterLoading(false);
      }
    };
    fetchFilterOptions();
  }, [api]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedTab !== PROGRAM_TAB.ALL) params.set('tab', selectedTab);
    if (searchTerm) params.set('search', searchTerm);
    if (hasProgramListFilters(filters)) {
      params.set('filters', JSON.stringify(filters));
    }
    if (selectedDateRange !== DEFAULT_DATE_RANGE) {
      params.set('range', selectedDateRange);
    }
    if (page !== 1) params.set('page', String(page));
    history.replace({ search: params.toString() });
  }, [filters, history, page, searchTerm, selectedDateRange, selectedTab]);

  const handleSort = useCallback(
    (colKey: string) => {
      if (!SORTABLE_PROGRAM_COLUMNS.has(colKey)) return;
      if (orderBy === colKey) {
        setOrderDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setOrderBy(colKey);
        setOrderDir('desc');
      }
      setPage(1);
    },
    [orderBy],
  );

  const handleClearFilters = useCallback(() => {
    const empty = createEmptyProgramFilters();
    setTempFilters(empty);
    setFilters(empty);
    setSelectedDateRange(DEFAULT_DATE_RANGE);
    setIsFilterOpen(false);
    setPage(1);
  }, []);

  const handleHeaderFilterChange = useCallback(
    (filterKey: string, value: string) => {
      setFilters((prev) => {
        const currentValues = prev[filterKey] ?? [];
        const nextValues = currentValues.includes(value)
          ? currentValues.filter((item) => item !== value)
          : [...currentValues, value];
        return { ...prev, [filterKey]: nextValues };
      });
      setPage(1);
    },
    [],
  );

  return {
    columns,
    filters,
    filterOptions,
    handleClearFilters,
    handleExportPrograms,
    handleHeaderFilterChange,
    handleSort,
    history,
    isExportDisabled,
    isExporting,
    isFilterOpen,
    isLoading,
    orderBy,
    orderDir,
    page,
    pageCount: Math.ceil(total / pageSize),
    rows,
    searchTerm,
    selectedDateRange,
    selectedTab,
    setFilters,
    setIsFilterOpen,
    setPage,
    setSearchTerm,
    setSelectedDateRange,
    setSelectedTab,
    setTempFilters,
    tableScrollRef,
    tempFilters,
    newProgramPath: PAGES.SIDEBAR_PAGE + PAGES.NEW_PROGRAM,
  };
};
