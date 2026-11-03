import { act, render, screen } from '@testing-library/react';
import CampaignCertificateHost, {
  showCampaignCertificate,
} from './CampaignCertificateHost';

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
    render(<CampaignCertificateHost />);

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
});
