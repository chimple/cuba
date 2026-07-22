import { ApiHandlerPrograms } from './ApiHandler.programs';
import type {
  CampaignMessagingQueryParams,
  CampaignMessagingResponse,
  UpdateCampaignMessagingRowPayload,
  CampaignOption,
  CampaignSavedAudienceGroup,
  CampaignSetupOptions,
  CampaignAudienceOptions,
  CampaignAudienceSummaryParams,
  CampaignAudienceSummary,
  CampaignAudiencePayload,
  CreateCampaignSetupPayload,
  CreateCampaignSetupResult,
  LaunchCampaignPayload,
  CampaignAssignmentOptionsParams,
  CampaignAssignmentOptions,
  CampaignListingItem,
  CampaignDashboardMetric,
  CampaignCancellationDetails,
  CampaignListingParams,
  CampaignAssignmentFilters,
  CampaignAssignmentsResponse,
  CampaignAssignmentsReportParams,
  CampaignAssignmentsReportResponse,
  CampaignRewardsReportParams,
  CampaignRewardsReportResponse,
  CampaignWhatsappLabelData,
  CampaignMessageReportParams,
  CampaignMessageReportResponse,
} from '../ServiceApi';
import { PaginatedResponse } from '../../../interface/modelInterfaces';

export class ApiHandlerCampaigns extends ApiHandlerPrograms {
  async getCampaignSetupOptions(): Promise<CampaignSetupOptions> {
    return await this.s.getCampaignSetupOptions();
  }

  async getCampaignAudienceOptions(
    programId: string,
  ): Promise<CampaignAudienceOptions> {
    return await this.s.getCampaignAudienceOptions(programId);
  }

  async getCampaignGradesForSchools(
    schoolIds: string[],
  ): Promise<CampaignOption[]> {
    return await this.s.getCampaignGradesForSchools(schoolIds);
  }

  async getCampaignAudienceSummary(
    params: CampaignAudienceSummaryParams,
  ): Promise<CampaignAudienceSummary> {
    return await this.s.getCampaignAudienceSummary(params);
  }

  async createCampaignAudienceGroup(
    payload: CampaignAudiencePayload,
  ): Promise<CampaignSavedAudienceGroup> {
    return await this.s.createCampaignAudienceGroup(payload);
  }

  async createCampaignSetup(
    payload: CreateCampaignSetupPayload,
  ): Promise<CreateCampaignSetupResult> {
    return await this.s.createCampaignSetup(payload);
  }

  async launchCampaign(payload: LaunchCampaignPayload): Promise<void> {
    return await this.s.launchCampaign(payload);
  }

  async getCampaignAssignmentOptions(
    params: CampaignAssignmentOptionsParams,
  ): Promise<CampaignAssignmentOptions> {
    return await this.s.getCampaignAssignmentOptions(params);
  }

  async getCampaignListing(
    params: CampaignListingParams,
  ): Promise<PaginatedResponse<CampaignListingItem>> {
    return await this.s.getCampaignListing(params);
  }

  async getCampaignListingMetrics(
    campaignIds: string[],
  ): Promise<Map<string, CampaignDashboardMetric>> {
    return await this.s.getCampaignListingMetrics(campaignIds);
  }

  async cancelCampaign(campaignId: string, reason: string): Promise<void> {
    return await this.s.cancelCampaign(campaignId, reason);
  }

  async deleteCampaignAssignments(campaignId: string): Promise<void> {
    return await this.s.deleteCampaignAssignments(campaignId);
  }

  async getCampaignCancellationDetails(
    campaignId: string,
  ): Promise<CampaignCancellationDetails | null> {
    return await this.s.getCampaignCancellationDetails(campaignId);
  }

  async getCampaignAssignments(
    campaignId: string,
    filters: CampaignAssignmentFilters,
  ): Promise<CampaignAssignmentsResponse> {
    return await this.s.getCampaignAssignments(campaignId, filters);
  }

  async getCampaignAssignmentsReport(
    campaignId: string,
    params?: CampaignAssignmentsReportParams,
  ): Promise<CampaignAssignmentsReportResponse> {
    return await this.s.getCampaignAssignmentsReport(campaignId, params);
  }

  async getCampaignRewardsReport(
    campaignId: string,
    params?: CampaignRewardsReportParams,
  ): Promise<CampaignRewardsReportResponse> {
    return await this.s.getCampaignRewardsReport(campaignId, params);
  }

  async getCampaignWhatsappLabelData(
    campaignId: string,
  ): Promise<CampaignWhatsappLabelData> {
    return await this.s.getCampaignWhatsappLabelData(campaignId);
  }

  async getCampaignMessageReport(
    campaignId: string,
    params?: CampaignMessageReportParams,
  ): Promise<CampaignMessageReportResponse> {
    return await this.s.getCampaignMessageReport(campaignId, params);
  }

  async getCampaignSubjectsByCampaignId(
    campaignId: string,
  ): Promise<CampaignOption[]> {
    return await this.s.getCampaignSubjectsByCampaignId(campaignId);
  }

  async getCampaignParentsInGroupBySchoolIds(
    schoolIds: string[],
  ): Promise<number> {
    if (!this.s.getCampaignParentsInGroupBySchoolIds) {
      throw new Error(
        'Campaign parents-in-group metrics lookup is not implemented in current API service.',
      );
    }
    return await this.s.getCampaignParentsInGroupBySchoolIds(schoolIds);
  }

  async getCampaignMessaging(
    campaignId: string,
    params?: CampaignMessagingQueryParams,
  ): Promise<CampaignMessagingResponse> {
    return await this.s.getCampaignMessaging(campaignId, params);
  }

  async updateCampaignMessaging(
    rows: UpdateCampaignMessagingRowPayload[],
  ): Promise<boolean> {
    return await this.s.updateCampaignMessaging(rows);
  }
}
