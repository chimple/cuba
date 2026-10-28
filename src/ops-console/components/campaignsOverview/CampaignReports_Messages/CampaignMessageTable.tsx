import { t } from 'i18next';
import React, { useMemo } from 'react';
import type {
  CampaignMessageReportRow,
  CampaignMessageReportSortKey,
} from '../../../../services/api/ServiceApi';
import DataTableBody, { type Column } from '../../DataTableBody';
import DataTablePagination from '../../DataTablePagination';
import {
  formatReportDate,
  formatReportInteger,
} from './CampaignMessageReport.helpers';

interface Props {
  loading: boolean;
  order: 'asc' | 'desc';
  orderBy: CampaignMessageReportSortKey;
  page: number;
  pageCount: number;
  rows: CampaignMessageReportRow[];
  onPageChange: (page: number) => void;
  onSort: (key: CampaignMessageReportSortKey) => void;
}
const isCampaignMessageReportSortKey = (
  key: string,
): key is CampaignMessageReportSortKey =>
  key === 'date' || key === 'messageType' || key === 'messagesSent';

const CampaignMessageTable: React.FC<Props> = ({
  loading,
  order,
  orderBy,
  page,
  pageCount,
  rows,
  onPageChange,
  onSort,
}) => {
  const columns = useMemo<Column<CampaignMessageReportRow>[]>(
    () => [
      {
        key: 'date',
        label: t('Date').toUpperCase(),
        align: 'left',
        headerAlign: 'left',
        width: '15%',
        render: (row) => formatReportDate(row.date),
      },
      {
        key: 'messageType',
        label: t('Message Type').toUpperCase(),
        align: 'left',
        headerAlign: 'left',
        width: '15%',
        render: (row) =>
          t(row.messageType === 'poll' ? 'Poll' : 'Daily Message'),
      },
      {
        key: 'messagesSent',
        label: t('Messages Sent').toUpperCase(),
        align: 'center',
        headerAlign: 'center',
        width: '25%',
        render: (row) => formatReportInteger(row.messagesSent),
      },
    ],
    [],
  );

  return (
    <section
      id="campaign-message-report-table"
      className="campaign-message-report-table"
    >
      <div
        id="campaign-message-report-table-frame"
        className="campaign-message-report-table-frame"
      >
        <DataTableBody
          columns={columns}
          rows={rows}
          orderBy={orderBy}
          order={order}
          onSort={(key) => {
            if (isCampaignMessageReportSortKey(key)) onSort(key);
          }}
          loading={loading}
          disableRowNavigation
          tableMinWidth={480}
          tableWidth="100%"
          headerNoEllipsis
        />
        {!loading && rows.length === 0 ? (
          <div
            id="campaign-message-table-empty"
            className="campaign-message-table-empty"
          >
            {t('No messages match the selected filters.')}
          </div>
        ) : null}
      </div>
      <DataTablePagination
        page={page}
        pageCount={pageCount}
        onPageChange={onPageChange}
      />
    </section>
  );
};
export default CampaignMessageTable;
