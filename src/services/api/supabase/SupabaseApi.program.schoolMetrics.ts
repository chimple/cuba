import {
  FilteredSchoolsForSchoolListingOps,
  PERCENTAGE_BAND_VALUES,
  PROGRAM_TAB,
  ProgramType,
  TABLES,
} from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import { Database } from '../../database';
import { SupabaseApiProgramCatalog } from './SupabaseApi.program.catalog';
import {
  SCHOOL_LIST_PERCENTAGE_FILTER_KEYS,
  getActivatedStudentsPercent,
  getActiveStudentsPercent,
  getActiveTeachersPercent,
  getNumericMetric,
  getSchoolMetricsSortValue,
  isPercentWithinBand,
  isSchoolPerformanceStatusValue,
  resolveSchoolMetricsPerformanceStatus,
  type SchoolListPercentBand,
} from './SupabaseApi.program.helpers';
import {
  aggregateSchoolGradeMetricRows,
  getGradeIdsForSchoolMetricsFilter,
} from './SupabaseApi.program.schoolGradeMetrics';

type SchoolMetricsQueryResponse = {
  data: Array<Record<string, unknown>> | null;
  error: unknown;
  count: number | null;
};

type SchoolMetricsRangeQuery = {
  range: (from: number, to: number) => PromiseLike<SchoolMetricsQueryResponse>;
};

const SCHOOL_METRICS_BATCH_SIZE = 1000;

// Supabase can cap a single response at the API max rows limit, so client-side
// aggregation paths must page through every matching row before grouping.
const fetchAllSchoolMetricRows = async (
  query: SchoolMetricsRangeQuery,
): Promise<SchoolMetricsQueryResponse> => {
  const rows: Array<Record<string, unknown>> = [];
  let from = 0;
  let total: number | null = null;

  while (true) {
    // Reuse the same filtered query and advance only the requested range.
    const { data, error, count } = await query.range(
      from,
      from + SCHOOL_METRICS_BATCH_SIZE - 1,
    );

    if (error) {
      return { data: rows, error, count: total ?? count };
    }

    const batch = data ?? [];
    rows.push(...batch);
    total = total ?? count;

    if (
      batch.length < SCHOOL_METRICS_BATCH_SIZE ||
      (typeof total === 'number' && rows.length >= total)
    ) {
      return { data: rows, error: null, count: total ?? rows.length };
    }

    from += SCHOOL_METRICS_BATCH_SIZE;
  }
};

export interface SupabaseApiProgramSchoolMetrics {
  [key: string]: any;
}
export class SupabaseApiProgramSchoolMetrics extends SupabaseApiProgramCatalog {
  // Legacy RPC-backed school lookup used by older call sites.
  async getFilteredSchoolsForSchoolListing(params: {
    filters?: Record<string, string[]>;
    programId?: string;
    page?: number;
    page_size?: number;
    order_by?: string;
    order_dir?: 'asc' | 'desc';
    search?: string;
    percentage_filters?: Record<string, SchoolListPercentBand>;
    school_performance_filter?: string | null;
  }): Promise<{
    data: FilteredSchoolsForSchoolListingOps[];
    total: number;
  }> {
    if (!this.supabase) {
      logger.error('Supabase client is not initialized');
      return { data: [], total: 0 };
    }

    const { filters, programId, page, page_size, order_by, order_dir, search } =
      params;
    const payload: Database['public']['Functions']['get_filtered_schools_with_optional_program']['Args'] =
      {};

    if (filters && Object.keys(filters).length > 0) payload.filters = filters;
    if (programId) payload._program_id = programId;
    if (page) payload.page = page;
    if (page_size) payload.page_size = page_size;
    if (order_by) payload.order_by = order_by;
    if (order_dir) payload.order_dir = order_dir;
    if (search) payload.search = search;

    try {
      const { data, error } = await this.supabase.rpc(
        'get_filtered_schools_with_optional_program',
        payload,
      );
      if (error) {
        logger.error(
          'RPC error in get_filtered_schools_with_optional_program:',
          error,
        );
        return { data: [], total: 0 };
      }

      if (
        !data ||
        typeof data !== 'object' ||
        !('data' in data) ||
        !('total' in data)
      ) {
        throw new Error(
          'Supabase RPC did not return expected { data, total } shape',
        );
      }

      return {
        data: (data.data ??
          []) as unknown as FilteredSchoolsForSchoolListingOps[],
        total: typeof data.total === 'number' ? data.total : 0,
      };
    } catch (err) {
      logger.error(
        'Unexpected error in get_filtered_schools_with_optional_program:',
        err,
      );
      return { data: [], total: 0 };
    }
  }

