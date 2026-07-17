import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import CampaignAssignmentTab from '../../pages/CampaignAssignmentTab';
import { ServiceConfig } from '../../../services/ServiceConfig';
import logger from '../../../utility/logger';
import CampaignMessages from '../campaignMessages/CampaignMessages';
import './CampaignsOverview.css';
import CampaignRewardsReport from './CampaignRewardsReport';
import CampaignsOverviewHeaderBar from './CampaignsOverviewHeaderBar';
import {
  buildCampaignsOverviewViewModel,
  CAMPAIGN_LISTING_STATUS,
  CampaignsOverviewApiResponse,
  DEFAULT_CAMPAIGNS_OVERVIEW_BREADCRUMB,
  DEFAULT_CAMPAIGNS_OVERVIEW_TABS,
  DEFAULT_CAMPAIGNS_OVERVIEW_TITLE,
} from './CampaignsOverviewLogic';
import './CampaignsOverviewMobile.css';
import CampaignsOverviewWidgets from './CampaignsOverviewWidgets';

export interface CampaignsOverviewProps {
  title?: string;
  breadcrumb?: readonly string[];
  tabs?: readonly string[];
  activeTab?: string;
  campaignId?: string;
  campaignOverviewData?: CampaignsOverviewApiResponse;
  onBackClick?: () => void;
  onBreadcrumbClick?: (item: string, index: number) => void;
  onTabClick?: (tab: string) => void;
}

const CampaignsOverview: React.FC<CampaignsOverviewProps> = ({
  title = DEFAULT_CAMPAIGNS_OVERVIEW_TITLE,
  breadcrumb = DEFAULT_CAMPAIGNS_OVERVIEW_BREADCRUMB,
  tabs = DEFAULT_CAMPAIGNS_OVERVIEW_TABS,
  activeTab = DEFAULT_CAMPAIGNS_OVERVIEW_TABS[0],
  campaignId,
  campaignOverviewData,
  onBackClick,
  onBreadcrumbClick,
  onTabClick,
}) => {
  const history = useHistory();
  const [selectedTab, setSelectedTab] = useState(activeTab);
  const resolvedCampaignId = [
    campaignId,
    campaignOverviewData?.data?.campaignId,
    campaignOverviewData?.data?.dashboardMetrics?.campaign_id,
  ].find((id): id is string => typeof id === 'string' && id.trim().length > 0);
  const [resolvedCampaignOverviewData, setResolvedCampaignOverviewData] =
    useState(campaignOverviewData);
  const campaignViewModel = buildCampaignsOverviewViewModel(
    resolvedCampaignOverviewData,
  );

  useEffect(() => {
    document.body.classList.add('campaigns-overview-active');
    return () => {
      document.body.classList.remove('campaigns-overview-active');
    };
  }, []);

  useEffect(() => {
    setResolvedCampaignOverviewData(campaignOverviewData);
  }, [campaignOverviewData]);

  useEffect(() => {
    const loadCampaignCancellationDetails = async () => {
      if (
        !resolvedCampaignId ||
        !campaignOverviewData ||
        campaignOverviewData.data?.status !== CAMPAIGN_LISTING_STATUS.CANCELLED
      ) {
        return;
      }

      try {
        const cancellationData =
          await ServiceConfig.getI().apiHandler.getCampaignCancellationDetails(
            resolvedCampaignId,
          );

        setResolvedCampaignOverviewData((currentData) => {
          if (!currentData?.data) {
            return currentData;
          }

          return {
            ...currentData,
            data: {
              ...currentData.data,
              cancellationData,
            },
          };
        });
      } catch (error) {
        logger.error('Error loading campaign cancellation details:', error);
      }
    };

    void loadCampaignCancellationDetails();
  }, [campaignOverviewData, resolvedCampaignId]);

  const handleTabClick = (tab: string): void => {
    setSelectedTab(tab);
    onTabClick?.(tab);
  };

  const shouldShowOverviewWidgets =
    selectedTab === DEFAULT_CAMPAIGNS_OVERVIEW_TABS[0];
  const shouldShowAssignments =
    selectedTab === DEFAULT_CAMPAIGNS_OVERVIEW_TABS[1];
  const shouldShowMessages = selectedTab === tabs[2];
  const shouldShowReports = selectedTab === tabs[3];
  const handleBackClick = (): void => {
    if (onBackClick) {
      onBackClick();
      return;
    }
    history.goBack();
  };

  return (
    <main
      id="ops-campaigns-overview"
      className="ops-campaigns-overview"
      aria-labelledby="ops-campaigns-overview-title"
    >
      <CampaignsOverviewHeaderBar
        title={title}
        breadcrumb={
          resolvedCampaignOverviewData
            ? campaignViewModel.breadcrumb
            : breadcrumb
        }
        tabs={tabs}
        activeTab={selectedTab}
        onBackClick={handleBackClick}
        onBreadcrumbClick={onBreadcrumbClick}
        onTabClick={handleTabClick}
      />
      <div className="ops-campaigns-overview-content">
        {shouldShowOverviewWidgets && (
          <CampaignsOverviewWidgets
            campaignStatus={campaignViewModel.campaignStatus}
            summaryData={campaignViewModel.summaryData}
            performanceData={campaignViewModel.performanceData}
            cancellationDetails={campaignViewModel.cancellationDetails}
          />
        )}
        {shouldShowAssignments && resolvedCampaignId && (
          <CampaignAssignmentTab campaignId={resolvedCampaignId} />
        )}
        {shouldShowMessages && (
          <CampaignMessages
            campaignId={resolvedCampaignId}
            isCampaignCancelled={
              campaignOverviewData?.data?.status ===
              CAMPAIGN_LISTING_STATUS.CANCELLED
            }
            campaignStartDate={
              campaignOverviewData?.data?.campaign?.start_date ?? undefined
            }
            campaignEndDate={
              campaignOverviewData?.data?.campaign?.end_date ?? undefined
            }
            campaignFrequency={
              campaignOverviewData?.data?.campaign?.frequency ?? undefined
            }
          />
        )}
        {shouldShowReports && (
          <CampaignRewardsReport
            campaignId={resolvedCampaignId}
            rewards={resolvedCampaignOverviewData?.data?.campaign?.rewards}
          />
        )}
      </div>
    </main>
  );
};

export default CampaignsOverview;
