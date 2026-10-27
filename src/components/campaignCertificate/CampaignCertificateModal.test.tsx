import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { toPng } from 'html-to-image';
import { EVENTS } from '../../common/constants';
import { AudioUtil } from '../../utility/AudioUtil';
import { Util } from '../../utility/util';
import CampaignCertificateModal from './CampaignCertificateModal';
import {
  CAMPAIGN_CERTIFICATE_EARNED_EVENT,
  showCampaignCertificate,
} from './CampaignCertificateHost';

jest.mock('html-to-image', () => ({ toPng: jest.fn() }));
jest.mock('react-confetti', () => () => <div data-testid="confetti" />);
jest.mock('../../utility/AudioUtil', () => ({
  AudioUtil: {
    playAudioOrTts: jest.fn(),
    stopAudioUrlOrTtsPlayback: jest.fn(),
  },
}));
jest.mock('../../utility/util', () => ({
  Util: {
    logEvent: jest.fn(),
    sendContentToAndroidOrWebShare: jest.fn(),
  },
}));

const certificate = {
  campaignId: 'campaign-1',
  campaignName: 'Chimple Summer League, Jun 2026',
  studentName: 'Madhavi',
  rank: 1 as const,
  awardedAt: '2026-06-28T00:00:00.000Z',
  languageCode: 'en',
  isNewlyEarned: true,
};

describe('CampaignCertificateModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    Object.defineProperty(window, 'atob', {
      configurable: true,
      value: () => 'png',
    });
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

  it('renders the dynamic certificate and records the earned impression', () => {
    render(
      <CampaignCertificateModal
        certificate={certificate}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(certificate.campaignName)).toBeInTheDocument();
    // Student name is kept in the certificate context instead of being printed on the artwork.
    expect(screen.queryByText('Awarded to Madhavi')).not.toBeInTheDocument();
    expect(screen.getByAltText('Campaign reward: 1')).toHaveAttribute(
      'src',
      '/assets/campaignCompetition/Campaign rank1 t2.svg',
    );
    expect(Util.logEvent).toHaveBeenCalledWith(
      EVENTS.CAMPAIGN_CERTIFICATE_EARNED,
      expect.objectContaining({
        campaign_id: certificate.campaignId,
        rank_achieved: 1,
      }),
    );
    expect(Util.logEvent).toHaveBeenCalledWith(
      EVENTS.CAMPAIGN_CERTIFICATE_POPUP_VIEWED,
      expect.any(Object),
    );
  });

  it('plays the localized voice-over after the celebration sounds', () => {
    render(
      <CampaignCertificateModal
        certificate={{ ...certificate, languageCode: 'kn-IN' }}
        onClose={jest.fn()}
      />,
    );

    // Voice-over starts after the 4-second non-overlapping celebration sequence.
    act(() => jest.advanceTimersByTime(4500));
    expect(AudioUtil.playAudioOrTts).toHaveBeenCalledWith({
      audioUrl: '/assets/campaignCompetition/Competition Kannada v3.mp3',
    });
  });

  it('shows stars, captures the certificate, and invokes sharing', async () => {
    (toPng as jest.Mock).mockResolvedValue('data:image/png;base64,cG5n');
    (
      Util.sendContentToAndroidOrWebShare as jest.MockedFunction<
        typeof Util.sendContentToAndroidOrWebShare
      >
    ).mockResolvedValue(undefined);
    render(
      <CampaignCertificateModal
        certificate={certificate}
        onClose={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Share' }));
    // Share-only stars match the StickerBookPreview capture behavior.
    // Hidden decorative stars expose a test id because aria-hidden excludes them from roles.
    expect(
      screen.getAllByTestId('campaign-certificate-share-star'),
    ).toHaveLength(2);
    expect(Util.logEvent).toHaveBeenCalledWith(
      EVENTS.CAMPAIGN_CERTIFICATE_SHARE_CLICKED,
      expect.any(Object),
    );

    await act(async () => {
      jest.advanceTimersByTime(900);
      await Promise.resolve();
    });
    await waitFor(() =>
      expect(Util.sendContentToAndroidOrWebShare).toHaveBeenCalled(),
    );
    expect(toPng).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ pixelRatio: 2 }),
    );
    expect(Util.logEvent).toHaveBeenCalledWith(
      EVENTS.CAMPAIGN_CERTIFICATE_SHARE_SUCCESS,
      expect.any(Object),
    );
  });

  it('dispatches the public event used by completion flows', () => {
    const listener = jest.fn();
    window.addEventListener(CAMPAIGN_CERTIFICATE_EARNED_EVENT, listener);
    showCampaignCertificate(certificate);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ detail: certificate }),
    );
    window.removeEventListener(CAMPAIGN_CERTIFICATE_EARNED_EVENT, listener);
  });
});
