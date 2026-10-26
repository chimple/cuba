import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ServiceConfig } from '../../../services/ServiceConfig';
import type {
  WhatsappIntegrationStatus,
  WhatsappIntegrationStatusRow,
} from '../../../services/api/serviceapi/ServiceApi.whatsapp';
import logger from '../../../utility/logger';
import { Util } from '../../../utility/util';
import { buildWhatsappIntegrationStatusCsv } from './WhatsappIntegrationStatus.export';

const CSV_MIME_TYPE = 'text/csv;charset=utf-8';
const CSV_FILE_NAME = 'whatsapp-integration-status.csv';

export const useWhatsappIntegrationStatusExport = (
  rows: WhatsappIntegrationStatusRow[],
  search: string,
  periskopeStatus: WhatsappIntegrationStatus | null,
  maytapiStatus: WhatsappIntegrationStatus | null,
) => {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (): Promise<void> => {
    if (isExporting || rows.length === 0) return;

    setIsExporting(true);
    try {
      const api = ServiceConfig.getI().apiHandler;
      const firstPage = await api.getWhatsappIntegrationStatus({
        page: 1,
        page_size: 100,
        search,
        periskope_status: periskopeStatus ?? undefined,
        maytapi_status: maytapiStatus ?? undefined,
      });
      const allRows = [...firstPage.data];

      for (let page = 2; page <= firstPage.pagination.total_pages; page += 1) {
        const response = await api.getWhatsappIntegrationStatus({
          page,
          page_size: 100,
          search,
          periskope_status: periskopeStatus ?? undefined,
          maytapi_status: maytapiStatus ?? undefined,
        });
        allRows.push(...response.data);
      }

      const headers = [
        t('School Name'),
        t('Class'),
        t('Group ID'),
        t('Periskope'),
        t('Maytapi'),
      ];
      const blob = new Blob(
        [buildWhatsappIntegrationStatusCsv(allRows, headers)],
        { type: CSV_MIME_TYPE },
      );
      await Util.handleBlobDownloadAndSave(blob, CSV_FILE_NAME, CSV_MIME_TYPE);
    } catch (error) {
      logger.error('Failed to export WhatsApp integration status', error);
    } finally {
      setIsExporting(false);
    }
  };

  return { isExporting, handleExport };
};
