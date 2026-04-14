import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import GenericPopup from './GenericPopUp';
import { AudioUtil } from '../../utility/AudioUtil';

jest.mock('../../utility/AudioUtil', () => ({
  AudioUtil: {
    playAudioOrTts: jest.fn(),
    stopAudioUrlOrTtsPlayback: jest.fn(),
  },
}));

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
    expect(AudioUtil.playAudioOrTts).toHaveBeenCalledWith(
      expect.objectContaining({
        audioUrl: '/assets/audios/common/generic_popup_sound_effect.mp3',
        delayMs: 300,
        onComplete: expect.any(Function),
        onCompleteDelayMs: 2000,
      }),
    );
  });

  it('plays popup fallback narration line-by-line after the sound effect completes', () => {
    render(<GenericPopup {...baseProps} />);

    const firstCall = (AudioUtil.playAudioOrTts as jest.Mock).mock
      .calls[0]?.[0];
    firstCall.onComplete();

    expect(AudioUtil.playAudioOrTts).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        text: 'Main heading',
        onCompleteDelayMs: 2000,
        onComplete: expect.any(Function),
      }),
    );

    const secondLineCall = (AudioUtil.playAudioOrTts as jest.Mock).mock
      .calls[1]?.[0];
    secondLineCall.onComplete();

    expect(AudioUtil.playAudioOrTts).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        text: 'Sub heading',
        onCompleteDelayMs: 2000,
        onComplete: expect.any(Function),
      }),
    );

    const thirdLineCall = (AudioUtil.playAudioOrTts as jest.Mock).mock
      .calls[2]?.[0];
    thirdLineCall.onComplete();

    expect(AudioUtil.playAudioOrTts).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({
        text: 'Detail A',
        onCompleteDelayMs: 2000,
        onComplete: expect.any(Function),
      }),
    );

    const fourthLineCall = (AudioUtil.playAudioOrTts as jest.Mock).mock
      .calls[3]?.[0];
    fourthLineCall.onComplete();

    expect(AudioUtil.playAudioOrTts).toHaveBeenNthCalledWith(
      5,
      expect.objectContaining({
        text: 'Detail B',
      }),
    );

    const lastLineCall = (AudioUtil.playAudioOrTts as jest.Mock).mock
      .calls[4]?.[0];
    expect(lastLineCall.onComplete).toBeUndefined();
    expect(lastLineCall.onCompleteDelayMs).toBeUndefined();
  });

  it('plays provided popup audio as a single clip after sound effect', () => {
    render(<GenericPopup {...baseProps} audioUrl="/assets/popup-voice.mp3" />);

    const firstCall = (AudioUtil.playAudioOrTts as jest.Mock).mock
      .calls[0]?.[0];
    firstCall.onComplete();

    expect(AudioUtil.playAudioOrTts).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        audioUrl: '/assets/popup-voice.mp3',
        text: 'Main heading Sub heading Detail A Detail B',
      }),
    );
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
    expect(AudioUtil.stopAudioUrlOrTtsPlayback).toHaveBeenCalled();
  });

  // Covers: calls onAction when CTA is clicked

  it('calls onAction when CTA is clicked', () => {
    render(<GenericPopup {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(baseProps.onAction).toHaveBeenCalledTimes(1);
    expect(baseProps.onClose).not.toHaveBeenCalled();
    expect(AudioUtil.stopAudioUrlOrTtsPlayback).toHaveBeenCalled();
  });

  it('replays audio when the speaker button is clicked', () => {
    render(<GenericPopup {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'Play audio' }));

    expect(AudioUtil.playAudioOrTts).toHaveBeenLastCalledWith(
      expect.objectContaining({
        text: 'Main heading',
        onCompleteDelayMs: 2000,
        onComplete: expect.any(Function),
      }),
    );
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
