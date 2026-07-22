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
import { store } from '../../../redux/store';
import logger from '../../../utility/logger';
import { Database, Json } from '../../database';
import {
  CampaignAssignmentFilters,
  CampaignAssignmentOptions,
  CampaignAssignmentOptionsParams,
  CampaignAssignmentsResponse,
  CampaignAssignmentsReportParams,
  CampaignAssignmentsReportResponse,
  CampaignAudienceOptions,
  CampaignAudiencePayload,
  CampaignAudienceSummary,
  CampaignAudienceSummaryParams,
  CampaignCancellationDetails,
  CampaignDashboardMetric,
  CampaignListingItem,
  CampaignListingParams,
  CampaignMessagingQueryParams,
  CampaignMessagingResponse,
  CampaignMessageReportParams,
  CampaignMessageReportResponse,
  CampaignOption,
  CampaignRewardsReportParams,
  CampaignRewardsReportResponse,
  CampaignWhatsappLabelData,
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
  CAMPAIGN_LISTING_ORDER_BY,
  mapCampaignListingItem,
  sortCampaignListingItems,
} from '../campaignListingHelpers';
import {
  asRecord,
  buildCampaignMessageReport,
  getArray,
  normalizePeriskopeMessage,
  providerResult,
  type CampaignMessagingProviderSource,
  type CampaignProviderData,
  type ProviderChat,
  type ProviderJsonRecord,
  type ProviderJsonValue,
} from '../../../ops-console/components/campaignsOverview/CampaignReports_Messages/CampaignMessageReport.helpers';
import { SupabaseApiOps } from './SupabaseApi.ops';

const PERISKOPE_BASE_URL =
  import.meta.env.VITE_PERISKOPE_API_BASE_URL ?? 'https://api.periskope.app/v1';
const PROVIDER_PAGE_SIZE = 1999;
const PROVIDER_CACHE_TTL_MS = 60_000;
type CampaignWhatsappGroupTarget = {
  botNumber: string;
  groupId: string;
  name: string;
};
type CampaignProviderCacheEntry = {
  expiresAt: number;
  request: Promise<CampaignProviderData>;
};
const campaignProviderCache = new Map<string, CampaignProviderCacheEntry>();

export const fetchCampaignProviderData = async (
  campaignId: string,
  groupTargets: CampaignWhatsappGroupTarget[],
): Promise<CampaignProviderData> => {
  const label = `campaign_${campaignId}`;
  const cacheKey = `${campaignId}:${groupTargets
    .map(({ botNumber, groupId }) => `${botNumber}:${groupId}`)
    .sort()
    .join(',')}`;
  const now = Date.now();
  const cached = campaignProviderCache.get(cacheKey);
  if (cached && cached.expiresAt > now) return cached.request;

  const request = fetchPeriskopeCampaignData(label, groupTargets);
  campaignProviderCache.set(cacheKey, {
    expiresAt: now + PROVIDER_CACHE_TTL_MS,
    request,
  });
  try {
    const periskopeData = await request;
    if (periskopeData.labelData.providerErrors > 0) {
      campaignProviderCache.delete(cacheKey);
    }
    logger.info('Campaign WhatsApp report loaded from Periskope.', {
      campaignId,
      chatCount: periskopeData.chats.length,
      providerErrors: periskopeData.labelData.providerErrors,
    });
    return periskopeData;
  } catch (error) {
    campaignProviderCache.delete(cacheKey);
    throw error;
  }
};

