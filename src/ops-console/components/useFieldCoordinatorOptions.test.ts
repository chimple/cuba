import { act, renderHook, waitFor } from '@testing-library/react';
import { UIEvent } from 'react';
import { useFieldCoordinatorOptions } from './useFieldCoordinatorOptions';
import { RoleType } from '../../interface/modelInterfaces';

const mockApi = { getManagersAndCoordinators: jest.fn() };
jest.mock('../../services/ServiceConfig', () => ({
  ServiceConfig: { getI: () => ({ apiHandler: mockApi }) },
}));
jest.mock('../../utility/logger', () => ({
  __esModule: true,
  default: { error: jest.fn() },
}));

const response = (start: number, count: number, totalCount = 41) => ({
  data: Array.from({ length: count }, (_, index) => ({
    user: { id: `fc-${start + index}`, name: `FC ${start + index}` },
  })),
  totalCount,
});
const bottom = {
  currentTarget: { scrollTop: 180, clientHeight: 200, scrollHeight: 400 },
} as UIEvent<HTMLElement>;

test('loads pages of 20, pins selections, deduplicates, and stops at the total', async () => {
  let finishPage: (value: ReturnType<typeof response>) => void = () => {};
  mockApi.getManagersAndCoordinators
    .mockResolvedValueOnce(response(0, 20))
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishPage = resolve;
        }),
    )
    .mockResolvedValueOnce(response(40, 1));
  const assigned = [{ id: 'fc-40', name: 'FC 40' }];
  const { result } = renderHook(() =>
    useFieldCoordinatorOptions(['fc-40'], assigned),
  );
  await waitFor(() => expect(result.current.options).toHaveLength(21));
  expect(result.current.options[0].id).toBe('fc-40');
  expect(mockApi.getManagersAndCoordinators).toHaveBeenLastCalledWith(
    1,
    '',
    20,
    'name',
    'asc',
    RoleType.FIELD_COORDINATOR,
  );
  act(() => {
    result.current.onScroll(bottom);
    result.current.onScroll(bottom);
  });
  expect(mockApi.getManagersAndCoordinators).toHaveBeenCalledTimes(2);
  await act(async () => finishPage(response(20, 20)));
  expect(result.current.options).toHaveLength(41);
  act(() => result.current.onScroll(bottom));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.options).toHaveLength(41);
  act(() => result.current.onScroll(bottom));
  expect(mockApi.getManagersAndCoordinators).toHaveBeenCalledTimes(3);
});

test('searches beyond loaded pages, preserves selections, and ignores stale responses', async () => {
  let finishOldSearch: (value: ReturnType<typeof response>) => void = () => {};
  mockApi.getManagersAndCoordinators
    .mockResolvedValueOnce(response(0, 20))
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishOldSearch = resolve;
        }),
    )
    .mockResolvedValueOnce(response(99, 1, 1));
  const { result, rerender } = renderHook(
    ({ selected }) => useFieldCoordinatorOptions(selected),
    { initialProps: { selected: [] as string[] } },
  );
  await waitFor(() => expect(result.current.options).toHaveLength(20));
  rerender({ selected: ['fc-5'] });
  act(() => result.current.setSearch('old'));
  await waitFor(() =>
    expect(mockApi.getManagersAndCoordinators).toHaveBeenCalledTimes(2),
  );
  act(() => result.current.setSearch('99'));
  await waitFor(() =>
    expect(result.current.options.map((option) => option.id)).toEqual([
      'fc-5',
      'fc-99',
    ]),
  );
  expect(mockApi.getManagersAndCoordinators).toHaveBeenLastCalledWith(
    1,
    '99',
    20,
    'name',
    'asc',
    RoleType.FIELD_COORDINATOR,
  );
  await act(async () => finishOldSearch(response(30, 1, 1)));
  expect(result.current.options.map((option) => option.id)).toEqual([
    'fc-5',
    'fc-99',
  ]);
});

test('retries the same page after a failed load without losing options', async () => {
  mockApi.getManagersAndCoordinators
    .mockResolvedValueOnce(response(0, 20, 21))
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce(response(20, 1, 21));
  const { result } = renderHook(() => useFieldCoordinatorOptions([]));
  await waitFor(() => expect(result.current.options).toHaveLength(20));
  act(() => result.current.onScroll(bottom));
  await waitFor(() => expect(result.current.error).toBe(true));
  expect(result.current.options).toHaveLength(20);
  act(() => result.current.onScroll(bottom));
  await waitFor(() => expect(result.current.options).toHaveLength(21));
  expect(mockApi.getManagersAndCoordinators).toHaveBeenLastCalledWith(
    2,
    '',
    20,
    'name',
    'asc',
    RoleType.FIELD_COORDINATOR,
  );
});
