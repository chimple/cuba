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
  formatReportPercent,
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
  key === 'date' ||
  key === 'messageType' ||
  key === 'messagesSent' ||
  key === 'delivered' ||
  key === 'read' ||
  key === 'deliveryRate' ||
  key === 'readRate' ||
  key === 'pollParticipationRate';

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
        width: '14%',
        render: (row) => formatReportInteger(row.messagesSent),
      },
      {
        key: 'delivered',
        label: t('Delivered').toUpperCase(),
        align: 'center',
        headerAlign: 'center',
        width: '12%',
        render: (row) => formatReportInteger(row.delivered),
      },
      {
        key: 'read',
        label: t('Read').toUpperCase(),
        align: 'center',
        headerAlign: 'center',
        width: '8%',
        render: (row) => formatReportInteger(row.read),
      },
      {
        key: 'deliveryRate',
        label: t('Delivery %').toUpperCase(),
        align: 'center',
        headerAlign: 'center',
        width: '13%',
        render: (row) => formatReportPercent(row.deliveryRate),
      },
      {
        key: 'readRate',
        label: t('Read %').toUpperCase(),
        align: 'center',
        headerAlign: 'center',
        width: '13%',
        render: (row) => formatReportPercent(row.readRate),
      },
      {
        key: 'pollParticipationRate',
        label: t('Poll %').toUpperCase(),
        align: 'center',
        headerAlign: 'center',
        width: '10%',
        render: (row) =>
          row.pollParticipationRate === null
            ? '—'
            : formatReportPercent(row.pollParticipationRate),
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
          tableMinWidth={760}
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
