import type { CampaignMessagingProviderSource } from '../../../ops-console/components/campaignsOverview/CampaignReports_Messages/CampaignMessageReport.helpers';
import type {
  CampaignMessageReportParams,
  CampaignMessageReportResponse,
  CampaignMessageReportRow,
} from '../ServiceApi';

export type OpenwaCampaignReport = {
  groupIds: string[];
  days: number;
  analytics: {
    summary?: {
      sent?: number;
      received?: number;
      interactions?: number;
      deliveredRecipients?: number;
      readRecipients?: number;
    };
    timeSeries?: Array<{
      timestamp?: string;
      sent?: number;
      received?: number;
    }>;
    byType?: Record<string, number>;
    byTypeBreakdown?: Array<{
      type?: string;
      sent?: number;
      received?: number;
      deliveredRecipients?: number;
      readRecipients?: number;
    }>;
  };
};

const reportDateKey = (value: string | null | undefined): string =>
  value?.slice(0, 10) ?? '';

export const reportDays = (fromDate?: string, toDate?: string): number => {
  if (!fromDate || !toDate) return 30;
  const from = Date.parse(`${fromDate}T00:00:00Z`);
  const to = Date.parse(`${toDate}T00:00:00Z`);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return 30;
  return Math.min(Math.max(Math.floor((to - from) / 86_400_000) + 1, 1), 90);
};

export const openwaNumber = (value: unknown): number => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
};

const sortOpenwaRows = (
  rows: CampaignMessageReportRow[],
  params: CampaignMessageReportParams,
): CampaignMessageReportRow[] => {
  const direction = params.sortOrder === 'asc' ? 1 : -1;
  const sortBy = params.sortBy ?? 'date';
  return [...rows].sort((first, second) => {
    const left = first[sortBy];
    const right = second[sortBy];
    if (left === right) return 0;
    if (left == null) return 1 * direction;
    if (right == null) return -1 * direction;
    return (left < right ? -1 : 1) * direction;
  });
};

export const buildOpenwaReportRows = (
  report: OpenwaCampaignReport,
  messagingRows: CampaignMessagingProviderSource[],
  params: CampaignMessageReportParams,
): CampaignMessageReportRow[] => {
  const fromDate = params.fromDate?.trim() ?? '';
  const toDate = params.toDate?.trim() ?? '';
  const daily = new Map<string, { sent: number; received: number }>();

  for (const item of report.analytics.timeSeries ?? []) {
    const date = reportDateKey(item.timestamp);
    if (!date) continue;
    const current = daily.get(date) ?? { sent: 0, received: 0 };
    current.sent += openwaNumber(item.sent);
    current.received += openwaNumber(item.received);
    daily.set(date, current);
  }

  const typeTotals = report.analytics.byType ?? {};
  const totalPolls = openwaNumber(typeTotals.poll);
  const totalSent = Object.values(typeTotals).reduce(
    (total, value) => total + openwaNumber(value),
    0,
  );
  const rowsByKey = new Map<string, CampaignMessageReportRow>();
  const sourcesByDate = new Map<string, Set<'daily_message' | 'poll'>>();

  for (const source of messagingRows) {
    const messageDate = reportDateKey(source.messageTime);
    const pollDate = reportDateKey(source.pollTime);
    if (messageDate) {
      const types = sourcesByDate.get(messageDate) ?? new Set();
      types.add('daily_message');
      sourcesByDate.set(messageDate, types);
    }
    if (pollDate && source.poll) {
      const types = sourcesByDate.get(pollDate) ?? new Set();
      types.add('poll');
      sourcesByDate.set(pollDate, types);
    }
  }

  for (const [date, totals] of daily) {
    if ((fromDate && date < fromDate) || (toDate && date > toDate)) continue;
    const types = sourcesByDate.get(date) ?? new Set(['daily_message']);
    const hasPoll = types.has('poll');
    const hasMessage = types.has('daily_message');
    const pollSent = hasPoll
      ? hasMessage && totalSent > 0
        ? Math.round(totals.sent * (totalPolls / totalSent))
        : totals.sent
      : 0;
    const messageSent = Math.max(0, totals.sent - pollSent);

    if (hasMessage && messageSent > 0) {
      rowsByKey.set(`${date}-daily_message`, {
        id: `${date}-daily_message`,
        date,
        messageType: 'daily_message',
        messagesSent: messageSent,
        delivered: null,
        read: null,
        pollResponses: 0,
        deliveryRate: null,
        readRate: null,
        pollParticipationRate: null,
      });
    }
    if (hasPoll && pollSent > 0) {
      rowsByKey.set(`${date}-poll`, {
        id: `${date}-poll`,
        date,
        messageType: 'poll',
        messagesSent: pollSent,
        delivered: null,
        read: null,
        pollResponses: 0,
        deliveryRate: null,
        readRate: null,
        pollParticipationRate: null,
      });
    }
  }

  return sortOpenwaRows(Array.from(rowsByKey.values()), params);
};

export const buildOpenwaCampaignMessageReport = (
  report: OpenwaCampaignReport,
  messagingRows: CampaignMessagingProviderSource[],
  params: CampaignMessageReportParams,
  whatsappGroups: number,
  totalMembersReachable: number,
): CampaignMessageReportResponse => {
  const rows = buildOpenwaReportRows(report, messagingRows, params);
  const exportAll = params.exportAll === true;
  const pageSize = exportAll
    ? Math.max(rows.length, 1)
    : Math.min(Math.max(params.pageSize ?? 10, 1), 20);
  const page = exportAll ? 1 : Math.max(params.page ?? 1, 1);
  const summary = report.analytics.summary ?? {};
  const pollBreakdown = (report.analytics.byTypeBreakdown ?? []).find(
    (item) => item.type === 'poll',
  );
  const messagesSent = openwaNumber(summary.sent);
  const deliveredRecipients = openwaNumber(summary.deliveredRecipients);
  const readRecipients = openwaNumber(summary.readRecipients);

  return {
    summary: {
      whatsappGroups,
      totalMembersReachable,
      messagesSent,
      interactions: openwaNumber(summary.interactions),
      deliveredMessages: deliveredRecipients,
      readMessages: readRecipients,
      deliveredPollMessages: openwaNumber(pollBreakdown?.deliveredRecipients),
      pollResponses: 0,
      deliveryRate: null,
      readRate: null,
      pollParticipationRate: null,
    },
    rows: exportAll ? rows : rows.slice((page - 1) * pageSize, page * pageSize),
    pagination: {
      page,
      pageSize,
      totalRows: rows.length,
      totalPages: exportAll
        ? Number(rows.length > 0)
        : Math.ceil(rows.length / pageSize),
    },
    filters: {
      fromDate: params.fromDate?.trim() || null,
      toDate: params.toDate?.trim() || null,
    },
  };
};
