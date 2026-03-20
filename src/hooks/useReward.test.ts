import { act, renderHook } from '@testing-library/react';
import { useReward } from './useReward';
import { Util } from '../utility/util';
import { ServiceConfig } from '../services/ServiceConfig';
import { IDLE_REWARD_ID, REWARD_MODAL_SHOWN_DATE } from '../common/constants';

/* ------------------ mocks ------------------ */

jest.mock('../utility/util');

const mockApi = {
  updateUserReward: jest.fn(),
};

describe('useReward', () => {
  const today = new Date().toISOString().split('T')[0];

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();

    jest
      .spyOn(ServiceConfig, 'getI')
      .mockReturnValue({ apiHandler: mockApi } as any);

    (Util.fetchTodaysReward as jest.Mock).mockResolvedValue({
      id: 'reward-1',
    });

    (Util.updateUserReward as jest.Mock).mockResolvedValue(undefined);
  });

  /* -------------------------------------------------- */
  /* checkAndUpdateReward                               */
  /* -------------------------------------------------- */

  test('returns null if no student', async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() => useReward());

    const value = await result.current.checkAndUpdateReward();

    expect(value).toBeNull();
  });

  test('creates idle reward if none exists', async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      id: 'stu-1',
      reward: null,
    });

    (Util.retrieveUserReward as jest.Mock).mockReturnValue({});

    const { result } = renderHook(() => useReward());

    await act(async () => {
      await result.current.checkAndUpdateReward();
    });

    expect(mockApi.updateUserReward).toHaveBeenCalledWith(
      'stu-1',
      IDLE_REWARD_ID,
      expect.any(String),
    );

    expect(Util.updateUserReward).toHaveBeenCalled();
  });

  test('syncs when studentReward exists but local reward missing', async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      id: 'stu-1',
      reward: JSON.stringify({
        reward_id: 'reward-1',
        timestamp: new Date().toISOString(),
      }),
    });

    (Util.retrieveUserReward as jest.Mock).mockReturnValue({});

    const { result } = renderHook(() => useReward());

    await act(async () => {
      await result.current.checkAndUpdateReward();
    });

    expect(Util.updateUserReward).toHaveBeenCalled();
  });

  test('returns reward id if valid today reward found', async () => {
    const rewardObj = {
      reward_id: 'reward-1',
      timestamp: new Date().toISOString(),
    };

    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      id: 'stu-1',
      reward: JSON.stringify(rewardObj),
    });

    (Util.retrieveUserReward as jest.Mock).mockReturnValue({
      reward_id: 'other',
    });

    const { result } = renderHook(() => useReward());

    let returned: string | null = null;

    await act(async () => {
      returned = await result.current.checkAndUpdateReward();
    });

    expect(returned).toBe('reward-1');
    expect(result.current.hasTodayReward).toBe(false);
  });

  /* -------------------------------------------------- */
  /* shouldShowDailyRewardModal                         */
  /* -------------------------------------------------- */

  test('returns false if no student', async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() => useReward());

    const value = await result.current.shouldShowDailyRewardModal();

    expect(value).toBe(false);
  });

  test('returns true if reward not received and not shown today', async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      reward: JSON.stringify({
        reward_id: 'old-reward',
        timestamp: new Date('2020-01-01').toISOString(),
      }),
    });

    sessionStorage.removeItem(REWARD_MODAL_SHOWN_DATE);

    const { result } = renderHook(() => useReward());

    const value = await result.current.shouldShowDailyRewardModal();

    expect(value).toBe(true);
  });

  test('returns false if already shown today', async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      reward: JSON.stringify({
        reward_id: 'old-reward',
        timestamp: new Date('2020-01-01').toISOString(),
      }),
    });

    sessionStorage.setItem(REWARD_MODAL_SHOWN_DATE, new Date().toISOString());

    const { result } = renderHook(() => useReward());

    const value = await result.current.shouldShowDailyRewardModal();

    expect(value).toBe(false);
  });

  test('returns false if reward already received today', async () => {
    const rewardObj = {
      reward_id: 'reward-1',
      timestamp: new Date().toISOString(),
    };

    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      reward: JSON.stringify(rewardObj),
    });

    const { result } = renderHook(() => useReward());

    const value = await result.current.shouldShowDailyRewardModal();

    expect(value).toBe(false);
  });
});
