import { PaginatedResponse } from '../../../interface/modelInterfaces';
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
  CampaignSchoolPerformanceReportParams,
  CampaignSchoolPerformanceReportResponse,
  CampaignRewardsReportParams,
  CampaignRewardsReportResponse,
  CampaignWhatsappLabelData,
  CampaignMessageReportParams,
  CampaignMessageReportResponse,
} from './ServiceApi.types';

export interface ServiceApiCampaigns {
  getCampaignSetupOptions(): Promise<CampaignSetupOptions>;

  getCampaignAudienceOptions(
    programId: string,
  ): Promise<CampaignAudienceOptions>;

  getCampaignGradesForSchools(schoolIds: string[]): Promise<CampaignOption[]>;

  getCampaignAudienceSummary(
    params: CampaignAudienceSummaryParams,
  ): Promise<CampaignAudienceSummary>;

  createCampaignAudienceGroup(
    payload: CampaignAudiencePayload,
  ): Promise<CampaignSavedAudienceGroup>;

  createCampaignSetup(
    payload: CreateCampaignSetupPayload,
  ): Promise<CreateCampaignSetupResult>;

  launchCampaign(payload: LaunchCampaignPayload): Promise<void>;

  getCampaignAssignmentOptions(
    params: CampaignAssignmentOptionsParams,
  ): Promise<CampaignAssignmentOptions>;

  getCampaignListing(
    params: CampaignListingParams,
  ): Promise<PaginatedResponse<CampaignListingItem>>;

  getCampaignListingMetrics(
    campaignIds: string[],
  ): Promise<Map<string, CampaignDashboardMetric>>;

  cancelCampaign(campaignId: string, reason: string): Promise<void>;

  deleteCampaignAssignments(campaignId: string): Promise<void>;

  getCampaignCancellationDetails(
    campaignId: string,
  ): Promise<CampaignCancellationDetails | null>;

  getCampaignAssignments(
    campaignId: string,
    filters: CampaignAssignmentFilters,
  ): Promise<CampaignAssignmentsResponse>;

  getCampaignAssignmentsReport(
    campaignId: string,
    params?: CampaignAssignmentsReportParams,
  ): Promise<CampaignAssignmentsReportResponse>;

  /**
   * Returns the school-level metrics already computed for a campaign window.
   * The client derives presentation-only percentages from the raw values.
   */
  getCampaignSchoolPerformanceReport(
    campaignId: string,
    params?: CampaignSchoolPerformanceReportParams,
  ): Promise<CampaignSchoolPerformanceReportResponse>;

  getCampaignRewardsReport(
    campaignId: string,
    params?: CampaignRewardsReportParams,
  ): Promise<CampaignRewardsReportResponse>;

  getCampaignWhatsappLabelData(
    campaignId: string,
  ): Promise<CampaignWhatsappLabelData>;

  getCampaignMessageReport(
    campaignId: string,
    params?: CampaignMessageReportParams,
  ): Promise<CampaignMessageReportResponse>;

  getCampaignSubjectsByCampaignId(
    campaignId: string,
  ): Promise<CampaignOption[]>;

  getCampaignParentsInGroupBySchoolIds?: (
    schoolIds: string[],
  ) => Promise<number>;

  getCampaignMessaging(
    campaignId: string,
    params?: CampaignMessagingQueryParams,
  ): Promise<CampaignMessagingResponse>;

  updateCampaignMessaging(
    rows: UpdateCampaignMessagingRowPayload[],
  ): Promise<boolean>;
}
