import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import BackButton from './BackButton';
import { registerBackButtonHandler } from '../../common/backButtonRegistry';

/* ================= MOCKS ================= */

jest.mock('../../common/backButtonRegistry', () => ({
  registerBackButtonHandler: jest.fn(),
}));

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

/* ================= TESTS ================= */

describe('BackButton Component', () => {
  let mockUnregister: jest.Mock;
  let registeredHandler: any;

  beforeEach(() => {
    mockUnregister = jest.fn();
    (registerBackButtonHandler as jest.Mock).mockImplementation(
      (handler: any) => {
        registeredHandler = handler;
        return mockUnregister;
      },
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  /* ---------- Rendering ---------- */

  test('1. renders back icon', () => {
    render(<BackButton onClicked={jest.fn()} />);
    expect(screen.getByLabelText('Back')).toBeInTheDocument();
  });

  test('2. has correct id', () => {
    render(<BackButton onClicked={jest.fn()} />);
    expect(screen.getByLabelText('Back')).toHaveAttribute(
      'id',
      'common-back-button',
    );
  });

  test('3. aria-label is translated text', () => {
    render(<BackButton onClicked={jest.fn()} />);
    expect(screen.getByLabelText('Back')).toBeVisible();
  });

  /* ---------- Click Behaviour ---------- */

  test('4. calls onClicked on click', () => {
    const mockClick = jest.fn();
    render(<BackButton onClicked={mockClick} />);
    fireEvent.click(screen.getByLabelText('Back'));
    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  test('5. does not crash if onClicked undefined', () => {
    render(<BackButton onClicked={undefined} />);
    fireEvent.click(screen.getByLabelText('Back'));
  });

  /* ---------- Registration ---------- */

  test('6. registers back button handler on mount', () => {
    render(<BackButton onClicked={jest.fn()} />);
    expect(registerBackButtonHandler).toHaveBeenCalledTimes(1);
  });

  test('7. unregister called on unmount', () => {
    const { unmount } = render(<BackButton onClicked={jest.fn()} />);
    unmount();
    expect(mockUnregister).toHaveBeenCalled();
  });

  /* ---------- Handler Execution ---------- */

  test('8. registered handler calls onClicked', () => {
    const mockClick = jest.fn();
    render(<BackButton onClicked={mockClick} />);
    registeredHandler();
    expect(mockClick).toHaveBeenCalled();
  });

  test('9. returns true if onClicked returns undefined', () => {
    render(<BackButton onClicked={() => undefined} />);
    expect(registeredHandler()).toBe(true);
  });

  test('10. returns false if onClicked returns false', () => {
    render(<BackButton onClicked={() => false} />);
    expect(registeredHandler()).toBe(false);
  });

  test('11. returns true if onClicked returns true', () => {
    render(<BackButton onClicked={() => true} />);
    expect(registeredHandler()).toBe(true);
  });

  /* ---------- Ref Updates ---------- */

  test('12. updates handler when onClicked changes', () => {
    const first = jest.fn();
    const second = jest.fn();

    const { rerender } = render(<BackButton onClicked={first} />);
    rerender(<BackButton onClicked={second} />);

    registeredHandler();
    expect(second).toHaveBeenCalled();
    expect(first).not.toHaveBeenCalled();
  });

  test('13. latest handler is always used', () => {
    const first = jest.fn();
    const second = jest.fn();

    const { rerender } = render(<BackButton onClicked={first} />);
    registeredHandler();
    expect(first).toHaveBeenCalled();

    rerender(<BackButton onClicked={second} />);
    registeredHandler();
    expect(second).toHaveBeenCalled();
  });

  /* ---------- Multiple Mounts ---------- */

  test('14. multiple instances register independently', () => {
    render(<BackButton onClicked={jest.fn()} />);
    render(<BackButton onClicked={jest.fn()} />);
    expect(registerBackButtonHandler).toHaveBeenCalledTimes(2);
  });

  /* ---------- Edge Cases ---------- */

  test('15. does not throw if handler not called', () => {
    render(<BackButton onClicked={jest.fn()} />);
  });

  test('16. works with async onClicked', async () => {
    const mockClick = jest.fn().mockResolvedValue(true);
    render(<BackButton onClicked={mockClick} />);
    registeredHandler();
    expect(mockClick).toHaveBeenCalled();
  });

  test('17. handles null return value', () => {
    render(<BackButton onClicked={() => null} />);
    expect(registeredHandler()).toBe(null);
  });

  test('18. handles numeric return value', () => {
    render(<BackButton onClicked={() => 0} />);
    expect(registeredHandler()).toBe(0);
  });

  test('19. handles string return value', () => {
    render(<BackButton onClicked={() => 'done'} />);
    expect(registeredHandler()).toBe('done');
  });

  /* ---------- Click vs Registered ---------- */

  test('20. click and registered handler both call same function', () => {
    const mockClick = jest.fn();
    render(<BackButton onClicked={mockClick} />);
    fireEvent.click(screen.getByLabelText('Back'));
    registeredHandler();
    expect(mockClick).toHaveBeenCalledTimes(2);
  });

  /* ---------- Accessibility ---------- */

  test('21. element has aria-label Back', () => {
    render(<BackButton onClicked={jest.fn()} />);
    expect(screen.getByLabelText('Back')).toHaveAttribute('aria-label', 'Back');
  });

  /* ---------- Cleanup Behaviour ---------- */

  test('22. unregister only once', () => {
    const { unmount } = render(<BackButton onClicked={jest.fn()} />);
    unmount();
    expect(mockUnregister).toHaveBeenCalledTimes(1);
  });

  test('23. re-render does not re-register handler', () => {
    const { rerender } = render(<BackButton onClicked={jest.fn()} />);
    rerender(<BackButton onClicked={jest.fn()} />);
    expect(registerBackButtonHandler).toHaveBeenCalledTimes(1);
  });

  /* ---------- Defensive Cases ---------- */

  test('24. safe if onClicked throws error', () => {
    render(
      <BackButton
        onClicked={() => {
          throw new Error('Test Error');
        }}
      />,
    );
    expect(() => registeredHandler()).toThrow();
  });

  test('25. works when onClicked returns promise false', () => {
    render(<BackButton onClicked={() => Promise.resolve(false)} />);
    registeredHandler();
  });

  test('26. works when onClicked returns promise true', () => {
    render(<BackButton onClicked={() => Promise.resolve(true)} />);
    registeredHandler();
  });

  test('27. multiple clicks trigger multiple calls', () => {
    const mockClick = jest.fn();
    render(<BackButton onClicked={mockClick} />);
    fireEvent.click(screen.getByLabelText('Back'));
    fireEvent.click(screen.getByLabelText('Back'));
    expect(mockClick).toHaveBeenCalledTimes(2);
  });

  test('28. handler returns true when no onClicked provided', () => {
    render(<BackButton onClicked={undefined} />);
    expect(registeredHandler()).toBe(true);
  });

  test('29. handler still works after rerender with same function', () => {
    const mockClick = jest.fn();
    const { rerender } = render(<BackButton onClicked={mockClick} />);
    rerender(<BackButton onClicked={mockClick} />);
    registeredHandler();
    expect(mockClick).toHaveBeenCalled();
  });

  test('30. component mounts and unmounts cleanly', () => {
    const { unmount } = render(<BackButton onClicked={jest.fn()} />);
    expect(() => unmount()).not.toThrow();
  });
});
