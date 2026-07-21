import fs from 'fs';
import path from 'path';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type {
  CampaignMessageReportResponse,
  CampaignMessageReportRow,
} from '../../../../services/api/ServiceApi';
import { ServiceConfig } from '../../../../services/ServiceConfig';
import CampaignMessageReport from './CampaignMessageReport';
import CampaignMessageReportHeader from './CampaignMessageReportHeader';
import CampaignMessageSummaryCards from './CampaignMessageSummaryCards';
import CampaignMessageTable from './CampaignMessageTable';
import {
  asRecord,
  buildCampaignMessageReport,
  formatCampaignMessageReportDateControl,
  formatReportDate,
  formatReportInteger,
  formatReportPercent,
  getArray,
  getCampaignMessageExportFileName,
  getCampaignMessageReportDateInputValue,
  getInteger,
  isInvalidCampaignMessageDateRange,
  mergeProviderChats,
  normalizePeriskopeMessage,
  type CampaignMessagingProviderSource,
  type CampaignProviderData,
} from './CampaignMessageReport.helpers';

type MockColumn = {
  key: string;
  label: React.ReactNode;
  render?: (row: CampaignMessageReportRow) => React.ReactNode;
};
type MockTableProps = {
  columns: MockColumn[];
  rows: CampaignMessageReportRow[];
  loading: boolean;
  onSort: (key: string) => void;
};

