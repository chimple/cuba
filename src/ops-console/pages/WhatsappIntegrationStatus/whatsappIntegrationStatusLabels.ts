import type { WhatsappIntegrationStatus } from '../../../services/api/serviceapi/ServiceApi.whatsapp';

export const getWhatsappIntegrationStatusLabel = (
  status: WhatsappIntegrationStatus,
): string => {
  switch (status) {
    case 'No School Linked':
      return 'School not WhatsApp enabled';
    case 'No Class Linked':
      return 'Class not linked';
    default:
      return status;
  }
};
