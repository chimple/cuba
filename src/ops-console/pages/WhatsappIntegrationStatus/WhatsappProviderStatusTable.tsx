import React from 'react';
import { useTranslation } from 'react-i18next';
import DataTableBody from '../../components/DataTableBody';
import type { WhatsappProviderStatusRow } from '../../../services/api/serviceapi/ServiceApi.whatsapp';

type Props = {
  loading: boolean;
  statuses: WhatsappProviderStatusRow[];
};

type ProviderStatusLabelKey =
  | 'Checking'
  | 'Active'
  | 'Not Active'
  | 'Check Failed';

const formatCheckedAt = (
  checkedAt: string | undefined,
  notCheckedLabel: string,
  invalidDateLabel: string,
): string => {
  if (!checkedAt) return notCheckedLabel;
  const date = new Date(checkedAt);
  return Number.isNaN(date.getTime())
    ? invalidDateLabel
    : date.toLocaleString();
};

const getStatusLabelKey = (
  status: WhatsappProviderStatusRow,
  loading: boolean,
): ProviderStatusLabelKey => {
  if (loading) return 'Checking';
  if (status.status === 'ERROR') return 'Check Failed';
  return status.status === 'CONNECTED' ? 'Active' : 'Not Active';
};

const getStatusClassName = (
  status: WhatsappProviderStatusRow,
  loading: boolean,
): string => {
  if (loading) return 'is-checking';
  return status.status === 'CONNECTED' ? 'is-connected' : 'is-issues';
};

const WhatsappProviderStatusTable: React.FC<Props> = ({
  loading,
  statuses,
}) => {
  const { t } = useTranslation();

  return (
    <div className="whatsapp-integration-status-provider-table">
      <DataTableBody
        columns={[
          {
            key: 'provider',
            label: t('Provider'),
            sortable: false,
            width: '33.3333%',
            render: (row) =>
              t(row.provider === 'periskope' ? 'Periskope' : 'Maytapi'),
          },
          {
            key: 'checked_at',
            label: t('Last Checked'),
            sortable: false,
            width: '33.3333%',
            render: (row) =>
              formatCheckedAt(
                row.checked_at,
                String(t('Not checked')),
                String(t('Not available')),
              ),
          },
          {
            key: 'status',
            label: t('Status'),
            sortable: false,
            width: '33.3333%',
            render: (row) => (
              <span
                className={`whatsapp-integration-status-provider-badge ${getStatusClassName(
                  row,
                  loading,
                )}`}
              >
                {t(getStatusLabelKey(row, loading))}
              </span>
            ),
          },
        ]}
        rows={statuses}
        loading={loading}
        orderBy={null}
        order="asc"
        onSort={() => undefined}
        disableRowNavigation
        getRowId={(row) => row.provider}
        tableMinWidth="100%"
        tableWidth="100%"
        headerNoEllipsis
        headerAlign="left"
      />
    </div>
  );
};

export default WhatsappProviderStatusTable;
