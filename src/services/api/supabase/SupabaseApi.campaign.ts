import { SupabaseClient } from '@supabase/supabase-js';
import {
  CAMPAIGN_OBJECTIVE,
  CAMPAIGN_STATUS,
  PROGRAM_TAB,
  ProgramType,
  TABLES,
  TabType,
  TableTypes,
} from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import { Database, Json } from '../../database';
import {
  CampaignAssignmentFilters,
  CampaignAssignmentOptions,
  CampaignAssignmentOptionsParams,
  CampaignAssignmentsResponse,
  CampaignAudienceOptions,
  CampaignAudiencePayload,
  CampaignAudienceSummary,
  CampaignAudienceSummaryParams,
  CampaignCancellationDetails,
  CampaignListingItem,
  CampaignListingParams,
  CampaignMessagingQueryParams,
  CampaignMessagingResponse,
  CampaignOption,
  CampaignSavedAudienceGroup,
  CampaignSchoolOption,
  CampaignSetupOptions,
  CreateCampaignSetupPayload,
  CreateCampaignSetupResult,
  LaunchCampaignPayload,
  ProgramListingProgramRow,
  UpdateCampaignMessagingRowPayload,
} from '../ServiceApi';
import {
  mapCampaignListingItem,
  sortCampaignListingItems,
} from '../campaignListingHelpers';
import { SupabaseApiOps } from './SupabaseApi.ops';

type CampaignProgramRow = Pick<TableTypes<'program'>, 'id' | 'name'>;

type ProgramMetricsTableRow = Omit<
  ProgramListingProgramRow,
  'target_student_count' | 'target_teachers_count'
> & {
  program_managers?: string[] | string | null;
  field_coordinators?: string[] | string | null;
  partners?: string[] | string | null;
  district?: string | null;
  block?: string | null;
  cluster?: string | null;
  target_student_count?: number | string | null;
  target_teachers_count?: number | string | null;
  target_teacher_count?: number | string | null;
  program_type?: ProgramType | null;
  program_model?: PROGRAM_TAB | PROGRAM_TAB[] | string | null;
  updated_at?: string | null;
  created_at?: string | null;
  is_deleted?: boolean | null;
};

type ProgramMetricsDatabase = Database & {
  public: Database['public'] & {
    Tables: Database['public']['Tables'] & {
      program_metrics: {
        Row: ProgramMetricsTableRow;
        Insert: ProgramMetricsTableRow;
        Update: Partial<ProgramMetricsTableRow>;
        Relationships: [];
      };
    };
  };
};

type CampaignAudienceSchoolLinkRow = Pick<
  TableTypes<'campaign_target_audience_school'>,
  'school_id'
>;

type CampaignAudienceGradeLinkRow = Pick<
  TableTypes<'campaign_target_audience_grade'>,
  'grade_id'
>;

type CampaignSavedAudienceGroupRow = Pick<
  TableTypes<'campaign_target_audience'>,
  'id' | 'name' | 'program_id' | 'is_all_schools' | 'is_all_grades'
> & {
  campaign_target_audience_school?: CampaignAudienceSchoolLinkRow[] | null;
  campaign_target_audience_grade?: CampaignAudienceGradeLinkRow[] | null;
};

type CampaignListingAudienceRow = Pick<
  TableTypes<'campaign_target_audience'>,
  'id' | 'is_all_schools'
> & {
  campaign_target_audience_school?: CampaignAudienceSchoolLinkRow[] | null;
};

type CampaignListingQueryRow = TableTypes<'campaign'> & {
  manager?: TableTypes<'user'> | TableTypes<'user'>[] | null;
  program?: TableTypes<'program'> | TableTypes<'program'>[] | null;
  target_audience?:
    | CampaignListingAudienceRow
    | CampaignListingAudienceRow[]
    | null;
};

type CampaignAccessSchoolRow = Pick<TableTypes<'school_user'>, 'school_id'> & {
  school?:
    | Pick<TableTypes<'school'>, 'program_id'>
    | Pick<TableTypes<'school'>, 'program_id'>[]
    | null;
};

const getSingleRelationValue = <T>(value: T | T[] | null | undefined) =>
  Array.isArray(value) ? (value[0] ?? null) : (value ?? null);

const CAMPAIGN_LISTING_NATIVE_SORT_COLUMNS: Partial<
  Record<NonNullable<CampaignListingParams['orderBy']>, string>
> = {
  name: 'name',
  startDate: 'start_date',
  endDate: 'end_date',
};

type CampaignSchoolRow = Pick<TableTypes<'school'>, 'id' | 'name' | 'group3'>;

type CampaignGradeRow = Pick<TableTypes<'grade'>, 'id' | 'name' | 'sort_index'>;

type CampaignClassGradeRow = Pick<TableTypes<'class'>, 'id' | 'grade_id'> & {
  grade?: CampaignGradeRow | CampaignGradeRow[] | null;
};

type CampaignClassUserRow = Pick<
  TableTypes<'class_user'>,
  'class_id' | 'user_id'
>;

type CampaignSchoolCourseGradeRow = {
  course?:
    | {
        grade?: CampaignGradeRow | CampaignGradeRow[] | null;
      }
    | Array<{
        grade?: CampaignGradeRow | CampaignGradeRow[] | null;
      }>
    | null;
};

type CampaignAssignmentCourseRow = Pick<
  TableTypes<'course'>,
  'id' | 'name' | 'grade_id' | 'sort_index' | 'subject_id'
>;

type CampaignAssignmentSchoolCourseRow = {
  course?: CampaignAssignmentCourseRow | CampaignAssignmentCourseRow[] | null;
};

type CampaignAssignmentChapterRow = Pick<
  TableTypes<'chapter'>,
  'id' | 'name' | 'course_id' | 'sort_index'
>;

type CampaignAssignmentLessonRow = Pick<TableTypes<'lesson'>, 'id' | 'name'>;

type CampaignAssignmentChapterLessonRow = Pick<
  TableTypes<'chapter_lesson'>,
  'chapter_id' | 'lesson_id' | 'sort_index'
> & {
  lesson?: CampaignAssignmentLessonRow | CampaignAssignmentLessonRow[] | null;
};

const firstOrSelf = <T>(value: T | T[] | null | undefined): T | null =>
  Array.isArray(value) ? (value[0] ?? null) : (value ?? null);

const chunkArray = <T>(items: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
};

