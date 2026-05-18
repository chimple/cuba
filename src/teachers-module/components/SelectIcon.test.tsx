import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SelectIcon from './SelectIcon';
import { logger } from '../../utility/logger';
import { t } from 'i18next';

jest.mock('i18next', () => ({
  t: jest.fn((key: string) => key),
}));

describe('SelectIcon Component', () => {
  const mockClick = jest.fn();
  const mockedT = t as unknown as jest.MockedFunction<(key: string) => string>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedT.mockImplementation((key: string) => key);
  });

  afterEach(() => {
    cleanup();
  });

  test('renders add state with plus icon', () => {
    render(<SelectIcon isSelected={false} onClick={mockClick} />);

    expect(
      document.getElementById('select-Assignmenticon-image'),
    ).toHaveTextContent('+');
    expect(screen.getByText('Add')).toBeInTheDocument();
  });

  test('renders remove state with minus icon', () => {
    render(<SelectIcon isSelected={true} onClick={mockClick} />);

    expect(
      document.getElementById('select-Assignmenticon-image'),
    ).toHaveTextContent('-');
    expect(screen.getByText('Remove')).toBeInTheDocument();
  });

  test('keeps expected ids and classes', () => {
    render(<SelectIcon isSelected={false} onClick={mockClick} />);

    expect(
      document.getElementById('select-Assignmenticon'),
    ).toBeInTheDocument();
    expect(
      document.getElementById('select-Assignmenticon-image'),
    ).toBeInTheDocument();
    expect(document.getElementById('select-text')).toBeInTheDocument();
    expect(
      document.querySelector('.select-icon-container'),
    ).toBeInTheDocument();
    expect(
      document.querySelector('.select-Assignmenticon'),
    ).toBeInTheDocument();
    expect(document.querySelector('.select-text')).toBeInTheDocument();
  });

  test('calls onClick when clicked', () => {
    render(<SelectIcon isSelected={false} onClick={mockClick} />);

    fireEvent.click(document.querySelector('.select-Assignmenticon')!);

    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  test('calls translations for the visible state', () => {
    const { rerender } = render(
      <SelectIcon isSelected={false} onClick={mockClick} />,
    );

    expect(t).toHaveBeenCalledWith('Add');

    rerender(<SelectIcon isSelected={true} onClick={mockClick} />);
    expect(t).toHaveBeenCalledWith('Remove');
  });

  test('updates icon when isSelected changes', () => {
    const { rerender } = render(
      <SelectIcon isSelected={false} onClick={mockClick} />,
    );

    rerender(<SelectIcon isSelected={true} onClick={mockClick} />);

    expect(
      document.getElementById('select-Assignmenticon-image'),
    ).toHaveTextContent('-');
  });

  test('multiple components render and click independently', () => {
    const first = jest.fn();
    const second = jest.fn();

    render(
      <>
        <SelectIcon isSelected={false} onClick={first} />
        <SelectIcon isSelected={true} onClick={second} />
      </>,
    );

    const containers = document.querySelectorAll('.select-Assignmenticon');
    expect(containers).toHaveLength(2);
    fireEvent.click(containers[1]);

    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
  });

  test('mounts, rerenders, and unmounts cleanly', () => {
    const { rerender, unmount } = render(
      <SelectIcon isSelected={false} onClick={mockClick} />,
    );

    for (let i = 0; i < 5; i++) {
      rerender(<SelectIcon isSelected={i % 2 === 0} onClick={mockClick} />);
    }

    expect(
      document.getElementById('select-Assignmenticon-image'),
    ).toBeInTheDocument();
    expect(() => unmount()).not.toThrow();
  });

  test('does not log errors during render', () => {
    const spy = jest.spyOn(logger, 'error').mockImplementation();

    render(<SelectIcon isSelected={false} onClick={mockClick} />);

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