const fetchPeriskopeCampaignData = async (
  label: string,
  groupTargets: CampaignWhatsappGroupTarget[],
): Promise<CampaignProviderData> => {
  if (groupTargets.length === 0) return providerResult(label, [], []);
  const apiKey = import.meta.env.VITE_PERISKOPE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      'Missing client provider configuration: VITE_PERISKOPE_API_KEY',
    );
  }
  let providerErrors = 0;
  const chats: ProviderChat[] = groupTargets.map(
    ({ botNumber, groupId, name }) => ({
      botNumber,
      chatId: groupId,
      memberCount: 0,
      name,
      provider: 'periskope',
      providers: ['periskope'],
    }),
  );
  const messages = (
    await Promise.all(
      chats.map(async (chat) => {
        try {
          const url = new URL(
            `${PERISKOPE_BASE_URL}/chats/${encodeURIComponent(chat.chatId)}/messages`,
          );
          url.searchParams.set('offset', '0');
          url.searchParams.set('limit', String(PROVIDER_PAGE_SIZE));
          const payload = await fetchRecord(url.toString(), {
            Authorization: `Bearer ${apiKey}`,
            'x-phone': chat.botNumber,
          });
          return getArray(payload.messages).flatMap((value) =>
            normalizePeriskopeMessage(value, chat),
          );
        } catch (error) {
          providerErrors += 1;
          logger.error('Failed to fetch messages for a campaign group.', error);
          return [];
        }
      }),
    )
  ).flat();
  return providerResult(label, chats, messages, providerErrors);
};

const fetchRecord = async (
  url: string,
  headers: Record<string, string>,
): Promise<ProviderJsonRecord> => {
  const response = await fetch(url, { headers });
  const text = await response.text();
  const payload: ProviderJsonValue = text ? JSON.parse(text) : {};
  if (!response.ok)
    throw new Error(`Provider request failed: ${response.status}`);
  return asRecord(payload) ?? {};
};

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

type CampaignAudienceAccessRow = Pick<
  TableTypes<'campaign_target_audience_school'>,
  'target_audience_id'
>;

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

const CAMPAIGN_REACH_METRIC_WINDOW = '7d';

