import { SupabaseClient } from '@supabase/supabase-js';
import {
  PROGRAM_TAB,
  ProgramType,
  TABLES,
  TabType,
} from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import {
  ClassMetricsForClassListingRow,
  GetSchoolsWithProgramAccessParams,
  ProgramListingProgramRow,
  SchoolProgramAccessResponse,
  SchoolProgramAccessRow,
} from '../ServiceApi';
import {
  type ProgramMetricsDatabase,
  type ProgramMetricsTableRow,
} from './SupabaseApi.program.helpers';
import { SupabaseApiProgramSchoolMetrics } from './SupabaseApi.program.schoolMetrics';

export interface SupabaseApiProgramClassMetrics {
  [key: string]: any;
}
export class SupabaseApiProgramClassMetrics extends SupabaseApiProgramSchoolMetrics {
  async getClassMetricsForClassListing(params: {
    schoolId: string;
    date_range?: string;
  }): Promise<ClassMetricsForClassListingRow[]> {
    if (!this.supabase) {
      logger.error('Supabase client is not initialized');
      return [];
    }

    const schoolId = params.schoolId?.trim();
    if (!schoolId) {
      logger.error('getClassMetricsForClassListing called without schoolId');
      return [];
    }

    const days = (() => {
      const value = params.date_range?.trim().toLowerCase() ?? '7d';
      if (value === '15d') return 15;
      if (value === '30d') return 30;
      return 7;
    })();

    try {
      const { data, error } = await (
        this.supabase as unknown as {
          rpc: (
            fn: string,
            args: Record<string, unknown>,
          ) => Promise<{ data: unknown; error: unknown }>;
        }
      ).rpc('get_class_metrics_for_listing', {
        p_school_id: schoolId,
        p_days: days,
      });

      if (error) {
        logger.error('RPC error in get_class_metrics_for_listing:', error);
        return [];
      }

      return (data ?? []) as ClassMetricsForClassListingRow[];
    } catch (error) {
      logger.error(
        'Unexpected error in getClassMetricsForClassListing:',
        error,
      );
      return [];
    }
  }

  public async getProgramsFromProgramMetrics(params: {
    currentUserId: string;
    filters?: Record<string, string[]>;
    tab?: TabType;
    page?: number;
    page_size?: number;
    order_by?: string;
    order_dir?: 'asc' | 'desc';
    search?: string;
    date_range?: string;
  }): Promise<{
    data: ProgramListingProgramRow[];
    total: number;
  }> {
    if (!this.supabase) {
      logger.error('Supabase client is not initialized');
      return { data: [], total: 0 };
    }

    const {
      currentUserId,
      filters,
      tab = PROGRAM_TAB.ALL,
      page = 1,
      page_size = 10,
      order_by = 'program_name',
      order_dir = 'asc',
      search = '',
      date_range,
    } = params;

    // Needed because program_metrics numeric columns can arrive as strings from Supabase.
    const getProgramMetricNumber = (
      value: number | string | null | undefined,
    ): number => {
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string' && value.trim() !== '') {
        const parsedValue = Number(value);
        return Number.isFinite(parsedValue) ? parsedValue : 0;
      }
      return 0;
    };

