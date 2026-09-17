import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useHistory } from 'react-router';
import {
  DEFAULT_PAGE_SIZE,
  EnumType,
  PAGES,
  REQUEST_TABS,
  RequestTypes,
} from '../../common/constants';
import { ServiceConfig } from '../../services/ServiceConfig';
import { Constants } from '../../services/database';
import { useAppSelector } from '../../redux/hooks';
import { RootState } from '../../redux/store';
import { AuthState } from '../../redux/slices/auth/authSlice';
import logger from '../../utility/logger';
import { Util } from '../../utility/util';
import { getRequestListColumns } from './RequestList.columns';
import {
  getRequestTabOptions,
  INITIAL_FILTER_OPTIONS,
  INITIAL_FILTERS,
} from './RequestList.constants';
import type {
  OpsRequestItem,
  RequestListFilterOptions,
  RequestListFilters,
  RequestRow,
} from './RequestList.types';
import {
  buildRequestExportCsv,
  buildRequestExportFileName,
  buildRequestExportSheetRows,
  fetchAllRequestsForExport,
  filterRequestsByDateRange,
  getBackendRequestOrderBy,
  getRequestApiFilters,
  getRequestExportDateField,
  REQUEST_EXPORT_MIME_TYPE,
  getRequestExportStatus,
} from './RequestList.export';
import type { DateRangeValue } from './SchoolList.helpers';

function parseJSONParam<T>(param: string | null, fallback: T): T {
  try {
    return param ? (JSON.parse(param) as T) : fallback;
  } catch {
    return fallback;
  }
}

