import { REQUEST_TABS, STATUS } from '../../common/constants';
import type { ServiceApi } from '../../services/api/ServiceApi';
import type { OpsRequestItem, RequestRow } from './RequestList.types';
import {
  buildRequestExportCsv,
  buildRequestExportFileName,
  buildRequestExportSheetRows,
  fetchAllRequestsForExport,
  filterRequestsByDateRange,
} from './RequestList.export';

const makeRequest = (
  values: Pick<OpsRequestItem, 'id' | 'created_at' | 'updated_at'>,
): OpsRequestItem => values as OpsRequestItem;

describe('Request list export helpers', () => {
  const now = Date.parse('2026-01-31T00:00:00.000Z');

  it('uses the pending request date for the selected range', () => {
    const recentRequest = makeRequest({
      id: 'recent',
      created_at: '2026-01-25T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    });
    const oldRequest = makeRequest({
      id: 'old',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-30T00:00:00.000Z',
    });

    expect(
      filterRequestsByDateRange(
        [recentRequest, oldRequest],
        REQUEST_TABS.PENDING,
        '7d',
        now,
      ),
    ).toEqual([recentRequest]);
  });

  it('uses the status update date for completed request tabs', () => {
    const updatedRequest = makeRequest({
      id: 'updated',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-30T00:00:00.000Z',
    });

    expect(
      filterRequestsByDateRange(
        [updatedRequest],
        REQUEST_TABS.APPROVED,
        '7d',
        now,
      ),
    ).toEqual([updatedRequest]);
  });

  it('builds rows using only the active tab columns', () => {
    const rows: RequestRow[] = [
      {
        request_id: 'request-1',
        request_type: 'student',
        school_name: 'Alpha School',
        class: 'Grade 1',
        from: 'Teacher',
        requested_date: 'Jan 25, 2026',
      },
    ];

    expect(
      buildRequestExportSheetRows(rows, [
        { key: 'request_id', label: 'Request ID' },
        { key: 'school_name', label: 'School Name' },
      ]),
    ).toEqual([
      ['Request ID', 'School Name'],
      ['request-1', 'Alpha School'],
    ]);
  });

  it('adds selected filters before the request rows', () => {
    expect(
      buildRequestExportSheetRows(
        [],
        [{ key: 'request_id', label: 'Request ID' }],
        { request_type: ['student'], school: ['Alpha School'] },
      ),
    ).toEqual([
      ['Applied Filters', ''],
      ['Request Type', 'student'],
      ['School', 'Alpha School'],
      [],
      ['Request ID'],
    ]);
  });

  it('uses the active tab and date range in the file name', () => {
    expect(buildRequestExportFileName(REQUEST_TABS.PENDING, '7d')).toBe(
      'ops-requests-pending-7days.csv',
    );
  });

  it('builds a spreadsheet-safe CSV download', () => {
    expect(
      buildRequestExportCsv([
        ['Request ID', 'School Name'],
        ['=request-1', 'A "School", Pvt. Ltd.'],
      ]),
    ).toBe(
      '\uFEFF"Request ID","School Name"\r\n"\'=request-1","A ""School"", Pvt. Ltd."',
    );
  });

  it('fetches export data with the active request status and query', async () => {
    const request = makeRequest({
      id: 'request-1',
      created_at: '2026-01-25T00:00:00.000Z',
      updated_at: '2026-01-25T00:00:00.000Z',
    });
    const getOpsRequests = jest.fn().mockResolvedValue({
      data: [request],
      total: 1,
    });
    const api: Pick<ServiceApi, 'getOpsRequests'> = { getOpsRequests };

    await fetchAllRequestsForExport({
      api,
      requestStatus: STATUS.REQUESTED,
      filters: {},
      orderBy: 'created_at',
      orderDir: 'desc',
      searchTerm: 'Alpha',
      selectedTab: REQUEST_TABS.PENDING,
      dateRange: '7d',
      now,
    });

    expect(getOpsRequests).toHaveBeenCalledWith(
      STATUS.REQUESTED,
      1,
      500,
      'created_at',
      'desc',
      {},
      'Alpha',
    );
  });

  it('stops fetching when a descending date page reaches the range boundary', async () => {
    const pageRows = Array.from({ length: 500 }, (_, index) =>
      makeRequest({
        id: `request-${index}`,
        created_at:
          index === 499
            ? '2025-12-01T00:00:00.000Z'
            : '2026-01-25T00:00:00.000Z',
        updated_at: '2026-01-25T00:00:00.000Z',
      }),
    );
    const getOpsRequests = jest.fn().mockResolvedValue({
      data: pageRows,
      total: 1000,
    });
    const api: Pick<ServiceApi, 'getOpsRequests'> = { getOpsRequests };

    const requests = await fetchAllRequestsForExport({
      api,
      requestStatus: STATUS.REQUESTED,
      filters: {},
      orderBy: 'created_at',
      orderDir: 'desc',
      searchTerm: '',
      selectedTab: REQUEST_TABS.PENDING,
      dateRange: '7d',
      now,
    });

    expect(requests).toHaveLength(499);
    expect(getOpsRequests).toHaveBeenCalledTimes(1);
  });
});