  // Main School Listing data source. Default/all grades reads school-level rows;
  // selected grades reads grade rows and aggregates them back to one row per school.
  async getSchoolMetricsForSchoolListing(params: {
    filters?: Record<string, string[]>;
    programId?: string;
    page?: number;
    page_size?: number;
    order_by?: string;
    order_dir?: 'asc' | 'desc';
    search?: string;
    date_range?: string;
    percentage_filters?: Record<string, SchoolListPercentBand>;
    school_performance_filter?: string | null;
  }): Promise<{
    data: FilteredSchoolsForSchoolListingOps[];
    total: number;
  }> {
    if (!this.supabase) {
      logger.error('Supabase client is not initialized');
      return { data: [], total: 0 };
    }

    const {
      data: { user: authUser },
      error: authError,
    } = await this.supabase.auth.getUser();
    if (authError || !authUser) {
      logger.error('Current user is not available for school metrics query');
      return { data: [], total: 0 };
    }

    const {
      filters,
      programId,
      page = 1,
      page_size = 10,
      order_by,
      order_dir,
      search,
      date_range,
      percentage_filters,
      school_performance_filter,
    } = params;

    const specialRoles = await this.getUserSpecialRoles(authUser.id);
    const isAdminOrDirector = specialRoles.some((role: string) =>
      [RoleType.SUPER_ADMIN, RoleType.OPERATIONAL_DIRECTOR].includes(
        role as RoleType,
      ),
    );
    const isExternalUser = specialRoles.includes(RoleType.EXTERNAL_USER);
    const isFieldCoordinator = specialRoles.includes(
      RoleType.FIELD_COORDINATOR,
    );
    const shouldRestrictToSchoolLinks =
      !isAdminOrDirector && (isExternalUser || isFieldCoordinator);

    try {
      const [schoolUserResult, programUserResult] = await Promise.all([
        shouldRestrictToSchoolLinks || !isAdminOrDirector
          ? this.supabase
              .from(TABLES.SchoolUser)
              .select('school_id')
              .eq('user_id', authUser.id)
              .eq('is_deleted', false)
          : Promise.resolve({
              data: [] as Array<{ school_id?: string | null }>,
              error: null,
            }),
        !isAdminOrDirector && specialRoles.includes(RoleType.PROGRAM_MANAGER)
          ? this.supabase
              .from(TABLES.ProgramUser)
              .select('program_id')
              .eq('user', authUser.id)
              .eq('role', RoleType.PROGRAM_MANAGER)
              .eq('is_deleted', false)
          : Promise.resolve({
              data: [] as Array<{ program_id?: string | null }>,
              error: null,
            }),
      ]);

      if (schoolUserResult?.error) {
        logger.error(
          'Error fetching school_user access list:',
          schoolUserResult.error,
        );
        return { data: [], total: 0 };
      }
      if (programUserResult?.error) {
        logger.error(
          'Error fetching program_user access list:',
          programUserResult.error,
        );
        return { data: [], total: 0 };
      }

      const schoolIds = (schoolUserResult.data ?? [])
        .map((row) => row.school_id)
        .filter((id): id is string => !!id);
      const programIds = (programUserResult.data ?? [])
        .map((row) => row.program_id)
        .filter((id): id is string => !!id);

      const metricWindow =
        date_range && date_range !== 'all_time'
          ? date_range.trim().toLowerCase()
          : null;

      let query = this.supabase
        .from(TABLES.SchoolMetrics)
        .select('*', { count: 'exact' })
        .eq('is_deleted', false);

      if (metricWindow) {
        query = query.eq('metric_window', metricWindow);
      }

      if (programId) {
        query = query.eq('program_id', programId);
      }

      if (!isAdminOrDirector) {
        if (schoolIds.length > 0 && programIds.length > 0) {
          query = query.or(
            `school_id.in.(${schoolIds.join(',')}),program_id.in.(${programIds.join(',')})`,
          );
        } else if (schoolIds.length > 0) {
          query = query.in('school_id', schoolIds);
        } else if (programIds.length > 0) {
          query = query.in('program_id', programIds);
        } else {
          return { data: [], total: 0 };
        }
      }

      if (
        !isAdminOrDirector &&
        schoolIds.length === 0 &&
        programIds.length === 0
      ) {
        return { data: [], total: 0 };
      }

      const cleanedFilters = Object.fromEntries(
        Object.entries(filters ?? {}).filter(
          ([, values]) => Array.isArray(values) && values.length > 0,
        ),
      );

      // Grade filters are handled separately because school_metrics stores
      // selected-grade rows by grade_id, while the UI filter works with names.
      const selectedGradeValues = (cleanedFilters.grade ?? []).filter(
        (value) => typeof value === 'string' && value.trim().length > 0,
      );
      delete cleanedFilters.grade;
      const selectedGradeIds =
        selectedGradeValues.length > 0
          ? await getGradeIdsForSchoolMetricsFilter(
              this.supabase,
              selectedGradeValues,
            )
          : [];
      const hasSelectedGradeFilter = selectedGradeValues.length > 0;

      if (hasSelectedGradeFilter && selectedGradeIds.length === 0) {
        return { data: [], total: 0 };
      }

      // No explicit grade filter means "all grades", which uses the precomputed
      // school-level row. Partial grade selections use grade-level rows.
      if (hasSelectedGradeFilter) {
        query = query.in('grade_id', selectedGradeIds);
      } else {
        query = query.is('grade_id', null);
      }

      if (cleanedFilters.state?.length) {
        query = query.in('state', cleanedFilters.state);
      }
      if (cleanedFilters.district?.length) {
        query = query.in('district', cleanedFilters.district);
      }
      if (cleanedFilters.block?.length) {
        query = query.in('block', cleanedFilters.block);
      }
      if (cleanedFilters.cluster?.length) {
        query = query.in('cluster', cleanedFilters.cluster);
      }
      if (cleanedFilters.program?.length) {
        query = query.in('program_id', cleanedFilters.program);
      }
      if (cleanedFilters.model?.length) {
        const schoolModelValues = cleanedFilters.model.filter(
          (value): value is 'hybrid' | 'at_home' | 'at_school' =>
            Object.values(PROGRAM_TAB).includes(value as PROGRAM_TAB),
        );
        if (schoolModelValues.length) {
          query = query.in('school_model', schoolModelValues);
        }
      }
      if (cleanedFilters.partner?.length) {
        query = query.overlaps('partners', cleanedFilters.partner);
      }
      if (cleanedFilters.programManager?.length) {
        query = query.overlaps(
          'program_managers',
          cleanedFilters.programManager,
        );
      }
      if (cleanedFilters.fieldCoordinator?.length) {
        query = query.overlaps(
          'field_coordinators',
          cleanedFilters.fieldCoordinator,
        );
      }
      if (cleanedFilters.programType?.length) {
        const programTypeValues = cleanedFilters.programType.filter(
          (value): value is 'government' | 'private' | 'learning_centers' =>
            Object.values(ProgramType).includes(value as ProgramType),
        );
        if (programTypeValues.length) {
          query = query.in('program_type', programTypeValues);
        }
      }

      if (search) {
        query = query.or(
          [
            `school_name.ilike.%${search}%`,
            `udise.ilike.%${search}%`,
            `district.ilike.%${search}%`,
            `block.ilike.%${search}%`,
            `cluster.ilike.%${search}%`,
            `state.ilike.%${search}%`,
          ].join(','),
        );
      }

      const allowedSortColumns = new Set([
        'school_name',
        'school_performance',
        'onboarded_students',
        'activated_students',
        'active_students',
        'avg_time_spent',
        'active_teachers',
        'activated_teachers',
        'activities_assigned',
        'avg_assignments_completed',
        'avg_activities_completed',
        'student_parent_calls',
        'student_parent_inperson',
        'teacher_hm_calls',
        'community_visits',
        'community_parents_reached',
        'school_visits',
        'parents_on_whatsapp',
        'parents_in_group',
      ]);
      const sortBy = allowedSortColumns.has(order_by ?? '')
        ? (order_by as string)
        : 'school_name';
      const sortAscending = order_dir !== 'desc';

      const percentageFilters = Object.fromEntries(
        Object.entries(percentage_filters ?? {}).filter(
          ([key, value]) =>
            SCHOOL_LIST_PERCENTAGE_FILTER_KEYS.has(key) &&
            PERCENTAGE_BAND_VALUES.includes(value as SchoolListPercentBand),
        ),
      ) as Record<string, SchoolListPercentBand>;
      const schoolPerformanceFilter =
        typeof school_performance_filter === 'string' &&
        isSchoolPerformanceStatusValue(school_performance_filter)
          ? school_performance_filter
          : null;
      const requiresCalculatedFiltering =
        Object.keys(percentageFilters).length > 0 || !!schoolPerformanceFilter;
      // Percentage/performance filters and selected-grade aggregation need the
      // complete result set before sorting and slicing the requested page.
      const requiresClientSideProcessing =
        hasSelectedGradeFilter || requiresCalculatedFiltering;
      const normalizedPageSize = Math.max(Math.trunc(page_size), 1);
      const from = Math.max(Math.trunc(page) - 1, 0) * normalizedPageSize;

      // Selected grade rows are aggregated per school before sorting/filtering.
      const { data, error, count } = requiresClientSideProcessing
        ? await fetchAllSchoolMetricRows(query)
        : await query
            .order(sortBy, { ascending: sortAscending })
            .range(from, from + normalizedPageSize - 1);

      if (error) {
        logger.error('Error fetching school_metrics listing:', error);
        return { data: [], total: 0 };
      }

      let rows = hasSelectedGradeFilter
        ? aggregateSchoolGradeMetricRows(
            (data ?? []) as Array<Record<string, unknown>>,
          )
        : ((data ?? []) as Array<Record<string, unknown>>);

      // These filters are calculated from multiple columns, so they run after
      // optional grade aggregation instead of being pushed into PostgREST.
      if (Object.keys(percentageFilters).length > 0) {
        rows = rows.filter((row) =>
          Object.entries(percentageFilters).every(([key, band]) => {
            if (key === 'activatedStudents') {
              return isPercentWithinBand(
                getActivatedStudentsPercent(row),
                band,
              );
            }
            if (key === 'activeStudents') {
              return isPercentWithinBand(getActiveStudentsPercent(row), band);
            }
            if (key === 'activeTeachers') {
              return isPercentWithinBand(getActiveTeachersPercent(row), band);
            }
            return true;
          }),
        );
      }

      if (schoolPerformanceFilter) {
        rows = rows.filter(
          (row) =>
            resolveSchoolMetricsPerformanceStatus(row) ===
            schoolPerformanceFilter,
        );
      }

      if (requiresClientSideProcessing) {
        rows.sort((leftRow, rightRow) => {
          const leftValue = getSchoolMetricsSortValue(leftRow, sortBy);
          const rightValue = getSchoolMetricsSortValue(rightRow, sortBy);

          if (leftValue == null && rightValue == null) return 0;
          if (leftValue == null) return 1;
          if (rightValue == null) return -1;

          if (typeof leftValue === 'string' || typeof rightValue === 'string') {
            const result = String(leftValue).localeCompare(
              String(rightValue),
              undefined,
              {
                sensitivity: 'base',
                numeric: true,
              },
            );
            return sortAscending ? result : -result;
          }

          const result =
            leftValue === rightValue ? 0 : leftValue > rightValue ? 1 : -1;
          return sortAscending ? result : -result;
        });
      }

      const pagedRows = requiresClientSideProcessing
        ? rows.slice(from, from + normalizedPageSize)
        : rows;

      const mappedRows = pagedRows.map((row: Record<string, unknown>) => ({
        ...row,
        school_name: typeof row.school_name === 'string' ? row.school_name : '',
        udise: row.udise ?? null,
        num_students:
          typeof row.onboarded_students === 'number'
            ? row.onboarded_students
            : 0,
        num_teachers: getNumericMetric(row.num_teachers) ?? 0,
        total_teachers: getNumericMetric(row.total_teachers),
        onboarded_students: row.onboarded_students ?? null,
        activated_students: row.activated_students ?? null,
        active_students: row.active_students ?? null,
        avg_time_spent: row.avg_time_spent ?? null,
        active_teachers: row.active_teachers ?? null,
        activated_teachers: getNumericMetric(row.activated_teachers),
        active_teacher_percentage: getNumericMetric(
          row.active_teacher_percentage,
        ),
        activities_assigned: row.activities_assigned ?? null,
        avg_assignments_completed: row.avg_assignments_completed ?? null,
        avg_activities_completed: row.avg_activities_completed ?? null,
        phone_calls_students_parents: row.student_parent_calls ?? null,
        inperson_students_parents: row.student_parent_inperson ?? null,
        phone_calls_teachers_hms: row.teacher_hm_calls ?? null,
        community_visits: row.community_visits ?? null,
        school_visits: row.school_visits ?? null,
        parents_on_whatsapp: row.parents_on_whatsapp ?? null,
        parents_in_whatsapp_group: row.parents_in_group ?? null,
        parents_reached:
          typeof row.community_parents_reached === 'number'
            ? row.community_parents_reached
            : 0,
        program_managers: row.program_managers ?? [],
        field_coordinators: row.field_coordinators ?? [],
      })) as FilteredSchoolsForSchoolListingOps[];

      return {
        data: mappedRows,
        total: requiresClientSideProcessing ? rows.length : (count ?? 0),
      };
    } catch (error) {
      logger.error(
        'Unexpected error in getSchoolMetricsForSchoolListing:',
        error,
      );
      return { data: [], total: 0 };
    }
  }
}
