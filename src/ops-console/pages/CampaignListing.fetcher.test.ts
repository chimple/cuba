import { act, renderHook, waitFor } from '@testing-library/react';
import type { ServiceApi } from '../../services/api/ServiceApi';
import {
  buildCampaignListingRequest,
  useCampaignListingData,
} from './CampaignListing.fetcher';

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useHistory: () => ({ replace: jest.fn() }),
  useLocation: () => ({ search: '' }),
}));

type CampaignListingResponse = {
  data: Array<{ campaignId: string; campaign: { name: string } }>;
  totalCount: number;
};

const createDeferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

describe('CampaignListing.fetcher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trims the search term before sending the API request', () => {
    expect(
      buildCampaignListingRequest({
        page: 2,
        pageSize: 8,
        orderBy: 'campaignName',
        orderDir: 'desc',
        searchTerm: '  summer  ',
      }),
    ).toEqual({
      page: 2,
      pageSize: 8,
      orderBy: 'name',
      orderDir: 'desc',
      searchTerm: 'summer',
    });
  });

  it('keeps previous rows visible while a refreshed search is in flight and ignores stale responses', async () => {
    const initialResponse: CampaignListingResponse = {
      data: [{ campaignId: 'campaign-1', campaign: { name: 'Initial' } }],
      totalCount: 1,
    };
    const staleResponse: CampaignListingResponse = {
      data: [{ campaignId: 'campaign-2', campaign: { name: 'Stale' } }],
      totalCount: 1,
    };
    const latestResponse: CampaignListingResponse = {
      data: [{ campaignId: 'campaign-3', campaign: { name: 'Latest' } }],
      totalCount: 1,
    };
    const initialRequest = createDeferred<CampaignListingResponse>();
    const staleRequest = createDeferred<CampaignListingResponse>();
    const latestRequest = createDeferred<CampaignListingResponse>();
    const getCampaignListing = jest
      .fn()
      .mockReturnValueOnce(initialRequest.promise)
      .mockReturnValueOnce(staleRequest.promise)
      .mockReturnValueOnce(latestRequest.promise);
    const getCampaignListingMetrics = jest.fn().mockResolvedValue(new Map());
    const api = {
      getCampaignListing,
      getCampaignListingMetrics,
    } as unknown as ServiceApi;

    const { result, rerender } = renderHook(
      ({ searchTerm }) =>
        useCampaignListingData({
          api,
          page: 1,
          pageSize: 8,
          orderBy: 'campaignName',
          orderDir: 'asc',
          searchTerm,
        }),
      {
        initialProps: { searchTerm: '' },
      },
    );

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      initialRequest.resolve(initialResponse);
    });

    await waitFor(() => {
      expect(result.current.campaigns).toEqual(initialResponse.data);
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isRefreshing).toBe(false);

    rerender({ searchTerm: 'summer' });

    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(true);
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.campaigns).toEqual(initialResponse.data);

    rerender({ searchTerm: 'summer camp' });

    await act(async () => {
      latestRequest.resolve(latestResponse);
    });

    await waitFor(() => {
      expect(result.current.campaigns).toEqual(latestResponse.data);
    });
    expect(result.current.isRefreshing).toBe(false);

    await act(async () => {
      staleRequest.resolve(staleResponse);
    });

    expect(result.current.campaigns).toEqual(latestResponse.data);
    expect(getCampaignListing).toHaveBeenCalledTimes(3);
    expect(getCampaignListingMetrics).toHaveBeenCalled();
  });

  it('loads listing rows without metrics first for non-metric sorts', async () => {
    const response: CampaignListingResponse = {
      data: [{ campaignId: 'campaign-1', campaign: { name: 'Silver Oaks' } }],
      totalCount: 1,
    };
    const getCampaignListing = jest.fn().mockResolvedValue(response);
    const getCampaignListingMetrics = jest.fn().mockResolvedValue(
      new Map([
        [
          'campaign-1',
          {
            campaign_id: 'campaign-1',
            active_students: 5,
            average_weekly_engagement_time: 12.5,
          },
        ],
      ]),
    );
    const api = {
      getCampaignListing,
      getCampaignListingMetrics,
    } as unknown as ServiceApi;

    const { result } = renderHook(() =>
      useCampaignListingData({
        api,
        page: 1,
        pageSize: 8,
        orderBy: 'campaignName',
        orderDir: 'asc',
        searchTerm: 'silver',
      }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(getCampaignListing).toHaveBeenCalledWith(
      expect.objectContaining({
        includeMetrics: false,
      }),
    );

    await waitFor(() => {
      expect(getCampaignListingMetrics).toHaveBeenCalledWith(['campaign-1']);
    });
  });

  it('reuses cached metrics when the same campaign row is loaded again', async () => {
    const response: CampaignListingResponse = {
      data: [{ campaignId: 'campaign-1', campaign: { name: 'Silver Oaks' } }],
      totalCount: 1,
    };
    const getCampaignListing = jest.fn().mockResolvedValue(response);
    const getCampaignListingMetrics = jest.fn().mockResolvedValue(
      new Map([
        [
          'campaign-1',
          {
            campaign_id: 'campaign-1',
            active_students: 5,
            average_weekly_engagement_time: 12.5,
          },
        ],
      ]),
    );
    const api = {
      getCampaignListing,
      getCampaignListingMetrics,
    } as unknown as ServiceApi;

    const { result, rerender } = renderHook(
      ({ searchTerm }) =>
        useCampaignListingData({
          api,
          page: 1,
          pageSize: 8,
          orderBy: 'campaignName',
          orderDir: 'asc',
          searchTerm,
        }),
      {
        initialProps: { searchTerm: 'silver' },
      },
    );

    await waitFor(() => {
      expect(getCampaignListingMetrics).toHaveBeenCalledTimes(1);
    });

    rerender({ searchTerm: 'silver oaks' });

    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(false);
    });

    expect(getCampaignListing).toHaveBeenCalledTimes(2);
    expect(getCampaignListingMetrics).toHaveBeenCalledTimes(1);
  });
});