const DEFAULT_CAMPAIGN_MESSAGING_PAGE_SIZE = 20;
export interface SupabaseApiCampaign {
  [key: string]: any;
}
export class SupabaseApiCampaign extends SupabaseApiOps {
  async getProgramFilterOptions(): Promise<Record<string, string[]>> {
    if (!this.supabase) {
      logger.error('Supabase client is not initialized');
      return {};
    }

    try {
      // Normalizes array fields that may arrive as real arrays or JSON strings.
      const normalizeProgramMetricsStringList = (
        value: string[] | string | null | undefined,
      ): string[] => {
        const normalizeString = (item: string): string[] => {
          const trimmedItem = item.trim();
          if (!trimmedItem || trimmedItem === 'null') return [];
          if (!trimmedItem.startsWith('[')) return [trimmedItem];
          try {
            const parsed = JSON.parse(trimmedItem) as Json;
            if (!Array.isArray(parsed)) return [trimmedItem];
            return parsed.filter(
              (entry): entry is string =>
                typeof entry === 'string' &&
                entry.trim() !== '' &&
                entry !== 'null',
            );
          } catch {
            return [trimmedItem];
          }
        };

        if (Array.isArray(value)) {
          return value.flatMap((item) =>
            typeof item === 'string' ? normalizeString(item) : [],
          );
        }
        return typeof value === 'string' ? normalizeString(value) : [];
      };

      // Builds the Program Listing drawer filter options from program_metrics rows.
      const buildProgramMetricsFilterOptions = (
        rows: ProgramMetricsTableRow[],
      ): Record<string, string[]> => {
        const options = {
          partner: new Set<string>(),
          programManager: new Set<string>(),
          programType: new Set<string>(),
          state: new Set<string>(),
          district: new Set<string>(),
        };

        rows.forEach((row) => {
          normalizeProgramMetricsStringList(row.partners).forEach((value) =>
            options.partner.add(value),
          );
          normalizeProgramMetricsStringList(row.program_managers).forEach(
            (value) => options.programManager.add(value),
          );
          if (row.program_type) options.programType.add(row.program_type);
          if (row.state?.trim()) options.state.add(row.state.trim());
          if (row.district?.trim()) options.district.add(row.district.trim());
        });

        return {
          partner: Array.from(options.partner).sort(),
          programManager: Array.from(options.programManager).sort(),
          programType: Array.from(options.programType).sort(),
          state: Array.from(options.state).sort(),
          district: Array.from(options.district).sort(),
        };
      };

      const programMetricsClient = this
        .supabase as SupabaseClient<ProgramMetricsDatabase>;
      const { data, error } = await programMetricsClient
        .from('program_metrics')
        .select(
          'partners,program_managers,program_type,state,district,is_deleted',
        )
        .eq('is_deleted', false);
      if (error) {
        logger.error('Error fetching program_metrics filter options:', error);
        return {};
      }

      return buildProgramMetricsFilterOptions(
        (data ?? []) as ProgramMetricsTableRow[],
      );
    } catch (err) {
      logger.error('Unexpected error:', err);
      return {};
    }
  }

  async getPrograms({
    currentUserId,
    filters = {},
    searchTerm = '',
    tab = PROGRAM_TAB.ALL,
    limit = 10,
    offset = 0,
    orderBy = 'program_name',
    order = 'asc',
    page,
    page_size,
    order_by,
    order_dir,
    search,
    date_range,
  }: {
    currentUserId?: string;
    filters?: Record<string, string[]>;
    searchTerm?: string;
    tab?: TabType;
    limit?: number;
    offset?: number;
    orderBy?: string;
    order?: 'asc' | 'desc';
    page?: number;
    page_size?: number;
    order_by?: string;
    order_dir?: 'asc' | 'desc';
    search?: string;
    date_range?: string;
  }): Promise<{ data: ProgramListingProgramRow[]; total: number }> {
    if (!this.supabase) {
      logger.error('Supabase client not initialized');
      return { data: [], total: 0 };
    }

    try {
      const authUserId =
        currentUserId ||
        (await this.supabase.auth.getUser()).data.user?.id ||
        '';
      if (!authUserId) {
        logger.error('Current user is not available for program query');
        return { data: [], total: 0 };
      }

      return await this.getProgramsFromProgramMetrics({
        currentUserId: authUserId,
        filters,
        tab,
        page: page ?? Math.floor(offset / limit) + 1,
        page_size: page_size ?? limit,
        order_by: order_by ?? orderBy,
        order_dir: order_dir ?? order,
        search: search ?? searchTerm,
        date_range,
      });
    } catch (err) {
      logger.error('Unexpected error in getPrograms:', err);
      return { data: [], total: 0 };
    }
  }

  async getProgramManagers(): Promise<{ name: string; id: string }[]> {
    if (!this.supabase) {
      logger.error('Supabase client is not initialized.');
      return [];
    }

    const { data, error } = await this.supabase.rpc('get_program_managers');

    if (error) {
      logger.error('Error fetching managers:', error);
      return [];
    }

    return (data as { name: string; id: string }[]) || [];
  }

  async getCampaignSetupOptions(): Promise<CampaignSetupOptions> {
    if (!this.supabase) {
      logger.error('Supabase client is not initialized.');
      return { programs: [], managers: [], savedGroups: [] };
    }

    const [programsResponse, managers, savedGroupsResponse] = await Promise.all(
      [
        this.supabase
          .from('program')
          .select('id, name')
          .eq('is_deleted', false)
          .order('name', { ascending: true }),
        this.getProgramManagers(),
        this.supabase
          .from('campaign_target_audience')
          .select(
            'id, name, program_id, is_all_schools, is_all_grades, campaign_target_audience_school(school_id), campaign_target_audience_grade(grade_id)',
          )
          .eq('is_deleted', false)
          .eq('is_saved', true)
          .order('created_at', { ascending: false }),
      ],
    );

    if (programsResponse.error) {
      logger.error('Error fetching campaign programs:', programsResponse.error);
    }

    if (savedGroupsResponse.error) {
      logger.error(
        'Error fetching campaign saved groups:',
        savedGroupsResponse.error,
      );
    }

    const programs = ((programsResponse.data ?? []) as CampaignProgramRow[])
      .filter((program) => program.id && program.name)
      .map((program) => ({
        id: String(program.id),
        name: String(program.name),
      }));

    const savedGroups = (
      (savedGroupsResponse.data ?? []) as CampaignSavedAudienceGroupRow[]
    )
      .filter((group) => group.id && group.name && group.program_id)
      .map((group) => this.mapCampaignSavedAudienceGroup(group));

    return {
      programs,
      managers,
      savedGroups,
    };
  }

