import { SupabaseApiCampaignReports } from './SupabaseApi.campaign.reports';
export { fetchCampaignProviderData } from './SupabaseApi.campaign.helpers';

export interface SupabaseApiCampaign {
  [key: string]: any;
}

export class SupabaseApiCampaign extends SupabaseApiCampaignReports {}
