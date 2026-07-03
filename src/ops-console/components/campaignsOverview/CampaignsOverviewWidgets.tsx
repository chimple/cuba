import React, { useEffect, useState } from 'react';
import {
  buildCampaignsOverviewFields,
  buildCampaignsOverviewMetrics,
  CAMPAIGN_LISTING_STATUS,
  CampaignsOverviewCancellationDetails,
  CampaignsOverviewDisplayObject,
  CampaignsOverviewResolvedStatus,
} from './CampaignsOverviewLogic';
import CampaignsOverviewInfoTooltip from './CampaignsOverviewInfoTooltip';

const PERFORMANCE_INFO_COLOR = '#1a71f6';
const getPerformanceTooltipAlignment = (
  index: number,
): 'left' | 'center' | 'right' => {
  if (index === 2 || index === 4) return 'right';
  if (index === 0 || index === 3) return 'left';
  return 'center';
};

export interface CampaignsOverviewWidgetsProps {
  campaignStatus: CampaignsOverviewResolvedStatus;
  summaryData: CampaignsOverviewDisplayObject;
  performanceData: CampaignsOverviewDisplayObject;
  cancellationDetails: CampaignsOverviewCancellationDetails;
}

const CampaignsOverviewWidgets: React.FC<CampaignsOverviewWidgetsProps> = ({
  campaignStatus,
  summaryData,
  performanceData,
  cancellationDetails,
}) => {
  const summaryFields = buildCampaignsOverviewFields(summaryData);
  const performanceMetrics = buildCampaignsOverviewMetrics(performanceData);
  const shouldShowCancellationDetails =
    campaignStatus === CAMPAIGN_LISTING_STATUS.CANCELLED;
  const [openTooltipKey, setOpenTooltipKey] = useState<string | null>(null);

  const handleTooltipToggle = (key: string): void => {
    setOpenTooltipKey((currentKey) => (currentKey === key ? null : key));
  };

  useEffect(() => {
    const handleDocumentPointerDown = (event: PointerEvent): void => {
      if (!(event.target instanceof Element)) {
        setOpenTooltipKey(null);
        return;
      }

      if (!event.target.closest('.ops-campaigns-info-tooltip')) {
        setOpenTooltipKey(null);
      }
    };

    document.addEventListener('pointerdown', handleDocumentPointerDown);

    return () => {
      document.removeEventListener('pointerdown', handleDocumentPointerDown);
    };
  }, []);

  return (
    <section
      id="ops-campaigns-overview-cards"
      className="ops-campaigns-overview-cards"
      aria-label="Campaign overview"
    >
      <div
        id="ops-campaigns-overview-primary-column"
        className="ops-campaigns-overview-primary-column"
      >
        <article
          id="ops-campaigns-overview-card ops-campaigns-overview-summary"
          className="ops-campaigns-overview-card ops-campaigns-overview-summary"
        >
          <h2
            id="ops-campaigns-overview-card-title"
            className="ops-campaigns-overview-card-title"
          >
            Campaign Summary
          </h2>
          <div
            id="ops-campaigns-overview-divider"
            className="ops-campaigns-overview-divider"
          />
          <dl
            id="ops-campaigns-overview-summary-grid"
            className="ops-campaigns-overview-summary-grid"
          >
            {summaryFields.map((field) => {
              const statusClassName = field.isStatus
                ? `ops-campaigns-overview-status-value ops-campaigns-overview-status-${field.statusTone}`
                : undefined;
              return (
                <div
                  id="ops-campaigns-overview-field"
                  className="ops-campaigns-overview-field"
                  key={field.key}
                >
                  <dt>{field.label}</dt>
                  <dd id={statusClassName} className={statusClassName}>
                    {field.value}
                    {field.durationDayCount && (
                      <>
                        {' ('}
                        <strong>{field.durationDayCount}</strong>
                        {' Days)'}
                      </>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </article>

        {shouldShowCancellationDetails && (
          <article
            id="ops-campaigns-overview-cancellation"
            className="ops-campaigns-overview-cancellation"
          >
            <h2
              id="ops-campaigns-overview-cancellation-title"
              className="ops-campaigns-overview-cancellation-title"
            >
              Cancelation Details
            </h2>
            <div
              id="ops-campaigns-overview-cancellation-divider"
              className="ops-campaigns-overview-cancellation-divider"
            />
            <dl
              id="ops-campaigns-overview-cancellation-meta"
              className="ops-campaigns-overview-cancellation-meta"
            >
              <div>
                <dt>Canceled by:</dt>
                <dd>{cancellationDetails.canceledBy}</dd>
              </div>
              <div>
                <dt>Canceled On:</dt>
                <dd>{cancellationDetails.canceledOn}</dd>
              </div>
            </dl>
            <div
              id="ops-campaigns-overview-cancellation-divider"
              className="ops-campaigns-overview-cancellation-divider"
            />
            <p
              id="ops-campaigns-overview-cancellation-label"
              className="ops-campaigns-overview-cancellation-label"
            >
              Message to Admin:
            </p>
            <p
              id="ops-campaigns-overview-cancellation-message"
              className="ops-campaigns-overview-cancellation-message"
            >
              {cancellationDetails.messageToAdmin}
            </p>
          </article>
        )}
      </div>

      <article
        id="ops-campaigns-overview-card ops-campaigns-overview-performance"
        className="ops-campaigns-overview-card ops-campaigns-overview-performance"
      >
        <h2
          id="ops-campaigns-overview-card-title"
          className="ops-campaigns-overview-card-title"
        >
          Campaign Performance
        </h2>
        <div
          id="ops-campaigns-overview-divider"
          className="ops-campaigns-overview-divider"
        />
        <dl
          id="ops-campaigns-overview-metric-grid"
          className="ops-campaigns-overview-metric-grid"
        >
          {performanceMetrics.map((metric, index) => (
            <div
              id="ops-campaigns-overview-metric"
              className="ops-campaigns-overview-metric"
              key={metric.key}
            >
              <dt>
                <span>{metric.label}</span>
                {metric.hasInfo && (
                  <CampaignsOverviewInfoTooltip
                    alignment={getPerformanceTooltipAlignment(index)}
                    color={PERFORMANCE_INFO_COLOR}
                    isOpen={openTooltipKey === metric.key}
                    label={metric.label}
                    message={metric.info}
                    onToggle={() => handleTooltipToggle(metric.key)}
                  />
                )}
              </dt>
              <dd>{metric.value}</dd>
            </div>
          ))}
        </dl>
      </article>
    </section>
  );
};

export default CampaignsOverviewWidgets;
