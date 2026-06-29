import { useEffect, useState } from 'react';
import {
  PROGRAM_TAB,
  FilteredSchoolsForSchoolListingOps,
} from '../../common/constants';
import { ServiceApi } from '../../services/api/ServiceApi';
import type {
  PercentageFilters,
  SchoolPerformanceFilterValue,
} from './SchoolList.helpers';

type SchoolListApiRequest = {
  filters: Record<string, string[]>;
  page: number;
  page_size: number;
  order_by: string;
  order_dir: 'asc' | 'desc';
  search: string;
  date_range: string;
  percentage_filters: PercentageFilters;
  school_performance_filter: SchoolPerformanceFilterValue | null;
};

export type SchoolMetricCell = {
  value: unknown;
  text: string;
  exportValueText?: string;
  exportPercentText?: string;
  render: import('react').ReactNode;
};

export type SchoolListSourceRow = FilteredSchoolsForSchoolListingOps & {
  id?: string | number;
  sch_id?: string | number;
  school_id?: string | number;
  total_students?: number | null;
  average_time_spent_mins?: number | null;
  avg_time_spent_minutes?: number | null;
  total_activities_assigned?: number | null;
  assignments_assigned?: number | null;
  community_parents_reached?: number | null;
  active_teacher_percentage?: number | null;
};

export type SchoolListRow = SchoolListSourceRow & {
  id: string | number;
  fieldCoordinators?: string;
  name: SchoolMetricCell;
  udiseLocation: SchoolMetricCell;
  schoolPerformance: SchoolMetricCell;
  onboardedStudents: SchoolMetricCell;
  activatedStudents: SchoolMetricCell;
  activeStudents: SchoolMetricCell;
  avgTimeSpent: SchoolMetricCell;
  activeTeachers: SchoolMetricCell;
  activitiesAssigned: SchoolMetricCell;
  parentsReached: SchoolMetricCell;
  avgAssignmentsCompleted: SchoolMetricCell;
  avgActivitiesCompleted: SchoolMetricCell;
  phoneCallsStudentsParents: SchoolMetricCell;
  phoneCallsTeachersHms: SchoolMetricCell;
  communityVisits: SchoolMetricCell;
  schoolVisits: SchoolMetricCell;
  parentsOnWhatsapp: SchoolMetricCell;
  parentsInWhatsappGroup: SchoolMetricCell;
};

const ORDER_BY_MAP: Record<string, string> = {
  name: 'school_name',
  schoolName: 'school_name',
  schoolPerformance: 'school_performance',
  onboardedStudents: 'onboarded_students',
  activatedStudents: 'activated_students',
  activeStudents: 'active_students',
  avgTimeSpent: 'avg_time_spent',
  activeTeachers: 'active_teachers',
  activitiesAssigned: 'activities_assigned',
  avgAssignmentsCompleted: 'avg_assignments_completed',
  avgActivitiesCompleted: 'avg_activities_completed',
  phoneCallsStudentsParents: 'student_parent_calls',
  phoneCallsTeachersHms: 'teacher_hm_calls',
  communityVisits: 'community_visits',
  parentsReached: 'community_parents_reached',
  schoolVisits: 'school_visits',
  parentsOnWhatsapp: 'parents_on_whatsapp',
  parentsInWhatsappGroup: 'parents_in_group',
};

export const useDebouncedValue = <T,>(value: T, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
};

export const buildSchoolListRequest = ({
  filters,
  selectedTab,
  page,
  pageSize,
  orderBy,
  orderDir,
  searchTerm,
  selectedDateRange,
  percentageFilters,
  schoolPerformanceFilter,
}: {
  filters: Record<string, string[]>;
  selectedTab: PROGRAM_TAB;
  page: number;
  pageSize: number;
  orderBy: string;
  orderDir: 'asc' | 'desc';
  searchTerm: string;
  selectedDateRange: string;
  percentageFilters: PercentageFilters;
  schoolPerformanceFilter: SchoolPerformanceFilterValue | null;
}): SchoolListApiRequest => {
  const cleanedFilters = Object.fromEntries(
    Object.entries(filters).filter(
      ([_, value]) => Array.isArray(value) && value.length > 0,
    ),
  );
  const tabModelFilter =
    selectedTab !== PROGRAM_TAB.ALL
      ? ({ model: [selectedTab] } as Record<string, string[]>)
      : {};

  return {
    filters: { ...cleanedFilters, ...tabModelFilter },
    page,
    page_size: pageSize,
    order_by: ORDER_BY_MAP[orderBy] ?? orderBy,
    order_dir: orderDir,
    search: searchTerm,
    date_range: selectedDateRange,
    percentage_filters: percentageFilters,
    school_performance_filter: schoolPerformanceFilter,
  };
};

export const fetchSchoolListPage = async ({
  api,
  filters,
  selectedTab,
  page,
  pageSize,
  orderBy,
  orderDir,
  searchTerm,
  selectedDateRange,
  percentageFilters,
  schoolPerformanceFilter,
}: {
  api: ServiceApi;
  filters: Record<string, string[]>;
  selectedTab: PROGRAM_TAB;
  page: number;
  pageSize: number;
  orderBy: string;
  orderDir: 'asc' | 'desc';
  searchTerm: string;
  selectedDateRange: string;
  percentageFilters: PercentageFilters;
  schoolPerformanceFilter: SchoolPerformanceFilterValue | null;
}) => {
  const getSchoolListing =
    api.getSchoolMetricsForSchoolListing?.bind(api) ??
    api.getFilteredSchoolsForSchoolListing?.bind(api);

  if (!getSchoolListing) {
    throw new Error('School listing API is not available');
  }

  return getSchoolListing(
    buildSchoolListRequest({
      filters,
      selectedTab,
      page,
      pageSize,
      orderBy,
      orderDir,
      searchTerm,
      selectedDateRange,
      percentageFilters,
      schoolPerformanceFilter,
    }),
  );
};

export const useSchoolListData = ({
  api,
  filters,
  selectedTab,
  page,
  pageSize,
  orderBy,
  orderDir,
  searchTerm,
  selectedDateRange,
  percentageFilters,
  schoolPerformanceFilter,
}: {
  api: ServiceApi;
  filters: Record<string, string[]>;
  selectedTab: PROGRAM_TAB;
  page: number;
  pageSize: number;
  orderBy: string;
  orderDir: 'asc' | 'desc';
  searchTerm: string;
  selectedDateRange: string;
  percentageFilters: PercentageFilters;
  schoolPerformanceFilter: SchoolPerformanceFilterValue | null;
}) => {
  const [schools, setSchools] = useState<SchoolListSourceRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetchSchoolListPage({
          api,
          filters,
          selectedTab,
          page,
          pageSize,
          orderBy,
          orderDir,
          searchTerm,
          selectedDateRange,
          percentageFilters,
          schoolPerformanceFilter,
        });

        if (!active) return;

        const data = (response?.data || []) as SchoolListSourceRow[];
        setTotal(response?.total || 0);
        setSchools(data);
      } catch {
        if (!active) return;
        setSchools([]);
        setTotal(0);
      } finally {
        if (active) {
          setIsLoading(false);
        }
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
    percentageFilters,
    schoolPerformanceFilter,
  ]);

  return { schools, total, isLoading };
};