jest.mock('i18next', () => ({ t: (key: string) => key }));
jest.mock('../../../../services/ServiceConfig', () => ({
  ServiceConfig: { getI: jest.fn() },
}));
jest.mock('../../../../utility/logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));
jest.mock('../../../../utility/util', () => ({
  Util: { handleBlobDownloadAndSave: jest.fn() },
}));
jest.mock('../CampaignsOverviewInfoTooltip', () => ({
  __esModule: true,
  default: ({ label }: { label: string }) => {
    const mockReact = jest.requireActual('react') as typeof import('react');
    return mockReact.createElement('span', { 'aria-label': label }, 'info');
  },
}));
jest.mock('../../DataTableBody', () => ({
  __esModule: true,
  default: ({ columns, rows, loading, onSort }: MockTableProps) => {
    const mockReact = jest.requireActual('react') as typeof import('react');
    return mockReact.createElement(
      'div',
      { 'data-testid': 'campaign-message-data-table' },
      mockReact.createElement('span', null, `loading-${String(loading)}`),
      ...columns.map((column) =>
        mockReact.createElement(
          'button',
          {
            key: column.key,
            type: 'button',
            onClick: () => onSort(column.key),
          },
          column.label,
        ),
      ),
      ...rows.flatMap((row) =>
        columns.map((column) =>
          mockReact.createElement(
            'span',
            { key: `${row.id}-${column.key}` },
            column.render?.(row) ?? '',
          ),
        ),
      ),
    );
  },
}));
jest.mock('../../DataTablePagination', () => ({
  __esModule: true,
  default: ({
    page,
    pageCount,
    onPageChange,
  }: {
    page: number;
    pageCount: number;
    onPageChange: (page: number) => void;
  }) => {
    const mockReact = jest.requireActual('react') as typeof import('react');
    return mockReact.createElement(
      'button',
      { type: 'button', onClick: () => onPageChange(page + 1) },
      `page-${page}-of-${pageCount}`,
    );
  },
}));

const row: CampaignMessageReportRow = {
  id: 'daily-1',
  date: '2026-07-20',
  messageType: 'daily_message',
  messagesSent: 10,
  delivered: 8,
  read: 6,
  pollResponses: 0,
  deliveryRate: 80,
  readRate: 75,
  pollParticipationRate: null,
};
const response: CampaignMessageReportResponse = {
  summary: {
    whatsappGroups: 2,
    totalMembersReachable: 100,
    messagesSent: 10,
    deliveredMessages: 8,
    readMessages: 6,
    deliveredPollMessages: 0,
    pollResponses: 0,
    deliveryRate: 80,
    readRate: 75,
    pollParticipationRate: 0,
  },
  rows: [row],
  pagination: { page: 1, pageSize: 10, totalRows: 1, totalPages: 1 },
  filters: { fromDate: '2026-07-01', toDate: '2026-07-21' },
};
const apiHandler = { getCampaignMessageReport: jest.fn() };

describe('CampaignReports_Messages module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ServiceConfig.getI as jest.Mock).mockReturnValue({ apiHandler });
    apiHandler.getCampaignMessageReport.mockResolvedValue(response);
  });

  it('formats report values, dates, ranges, and export names', () => {
    expect(formatReportInteger(1030)).toBe('1,030');
    expect(formatReportPercent(75.625)).toBe('75.63%');
    expect(formatReportDate('2026-07-20')).toBe('20 Jul 2026');
    expect(formatCampaignMessageReportDateControl('2026-07-20')).toBe(
      '20-Jul-2026',
    );
    expect(getCampaignMessageReportDateInputValue('2026-07-20T10:00:00Z')).toBe(
      '2026-07-20',
    );
    expect(isInvalidCampaignMessageDateRange('2026-07-21', '2026-07-20')).toBe(
      true,
    );
    expect(getCampaignMessageExportFileName('July Campaign', '', '')).toBe(
      'campaign-message-report-july-campaign-all-all.xlsx',
    );
    expect(asRecord({ value: 1 })?.value).toBe(1);
    expect(getArray([1, 2])).toEqual([1, 2]);
    expect(getInteger('12')).toBe(12);
  });

  it('normalizes, aggregates, sorts, and paginates provider messages', () => {
    expect(
      normalizePeriskopeMessage(
        {
          body: 'Daily update',
          delivery_info: {
            delivered_count: 8,
            pending: ['member-1', 'member-2'],
            read_count: 6,
          },
          from_me: true,
          timestamp: '2026-07-20T06:00:00.000Z',
        },
        {
          botNumber: '911234567890',
          chatId: 'group-1',
          memberCount: 10,
          name: 'Group One',
          provider: 'periskope',
          providers: ['periskope'],
        },
      )[0],
    ).toMatchObject({ delivered: 8, read: 6, sent: 10 });

    const providerData: CampaignProviderData = {
      chats: [],
      labelData: {
        chats: [],
        label: 'campaign-1',
        providerErrors: 0,
        total: 0,
      },
      messages: [
        {
          body: 'Daily update',
          chatId: 'group-1',
          date: '2026-07-20',
          delivered: 8,
          pollQuestion: '',
          pollResponses: 0,
          provider: 'periskope',
          read: 6,
          sent: 10,
          type: 'daily_message',
        },
        {
          body: '',
          chatId: 'group-1',
          date: '2026-07-21',
          delivered: 5,
          pollQuestion: 'Ready?',
          pollResponses: 3,
          provider: 'periskope',
          read: 4,
          sent: 5,
          type: 'poll',
        },
      ],
    };
    const sources: CampaignMessagingProviderSource[] = [
      {
        id: 'source-1',
        message: 'Daily update',
        messageStatus: 'sent',
        messageTime: '2026-07-20',
        poll: null,
        pollStatus: null,
        pollTime: null,
      },
      {
        id: 'source-2',
        message: null,
        messageStatus: null,
        messageTime: null,
        poll: { question: 'Ready?' },
        pollStatus: 'sent',
        pollTime: '2026-07-21',
      },
    ];
    const report = buildCampaignMessageReport(providerData, sources, 2, 100, {
      page: 1,
      pageSize: 10,
      sortBy: 'date',
      sortOrder: 'asc',
    });

    expect(report.rows.map((item) => item.messageType)).toEqual([
      'daily_message',
      'poll',
    ]);
    expect(report.summary).toMatchObject({
      messagesSent: 15,
      deliveredMessages: 13,
      readMessages: 10,
      pollResponses: 3,
      whatsappGroups: 2,
    });
    expect(report.rows[1].pollParticipationRate).toBe(60);
    expect(mergeProviderChats([])).toEqual([]);

    const exportReport = buildCampaignMessageReport(
      providerData,
      sources,
      2,
      100,
      {
        exportAll: true,
        page: 2,
        pageSize: 1,
        sortBy: 'date',
        sortOrder: 'asc',
      },
    );
    expect(exportReport.rows).toHaveLength(2);
    expect(exportReport.pagination).toMatchObject({
      page: 1,
      pageSize: 2,
      totalPages: 1,
    });
  });

  it('renders summary cards and wires table sorting and pagination', () => {
    const onSort = jest.fn();
    const onPageChange = jest.fn();
    const { rerender } = render(
      React.createElement(CampaignMessageSummaryCards, {
        loading: false,
        summary: response.summary,
      }),
    );
    expect(screen.getAllByRole('article')).toHaveLength(6);
    expect(screen.getByText('100')).toBeInTheDocument();

    rerender(
      React.createElement(CampaignMessageTable, {
        loading: false,
        order: 'desc',
        orderBy: 'date',
        page: 1,
        pageCount: 2,
        rows: [row],
        onPageChange,
        onSort,
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'MESSAGES SENT' }));
    fireEvent.click(screen.getByRole('button', { name: 'page-1-of-2' }));
    expect(onSort).toHaveBeenCalledWith('messagesSent');
    expect(onPageChange).toHaveBeenCalledWith(2);
    expect(screen.getByText('20 Jul 2026')).toBeInTheDocument();
  });

  it('renders loading placeholders and the empty table state', () => {
    const view = render(
      React.createElement(CampaignMessageSummaryCards, {
        loading: true,
        summary: response.summary,
      }),
    );
    expect(
      view.container.querySelectorAll(
        '[id="campaign-message-summary-skeleton"]',
      ),
    ).toHaveLength(6);

    view.rerender(
      React.createElement(CampaignMessageTable, {
        loading: true,
        order: 'desc',
        orderBy: 'date',
        page: 1,
        pageCount: 0,
        rows: [],
        onPageChange: jest.fn(),
        onSort: jest.fn(),
      }),
    );
    expect(screen.getByText('loading-true')).toBeInTheDocument();
    expect(
      screen.queryByText('No messages match the selected filters.'),
    ).not.toBeInTheDocument();

    view.rerender(
      React.createElement(CampaignMessageTable, {
        loading: false,
        order: 'desc',
        orderBy: 'date',
        page: 1,
        pageCount: 0,
        rows: [],
        onPageChange: jest.fn(),
        onSort: jest.fn(),
      }),
    );
    expect(
      screen.getByText('No messages match the selected filters.'),
    ).toBeInTheDocument();
  });

  it('wires header clear and export actions', () => {
    const onClear = jest.fn();
    const onExport = jest.fn();
    render(
      React.createElement(CampaignMessageReportHeader, {
        fromDate: '2026-07-01',
        toDate: '2026-07-21',
        isExporting: false,
        invalidDateRange: false,
        onClear,
        onExport,
        onFromDateChange: jest.fn(),
        onToDateChange: jest.fn(),
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it('loads the full report and exposes error retry behavior', async () => {
    const view = render(
      React.createElement(CampaignMessageReport, {
        campaignId: 'campaign-1',
        campaignName: 'July Campaign',
        campaignStartDate: '2026-07-01',
      }),
    );
    await waitFor(() =>
      expect(apiHandler.getCampaignMessageReport).toHaveBeenCalled(),
    );
    expect(await screen.findByText('20 Jul 2026')).toBeInTheDocument();

    view.unmount();
    apiHandler.getCampaignMessageReport.mockRejectedValue(new Error('failed'));
    render(
      React.createElement(CampaignMessageReport, {
        campaignId: 'campaign-2',
        campaignName: 'Failed Campaign',
        campaignStartDate: '2026-07-01',
      }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to load message report.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() =>
      expect(apiHandler.getCampaignMessageReport).toHaveBeenCalledTimes(3),
    );
  });

  it('keeps element ids identical to class names across the module', () => {
    const files = [
      'CampaignMessageReport.tsx',
      'CampaignMessageReportHeader.tsx',
      'CampaignMessageSummaryCards.tsx',
      'CampaignMessageTable.tsx',
    ];
    files.forEach((fileName) => {
      const source = fs.readFileSync(
        path.join(
          process.cwd(),
          'src/ops-console/components/campaignsOverview/CampaignReports_Messages',
          fileName,
        ),
        'utf8',
      );
      const ids = Array.from(
        source.matchAll(/\bid="([^"]+)"/g),
        (match) => match[1],
      );
      const classes = Array.from(
        source.matchAll(/\bclassName="([^"]+)"/g),
        (match) => match[1],
      );
      expect(ids).toEqual(classes);
    });
  });
});
