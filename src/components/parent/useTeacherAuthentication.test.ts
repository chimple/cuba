import { act, renderHook } from '@testing-library/react';
import { useTeacherAuthentication } from './useTeacherAuthentication';

describe('useTeacherAuthentication', () => {
  test('initializes with default state', () => {
    const onAuthenticated = jest.fn();
    const { result } = renderHook(() =>
      useTeacherAuthentication({ onAuthenticated }),
    );

    expect(result.current.enteredDigits).toEqual([]);
    expect(result.current.expectedDigitCount).toBe(2);
    expect(result.current.canSubmit).toBe(false);
    expect(result.current.showError).toBe(false);
  });

  test('adds digits and supports backspace', () => {
    const onAuthenticated = jest.fn();
    const { result } = renderHook(() =>
      useTeacherAuthentication({ onAuthenticated }),
    );

    act(() => {
      result.current.handleKeyPress('1');
      result.current.handleKeyPress('2');
      result.current.handleKeyPress('3');
    });

    expect(result.current.enteredDigits).toEqual(['1', '2']);
    expect(result.current.canSubmit).toBe(true);

    act(() => {
      result.current.handleKeyPress(result.current.backspaceKey);
    });

    expect(result.current.enteredDigits).toEqual(['1']);
    expect(result.current.canSubmit).toBe(false);
  });

  test('sets error state for incorrect answer', () => {
    const onAuthenticated = jest.fn();
    const { result } = renderHook(() =>
      useTeacherAuthentication({
        expectedAnswer: '60',
        onAuthenticated,
      }),
    );

    act(() => {
      result.current.handleKeyPress('6');
      result.current.handleKeyPress('1');
    });

    act(() => {
      result.current.handleSubmit();
    });

    expect(result.current.showError).toBe(true);
    expect(onAuthenticated).not.toHaveBeenCalled();
  });

  test('calls onAuthenticated and resets state for correct answer', () => {
    const onAuthenticated = jest.fn();
    const { result } = renderHook(() =>
      useTeacherAuthentication({
        expectedAnswer: '60',
        onAuthenticated,
      }),
    );

    act(() => {
      result.current.handleKeyPress('6');
      result.current.handleKeyPress('0');
    });

    act(() => {
      result.current.handleSubmit();
    });

    expect(onAuthenticated).toHaveBeenCalledTimes(1);
    expect(result.current.enteredDigits).toEqual([]);
    expect(result.current.showError).toBe(false);
  });

  test('delays onAuthenticated when authenticationDelayMs is provided', () => {
    jest.useFakeTimers();
    const onAuthenticated = jest.fn();
    const { result } = renderHook(() =>
      useTeacherAuthentication({
        expectedAnswer: '60',
        authenticationDelayMs: 160,
        onAuthenticated,
      }),
    );

    act(() => {
      result.current.handleKeyPress('6');
      result.current.handleKeyPress('0');
    });

    let didAuthenticate = false;
    act(() => {
      didAuthenticate = result.current.handleSubmit();
    });

    expect(didAuthenticate).toBe(true);
    expect(onAuthenticated).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(160);
    });

    expect(onAuthenticated).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
});