  async getCampaignListing({
    page = 1,
    pageSize = 10,
    searchTerm = '',
    orderBy = 'startDate',
    orderDir = 'desc',
  }: CampaignListingParams): Promise<{
    data: CampaignListingItem[];
    totalCount: number;
  }> {
    if (!this.supabase) {
      logger.error('Supabase client is not initialized.');
      return { data: [], totalCount: 0 };
    }

    const supabase = this.supabase;
    const normalizedSearchTerm = searchTerm.trim();
    const now = new Date();
    const fetchCampaignListingMetrics = async (
      campaignIds: string[],
    ): Promise<Map<string, CampaignListingItem['dashboardMetrics']>> => {
      if (campaignIds.length === 0) {
        return new Map();
      }

      try {
        const { data: metricsData, error: metricsError } = await supabase.rpc(
          'get_campaign_dashboard_metrics',
          {
            p_campaign_ids: campaignIds,
          },
        );

        if (metricsError) {
          logger.error(
            'Error fetching campaign dashboard metrics for listing:',
            metricsError,
          );
          return new Map();
        }

        return new Map(
          (metricsData ?? []).map((metric) => [metric.campaign_id, metric]),
        );
      } catch (metricsError) {
        logger.error(
          'Unexpected error fetching campaign dashboard metrics for listing:',
          metricsError,
        );
        return new Map();
      }
    };

    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser?.id) {
        logger.error('Current user is not available for campaign listing');
        return { data: [], totalCount: 0 };
      }

      // Campaign listing access is role-based: admins/managers see all, field coordinators are scoped.
      const specialRoles = await this.getUserSpecialRoles(authUser.id);
      const hasGlobalCampaignAccess = specialRoles.some((role: string) =>
        [
          RoleType.SUPER_ADMIN,
          RoleType.OPERATIONAL_DIRECTOR,
          RoleType.PROGRAM_MANAGER,
        ].includes(role as RoleType),
      );
      const isFieldCoordinator =
        specialRoles.includes(RoleType.FIELD_COORDINATOR) &&
        !hasGlobalCampaignAccess;

      // Field coordinators can only see campaigns tied to their linked schools/programs.
      const [schoolAccessResult, programAccessResult] = isFieldCoordinator
        ? await Promise.all([
            supabase
              .from(TABLES.SchoolUser)
              .select('school_id, school:school_id(program_id)')
              .eq('user_id', authUser.id)
              .eq('is_deleted', false),
            supabase
              .from(TABLES.ProgramUser)
              .select('program_id')
              .eq('user', authUser.id)
              .eq('role', RoleType.FIELD_COORDINATOR)
              .eq('is_deleted', false),
          ])
        : [
            {
              data: [] as CampaignAccessSchoolRow[],
              error: null,
            },
            {
              data: [] as Array<{ program_id?: string | null }>,
              error: null,
            },
          ];

      if (schoolAccessResult.error) {
        logger.error(
          'Error fetching school_user campaign access list:',
          schoolAccessResult.error,
        );
        return { data: [], totalCount: 0 };
      }

      if (programAccessResult.error) {
        logger.error(
          'Error fetching program_user campaign access list:',
          programAccessResult.error,
        );
        return { data: [], totalCount: 0 };
      }

      const accessibleSchoolIds = new Set(
        ((schoolAccessResult.data ?? []) as CampaignAccessSchoolRow[])
          .map((row) => row.school_id)
          .filter((id): id is string => !!id),
      );
      const programIdsFromSchools = (
        (schoolAccessResult.data ?? []) as CampaignAccessSchoolRow[]
      )
        .map((row) => getSingleRelationValue(row.school)?.program_id ?? null)
        .filter((id): id is string => !!id);
      const fieldCoordinatorProgramIds = new Set(
        (programAccessResult.data ?? [])
          .map((row) => row.program_id)
          .filter((id): id is string => !!id),
      );
      const accessibleProgramIds = new Set([
        ...programIdsFromSchools,
        ...fieldCoordinatorProgramIds,
      ]);

      if (
        isFieldCoordinator &&
        accessibleSchoolIds.size === 0 &&
        accessibleProgramIds.size === 0
      ) {
        return { data: [], totalCount: 0 };
      }

      // Search is supported across campaign name, manager name, and program name.
      const [managerSearchResponse, programSearchResponse] =
        normalizedSearchTerm.length > 0
          ? await Promise.all([
              this.supabase
                .from(TABLES.User)
                .select('id')
                .ilike('name', `%${normalizedSearchTerm}%`)
                .eq('is_deleted', false)
                .limit(50),
              this.supabase
                .from(TABLES.Program)
                .select('id')
                .ilike('name', `%${normalizedSearchTerm}%`)
                .eq('is_deleted', false)
                .limit(50),
            ])
          : [
              { data: [], error: null },
              { data: [], error: null },
            ];

      if (managerSearchResponse.error) {
        logger.error(
          'Error searching campaign managers for listing:',
          managerSearchResponse.error,
        );
      }

      if (programSearchResponse.error) {
        logger.error(
          'Error searching campaign programs for listing:',
          programSearchResponse.error,
        );
      }

      const managerIds = (managerSearchResponse.data ?? []).map(
        (row) => row.id,
      );
      const programIds = (programSearchResponse.data ?? []).map(
        (row) => row.id,
      );
      const nativeSortColumn = CAMPAIGN_LISTING_NATIVE_SORT_COLUMNS[orderBy];
      const shouldUseDatabasePagination =
        !isFieldCoordinator && Boolean(nativeSortColumn);
      const campaignListingSelect = `*, manager:manager_id(*), program:program_id(*),
        target_audience:target_audience_id(
          id,
          is_all_schools,
          campaign_target_audience_school(school_id)
        )`;

      const campaignQuery = this.supabase
        .from('campaign')
        .select(campaignListingSelect, {
          count: shouldUseDatabasePagination ? 'exact' : undefined,
        })
        .eq('is_deleted', false);