const isCampaignListingRelationSort = (
  orderBy: NonNullable<CampaignListingParams['orderBy']>,
) => orderBy === 'manager' || orderBy === 'programName';

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
    orderBy = 'name',
    order = 'asc',
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

      // The public API uses limit/offset pagination while the existing metrics
      // implementation uses page/page_size internally.
      return await this.getProgramsFromProgramMetrics({
        currentUserId: authUserId,
        filters,
        tab,
        page: Math.floor(Math.max(offset, 0) / Math.max(limit, 1)) + 1,
        page_size: Math.max(limit, 1),
        order_by: orderBy === 'name' ? 'program_name' : orderBy,
        order_dir: order,
        search: searchTerm,
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
    includeMetrics = true,
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

    try {
      const authState = store.getState().auth;
      const authUserId =
        authState.authUser?.id ||
        (await supabase.auth.getUser()).data.user?.id ||
        '';

      if (!authUserId) {
        logger.error('Current user is not available for campaign listing');
        return { data: [], totalCount: 0 };
      }

      // Prefer already-loaded Redux roles so the listing does not refetch special_users on every search.
      const storeRoles = authState.roles ?? [];
      const specialRoles =
        storeRoles.length > 0
          ? storeRoles
          : await this.getUserSpecialRoles(authUserId);
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
              .eq('user_id', authUserId)
              .eq('is_deleted', false),
            supabase
              .from(TABLES.ProgramUser)
              .select('program_id')
              .eq('user', authUserId)
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
      const nativeSortColumn = CAMPAIGN_LISTING_NATIVE_SORT_COLUMNS[orderBy];
      const shouldUseRelationSort = isCampaignListingRelationSort(orderBy);
      const allowedCampaignIds = isFieldCoordinator
        ? await this.getFieldCoordinatorAccessibleCampaignIds({
            accessibleSchoolIds: Array.from(accessibleSchoolIds),
            accessibleProgramIds: Array.from(accessibleProgramIds),
            directProgramIds: Array.from(fieldCoordinatorProgramIds),
          })
        : null;

      if (
        isFieldCoordinator &&
        (!allowedCampaignIds || allowedCampaignIds.length === 0)
      ) {
        return { data: [], totalCount: 0 };
      }

      const shouldUseDatabasePagination = Boolean(nativeSortColumn);
      const searchRelationSelect =
        normalizedSearchTerm.length > 0
          ? `,
        manager_search:user!campaign_manager_id_fkey(),
        program_search:program!campaign_program_id_fkey()`
          : '';
      const campaignListingSelect = `id, name, objective, start_date, end_date, frequency,
        campaign_status, manager_id, program_id, target_audience_id,
        created_at, updated_at, is_deleted, target_type, target_value, rewards,
        manager:user!campaign_manager_id_fkey(id, name),
        program:program!campaign_program_id_fkey(id, name)${searchRelationSelect},
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

      if (allowedCampaignIds) {
        campaignQuery.in('id', allowedCampaignIds);
      }

      if (normalizedSearchTerm.length > 0) {
        const escapedSearchTerm = normalizedSearchTerm
          .replace(/\\/g, '\\\\')
          .replace(/,/g, '\\,')
          .replace(/\(/g, '\\(')
          .replace(/\)/g, '\\)');
        campaignQuery
          .ilike('manager_search.name', `%${normalizedSearchTerm}%`)
          .ilike('program_search.name', `%${normalizedSearchTerm}%`);
        campaignQuery.or(
          [
            `name.ilike.%${escapedSearchTerm}%`,
            'manager_search.not.is.null',
            'program_search.not.is.null',
          ].join(','),
        );
      }

      if (shouldUseDatabasePagination) {
        if (nativeSortColumn) {
          campaignQuery.order(nativeSortColumn, {
            ascending: orderDir === 'asc',
          });
        }

        campaignQuery
          .order('id', { ascending: orderDir === 'asc' })
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

      const mappedCampaigns = (data ??
        []) as unknown as CampaignListingQueryRow[];

      const visibleCampaigns = mappedCampaigns;
      const currentPage = Math.max(page, 1);
      const currentPageSize = Math.max(pageSize, 1);
      const from = (currentPage - 1) * currentPageSize;

      let listingItems: CampaignListingItem[] = [];
      let totalCount = 0;
      const shouldIncludeMetrics =
        includeMetrics ||
        orderBy === CAMPAIGN_LISTING_ORDER_BY.AVG_WEEKLY_ACTIVE_USERS ||
        orderBy ===
          CAMPAIGN_LISTING_ORDER_BY.AVG_WEEKLY_ENGAGEMENT_TIME_MINUTES;
      const campaignMetricsMap = shouldIncludeMetrics
        ? await this.getCampaignListingMetrics(
            visibleCampaigns.map((campaign) => campaign.id),
          )
        : new Map<string, CampaignDashboardMetric>();

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

    try {
      await this.deleteCampaignAssignments(campaignId);
    } catch (assignmentCleanupError) {
      logger.error(
        'Campaign cancelled but campaign assignments could not be deleted:',
        assignmentCleanupError,
      );
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

    const grades = await this.getCampaignAudienceOptionGradesForSchools(
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

    const { data, error } = await this.supabase.rpc(
      'get_campaign_audience_summary',
      {
        p_school_ids: schoolIds,
        p_grade_ids: gradeIds,
      },
    );

    if (error) {
      logger.error('Error fetching campaign audience summary:', error);
      return { totalStudents: 0, grades: [] };
    }

    return data ?? { totalStudents: 0, grades: [] };
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
      frequency: payload.frequency,
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
        uniqueSubjects: [],
        total: 0,
      };
    }

    type CampaignAssignmentRpcRow = {
      assignment_id: string;
      assignment_date: string;
      grade_id: string;
      grade_name: string;
      subject_id: string;
      subject_name: string;
      lesson_id: string;
      lesson_name: string;
      unique_subjects?: Array<{
        subject_id: string;
        subject_name: string;
        grade_ids?: string[] | null;
      }> | null;
      total_count: string | number;
    };

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

    const rpcRows = data as CampaignAssignmentRpcRow[] | null | undefined;
    const firstRow = rpcRows?.[0];
    const uniqueSubjects = Array.isArray(firstRow?.unique_subjects)
      ? firstRow.unique_subjects.map((subject) => ({
          id: String(subject.subject_id),
          name: String(subject.subject_name),
          gradeIds: Array.isArray(subject.grade_ids)
            ? subject.grade_ids.map(String)
            : [],
        }))
      : [];

    return {
      assignments:
        rpcRows?.map((row) => ({
          assignmentId: row.assignment_id,
          assignmentDate: row.assignment_date,

          gradeId: row.grade_id,
          gradeName: row.grade_name,

          subjectId: row.subject_id,
          subjectName: row.subject_name,

          lessonId: row.lesson_id,
          lessonName: row.lesson_name,
        })) ?? [],
      uniqueSubjects,
      total: rpcRows?.length ? Number(firstRow?.total_count ?? 0) : 0,
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

  private mapCampaignSavedAudienceGroup(
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

  async getCampaignGradesForSchools(
    schoolIds: string[],
  ): Promise<CampaignOption[]> {
    return await this.fetchDistinctClassGradesForSchools(schoolIds);
  }

  private async insertCampaignTargetAudience(
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

  private async deleteCampaignTargetAudience(targetAudienceId: string) {
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

  async getCampaignParentsInGroupBySchoolIds(
    schoolIds: string[],
  ): Promise<number> {
    if (!this.supabase || schoolIds.length === 0) return 0;

    const uniqueSchoolIds = Array.from(new Set(schoolIds));
    const { data, error } = await this.supabase
      .from(TABLES.SchoolMetrics)
      .select('school_id, parents_in_group')
      .in('school_id', uniqueSchoolIds)
      .eq('metric_window', CAMPAIGN_REACH_METRIC_WINDOW)
      .eq('is_deleted', false);

    if (error) {
      logger.error(
        'Error fetching campaign parents-in-group school metrics:',
        error,
      );
      throw error;
    }

    return (data ?? []).reduce(
      (total, row) => total + (row.parents_in_group ?? 0),
      0,
    );
  }

  private async getFieldCoordinatorAccessibleCampaignIds({
    accessibleSchoolIds,
    accessibleProgramIds,
    directProgramIds,
  }: {
    accessibleSchoolIds: string[];
    accessibleProgramIds: string[];
    directProgramIds: string[];
  }): Promise<string[]> {
    if (!this.supabase) {
      return [];
    }

    const allowedCampaignIds = new Set<string>();

    if (accessibleSchoolIds.length > 0) {
      const { data: audienceAccessRows, error: audienceAccessError } =
        await this.supabase
          .from('campaign_target_audience_school')
          .select('target_audience_id')
          .in('school_id', accessibleSchoolIds)
          .eq('is_deleted', false);

      if (audienceAccessError) {
        logger.error(
          'Error fetching field coordinator audience access rows:',
          audienceAccessError,
        );
        return [];
      }

      const audienceIds = Array.from(
        new Set(
          ((audienceAccessRows ?? []) as CampaignAudienceAccessRow[])
            .map((row) => row.target_audience_id)
            .filter((id): id is string => !!id),
        ),
      );

      if (audienceIds.length > 0) {
        const { data: schoolCampaignRows, error: schoolCampaignError } =
          await this.supabase
            .from('campaign')
            .select('id')
            .eq('is_deleted', false)
            .in('target_audience_id', audienceIds);

        if (schoolCampaignError) {
          logger.error(
            'Error fetching field coordinator school-access campaign ids:',
            schoolCampaignError,
          );
          return [];
        }

        ((schoolCampaignRows ?? []) as Array<{ id?: string | null }>).forEach(
          (row) => {
            if (row.id) {
              allowedCampaignIds.add(row.id);
            }
          },
        );
      }
    }

    if (accessibleProgramIds.length > 0) {
      const { data: allSchoolsCampaignRows, error: allSchoolsCampaignError } =
        await this.supabase
          .from('campaign')
          .select(
            'id, target_audience:target_audience_id!inner(is_all_schools)',
          )
          .eq('is_deleted', false)
          .in('program_id', accessibleProgramIds)
          .eq('target_audience.is_all_schools', true);

      if (allSchoolsCampaignError) {
        logger.error(
          'Error fetching field coordinator all-schools campaign ids:',
          allSchoolsCampaignError,
        );
        return [];
      }

      ((allSchoolsCampaignRows ?? []) as Array<{ id?: string | null }>).forEach(
        (row) => {
          if (row.id) {
            allowedCampaignIds.add(row.id);
          }
        },
      );
    }

    if (directProgramIds.length > 0) {
      const { data: directProgramCampaignRows, error: directProgramError } =
        await this.supabase
          .from('campaign')
          .select('id')
          .eq('is_deleted', false)
          .in('program_id', directProgramIds);

      if (directProgramError) {
        logger.error(
          'Error fetching field coordinator direct-program campaign ids:',
          directProgramError,
        );
        return [];
      }

      (
        (directProgramCampaignRows ?? []) as Array<{ id?: string | null }>
      ).forEach((row) => {
        if (row.id) {
          allowedCampaignIds.add(row.id);
        }
      });
    }

    return Array.from(allowedCampaignIds);
  }

  async getCampaignListingMetrics(
    campaignIds: string[],
  ): Promise<Map<string, CampaignDashboardMetric>> {
    if (!this.supabase || campaignIds.length === 0) {
      return new Map();
    }

    try {
      const { data: metricsData, error: metricsError } =
        await this.supabase.rpc('get_campaign_dashboard_metrics', {
          p_campaign_ids: campaignIds,
        });

      if (metricsError) {
        logger.error(
          'Error fetching campaign dashboard metrics for listing:',
          metricsError,
        );
        return new Map();
      }

      return new Map(
        ((metricsData ?? []) as CampaignDashboardMetric[]).map((metric) => [
          metric.campaign_id,
          metric,
        ]),
      );
    } catch (metricsError) {
      logger.error(
        'Unexpected error fetching campaign dashboard metrics for listing:',
        metricsError,
      );
      return new Map();
    }
  }

  async deleteCampaignAssignments(campaignId: string): Promise<void> {
    if (!this.supabase || !campaignId) {
      return;
    }

    const nowIso = new Date().toISOString();
    const { error } = await this.supabase
      .from(TABLES.Assignment)
      .update({
        is_deleted: true,
        ends_at: nowIso,
        updated_at: nowIso,
      })
      .eq('campaign_id', campaignId)
      .eq('is_deleted', false)
      .gte('starts_at', nowIso);

    if (error) {
      logger.error('Error deleting campaign assignments:', error);
      throw error;
    }
  }

  async getCampaignRewardsReport(
    campaignId: string,
    params: CampaignRewardsReportParams = {},
  ): Promise<CampaignRewardsReportResponse> {
    if (!this.supabase || !campaignId) {
      return { rows: [], total: 0 };
    }

    const sortColumnByKey: Record<
      NonNullable<CampaignRewardsReportParams['orderBy']>,
      string
    > = {
      studentName: 'student_name',
      school: 'school_name',
      className: 'class_name',
      completionPercent: 'completion_percentage',
      rewardRank: 'rank',
      rewardLabel: 'rank',
    };
    const orderBy = params.orderBy ?? 'completionPercent';
    const sortColumn = sortColumnByKey[orderBy] ?? 'completion_percentage';
    const ascending = params.order === 'asc';

    let query = this.supabase
      .from(TABLES.CampaignStudentPerformance)
      .select('*', { count: 'exact' })
      .eq('campaign_id', campaignId)
      .eq('is_deleted', false);

    if (params.schoolName && params.schoolName !== 'All Schools') {
      query = query.eq('school_name', params.schoolName);
    }

    if (params.className && params.className !== 'All Classes') {
      query = query.eq('class_name', params.className);
    }

    const { data, error, count } = await query
      .order(sortColumn, { ascending, nullsFirst: false })
      .order('rank', { ascending: true, nullsFirst: false })
      .order('completion_percentage', { ascending: false })
      .order('student_name', { ascending: true });

    if (error) {
      logger.error('Error fetching campaign rewards report:', {
        campaignId,
        params,
        error,
      });
      return { rows: [], total: 0 };
    }

    return {
      rows: data ?? [],
      total: count ?? data?.length ?? 0,
    };
  }

  async getCampaignWhatsappLabelData(
    campaignId: string,
  ): Promise<CampaignWhatsappLabelData> {
    if (!this.supabase || !campaignId.trim()) {
      return { chats: [], total: 0, label: '', providerErrors: 0 };
    }
    const context = await this.getCampaignWhatsappReportContext(
      campaignId.trim(),
    );
    return (
      await fetchCampaignProviderData(campaignId.trim(), context.groupTargets)
    ).labelData;
  }

  async getCampaignMessageReport(
    campaignId: string,
    params: CampaignMessageReportParams = {},
  ): Promise<CampaignMessageReportResponse> {
    if (!this.supabase || !campaignId.trim()) {
      throw new Error('A campaign ID is required for the message report.');
    }
    if (params.fromDate && params.toDate && params.fromDate > params.toDate) {
      throw new Error('From Date cannot be later than To Date.');
    }

    const normalizedCampaignId = campaignId.trim();
    const context =
      await this.getCampaignWhatsappReportContext(normalizedCampaignId);
    const [providerData, metricsResult, messagingResult] = await Promise.all([
      fetchCampaignProviderData(normalizedCampaignId, context.groupTargets),
      this.supabase
        .from(TABLES.SchoolMetrics)
        .select('parents_in_group')
        .in('school_id', context.schoolIds)
        .eq('metric_window', CAMPAIGN_REACH_METRIC_WINDOW)
        .eq('is_deleted', false),
      this.supabase
        .from('campaign_messaging')
        .select('id, message, message_time, poll, poll_time')
        .eq('campaign_id', normalizedCampaignId)
        .eq('is_deleted', false),
    ]);

    if (metricsResult.error) throw metricsResult.error;
    if (messagingResult.error) throw messagingResult.error;

    const whatsappGroups = context.groupTargets.length;
    const totalMembersReachable = (metricsResult.data ?? []).reduce(
      (total, row) => total + (row.parents_in_group ?? 0),
      0,
    );
    const messagingRows: CampaignMessagingProviderSource[] = (
      messagingResult.data ?? []
    ).map((row) => ({
      id: row.id,
      message: row.message,
      messageTime: row.message_time,
      poll: row.poll,
      pollTime: row.poll_time,
    }));

    return buildCampaignMessageReport(
      providerData,
      messagingRows,
      whatsappGroups,
      totalMembersReachable,
      params,
    );
  }

  public async getCampaignWhatsappReportContext(campaignId: string): Promise<{
    groupTargets: CampaignWhatsappGroupTarget[];
    schoolIds: string[];
  }> {
    if (!this.supabase) return { groupTargets: [], schoolIds: [] };
    const { data: campaign, error: campaignError } = await this.supabase
      .from('campaign')
      .select('program_id, target_audience_id')
      .eq('id', campaignId)
      .eq('is_deleted', false)
      .maybeSingle();
    if (campaignError) throw campaignError;
    if (!campaign?.program_id || !campaign.target_audience_id) {
      throw new Error('Campaign audience is not configured.');
    }

    const { data: audience, error: audienceError } = await this.supabase
      .from('campaign_target_audience')
      .select('is_all_schools, is_all_grades')
      .eq('id', campaign.target_audience_id)
      .eq('is_deleted', false)
      .maybeSingle();
    if (audienceError) throw audienceError;
    if (!audience) throw new Error('Campaign audience is not configured.');
    const isAllSchools = audience.is_all_schools ?? true;
    const isAllGrades = audience.is_all_grades ?? false;

    let selectedSchoolIds: string[] = [];
    if (!isAllSchools) {
      const { data, error } = await this.supabase
        .from('campaign_target_audience_school')
        .select('school_id')
        .eq('target_audience_id', campaign.target_audience_id)
        .eq('is_deleted', false);
      if (error) throw error;
      selectedSchoolIds = (data ?? []).flatMap(({ school_id }) =>
        school_id ? [school_id] : [],
      );
    }

    let schoolsQuery = this.supabase
      .from('school')
      .select('id, whatsapp_bot_number')
      .eq('program_id', campaign.program_id)
      .eq('is_deleted', false);
    if (!isAllSchools) {
      if (selectedSchoolIds.length === 0) {
        return { groupTargets: [], schoolIds: [] };
      }
      schoolsQuery = schoolsQuery.in('id', selectedSchoolIds);
    }
    const { data: schools, error: schoolsError } = await schoolsQuery;
    if (schoolsError) throw schoolsError;

    const schoolIds = (schools ?? []).map(({ id }) => id);
    if (schoolIds.length === 0) return { groupTargets: [], schoolIds: [] };

    let selectedGradeIds: string[] = [];
    if (!isAllGrades) {
      const { data, error } = await this.supabase
        .from('campaign_target_audience_grade')
        .select('grade_id')
        .eq('target_audience_id', campaign.target_audience_id)
        .eq('is_deleted', false);
      if (error) throw error;
      selectedGradeIds = (data ?? []).flatMap(({ grade_id }) =>
        grade_id ? [grade_id] : [],
      );
      if (selectedGradeIds.length === 0) {
        return { groupTargets: [], schoolIds };
      }
    }

    let classesQuery = this.supabase
      .from('class')
      .select('group_id, name, school_id')
      .in('school_id', schoolIds)
      .eq('is_deleted', false)
      .or('status.is.null,status.neq.migrated')
      .not('group_id', 'is', null);
    if (!isAllGrades) {
      classesQuery = classesQuery.in('grade_id', selectedGradeIds);
    }
    const { data: classes, error: classesError } = await classesQuery;
    if (classesError) throw classesError;

    const botNumberBySchoolId = new Map(
      (schools ?? []).flatMap(({ id, whatsapp_bot_number }) => {
        const botNumber = whatsapp_bot_number?.trim();
        return botNumber ? [[id, botNumber] as const] : [];
      }),
    );
    const groupTargets = Array.from(
      new Map(
        (classes ?? []).flatMap(({ group_id, name, school_id }) => {
          const groupId = group_id?.trim();
          const botNumber = botNumberBySchoolId.get(school_id);
          return groupId && botNumber
            ? [[groupId, { botNumber, groupId, name }] as const]
            : [];
        }),
      ).values(),
    );

    return {
      groupTargets,
      schoolIds,
    };
  }

  async getCampaignAssignmentsReport(
    campaignId: string,
    params: CampaignAssignmentsReportParams = {},
  ): Promise<CampaignAssignmentsReportResponse> {
    const emptyResponse: CampaignAssignmentsReportResponse = {
      summary: {
        totalAssignments: 0,
        assignedStudents: params.totalStudents ?? 0,
        activeStudents: 0,
        averageAssignmentsCompletion: 0,
      },
      rows: [],
    };

    if (!this.supabase || !campaignId) {
      return emptyResponse;
    }

    try {
      const { data, error } = await this.supabase.rpc(
        'get_campaign_assignments_report',
        {
          p_campaign_id: campaignId,
          p_total_students: params.totalStudents ?? 0,
        },
      );

      if (error) {
        logger.error('Error fetching campaign assignments report rpc:', {
          campaignId,
          params,
          error,
        });
        return emptyResponse;
      }

      const payload =
        data as Database['public']['Functions']['get_campaign_assignments_report']['Returns'];

      return {
        summary: {
          totalAssignments: payload?.summary?.totalAssignments ?? 0,
          assignedStudents:
            payload?.summary?.assignedStudents ?? params.totalStudents ?? 0,
          activeStudents: payload?.summary?.activeStudents ?? 0,
          averageAssignmentsCompletion:
            payload?.summary?.averageAssignmentsCompletion ?? 0,
        },
        rows: payload?.rows ?? [],
      };
    } catch (error) {
      logger.error('Exception fetching campaign assignments report rpc:', {
        campaignId,
        params,
        error,
      });
      return emptyResponse;
    }
  }

  private async fetchDistinctClassGradesForSchools(
    schoolIds: string[],
  ): Promise<{ id: string; name: string }[]> {
    if (!this.supabase || schoolIds.length === 0) return [];

    const { data: gradeRows, error: gradeError } = await this.supabase
      .from('grade')
      .select('id, name, sort_index, class!inner()')
      .in('class.school_id', schoolIds)
      .eq('class.is_deleted', false)
      .eq('is_deleted', false);

    if (gradeError) {
      logger.error('Error fetching school grades for campaign:', gradeError);
    }

    return ((gradeRows ?? []) as CampaignGradeRow[])
      .filter((grade) => grade.id && grade.name)
      .sort(
        (a, b) =>
          Number(a.sort_index ?? 9999) - Number(b.sort_index ?? 9999) ||
          String(a.name).localeCompare(String(b.name)),
      )
      .map((grade) => ({
        id: String(grade.id),
        name: String(grade.name),
      }));
  }

  private async getCampaignAudienceOptionGradesForSchools(
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
}
