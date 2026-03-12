import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import RewardBox from './RewardBox';
import { RewardBoxState } from '../../common/constants';

jest.mock('./RewardRive', () => (props: any) => (
  <div data-testid="reward-rive-state">{String(props.rewardRiveState)}</div>
));

describe('RewardBox', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('renders and switches to IDLE at animation start', async () => {
    render(<RewardBox />);

    await waitFor(() => {
      expect(screen.getByTestId('reward-rive-state')).toHaveTextContent(
        String(RewardBoxState.IDLE),
      );
    });
  });

  test('transitions to SHAKING after idle duration', async () => {
    render(<RewardBox />);

    act(() => {
      jest.advanceTimersByTime(15000);
    });

    await waitFor(() => {
      expect(screen.getByTestId('reward-rive-state')).toHaveTextContent(
        String(RewardBoxState.SHAKING),
      );
    });
  });

  test('invokes onRewardClick on click', () => {
    const onRewardClick = jest.fn();
    render(<RewardBox onRewardClick={onRewardClick} />);

    fireEvent.click(screen.getByTestId('reward-rive-state'));
    expect(onRewardClick).toHaveBeenCalled();
  });

  test('does not fail when onRewardClick is not provided', () => {
    render(<RewardBox />);
    expect(screen.getByTestId('reward-rive-state')).toBeInTheDocument();
  });

  test.each([
    { ms: 0, expected: RewardBoxState.IDLE },
    { ms: 1000, expected: RewardBoxState.IDLE },
    { ms: 14999, expected: RewardBoxState.IDLE },
    { ms: 15000, expected: RewardBoxState.SHAKING },
    { ms: 18000, expected: RewardBoxState.SHAKING },
    { ms: 19999, expected: RewardBoxState.SHAKING },
    { ms: 20000, expected: RewardBoxState.IDLE },
    { ms: 34999, expected: RewardBoxState.SHAKING },
    { ms: 35000, expected: RewardBoxState.SHAKING },
  ])('has state $expected at $ms ms', async ({ ms, expected }) => {
    render(<RewardBox />);
    act(() => {
      jest.advanceTimersByTime(ms);
    });
    await waitFor(() => {
      expect(screen.getByTestId('reward-rive-state')).toHaveTextContent(
        String(expected),
      );
    });
  });

  test('clicking box multiple times calls onRewardClick with exact count', () => {
    const onRewardClick = jest.fn();
    render(<RewardBox onRewardClick={onRewardClick} />);
    const target = screen.getByTestId('reward-rive-state');

    fireEvent.click(target);
    fireEvent.click(target);
    fireEvent.click(target);
    fireEvent.click(target);

    expect(onRewardClick).toHaveBeenCalledTimes(4);
  });

  test('timers do not auto-trigger click callback', () => {
    const onRewardClick = jest.fn();
    render(<RewardBox onRewardClick={onRewardClick} />);
    act(() => {
      jest.advanceTimersByTime(60000);
    });
    expect(onRewardClick).not.toHaveBeenCalled();
  });

  test('renders a single reward rive state node', () => {
    render(<RewardBox />);
    expect(screen.getAllByTestId('reward-rive-state')).toHaveLength(1);
  });

  test('never transitions to BLAST state in idle/shaking loop', async () => {
    render(<RewardBox />);
    act(() => {
      jest.advanceTimersByTime(120000);
    });
    await waitFor(() => {
      expect(screen.getByTestId('reward-rive-state')).not.toHaveTextContent(
        String(RewardBoxState.BLAST),
      );
    });
  });

  test('continues cycling through states over long duration', async () => {
    render(<RewardBox />);
    act(() => {
      jest.advanceTimersByTime(70000);
    });
    await waitFor(() => {
      const val = screen.getByTestId('reward-rive-state').textContent;
      expect([
        String(RewardBoxState.IDLE),
        String(RewardBoxState.SHAKING),
      ]).toContain(val);
    });
  });

  test('can be unmounted during active timer window without throwing', () => {
    const { unmount } = render(<RewardBox />);
    act(() => {
      jest.advanceTimersByTime(12000);
    });
    expect(() => unmount()).not.toThrow();
  });

  test('state remains deterministic across remounts', async () => {
    const { unmount } = render(<RewardBox />);
    act(() => {
      jest.advanceTimersByTime(15000);
    });
    await waitFor(() => {
      expect(screen.getByTestId('reward-rive-state')).toHaveTextContent(
        String(RewardBoxState.SHAKING),
      );
    });
    unmount();
    render(<RewardBox />);
    await waitFor(() => {
      expect(screen.getByTestId('reward-rive-state')).toHaveTextContent(
        String(RewardBoxState.IDLE),
      );
    });
  });

  test('remains idle after short elapsed time', async () => {
    render(<RewardBox />);
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    await waitFor(() => {
      expect(screen.getByTestId('reward-rive-state')).toHaveTextContent(
        String(RewardBoxState.IDLE),
      );
    });
  });

  test('returns to idle after shake window completes', async () => {
    render(<RewardBox />);
    act(() => {
      jest.advanceTimersByTime(20000);
    });
    await waitFor(() => {
      expect(screen.getByTestId('reward-rive-state')).toHaveTextContent(
        String(RewardBoxState.IDLE),
      );
    });
  });

  test('fires callback when clicking wrapper area repeatedly', () => {
    const onRewardClick = jest.fn();
    const { container } = render(<RewardBox onRewardClick={onRewardClick} />);
    const wrapper = container.querySelector('.rewardBox-box-container');
    expect(wrapper).toBeTruthy();
    if (wrapper) {
      fireEvent.click(wrapper);
      fireEvent.click(wrapper);
    }
    expect(onRewardClick).toHaveBeenCalledTimes(2);
  });
});
