import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import BadgeCelebrationModal from './BadgeCelebrationModal';
import { AudioUtil } from '../../utility/AudioUtil';
import { Util } from '../../utility/util';
import { toPng } from 'html-to-image';

jest.mock('react-confetti', () => () => <div data-testid="confetti" />);
jest.mock('html-to-image', () => ({ toPng: jest.fn() }));
jest.mock('../../utility/AudioUtil', () => ({
  AudioUtil: {
    playAudioOrTts: jest.fn(),
    stopAudioUrlOrTtsPlayback: jest.fn(),
  },
}));
jest.mock('../../utility/util', () => ({
  Util: {
    sendContentToAndroidOrWebShare: jest.fn().mockResolvedValue(undefined),
  },
}));
jest.mock('../../common/Badges/badgeAnalytics', () => ({
  logBadgeEvent: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../common/AudioButton', () => ({
  __esModule: true,
  default: ({
    onClick,
    ariaLabel,
  }: {
    onClick: () => void;
    ariaLabel: string;
  }) => (
    <button type="button" aria-label={ariaLabel} onClick={onClick}>
      audio
    </button>
  ),
}));
jest.mock('../InlineSvg', () => ({
  __esModule: true,
  default: () => <svg data-testid="shared-badge" />,
}));
jest.mock('../../common/Badges/Badge', () => ({
  __esModule: true,
  default: ({ number }: { number: number }) => (
    <span data-testid="generated-badge">{number}</span>
  ),
}));
jest.mock('i18next', () => ({
  t: (key: string, options?: { defaultValue?: string; count?: number }) =>
    options?.defaultValue?.replace('{{count}}', String(options.count ?? '')) ??
    key,
}));

const mockedToPng = toPng as jest.MockedFunction<typeof toPng>;
const mockedAudioUtil = AudioUtil as jest.Mocked<typeof AudioUtil>;
const mockedShare = Util.sendContentToAndroidOrWebShare as jest.Mock;

describe('BadgeCelebrationModal', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockedToPng.mockResolvedValue('data:image/png;base64,ZmFrZQ==');
    Object.defineProperty(global, 'Audio', {
      configurable: true,
      value: jest.fn().mockImplementation(() => ({
        play: jest.fn().mockResolvedValue(undefined),
        pause: jest.fn(),
      })),
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders no popup without a milestone', () => {
    const { container } = render(
      <BadgeCelebrationModal milestone={null} onClose={jest.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the localized completion content and starts celebration audio', () => {
    render(
      <BadgeCelebrationModal
        milestone={250}
        languageCode="en"
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByTestId('confetti')).toBeInTheDocument();
    expect(screen.getByTestId('generated-badge')).toHaveTextContent('250');
    expect(screen.getByText('250 lessons complete!')).toBeInTheDocument();
    expect(Audio).toHaveBeenCalledTimes(2);
    expect(mockedAudioUtil.playAudioOrTts).not.toHaveBeenCalled();

    jest.advanceTimersByTime(2600);

    expect(mockedAudioUtil.playAudioOrTts).toHaveBeenCalledWith({
      audioUrl: '/assets/audios/badgeCollected/Badge collected English.mp3',
    });
  });

  it('uses the latest milestone inside the badge and the lesson count in the copy', () => {
    render(
      <BadgeCelebrationModal
        milestone={250}
        progress={{
          lessons_played_count: 253,
          latest_badge_milestone: 250,
          has_unseen_badge: false,
        }}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByTestId('generated-badge')).toHaveTextContent('250');
    expect(screen.getByText('253 lessons complete!')).toBeInTheDocument();
  });

  it('replays audio, closes, and shares the badge artwork', async () => {
    const onClose = jest.fn();
    render(<BadgeCelebrationModal milestone={300} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Replay audio' }));
    expect(mockedAudioUtil.playAudioOrTts).toHaveBeenCalledWith({
      audioUrl: '/assets/audios/badgeCollected/Badge collected English.mp3',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /share/i }));
    await waitFor(() => expect(mockedShare).toHaveBeenCalled());
    expect(mockedToPng).toHaveBeenCalled();
  });

  it('uses the final badge voiceover for milestone 3000', () => {
    render(
      <BadgeCelebrationModal
        milestone={3000}
        languageCode="kn"
        onClose={jest.fn()}
      />,
    );

    jest.advanceTimersByTime(2600);

    expect(mockedAudioUtil.playAudioOrTts).toHaveBeenCalledWith({
      audioUrl: '/assets/audios/lastBadgeCollected/Last Badge Kannada.mp3',
    });
  });
});
