import type {
  CampaignMessageReportParams,
  CampaignMessageReportResponse,
  CampaignMessageReportRow,
  CampaignMessageReportSummary,
  CampaignWhatsappLabelChat,
  CampaignWhatsappLabelData,
} from '../../../../services/api/ServiceApi';
import { t } from 'i18next';
import { Util } from '../../../../utility/util';
import type * as XLSXModule from 'xlsx-js-style';
import {
  applyFreezePanesToWorkbook,
  type FreezePaneConfig,
  XLSX_EXPORT_BORDER_COLOR,
  XLSX_EXPORT_FONT_NAME,
  XLSX_EXPORT_FONT_SIZE,
} from '../../../../utility/xlsxExportUtils';

type XlsxModule = typeof XLSXModule;
type XlsxWorkSheet = XLSXModule.WorkSheet;
type CampaignMessageExportCell = string | number;

let xlsxModulePromise: Promise<XlsxModule> | null = null;

export const CAMPAIGN_MESSAGE_PAGE_SIZE = 10;
const CAMPAIGN_MESSAGE_REPORT_TIME_ZONE = 'Asia/Kolkata';
const CAMPAIGN_MESSAGE_EXPORT_SHEET_NAME = 'Campaign Messages';
export const EMPTY_CAMPAIGN_MESSAGE_SUMMARY: CampaignMessageReportSummary = {
  whatsappGroups: 0,
  totalMembersReachable: 0,
  messagesSent: 0,
  deliveredMessages: 0,
  readMessages: 0,
  deliveredPollMessages: 0,
  pollResponses: 0,
  deliveryRate: 0,
  readRate: 0,
  pollParticipationRate: 0,
};
export const EMPTY_CAMPAIGN_MESSAGE_REPORT: CampaignMessageReportResponse = {
  summary: EMPTY_CAMPAIGN_MESSAGE_SUMMARY,
  rows: [],
  pagination: { page: 1, pageSize: 10, totalRows: 0, totalPages: 0 },
  filters: { fromDate: null, toDate: null },
};
export const formatReportInteger = (value: number): string =>
  Math.max(0, value).toLocaleString();
export const formatReportPercent = (value: number): string =>
  `${Number(Math.max(0, value).toFixed(2))}%`;
export const formatReportDate = (value: string): string => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(
    new Date(
      Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
    ),
  );
};
export const formatCampaignMessageReportDateControl = (value: string): string =>
  formatReportDate(value).replaceAll(' ', '-');
export const isInvalidCampaignMessageDateRange = (
  fromDate: string,
  toDate: string,
): boolean => Boolean(fromDate && toDate && fromDate > toDate);
export const getCampaignMessageReportDateInputValue = (
  value: string | undefined,
): string => {
  const date = value?.slice(0, 10) ?? '';
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '';
};
export const getCampaignMessageReportToday = (): string => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: CAMPAIGN_MESSAGE_REPORT_TIME_ZONE,
  }).formatToParts(new Date());
  const day = parts.find((part) => part.type === 'day')?.value ?? '';
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  const year = parts.find((part) => part.type === 'year')?.value ?? '';
  return `${year}-${month}-${day}`;
};
export const getCampaignMessageExportFileName = (
  campaignName: string,
  fromDate: string,
  toDate: string,
): string => {
  const safeName =
    campaignName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'campaign';
  return `campaign-message-report-${safeName}-${fromDate || 'all'}-${toDate || 'all'}.xlsx`;
};

const buildCampaignMessageExportRows = (
  rows: CampaignMessageReportRow[],
): CampaignMessageExportCell[][] => [
  [
    String(t('Date')),
    String(t('Message Type')),
    String(t('Messages Sent')),
    String(t('Delivered')),
    String(t('Read')),
    String(t('Delivery %')),
    String(t('Read %')),
    String(t('Poll %')),
  ],
  ...rows.map((row) => [
    formatReportDate(row.date),
    String(t(row.messageType === 'poll' ? 'Poll' : 'Daily Message')),
    row.messagesSent,
    row.delivered,
    row.read,
    Number(row.deliveryRate.toFixed(2)),
    Number(row.readRate.toFixed(2)),
    row.pollParticipationRate === null
      ? '—'
      : Number(row.pollParticipationRate.toFixed(2)),
  ]),
];

const getXlsx = async (): Promise<XlsxModule> => {
  if (!xlsxModulePromise) {
    xlsxModulePromise = import('xlsx-js-style');
  }
  return xlsxModulePromise;
};