function formatDateOnly(dateStr?: string) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function formatAutoApprovesOn(
  requestType?: string | null,
  requestEndsAt?: string | null,
) {
  if (requestType !== 'student' || !requestEndsAt) return 'NA';
  return new Date(requestEndsAt).toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function mapRequests(
  requestItems: OpsRequestItem[],
  selectedTab: REQUEST_TABS,
): RequestRow[] {
  switch (selectedTab) {
    case REQUEST_TABS.APPROVED:
      return requestItems.map((req) => ({
        request_id: req.request_id || req.id,
        status: getRequestExportStatus(req.request_status, selectedTab),
        request_type: req.request_type ?? '-',
        school_name: req.school?.name || '-',
        class: req.classInfo?.name || '-',
        from: req.requestedBy?.name || '-',
        approved_date: formatDateOnly(req.updated_at ?? undefined),
        approved_by: req.respondedBy?.name || '-',
      }));
    case REQUEST_TABS.REJECTED:
      return requestItems.map((req) => ({
        request_id: req.request_id || req.id,
        status: getRequestExportStatus(req.request_status, selectedTab),
        request_type: req.request_type ?? '-',
        school_name: req.school?.name || '-',
        class: req.classInfo?.name || '-',
        from: req.requestedBy?.name || '-',
        rejected_date: formatDateOnly(req.updated_at ?? undefined),
        rejected_reason: req.rejected_reason_type || '-',
        rejected_by: req.respondedBy?.name || '-',
      }));
    case REQUEST_TABS.FLAGGED:
      return requestItems.map((req) => ({
        request_id: req.request_id || req.id,
        status: getRequestExportStatus(req.request_status, selectedTab),
        request_type: req.request_type ?? '-',
        school_name: req.school?.name || '-',
        class: req.classInfo?.name || '-',
        from: req.requestedBy?.name || '-',
        flagged_date: formatDateOnly(req.updated_at ?? undefined),
        flagged_by: req.respondedBy?.name || '-',
      }));
    case REQUEST_TABS.PENDING:
    default:
      return requestItems.map((req) => {
        const requestedDate = req.created_at
          ? new Date(req.created_at).toLocaleString('en-IN', {
              timeZone: 'Asia/Kolkata',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })
          : '-';
        return {
          request_id: req.request_id || req.id,
          status: getRequestExportStatus(req.request_status, selectedTab),
          request_type: req.request_type ?? '-',
          school_name: req.school?.name || '-',
          class: req.classInfo?.name || '-',
          from: req.requestedBy?.name || '-',
          requested_date: requestedDate,
          auto_approves_on: formatAutoApprovesOn(
            req.request_type,
            req.request_ends_at,
          ),
        };
      });
  }
}

export function useRequestListPage() {
  const api = ServiceConfig.getI().apiHandler;
  const location = useLocation();
  const history = useHistory();
  const qs = new URLSearchParams(location.search);
  const tableScrollRef = React.useRef<HTMLDivElement>(null);
  const { roles } = useAppSelector(
    (state: RootState) => state.auth as AuthState,
  );
  const userRoles = roles || [];
  const tabOptions = useMemo(() => getRequestTabOptions(userRoles), []);
  const initialSelectedTab = (() => {
    const v = qs.get('tab') as REQUEST_TABS | null;
    return v && Object.values(REQUEST_TABS).includes(v)
      ? v
      : REQUEST_TABS.PENDING;
  })();
  const [selectedTab, setSelectedTab] =
    useState<REQUEST_TABS>(initialSelectedTab);
  const [searchTerm, setSearchTerm] = useState(() => qs.get('search') || '');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [filters, setFilters] = useState<RequestListFilters>(() =>
    parseJSONParam(qs.get('filters'), INITIAL_FILTERS),
  );
  const [page, setPage] = useState(() => {
    const p = parseInt(qs.get('page') || '', 10);
    return isNaN(p) || p < 1 ? 1 : p;
  });
  const [requestData, setRequestData] = useState<RequestRow[]>([]);
  const [rawRequestData, setRawRequestData] = useState<OpsRequestItem[]>([]);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [total, setTotal] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<RequestListFilters>(() =>
    parseJSONParam(qs.get('filters'), INITIAL_FILTERS),
  );
  const [filterOptions, setFilterOptions] = useState<RequestListFilterOptions>(
    () => ({
      ...INITIAL_FILTER_OPTIONS,
      request_type: [...Constants.public.Enums.ops_request_type],
    }),
  );
  const schoolNameToIdMapRef = React.useRef<Map<string, string>>(new Map());
  const hasRequestedFilterOptionsRef =
    React.useRef<EnumType<'ops_request_status'> | null>(null);
  const [orderBy, setOrderBy] = useState('requested_date');
  const [orderDir, setOrderDir] = useState<'desc' | 'asc'>('desc');
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);
  const requestStatus = useMemo<EnumType<'ops_request_status'>>(() => {
    switch (selectedTab) {
      case REQUEST_TABS.PENDING:
        return Constants.public.Enums.ops_request_status[0];
      case REQUEST_TABS.APPROVED:
        return Constants.public.Enums.ops_request_status[2];
      case REQUEST_TABS.REJECTED:
        return Constants.public.Enums.ops_request_status[1];
      case REQUEST_TABS.FLAGGED:
        return Constants.public.Enums.ops_request_status[3];
      default:
        return Constants.public.Enums.ops_request_status[0];
    }
  }, [selectedTab]);
  const hasSchoolFilter = filters.school.length > 0;
  const isSchoolFilterReady =
    !hasSchoolFilter || hasRequestedFilterOptionsRef.current === requestStatus;
  const shouldLoadFilterOptions = isFilterOpen || hasSchoolFilter;
  const isLoading =
    isDataLoading || (!isFilterOpen && hasSchoolFilter && isFilterLoading);
  const isExportDisabled = isLoading || isExporting || total === 0;
  const columns = useMemo(
    () => getRequestListColumns(selectedTab),
    [selectedTab],
  );
  const pageCount = Math.ceil(total / pageSize);
  const filterOptionsForSlider: Record<string, string[]> = {
    request_type: filterOptions.request_type,
    school: filterOptions.school.map((s) => s.name),
  };

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, filters]);

  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedTab !== REQUEST_TABS.PENDING)
      params.set('tab', String(selectedTab));
    if (debouncedSearchTerm) params.set('search', debouncedSearchTerm);
    if (Object.values(filters).some((arr) => arr.length))
      params.set('filters', JSON.stringify(filters));
    if (page !== 1) params.set('page', String(page));
    history.replace({ search: params.toString() });
  }, [selectedTab, debouncedSearchTerm, filters, page, history]);

  useEffect(() => {
    if (
      !shouldLoadFilterOptions ||
      hasRequestedFilterOptionsRef.current === requestStatus
    ) {
      return;
    }

    setIsFilterLoading(true);

    api
      .getRequestFilterOptions(requestStatus)
      .then((data) => {
        if (!data) return;

        setFilterOptions({
          request_type: (data.requestType || []).filter(
            (value): value is string => Boolean(value),
          ),
          school: data.school || [],
        });

        const nameToIdMap = new Map<string, string>();
        (data.school || []).forEach((school: { id: string; name: string }) => {
          nameToIdMap.set(school.name, school.id);
        });
        schoolNameToIdMapRef.current = nameToIdMap;
        hasRequestedFilterOptionsRef.current = requestStatus;
      })
      .catch((error) => {
        logger.error('Failed to fetch filter options', error);
      })
      .finally(() => {
        setIsFilterLoading(false);
      });
  }, [api, requestStatus, shouldLoadFilterOptions]);

  const handleOpenFilters = React.useCallback(() => {
    setIsFilterOpen(true);
    setTempFilters(filters);
  }, [filters]);

  const handleExportRequests = React.useCallback(
    async (dateRange: DateRangeValue): Promise<void> => {
      if (isLoading || isExporting || total === 0) return;

      setIsExporting(true);
      try {
        const exportNow = Date.now();
        const requests = await fetchAllRequestsForExport({
          api,
          requestStatus,
          filters: getRequestApiFilters(filters, schoolNameToIdMapRef.current),
          orderBy: getRequestExportDateField(selectedTab),
          orderDir: 'desc',
          searchTerm: debouncedSearchTerm,
          selectedTab,
          dateRange,
          now: exportNow,
        });
        const filteredRequests = filterRequestsByDateRange(
          requests,
          selectedTab,
          dateRange,
          exportNow,
        );
        const sheetRows = buildRequestExportSheetRows(
          mapRequests(filteredRequests, selectedTab),
          columns,
          filters,
        );
        const blob = new Blob([buildRequestExportCsv(sheetRows)], {
          type: REQUEST_EXPORT_MIME_TYPE,
        });

        await Util.handleBlobDownloadAndSave(
          blob,
          buildRequestExportFileName(selectedTab, dateRange),
        );
      } catch (error) {
        logger.error('Failed to export requests', error);
      } finally {
        setIsExporting(false);
      }
    },
    [
      api,
      columns,
      debouncedSearchTerm,
      filters,
      isExporting,
      isLoading,
      requestStatus,
      selectedTab,
      total,
    ],
  );

  useEffect(() => {
    if (!isSchoolFilterReady) return;

    const fetchData = async () => {
      setIsDataLoading(true);
      try {
        const cleanedFilters = getRequestApiFilters(
          filters,
          schoolNameToIdMapRef.current,
        );
        const backendOrderBy = getBackendRequestOrderBy(orderBy);
        const { data, total } = await api.getOpsRequests(
          requestStatus,
          page,
          pageSize,
          backendOrderBy,
          orderDir,
          cleanedFilters,
          debouncedSearchTerm,
        );
        const requestItems = (data || []) as OpsRequestItem[];
        setRawRequestData(requestItems);
        setRequestData(mapRequests(requestItems, selectedTab));
        setTotal(total || 0);
      } catch (error) {
        logger.error('Failed to fetch requests:', error);
        setRequestData([]);
        setTotal(0);
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchData();
    tableScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [
    api,
    requestStatus,
    selectedTab,
    page,
    pageSize,
    orderBy,
    orderDir,
    filters,
    debouncedSearchTerm,
    isSchoolFilterReady,
  ]);

  const handleTabChange = (newTab: REQUEST_TABS) => {
    setPage(1);
    setSelectedTab(newTab);
    setPage(1);
    if (newTab === REQUEST_TABS.APPROVED) setOrderBy('approved_date');
    else if (newTab === REQUEST_TABS.REJECTED) setOrderBy('rejected_date');
    else if (newTab === REQUEST_TABS.FLAGGED) setOrderBy('flagged_date');
    else setOrderBy('requested_date');
    setOrderDir('desc');
  };

  const handleSort = (colKey: string) => {
    const column = columns.find((c) => c.key === colKey);
    if (!column?.sortable) return;
    if (orderBy === colKey) {
      setOrderDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setOrderBy(colKey);
      setOrderDir(colKey === 'school_name' ? 'asc' : 'desc');
    }
    setPage(1);
  };

  const handleCancelFilters = () => {
    setTempFilters(INITIAL_FILTERS);
    setFilters(INITIAL_FILTERS);
    setIsFilterOpen(false);
    setPage(1);
  };

  const handleDeleteFilter = (key: string, value: string) => {
    setFilters((current) => {
      const updated = {
        ...current,
        [key]: current[key].filter((v) => v !== value),
      };
      setTempFilters(updated);
      return updated;
    });
    setPage(1);
  };

  const handleRowClick = (id: string | number, row: RequestRow) => {
    if (!row.request_type || typeof row.request_type !== 'string') return;
    const type = row.request_type.toLowerCase();
    const validTypes = [
      RequestTypes.STUDENT,
      RequestTypes.TEACHER,
      RequestTypes.PRINCIPAL,
      RequestTypes.SCHOOL,
    ];
    const matchedType = validTypes.find((t) => type.includes(t));
    if (!matchedType) {
      logger.warn('Unhandled request type:', row.request_type);
      return;
    }

    const fullRequestData = rawRequestData.find(
      (r) => r.request_id === row.request_id,
    );
    if (!fullRequestData) {
      logger.error('Could not find full request data for ID:', row.request_id);
      return;
    }

    const opsRoles = [RequestTypes.TEACHER, RequestTypes.PRINCIPAL];
    const roleKey = opsRoles.includes(matchedType) ? 'ops' : matchedType;
    const pathMap: Record<string, Record<string, string>> = {
      student: {
        [REQUEST_TABS.PENDING]: PAGES.STUDENT_PENDING_REQUEST,
        [REQUEST_TABS.APPROVED]: PAGES.OPS_APPROVED_REQUEST,
        [REQUEST_TABS.REJECTED]: PAGES.OPS_REJECTED_REQUEST,
        [REQUEST_TABS.FLAGGED]: PAGES.OPS_REJECTED_FLAGGED,
      },
      ops: {
        [REQUEST_TABS.PENDING]: PAGES.PRINCIPAL_TEACHER_PENDING_REQUEST,
        [REQUEST_TABS.APPROVED]: PAGES.OPS_APPROVED_REQUEST,
        [REQUEST_TABS.REJECTED]: PAGES.OPS_REJECTED_REQUEST,
        [REQUEST_TABS.FLAGGED]: PAGES.OPS_REJECTED_FLAGGED,
      },
      school: {
        [REQUEST_TABS.PENDING]: PAGES.SCHOOL_PENDING_REQUEST,
        [REQUEST_TABS.APPROVED]: PAGES.SCHOOL_APPROVED_REQUEST,
        [REQUEST_TABS.REJECTED]: PAGES.SCHOOL_REJECTED_REQUEST,
        [REQUEST_TABS.FLAGGED]: PAGES.OPS_REJECTED_FLAGGED,
      },
    };
    const rolePaths = pathMap[roleKey];
    const pathToNavigate = rolePaths[selectedTab]
      ? `${PAGES.SIDEBAR_PAGE}${PAGES.REQUEST_LIST}${rolePaths[selectedTab]}/${row.request_id}`
      : '';

    if (!pathToNavigate) {
      logger.warn(
        `Unhandled request tab for ${matchedType} request:`,
        selectedTab,
      );
      return;
    }

    history.push({
      pathname: pathToNavigate,
      state: { request: fullRequestData },
    });
  };

  return {
    columns,
    filterOptionsForSlider,
    filters,
    handleCancelFilters,
    handleDeleteFilter,
    handleExportRequests,
    handleOpenFilters,
    handleRowClick,
    handleSort,
    handleTabChange,
    isExportDisabled,
    isExporting,
    isFilterOpen,
    isLoading,
    orderBy,
    orderDir,
    page,
    pageCount,
    requestData,
    searchTerm,
    selectedTab,
    setFilters,
    setIsFilterOpen,
    setPage,
    setSearchTerm,
    setTempFilters,
    tableScrollRef,
    tabOptions,
    tempFilters,
  };
}
