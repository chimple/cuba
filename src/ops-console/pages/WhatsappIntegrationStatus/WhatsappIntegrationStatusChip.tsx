import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { WhatsappIntegrationStatus } from '../../../services/api/serviceapi/ServiceApi.whatsapp';
import { getWhatsappIntegrationStatusLabel } from './whatsappIntegrationStatusLabels';

const WhatsappIntegrationStatusChip: FC<{
  status: WhatsappIntegrationStatus;
}> = ({ status }) => {
  const { t } = useTranslation();

  return (
    <span
      className={`whatsapp-integration-status-chip${
        status === 'Yes' ? ' is-connected' : ' is-not-connected'
      }`}
    >
      {t(getWhatsappIntegrationStatusLabel(status))}
    </span>
  );
};

export default WhatsappIntegrationStatusChip;
