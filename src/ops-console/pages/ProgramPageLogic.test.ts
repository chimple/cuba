import { act, renderHook, waitFor } from '@testing-library/react';
import { useProgramPageLogic } from './ProgramPageLogic';

const mockReplace = jest.fn();

jest.mock('react-router', () => ({
  useHistory: () => ({
    push: jest.fn(),
    replace: mockReplace,
  }),
  useLocation: () => ({
    search: '',
  }),
}));

jest.mock('../../utility/logger', () => ({
  error: jest.fn(),
}));

const mockApiHandler = {
  getPrograms: jest.fn(),
  getProgramFilterOptions: jest.fn(),
};

jest.mock('../../services/ServiceConfig', () => ({
  ServiceConfig: {
    getI: () => ({
      apiHandler: mockApiHandler,
    }),
  },
}));

describe('useProgramPageLogic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiHandler.getPrograms.mockResolvedValue({
      data: [],
      total: 0,
    });
    mockApiHandler.getProgramFilterOptions.mockResolvedValue({
      state: ['Karnataka'],
    });
  });

  it('loads program filter options only after opening filters and caches them', async () => {
    const { result } = renderHook(() => useProgramPageLogic());

    await waitFor(() => expect(mockApiHandler.getPrograms).toHaveBeenCalled());
    expect(mockApiHandler.getProgramFilterOptions).not.toHaveBeenCalled();

    await act(async () => {
      result.current.handleOpenFilters();
    });

    await waitFor(() =>
      expect(mockApiHandler.getProgramFilterOptions).toHaveBeenCalledTimes(1),
    );

    await act(async () => {
      result.current.handleOpenFilters();
    });

    expect(mockApiHandler.getProgramFilterOptions).toHaveBeenCalledTimes(1);
  });
});
