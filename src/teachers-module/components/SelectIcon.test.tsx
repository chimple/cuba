import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import SelectIcon from './SelectIcon';

/* ================= MOCKS ================= */

jest.mock('i18next', () => ({
  t: jest.fn((key: string) => key),
}));

/* ================= TEST SUITE ================= */

describe('SelectIcon Component', () => {
  const mockClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  /* ---------------- Rendering ---------------- */

  test('1. renders container', () => {
    render(<SelectIcon isSelected={false} onClick={mockClick} />);
    expect(
      screen.getByRole('img', { name: 'Assignment_Icon' }),
    ).toBeInTheDocument();
  });

  test('2. renders correct ids', () => {
    render(<SelectIcon isSelected={false} onClick={mockClick} />);
    expect(
      document.getElementById('select-Assignmenticon'),
    ).toBeInTheDocument();
    expect(
      document.getElementById('select-Assignmenticon-image'),
    ).toBeInTheDocument();
    expect(document.getElementById('select-text')).toBeInTheDocument();
  });

  /* ---------------- isSelected = false ---------------- */

  test('4. shows default icon when not selected', () => {
    render(<SelectIcon isSelected={false} onClick={mockClick} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'assets/icons/assignmentSelect.svg');
  });

  test('6. shows green icon when selected', () => {
    render(<SelectIcon isSelected={true} onClick={mockClick} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute(
      'src',
      'assets/icons/assignmentSelectGreen.svg',
    );
  });

  /* ---------------- Click Behavior ---------------- */

  test('7. calls onClick when clicked', () => {
    render(<SelectIcon isSelected={false} onClick={mockClick} />);
    fireEvent.click(document.querySelector('.select-icon-container')!);
    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  test('8. multiple clicks trigger multiple calls', () => {
    render(<SelectIcon isSelected={false} onClick={mockClick} />);
    const container = document.querySelector('.select-icon-container')!;
    fireEvent.click(container);
    fireEvent.click(container);
    expect(mockClick).toHaveBeenCalledTimes(2);
  });

  test('9. click event object passed', () => {
    render(<SelectIcon isSelected={false} onClick={mockClick} />);
    fireEvent.click(document.querySelector('.select-icon-container')!);
    expect(mockClick).toHaveBeenCalledWith(expect.any(Object));
  });

  /* ---------------- Translation ---------------- */

  test('10. calls t with Add when not selected', () => {
    const { t } = require('i18next');
    render(<SelectIcon isSelected={false} onClick={mockClick} />);
    expect(t).toHaveBeenCalledWith('Add');
  });

  test('11. calls t with Remove when selected', () => {
    const { t } = require('i18next');
    render(<SelectIcon isSelected={true} onClick={mockClick} />);
    expect(t).toHaveBeenCalledWith('Remove');
  });

  test('13. updates icon when isSelected changes', () => {
    const { rerender } = render(
      <SelectIcon isSelected={false} onClick={mockClick} />,
    );

    rerender(<SelectIcon isSelected={true} onClick={mockClick} />);
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'assets/icons/assignmentSelectGreen.svg',
    );
  });

  /* ---------------- Accessibility ---------------- */

  test('14. image has correct alt text', () => {
    render(<SelectIcon isSelected={false} onClick={mockClick} />);
    expect(
      screen.getByRole('img', { name: 'Assignment_Icon' }),
    ).toBeInTheDocument();
  });

  /* ---------------- Edge Cases ---------------- */

  test('16. handles undefined onClick safely', () => {
    render(<SelectIcon isSelected={false} onClick={undefined as any} />);
    fireEvent.click(document.querySelector('.select-icon-container')!);
  });

  test('17. handles null onClick safely', () => {
    render(<SelectIcon isSelected={false} onClick={null as any} />);
    fireEvent.click(document.querySelector('.select-icon-container')!);
  });

  test('18. does not crash when rapidly re-rendered', () => {
    const { rerender } = render(
      <SelectIcon isSelected={false} onClick={mockClick} />,
    );

    for (let i = 0; i < 10; i++) {
      rerender(<SelectIcon isSelected={i % 2 === 0} onClick={mockClick} />);
    }

    expect(true).toBe(true);
  });

  /* ---------------- Multiple Instances ---------------- */

  test('19. multiple components render independently', () => {
    render(
      <>
        <SelectIcon isSelected={false} onClick={mockClick} />
        <SelectIcon isSelected={true} onClick={mockClick} />
      </>,
    );

    expect(screen.getAllByRole('img')).toHaveLength(2);
  });

  test('20. clicking one does not trigger other handler', () => {
    const first = jest.fn();
    const second = jest.fn();

    render(
      <>
        <SelectIcon isSelected={false} onClick={first} />
        <SelectIcon isSelected={false} onClick={second} />
      </>,
    );

    const containers = document.querySelectorAll('.select-icon-container');
    fireEvent.click(containers[1]);
    expect(second).toHaveBeenCalled();
    expect(first).not.toHaveBeenCalled();
  });

  /* ---------------- Structural ---------------- */

  test('21. container has correct class', () => {
    render(<SelectIcon isSelected={false} onClick={mockClick} />);
    expect(
      document.querySelector('.select-icon-container'),
    ).toBeInTheDocument();
  });

  test('22. icon wrapper has correct class', () => {
    render(<SelectIcon isSelected={false} onClick={mockClick} />);
    expect(
      document.querySelector('.select-Assignmenticon'),
    ).toBeInTheDocument();
  });

  test('23. text span has correct class', () => {
    render(<SelectIcon isSelected={false} onClick={mockClick} />);
    expect(document.querySelector('.select-text')).toBeInTheDocument();
  });

  test('27. image src switches correctly', () => {
    const { rerender } = render(
      <SelectIcon isSelected={false} onClick={mockClick} />,
    );
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'assets/icons/assignmentSelect.svg',
    );

    rerender(<SelectIcon isSelected={true} onClick={mockClick} />);
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'assets/icons/assignmentSelectGreen.svg',
    );
  });

  /* ---------------- Cleanup ---------------- */

  test('28. mounts and unmounts cleanly', () => {
    const { unmount } = render(
      <SelectIcon isSelected={false} onClick={mockClick} />,
    );
    expect(() => unmount()).not.toThrow();
  });

  test('29. no console errors during render', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    render(<SelectIcon isSelected={false} onClick={mockClick} />);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  test('30. component handles rapid clicks safely', () => {
    render(<SelectIcon isSelected={false} onClick={mockClick} />);
    const container = document.querySelector('.select-icon-container')!;

    for (let i = 0; i < 10; i++) {
      fireEvent.click(container);
    }

    expect(mockClick).toHaveBeenCalledTimes(10);
  });

  test('33. image element persists after multiple re-renders', () => {
    const { rerender } = render(
      <SelectIcon isSelected={false} onClick={mockClick} />,
    );

    for (let i = 0; i < 5; i++) {
      rerender(<SelectIcon isSelected={i % 2 === 0} onClick={mockClick} />);
    }

    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  test('34. clicking image triggers onClick (event bubbling)', () => {
    render(<SelectIcon isSelected={false} onClick={mockClick} />);
    const img = screen.getByRole('img');
    fireEvent.click(img);
    expect(mockClick).toHaveBeenCalledTimes(1);
  });
  /* ---------------- Extra Edge Cases ---------------- */

  test('36. image alt text remains constant regardless of selection state', () => {
    const { rerender } = render(
      <SelectIcon isSelected={false} onClick={mockClick} />,
    );

    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Assignment_Icon');

    rerender(<SelectIcon isSelected={true} onClick={mockClick} />);
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Assignment_Icon');
  });

  test('37. component renders correct number of span elements', () => {
    render(<SelectIcon isSelected={false} onClick={mockClick} />);
    const spans = document.querySelectorAll('span');
    expect(spans.length).toBe(1);
  });

  test('38. container remains clickable after state toggle', () => {
    const { rerender } = render(
      <SelectIcon isSelected={false} onClick={mockClick} />,
    );

    rerender(<SelectIcon isSelected={true} onClick={mockClick} />);

    const container = document.querySelector('.select-icon-container')!;
    fireEvent.click(container);

    expect(mockClick).toHaveBeenCalledTimes(1);
  });
});
