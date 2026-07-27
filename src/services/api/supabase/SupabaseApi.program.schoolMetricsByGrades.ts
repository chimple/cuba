import type { SupabaseClient } from '@supabase/supabase-js';
import {
  FilteredSchoolsForSchoolListingOps,
  TABLES,
} from '../../../common/constants';
import logger from '../../../utility/logger';
import type { Database } from '../../database';
import type { SchoolListPercentBand } from './SupabaseApi.program.helpers';

const getSchoolMetricsDays = (dateRange?: string | null) => {
  const value = dateRange?.trim().toLowerCase() ?? '7d';
  if (value === '15d') return 15;
  if (value === '30d') return 30;
  return 7;
};

// Accepts grade names or IDs from the UI and resolves them to grade UUIDs.
const getGradeIdsForSchoolListingFilter = async (
  supabase: SupabaseClient<Database> | undefined,
  gradeValues: string[],
): Promise<string[]> => {
  if (!supabase) return [];
  const normalizedGradeValues = Array.from(
    new Set(
      gradeValues
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  );

  if (normalizedGradeValues.length === 0) return [];

  const normalizedGradeValueSet = new Set(normalizedGradeValues);
  const normalizedGradeNameSet = new Set(
    normalizedGradeValues.map((value) => value.toLowerCase()),
  );

  const { data: gradeRows, error: gradeError } = await supabase
    .from(TABLES.Grade)
    .select('id, name')
    .eq('is_deleted', false);

  if (gradeError) {
    logger.error(
      'Error resolving grade filter values for school listing:',
      gradeError,
    );
    return [];
  }

  return Array.from(
    new Set(
      (gradeRows ?? [])
        .filter(
          (grade) =>
            normalizedGradeValueSet.has(String(grade.id)) ||
            normalizedGradeNameSet.has(String(grade.name).toLowerCase()),
        )
        .map((grade) => String(grade.id))
        .filter((gradeId) => gradeId.length > 0),
    ),
  );
};

// Uses one bulk RPC for selected grades to avoid frontend N+1 requests.
export const getSchoolListingMetricsByGrades = async (
  supabase: SupabaseClient<Database> | undefined,
  params: {
    filters?: Record<string, string[]>;
    programId?: string;
    page: number;
    pageSize: number;
    orderBy?: string;
    orderDir?: 'asc' | 'desc';
    search?: string;
    dateRange?: string;
    percentageFilters?: Record<string, SchoolListPercentBand>;
    schoolPerformanceFilter?: string | null;
  },
): Promise<{
  data: FilteredSchoolsForSchoolListingOps[];
  total: number;
} | null> => {
  if (!supabase) return { data: [], total: 0 };

  const gradeIds = await getGradeIdsForSchoolListingFilter(
    supabase,
    params.filters?.grade ?? [],
  );

  if (gradeIds.length === 0) return { data: [], total: 0 };

  // Grade IDs are passed separately; the RPC applies the remaining filters.
  const filtersWithoutGrade = Object.fromEntries(
    Object.entries(params.filters ?? {}).filter(([key, values]) => {
      return key !== 'grade' && Array.isArray(values) && values.length > 0;
    }),
  );

  try {
    const { data, error } = await supabase.rpc(
      'get_school_listing_metrics_by_grades',
      {
        p_grade_ids: gradeIds,
        p_days: getSchoolMetricsDays(params.dateRange),
        p_page: params.page,
        p_page_size: params.pageSize,
        p_order_by: params.orderBy || 'school_name',
        p_order_dir: params.orderDir || 'asc',
        p_search: params.search || '',
        p_filters: filtersWithoutGrade,
        p_percentage_filters: params.percentageFilters ?? {},
        p_school_performance_filter: params.schoolPerformanceFilter ?? null,
        p_program_id: params.programId ?? null,
      },
    );

    if (error) {
      logger.error('RPC error in get_school_listing_metrics_by_grades:', error);
      return null;
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
  } catch (error) {
    logger.error(
      'Unexpected error in get_school_listing_metrics_by_grades:',
      error,
    );
    return null;
  }
};
