import { TabType } from '../../../common/constants';
import { PaginatedResponse } from '../../../interface/modelInterfaces';
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
  CampaignSetupOptions,
  CreateCampaignSetupPayload,
  CreateCampaignSetupResult,
  LaunchCampaignPayload,
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

  async getCampaignWhatsappLabelData(
    campaignId: string,
  ): Promise<CampaignWhatsappLabelData> {
    return await this._serverApi.getCampaignWhatsappLabelData(campaignId);
  }

  async getCampaignMessageReport(
    campaignId: string,
    params?: CampaignMessageReportParams,
  ): Promise<CampaignMessageReportResponse> {
    return await this._serverApi.getCampaignMessageReport(campaignId, params);
  }

  async getCampaignAssignmentsReport(
    campaignId: string,
    params?: CampaignAssignmentsReportParams,
  ): Promise<CampaignAssignmentsReportResponse> {
    return await this._serverApi.getCampaignAssignmentsReport(
      campaignId,
      params,
    );
  }
}
