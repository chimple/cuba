import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  DEFAULT_CAMPAIGNS_OVERVIEW_BREADCRUMB,
  DEFAULT_CAMPAIGNS_OVERVIEW_TABS,
  DEFAULT_CAMPAIGNS_OVERVIEW_TITLE,
  buildCampaignsOverviewViewModel,
  CampaignsOverviewApiResponse,
} from './CampaignsOverviewLogic';
import CampaignsOverviewHeaderBar from './CampaignsOverviewHeaderBar';
import CampaignsOverviewWidgets from './CampaignsOverviewWidgets';
import CampaignMessages from '../campaignMessages/CampaignMessages';
import './CampaignsOverview.css';
import './CampaignsOverviewMobile.css';

export interface CampaignsOverviewProps {
  title?: string;
  breadcrumb?: readonly string[];
  tabs?: readonly string[];
  activeTab?: string;
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
  campaignOverviewData,
  onBackClick,
  onBreadcrumbClick,
  onTabClick,
}) => {
  const history = useHistory();
  const [selectedTab, setSelectedTab] = useState(activeTab);
  const campaignViewModel =
    buildCampaignsOverviewViewModel(campaignOverviewData);

  useEffect(() => {
    document.body.classList.add('campaigns-overview-active');
    return () => {
      document.body.classList.remove('campaigns-overview-active');
    };
  }, []);

  const handleTabClick = (tab: string): void => {
    setSelectedTab(tab);
    onTabClick?.(tab);
  };

  const shouldShowOverviewWidgets =
    selectedTab === DEFAULT_CAMPAIGNS_OVERVIEW_TABS[0];
  const shouldShowMessages = selectedTab === DEFAULT_CAMPAIGNS_OVERVIEW_TABS[2];
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
          campaignOverviewData ? campaignViewModel.breadcrumb : breadcrumb
        }
        tabs={tabs}
        activeTab={selectedTab}
        onBackClick={handleBackClick}
        onBreadcrumbClick={onBreadcrumbClick}
        onTabClick={handleTabClick}
      />
      {shouldShowOverviewWidgets && (
        <CampaignsOverviewWidgets
          campaignStatus={campaignViewModel.campaignStatus}
          summaryData={campaignViewModel.summaryData}
          performanceData={campaignViewModel.performanceData}
          cancellationDetails={campaignViewModel.cancellationDetails}
        />
      )}
      {shouldShowMessages && (
        <CampaignMessages data={campaignOverviewData?.data} />
      )}
    </main>
  );
};

export default CampaignsOverview;
