import { t } from 'i18next';
import React from 'react';
import CampaignMessageReportHeader from './CampaignMessageReportHeader';
import CampaignMessageSummaryCards from './CampaignMessageSummaryCards';
import CampaignMessageTable from './CampaignMessageTable';
import { useCampaignMessageReport } from './useCampaignMessageReport';
import './CampaignMessageReport.css';

interface Props {
  campaignId?: string;
  campaignName: string;
  campaignStartDate?: string;
}
const CampaignMessageReport: React.FC<Props> = ({
  campaignId,
  campaignName,
  campaignStartDate,
}) => {
  const report = useCampaignMessageReport(
    campaignId,
    campaignName,
    campaignStartDate,
  );
  return (
    <article id="campaign-message-report" className="campaign-message-report">
      <CampaignMessageReportHeader
        fromDate={report.fromDate}
        toDate={report.toDate}
        isExporting={report.isExporting}
        invalidDateRange={report.invalidDateRange}
        onClear={report.clearFilters}
        onExport={() => void report.exportReport()}
        onFromDateChange={report.setFromDate}
        onToDateChange={report.setToDate}
      />
      {report.error ? (
        <div
          id="campaign-message-report-error"
          className="campaign-message-report-error"
          role="alert"
        >
          <p>{report.error}</p>
          <button type="button" onClick={report.retry}>
            {t('Retry')}
          </button>
        </div>
      ) : (
        <div
          id="campaign-message-report-content"
          className="campaign-message-report-content"
        >
          <CampaignMessageSummaryCards
            loading={report.loading}
            summary={report.report.summary}
          />
          <CampaignMessageTable
            loading={report.loading}
            order={report.sortOrder}
            orderBy={report.sortBy}
            page={report.page}
            pageCount={report.report.pagination.totalPages}
            rows={report.report.rows}
            onPageChange={report.setPage}
            onSort={report.handleSort}
          />
        </div>
      )}
    </article>
  );
};
export default CampaignMessageReport;
