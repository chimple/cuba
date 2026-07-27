import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useLocation, useHistory } from 'react-router';
import { ServiceConfig } from '../../services/ServiceConfig';
import { PAGES, PROGRAM_TAB } from '../../common/constants';
import {
  createEmptySchoolFilters,
  DEFAULT_DATE_RANGE,
  DATE_RANGE_OPTIONS,
  DEFAULT_PAGE_SIZE,
  filterConfigsForSchool,
  getSchoolListColumns,
  hasSchoolListFilters,
  mapSchoolListFilterOptions,
  parseSchoolListJsonParam,
  tabOptions,
  type DateRangeValue,
  type Filters,
  type PercentBand,
  type PercentageFilters,
  type PercentageFilterKey,
  type SchoolPerformanceFilterValue,
  SCHOOL_PERFORMANCE_FILTER_OPTIONS,
} from './SchoolList.helpers';
import { useDebouncedValue, useSchoolListData } from './SchoolList.fetcher';
import { mapSchoolRowsToRenderRows } from './SchoolListRowRenderer';
import { RoleType } from '../../interface/modelInterfaces';
import { useAppSelector } from '../../redux/hooks';
import { RootState } from '../../redux/store';
import { AuthState } from '../../redux/slices/auth/authSlice';
import logger from '../../utility/logger';
import { useSchoolListExport } from './useSchoolListExport';