const applyCampaignMessageExportFormatting = (
  xlsx: XlsxModule,
  worksheet: XlsxWorkSheet,
  rowCount: number,
  columnCount: number,
): void => {
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      const cellRef = xlsx.utils.encode_cell({ r: rowIndex, c: columnIndex });
      const cell = worksheet[cellRef];
      if (!cell) continue;
      const isHeader = rowIndex === 0;
      cell.s = {
        ...cell.s,
        font: {
          ...(cell.s?.font ?? {}),
          name: XLSX_EXPORT_FONT_NAME,
          sz: XLSX_EXPORT_FONT_SIZE,
          bold: isHeader,
          color: isHeader ? { rgb: 'FFFFFF' } : undefined,
        },
        fill: isHeader
          ? {
              patternType: 'solid',
              fgColor: { rgb: '1A71F6' },
              bgColor: { rgb: '1A71F6' },
            }
          : cell.s?.fill,
        border: {
          top: { style: 'thin', color: { rgb: XLSX_EXPORT_BORDER_COLOR } },
          bottom: { style: 'thin', color: { rgb: XLSX_EXPORT_BORDER_COLOR } },
          left: { style: 'thin', color: { rgb: XLSX_EXPORT_BORDER_COLOR } },
          right: { style: 'thin', color: { rgb: XLSX_EXPORT_BORDER_COLOR } },
        },
        alignment: {
          ...(cell.s?.alignment ?? {}),
          horizontal: columnIndex < 2 ? 'left' : 'center',
          vertical: 'center',
        },
      };
    }
  }
};

const applyCampaignMessageExportWidths = (
  worksheet: XlsxWorkSheet,
  sheetRows: CampaignMessageExportCell[][],
): void => {
  worksheet['!cols'] = (sheetRows[0] ?? []).map((_, columnIndex) => {
    const maxLength = sheetRows.reduce((width, row) => {
      const value = String(row[columnIndex] ?? '');
      return Math.max(width, value.length);
    }, 0);
    return { wch: Math.max(columnIndex < 2 ? 18 : 14, maxLength + 2) };
  });
  worksheet['!rows'] = Array.from({ length: sheetRows.length }, (_, index) =>
    index === 0 ? { hpt: 20 } : { hpt: 24 },
  );
};

export const buildCampaignMessageExportWorkbook = async (
  rows: CampaignMessageReportRow[],
): Promise<ArrayBuffer> => {
  const XLSX = await getXlsx();
  const sheetRows = buildCampaignMessageExportRows(rows);
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
  const freezeConfig = {
    [CAMPAIGN_MESSAGE_EXPORT_SHEET_NAME]: {
      xSplit: 1,
      ySplit: 1,
      topLeftCell: 'B2',
      activePane: 'bottomRight',
    } satisfies FreezePaneConfig,
  };

  applyCampaignMessageExportFormatting(
    XLSX,
    worksheet,
    sheetRows.length,
    sheetRows[0]?.length ?? 0,
  );
  applyCampaignMessageExportWidths(worksheet, sheetRows);
  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    CAMPAIGN_MESSAGE_EXPORT_SHEET_NAME,
  );
  const output = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  }) as ArrayBuffer;

  return applyFreezePanesToWorkbook(
    output,
    [CAMPAIGN_MESSAGE_EXPORT_SHEET_NAME],
    freezeConfig,
  );
};

