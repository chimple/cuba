import { TextEncoder } from 'util';

const mockRead = jest.fn();
const mockSheetToJson = jest.fn();
const mockBookNew = jest.fn();
const mockJsonToSheet = jest.fn();
const mockBookAppendSheet = jest.fn();
const mockWrite = jest.fn();

jest.mock('xlsx-js-style', () => ({
  read: (...args: unknown[]) => mockRead(...args),
  write: (...args: unknown[]) => mockWrite(...args),
  utils: {
    sheet_to_json: (...args: unknown[]) => mockSheetToJson(...args),
    book_new: (...args: unknown[]) => mockBookNew(...args),
    json_to_sheet: (...args: unknown[]) => mockJsonToSheet(...args),
    book_append_sheet: (...args: unknown[]) => mockBookAppendSheet(...args),
  },
}));

describe('background.worker', () => {
  const loadWorker = async () => {
    jest.resetModules();
    jest.clearAllMocks();
    (globalThis as unknown as { postMessage: jest.Mock }).postMessage =
      jest.fn();
    (globalThis as unknown as { TextEncoder: typeof TextEncoder }).TextEncoder =
      TextEncoder;
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: {
        subtle: {
          digest: jest.fn(async () => new Uint8Array([0xde, 0xad]).buffer),
        },
      },
    });
    await import('./background.worker');
    return (
      globalThis as unknown as { onmessage: (event: any) => Promise<void> }
    ).onmessage;
  };

  test('builds sync batches for valid table', async () => {
    const onmessage = await loadWorker();
    await onmessage({
      data: {
        id: '1',
        type: 'PREPARE_SYNC_BATCHES',
        payload: {
          tables: {
            user: [{ id: 'u1', name: 'A', updated_at: '2026-01-01T00:00:00Z' }],
          },
          tableColumns: { user: ['id', 'name', 'updated_at'] },
          defaultBatchSize: 10,
          userTableName: 'user',
          userTableBatchSize: 5,
        },
      },
    });
    const response = (globalThis as unknown as { postMessage: jest.Mock })
      .postMessage.mock.calls[0][0];
    expect(response.ok).toBe(true);
    expect(response.result.tableBatches.user[0][0].statement).toContain(
      'INSERT INTO user',
    );
  });

  test('splits non-user table rows by default batch size', async () => {
    const onmessage = await loadWorker();
    await onmessage({
      data: {
        id: '2',
        type: 'PREPARE_SYNC_BATCHES',
        payload: {
          tables: {
            lesson: [
              { id: '1', updated_at: 'a' },
              { id: '2', updated_at: 'b' },
              { id: '3', updated_at: 'c' },
            ],
          },
          tableColumns: { lesson: ['id', 'updated_at'] },
          defaultBatchSize: 2,
          userTableName: 'user',
          userTableBatchSize: 99,
        },
      },
    });
    const response = (globalThis as unknown as { postMessage: jest.Mock })
      .postMessage.mock.calls[0][0];
    expect(response.result.tableBatches.lesson).toHaveLength(2);
  });

  test('uses DO NOTHING clause when row has only id', async () => {
    const onmessage = await loadWorker();
    await onmessage({
      data: {
        id: '3',
        type: 'PREPARE_SYNC_BATCHES',
        payload: {
          tables: {
            chapter: [{ id: 'c1' }],
          },
          tableColumns: { chapter: ['id'] },
          defaultBatchSize: 5,
          userTableName: 'user',
          userTableBatchSize: 5,
        },
      },
    });
    const response = (globalThis as unknown as { postMessage: jest.Mock })
      .postMessage.mock.calls[0][0];
    expect(response.result.tableBatches.chapter[0][0].statement).toContain(
      'ON CONFLICT(id) DO NOTHING',
    );
  });

  test('rejects invalid table names in sync payload', async () => {
    const onmessage = await loadWorker();
    await onmessage({
      data: {
        id: '4',
        type: 'PREPARE_SYNC_BATCHES',
        payload: {
          tables: {
            'user;drop': [{ id: 'u1', updated_at: 'z' }],
          },
          tableColumns: { 'user;drop': ['id', 'updated_at'] },
          defaultBatchSize: 5,
          userTableName: 'user',
          userTableBatchSize: 5,
        },
      },
    });
    const response = (globalThis as unknown as { postMessage: jest.Mock })
      .postMessage.mock.calls[0][0];
    expect(response.ok).toBe(false);
    expect(response.error).toContain('Invalid table name');
  });

  test('builds binary from base64 and transfers buffer', async () => {
    const onmessage = await loadWorker();
    await onmessage({
      data: {
        id: '5',
        type: 'PREPARE_BINARY_FROM_BASE64',
        payload: { base64: btoa('abc'), algorithm: 'SHA-256' },
      },
    });
    const call = (globalThis as unknown as { postMessage: jest.Mock })
      .postMessage.mock.calls[0];
    expect(call[0].ok).toBe(true);
    expect(call[0].result.byteLength).toBe(3);
    expect(call[0].result.sha256Hex).toBe('dead');
    expect(call[1][0]).toBeInstanceOf(ArrayBuffer);
  });

  test('plans hot update files with copy and download buckets', async () => {
    const onmessage = await loadWorker();
    await onmessage({
      data: {
        id: '6',
        type: 'PLAN_HOT_UPDATE_FILES',
        payload: {
          activeFiles: [{ path: 'a.js', hash: 'h1' }],
          serverFiles: [
            { path: 'a.js', hash: 'h1' },
            { path: 'b.js', hash: 'h2' },
          ],
        },
      },
    });
    const response = (globalThis as unknown as { postMessage: jest.Mock })
      .postMessage.mock.calls[0][0];
    expect(response.result.copyFromPreviousPaths).toEqual(['a.js']);
    expect(response.result.downloadFromServerPaths).toEqual(['b.js']);
  });

  test('builds growthbook attributes and computes percentage', async () => {
    const onmessage = await loadWorker();
    await onmessage({
      data: {
        id: '7',
        type: 'PREPARE_GROWTHBOOK_ATTRIBUTES',
        payload: {
          language: 'en',
          attributes: {
            studentDetails: { id: 's1', age: 10, stars: 11 },
            count_of_assignment_played: 5,
            assignmentCount: 5,
            pending_course_counts: { pending_maths: 2 },
          },
        },
      },
    });
    const response = (globalThis as unknown as { postMessage: jest.Mock })
      .postMessage.mock.calls[0][0];
    expect(response.result.student_id).toBe('s1');
    expect(response.result.percentage_of_assignment_played).toBe(50);
    expect(response.result.pending_maths).toBe(2);
  });

  test('builds growthbook attributes with zero denominator', async () => {
    const onmessage = await loadWorker();
    await onmessage({
      data: {
        id: '8',
        type: 'PREPARE_GROWTHBOOK_ATTRIBUTES',
        payload: {
          language: 'en',
          attributes: {
            count_of_assignment_played: 0,
            assignmentCount: 0,
          },
        },
      },
    });
    const response = (globalThis as unknown as { postMessage: jest.Mock })
      .postMessage.mock.calls[0][0];
    expect(response.result.percentage_of_assignment_played).toBe(0);
  });

  test('parses xlsx sheets via read + sheet_to_json', async () => {
    mockRead.mockReturnValue({
      SheetNames: ['School', 'Teacher'],
      Sheets: { School: {}, Teacher: {} },
    });
    mockSheetToJson
      .mockReturnValueOnce([{ a: 1 }])
      .mockReturnValueOnce([{ b: 2 }]);
    const onmessage = await loadWorker();
    await onmessage({
      data: {
        id: '9',
        type: 'PARSE_XLSX_SHEETS',
        payload: { fileBuffer: new ArrayBuffer(4) },
      },
    });
    const response = (globalThis as unknown as { postMessage: jest.Mock })
      .postMessage.mock.calls[0][0];
    expect(mockRead).toHaveBeenCalled();
    expect(mockSheetToJson).toHaveBeenCalledTimes(2);
    expect(response.result.sheetNames).toEqual(['School', 'Teacher']);
  });

  test('builds xlsx file and transfers array output', async () => {
    const wb = {};
    mockBookNew.mockReturnValue(wb);
    mockJsonToSheet.mockReturnValue({ A1: { v: 'x' } });
    mockWrite.mockReturnValue(new Uint8Array([1, 2, 3]));
    const onmessage = await loadWorker();
    await onmessage({
      data: {
        id: '10',
        type: 'BUILD_XLSX_FILE',
        payload: {
          sheetNames: ['Sheet1'],
          sheets: { Sheet1: [{ A: 'x' }] },
        },
      },
    });
    const call = (globalThis as unknown as { postMessage: jest.Mock })
      .postMessage.mock.calls[0];
    expect(call[0].ok).toBe(true);
    expect(call[0].result.fileBuffer).toBeInstanceOf(ArrayBuffer);
    expect(call[1][0]).toBeInstanceOf(ArrayBuffer);
  });

  test('builds xlsx file from string output by encoding to ArrayBuffer', async () => {
    const wb = {};
    mockBookNew.mockReturnValue(wb);
    mockJsonToSheet.mockReturnValue({ A1: { v: 'x' } });
    mockWrite.mockReturnValue('hello');
    const onmessage = await loadWorker();
    await onmessage({
      data: {
        id: '11',
        type: 'BUILD_XLSX_FILE',
        payload: {
          sheetNames: ['S1'],
          sheets: { S1: [{ A: 'x' }] },
        },
      },
    });
    const response = (globalThis as unknown as { postMessage: jest.Mock })
      .postMessage.mock.calls[0][0];
    expect(response.result.fileBuffer).toBeInstanceOf(ArrayBuffer);
    expect(new Uint8Array(response.result.fileBuffer).length).toBeGreaterThan(
      0,
    );
  });

  test('returns error for unsupported task', async () => {
    const onmessage = await loadWorker();
    await onmessage({
      data: {
        id: '12',
        type: 'UNKNOWN_TASK',
        payload: {},
      },
    });
    const response = (globalThis as unknown as { postMessage: jest.Mock })
      .postMessage.mock.calls[0][0];
    expect(response.ok).toBe(false);
    expect(response.error).toContain('Unsupported worker task');
  });
});

export {};
