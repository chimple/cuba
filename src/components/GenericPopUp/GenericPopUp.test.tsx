import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import GenericPopup from './GenericPopUp';

describe('GenericPopup', () => {
  const baseProps = {
    thumbnailImageUrl: '/assets/thumb.png',
    backgroundImageUrl: '/assets/bg.png',
    heading: 'Main heading',
    subHeading: 'Sub heading',
    details: ['Detail A', 'Detail B'],
    buttonText: 'Continue',
    onClose: jest.fn(),
    onAction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Covers: renders heading, subheading, details, thumbnail, background, and CTA

  it('renders heading, subheading, details, thumbnail, background, and CTA', () => {
    render(<GenericPopup {...baseProps} />);

    expect(screen.getByText('Main heading')).toBeInTheDocument();
    expect(screen.getByText('Sub heading')).toBeInTheDocument();
    expect(screen.getByText('Detail A')).toBeInTheDocument();
    expect(screen.getByText('Detail B')).toBeInTheDocument();
    expect(screen.getByText('Continue')).toBeInTheDocument();
    expect(screen.getByAltText('close')).toBeInTheDocument();

    const thumbnail = document.getElementById('generic-popup-thumb');
    const background = document.getElementById('generic-popup-bg-image');
    expect(thumbnail).toHaveAttribute('src', '/assets/thumb.png');
    expect(background).toHaveAttribute('src', '/assets/bg.png');
  });

  // Covers: omits optional subheading and details when absent

  it('omits optional subheading and details when absent', () => {
    render(
      <GenericPopup
        {...baseProps}
        backgroundImageUrl={undefined}
        subHeading={undefined}
        details={[]}
      />,
    );

    expect(screen.getByText('Main heading')).toBeInTheDocument();
    expect(screen.queryByText('Sub heading')).not.toBeInTheDocument();
    expect(screen.queryByText('Detail A')).not.toBeInTheDocument();
    expect(
      document.getElementById('generic-popup-details'),
    ).not.toBeInTheDocument();
    expect(
      document.getElementById('generic-popup-bg-image'),
    ).not.toHaveAttribute('src');
  });

  // Covers: calls onClose when close button is clicked

  it('calls onClose when close button is clicked', () => {
    render(<GenericPopup {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /close/i }));

    expect(baseProps.onClose).toHaveBeenCalledTimes(1);
    expect(baseProps.onAction).not.toHaveBeenCalled();
  });

  // Covers: calls onAction when CTA is clicked

  it('calls onAction when CTA is clicked', () => {
    render(<GenericPopup {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(baseProps.onAction).toHaveBeenCalledTimes(1);
    expect(baseProps.onClose).not.toHaveBeenCalled();
  });

  // Covers: handles rapid CTA clicks without dropping events

  it('handles rapid CTA clicks without dropping events', () => {
    render(<GenericPopup {...baseProps} />);
    const cta = screen.getByRole('button', { name: 'Continue' });

    fireEvent.click(cta);
    fireEvent.click(cta);

    expect(baseProps.onAction).toHaveBeenCalledTimes(2);
  });

  // Covers: updates rendered content on rerender

  it('updates rendered content on rerender', () => {
    const { rerender } = render(<GenericPopup {...baseProps} />);

    rerender(
      <GenericPopup
        {...baseProps}
        heading="Updated heading"
        subHeading="Updated sub heading"
        details={['New detail']}
        buttonText="Go"
      />,
    );

    expect(screen.getByText('Updated heading')).toBeInTheDocument();
    expect(screen.getByText('Updated sub heading')).toBeInTheDocument();
    expect(screen.getByText('New detail')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument();
  });

  // Covers: renders correctly when details prop is omitted entirely (defaults to empty)

  it('renders correctly when details prop is omitted entirely (defaults to empty)', () => {
    const { thumbnailImageUrl, heading, buttonText, onClose, onAction } =
      baseProps;
    render(
      <GenericPopup
        thumbnailImageUrl={thumbnailImageUrl}
        heading={heading}
        buttonText={buttonText}
        onClose={onClose}
        onAction={onAction}
      />,
    );

    expect(screen.getByText('Main heading')).toBeInTheDocument();
    expect(
      document.getElementById('generic-popup-details'),
    ).not.toBeInTheDocument();
  });

  // Covers: fires correct handler for close then CTA in sequence

  it('fires correct handler for close then CTA in sequence', () => {
    render(<GenericPopup {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(baseProps.onClose).toHaveBeenCalledTimes(1);
    expect(baseProps.onAction).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(baseProps.onAction).toHaveBeenCalledTimes(1);
    expect(baseProps.onClose).toHaveBeenCalledTimes(1);
  });
});
