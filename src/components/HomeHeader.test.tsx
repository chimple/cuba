import React from 'react';
import { MemoryRouter } from 'react-router';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from '@testing-library/react';
import HomeHeader from './HomeHeader';
import { ServiceConfig } from '../services/ServiceConfig';
import { Util } from '../utility/util';
import { schoolUtil } from '../utility/schoolUtil';
import { HOMEHEADERLIST, MODES } from '../common/constants';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (s: string) => s }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

jest.mock('./HeaderIcon', () => (props: any) => (
  <button
    data-testid={`header-icon-${String(props.headerConfig.headerList)}`}
    data-profile={props.isProfile ? '1' : '0'}
    onClick={props.onHeaderIconClick}
  >
    {props.headerConfig.displayName}
  </button>
));

jest.mock('./ProfileMenu/ProfileMenu', () => (props: any) => (
  <div data-testid="profile-menu">
    <button onClick={props.onClose}>close menu</button>
  </div>
));

jest.mock('../utility/util');
jest.mock('../utility/schoolUtil');

const mockApi = {
  isStudentLinked: jest.fn(),
};

describe('HomeHeader', () => {
  const onHeaderIconClick = jest.fn();
  let originalConsoleError: typeof logger.error;

  beforeEach(() => {
    jest.resetAllMocks();
    originalConsoleError = logger.error;
    jest.spyOn(console, 'error').mockImplementation((...args: any[]) => {
      const msg = String(args[0] ?? '');
      // Ignore known jsdom/XHR noise not related to HomeHeader logic assertions.
      if (msg.includes('AggregateError')) return;
      originalConsoleError(...args);
    });
    jest
      .spyOn(ServiceConfig, 'getI')
      .mockReturnValue({ apiHandler: mockApi } as any);
    (Util.getCanShowAvatar as jest.Mock).mockResolvedValue(true);
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      id: 'stu-1',
      name: 'Ava',
      avatar: 'koala',
      stars: 12,
    });
    (Util.getLocalStarsForStudent as jest.Mock).mockReturnValue(20);
    (schoolUtil.getCurrMode as jest.Mock).mockResolvedValue(MODES.PARENT);
    mockApi.isStudentLinked.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderHeader = (currentHeader = HOMEHEADERLIST.HOME) =>
    render(
      <MemoryRouter>
        <HomeHeader
          currentHeader={currentHeader}
          onHeaderIconClick={onHeaderIconClick}
          pendingAssignmentCount={3}
          pendingLiveQuizCount={2}
        />
      </MemoryRouter>,
    );

  test('renders home + middle icons + profile icon', async () => {
    renderHeader();

    await waitFor(() => {
      expect(
        screen.getByTestId(`header-icon-${HOMEHEADERLIST.HOME}`),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId(`header-icon-${HOMEHEADERLIST.ASSIGNMENT}`),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId(`header-icon-${HOMEHEADERLIST.SUBJECTS}`),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId(`header-icon-${HOMEHEADERLIST.LIVEQUIZ}`),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId(`header-icon-${HOMEHEADERLIST.PROFILE}`),
      ).toBeInTheDocument();
    });
  });

  test('hides live quiz icon when student is not linked', async () => {
    mockApi.isStudentLinked.mockResolvedValue(false);
    renderHeader();

    await waitFor(() => {
      expect(
        screen.queryByTestId(`header-icon-${HOMEHEADERLIST.LIVEQUIZ}`),
      ).not.toBeInTheDocument();
    });
  });

  test('hides assignment icon in school mode', async () => {
    (schoolUtil.getCurrMode as jest.Mock).mockResolvedValue(MODES.SCHOOL);
    renderHeader();

    await waitFor(() => {
      expect(
        screen.queryByTestId(`header-icon-${HOMEHEADERLIST.ASSIGNMENT}`),
      ).not.toBeInTheDocument();
    });
  });

  test('clicking homework icon triggers callback', async () => {
    renderHeader(HOMEHEADERLIST.HOME);

    const assignmentBtn = await screen.findByTestId(
      `header-icon-${HOMEHEADERLIST.ASSIGNMENT}`,
    );
    fireEvent.click(assignmentBtn);

    expect(onHeaderIconClick).toHaveBeenCalledWith(HOMEHEADERLIST.ASSIGNMENT);
  });

  test('clicking subjects icon triggers callback', async () => {
    renderHeader(HOMEHEADERLIST.HOME);
    const subjectsBtn = await screen.findByTestId(
      `header-icon-${HOMEHEADERLIST.SUBJECTS}`,
    );
    fireEvent.click(subjectsBtn);
    expect(onHeaderIconClick).toHaveBeenCalledWith(HOMEHEADERLIST.SUBJECTS);
  });

  test('clicking live quiz icon triggers callback', async () => {
    renderHeader(HOMEHEADERLIST.HOME);
    const liveQuizBtn = await screen.findByTestId(
      `header-icon-${HOMEHEADERLIST.LIVEQUIZ}`,
    );
    fireEvent.click(liveQuizBtn);
    expect(onHeaderIconClick).toHaveBeenCalledWith(HOMEHEADERLIST.LIVEQUIZ);
  });

  test('clicking home icon does not trigger callback if already on home', async () => {
    renderHeader(HOMEHEADERLIST.HOME);

    const homeBtn = await screen.findByTestId(
      `header-icon-${HOMEHEADERLIST.HOME}`,
    );
    fireEvent.click(homeBtn);
    expect(onHeaderIconClick).not.toHaveBeenCalled();
  });

  test('profile icon opens menu and overlay click closes it', async () => {
    const { container } = renderHeader(HOMEHEADERLIST.HOME);
    const profileBtn = await screen.findByTestId(
      `header-icon-${HOMEHEADERLIST.PROFILE}`,
    );
    fireEvent.click(profileBtn);

    expect(screen.getByTestId('profile-menu')).toBeInTheDocument();
    const overlay = container.querySelector('.home-header-menu-overlay');
    expect(overlay).toBeTruthy();

    if (overlay) fireEvent.click(overlay);
    await waitFor(() => {
      expect(screen.queryByTestId('profile-menu')).not.toBeInTheDocument();
    });
  });

  test('shows local-first stars', async () => {
    renderHeader();
    await waitFor(() => {
      expect(screen.getByText('20')).toBeInTheDocument();
    });
  });

  test('updates stars on starsUpdated event for current student', async () => {
    renderHeader();
    await screen.findByText('20');
    (Util.getLocalStarsForStudent as jest.Mock).mockReturnValue(25);

    act(() => {
      window.dispatchEvent(
        new CustomEvent('starsUpdated', {
          detail: { studentId: 'stu-1', newStars: 25 },
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument();
    });
  });

  test('ignores starsUpdated event for a different student', async () => {
    renderHeader();
    await screen.findByText('20');
    (Util.getLocalStarsForStudent as jest.Mock).mockReturnValue(99);

    window.dispatchEvent(
      new CustomEvent('starsUpdated', {
        detail: { studentId: 'other-student', newStars: 99 },
      }),
    );

    await waitFor(() => {
      expect(screen.getByText('20')).toBeInTheDocument();
    });
  });

  test('handles API errors in init without crashing', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockApi.isStudentLinked.mockRejectedValue(new Error('network-fail'));
    renderHeader();

    await waitFor(() => {
      expect(spy).toHaveBeenCalled();
      expect(
        screen.getByTestId(`header-icon-${HOMEHEADERLIST.HOME}`),
      ).toBeInTheDocument();
    });
    spy.mockRestore();
  });

  test('shows profile fallback name when student has no name', async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue({
      id: 'stu-1',
      name: '',
      avatar: 'koala',
      stars: 12,
    });
    renderHeader();
    await waitFor(() => {
      expect(
        screen.getByTestId(`header-icon-${HOMEHEADERLIST.PROFILE}`),
      ).toHaveTextContent('Name');
    });
  });

  test('profile icon is flagged with profile marker', async () => {
    renderHeader();
    const profile = await screen.findByTestId(
      `header-icon-${HOMEHEADERLIST.PROFILE}`,
    );
    expect(profile.getAttribute('data-profile')).toBe('1');
  });

  test('clicking home icon triggers callback when current header is not home', async () => {
    renderHeader(HOMEHEADERLIST.SUBJECTS);
    const homeBtn = await screen.findByTestId(
      `header-icon-${HOMEHEADERLIST.HOME}`,
    );
    fireEvent.click(homeBtn);
    expect(onHeaderIconClick).toHaveBeenCalledWith(HOMEHEADERLIST.HOME);
  });

  test('clicking subjects icon does nothing when current header is subjects', async () => {
    renderHeader(HOMEHEADERLIST.SUBJECTS);
    const subjectsBtn = await screen.findByTestId(
      `header-icon-${HOMEHEADERLIST.SUBJECTS}`,
    );
    fireEvent.click(subjectsBtn);
    expect(onHeaderIconClick).not.toHaveBeenCalled();
  });

  test('join class event makes live quiz icon visible', async () => {
    mockApi.isStudentLinked.mockResolvedValue(false);
    renderHeader();
    await waitFor(() => {
      expect(
        screen.queryByTestId(`header-icon-${HOMEHEADERLIST.LIVEQUIZ}`),
      ).not.toBeInTheDocument();
    });

    act(() => {
      window.dispatchEvent(new Event('JoinClassListner'));
    });

    await waitFor(() => {
      expect(
        screen.getByTestId(`header-icon-${HOMEHEADERLIST.LIVEQUIZ}`),
      ).toBeInTheDocument();
    });
  });

  test('stars default to 0 when student is unavailable for local refresh', async () => {
    (Util.getCurrentStudent as jest.Mock).mockReturnValue(null);
    renderHeader();
    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  test('updates stars when starsUpdated event has no studentId', async () => {
    renderHeader();
    await screen.findByText('20');
    (Util.getLocalStarsForStudent as jest.Mock).mockReturnValue(31);

    act(() => {
      window.dispatchEvent(
        new CustomEvent('starsUpdated', { detail: { newStars: 31 } }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText('31')).toBeInTheDocument();
    });
  });

  test('profile menu closes via onClose callback', async () => {
    renderHeader();
    fireEvent.click(
      await screen.findByTestId(`header-icon-${HOMEHEADERLIST.PROFILE}`),
    );
    expect(screen.getByTestId('profile-menu')).toBeInTheDocument();
    fireEvent.click(screen.getByText('close menu'));
    await waitFor(() => {
      expect(screen.queryByTestId('profile-menu')).not.toBeInTheDocument();
    });
  });

  test('home and profile icons are always present regardless of link state', async () => {
    mockApi.isStudentLinked.mockResolvedValue(false);
    renderHeader();
    await waitFor(() => {
      expect(
        screen.getByTestId(`header-icon-${HOMEHEADERLIST.HOME}`),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId(`header-icon-${HOMEHEADERLIST.PROFILE}`),
      ).toBeInTheDocument();
    });
  });
});
