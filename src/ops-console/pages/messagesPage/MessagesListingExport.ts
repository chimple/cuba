import { useState } from 'react';
import type * as XLSXModule from 'xlsx-js-style';
import { t } from 'i18next';
import type { CampaignNotificationListItem } from '../../../services/api/ServiceApi';
import { Util } from '../../../utility/util';

const EXPORT_FILE_NAME = 'Messages.xlsx';
const EXPORT_SHEET_NAME = 'Messages';
type XlsxModule = typeof XLSXModule;

let xlsxModulePromise: Promise<XlsxModule> | null = null;

const getXlsx = async (): Promise<XlsxModule> => {
  if (!xlsxModulePromise) {
    xlsxModulePromise = import('xlsx-js-style');
  }
  return xlsxModulePromise;
};

const formatDate = (value: string | null): string =>
  value
    ? new Intl.DateTimeFormat(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(`${value}T00:00:00`))
    : '';

export const exportMessages = async (
  messages: CampaignNotificationListItem[],
): Promise<void> => {
  const XLSX = await getXlsx();
  const rows = messages.map((message) => ({
    [String(t('Message Type'))]: 'Notification',
    [String(t('Label'))]: message.label || '',
    [String(t('Title'))]: message.title || '',
    [String(t('Message'))]: message.message || '',
    [String(t('Start Date'))]: formatDate(message.sendDate),
    [String(t('End Date'))]: formatDate(message.endDate),
    [String(t('Program'))]: message.programName || '',
    [String(t('Program Manager'))]: message.programManagerNames.join(', '),
    [String(t('User Type'))]: message.userType || '',
    [String(t('School Model'))]: message.schoolModel || '',
    [String(t('Status'))]: message.status || '',
  }));
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, EXPORT_SHEET_NAME);
  const output = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  });
  const blob = new Blob([output], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  await Util.handleBlobDownloadAndSave(blob, EXPORT_FILE_NAME);
};

export const useMessagesListingExport = (
  messages: CampaignNotificationListItem[],
) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (isExporting || messages.length === 0) return;
    setIsExporting(true);
    try {
      await exportMessages(messages);
    } finally {
      setIsExporting(false);
    }
  };

  return { handleExport, isExporting };
};
