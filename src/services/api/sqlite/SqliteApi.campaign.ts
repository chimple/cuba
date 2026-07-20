import {
  EnumType,
  FilteredSchoolsForSchoolListingOps,
  MUTATE_TYPES,
  SchoolRoleMap,
  TABLES,
  TabType,
  TableTypes,
} from '../../../common/constants';
import { PaginatedResponse } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
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
  CampaignDashboardMetric,
  CampaignListingItem,
  CampaignListingParams,
  CampaignMessagingQueryParams,
  CampaignMessagingResponse,
  CampaignOption,
  CampaignRewardsReportParams,
  CampaignRewardsReportResponse,
  CampaignSavedAudienceGroup,
  CampaignSetupOptions,
  ClassMetricsForClassListingRow,
  CreateCampaignSetupPayload,
  CreateCampaignSetupResult,
  GetSchoolsWithProgramAccessParams,
  LaunchCampaignPayload,
  SchoolProgramAccessResponse,
  UpdateCampaignMessagingRowPayload,
} from '../ServiceApi';

import { SqliteApiAssignment } from './SqliteApi.assignment';
export interface SqliteApiCampaign {
  [key: string]: any;
}
export class SqliteApiCampaign extends SqliteApiAssignment {
  async getProgramFilterOptions(): Promise<Record<string, string[]>> {
    return await this._serverApi.getProgramFilterOptions();
  }
  async getPrograms(params: {
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
  }) {
    return await this._serverApi.getPrograms(params);
  }

  async insertProgram(payload: any): Promise<boolean | null> {
    return await this._serverApi.insertProgram(payload);
  }

  async getProgramManagers(): Promise<{ name: string; id: string }[]> {
    return await this._serverApi.getProgramManagers();
  }

  async getCampaignSetupOptions(): Promise<CampaignSetupOptions> {
    return await this._serverApi.getCampaignSetupOptions();
  }

  async getCampaignAudienceOptions(
    programId: string,
  ): Promise<CampaignAudienceOptions> {
    return await this._serverApi.getCampaignAudienceOptions(programId);
  }

  async getCampaignAudienceSummary(
    params: CampaignAudienceSummaryParams,
  ): Promise<CampaignAudienceSummary> {
    return await this._serverApi.getCampaignAudienceSummary(params);
  }

  async createCampaignAudienceGroup(
    payload: CampaignAudiencePayload,
  ): Promise<CampaignSavedAudienceGroup> {
    return await this._serverApi.createCampaignAudienceGroup(payload);
  }

  async createCampaignSetup(
    payload: CreateCampaignSetupPayload,
  ): Promise<CreateCampaignSetupResult> {
    return await this._serverApi.createCampaignSetup(payload);
  }

  async launchCampaign(payload: LaunchCampaignPayload): Promise<void> {
    return await this._serverApi.launchCampaign(payload);
  }

  async getCampaignAssignmentOptions(
    params: CampaignAssignmentOptionsParams,
  ): Promise<CampaignAssignmentOptions> {
    return await this._serverApi.getCampaignAssignmentOptions(params);
  }

  async getCampaignListing(
    params: CampaignListingParams,
  ): Promise<PaginatedResponse<CampaignListingItem>> {
    return await this._serverApi.getCampaignListing(params);
  }

  async cancelCampaign(campaignId: string, reason: string): Promise<void> {
    return await this._serverApi.cancelCampaign(campaignId, reason);
  }

  async getCampaignCancellationDetails(
    campaignId: string,
  ): Promise<CampaignCancellationDetails | null> {
    return await this._serverApi.getCampaignCancellationDetails(campaignId);
  }

  async getCampaignAssignments(
    campaignId: string,
    filters: CampaignAssignmentFilters,
  ): Promise<CampaignAssignmentsResponse> {
    return await this._serverApi.getCampaignAssignments(campaignId, filters);
  }

  async getCampaignSubjectsByCampaignId(
    campaignId: string,
  ): Promise<CampaignOption[]> {
    return await this._serverApi.getCampaignSubjectsByCampaignId(campaignId);
  }

  async getUniqueGeoData(): Promise<{
    Country: string[];
    State: string[];
    Block: string[];
    Cluster: string[];
    District: string[];
  }> {
    return await this._serverApi.getUniqueGeoData();
  }

  async getProgramForSchool(
    schoolId: string,
  ): Promise<TableTypes<'program'> | undefined> {
    const prog = await this._serverApi.getProgramForSchool(schoolId);
    return prog;
  }