    // Needed so missing target counts show NA instead of an incorrect 0%.
    const getProgramConfiguredTargetCount = (
      value: number | string | null | undefined,
    ): number | null => {
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        return value;
      }
      if (typeof value === 'string' && value.trim() !== '') {
        const parsedValue = Number(value);
        return Number.isFinite(parsedValue) && parsedValue > 0
          ? parsedValue
          : null;
      }
      return null;
    };

    // Needed because school division is stored as counts but the UI consumes percentages.
    const getProgramSchoolDivisionPercent = (
      value: number | null | undefined,
      totalSchools: number,
    ): number => {
      if (totalSchools <= 0) return 0;
      return Math.round((getProgramMetricNumber(value) / totalSchools) * 100);
    };

    // Needed to keep the Program Listing response stable while reading from program_metrics.
    const mapProgramMetricsRow = (
      row: ProgramMetricsTableRow,
    ): ProgramListingProgramRow => {
      const onboardedStudents = getProgramMetricNumber(row.onboarded_students);
      const targetStudentCount = getProgramConfiguredTargetCount(
        row.target_student_count ?? row.program?.students_count,
      );
      const activatedStudents = getProgramMetricNumber(row.activated_students);
      const activeStudents = getProgramMetricNumber(row.active_students);
      const onboardedTeachers = getProgramMetricNumber(row.onboarded_teachers);
      const targetTeachersCount = getProgramConfiguredTargetCount(
        row.target_teacher_count ??
          row.target_teachers_count ??
          row.program?.teachers_count,
      );
      const activatedTeachers = getProgramMetricNumber(row.activated_teachers);
      const activeTeachers = getProgramMetricNumber(row.active_teachers);
      const totalSchools = getProgramMetricNumber(row.total_schools);

      return {
        ...row,
        total_schools: totalSchools,
        performing_well: getProgramSchoolDivisionPercent(
          row.performing_well,
          totalSchools,
        ),
        needs_attention: getProgramSchoolDivisionPercent(
          row.needs_attention,
          totalSchools,
        ),
        needs_support: getProgramSchoolDivisionPercent(
          row.needs_support,
          totalSchools,
        ),
        onboarded_students: onboardedStudents,
        target_student_count: targetStudentCount,
        onboarded_students_pct:
          targetStudentCount !== null
            ? (onboardedStudents / targetStudentCount) * 100
            : null,
        activated_students: activatedStudents,
        activated_students_pct:
          onboardedStudents > 0
            ? (activatedStudents / onboardedStudents) * 100
            : 0,
        active_students: activeStudents,
        active_students_pct:
          activatedStudents > 0
            ? (activeStudents / activatedStudents) * 100
            : 0,
        avg_time_spent: getProgramMetricNumber(row.avg_time_spent),
        onboarded_teachers: onboardedTeachers,
        target_teachers_count: targetTeachersCount,
        onboarded_teachers_pct:
          targetTeachersCount !== null
            ? (onboardedTeachers / targetTeachersCount) * 100
            : null,
        activated_teachers: activatedTeachers,
        activated_teachers_pct:
          onboardedTeachers > 0
            ? (activatedTeachers / onboardedTeachers) * 100
            : 0,
        active_teachers: activeTeachers,
        active_teachers_pct:
          activatedTeachers > 0
            ? (activeTeachers / activatedTeachers) * 100
            : 0,
      };
    };

    // Needed to decide whether the current user can see all programs or only linked programs.
    const specialRoles = await this.getUserSpecialRoles(currentUserId);
    const isAdminOrDirector = specialRoles.some((role: string) =>
      [RoleType.SUPER_ADMIN, RoleType.OPERATIONAL_DIRECTOR].includes(
        role as RoleType,
      ),
    );

    try {
      // Needed to collect direct program access for program managers only.
      const programUserResult =
        !isAdminOrDirector && specialRoles.includes(RoleType.PROGRAM_MANAGER)
          ? await this.supabase
              .from(TABLES.ProgramUser)
              .select('program_id')
              .eq('user', currentUserId)
              .eq('role', RoleType.PROGRAM_MANAGER)
              .eq('is_deleted', false)
          : {
              data: [] as Array<{ program_id?: string | null }>,
              error: null,
            };

      if (programUserResult.error) {
        logger.error(
          'Error fetching program_user access list:',
          programUserResult.error,
        );
        return { data: [], total: 0 };
      }

      // Needed to convert program_user rows into clean IDs for program metrics filtering.
      const programIds = (programUserResult.data ?? [])
        .map((row) => row.program_id)
        .filter((id): id is string => !!id);

      // Needed to de-duplicate direct program access before applying row-level filtering.
      const accessProgramIds = Array.from(new Set(programIds));

      // Needed to query the program_metrics table even though generated DB types do not include it.
      const programMetricsClient = this
        .supabase as SupabaseClient<ProgramMetricsDatabase>;
      let query = programMetricsClient
        .from('program_metrics')
        .select('*, program:program_id(students_count, teachers_count)', {
          count: 'exact',
        })
        .eq('is_deleted', false);

      // Needed so the listing and export reflect the selected metric window.
      if (date_range && date_range !== 'all_time') {
        query = query.eq('metric_window', date_range.trim().toLowerCase());
      }

      // Needed to enforce access rules for non-admin and non-director users.
      if (!isAdminOrDirector) {
        if (accessProgramIds.length === 0) {
          return { data: [], total: 0 };
        }
        query = query.in('program_id', accessProgramIds);
      }

      // Needed to avoid sending empty filter arrays into DB and in-memory filters.
      const cleanedFilters = Object.fromEntries(
        Object.entries(filters ?? {}).filter(
          ([, values]) => Array.isArray(values) && values.length > 0,
        ),
      );

      // PostgREST OR filters require quoted values when user-facing labels can
      // contain commas, parentheses, or other filter syntax characters.
      const quotePostgrestValue = (value: string): string =>
        `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
      const buildListFilter = (
        column: string,
        values: string[] | undefined,
      ): string =>
        (values ?? [])
          .flatMap((value) => [
            `${column}.eq.${quotePostgrestValue(value)}`,
            `${column}.ilike.${quotePostgrestValue(`%"${value}"%`)}`,
          ])
          .join(',');

      const selectedModels = cleanedFilters.model?.filter((value) =>
        Object.values(PROGRAM_TAB).includes(value as PROGRAM_TAB),
      );
      const modelFilters = selectedModels?.length
        ? selectedModels
        : tab !== PROGRAM_TAB.ALL
          ? [tab]
          : [];
      const modelFilter = buildListFilter('program_model', modelFilters);
      if (modelFilter) query = query.or(modelFilter);

      // Array-backed columns must use PostgreSQL's overlap operator. Applying
      // ilike to these text[] fields fails with error 42883.
      const arrayFilters: Array<[string, string[] | undefined]> = [
        ['partners', cleanedFilters.partner],
        ['program_managers', cleanedFilters.programManager],
        ['field_coordinators', cleanedFilters.fieldCoordinator],
      ];
      arrayFilters.forEach(([column, values]) => {
        if (values?.length) query = query.overlaps(column, values);
      });

      // Needed to apply simple scalar filters at the database layer.
      if (cleanedFilters.state?.length)
        query = query.in('state', cleanedFilters.state);
      if (cleanedFilters.district?.length)
        query = query.in('district', cleanedFilters.district);
      if (cleanedFilters.block?.length)
        query = query.in('block', cleanedFilters.block);
      if (cleanedFilters.cluster?.length)
        query = query.in('cluster', cleanedFilters.cluster);
      if (cleanedFilters.programType?.length) {
        const programTypeValues = cleanedFilters.programType.filter(
          (value): value is ProgramType =>
            Object.values(ProgramType).includes(value as ProgramType),
        );
        if (programTypeValues.length) {
          query = query.in('program_type', programTypeValues);
        }
      }

      type ProgramPercentColumn =
        | 'onboarded_students_pct'
        | 'activated_students_pct'
        | 'active_students_pct'
        | 'onboarded_teachers_pct'
        | 'activated_teachers_pct'
        | 'active_teachers_pct';
      const percentFilters: Array<[ProgramPercentColumn, string]> = [
        ['onboarded_students_pct', 'onboardedStudentsPct'],
        ['activated_students_pct', 'activatedStudentsPct'],
        ['active_students_pct', 'activeStudentsPct'],
        ['onboarded_teachers_pct', 'onboardedTeachersPct'],
        ['activated_teachers_pct', 'activatedTeachersPct'],
        ['active_teachers_pct', 'activeTeachersPct'],
      ];
      const activePercentFilters = percentFilters
        .map(
          ([column, filterKey]) =>
            [
              column,
              (cleanedFilters[filterKey] ?? []).filter((band) =>
                ['Low', 'Mid', 'High'].includes(band),
              ),
            ] as const,
        )
        .filter(([, bands]) => bands.length > 0);
      const requiresCalculatedPercentageFiltering =
        activePercentFilters.length > 0;

      // Percentage fields are derived from multiple stored counts, so they
      // cannot be filtered as program_metrics columns through PostgREST.
      const isProgramPercentWithinBand = (
        percent: number | null | undefined,
        band: string,
      ): boolean => {
        if (percent == null) return false;
        if (band === 'Low') return percent < 31;
        if (band === 'Mid') return percent >= 31 && percent < 70;
        return percent >= 70;
      };

      // Needed to keep search behavior consistent across program and location fields.
      if (search) {
        const searchPattern = quotePostgrestValue(`%${search}%`);
        query = query.or(
          [
            `program_name.ilike.${searchPattern}`,
            `state.ilike.${searchPattern}`,
            `district.ilike.${searchPattern}`,
            `block.ilike.${searchPattern}`,
            `cluster.ilike.${searchPattern}`,
          ].join(','),
        );
      }

      const allowedOrderColumns = new Set([
        'program_name',
        'total_schools',
        'onboarded_students',
        'activated_students',
        'active_students',
        'avg_time_spent',
        'onboarded_teachers',
        'activated_teachers',
        'active_teachers',
      ]);
      const safeOrderBy = allowedOrderColumns.has(order_by)
        ? order_by
        : 'program_name';
      const normalizedPageSize = Math.max(Math.trunc(page_size), 1);
      const from = Math.max(Math.trunc(page) - 1, 0) * normalizedPageSize;
      const to = from + normalizedPageSize - 1;

      const orderedQuery = query.order(safeOrderBy, {
        ascending: order_dir === 'asc',
      });
      const pagedQuery = requiresCalculatedPercentageFiltering
        ? orderedQuery
        : orderedQuery.range(from, to);
      const { data, error, count } = await pagedQuery;
      if (error) {
        logger.error('Error fetching program_metrics listing:', error);
        return { data: [], total: 0 };
      }

      const mappedRows = ((data ?? []) as ProgramMetricsTableRow[]).map((row) =>
        mapProgramMetricsRow(row),
      );
      const filteredRows = requiresCalculatedPercentageFiltering
        ? mappedRows.filter((row) =>
            activePercentFilters.every(([column, bands]) =>
              bands.some((band) =>
                isProgramPercentWithinBand(row[column], band),
              ),
            ),
          )
        : mappedRows;

      return {
        data: requiresCalculatedPercentageFiltering
          ? filteredRows.slice(from, to + 1)
          : filteredRows,
        total: requiresCalculatedPercentageFiltering
          ? filteredRows.length
          : (count ?? 0),
      };
    } catch (error) {
      logger.error('Unexpected error in getProgramsFromProgramMetrics:', error);
      return { data: [], total: 0 };
    }
  }

  async getSchoolsWithProgramAccess(
    params: GetSchoolsWithProgramAccessParams,
  ): Promise<SchoolProgramAccessResponse> {
    const safeParams = params ?? ({} as GetSchoolsWithProgramAccessParams);
    const normalizedPage = safeParams.page ?? 1;
    const normalizedPageSize = safeParams.pageSize ?? 20;
    const fallbackResponse: SchoolProgramAccessResponse = {
      data: [],
      total: 0,
      page: normalizedPage,
      page_size: normalizedPageSize,
      total_pages: 0,
    };

    if (!this.supabase) {
      logger.error('Supabase client is not initialized');
      return fallbackResponse;
    }

    const academicYears = Array.isArray(safeParams.academicYears)
      ? safeParams.academicYears
      : [];
    const allowedFilterKeys: Array<
      'program' | 'programType' | 'state' | 'district' | 'block' | 'cluster'
    > = ['program', 'programType', 'state', 'district', 'block', 'cluster'];
    const normalizedFilters = allowedFilterKeys.reduce<
      Record<string, string[]>
    >((acc, key) => {
      const value = safeParams.filters?.[key];
      if (Array.isArray(value) && value.length > 0) {
        acc[key] = value;
      }
      return acc;
    }, {});

    try {
      const { data, error } = await this.supabase.rpc(
        'get_schools_with_program_access',
        {
          _academic_years: academicYears,
          _filters: normalizedFilters,
          _page: normalizedPage,
          _page_size: normalizedPageSize,
          _order_by: safeParams.orderBy ?? 'school_name',
          _order_dir: safeParams.orderDir ?? 'asc',
          _search: safeParams.search?.trim() || undefined,
          _include_migrated_counts: safeParams.includeMigratedCounts ?? false,
        },
      );

      if (error) {
        logger.error('RPC error in get_schools_with_program_access:', error);
        return fallbackResponse;
      }

      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return fallbackResponse;
      }

      const rawResponse = data as Record<string, any>;
      const rawRows = Array.isArray(rawResponse.data) ? rawResponse.data : [];
      const normalizedRows: SchoolProgramAccessRow[] = rawRows.map(
        (item: any) => ({
          ...(item && typeof item === 'object' && !Array.isArray(item)
            ? item
            : {}),
          school:
            item?.school &&
            typeof item.school === 'object' &&
            !Array.isArray(item.school)
              ? item.school
              : {},
          program:
            item?.program &&
            typeof item.program === 'object' &&
            !Array.isArray(item.program)
              ? item.program
              : {},
          program_users: Array.isArray(item?.program_users)
            ? item.program_users.filter(
                (user: any) =>
                  user && typeof user === 'object' && !Array.isArray(user),
              )
            : [],
        }),
      );

      return {
        data: normalizedRows,
        total: typeof rawResponse.total === 'number' ? rawResponse.total : 0,
        page:
          typeof rawResponse.page === 'number'
            ? rawResponse.page
            : normalizedPage,
        page_size:
          typeof rawResponse.page_size === 'number'
            ? rawResponse.page_size
            : normalizedPageSize,
        total_pages:
          typeof rawResponse.total_pages === 'number'
            ? rawResponse.total_pages
            : 0,
      };
    } catch (err) {
      logger.error('Unexpected error in get_schools_with_program_access:', err);
      return fallbackResponse;
    }
  }
}