export const exportCampaignMessageRows = async (
  rows: CampaignMessageReportRow[],
  fileName: string,
): Promise<void> => {
  const output = await buildCampaignMessageExportWorkbook(rows);
  const blob = new Blob([output], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  await Util.handleBlobDownloadAndSave(blob, fileName);
};

export type ProviderJsonValue =
  | string
  | number
  | boolean
  | null
  | ProviderJsonValue[]
  | ProviderJsonRecord;
export type ProviderJsonRecord = {
  [key: string]: ProviderJsonValue | undefined;
};
type ProviderName = 'periskope';

export type CampaignMessagingProviderSource = {
  id: string;
  message: string | null;
  messageStatus: string | null;
  messageTime: string | null;
  poll: ProviderJsonValue;
  pollStatus: string | null;
  pollTime: string | null;
};

export type ProviderChat = CampaignWhatsappLabelChat & {
  botNumber: string;
  provider: ProviderName;
};

export type ProviderMessage = {
  body: string;
  chatId: string;
  date: string;
  delivered: number;
  pollQuestion: string;
  pollResponses: number;
  provider: ProviderName;
  read: number;
  sent: number;
  type: 'daily_message' | 'poll';
};

export type CampaignProviderData = {
  chats: ProviderChat[];
  labelData: CampaignWhatsappLabelData;
  messages: ProviderMessage[];
};

export const buildCampaignMessageReport = (
  providerData: CampaignProviderData,
  messagingRows: CampaignMessagingProviderSource[],
  whatsappGroups: number,
  totalMembersReachable: number,
  params: CampaignMessageReportParams,
): CampaignMessageReportResponse => {
  const fromDate = params.fromDate?.trim() || null;
  const toDate = params.toDate?.trim() || null;
  const rows = messagingRows
    .flatMap((source) => buildSourceRows(source, providerData.messages))
    .filter(
      (row) =>
        (!fromDate || row.date >= fromDate) && (!toDate || row.date <= toDate),
    );
  const sortedRows = sortRows(
    rows,
    params.sortBy ?? 'date',
    params.sortOrder ?? 'desc',
  );
  const exportAll = params.exportAll === true;
  const pageSize = exportAll
    ? Math.max(sortedRows.length, 1)
    : Math.min(Math.max(params.pageSize ?? 10, 1), 20);
  const page = exportAll ? 1 : Math.max(params.page ?? 1, 1);
  const pageRows = exportAll
    ? sortedRows
    : sortedRows.slice((page - 1) * pageSize, page * pageSize);
  const messagesSent = sum(rows, 'messagesSent');
  const deliveredMessages = sum(rows, 'delivered');
  const readMessages = sum(rows, 'read');
  const pollRows = rows.filter((row) => row.messageType === 'poll');
  const deliveredPollMessages = sum(pollRows, 'delivered');
  const pollResponses = sum(pollRows, 'pollResponses');

  return {
    summary: {
      whatsappGroups,
      totalMembersReachable,
      messagesSent,
      deliveredMessages,
      readMessages,
      deliveredPollMessages,
      pollResponses,
      deliveryRate: percentage(deliveredMessages, messagesSent),
      readRate: percentage(readMessages, deliveredMessages),
      pollParticipationRate: percentage(pollResponses, deliveredPollMessages),
    },
    rows: pageRows,
    pagination: {
      page,
      pageSize,
      totalRows: sortedRows.length,
      totalPages: exportAll
        ? Number(sortedRows.length > 0)
        : Math.ceil(sortedRows.length / pageSize),
    },
    filters: { fromDate, toDate },
  };
};

export const normalizePeriskopeMessage = (
  value: ProviderJsonValue,
  chat: ProviderChat,
): ProviderMessage[] => {
  const message = asRecord(value);
  if (!message || message.from_me !== true) return [];
  const date = providerDateKey(message.timestamp);
  if (!date) return [];
  const delivery = asRecord(message.delivery_info);
  const pollInfo = asRecord(message.poll_info);
  const pollResponses = countPollRespondents(message.poll_results);
  const delivered = getInteger(delivery?.delivered_count);
  const read = getInteger(delivery?.read_count);
  const pending = getArray(delivery?.pending).length;
  const pollQuestion =
    getString(pollInfo?.pollName) ||
    getString(pollInfo?.poll_name) ||
    getString(pollInfo?.question);
  return [
    {
      body: getString(message.body),
      chatId: chat.chatId,
      date,
      delivered: Math.max(delivered, read, pollResponses),
      pollQuestion,
      pollResponses,
      provider: 'periskope',
      read,
      sent: Math.max(delivered + pending, read, pollResponses),
      type:
        pollInfo || message.message_type === 'poll' ? 'poll' : 'daily_message',
    },
  ];
};

const buildSourceRows = (
  source: CampaignMessagingProviderSource,
  messages: ProviderMessage[],
): CampaignMessageReportRow[] => {
  const rows: CampaignMessageReportRow[] = [];
  const dailyDate = dateKey(source.messageTime);
  const dailyBody = source.message?.trim() ?? '';
  if (dailyDate && source.messageStatus === 'sent') {
    rows.push(
      aggregateSourceMessages(
        `${dailyDate}-daily_message-${source.id}`,
        dailyDate,
        'daily_message',
        messages.filter(
          (message) =>
            message.type === 'daily_message' &&
            message.date === dailyDate &&
            (!dailyBody || message.body.trim() === dailyBody),
        ),
      ),
    );
  }
  const pollDate = dateKey(source.pollTime);
  const poll = asRecord(source.poll ?? null);
  const pollQuestion =
    getString(poll?.question) || getString(poll?.pollName) || dailyBody;
  if (pollDate && source.pollStatus === 'sent') {
    rows.push(
      aggregateSourceMessages(
        `${pollDate}-poll-${source.id}`,
        pollDate,
        'poll',
        messages.filter(
          (message) =>
            message.type === 'poll' &&
            message.date === pollDate &&
            (!pollQuestion || message.pollQuestion.trim() === pollQuestion),
        ),
      ),
    );
  }
  return rows;
};

const aggregateSourceMessages = (
  id: string,
  date: string,
  messageType: 'daily_message' | 'poll',
  messages: ProviderMessage[],
): CampaignMessageReportRow => {
  const messagesSent = messages.reduce((total, item) => total + item.sent, 0);
  const delivered = messages.reduce((total, item) => total + item.delivered, 0);
  const read = messages.reduce((total, item) => total + item.read, 0);
  const pollResponses = messages.reduce(
    (total, item) => total + item.pollResponses,
    0,
  );
  return {
    id,
    date,
    messageType,
    messagesSent,
    delivered,
    read,
    pollResponses,
    deliveryRate: percentage(delivered, messagesSent),
    readRate: percentage(read, delivered),
    pollParticipationRate:
      messageType === 'poll' ? percentage(pollResponses, delivered) : null,
  };
};

export const providerResult = (
  label: string,
  chats: ProviderChat[],
  messages: ProviderMessage[],
  providerErrors = 0,
): CampaignProviderData => ({
  chats,
  messages,
  labelData: {
    chats: chats.map(({ chatId, memberCount, name, providers }) => ({
      chatId,
      memberCount,
      name,
      providers,
    })),
    label,
    providerErrors,
    total: chats.length,
  },
});

export const mergeProviderChats = (chats: ProviderChat[]): ProviderChat[] =>
  Array.from(new Map(chats.map((chat) => [chat.chatId, chat])).values());

export const asRecord = (
  value: ProviderJsonValue | undefined,
): ProviderJsonRecord | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value
    : null;
export const getArray = (
  value: ProviderJsonValue | undefined,
): ProviderJsonValue[] => (Array.isArray(value) ? value : []);
export const getString = (value: ProviderJsonValue | undefined): string =>
  typeof value === 'string' ? value.trim() : '';
export const getInteger = (value: ProviderJsonValue | undefined): number => {
  const parsed = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
};
const dateKey = (value: ProviderJsonValue | undefined): string => {
  if (typeof value === 'number') {
    const date = new Date(value < 10_000_000_000 ? value * 1000 : value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
  }
  const text = getString(value);
  const prefix = text.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (prefix) return prefix;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};
const providerDateKey = (value: ProviderJsonValue | undefined): string => {
  const numericValue = typeof value === 'number' ? value : Number.NaN;
  const date = Number.isFinite(numericValue)
    ? new Date(
        numericValue < 10_000_000_000 ? numericValue * 1000 : numericValue,
      )
    : new Date(getString(value));
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).formatToParts(date);
  const part = (type: 'day' | 'month' | 'year'): string =>
    parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
};
const countPollRespondents = (value: ProviderJsonValue | undefined): number => {
  const result = asRecord(value);
  if (!result) return getArray(value).length;
  const respondents = new Set<string>();
  Object.values(result).forEach((option) => {
    const votes = asRecord(option);
    if (votes) Object.keys(votes).forEach((id) => respondents.add(id));
  });
  return respondents.size;
};
const percentage = (numerator: number, denominator: number): number =>
  denominator > 0 ? Number(((numerator / denominator) * 100).toFixed(2)) : 0;
const sum = (
  rows: CampaignMessageReportRow[],
  key: 'messagesSent' | 'delivered' | 'read' | 'pollResponses',
): number => rows.reduce((total, row) => total + row[key], 0);
const sortRows = (
  rows: CampaignMessageReportRow[],
  key: keyof CampaignMessageReportRow,
  order: 'asc' | 'desc',
): CampaignMessageReportRow[] =>
  [...rows].sort((left, right) => {
    const leftValue = left[key] ?? -1;
    const rightValue = right[key] ?? -1;
    const comparison =
      typeof leftValue === 'number' && typeof rightValue === 'number'
        ? leftValue - rightValue
        : String(leftValue).localeCompare(String(rightValue));
    return order === 'asc' ? comparison : -comparison;
  });
