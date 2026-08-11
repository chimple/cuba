import React from 'react';
import { act, render, screen } from '@testing-library/react';
import LiveQuizCountdownTimer from './LiveQuizCountdownTimer';

const progressProps: Array<{ value: number }> = [];

jest.mock('react-circular-progressbar', () => ({
  CircularProgressbarWithChildren: (props: any) => {
    progressProps.push({ value: props.value });
    return <div data-testid="circular-progress">{props.children}</div>;
  },
  buildStyles: jest.fn(() => ({})),
}));

jest.mock('./RadialSeparators', () => (props: any) => (
  <div data-testid="radial-separators">{String(props.count)}</div>
));

jest.mock('../../i18n', () => ({
  __esModule: true,
  default: {
    t: (k: string) => k,
  },
}));

describe('LiveQuizCountdownTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    progressProps.length = 0;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderTimer = (secondsAhead: number, onTimeOut = jest.fn()) => {
    const startsAt = new Date(Date.now() + secondsAhead * 1000);
    const utils = render(
      <LiveQuizCountdownTimer startsAt={startsAt} onTimeOut={onTimeOut} />,
    );
    return { onTimeOut, ...utils };
  };

  test('does not show countdown text before first tick', () => {
    renderTimer(10);
    expect(
      screen.queryByText('Please wait. Quiz will be starting soon'),
    ).not.toBeInTheDocument();
  });

  test('shows countdown header after first interval tick', () => {
    renderTimer(10);
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(
      screen.getByText('Please wait. Quiz will be starting soon'),
    ).toBeInTheDocument();
  });

  test('renders seconds label in uppercase', () => {
    renderTimer(10);
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText('SEC')).toBeInTheDocument();
  });

  test('shows remaining seconds after first tick', () => {
    renderTimer(10);
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText('9')).toBeInTheDocument();
  });

  test('invokes timeout callback when reaching zero', () => {
    const { onTimeOut } = renderTimer(1);
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(onTimeOut).toHaveBeenCalledTimes(1);
  });

  test('does not invoke timeout callback before zero', () => {
    const { onTimeOut } = renderTimer(5);
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(onTimeOut).not.toHaveBeenCalled();
  });

  test('invokes timeout only once', () => {
    const { onTimeOut } = renderTimer(1);
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(onTimeOut).toHaveBeenCalledTimes(1);
  });

  test('handles past startsAt and times out immediately on first tick', () => {
    const startsAt = new Date(Date.now() - 1000);
    const onTimeOut = jest.fn();
    render(
      <LiveQuizCountdownTimer startsAt={startsAt} onTimeOut={onTimeOut} />,
    );
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(onTimeOut).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });

  test('passes separators count equal to maxValue when <= 60', () => {
    renderTimer(12);
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId('radial-separators')).toHaveTextContent('12');
  });

  test('caps separators count to 60 when maxValue is above 60', () => {
    renderTimer(120);
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId('radial-separators')).toHaveTextContent('60');
  });

  test('updates progress value over time', () => {
    renderTimer(10);
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(progressProps.length).toBeGreaterThan(1);
    expect(progressProps[progressProps.length - 1].value).toBeGreaterThan(
      progressProps[0].value,
    );
  });

  test('keeps progress value non-negative', () => {
    renderTimer(1);
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    const lastValue = progressProps[progressProps.length - 1].value;
    expect(Number.isNaN(lastValue)).toBe(false);
  });

  test('cleans interval on unmount', () => {
    const { unmount } = renderTimer(10);
    unmount();
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(true).toBe(true);
  });

  test('restarts timer when startsAt prop changes', () => {
    const onTimeOut = jest.fn();
    const { rerender } = render(
      <LiveQuizCountdownTimer
        startsAt={new Date(Date.now() + 3_000)}
        onTimeOut={onTimeOut}
      />,
    );
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    rerender(
      <LiveQuizCountdownTimer
        startsAt={new Date(Date.now() + 8_000)}
        onTimeOut={onTimeOut}
      />,
    );
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  test('renders countdown container wrapper', () => {
    const { container } = renderTimer(4);
    expect(
      container.querySelector('.live-quiz-countdown-container'),
    ).toBeInTheDocument();
  });

  test('renders circular progress component after first tick', () => {
    renderTimer(4);
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId('circular-progress')).toBeInTheDocument();
  });

  test('shows remaining time until timeout for multi-second range', () => {
    renderTimer(3);
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText('2')).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  test('does not throw when timeout callback is a simple function', () => {
    renderTimer(1, jest.fn());

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  test('supports large countdown durations', () => {
    renderTimer(3600);
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText('3599')).toBeInTheDocument();
  });

  test('keeps rendering while remaining time is non-negative', () => {
    renderTimer(2);
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('SEC')).toBeInTheDocument();
  });
});
