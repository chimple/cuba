import { t } from 'i18next';
import {
  PERCENTAGE_BAND,
  PERCENTAGE_BAND_TRANSLATION_KEYS,
  FilteredSchoolsForSchoolListingOps,
  PROGRAM_TAB,
  PROGRAM_TAB_LABELS,
  SCHOOL_PERFORMANCE_STATUS_VALUES,
  type PercentageBandValue,
  type SchoolPerformanceStatusValue,
} from '../../common/constants';

export type SchoolMetricRow = FilteredSchoolsForSchoolListingOps;

export const DEFAULT_DATE_RANGE = '7d';

export const DATE_RANGE_OPTIONS = [
  { label: t('Last 7 Days'), value: '7d' },
  { label: t('Last 15 Days'), value: '15d' },
  { label: t('Last 30 Days'), value: '30d' },
] as const;

export type DateRangeValue = (typeof DATE_RANGE_OPTIONS)[number]['value'];

export type Filters = Record<string, string[]>;
export type PercentBand = PercentageBandValue;
export type SchoolPerformanceFilterValue = SchoolPerformanceStatusValue;
export type PercentageFilterKey =
  | 'activatedStudents'
  | 'activeStudents'
  | 'activeTeachers';
export type PercentageFilters = Partial<
  Record<PercentageFilterKey, PercentBand>
>;
export const PERCENTAGE_FILTER_OPTIONS: Array<{
  value: PercentBand;
  label: string;
  description: string;
}> = [
  {
    value: PERCENTAGE_BAND.LOW,
    label: t(PERCENTAGE_BAND_TRANSLATION_KEYS[PERCENTAGE_BAND.LOW]),
    description: t('≤ 30%'),
  },
  {
    value: PERCENTAGE_BAND.MID,
    label: t(PERCENTAGE_BAND_TRANSLATION_KEYS[PERCENTAGE_BAND.MID]),
    description: t('31% - 69%'),
  },
  {
    value: PERCENTAGE_BAND.HIGH,
    label: t(PERCENTAGE_BAND_TRANSLATION_KEYS[PERCENTAGE_BAND.HIGH]),
    description: t('≥ 70%'),
  },
];

export const SCHOOL_PERFORMANCE_FILTER_OPTIONS: SchoolPerformanceFilterValue[] =
  SCHOOL_PERFORMANCE_STATUS_VALUES;

// Shared filter metadata for the school listing drawer.
export const filterConfigsForSchool = [
  { key: 'partner', label: t('Select Partner') },
  { key: 'programManager', label: t('Select Program Manager') },
  { key: 'fieldCoordinator', label: t('Select Field Coordinator') },
  { key: 'programType', label: t('Select Program Type') },
  { key: 'state', label: t('Select State') },
  { key: 'district', label: t('Select District') },
  { key: 'block', label: t('Select Block') },
  { key: 'cluster', label: t('Select Cluster') },
];

// Fresh filter objects keep reset flows predictable across the page.
export const createEmptySchoolFilters = (): Filters => ({
  programType: [],
  partner: [],
  programManager: [],
  fieldCoordinator: [],
  state: [],
  district: [],
  block: [],
  cluster: [],
});

// Query-string parsing stays defensive so broken URLs do not break the page.
export const parseSchoolListJsonParam = <T,>(
  param: string | null,
  fallback: T,
) => {
  try {
    return param ? (JSON.parse(param) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const hasSchoolListFilters = (filters: Filters) =>
  Object.values(filters).some((values) => values.length > 0);

// Normalizes API filter payloads back into the UI filter shape.
export const mapSchoolListFilterOptions = (
  data?: Record<string, string[]>,
): Filters => ({
  programType: data?.programType || [],
  partner: data?.partner || [],
  programManager: data?.programManager || [],
  fieldCoordinator: data?.fieldCoordinator || [],
  state: data?.state || [],
  district: data?.district || [],
  block: data?.block || [],
  cluster: data?.cluster || [],
});

// Tabs shown across the top of the school listing.
export const tabOptions = Object.entries(PROGRAM_TAB_LABELS).map(
  ([value, label]) => ({
    label,
    value: value as PROGRAM_TAB,
  }),
);

export const DEFAULT_PAGE_SIZE = 20;

// Centralized column config keeps the page component focused on behavior.
export {
  getSchoolListColumns,
  getSchoolListExportColumns,
} from './SchoolList.columns';
export type { SchoolListExportColumn } from './SchoolList.columns';
export {
  buildSchoolLocationLabel,
  buildSchoolUdiseLocationLabel,
  formatCompactNumber,
  formatPercent,
  getPercentageBandLabel,
  getPercentageBandMeta,
  getPercentMeta,
  getSchoolCoordinatorList,
  getSchoolPerformanceLabel,
  getStatusMeta,
  isPercentInBand,
  normalizeStatus,
  pickFirstNumber,
  renderMetricCell,
  renderMetricWithPercentCell,
  resolvePerformanceStatus,
} from './SchoolList.metrics';
