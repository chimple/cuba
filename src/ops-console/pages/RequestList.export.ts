import type { Column } from '../components/DataTableBody';
import { REQUEST_TABS, type EnumType } from '../../common/constants';
import type { ServiceApi } from '../../services/api/ServiceApi';
import { t } from 'i18next';
import type { DateRangeValue } from './SchoolList.helpers';
import type { OpsRequestItem, RequestRow } from './RequestList.types';

export const REQUEST_EXPORT_PAGE_SIZE = 500;
export const REQUEST_EXPORT_MIME_TYPE = 'text/csv;charset=utf-8';
export const REQUEST_EXPORT_RANGE_DAYS: Record<DateRangeValue, number> = {
  '7d': 7,
  '15d': 15,
  '30d': 30,
};

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const CSV_FORMULA_PREFIX = /^\s*[=+@-]/;
const getExportLabel = (key: string, fallback: string): string =>
  t(key) || fallback;

const REQUEST_ORDER_BY_MAPPING: Record<string, string> = {
  approved_date: 'updated_at',
  rejected_date: 'updated_at',
  requested_date: 'created_at',
  auto_approves_on: 'request_ends_at',
  flagged_date: 'updated_at',
  school_name: 'school(name)',
};

export type RequestApiFilters = {
  request_type?: string[];
  school?: string[];
};

export const getRequestApiFilters = (
  filters: Record<string, string[]>,
  schoolNameToIdMap: Map<string, string>,
): RequestApiFilters => {
  const requestTypes = (filters.request_type || []).filter(Boolean);
  const schools = (filters.school || [])
    .map((name) => schoolNameToIdMap.get(name) || name)
    .filter(Boolean);

  return {
    ...(requestTypes.length > 0 ? { request_type: requestTypes } : {}),
    ...(schools.length > 0 ? { school: schools } : {}),
  };
};

export const getBackendRequestOrderBy = (orderBy: string): string =>
  REQUEST_ORDER_BY_MAPPING[orderBy] || orderBy;

export const getRequestExportDateField = (
  selectedTab: REQUEST_TABS,
): 'created_at' | 'updated_at' =>
  selectedTab === REQUEST_TABS.PENDING ? 'created_at' : 'updated_at';

export const buildRequestExportFileName = (
  selectedTab: REQUEST_TABS,
  dateRange: DateRangeValue,
): string =>
  `ops-requests-${selectedTab.toLowerCase()}-${REQUEST_EXPORT_RANGE_DAYS[dateRange]}days.csv`;

type FetchAllRequestsForExportParams = {
  api: Pick<ServiceApi, 'getOpsRequests'>;
  requestStatus: EnumType<'ops_request_status'>;
  filters: RequestApiFilters;
  orderBy: string;
  orderDir: 'asc' | 'desc';
  searchTerm: string;
  selectedTab: REQUEST_TABS;
  dateRange: DateRangeValue;
  now?: number;
};

export const fetchAllRequestsForExport = async ({
  api,
  requestStatus,
  filters,
  orderBy,
  orderDir,
  searchTerm,
  selectedTab,
  dateRange,
  now = Date.now(),
}: FetchAllRequestsForExportParams): Promise<OpsRequestItem[]> => {
  const allRequests: OpsRequestItem[] = [];
  let currentPage = 1;
  let exportTotal = 0;
  let fetchedRequestCount = 0;
  const rangeStart =
    now - REQUEST_EXPORT_RANGE_DAYS[dateRange] * MILLISECONDS_PER_DAY;
  const dateField = getRequestExportDateField(selectedTab);
  const canStopAtDateBoundary = orderBy === dateField && orderDir === 'desc';

  while (currentPage === 1 || fetchedRequestCount < exportTotal) {
    const response = await api.getOpsRequests(
      requestStatus,
      currentPage,
      REQUEST_EXPORT_PAGE_SIZE,
      orderBy,
      orderDir,
      filters,
      searchTerm,
    );
    const pageRows = (response?.data || []) as OpsRequestItem[];
    exportTotal = response?.total ?? pageRows.length;
    fetchedRequestCount += pageRows.length;
    allRequests.push(
      ...pageRows.filter((request) => {
        const timestamp = Date.parse(request[dateField] ?? '');
        return (
          Number.isFinite(timestamp) &&
          timestamp >= rangeStart &&
          timestamp <= now
        );
      }),
    );
    const reachedDateBoundary =
      canStopAtDateBoundary &&
      pageRows.some((request) => {
        const timestamp = Date.parse(request[dateField] ?? '');
        return Number.isFinite(timestamp) && timestamp < rangeStart;
      });

    if (
      pageRows.length === 0 ||
      pageRows.length < REQUEST_EXPORT_PAGE_SIZE ||
      fetchedRequestCount >= exportTotal ||
      reachedDateBoundary
    ) {
      break;
    }

    currentPage += 1;
  }

  return allRequests;
};

const escapeCsvCell = (value: string): string => {
  const safeValue = CSV_FORMULA_PREFIX.test(value) ? `'${value}` : value;
  return `"${safeValue.replace(/"/g, '""')}"`;
};

export const buildRequestExportCsv = (sheetRows: string[][]): string =>
  `\uFEFF${sheetRows
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\r\n')}`;

const getRequestDateForTab = (
  request: OpsRequestItem,
  selectedTab: REQUEST_TABS,
): string | null => request[getRequestExportDateField(selectedTab)];

export const filterRequestsByDateRange = (
  requests: OpsRequestItem[],
  selectedTab: REQUEST_TABS,
  dateRange: DateRangeValue,
  now = Date.now(),
): OpsRequestItem[] => {
  // Match the date rendered by the active tab for its status event.
  const rangeStart =
    now - REQUEST_EXPORT_RANGE_DAYS[dateRange] * MILLISECONDS_PER_DAY;

  return requests.filter((request) => {
    const timestamp = Date.parse(
      getRequestDateForTab(request, selectedTab) ?? '',
    );
    return (
      Number.isFinite(timestamp) && timestamp >= rangeStart && timestamp <= now
    );
  });
};

export const buildRequestExportSheetRows = (
  rows: RequestRow[],
  columns: Array<Pick<Column<RequestRow>, 'key' | 'label'>>,
  filters: Record<string, string[]> = {},
): string[][] => [
  ...(filters.request_type?.length || filters.school?.length
    ? [
        [getExportLabel('Applied Filters', 'Applied Filters'), ''],
        ...(filters.request_type?.length
          ? [
              [
                getExportLabel('Request Type', 'Request Type'),
                filters.request_type.join(', '),
              ],
            ]
          : []),
        ...(filters.school?.length
          ? [[getExportLabel('School', 'School'), filters.school.join(', ')]]
          : []),
        [],
      ]
    : []),
  columns.map((column) => String(column.label ?? '')),
  ...rows.map((row) =>
    columns.map((column) => {
      const value = row[column.key as keyof RequestRow];
      return value === undefined || value === null || value === ''
        ? '-'
        : String(value);
    }),
  ),
];
