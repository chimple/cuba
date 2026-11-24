import { act, render, screen } from '@testing-library/react';
import CampaignCertificateHost, {
  showCampaignCertificate,
} from './CampaignCertificateHost';
import { Util } from '../../utility/util';
import { store } from '../../redux/store';
import { setCertificateProfileSelectionInProgress } from '../../redux/slices/campaignRewards/campaignRewardsSlice';

jest.mock('../../utility/util', () => ({
  Util: {
    getCurrentStudent: jest.fn(),
    logEvent: jest.fn(),
    sendContentToAndroidOrWebShare: jest.fn(),
  },
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
    jest.clearAllMocks();
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      id: 'current-student',
    });
    window.location.hash = '';
    window.history.pushState({}, '', '/home');
    localStorage.clear();
    store.dispatch({
      type: 'campaignRewards/clearPendingCampaignCertificate',
      payload: 'student-a',
    });
    store.dispatch({
      type: 'campaignRewards/clearPendingCampaignCertificate',
      payload: 'student-b',
    });
    store.dispatch({
      type: 'campaignRewards/clearPendingCampaignCertificate',
      payload: '__current_student__',
    });
    store.dispatch(setCertificateProfileSelectionInProgress(false));
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
        campaignEndDate: '2026-06-28T00:00:00.000Z',
      });
    });

    // The host is the single orchestration point for certificate popup rendering.
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/SUMMER LEAGUE/)).toBeInTheDocument();
  });

  it('displays a queued certificate on the active player route', () => {
    window.history.pushState({}, '', '/lido-player');
    render(<CampaignCertificateHost />);

    act(() => {
      showCampaignCertificate({
        campaignId: 'campaign-queued',
        campaignName: 'Queued League',
        studentName: 'Madhavi',
        rank: 3,
        campaignEndDate: '2026-06-28T00:00:00.000Z',
      });
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/QUEUED LEAGUE/)).toBeInTheDocument();
  });

  it('keeps another student certificate pending without showing it', () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({ id: 'student-b' });
    render(<CampaignCertificateHost />);

    act(() => {
      showCampaignCertificate({
        campaignId: 'campaign-student-a',
        campaignName: 'Student A League',
        studentName: 'Student A',
        studentId: 'student-a',
        rank: 1,
        campaignEndDate: '2026-06-28T00:00:00.000Z',
      });
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      store.getState().campaignRewards.pendingCertificates['student-a']
        ?.campaignId,
    ).toBe('campaign-student-a');
  });

  it('shows each queued certificate after switching to its student profile', () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({ id: 'student-a' });
    render(<CampaignCertificateHost />);

    act(() => {
      showCampaignCertificate({
        campaignId: 'campaign-student-b',
        campaignName: 'Student B League',
        studentName: 'Student B',
        studentId: 'student-b',
        rank: 1,
        campaignEndDate: '2026-06-28T00:00:00.000Z',
      });
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    (Util.getCurrentStudent as jest.Mock).mockReturnValue({ id: 'student-b' });
    act(() => {
      window.dispatchEvent(new Event('currentStudentChanged'));
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/STUDENT B LEAGUE/)).toBeInTheDocument();
  });

  it('waits until the selected student leaves the profile selector', () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({ id: 'student-b' });
    window.history.pushState({}, '', '/display-students');
    render(<CampaignCertificateHost />);

    act(() => {
      showCampaignCertificate({
        campaignId: 'campaign-student-b',
        campaignName: 'Student B League',
        studentName: 'Student B',
        studentId: 'student-b',
        rank: 1,
        campaignEndDate: '2026-06-28T00:00:00.000Z',
      });
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      store.getState().campaignRewards.pendingCertificates['student-b']
        ?.campaignId,
    ).toBe('campaign-student-b');

    window.history.pushState({}, '', '/home');
    act(() => {
      window.dispatchEvent(new Event('ionRouteDidChange'));
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/STUDENT B LEAGUE/)).toBeInTheDocument();
  });

  it('keeps a certificate pending while the student profile is being edited', () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({ id: 'student-b' });
    window.history.pushState({}, '', '/edit-student');
    render(<CampaignCertificateHost />);

    act(() => {
      showCampaignCertificate({
        campaignId: 'campaign-student-b',
        campaignName: 'Student B League',
        studentName: 'Student B',
        studentId: 'student-b',
        rank: 1,
        campaignEndDate: '2026-06-28T00:00:00.000Z',
      });
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      store.getState().campaignRewards.pendingCertificates['student-b']
        ?.campaignId,
    ).toBe('campaign-student-b');
  });

  it('keeps a certificate pending while viewing parent-side student progress', () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({ id: 'student-b' });
    window.history.pushState({}, '', '/student-progress');
    render(<CampaignCertificateHost />);

    act(() => {
      showCampaignCertificate({
        campaignId: 'campaign-student-b',
        campaignName: 'Student B League',
        studentName: 'Student B',
        studentId: 'student-b',
        rank: 1,
        campaignEndDate: '2026-06-28T00:00:00.000Z',
      });
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      store.getState().campaignRewards.pendingCertificates['student-b']
        ?.campaignId,
    ).toBe('campaign-student-b');
  });

  it('keeps a certificate pending throughout the parent profile flow', () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({ id: 'student-b' });
    window.history.pushState({}, '', '/parent');
    render(<CampaignCertificateHost />);

    act(() => {
      showCampaignCertificate({
        campaignId: 'campaign-student-b',
        campaignName: 'Student B League',
        studentName: 'Student B',
        studentId: 'student-b',
        rank: 1,
        campaignEndDate: '2026-06-28T00:00:00.000Z',
      });
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      store.getState().campaignRewards.pendingCertificates['student-b']
        ?.campaignId,
    ).toBe('campaign-student-b');
  });

  it('keeps a certificate pending on a blocked HashRouter route', () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({ id: 'student-b' });
    window.history.pushState({}, '', '/');
    window.location.hash = '#/edit-student';
    render(<CampaignCertificateHost />);

    act(() => {
      showCampaignCertificate({
        campaignId: 'campaign-student-b',
        campaignName: 'Student B League',
        studentName: 'Student B',
        studentId: 'student-b',
        rank: 1,
        campaignEndDate: '2026-06-28T00:00:00.000Z',
      });
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      store.getState().campaignRewards.pendingCertificates['student-b']
        ?.campaignId,
    ).toBe('campaign-student-b');
  });

  it('keeps a selected student certificate queued during navigation', () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({ id: 'student-b' });
    store.dispatch(setCertificateProfileSelectionInProgress(true));
    render(<CampaignCertificateHost />);

    act(() => {
      showCampaignCertificate({
        campaignId: 'campaign-student-b',
        campaignName: 'Student B League',
        studentName: 'Student B',
        studentId: 'student-b',
        rank: 1,
        campaignEndDate: '2026-06-28T00:00:00.000Z',
      });
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      store.getState().campaignRewards.pendingCertificates['student-b']
        ?.campaignId,
    ).toBe('campaign-student-b');
  });
});
