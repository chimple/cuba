import { CAMPAIGN_STATUS, TABLES } from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import { store } from '../../../redux/store';
import logger from '../../../utility/logger';
import {
  CampaignCancellationDetails,
  CampaignDashboardMetric,
  CampaignListingItem,
  CampaignListingParams,
} from '../ServiceApi';
import {
  CAMPAIGN_LISTING_ORDER_BY,
  mapCampaignListingItem,
  sortCampaignListingItems,
} from '../campaignListingHelpers';
import {
  CAMPAIGN_LISTING_NATIVE_SORT_COLUMNS,
  getSingleRelationValue,
  isCampaignListingRelationSort,
  type CampaignAccessSchoolRow,
  type CampaignListingQueryRow,
} from './SupabaseApi.campaign.helpers';
import { SupabaseApiCampaignPrograms } from './SupabaseApi.campaign.programs';

export interface SupabaseApiCampaignListing {
  [key: string]: any;
}
export class SupabaseApiCampaignListing extends SupabaseApiCampaignPrograms {
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
}
