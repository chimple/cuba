import type { WhatsappIntegrationStatusRow } from '../../../services/api/serviceapi/ServiceApi.whatsapp';

const escapeCsvCell = (value: string): string =>
  `"${value.replace(/"/g, '""')}"`;

export const buildWhatsappIntegrationStatusCsv = (
  rows: WhatsappIntegrationStatusRow[],
  headers: string[],
): string => {
  const values = rows.map((row) => [
    row.school_name,
    row.class_name ?? '--',
    row.group_id ?? '--',
    row.periskope_status,
    row.maytapi_status,
  ]);

  return `\uFEFF${[headers, ...values]
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\r\n')}`;
};