export function useSchoolListPage() {
  const api = ServiceConfig.getI().apiHandler;
  const location = useLocation();
  const history = useHistory();
  const qs = new URLSearchParams(location.search);
  const [selectedTab, setSelectedTab] = useState(() => {
    const v = qs.get('tab') || PROGRAM_TAB.ALL;
    return Object.values(PROGRAM_TAB).includes(v as PROGRAM_TAB)
      ? (v as PROGRAM_TAB)
      : PROGRAM_TAB.ALL;
  });
  const [searchTerm, setSearchTerm] = useState(() => qs.get('search') || '');
  const [filters, setFilters] = useState<Filters>(() =>
    parseSchoolListJsonParam(qs.get('filters'), createEmptySchoolFilters()),
  );
  const [selectedDateRange, setSelectedDateRange] = useState<DateRangeValue>(
    () => {
      const queryRange = qs.get('range');
      return DATE_RANGE_OPTIONS.some((option) => option.value === queryRange)
        ? (queryRange as DateRangeValue)
        : DEFAULT_DATE_RANGE;
    },
  );
  const [percentageFilters, setPercentageFilters] = useState<PercentageFilters>(
    () => parseSchoolListJsonParam(qs.get('percentFilters'), {}),
  );
  const [schoolPerformanceFilter, setSchoolPerformanceFilter] =
    useState<SchoolPerformanceFilterValue | null>(() => {
      const performanceFilter = qs.get('performanceFilter');
      return SCHOOL_PERFORMANCE_FILTER_OPTIONS.includes(
        performanceFilter as SchoolPerformanceFilterValue,
      )
        ? (performanceFilter as SchoolPerformanceFilterValue)
        : null;
    });
  const [page, setPage] = useState(() => {
    const p = parseInt(qs.get('page') || '', 10);
    return isNaN(p) || p < 1 ? 1 : p;
  });
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [showUploadPage, setShowUploadPage] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<Filters>(() =>
    createEmptySchoolFilters(),
  );
  const [filterOptions, setFilterOptions] = useState<Filters>(() =>
    createEmptySchoolFilters(),
  );
  const [orderBy, setOrderBy] = useState('');
  const [orderDir, setOrderDir] = useState<'asc' | 'desc'>('asc');
  const [actionsAnchorEl, setActionsAnchorEl] = useState<null | HTMLElement>(
    null,
  );
  const [isActionsButtonCloseShine, setIsActionsButtonCloseShine] =
    useState(false);
  const [percentageFilterAnchorEl, setPercentageFilterAnchorEl] =
    useState<HTMLElement | null>(null);
  const [activePercentageFilterKey, setActivePercentageFilterKey] =
    useState<PercentageFilterKey | null>(null);
  const [schoolPerformanceFilterAnchorEl, setSchoolPerformanceFilterAnchorEl] =
    useState<HTMLElement | null>(null);
  const actionsButtonCloseShineTimeoutRef = useRef<number | null>(null);
  const actionsButtonCloseShineRafRef = useRef<number | null>(null);
  const isFirstSearchRenderRef = useRef(true);
  const { roles } = useAppSelector(
    (state: RootState) => state.auth as AuthState,
  );
  const userRoles = roles || [];
  const isExternalUser = userRoles.includes(RoleType.EXTERNAL_USER);
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 800);
  const isSearchPending = searchTerm !== debouncedSearchTerm;
  const rolesWithAccess = [
    RoleType.SUPER_ADMIN,
    RoleType.OPERATIONAL_DIRECTOR,
    RoleType.PROGRAM_MANAGER,
  ];
  const haveAccess = userRoles.some((role) =>
    rolesWithAccess.includes(role as RoleType),
  );
  const isActionsMenuOpen = Boolean(actionsAnchorEl);
  const pageSize = DEFAULT_PAGE_SIZE;
  const columns = useMemo(() => getSchoolListColumns(), []);
  const {
    schools,
    total,
    isLoading: isDataLoading,
  } = useSchoolListData({
    api,
    filters,
    selectedTab,
    page,
    pageSize,
    orderBy,
    orderDir,
    searchTerm: debouncedSearchTerm,
    selectedDateRange,
    percentageFilters,
    schoolPerformanceFilter,
  });
  const renderedSchools = useMemo(
    () => mapSchoolRowsToRenderRows(schools),
    [schools],
  );
  const isLoading = isFilterLoading || isDataLoading;
  const { isExporting, isExportDisabled, handleExportSchools } =
    useSchoolListExport({
      api,
      filters,
      selectedTab,
      orderBy,
      orderDir,
      searchTerm: debouncedSearchTerm,
      selectedDateRange,
      percentageFilters,
      schoolPerformanceFilter,
      total,
      isLoading,
      isSearchPending,
    });

  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  const triggerActionsButtonCloseShine = useCallback(() => {
    setIsActionsButtonCloseShine(false);
    if (actionsButtonCloseShineRafRef.current !== null) {
      window.cancelAnimationFrame(actionsButtonCloseShineRafRef.current);
    }
    actionsButtonCloseShineRafRef.current = window.requestAnimationFrame(() => {
      setIsActionsButtonCloseShine(true);
    });
    if (actionsButtonCloseShineTimeoutRef.current !== null) {
      window.clearTimeout(actionsButtonCloseShineTimeoutRef.current);
    }
    actionsButtonCloseShineTimeoutRef.current = window.setTimeout(() => {
      setIsActionsButtonCloseShine(false);
      actionsButtonCloseShineTimeoutRef.current = null;
    }, 700);
  }, []);

  useEffect(() => {
    return () => {
      if (actionsButtonCloseShineTimeoutRef.current !== null) {
        window.clearTimeout(actionsButtonCloseShineTimeoutRef.current);
      }
      if (actionsButtonCloseShineRafRef.current !== null) {
        window.cancelAnimationFrame(actionsButtonCloseShineRafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedTab !== PROGRAM_TAB.ALL) params.set('tab', String(selectedTab));
    if (searchTerm) params.set('search', searchTerm);
    if (hasSchoolListFilters(filters)) {
      params.set('filters', JSON.stringify(filters));
    }
    if (selectedDateRange !== DEFAULT_DATE_RANGE)
      params.set('range', selectedDateRange);
    if (Object.keys(percentageFilters).length > 0) {
      params.set('percentFilters', JSON.stringify(percentageFilters));
    }
    if (schoolPerformanceFilter) {
      params.set('performanceFilter', schoolPerformanceFilter);
    }
    if (page !== 1) params.set('page', String(page));
    history.replace({ search: params.toString() });
  }, [
    selectedTab,
    searchTerm,
    filters,
    selectedDateRange,
    percentageFilters,
    schoolPerformanceFilter,
    page,
    history,
  ]);

  useEffect(() => {
    if (isFirstSearchRenderRef.current) {
      isFirstSearchRenderRef.current = false;
      return;
    }
    setPage(1);
  }, [searchTerm]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      setIsFilterLoading(true);
      try {
        const data = await api.getSchoolFilterOptionsForSchoolListing();
        if (data) {
          setFilterOptions(mapSchoolListFilterOptions(data));
        }
      } catch (error) {
        logger.error('Failed to fetch filter options', error);
      } finally {
        setIsFilterLoading(false);
      }
    };
    fetchFilterOptions();
  }, [api]);

  const handleSort = (colKey: string) => {
    const column = columns.find((col) => String(col.key) === colKey);
    if (!column || column.sortable === false) return;
    if (orderBy === colKey) {
      setOrderDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setOrderBy(colKey);
      setOrderDir('desc');
    }
    setPage(1);
  };

  const handleOpenPercentageFilter = useCallback(
    (event: React.MouseEvent<HTMLElement>, filterKey: PercentageFilterKey) => {
      event.preventDefault();
      event.stopPropagation();
      setPercentageFilterAnchorEl(event.currentTarget);
      setActivePercentageFilterKey(filterKey);
    },
    [],
  );
  const handleClosePercentageFilter = useCallback(() => {
    setPercentageFilterAnchorEl(null);
    setActivePercentageFilterKey(null);
  }, []);
  const handleSelectPercentageFilter = useCallback(
    (band: PercentBand) => {
      if (!activePercentageFilterKey) return;
      setPercentageFilters((prev) => {
        const next = { ...prev };
        if (next[activePercentageFilterKey] === band) {
          delete next[activePercentageFilterKey];
        } else {
          next[activePercentageFilterKey] = band;
        }
        return next;
      });
      setPage(1);
      handleClosePercentageFilter();
    },
    [activePercentageFilterKey, handleClosePercentageFilter],
  );
  const handleOpenSchoolPerformanceFilter = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setSchoolPerformanceFilterAnchorEl(event.currentTarget);
    },
    [],
  );
  const handleCloseSchoolPerformanceFilter = useCallback(() => {
    setSchoolPerformanceFilterAnchorEl(null);
  }, []);
  const handleSelectSchoolPerformanceFilter = useCallback(
    (status: SchoolPerformanceFilterValue) => {
      setSchoolPerformanceFilter((prev) => (prev === status ? null : status));
      setPage(1);
      handleCloseSchoolPerformanceFilter();
    },
    [handleCloseSchoolPerformanceFilter],
  );
  const handleCloseUploadPage = useCallback((): void => {
    setShowUploadPage(false);
  }, []);
  const handleOpenActionsMenu = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setActionsAnchorEl(event.currentTarget);
    },
    [],
  );
  const handleCloseActionsMenu = useCallback(() => {
    setActionsAnchorEl(null);
    triggerActionsButtonCloseShine();
  }, [triggerActionsButtonCloseShine]);
  const handleSelectDateRange = useCallback((nextRange: DateRangeValue) => {
    setSelectedDateRange(nextRange);
    setPage(1);
  }, []);
  const handleOpenUploadPage = useCallback(() => {
    setShowUploadPage(true);
  }, []);
  const handleOpenAddSchoolPage = useCallback(() => {
    history.push({
      pathname: `${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}${PAGES.ADD_SCHOOL_PAGE}`,
    });
  }, [history]);
  const handleOpenMigratePage = useCallback(() => {
    history.push(
      `${PAGES.SIDEBAR_PAGE}${PAGES.SCHOOL_LIST}${PAGES.MIGRATE_SCHOOLS_PAGE}`,
    );
  }, [history]);
  const handleCancelFilters = useCallback(() => {
    const reset = createEmptySchoolFilters();
    setTempFilters(reset);
    setFilters(reset);
    setSelectedDateRange(DEFAULT_DATE_RANGE);
    setIsFilterOpen(false);
    setPage(1);
  }, []);
  const pageCount = useMemo(
    () => Math.ceil(total / pageSize),
    [pageSize, total],
  );
  const activePercentageBand = activePercentageFilterKey
    ? percentageFilters[activePercentageFilterKey]
    : undefined;

  return {
    actionsAnchorEl,
    activePercentageBand,
    columns,
    filterConfigsForSchool,
    filterOptions,
    filters,
    handleCancelFilters,
    handleCloseActionsMenu,
    handleClosePercentageFilter,
    handleCloseSchoolPerformanceFilter,
    handleCloseUploadPage,
    handleExportSchools,
    handleOpenActionsMenu,
    handleOpenAddSchoolPage,
    handleOpenMigratePage,
    handleOpenPercentageFilter,
    handleOpenSchoolPerformanceFilter,
    handleOpenUploadPage,
    handleSelectDateRange,
    handleSelectPercentageFilter,
    handleSelectSchoolPerformanceFilter,
    handleSort,
    haveAccess,
    isActionsButtonCloseShine,
    isActionsMenuOpen,
    isExportDisabled,
    isExporting,
    isExternalUser,
    isFilterOpen,
    isLoading,
    orderBy,
    orderDir,
    page,
    pageCount,
    percentageFilterAnchorEl,
    percentageFilters,
    renderedSchools,
    schoolPerformanceFilter,
    schoolPerformanceFilterAnchorEl,
    searchTerm,
    selectedDateRange,
    selectedTab,
    setFilters,
    setIsFilterOpen,
    setPage,
    setPercentageFilters,
    setSchoolPerformanceFilter,
    setSearchTerm,
    setSelectedTab,
    setTempFilters,
    showUploadPage,
    tabOptions,
    tempFilters,
  };
}