      if (normalizedSearchTerm.length > 0) {
        // Escape quoted search text before building the PostgREST OR filter expression.
        const escapedSearchTerm = normalizedSearchTerm.replace(/"/g, '\\"');
        const orFilters = [`name.ilike."%${escapedSearchTerm}%"`];
        if (managerIds.length > 0) {
          orFilters.push(`manager_id.in.(${managerIds.join(',')})`);
        }
        if (programIds.length > 0) {
          orFilters.push(`program_id.in.(${programIds.join(',')})`);
        }
        campaignQuery.or(orFilters.join(','));
      }

      if (shouldUseDatabasePagination && nativeSortColumn) {
        campaignQuery
          .order(nativeSortColumn, { ascending: orderDir === 'asc' })
          .range(
            (Math.max(page, 1) - 1) * Math.max(pageSize, 1),
            Math.max(page, 1) * Math.max(pageSize, 1) - 1,
          );
      }

      const { data, error, count } = await campaignQuery;

      if (error) {
        logger.error('Error fetching campaign listing:', error);
        return { data: [], totalCount: 0 };
      }

      const mappedCampaigns = (data ?? []) as CampaignListingQueryRow[];

      // Apply field-coordinator visibility after the base campaign query so audience links can be inspected.
      const visibleCampaigns = shouldUseDatabasePagination
        ? mappedCampaigns
        : isFieldCoordinator
          ? mappedCampaigns.filter((campaign) => {
              const targetAudience = getSingleRelationValue(
                campaign.target_audience,
              );
              const audienceSchoolIds = (
                targetAudience?.campaign_target_audience_school ?? []
              )
                .map((row) => row.school_id)
                .filter((id): id is string => !!id);
              const hasProgramAccess =
                !!campaign.program_id &&
                accessibleProgramIds.has(campaign.program_id);
              const hasSchoolAccess = audienceSchoolIds.some((schoolId) =>
                accessibleSchoolIds.has(schoolId),
              );
              const hasDirectProgramAssignment =
                !!campaign.program_id &&
                fieldCoordinatorProgramIds.has(campaign.program_id);

              return (
                hasSchoolAccess ||
                (hasProgramAccess &&
                  (Boolean(targetAudience?.is_all_schools) ||
                    hasDirectProgramAssignment))
              );
            })
          : mappedCampaigns;
      const currentPage = Math.max(page, 1);
      const currentPageSize = Math.max(pageSize, 1);
      const from = (currentPage - 1) * currentPageSize;

      let listingItems: CampaignListingItem[] = [];
      let totalCount = 0;
      const campaignMetricsMap = await fetchCampaignListingMetrics(
        visibleCampaigns.map((campaign) => campaign.id),
      );

      if (shouldUseDatabasePagination) {
        listingItems = visibleCampaigns.map((campaign) =>
          mapCampaignListingItem(
            campaign,
            now,
            campaignMetricsMap.get(campaign.id) ?? null,
          ),
        );
        totalCount = count ?? 0;
      } else {
        const visibleListingItems = visibleCampaigns.map((campaign) =>
          mapCampaignListingItem(
            campaign,
            now,
            campaignMetricsMap.get(campaign.id) ?? null,
          ),
        );
        totalCount = visibleListingItems.length;
        listingItems = sortCampaignListingItems(
          visibleListingItems,
          orderBy,
          orderDir,
        ).slice(from, from + currentPageSize);
      }

      return {
        data: listingItems,
        totalCount,
      };
    } catch (error) {
      logger.error('Unexpected error fetching campaign listing:', error);
      return { data: [], totalCount: 0 };
    }
  }

  async cancelCampaign(campaignId: string, reason: string): Promise<void> {
    const trimmedReason = reason.trim();

    if (!this.supabase || !campaignId || !trimmedReason) {
      return;
    }

    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    const timestamp = new Date().toISOString();
    const { error } = await this.supabase
      .from('campaign')
      .update({
        campaign_status: CAMPAIGN_STATUS.INACTIVE,
        cancelled_by: user?.id ?? null,
        comments: trimmedReason,
        updated_at: timestamp,
      })
      .eq('id', campaignId)
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error cancelling campaign:', error);
      throw error;
    }
  }

  async getCampaignCancellationDetails(
    campaignId: string,
  ): Promise<CampaignCancellationDetails | null> {
    if (!this.supabase || !campaignId) {
      return null;
    }

    const { data, error } = await this.supabase
      .from('campaign')
      .select('updated_at, comments, cancelled_by')
      .eq('id', campaignId)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching campaign cancellation details:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    let canceledBy: string | null = null;

    if (data.cancelled_by) {
      const { data: cancelledByUser, error: cancelledByUserError } =
        await this.supabase
          .from('user')
          .select('name')
          .eq('id', data.cancelled_by)
          .eq('is_deleted', false)
          .maybeSingle();

      if (cancelledByUserError) {
        logger.error(
          'Error fetching campaign cancelled by user:',
          cancelledByUserError,
        );
      } else {
        canceledBy = cancelledByUser?.name ?? null;
      }
    }

    return {
      canceledBy,
      canceledOn: data.updated_at ?? null,
      messageToAdmin: data.comments ?? null,
    };
  }

  async getCampaignAudienceOptions(
    programId: string,
  ): Promise<CampaignAudienceOptions> {
    if (!this.supabase || !programId) {
      return { blocks: [], schools: [], grades: [] };
    }

    const { data: schoolRows, error: schoolError } = await this.supabase
      .from('school')
      .select('id, name, group3')
      .eq('program_id', programId)
      .eq('is_deleted', false)
      .order('name', { ascending: true });

    if (schoolError) {
      logger.error('Error fetching campaign audience schools:', schoolError);
      return { blocks: [], schools: [], grades: [] };
    }

    const schools: CampaignSchoolOption[] = (
      (schoolRows ?? []) as CampaignSchoolRow[]
    )
      .filter((school) => school.id && school.name)
      .map((school) => ({
        id: String(school.id),
        name: String(school.name),
        block: String(school.group3 || 'Unassigned'),
      }));

    const blocks = Array.from(
      new Set(schools.map((school) => school.block).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));

    const grades = await this.getCampaignGradesForSchools(
      schools.map((school) => school.id),
    );

    return { blocks, schools, grades };
  }

  async getCampaignAudienceSummary({
    schoolIds,
    gradeIds,
  }: CampaignAudienceSummaryParams): Promise<CampaignAudienceSummary> {
    if (!this.supabase || schoolIds.length === 0 || gradeIds.length === 0) {
      return { totalStudents: 0, grades: [] };
    }

    const { data: classRows, error: classError } = await this.supabase
      .from('class')
      .select('id, grade_id, grade:grade_id(id, name, sort_index)')
      .in('school_id', schoolIds)
      .in('grade_id', gradeIds)
      .eq('is_deleted', false);

    if (classError) {
      logger.error('Error fetching campaign summary classes:', classError);
      return { totalStudents: 0, grades: [] };
    }

    const classGradeMap = new Map<
      string,
      { gradeId: string; gradeName: string; sort: number }
    >();

    ((classRows ?? []) as CampaignClassGradeRow[]).forEach((row) => {
      const grade = firstOrSelf(row.grade);
      if (!row.id || !row.grade_id || !grade?.name) return;
      classGradeMap.set(String(row.id), {
        gradeId: String(row.grade_id),
        gradeName: String(grade.name),
        sort: Number(grade.sort_index ?? 9999),
      });
    });

    const classIds = Array.from(classGradeMap.keys());
    if (classIds.length === 0) return { totalStudents: 0, grades: [] };

    const classUserRows: CampaignClassUserRow[] = [];
    for (const classIdBatch of chunkArray(classIds, 500)) {
      const { data, error: classUserError } = await this.supabase
        .from('class_user')
        .select('class_id, user_id')
        .in('class_id', classIdBatch)
        .eq('role', RoleType.STUDENT)
        .eq('is_deleted', false);

      if (classUserError) {
        logger.error(
          'Error fetching campaign summary class users:',
          classUserError,
        );
        return { totalStudents: 0, grades: [] };
      }

      classUserRows.push(...((data ?? []) as CampaignClassUserRow[]));
    }

    const studentsByGrade = new Map<string, Set<string>>();
    const gradeMeta = new Map<string, { gradeName: string; sort: number }>();

    (classUserRows ?? []).forEach((row) => {
      const classMeta = classGradeMap.get(String(row.class_id));
      if (!classMeta || !row.user_id) return;
      if (!studentsByGrade.has(classMeta.gradeId)) {
        studentsByGrade.set(classMeta.gradeId, new Set<string>());
        gradeMeta.set(classMeta.gradeId, {
          gradeName: classMeta.gradeName,
          sort: classMeta.sort,
        });
      }
      studentsByGrade.get(classMeta.gradeId)?.add(String(row.user_id));
    });

    const grades = Array.from(studentsByGrade.entries())
      .map(([gradeId, students]) => ({
        gradeId,
        gradeName: gradeMeta.get(gradeId)?.gradeName ?? 'Grade',
        sort: gradeMeta.get(gradeId)?.sort ?? 9999,
        studentCount: students.size,
      }))
      .sort((a, b) => a.sort - b.sort || a.gradeName.localeCompare(b.gradeName))
      .map(({ gradeId, gradeName, studentCount }) => ({
        gradeId,
        gradeName,
        studentCount,
      }));

    return {
      totalStudents: grades.reduce(
        (total, grade) => total + grade.studentCount,
        0,
      ),
      grades,
    };
  }

  async createCampaignAudienceGroup(
    payload: CampaignAudiencePayload,
  ): Promise<CampaignSavedAudienceGroup> {
    const targetAudienceId = await this.insertCampaignTargetAudience(payload);
    return {
      id: targetAudienceId,
      name: payload.name || 'Saved audience group',
      programId: payload.programId,
      isAllSchools: payload.isAllSchools,
      isAllGrades: payload.isAllGrades,
      schoolIds: payload.isAllSchools ? [] : payload.schoolIds,
      gradeIds: payload.isAllGrades ? [] : payload.gradeIds,
    };
  }

  async createCampaignSetup(
    payload: CreateCampaignSetupPayload,
  ): Promise<CreateCampaignSetupResult> {
    if (!this.supabase) {
      throw new Error('Supabase client is not initialized.');
    }

    const createdAudienceForCampaign = !payload.savedAudienceGroupId;
    const targetAudienceId =
      payload.savedAudienceGroupId ||
      (await this.insertCampaignTargetAudience(payload));

    const campaignInsert = {
      program_id: payload.programId,
      target_audience_id: targetAudienceId,
      name: payload.campaignName,
      objective: payload.objective,
      target_type: payload.targetType ?? null,
      target_value: payload.targetValue ?? null,
      manager_id: payload.managerId,
      start_date: payload.startDate,
      end_date: payload.endDate,
      rewards: payload.rewards ? JSON.stringify(payload.rewards) : null,
    };

    const { data, error } = await this.supabase
      .from('campaign')
      .insert(campaignInsert)
      .select('id')
      .single();

    if (error) {
      logger.error('Error creating campaign setup:', error);
      if (createdAudienceForCampaign) {
        await this.deleteCampaignTargetAudience(targetAudienceId);
      }
      throw error;
    }

    return {
      campaignId: String(data.id),
      targetAudienceId,
    };
  }

  async launchCampaign(payload: LaunchCampaignPayload): Promise<void> {
    if (!this.supabase) {
      throw new Error('Supabase client is not initialized.');
    }
    if (!payload.campaignId) {
      throw new Error('Campaign id is required.');
    }
    if (!payload.currentUserId) {
      throw new Error('Current user id is required.');
    }
    if (!payload.rewards?.type || !payload.rewards?.rules?.length) {
      throw new Error('Campaign rewards are required.');
    }
    const requiresAssignments =
      payload.objective !== CAMPAIGN_OBJECTIVE.HOMEPAGE_LEARNING_PATHWAY;

    if (requiresAssignments && payload.assignments.length === 0) {
      throw new Error('Campaign assignments are required.');
    }
    if (payload.messagingRows.length === 0) {
      throw new Error('Campaign communication is required.');
    }

    if (requiresAssignments) {
      const schoolIds = Array.from(
        new Set(
          payload.assignments.flatMap((assignment) => assignment.schoolIds),
        ),
      );
      const gradeIds = Array.from(
        new Set(payload.assignments.map((assignment) => assignment.gradeId)),
      );

      if (schoolIds.length === 0 || gradeIds.length === 0) {
        throw new Error('Campaign assignment schools and grades are required.');
      }

      const { data: classRowsData, error: classRowsError } = await this.supabase
        .from(TABLES.Class)
        .select('id, school_id, grade_id')
        .in('school_id', schoolIds)
        .in('grade_id', gradeIds)
        .eq('is_deleted', false);

      if (classRowsError) {
        logger.error(
          'Error resolving campaign assignment classes:',
          classRowsError,
        );
        throw classRowsError;
      }

      const classRows = (classRowsData ?? []) as Array<{
        id: string;
        school_id: string;
        grade_id: string;
      }>;

      const classesBySchoolAndGrade = new Map<
        string,
        Array<{ id: string; school_id: string; grade_id: string }>
      >();
      classRows.forEach((classRow) => {
        const key = `${classRow.school_id}:${classRow.grade_id}`;
        if (!classesBySchoolAndGrade.has(key)) {
          classesBySchoolAndGrade.set(key, []);
        }
        classesBySchoolAndGrade.get(key)?.push(classRow);
      });

      const missingAssignmentTargets = new Set<string>();
      const assignmentRows = payload.assignments.flatMap((assignment) =>
        assignment.schoolIds.flatMap((schoolId) => {
          const classes =
            classesBySchoolAndGrade.get(`${schoolId}:${assignment.gradeId}`) ??
            [];
          if (classes.length === 0) {
            missingAssignmentTargets.add(`${schoolId}:${assignment.gradeId}`);
          }
          return classes.map((classRow) => ({
            campaign_id: payload.campaignId,
            batch_id: payload.campaignId,
            class_id: classRow.id,
            school_id: classRow.school_id,
            lesson_id: assignment.lessonId,
            chapter_id: assignment.chapterId,
            course_id: assignment.courseId,
            starts_at: assignment.startsAt,
            ends_at: assignment.endsAt,
            type: assignment.type,
            source: assignment.source,
            set_number: assignment.setNumber,
            is_class_wise: true,
            created_by: payload.currentUserId,
            is_deleted: false,
          }));
        }),
      );

      if (missingAssignmentTargets.size > 0) {
        logger.warn(
          'Skipping campaign assignments for school/grade pairs without classes:',
          Array.from(missingAssignmentTargets).map((target) => {
            const [schoolId, gradeId] = target.split(':');
            return { schoolId, gradeId };
          }),
        );
      }

      if (assignmentRows.length === 0) {
        throw new Error(
          'No classes found for the selected campaign assignments.',
        );
      }

      for (const assignmentBatch of chunkArray(assignmentRows, 500)) {
        const { error } = await this.supabase
          .from(TABLES.Assignment)
          .insert(assignmentBatch);

        if (error) {
          logger.error('Error inserting campaign assignments:', error);
          throw error;
        }
      }
    }

    const messagingRows = payload.messagingRows.map((row) => ({
      campaign_id: payload.campaignId,
      message_time: row.messageTime,
      poll_time: row.pollTime,
      message: row.message,
      media_link: row.mediaLink,
      poll: row.poll,
      message_status: 'pending',
      poll_status: 'pending',
      is_deleted: false,
    }));

    const { error: messagingInsertError } = await this.supabase
      .from('campaign_messaging')
      .insert(messagingRows);

    if (messagingInsertError) {
      logger.error('Error inserting campaign messaging:', messagingInsertError);
      throw messagingInsertError;
    }
  }

  async getCampaignAssignmentOptions({
    schoolIds,
    gradeIds,
  }: CampaignAssignmentOptionsParams): Promise<CampaignAssignmentOptions> {
    if (!this.supabase || gradeIds.length === 0) {
      return { grades: [] };
    }

    const courseMap = new Map<string, CampaignAssignmentCourseRow>();

    if (schoolIds.length > 0) {
      for (const schoolIdBatch of chunkArray(schoolIds, 500)) {
        const { data, error } = await this.supabase
          .from('school_course')
          .select(
            'course:course_id(id, name, grade_id, sort_index, subject_id)',
          )
          .in('school_id', schoolIdBatch)
          .eq('is_deleted', false);

        if (error) {
          logger.error('Error fetching campaign assignment courses:', error);
          continue;
        }

        ((data ?? []) as CampaignAssignmentSchoolCourseRow[]).forEach((row) => {
          const course = firstOrSelf(row.course);
          if (!course?.id || !course.name || !course.grade_id) return;
          if (!gradeIds.includes(String(course.grade_id))) return;
          courseMap.set(String(course.id), course);
        });
      }
    }

    const subjectsByGrade = new Map<
      string,
      CampaignAssignmentOptions['grades'][number]['subjects']
    >();

    const sortedCourses = Array.from(courseMap.values()).sort(
      (a, b) =>
        Number(a.sort_index ?? 9999) - Number(b.sort_index ?? 9999) ||
        String(a.name).localeCompare(String(b.name)),
    );

    const courseIds = sortedCourses.map((course) => String(course.id));
    const chapterRows: CampaignAssignmentChapterRow[] = [];

    for (const courseIdBatch of chunkArray(courseIds, 500)) {
      const { data, error } = await this.supabase
        .from(TABLES.Chapter)
        .select('id, name, course_id, sort_index')
        .in('course_id', courseIdBatch)
        .eq('is_deleted', false)
        .order('sort_index', { ascending: true });

      if (error) {
        logger.error('Error fetching campaign assignment chapters:', error);
        continue;
      }

      chapterRows.push(...((data ?? []) as CampaignAssignmentChapterRow[]));
    }

    const chapterIds = chapterRows.map((chapter) => String(chapter.id));
    const chapterLessonRows: CampaignAssignmentChapterLessonRow[] = [];

    for (const chapterIdBatch of chunkArray(chapterIds, 500)) {
      const { data, error } = await this.supabase
        .from(TABLES.ChapterLesson)
        .select('chapter_id, lesson_id, sort_index, lesson:lesson_id(id, name)')
        .in('chapter_id', chapterIdBatch)
        .eq('is_deleted', false)
        .order('sort_index', { ascending: true });

      if (error) {
        logger.error('Error fetching campaign assignment lessons:', error);
        continue;
      }

      chapterLessonRows.push(
        ...((data ?? []) as CampaignAssignmentChapterLessonRow[]),
      );
    }

    const lessonsByChapter = new Map<
      string,
      CampaignAssignmentOptions['grades'][number]['subjects'][number]['chapters'][number]['lessons']
    >();
    const lessonIdsByChapter = new Map<string, Set<string>>();

    chapterLessonRows
      .sort(
        (a, b) =>
          Number(a.sort_index ?? 9999) - Number(b.sort_index ?? 9999) ||
          String(a.lesson_id).localeCompare(String(b.lesson_id)),
      )
      .forEach((row) => {
        const lesson = firstOrSelf(row.lesson);
        if (!row.chapter_id || !lesson?.id) return;

        const chapterId = String(row.chapter_id);
        const lessonId = String(lesson.id);
        if (!lessonsByChapter.has(chapterId))
          lessonsByChapter.set(chapterId, []);
        if (!lessonIdsByChapter.has(chapterId)) {
          lessonIdsByChapter.set(chapterId, new Set<string>());
        }
        if (lessonIdsByChapter.get(chapterId)?.has(lessonId)) return;

        lessonIdsByChapter.get(chapterId)?.add(lessonId);
        lessonsByChapter.get(chapterId)?.push({
          id: lessonId,
          name: lesson.name || 'Untitled lesson',
        });
      });

    const chaptersByCourse = new Map<
      string,
      CampaignAssignmentOptions['grades'][number]['subjects'][number]['chapters']
    >();

    chapterRows
      .sort(
        (a, b) =>
          Number(a.sort_index ?? 9999) - Number(b.sort_index ?? 9999) ||
          String(a.name ?? '').localeCompare(String(b.name ?? '')),
      )
      .forEach((chapter) => {
        if (!chapter.id || !chapter.course_id) return;
        const courseId = String(chapter.course_id);
        if (!chaptersByCourse.has(courseId)) chaptersByCourse.set(courseId, []);
        chaptersByCourse.get(courseId)?.push({
          id: String(chapter.id),
          name: chapter.name || 'Untitled chapter',
          lessons: lessonsByChapter.get(String(chapter.id)) ?? [],
        });
      });

    const subjectOptions = sortedCourses.map((course) => ({
      id: String(course.id),
      name: course.name,
      gradeId: String(course.grade_id),
      chapters: chaptersByCourse.get(String(course.id)) ?? [],
    }));

    subjectOptions.forEach((subject) => {
      if (!subjectsByGrade.has(subject.gradeId)) {
        subjectsByGrade.set(subject.gradeId, []);
      }
      subjectsByGrade.get(subject.gradeId)?.push(subject);
    });

    return {
      grades: gradeIds.map((gradeId) => ({
        gradeId,
        subjects: subjectsByGrade.get(gradeId) ?? [],
      })),
    };
  }

  async getCampaignAssignments(
    campaignId: string,
    filters: CampaignAssignmentFilters,
  ): Promise<CampaignAssignmentsResponse> {
    if (!this.supabase || !campaignId) {
      return {
        assignments: [],
        total: 0,
      };
    }

    const { data, error } = await this.supabase.rpc(
      'get_campaign_assignments',
      {
        p_campaign_id: campaignId,
        p_grade_ids: filters.gradeIds?.length ? filters.gradeIds : null,
        p_subject_ids: filters.subjectIds?.length ? filters.subjectIds : null,
        p_page: filters.page ?? 1,
        p_page_size: filters.pageSize ?? 10,
      },
    );

    logger.info(
      `Fetched ${data?.length ?? 0} campaign assignments for campaign ${campaignId}`,
    );

    if (error) {
      throw error;
    }

    return {
      assignments:
        data?.map((row) => ({
          assignmentId: row.assignment_id,
          assignmentDate: row.assignment_date,

          gradeId: row.grade_id,
          gradeName: row.grade_name,

          subjectId: row.subject_id,
          subjectName: row.subject_name,

          lessonId: row.lesson_id,
          lessonName: row.lesson_name,
        })) ?? [],
      total: data?.length ? Number(data[0].total_count) : 0,
    };
  }

  async getCampaignSubjectsByCampaignId(
    campaignId: string,
  ): Promise<CampaignOption[]> {
    if (!this.supabase || !campaignId) {
      return [];
    }

    const { data, error } = await this.supabase
      .from(TABLES.Assignment)
      .select(
        `
        course:course_id(
          subject:subject_id(
            id,
            name
          )
        )
      `,
      )
      .eq('campaign_id', campaignId)
      .eq('is_deleted', false)
      .not('course_id', 'is', null);

    if (error) {
      logger.error('Error fetching campaign subjects:', error);
      return [];
    }

    const uniqueSubjects = new Map<string, CampaignOption>();

    (
      (data ?? []) as Array<{
        course?: {
          subject?: CampaignOption | CampaignOption[] | null;
        } | null;
      }>
    ).forEach((row) => {
      const course = Array.isArray(row.course) ? row.course[0] : row.course;
      const subject = Array.isArray(course?.subject)
        ? course?.subject[0]
        : course?.subject;

      if (subject?.id && subject?.name) {
        uniqueSubjects.set(String(subject.id), {
          id: String(subject.id),
          name: String(subject.name),
        });
      }
    });

    return Array.from(uniqueSubjects.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  protected mapCampaignSavedAudienceGroup(
    group: CampaignSavedAudienceGroupRow,
  ): CampaignSavedAudienceGroup {
    const schoolLinks = Array.isArray(group.campaign_target_audience_school)
      ? group.campaign_target_audience_school
      : [];
    const gradeLinks = Array.isArray(group.campaign_target_audience_grade)
      ? group.campaign_target_audience_grade
      : [];

    return {
      id: String(group.id),
      name: String(group.name),
      programId: String(group.program_id),
      isAllSchools: Boolean(group.is_all_schools),
      isAllGrades: Boolean(group.is_all_grades),
      schoolIds: schoolLinks
        .map((link) => link.school_id)
        .filter((schoolId: unknown): schoolId is string => !!schoolId),
      gradeIds: gradeLinks
        .map((link) => link.grade_id)
        .filter((gradeId: unknown): gradeId is string => !!gradeId),
    };
  }

  protected async getCampaignGradesForSchools(
    schoolIds: string[],
  ): Promise<{ id: string; name: string }[]> {
    if (!this.supabase || schoolIds.length === 0) return [];

    const gradeMap = new Map<
      string,
      { id: string; name: string; sort: number }
    >();

    const { data: classRows, error: classError } = await this.supabase
      .from('class')
      .select('grade_id, grade:grade_id(id, name, sort_index)')
      .in('school_id', schoolIds)
      .eq('is_deleted', false)
      .not('grade_id', 'is', null);

    if (classError) {
      logger.error('Error fetching class grades for campaign:', classError);
    }

    ((classRows ?? []) as CampaignClassGradeRow[]).forEach((row) => {
      const grade = firstOrSelf(row.grade);
      if (!grade?.id || !grade?.name) return;
      gradeMap.set(String(grade.id), {
        id: String(grade.id),
        name: String(grade.name),
        sort: Number(grade.sort_index ?? 9999),
      });
    });

    for (const schoolIdBatch of chunkArray(schoolIds, 500)) {
      const { data: schoolCourseRows, error: schoolCourseError } =
        await this.supabase
          .from('school_course')
          .select(
            'course:course_id(grade_id, grade:grade_id(id, name, sort_index))',
          )
          .in('school_id', schoolIdBatch)
          .eq('is_deleted', false);

      if (schoolCourseError) {
        logger.error(
          'Error fetching school course grades for campaign:',
          schoolCourseError,
        );
        continue;
      }

      ((schoolCourseRows ?? []) as CampaignSchoolCourseGradeRow[]).forEach(
        (row) => {
          const course = firstOrSelf(row.course);
          const grade = firstOrSelf(course?.grade);
          if (!grade?.id || !grade?.name) return;
          gradeMap.set(String(grade.id), {
            id: String(grade.id),
            name: String(grade.name),
            sort: Number(grade.sort_index ?? 9999),
          });
        },
      );
    }

    return Array.from(gradeMap.values())
      .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name))
      .map(({ id, name }) => ({ id, name }));
  }

  protected async insertCampaignTargetAudience(
    payload: CampaignAudiencePayload,
  ): Promise<string> {
    if (!this.supabase) {
      throw new Error('Supabase client is not initialized.');
    }

    const {
      data: { user },
    } = await this.supabase.auth.getUser();

    const { data, error } = await this.supabase
      .from('campaign_target_audience')
      .insert({
        name: payload.isSaved ? payload.name : null,
        program_id: payload.programId,
        is_all_schools: payload.isAllSchools,
        is_all_grades: payload.isAllGrades,
        is_saved: payload.isSaved,
        created_by: user?.id ?? null,
      })
      .select('id')
      .single();

    if (error) {
      logger.error('Error creating campaign target audience:', error);
      throw error;
    }

    const targetAudienceId = String(data.id);

    try {
      if (!payload.isAllSchools && payload.schoolIds.length > 0) {
        const { error: schoolInsertError } = await this.supabase
          .from('campaign_target_audience_school')
          .insert(
            payload.schoolIds.map((schoolId) => ({
              target_audience_id: targetAudienceId,
              school_id: schoolId,
            })),
          );

        if (schoolInsertError) {
          logger.error(
            'Error creating campaign target audience schools:',
            schoolInsertError,
          );
          throw schoolInsertError;
        }
      }

      if (!payload.isAllGrades && payload.gradeIds.length > 0) {
        const { error: gradeInsertError } = await this.supabase
          .from('campaign_target_audience_grade')
          .insert(
            payload.gradeIds.map((gradeId) => ({
              target_audience_id: targetAudienceId,
              grade_id: gradeId,
            })),
          );

        if (gradeInsertError) {
          logger.error(
            'Error creating campaign target audience grades:',
            gradeInsertError,
          );
          throw gradeInsertError;
        }
      }
    } catch (error) {
      await this.deleteCampaignTargetAudience(targetAudienceId);
      throw error;
    }

    return targetAudienceId;
  }

  protected async deleteCampaignTargetAudience(targetAudienceId: string) {
    if (!this.supabase) return;

    const cleanupSteps = [
      this.supabase
        .from('campaign_target_audience_school')
        .delete()
        .eq('target_audience_id', targetAudienceId),
      this.supabase
        .from('campaign_target_audience_grade')
        .delete()
        .eq('target_audience_id', targetAudienceId),
      this.supabase
        .from('campaign_target_audience')
        .delete()
        .eq('id', targetAudienceId),
    ];

    for (const cleanupStep of cleanupSteps) {
      const { error } = await cleanupStep;
      if (error) {
        logger.error('Error cleaning up campaign target audience:', error);
      }
    }
  }
  async getCampaignMessaging(
    campaignId: string,
    {
      page = 1,
      pageSize = DEFAULT_CAMPAIGN_MESSAGING_PAGE_SIZE,
    }: CampaignMessagingQueryParams = {},
  ): Promise<CampaignMessagingResponse> {
    const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
    const safePageSize = Number.isFinite(pageSize)
      ? Math.max(1, Math.floor(pageSize))
      : DEFAULT_CAMPAIGN_MESSAGING_PAGE_SIZE;
    const from = (safePage - 1) * safePageSize;
    const to = from + safePageSize - 1;

    const emptyResponse: CampaignMessagingResponse = {
      data: [],
      total: 0,
      page: safePage,
      pageSize: safePageSize,
    };

    if (!this.supabase) return emptyResponse;

    try {
      const effectiveCampaignId = campaignId.trim();
      if (!effectiveCampaignId) return emptyResponse;

      const { data, error, count } = await this.supabase
        .from('campaign_messaging')
        .select('*', { count: 'exact' })
        .eq('campaign_id', effectiveCampaignId)
        .eq('is_deleted', false)
        .order('message_time', { ascending: true })
        .range(from, to);

      if (error) {
        logger.error('Error fetching campaign messaging:', error);
        return emptyResponse;
      }

      logger.info(
        `Fetched campaign messaging for campaignId=${effectiveCampaignId}, page=${safePage}, pageSize=${safePageSize}:`,
        data,
      );

      return {
        data: (data ?? []) as CampaignMessagingResponse['data'],
        total: count ?? 0,
        page: safePage,
        pageSize: safePageSize,
      };
    } catch (error) {
      logger.error('Exception fetching campaign messaging:', error);
      return emptyResponse;
    }
  }

  async updateCampaignMessaging(
    rows: UpdateCampaignMessagingRowPayload[],
  ): Promise<boolean> {
    if (!this.supabase) return false;

    const normalizedRows = rows.filter(
      (row) =>
        String(row.id ?? '').trim().length > 0 ||
        String(row.message ?? '').trim().length > 0 ||
        String(row.mediaLink ?? '').trim().length > 0 ||
        String(row.pollQuestion ?? '').trim().length > 0 ||
        row.pollOptions.some(
          (option) => String(option ?? '').trim().length > 0,
        ),
    );
    if (normalizedRows.length === 0) return true;

    const updatedAt = new Date().toISOString();

    try {
      const rowsToUpdate = normalizedRows.filter(
        (row) => String(row.id ?? '').trim().length > 0,
      );
      const rowsToInsert = normalizedRows.filter(
        (row) => String(row.id ?? '').trim().length === 0,
      );

      const updateResults = await Promise.all(
        rowsToUpdate.map((row) => {
          const pollQuestion = row.pollQuestion.trim();
          const pollOptions = row.pollOptions
            .map((option) => option.trim())
            .filter((option) => option.length > 0);

          return this.supabase!.from('campaign_messaging')
            .update({
              message: row.message.trim(),
              media_link: row.mediaLink.trim() || null,
              message_time: row.messageTime,
              poll_time: row.pollTime,
              message_status: row.messageStatus ?? null,
              poll_status: row.pollStatus ?? null,
              poll:
                pollQuestion.length > 0 || pollOptions.length > 0
                  ? {
                      question: pollQuestion,
                      options: pollOptions,
                    }
                  : null,
              updated_at: updatedAt,
            })
            .eq('id', row.id!)
            .eq('is_deleted', false);
        }),
      );

      const insertRows = rowsToInsert.map((row) => {
        const pollQuestion = row.pollQuestion.trim();
        const pollOptions = row.pollOptions
          .map((option) => option.trim())
          .filter((option) => option.length > 0);

        return {
          campaign_id: row.campaignId,
          message: row.message.trim() || null,
          media_link: row.mediaLink.trim() || null,
          message_time: row.messageTime,
          poll_time: row.pollTime,
          poll:
            pollQuestion.length > 0 || pollOptions.length > 0
              ? {
                  question: pollQuestion,
                  options: pollOptions,
                }
              : null,
          message_status: 'pending',
          poll_status: 'pending',
          is_deleted: false,
          updated_at: updatedAt,
        };
      });

      const updateFailure = updateResults.find((result) => result.error);
      if (updateFailure?.error) {
        logger.error('Error updating campaign messaging:', updateFailure.error);
        return false;
      }

      if (insertRows.length > 0) {
        const { error: insertError } = await this.supabase
          .from('campaign_messaging')
          .insert(insertRows);

        if (insertError) {
          logger.error('Error inserting campaign messaging:', insertError);
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error('Exception updating campaign messaging:', error);
      return false;
    }
  }
}
