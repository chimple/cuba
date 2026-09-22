import type { FC } from 'react';
import type { WhatsappIntegrationStatus } from '../../../services/api/serviceapi/ServiceApi.whatsapp';

const WhatsappIntegrationStatusChip: FC<{
  status: WhatsappIntegrationStatus;
}> = ({ status }) => (
  <span
    className={`whatsapp-integration-status-chip${
      status === 'Yes' ? ' is-connected' : ' is-not-connected'
    }`}
  >
    {status}
  </span>
);

export default WhatsappIntegrationStatusChip;
