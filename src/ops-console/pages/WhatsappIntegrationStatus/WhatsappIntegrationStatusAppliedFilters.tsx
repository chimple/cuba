import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import SelectedFilters from '../../components/SelectedFilters';
import type { WhatsappIntegrationStatus } from '../../../services/api/serviceapi/ServiceApi.whatsapp';

type WhatsappIntegrationStatusAppliedFiltersProps = {
  maytapiStatus: WhatsappIntegrationStatus | null;
  onDeleteFilter: (filterKey: string) => void;
  periskopeStatus: WhatsappIntegrationStatus | null;
};

const WhatsappIntegrationStatusAppliedFilters: FC<
  WhatsappIntegrationStatusAppliedFiltersProps
> = ({ maytapiStatus, onDeleteFilter, periskopeStatus }) => {
  const { t } = useTranslation();
  const extraFilters = [
    ...(periskopeStatus
      ? [
          {
            key: 'periskope_status',
            value: periskopeStatus,
            label: `${t('Periskope')} : ${periskopeStatus}`,
          },
        ]
      : []),
    ...(maytapiStatus
      ? [
          {
            key: 'maytapi_status',
            value: maytapiStatus,
            label: `${t('Maytapi')} : ${maytapiStatus}`,
          },
        ]
      : []),
  ];

  if (extraFilters.length === 0) return null;

  return (
    <SelectedFilters
      filters={{}}
      extraFilters={extraFilters}
      onDeleteFilter={(filterKey) => onDeleteFilter(filterKey)}
    />
  );
};

export default WhatsappIntegrationStatusAppliedFilters;
