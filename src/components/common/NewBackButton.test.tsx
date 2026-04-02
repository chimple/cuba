import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NewBackButton from './NewBackButton';

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

describe('NewBackButton', () => {
  test('renders the back button icon', () => {
    render(<NewBackButton onClick={jest.fn()} />);
    expect(screen.getByLabelText('Back')).toBeInTheDocument();
  });

  test('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(<NewBackButton onClick={onClick} />);
    fireEvent.click(screen.getByLabelText('Back'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('calls onClick on Enter and Space key', () => {
    const onClick = jest.fn();
    render(<NewBackButton onClick={onClick} />);
    const btn = screen.getByLabelText('Back');
    fireEvent.keyDown(btn, { key: 'Enter' });
    fireEvent.keyDown(btn, { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(2);
  });
});
