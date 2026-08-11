import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AudioButton from './AudioButton';

describe('AudioButton', () => {
  test('renders the speaker button with the default aria label', () => {
    const { container } = render(<AudioButton />);

    const button = screen.getByRole('button', { name: 'Play audio' });
    const icon = container.querySelector('img');

    expect(button).toBeInTheDocument();
    expect(icon).toHaveAttribute('src', '/assets/icons/SpeakerIcon.svg');
  });

  test('calls onClick when pressed', () => {
    const onClick = jest.fn();

    render(<AudioButton onClick={onClick} />);

    fireEvent.click(screen.getByRole('button', { name: 'Play audio' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('does not trigger onClick when disabled', () => {
    const onClick = jest.fn();

    render(<AudioButton onClick={onClick} disabled />);

    const button = screen.getByRole('button', { name: 'Play audio' });
    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });

  test('supports custom size and aria label', () => {
    render(<AudioButton ariaLabel="Replay prompt" size={72} />);

    const button = screen.getByRole('button', { name: 'Replay prompt' });

    expect(button).toHaveStyle({ width: '72px', height: '72px' });
  });
});
