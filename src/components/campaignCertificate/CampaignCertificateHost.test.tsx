import { act, render, screen } from '@testing-library/react';
import CampaignCertificateHost, {
  CAMPAIGN_CERTIFICATE_HOME_READY_EVENT,
  showCampaignCertificate,
} from './CampaignCertificateHost';

jest.mock('../../utility/util', () => ({
  Util: { logEvent: jest.fn(), sendContentToAndroidOrWebShare: jest.fn() },
}));

jest.mock('react-confetti', () => () => <div data-testid="confetti" />);
jest.mock('../../utility/AudioUtil', () => ({
  AudioUtil: {
    playAudioOrTts: jest.fn(),
    stopAudioUrlOrTtsPlayback: jest.fn(),
  },
}));

describe('CampaignCertificateHost', () => {
  beforeEach(() => {
    jest.useFakeTimers();
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

  it('renders the modal when the public certificate event is dispatched', () => {
    window.history.pushState({}, '', '/home');
    render(
      <>
        <CampaignCertificateHost />
      </>,
    );

    act(() => {
      showCampaignCertificate({
        campaignId: 'campaign-1',
        campaignName: 'Summer League',
        studentName: 'Madhavi',
        rank: 1,
        awardedAt: '2026-06-28T00:00:00.000Z',
      });
    });

    // The host is the single orchestration point for certificate popup rendering.
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Summer League')).toBeInTheDocument();
  });

  it('displays a queued player certificate when Home becomes active', () => {
    window.history.pushState({}, '', '/lido-player');
    render(<CampaignCertificateHost />);

    act(() => {
      showCampaignCertificate({
        campaignId: 'campaign-queued',
        campaignName: 'Queued League',
        studentName: 'Madhavi',
        rank: 3,
        awardedAt: '2026-06-28T00:00:00.000Z',
      });
      window.history.pushState({}, '', '/home');
      window.dispatchEvent(new Event(CAMPAIGN_CERTIFICATE_HOME_READY_EVENT));
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Queued League')).toBeInTheDocument();
  });
});
