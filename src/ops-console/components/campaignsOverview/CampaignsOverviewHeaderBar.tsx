import React from 'react';
import { ArrowBack, Notifications } from '@mui/icons-material';
import { IconButton } from '@mui/material';

const BREADCRUMB_ARROW_SRC = '/assets/ops-breadcrumb-arrow.svg';

export interface CampaignsOverviewHeaderBarProps {
  title: string;
  breadcrumb: readonly string[];
  tabs: readonly string[];
  activeTab: string;
  onBackClick: () => void;
  onBreadcrumbClick?: (item: string, index: number) => void;
  onTabClick: (tab: string) => void;
}

const CampaignsOverviewHeaderBar: React.FC<CampaignsOverviewHeaderBarProps> = ({
  title,
  breadcrumb,
  tabs,
  activeTab,
  onBackClick,
  onBreadcrumbClick,
  onTabClick,
}) => (
  <>
    <header
      id="ops-campaigns-overview-header"
      className="ops-campaigns-overview-header"
    >
      <IconButton
        id="ops-campaigns-overview-back-button"
        className="ops-campaigns-overview-back-button"
        onClick={onBackClick}
        aria-label="Back"
      >
        <ArrowBack />
      </IconButton>
      <h1
        id="ops-campaigns-overview-title"
        className="ops-campaigns-overview-title"
      >
        {title}
      </h1>
      <button
        id="ops-campaigns-overview-notification"
        className="ops-campaigns-overview-notification"
        type="button"
        aria-label="Notifications"
      >
        <Notifications fontSize="small" />
      </button>
    </header>

    <nav
      id="ops-campaigns-overview-breadcrumb"
      className="ops-campaigns-overview-breadcrumb"
      aria-label="Breadcrumb"
    >
      {breadcrumb.map((item, index) => (
        <React.Fragment key={`${item}-${index}`}>
          <button
            id={
              index === breadcrumb.length - 1
                ? 'ops-campaigns-overview-breadcrumb-item ops-campaigns-overview-breadcrumb-current'
                : 'ops-campaigns-overview-breadcrumb-item ops-campaigns-overview-breadcrumb-link'
            }
            className={
              index === breadcrumb.length - 1
                ? 'ops-campaigns-overview-breadcrumb-item ops-campaigns-overview-breadcrumb-current'
                : 'ops-campaigns-overview-breadcrumb-item ops-campaigns-overview-breadcrumb-link'
            }
            type="button"
            onClick={() => onBreadcrumbClick?.(item, index)}
          >
            {item}
          </button>
          {index < breadcrumb.length - 1 && (
            <img
              id="ops-campaigns-overview-breadcrumb-arrow"
              className="ops-campaigns-overview-breadcrumb-arrow"
              src={BREADCRUMB_ARROW_SRC}
              alt=""
              aria-hidden="true"
            />
          )}
        </React.Fragment>
      ))}
    </nav>

    <div
      id="ops-campaigns-overview-tabs"
      className="ops-campaigns-overview-tabs"
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab}
          id={
            tab === activeTab
              ? 'ops-campaigns-overview-tab ops-campaigns-overview-tab-active'
              : 'ops-campaigns-overview-tab'
          }
          className={
            tab === activeTab
              ? 'ops-campaigns-overview-tab ops-campaigns-overview-tab-active'
              : 'ops-campaigns-overview-tab'
          }
          type="button"
          role="tab"
          aria-selected={tab === activeTab}
          onClick={() => onTabClick(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  </>
);

export default CampaignsOverviewHeaderBar;
