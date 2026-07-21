import { t } from 'i18next';
import React from 'react';
import type { CampaignMessageReportSummary } from '../../../../services/api/ServiceApi';
import CampaignsOverviewInfoTooltip from '../CampaignsOverviewInfoTooltip';
import {
  formatReportInteger,
  formatReportPercent,
} from './CampaignMessageReport.helpers';

interface Props {
  loading: boolean;
  summary: CampaignMessageReportSummary;
}
const CampaignMessageSummaryCards: React.FC<Props> = ({ loading, summary }) => {
  const cards = [
    [
      'WhatsApp Groups',
      formatReportInteger(summary.whatsappGroups),
      'Total number of WhatsApp groups linked to this campaign.',
    ],
    [
      'Total Members Reachable',
      formatReportInteger(summary.totalMembersReachable),
      'Total number of members across all WhatsApp groups participating in the campaign.',
    ],
    [
      'Messages Sent',
      formatReportInteger(summary.messagesSent),
      'Total number of campaign messages sent during the selected period, including daily messages and polls.',
    ],
    [
      'Delivery Rate',
      formatReportPercent(summary.deliveryRate),
      'Percentage of sent messages that were successfully delivered.',
    ],
    [
      'Read Rate',
      formatReportPercent(summary.readRate),
      'Percentage of delivered messages that were read by recipients.',
    ],
    [
      'Poll Participation',
      formatReportPercent(summary.pollParticipationRate),
      'Percentage of recipients who responded to campaign polls during the selected period.',
    ],
  ] as const;
  return (
    <section
      id="campaign-message-summary-grid"
      className="campaign-message-summary-grid"
    >
      {cards.map(([label, value, info]) => (
        <article
          id="campaign-message-summary-card"
          className="campaign-message-summary-card"
          key={label}
        >
          <div
            id="campaign-message-summary-label"
            className="campaign-message-summary-label"
          >
            <span>{t(label)}</span>
            <CampaignsOverviewInfoTooltip
              alignment="right"
              color="#1a71f6"
              label={t(label)}
              message={t(info)}
            />
          </div>
          {loading ? (
            <span
              id="campaign-message-summary-skeleton"
              className="campaign-message-summary-skeleton"
            />
          ) : (
            <strong>{value}</strong>
          )}
        </article>
      ))}
    </section>
  );
};
export default CampaignMessageSummaryCards;
