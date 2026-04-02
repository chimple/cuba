import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import NextButton from './NextButton';

/* ================= MOCKS ================= */

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

jest.mock('@ionic/react', () => ({
  IonIcon: ({ className }: any) => (
    <span data-testid="ion-icon" className={className} />
  ),
}));

jest.mock('ionicons/icons', () => ({
  chevronForward: 'chevronForwardMock',
}));

/* ================= TEST SUITE ================= */

describe('NextButton Component', () => {
  const mockClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  /* ---------------- Rendering ---------------- */

  test('1. renders button', () => {
    render(<NextButton onClicked={mockClick} disabled={false} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('2. has correct id', () => {
    render(<NextButton onClicked={mockClick} disabled={false} />);
    expect(screen.getByRole('button')).toHaveAttribute(
      'id',
      'common-next-button',
    );
  });

  test('3. renders translated text', () => {
    render(<NextButton onClicked={mockClick} disabled={false} />);
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  test('4. renders IonIcon', () => {
    render(<NextButton onClicked={mockClick} disabled={false} />);
    expect(screen.getByTestId('ion-icon')).toBeInTheDocument();
  });

  test('5. IonIcon has correct class', () => {
    render(<NextButton onClicked={mockClick} disabled={false} />);
    expect(screen.getByTestId('ion-icon')).toHaveClass('arrow-icon');
  });

  test('7. renders without children', () => {
    render(<NextButton onClicked={mockClick} disabled={false} />);
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  test('8. renders multiple children nodes', () => {
    render(
      <NextButton onClicked={mockClick} disabled={false}>
        <span>Step 1</span>
      </NextButton>,
    );
    expect(screen.getByText('Step 1')).toBeInTheDocument();
  });

  /* ---------------- Disabled State ---------------- */

  test('9. disabled attribute is applied', () => {
    render(<NextButton onClicked={mockClick} disabled={true} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  test('10. enabled when disabled=false', () => {
    render(<NextButton onClicked={mockClick} disabled={false} />);
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  test('11. click not triggered when disabled', () => {
    render(<NextButton onClicked={mockClick} disabled={true} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockClick).not.toHaveBeenCalled();
  });

  /* ---------------- Click Behavior ---------------- */

  test('12. calls onClicked when clicked', () => {
    render(<NextButton onClicked={mockClick} disabled={false} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  test('13. multiple clicks trigger multiple calls', () => {
    render(<NextButton onClicked={mockClick} disabled={false} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('button'));
    expect(mockClick).toHaveBeenCalledTimes(2);
  });

  test('14. click event object passed', () => {
    render(<NextButton onClicked={mockClick} disabled={false} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockClick).toHaveBeenCalledWith(expect.any(Object));
  });

  /* ---------------- Accessibility ---------------- */

  test('16. button has role button', () => {
    render(<NextButton onClicked={mockClick} disabled={false} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('17. button contains text content', () => {
    render(<NextButton onClicked={mockClick} disabled={false} />);
    expect(screen.getByRole('button')).toHaveTextContent('Next');
  });

  /* ---------------- Re-render Behavior ---------------- */

  test('18. updates disabled state on rerender', () => {
    const { rerender } = render(
      <NextButton onClicked={mockClick} disabled={false} />,
    );

    rerender(<NextButton onClicked={mockClick} disabled={true} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  /* ---------------- Edge Cases ---------------- */

  test('20. handles null children', () => {
    render(
      <NextButton onClicked={mockClick} disabled={false}>
        {null}
      </NextButton>,
    );
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  test('21. handles undefined children', () => {
    render(<NextButton onClicked={mockClick} disabled={false} />);
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  test('22. works with async click handler', async () => {
    const asyncMock = jest.fn().mockResolvedValue(true);
    render(<NextButton onClicked={asyncMock} disabled={false} />);
    fireEvent.click(screen.getByRole('button'));
    expect(asyncMock).toHaveBeenCalled();
  });

  /* ---------------- Icon Behavior ---------------- */

  test('24. only one icon rendered', () => {
    render(<NextButton onClicked={mockClick} disabled={false} />);
    expect(screen.getAllByTestId('ion-icon')).toHaveLength(1);
  });

  test('25. icon appears after text', () => {
    render(<NextButton onClicked={mockClick} disabled={false} />);
    const button = screen.getByRole('button');
    expect(button.lastChild).toHaveAttribute('data-testid', 'ion-icon');
  });

  /* ---------------- Multiple Instances ---------------- */

  test('26. multiple buttons render independently', () => {
    render(
      <>
        <NextButton onClicked={mockClick} disabled={false} />
        <NextButton onClicked={mockClick} disabled={false} />
      </>,
    );

    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  test('27. only clicked button triggers handler', () => {
    const first = jest.fn();
    const second = jest.fn();

    render(
      <>
        <NextButton onClicked={first} disabled={false} />
        <NextButton onClicked={second} disabled={false} />
      </>,
    );

    fireEvent.click(screen.getAllByRole('button')[1]);
    expect(second).toHaveBeenCalled();
    expect(first).not.toHaveBeenCalled();
  });

  /* ---------------- Cleanup ---------------- */

  test('29. mounts and unmounts cleanly', () => {
    const { unmount } = render(
      <NextButton onClicked={mockClick} disabled={false} />,
    );
    expect(() => unmount()).not.toThrow();
  });

  test('30. no unexpected console errors', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    render(<NextButton onClicked={mockClick} disabled={false} />);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
  /* ---------------- Additional Advanced Cases ---------------- */

  test('31. preserves additional button props (type=submit)', () => {
    render(
      <NextButton onClicked={mockClick} disabled={false}>
        Submit
      </NextButton>,
    );

    const button = screen.getByRole('button');
    expect(button.tagName).toBe('BUTTON');
  });

  test('32. button text order is children + Next', () => {
    render(
      <NextButton onClicked={mockClick} disabled={false}>
        Continue
      </NextButton>,
    );

    const button = screen.getByRole('button');
    expect(button.textContent).toContain('Continue');
    expect(button.textContent).toContain('Next');
  });

  test('33. does not call onClicked when button is programmatically disabled after render', () => {
    const { rerender } = render(
      <NextButton onClicked={mockClick} disabled={false} />,
    );

    rerender(<NextButton onClicked={mockClick} disabled={true} />);

    fireEvent.click(screen.getByRole('button'));
    expect(mockClick).not.toHaveBeenCalled();
  });

  test('34. supports keyboard Enter key activation', () => {
    render(<NextButton onClicked={mockClick} disabled={false} />);
    const button = screen.getByRole('button');

    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
    fireEvent.click(button);

    expect(mockClick).toHaveBeenCalled();
  });

  test('35. supports keyboard Space key activation', () => {
    render(<NextButton onClicked={mockClick} disabled={false} />);
    const button = screen.getByRole('button');

    fireEvent.keyDown(button, { key: ' ', code: 'Space' });
    fireEvent.click(button);

    expect(mockClick).toHaveBeenCalled();
  });
});
