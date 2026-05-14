import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import TeacherAuthenticationPopup from './TeacherAuthenticationPopup';

jest.mock('i18next', () => ({
  t: (value: string, options?: Record<string, string | number>) => {
    if (!options) {
      return value;
    }
    return value.replace(/{{(\w+)}}/g, (_, key: string) =>
      String(options[key] ?? `{{${key}}}`),
    );
  },
}));

const renderPopup = (
  props?: Partial<React.ComponentProps<typeof TeacherAuthenticationPopup>>,
) => {
  const baseProps: React.ComponentProps<typeof TeacherAuthenticationPopup> = {
    isOpen: true,
    onClose: jest.fn(),
    onAuthenticated: jest.fn(),
    expectedAnswer: '60',
    questionText: 'How much is 34 + 26 = ?',
  };

  return render(<TeacherAuthenticationPopup {...baseProps} {...props} />);
};

describe('TeacherAuthenticationPopup', () => {
  test('does not render when isOpen is false', () => {
    renderPopup({ isOpen: false });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('renders when isOpen is true', () => {
    renderPopup();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByText('This question is for the Teacher:'),
    ).toBeInTheDocument();
  });

  test('close button resets and calls onClose', () => {
    const onClose = jest.fn();
    renderPopup({ onClose });

    fireEvent.click(
      screen.getByRole('button', { name: 'Close authentication popup' }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('submit is disabled until all required digits are entered', () => {
    renderPopup();

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    expect(submitButton).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Key 6' }));
    expect(submitButton).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Key 0' }));
    expect(submitButton).toBeEnabled();
  });

  test('backspace is hidden until at least one digit is entered', () => {
    renderPopup();

    expect(
      screen.queryByRole('button', { name: 'Backspace' }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Key 1' }));
    expect(screen.getByRole('button', { name: 'Backspace' })).toBeEnabled();
  });

  test('shows error for incorrect answer', () => {
    renderPopup();

    fireEvent.click(screen.getByRole('button', { name: 'Key 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Key 2' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(
      screen.getByText('Wrong Answer, please try again.'),
    ).toBeInTheDocument();
  });

  test('calls onAuthenticated for correct answer', () => {
    jest.useFakeTimers();
    const onAuthenticated = jest.fn();
    renderPopup({ onAuthenticated });

    fireEvent.click(screen.getByRole('button', { name: 'Key 6' }));
    fireEvent.click(screen.getByRole('button', { name: 'Key 0' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onAuthenticated).not.toHaveBeenCalled();
    act(() => {
      jest.runOnlyPendingTimers();
    });
    expect(onAuthenticated).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  test('generates a random addition question when popup opens without overrides', () => {
    renderPopup({
      expectedAnswer: undefined,
      questionText: undefined,
    });

    const questionElement = screen.getByText(/How much is \d+ \+ \d+ = \?/);
    const matches = questionElement.textContent?.match(/\d+/g);
    expect(matches).not.toBeNull();
    if (!matches || matches.length < 2) {
      return;
    }

    const firstNumber = Number(matches[0]);
    const secondNumber = Number(matches[1]);
    const result = firstNumber + secondNumber;
    expect(firstNumber).toBeGreaterThanOrEqual(10);
    expect(secondNumber).toBeGreaterThanOrEqual(10);
    expect(result).toBeGreaterThan(10);
    expect(result).toBeLessThan(100);
  });
});