  async getProgramManagersForSchool(
    schoolId: string,
  ): Promise<TableTypes<'user'>[] | undefined> {
    const users = await this._serverApi.getProgramManagersForSchool(schoolId);
    return users;
  }
  async updateStudentStars(
    studentId: string,
    totalStars: number,
  ): Promise<void> {
    if (!studentId) return;
    try {
      await this.executeQuery(
        `UPDATE ${TABLES.User} SET stars = ? WHERE id = ?;`,
        [totalStars, studentId],
      );

      this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, {
        id: studentId,
        stars: totalStars,
      });
    } catch (error) {
      logger.error('Error setting stars for student:', error);
    }
  }
  async getChapterIdbyQrLink(
    link: string,
  ): Promise<TableTypes<'chapter_links'> | undefined> {
    await this.ensureInitialized();
    if (!link) return;
    try {
      const res = await this._db?.query(
        `SELECT * FROM ${TABLES.ChapterLinks} WHERE link = ? AND is_deleted = 0 LIMIT 1;`,
        [link],
      );

      if (!res || !res.values || res.values.length < 1) return;
      return res.values[0];
    } catch (error) {
      logger.error('Error fetching chapter by QR link:', error);
      return;
    }
  }
  async getSchoolsForAdmin(
    limit: number = 10,
    offset: number = 0,
  ): Promise<TableTypes<'school'>[]> {
    return await this._serverApi.getSchoolsForAdmin(limit, offset);
  }
  async getSchoolsByModel(
    model: EnumType<'program_model'>,
    limit: number = 10,
    offset: number = 0,
  ): Promise<TableTypes<'school'>[]> {
    return await this._serverApi.getSchoolsByModel(model, limit, offset);
  }
  async getTeachersForSchools(schoolIds: string[]): Promise<SchoolRoleMap[]> {
    return await this._serverApi.getTeachersForSchools(schoolIds);
  }
  async getStudentsForSchools(schoolIds: string[]): Promise<SchoolRoleMap[]> {
    return await this._serverApi.getStudentsForSchools(schoolIds);
  }
  async getProgramManagersForSchools(
    schoolIds: string[],
  ): Promise<SchoolRoleMap[]> {
    return await this._serverApi.getProgramManagersForSchools(schoolIds);
  }
  async getProgramData(programId: string): Promise<{
    programDetails: { id: string; label: string; value: string }[];
    locationDetails: { id: string; label: string; value: string }[];
    partnerDetails: { id: string; label: string; value: string }[];
    programManagers: {
      name: string;
      role: string;
      phone: string;
      email: string;
    }[];
  } | null> {
    return await this._serverApi.getProgramData(programId);
  }
  async getFieldCoordinatorsForSchools(
    schoolIds: string[],
  ): Promise<SchoolRoleMap[]> {
    return await this._serverApi.getFieldCoordinatorsForSchools(schoolIds);
  }

  async getSchoolFilterOptionsForSchoolListing(): Promise<
    Record<string, string[]>
  > {
    return await this._serverApi.getSchoolFilterOptionsForSchoolListing();
  }

  async getSchoolFilterOptionsForProgram(
    programId: string,
  ): Promise<Record<string, string[]>> {
    return await this._serverApi.getSchoolFilterOptionsForProgram(programId);
  }

  async getFilteredSchoolsForSchoolListing(params: {
    filters?: Record<string, string[]>;
    programId?: string;
    page?: number;
    page_size?: number;
    order_by?: string;
    order_dir?: 'asc' | 'desc';
    search?: string;
    date_range?: string;
    percentage_filters?: Record<string, 'low' | 'mid' | 'high'>;
    school_performance_filter?: string | null;
  }): Promise<{ data: FilteredSchoolsForSchoolListingOps[]; total: number }> {
    return await this._serverApi.getFilteredSchoolsForSchoolListing(params);
  }

  async getSchoolMetricsForSchoolListing(params: {
    filters?: Record<string, string[]>;
    programId?: string;
    page?: number;
    page_size?: number;
    order_by?: string;
    order_dir?: 'asc' | 'desc';
    search?: string;
    date_range?: string;
    percentage_filters?: Record<string, 'low' | 'mid' | 'high'>;
    school_performance_filter?: string | null;
  }): Promise<{ data: FilteredSchoolsForSchoolListingOps[]; total: number }> {
    return await this._serverApi.getSchoolMetricsForSchoolListing(params);
  }

  async getClassMetricsForClassListing(params: {
    schoolId: string;
    date_range?: string;
  }): Promise<ClassMetricsForClassListingRow[]> {
    return await this._serverApi.getClassMetricsForClassListing(params);
  }

  async getSchoolsWithProgramAccess(
    params: GetSchoolsWithProgramAccessParams,
  ): Promise<SchoolProgramAccessResponse> {
    return await this._serverApi.getSchoolsWithProgramAccess(params);
  }

  async createOrAddUserOps(payload: {
    name: string;
    email?: string;
    phone?: string;
    role: string;
  }): Promise<{
    success: boolean;
    user_id?: string;
    message?: string;
    error?: string;
  }> {
    return await this._serverApi.createOrAddUserOps(payload);
  }

  async getCampaignMessaging(
    campaignId: string,
    params?: CampaignMessagingQueryParams,
  ): Promise<CampaignMessagingResponse> {
    return await this._serverApi.getCampaignMessaging(campaignId, params);
  }

  async updateCampaignMessaging(
    rows: UpdateCampaignMessagingRowPayload[],
  ): Promise<boolean> {
    return await this._serverApi.updateCampaignMessaging(rows);
  }

  async getCampaignGradesForSchools(
    schoolIds: string[],
  ): Promise<CampaignOption[]> {
    return await this._serverApi.getCampaignGradesForSchools(schoolIds);
  }

  async getCampaignListingMetrics(
    campaignIds: string[],
  ): Promise<Map<string, CampaignDashboardMetric>> {
    return await this._serverApi.getCampaignListingMetrics(campaignIds);
  }

  async deleteCampaignAssignments(campaignId: string): Promise<void> {
    return await this._serverApi.deleteCampaignAssignments(campaignId);
  }

  async getCampaignRewardsReport(
    campaignId: string,
    params?: CampaignRewardsReportParams,
  ): Promise<CampaignRewardsReportResponse> {
    return await this._serverApi.getCampaignRewardsReport(campaignId, params);
  }
}
