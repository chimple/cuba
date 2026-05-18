import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Leaderboard from './Leaderboard';
import { ServiceConfig } from '../services/ServiceConfig';
import {
  AVATARS,
  CURRENT_MODE,
  LANGUAGE,
  LEADERBOARDHEADERLIST,
  LeaderboardDropdownList,
  MODES,
  PAGES,
  STAGES,
} from '../common/constants';
// Increase timeout for this file's tests when running full suite
jest.setTimeout(30000);

const mockHistory = { replace: jest.fn(), push: jest.fn() };
const mockSetGbUpdated = jest.fn();
const mockUpdateLocalAttributes = jest.fn();
const mockLoadBackgroundImage = jest.fn();
const mockGetCurrentStudent = jest.fn();
const mockSetPathToBackButton = jest.fn();
const mockGetCurrMode = jest.fn();
const mockDestroyInstance = jest.fn();
const mockChangeLanguage = jest.fn();
const mockAddListener: jest.Mock = jest.fn((..._args: any[]) => ({
  remove: jest.fn(),
}));

const delay = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

const eventually = async (assertion: () => void, timeoutMs = 2500) => {
  const start = Date.now();
  let lastError: unknown;
  while (Date.now() - start < timeoutMs) {
    try {
      assertion();
      return;
    } catch (error) {
      lastError = error;
      await delay(20);
    }
  }
  throw lastError;
};

const expectTextLikeValue = (
  raw: string | null | undefined,
  options?: { allowNumericOnly?: boolean },
) => {
  expect(typeof raw).toBe('string');
  const text = (raw ?? '').trim();
  expect(text.length).toBeGreaterThan(0);
  if (!options?.allowNumericOnly) {
    expect(text).not.toMatch(/^\d+$/);
  }
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => mockHistory,
}));

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

jest.mock('../i18n', () => ({
  __esModule: true,
  default: {
    changeLanguage: (lang: string) => mockChangeLanguage(lang),
  },
}));

jest.mock('../growthbook/Growthbook', () => ({
  useGbContext: () => ({ setGbUpdated: mockSetGbUpdated }),
  updateLocalAttributes: (attributes: unknown) =>
    mockUpdateLocalAttributes(attributes),
}));

jest.mock('../utility/util', () => ({
  Util: {
    loadBackgroundImage: () => mockLoadBackgroundImage(),
    getCurrentStudent: () => mockGetCurrentStudent(),
    setPathToBackButton: (...args: any[]) =>
      mockSetPathToBackButton.apply(null, args),
  },
}));

jest.mock('../utility/schoolUtil', () => ({
  schoolUtil: {
    getCurrMode: () => mockGetCurrMode(),
  },
}));

jest.mock('../components/animation/Avatar', () => ({
  AvatarObj: {
    destroyInstance: () => mockDestroyInstance(),
  },
}));

jest.mock('@capacitor/app', () => ({
  App: {
    addListener: (...args: any[]) => mockAddListener.apply(null, args),
  },
}));

jest.mock('../components/DropDown', () => ({
  __esModule: true,
  default: ({ optionList, currentValue, onValueChange }: any) => (
    <select
      aria-label="leaderboard-filter"
      data-testid="leaderboard-filter"
      onChange={(e) => onValueChange(e.target.value)}
      value={currentValue ?? ''}
    >
      <option value="" disabled>
        select
      </option>
      {optionList.map((option: any) => (
        <option key={option.id} value={option.id}>
          {option.displayName}
        </option>
      ))}
    </select>
  ),
}));

jest.mock('../components/leaderboard/LeaderboardRewards', () => ({
  __esModule: true,
  default: () => <div data-testid="leaderboard-rewards">rewards</div>,
}));

jest.mock('../teachers-module/components/DebugMode', () => ({
  __esModule: true,
  default: () => <div data-testid="debug-mode">debug mode content</div>,
}));

jest.mock('../components/SkeltonLoading', () => ({
  __esModule: true,
  default: ({ isLoading, header }: any) => (
    <div data-testid="skeleton-loading">
      {String(isLoading)}-{String(header)}
    </div>
  ),
}));

jest.mock('../stories/school/SchoolClassSubjectsTab.stories', () => ({
  school: {},
}));

jest.mock('@ionic/react', () => ({
  IonPage: ({ children }: any) => <div>{children}</div>,
  IonRow: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  IonCol: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  IonButton: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
  IonAlert: () => null,
  IonIcon: () => null,
}));

jest.mock('@mui/material', () => {
  const React = require('react');

  const Tabs = ({ children, onChange }: any) => (
    <div>
      {React.Children.map(children, (child: any) =>
        React.isValidElement(child)
          ? React.cloneElement(child, { __tabsOnChange: onChange })
          : child,
      )}
    </div>
  );

  const Tab = ({ label, value, onClick, __tabsOnChange, id }: any) => (
    <button
      id={id}
      onClick={(event) => {
        onClick?.(event);
        __tabsOnChange?.(event, value);
      }}
      type="button"
    >
      {label}
    </button>
  );

  return {
    AppBar: ({ children }: any) => <div>{children}</div>,
    Box: ({ children }: any) => <div>{children}</div>,
    Tabs,
    Tab,
    Dialog: ({ open, children, onClose }: any) =>
      open ? (
        <div>
          <button
            data-testid="dialog-outside-click"
            onClick={() => onClose?.({} as any)}
            type="button"
          >
            outside
          </button>
          {children}
        </div>
      ) : null,
    DialogActions: ({ children }: any) => <div>{children}</div>,
    DialogContent: ({ children }: any) => <div>{children}</div>,
    DialogContentText: ({ children }: any) => <div>{children}</div>,
    Button: ({ children, onClick }: any) => (
      <button onClick={onClick} type="button">
        {children}
      </button>
    ),
  };
});

const currentStudent = {
  id: 'student-1',
  name: 'Current Student',
  avatar: 'fox',
  image: '',
} as any;

const leaderboardResponse = {
  weekly: [
    {
      userId: 'student-2',
      name: 'Weekly Topper',
      score: 97.2,
      lessonsPlayed: 10,
      timeSpent: 130,
    },
    {
      userId: 'student-1',
      name: 'Current Student',
      score: 89.6,
      lessonsPlayed: 8,
      timeSpent: 120,
    },
  ],
  monthly: [
    {
      userId: 'student-4',
      name: 'Monthly Topper',
      score: 95,
      lessonsPlayed: 22,
      timeSpent: 250,
    },
    {
      userId: 'student-1',
      name: 'Monthly Winner',
      score: 91,
      lessonsPlayed: 18,
      timeSpent: 190,
    },
  ],
  allTime: [
    {
      userId: 'student-3',
      name: 'All Time Hero',
      score: 99,
      lessonsPlayed: 30,
      timeSpent: 360,
    },
    {
      userId: 'student-1',
      name: 'Current Student',
      score: 90,
      lessonsPlayed: 21,
      timeSpent: 240,
    },
  ],
};

const mockApiHandler = {
  getStudentClassesAndSchools: jest.fn(),
  getLeaderboardResults: jest.fn(),
  getLeaderboardStudentResultFromB2CCollection: jest.fn(),
  getLanguageWithId: jest.fn(),
  removeAssignmentChannel: jest.fn(),
};

const mockAuthHandler = {
  getCurrentUser: jest.fn(),
};

describe('Leaderboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    window.history.pushState({}, '', '/leaderboard');

    mockGetCurrentStudent.mockReturnValue(currentStudent);
    mockGetCurrMode.mockResolvedValue(MODES.SCHOOL);
    mockApiHandler.getStudentClassesAndSchools.mockResolvedValue({
      classes: [{ id: 'class-1' }],
      schools: [{ id: 'school-1' }],
    });
    mockApiHandler.getLeaderboardResults.mockResolvedValue(leaderboardResponse);
    mockApiHandler.getLeaderboardStudentResultFromB2CCollection.mockResolvedValue(
      null,
    );
    mockApiHandler.getLanguageWithId.mockResolvedValue({ code: 'hi' });
    mockApiHandler.removeAssignmentChannel.mockResolvedValue(undefined);
    mockAuthHandler.getCurrentUser.mockResolvedValue({ language_id: 'lang-1' });

    jest.spyOn(ServiceConfig, 'getI').mockReturnValue({
      apiHandler: mockApiHandler,
      authHandler: mockAuthHandler,
    } as any);
  });

  // 1) Initialize page, fetch weekly leaderboard, and set Growthbook positions.
  it('initializes leaderboard, fetches weekly data, and updates growthbook attributes', async () => {
    const view = render(<Leaderboard />);

    await eventually(() => {
      expect(mockApiHandler.getLeaderboardResults).toHaveBeenCalledWith(
        'class-1',
        LeaderboardDropdownList.WEEKLY,
      );
    });

    expect(mockLoadBackgroundImage).toHaveBeenCalled();
    expect(mockUpdateLocalAttributes).toHaveBeenCalledWith({
      leaderboard_position_weekly: 2,
      leaderboard_position_monthly: 2,
      leaderboard_position_all: 2,
    });
    expect(mockSetGbUpdated).toHaveBeenCalledWith(true);
    expect(await view.findByText('Weekly Topper')).toBeInTheDocument();
  });

  // 2) Sync URL query param when leaderboard tab is active.
  it('updates URL query with the active tab', async () => {
    const replaceStateSpy = jest.spyOn(window.history, 'replaceState');
    render(<Leaderboard />);

    await eventually(() => {
      expect(replaceStateSpy).toHaveBeenCalled();
    });

    const lastCall =
      replaceStateSpy.mock.calls[replaceStateSpy.mock.calls.length - 1];
    expect(String(lastCall[2])).toContain('tab=leaderboard');
  });

  // 3) Back button should navigate to home.
  it('back button works and navigates to home screen', async () => {
    const user = userEvent.setup();
    const view = render(<Leaderboard />);
    await view.findByText('Switch Profile');
    mockSetPathToBackButton.mockClear();

    const backButton = document.querySelector(
      '#back-button-in-LeaderBoard-Header img[alt="BackButtonIcon"]',
    ) as HTMLImageElement | null;
    expect(backButton).toBeTruthy();
    if (!backButton) throw new Error('Back button not found');
    await user.click(backButton);

    expect(mockSetPathToBackButton).toHaveBeenCalledWith(
      PAGES.HOME,
      mockHistory,
    );
  });

  // 3) Open rewards view when incoming URL has tab=rewards.
  it('renders rewards page when URL has tab=rewards', async () => {
    window.history.pushState({}, '', '/leaderboard?tab=rewards');
    const view = render(<Leaderboard />);

    expect(await view.findByTestId('leaderboard-rewards')).toBeInTheDocument();
    expect(
      view.queryByText(LEADERBOARDHEADERLIST.LEADERBOARD),
    ).not.toBeInTheDocument();
  });

  // 4) Change dropdown period and refresh table content accordingly.
  it('changes leaderboard period from dropdown and refreshes visible rows', async () => {
    const user = userEvent.setup();
    const view = render(<Leaderboard />);

    await view.findByText('Weekly Topper');
    await user.selectOptions(view.getByTestId('leaderboard-filter'), '1');

    expect(await view.findByText('Monthly Topper')).toBeInTheDocument();
  });

  // 4b) Dropdown change should call API with changed type.
  it('dropdown change calls leaderboard API with selected period', async () => {
    const user = userEvent.setup();
    mockApiHandler.getLeaderboardResults.mockReset();
    mockApiHandler.getLeaderboardResults
      .mockResolvedValueOnce({
        weekly: [
          {
            userId: 'student-2',
            name: 'Weekly Topper',
            score: 97.2,
            lessonsPlayed: 10,
            timeSpent: 130,
          },
          {
            userId: 'student-1',
            name: 'Current Student',
            score: 89.6,
            lessonsPlayed: 8,
            timeSpent: 120,
          },
        ],
        monthly: [],
        allTime: [
          {
            userId: 'student-3',
            name: 'All Time Hero',
            score: 99,
            lessonsPlayed: 30,
            timeSpent: 360,
          },
        ],
      })
      .mockResolvedValueOnce({
        weekly: [],
        monthly: [
          {
            userId: 'student-4',
            name: 'Monthly API Row',
            score: 95,
            lessonsPlayed: 22,
            timeSpent: 250,
          },
        ],
        allTime: [],
      });

    const view = render(<Leaderboard />);
    await view.findByText('Weekly Topper');

    await user.selectOptions(view.getByTestId('leaderboard-filter'), '1');

    await eventually(() => {
      expect(mockApiHandler.getLeaderboardResults).toHaveBeenNthCalledWith(
        2,
        'class-1',
        LeaderboardDropdownList.MONTHLY,
      );
    });
    expect(await view.findByText('Monthly API Row')).toBeInTheDocument();
  });

  // 5) Use B2C fallback result when class leaderboard does not contain current student.
  it('uses B2C fallback data when class id is empty and current student is missing in class leaderboard', async () => {
    mockApiHandler.getStudentClassesAndSchools.mockResolvedValue({
      classes: [],
      schools: [],
    });
    mockApiHandler.getLeaderboardResults.mockResolvedValue({
      weekly: [
        {
          userId: 'student-999',
          name: 'Other Student',
          score: 77,
          lessonsPlayed: 5,
          timeSpent: 55,
        },
      ],
      monthly: [],
      allTime: [],
    });
    mockApiHandler.getLeaderboardStudentResultFromB2CCollection.mockResolvedValue(
      {
        weekly: [
          {
            userId: 'student-1',
            name: 'B2C Student',
            score: 83,
            lessonsPlayed: 6,
            timeSpent: 61,
          },
        ],
        monthly: [],
        allTime: [],
      },
    );

    const view = render(<Leaderboard />);

    await eventually(() => {
      expect(
        mockApiHandler.getLeaderboardStudentResultFromB2CCollection,
      ).toHaveBeenCalledWith('student-1');
    });
    expect(await view.findByText('B2C Student')).toBeInTheDocument();
  });

  // 5b) Use B2C fallback values/rank when classId is empty and class leaderboard excludes current user.
  it('uses B2C fallback with expected rank and values when class id is empty', async () => {
    mockGetCurrentStudent.mockReturnValue({
      id: 'u1',
      name: 'Gourav',
      avatar: 'a1',
      image: '',
    });
    mockGetCurrMode.mockResolvedValue(MODES.PARENT);
    mockApiHandler.getStudentClassesAndSchools.mockResolvedValue({
      classes: [],
      schools: [],
    });
    mockApiHandler.getLeaderboardResults.mockResolvedValue({
      weekly: [
        {
          userId: 'u2',
          name: 'Other',
          lessonsPlayed: 3,
          score: 10,
          timeSpent: 60,
        },
      ],
      monthly: [],
      allTime: [],
    });
    mockApiHandler.getLeaderboardStudentResultFromB2CCollection.mockResolvedValue(
      {
        weekly: [
          {
            name: 'Gourav-B2C',
            lessonsPlayed: 7,
            score: 55,
            timeSpent: 125,
          },
        ],
        monthly: [],
        allTime: [],
      },
    );

    const view = render(<Leaderboard />);

    await eventually(() => {
      expect(
        mockApiHandler.getLeaderboardStudentResultFromB2CCollection,
      ).toHaveBeenCalledWith('u1');
    });

    await eventually(() => {
      expect(view.getAllByText('2+').length).toBeGreaterThanOrEqual(1);
      expect(view.getAllByText('55').length).toBeGreaterThanOrEqual(1);
      expect(view.getAllByText('7').length).toBeGreaterThanOrEqual(1);
      expect(view.getAllByText('2 min 5 sec').length).toBeGreaterThanOrEqual(1);
      expect(view.getByText('Gourav-B2C')).toBeInTheDocument();
    });
  });

  // 5g) When cache has weekly/monthly/all-time, dropdown changes should reuse local cache and not call API again.
  it('reuses cached leaderboard data on dropdown changes without extra leaderboard API calls', async () => {
    const user = userEvent.setup();
    mockApiHandler.getLeaderboardResults.mockResolvedValue({
      weekly: [
        {
          userId: 'weekly-top',
          name: 'Cache Weekly Top',
          score: 99,
          lessonsPlayed: 10,
          timeSpent: 120,
        },
        {
          userId: 'student-1',
          name: 'Current Student',
          score: 90,
          lessonsPlayed: 8,
          timeSpent: 100,
        },
      ],
      monthly: [
        {
          userId: 'monthly-top',
          name: 'Cache Monthly Top',
          score: 96,
          lessonsPlayed: 9,
          timeSpent: 130,
        },
        {
          userId: 'student-1',
          name: 'Current Student',
          score: 88,
          lessonsPlayed: 7,
          timeSpent: 90,
        },
      ],
      allTime: [
        {
          userId: 'all-top',
          name: 'Cache All Time Top',
          score: 100,
          lessonsPlayed: 30,
          timeSpent: 300,
        },
        {
          userId: 'student-1',
          name: 'Current Student',
          score: 92,
          lessonsPlayed: 25,
          timeSpent: 250,
        },
      ],
    });

    const view = render(<Leaderboard />);
    expect(await view.findByText('Cache Weekly Top')).toBeInTheDocument();
    expect(mockApiHandler.getLeaderboardResults).toHaveBeenCalledTimes(1);

    await user.selectOptions(view.getByTestId('leaderboard-filter'), '1');
    expect(await view.findByText('Cache Monthly Top')).toBeInTheDocument();

    await user.selectOptions(view.getByTestId('leaderboard-filter'), '2');
    expect(await view.findByText('Cache All Time Top')).toBeInTheDocument();

    expect(mockApiHandler.getLeaderboardResults).toHaveBeenCalledTimes(1);
  });

  // 5h) B2C fallback must not run if class id exists even when student is missing in class leaderboard.
  it('does not call B2C fallback when class id is non-empty and student is missing', async () => {
    mockApiHandler.getStudentClassesAndSchools.mockResolvedValue({
      classes: [{ id: 'class-1' }],
      schools: [{ id: 'school-1' }],
    });
    mockApiHandler.getLeaderboardResults.mockResolvedValue({
      weekly: [
        {
          userId: 'student-777',
          name: 'Class Other',
          score: 80,
          lessonsPlayed: 6,
          timeSpent: 95,
        },
      ],
      monthly: [],
      allTime: [],
    });

    const view = render(<Leaderboard />);
    expect(await view.findByText('Class Other')).toBeInTheDocument();
    expect(
      mockApiHandler.getLeaderboardStudentResultFromB2CCollection,
    ).not.toHaveBeenCalled();
  });

  // 5i) No-class leaderboards should refresh the current student's row from B2C data,
  // even when the generic leaderboard already contains that student.
  it('uses B2C data when class id is empty and student is already present', async () => {
    mockApiHandler.getStudentClassesAndSchools.mockResolvedValue({
      classes: [],
      schools: [],
    });
    mockApiHandler.getLeaderboardResults.mockResolvedValue({
      weekly: [
        {
          userId: 'student-2',
          name: 'Weekly Topper',
          score: 97,
          lessonsPlayed: 10,
          timeSpent: 130,
        },
        {
          userId: 'student-1',
          name: 'Current Student',
          score: 90,
          lessonsPlayed: 8,
          timeSpent: 120,
        },
      ],
      monthly: [],
      allTime: [],
    });
    mockApiHandler.getLeaderboardStudentResultFromB2CCollection.mockResolvedValue(
      {
        weekly: [
          {
            userId: 'student-1',
            name: 'Current Student',
            score: 99,
            lessonsPlayed: 11,
            timeSpent: 180,
          },
        ],
        monthly: [],
        allTime: [],
      },
    );

    const view = render(<Leaderboard />);
    expect(await view.findByText('Weekly Topper')).toBeInTheDocument();
    await eventually(() => {
      expect(
        mockApiHandler.getLeaderboardStudentResultFromB2CCollection,
      ).toHaveBeenCalledWith('student-1');
      expect(view.getAllByText('99').length).toBeGreaterThanOrEqual(1);
      expect(view.getAllByText('11').length).toBeGreaterThanOrEqual(1);
      expect(view.getAllByText('3 min 0 sec').length).toBeGreaterThanOrEqual(1);
    });
  });

  // 5j) If B2C fallback bucket is empty, component should use placeholder/dummy row values.
  it('uses dummy placeholder values when B2C fallback bucket is empty', async () => {
    mockApiHandler.getStudentClassesAndSchools.mockResolvedValue({
      classes: [],
      schools: [],
    });
    mockApiHandler.getLeaderboardResults.mockResolvedValue({
      weekly: [
        {
          userId: 'student-404',
          name: 'Not Current User',
          score: 75,
          lessonsPlayed: 3,
          timeSpent: 45,
        },
      ],
      monthly: [],
      allTime: [],
    });
    mockApiHandler.getLeaderboardStudentResultFromB2CCollection.mockResolvedValue(
      {
        weekly: [],
        monthly: [],
        allTime: [],
      },
    );

    const view = render(<Leaderboard />);
    await eventually(() => {
      expect(
        mockApiHandler.getLeaderboardStudentResultFromB2CCollection,
      ).toHaveBeenCalledWith('student-1');
    });
    await eventually(() => {
      expect(view.getByTestId('skeleton-loading').textContent).toBe(
        'false-LEADERBOARD',
      );
      expect(view.getAllByText('--').length).toBeGreaterThan(0);
      expect(view.getAllByText('--min --sec').length).toBeGreaterThan(0);
    });
  });

  // 5k) With class id empty and student missing, monthly dropdown should use monthly B2C bucket with <N>+ rank.
  it('uses monthly B2C bucket and shows plus rank when monthly dropdown is selected', async () => {
    const user = userEvent.setup();
    mockApiHandler.getStudentClassesAndSchools.mockResolvedValue({
      classes: [],
      schools: [],
    });
    mockApiHandler.getLeaderboardResults.mockResolvedValue({
      weekly: [
        {
          userId: 'student-1',
          name: 'Current Student',
          score: 90,
          lessonsPlayed: 8,
          timeSpent: 120,
        },
      ],
      monthly: [
        {
          userId: 'm-1',
          name: 'Monthly Rank 1',
          score: 95,
          lessonsPlayed: 11,
          timeSpent: 150,
        },
        {
          userId: 'm-2',
          name: 'Monthly Rank 2',
          score: 92,
          lessonsPlayed: 10,
          timeSpent: 140,
        },
      ],
      allTime: [
        {
          userId: 'student-1',
          name: 'Current Student',
          score: 93,
          lessonsPlayed: 20,
          timeSpent: 200,
        },
      ],
    });
    mockApiHandler.getLeaderboardStudentResultFromB2CCollection.mockResolvedValue(
      {
        weekly: [],
        monthly: [
          {
            name: 'Monthly B2C Student',
            lessonsPlayed: 9,
            score: 66,
            timeSpent: 125,
          },
        ],
        allTime: [],
      },
    );

    const view = render(<Leaderboard />);
    await view.findByTestId('leaderboard-filter');
    mockApiHandler.getLeaderboardStudentResultFromB2CCollection.mockClear();

    await user.selectOptions(view.getByTestId('leaderboard-filter'), '1');

    await eventually(() => {
      expect(
        mockApiHandler.getLeaderboardStudentResultFromB2CCollection,
      ).toHaveBeenCalledWith('student-1');
    });
    expect(await view.findByText('Monthly B2C Student')).toBeInTheDocument();
    expect(view.getAllByText('3+').length).toBeGreaterThanOrEqual(1);
  });

  // 5l) With class id empty and student missing, all-time dropdown should use all-time B2C bucket with <N>+ rank.
  it('uses all-time B2C bucket and shows plus rank when all-time dropdown is selected', async () => {
    const user = userEvent.setup();
    mockApiHandler.getStudentClassesAndSchools.mockResolvedValue({
      classes: [],
      schools: [],
    });
    mockApiHandler.getLeaderboardResults.mockResolvedValue({
      weekly: [
        {
          userId: 'student-1',
          name: 'Current Student',
          score: 90,
          lessonsPlayed: 8,
          timeSpent: 120,
        },
      ],
      monthly: [
        {
          userId: 'student-1',
          name: 'Current Student',
          score: 91,
          lessonsPlayed: 9,
          timeSpent: 130,
        },
      ],
      allTime: [
        {
          userId: 'a-1',
          name: 'All Rank 1',
          score: 99,
          lessonsPlayed: 28,
          timeSpent: 320,
        },
        {
          userId: 'a-2',
          name: 'All Rank 2',
          score: 98,
          lessonsPlayed: 26,
          timeSpent: 300,
        },
      ],
    });
    mockApiHandler.getLeaderboardStudentResultFromB2CCollection.mockResolvedValue(
      {
        weekly: [],
        monthly: [],
        allTime: [
          {
            name: 'AllTime B2C Student',
            lessonsPlayed: 12,
            score: 77,
            timeSpent: 240,
          },
        ],
      },
    );

    const view = render(<Leaderboard />);
    await view.findByTestId('leaderboard-filter');
    mockApiHandler.getLeaderboardStudentResultFromB2CCollection.mockClear();

    await user.selectOptions(view.getByTestId('leaderboard-filter'), '2');

    await eventually(() => {
      expect(
        mockApiHandler.getLeaderboardStudentResultFromB2CCollection,
      ).toHaveBeenCalledWith('student-1');
    });
    expect(await view.findByText('AllTime B2C Student')).toBeInTheDocument();
    expect(view.getAllByText('3+').length).toBeGreaterThanOrEqual(1);
  });

  // 5m) If current user is missing from all buckets, Growthbook positions should be 0 for weekly/monthly/all-time.
  it('updates growthbook leaderboard positions to 0 when current student is missing from all lists', async () => {
    mockApiHandler.getLeaderboardResults.mockResolvedValue({
      weekly: [
        {
          userId: 'weekly-other',
          name: 'Weekly Other',
          score: 80,
          lessonsPlayed: 5,
          timeSpent: 80,
        },
      ],
      monthly: [
        {
          userId: 'monthly-other',
          name: 'Monthly Other',
          score: 82,
          lessonsPlayed: 6,
          timeSpent: 90,
        },
      ],
      allTime: [
        {
          userId: 'all-other',
          name: 'All Other',
          score: 84,
          lessonsPlayed: 7,
          timeSpent: 100,
        },
      ],
    });

    render(<Leaderboard />);

    await eventually(() => {
      expect(mockUpdateLocalAttributes).toHaveBeenCalledWith({
        leaderboard_position_weekly: 0,
        leaderboard_position_monthly: 0,
        leaderboard_position_all: 0,
      });
    });
  });

  // 5n) In school mode with student.image, avatar src should use image field directly.
  it('uses currentStudent.image as avatar src in school mode', async () => {
    mockGetCurrentStudent.mockReturnValue({
      id: 'img-student',
      name: 'Image Student',
      avatar: 'fox',
      image: 'https://cdn.example.com/student-image.png',
    });
    mockGetCurrMode.mockResolvedValue(MODES.SCHOOL);
    mockApiHandler.getLeaderboardResults.mockResolvedValue({
      weekly: [
        {
          userId: 'img-student',
          name: 'Image Student',
          score: 88,
          lessonsPlayed: 8,
          timeSpent: 120,
        },
      ],
      monthly: [],
      allTime: [],
    });

    const view = render(<Leaderboard />);
    await eventually(() => {
      expect(view.getAllByText('Image Student').length).toBeGreaterThan(0);
    });

    const avatarImg = document.querySelector(
      '.leaderboard-avatar-img',
    ) as HTMLImageElement | null;
    expect(avatarImg).toBeTruthy();
    if (!avatarImg) throw new Error('Avatar image is missing');
    expect(avatarImg.getAttribute('src')).toBe(
      'https://cdn.example.com/student-image.png',
    );
  });

  // 5o) Outside school-image case, avatar src should use assets/avatars/<avatar>.png.
  it('uses assets avatar path when image is missing', async () => {
    mockGetCurrentStudent.mockReturnValue({
      id: 'avatar-student',
      name: 'Avatar Student',
      avatar: 'fox',
      image: '',
    });
    mockGetCurrMode.mockResolvedValue(MODES.PARENT);
    mockApiHandler.getLeaderboardResults.mockResolvedValue({
      weekly: [
        {
          userId: 'avatar-student',
          name: 'Avatar Student',
          score: 82,
          lessonsPlayed: 6,
          timeSpent: 110,
        },
      ],
      monthly: [],
      allTime: [],
    });

    const view = render(<Leaderboard />);
    await eventually(() => {
      expect(view.getAllByText('Avatar Student').length).toBeGreaterThan(0);
    });

    const avatarImg = document.querySelector(
      '.leaderboard-avatar-img',
    ) as HTMLImageElement | null;
    expect(avatarImg).toBeTruthy();
    if (!avatarImg) throw new Error('Avatar image is missing');
    expect(avatarImg.getAttribute('src')).toBe('assets/avatars/fox.png');
  });

  // 5p) If avatar is missing, avatar src should fallback to assets/avatars/<AVATARS[0]>.png.
  it('falls back to default avatar when avatar id is missing', async () => {
    mockGetCurrentStudent.mockReturnValue({
      id: 'fallback-student',
      name: 'Fallback Student',
      avatar: undefined,
      image: '',
    });
    mockGetCurrMode.mockResolvedValue(MODES.PARENT);
    mockApiHandler.getLeaderboardResults.mockResolvedValue({
      weekly: [
        {
          userId: 'fallback-student',
          name: 'Fallback Student',
          score: 81,
          lessonsPlayed: 5,
          timeSpent: 100,
        },
      ],
      monthly: [],
      allTime: [],
    });

    const view = render(<Leaderboard />);
    await eventually(() => {
      expect(view.getAllByText('Fallback Student').length).toBeGreaterThan(0);
    });

    const avatarImg = document.querySelector(
      '.leaderboard-avatar-img',
    ) as HTMLImageElement | null;
    expect(avatarImg).toBeTruthy();
    if (!avatarImg) throw new Error('Avatar image is missing');
    expect(avatarImg.getAttribute('src')).toBe(
      `assets/avatars/${AVATARS[0]}.png`,
    );
  });

  // 6a) Less than 7 clicks should not open debug dialog.
  it('does not open debug dialog for less than 7 leaderboard clicks', async () => {
    const user = userEvent.setup();
    const view = render(<Leaderboard />);
    const leaderboardTab = await view.findByRole('button', {
      name: LEADERBOARDHEADERLIST.LEADERBOARD,
    });

    for (let i = 0; i < 6; i++) {
      await user.click(leaderboardTab);
    }

    expect(
      view.queryByText('Do you want to Open Debug Mode?'),
    ).not.toBeInTheDocument();
  });

  // 6b) Exactly 7 clicks should open debug dialog.
  it('opens debug dialog exactly at 7 leaderboard clicks', async () => {
    const user = userEvent.setup();
    const view = render(<Leaderboard />);
    const leaderboardTab = await view.findByRole('button', {
      name: LEADERBOARDHEADERLIST.LEADERBOARD,
    });

    for (let i = 0; i < 7; i++) {
      await user.click(leaderboardTab);
    }

    expect(
      await view.findByText('Do you want to Open Debug Mode?'),
    ).toBeInTheDocument();
  });

  // 6c) More than 7 clicks still opens debug dialog.
  it('opens debug dialog when leaderboard is clicked more than 7 times', async () => {
    const user = userEvent.setup();
    const view = render(<Leaderboard />);
    const leaderboardTab = await view.findByRole('button', {
      name: LEADERBOARDHEADERLIST.LEADERBOARD,
    });

    for (let i = 0; i < 8; i++) {
      await user.click(leaderboardTab);
    }

    expect(
      await view.findByText('Do you want to Open Debug Mode?'),
    ).toBeInTheDocument();
  });

  // 6d) Cancel in debug dialog should close popup and stay out of debug mode.
  it('closes debug popup on Cancel click', async () => {
    const user = userEvent.setup();
    const view = render(<Leaderboard />);
    const leaderboardTab = await view.findByRole('button', {
      name: LEADERBOARDHEADERLIST.LEADERBOARD,
    });
    for (let i = 0; i < 7; i++) {
      await user.click(leaderboardTab);
    }

    const cancelButton = await view.findByText('Cancel');
    await user.click(cancelButton);

    await eventually(() => {
      expect(
        view.queryByText('Do you want to Open Debug Mode?'),
      ).not.toBeInTheDocument();
    });
    expect(view.queryByTestId('debug-mode')).not.toBeInTheDocument();
  });

  // 6e) Outside click in debug dialog should close popup.
  it('closes debug popup on outside click', async () => {
    const user = userEvent.setup();
    const view = render(<Leaderboard />);
    const leaderboardTab = await view.findByRole('button', {
      name: LEADERBOARDHEADERLIST.LEADERBOARD,
    });
    for (let i = 0; i < 7; i++) {
      await user.click(leaderboardTab);
    }

    await user.click(await view.findByTestId('dialog-outside-click'));

    await eventually(() => {
      expect(
        view.queryByText('Do you want to Open Debug Mode?'),
      ).not.toBeInTheDocument();
    });
  });

  // 6f) Clicking debugMode in popup should open debug mode.
  it('opens debug confirmation after 7 leaderboard tab clicks and renders debug mode on confirm', async () => {
    const user = userEvent.setup();
    const view = render(<Leaderboard />);

    const leaderboardTab = await view.findByRole('button', {
      name: LEADERBOARDHEADERLIST.LEADERBOARD,
    });

    for (let i = 0; i < 7; i++) {
      await user.click(leaderboardTab);
    }

    expect(
      await view.findByText('Do you want to Open Debug Mode?'),
    ).toBeInTheDocument();

    await user.click(view.getByText('debugMode'));
    expect(await view.findByTestId('debug-mode')).toBeInTheDocument();
  });

  // 6g) In debug mode, clicking leaderboard header should return to leaderboard tab.
  it('returns to leaderboard view when clicking leaderboard header from debug mode', async () => {
    const user = userEvent.setup();
    const view = render(<Leaderboard />);

    const leaderboardTab = await view.findByRole('button', {
      name: LEADERBOARDHEADERLIST.LEADERBOARD,
    });
    for (let i = 0; i < 7; i++) {
      await user.click(leaderboardTab);
    }
    await user.click(await view.findByText('debugMode'));
    expect(await view.findByTestId('debug-mode')).toBeInTheDocument();

    await user.click(
      view.getByRole('button', { name: LEADERBOARDHEADERLIST.LEADERBOARD }),
    );

    await eventually(() => {
      expect(view.queryByTestId('debug-mode')).not.toBeInTheDocument();
      expect(view.getByTestId('leaderboard-filter')).toBeInTheDocument();
    });
  });

  // 6h) After returning from debug mode to leaderboard, back button should still work.
  it('returns to leaderboard from debug mode and back button remains clickable', async () => {
    const user = userEvent.setup();
    const view = render(<Leaderboard />);

    const leaderboardTab = await view.findByRole('button', {
      name: LEADERBOARDHEADERLIST.LEADERBOARD,
    });
    for (let i = 0; i < 7; i++) {
      await user.click(leaderboardTab);
    }
    await user.click(await view.findByText('debugMode'));
    await user.click(
      view.getByRole('button', { name: LEADERBOARDHEADERLIST.LEADERBOARD }),
    );
    await eventually(() => {
      expect(view.queryByTestId('debug-mode')).not.toBeInTheDocument();
    });

    mockSetPathToBackButton.mockClear();
    const backButton = document.querySelector(
      '#back-button-in-LeaderBoard-Header img[alt="BackButtonIcon"]',
    ) as HTMLImageElement | null;
    expect(backButton).toBeTruthy();
    if (!backButton) throw new Error('Back button not found');
    await user.click(backButton);

    expect(mockSetPathToBackButton).toHaveBeenCalledWith(
      PAGES.HOME,
      mockHistory,
    );
  });

  // 6i) After returning from debug mode to leaderboard, switch profile should still work.
  it('returns to leaderboard from debug mode and switch profile remains clickable', async () => {
    const user = userEvent.setup();
    localStorage.setItem(CURRENT_MODE, MODES.PARENT);
    const view = render(<Leaderboard />);

    const leaderboardTab = await view.findByRole('button', {
      name: LEADERBOARDHEADERLIST.LEADERBOARD,
    });
    for (let i = 0; i < 7; i++) {
      await user.click(leaderboardTab);
    }
    await user.click(await view.findByText('debugMode'));
    await user.click(
      view.getByRole('button', { name: LEADERBOARDHEADERLIST.LEADERBOARD }),
    );
    await eventually(() => {
      expect(view.queryByTestId('debug-mode')).not.toBeInTheDocument();
    });

    mockSetPathToBackButton.mockClear();
    await user.click(view.getByText('Switch Profile'));
    await eventually(() => {
      expect(mockSetPathToBackButton).toHaveBeenCalledWith(
        PAGES.DISPLAY_STUDENT,
        mockHistory,
      );
    });
  });

  // 7) Switch profile flow for parent mode should route to display student page.
  it('handles Switch Profile for parent mode', async () => {
    const user = userEvent.setup();
    localStorage.setItem(CURRENT_MODE, MODES.PARENT);

    const view = render(<Leaderboard />);
    await view.findByText('Switch Profile');
    mockSetPathToBackButton.mockClear();

    await user.click(view.getByText('Switch Profile'));

    await eventually(() => {
      expect(mockDestroyInstance).toHaveBeenCalled();
      expect(mockApiHandler.removeAssignmentChannel).toHaveBeenCalled();
      expect(mockChangeLanguage).toHaveBeenCalledWith('hi');
      expect(localStorage.getItem(LANGUAGE)).toBe('hi');
      expect(mockSetPathToBackButton).toHaveBeenCalledWith(
        PAGES.DISPLAY_STUDENT,
        mockHistory,
      );
    });
  });

  // 8) Switch profile flow for non-parent mode should route to select mode + student tab.
  it('handles Switch Profile for non-parent mode', async () => {
    const user = userEvent.setup();
    localStorage.setItem(CURRENT_MODE, MODES.SCHOOL);

    const view = render(<Leaderboard />);
    await view.findByText('Switch Profile');
    mockSetPathToBackButton.mockClear();

    await user.click(view.getByText('Switch Profile'));

    await eventually(() => {
      expect(mockSetPathToBackButton).toHaveBeenNthCalledWith(
        1,
        PAGES.SELECT_MODE,
        mockHistory,
      );
      expect(mockSetPathToBackButton).toHaveBeenNthCalledWith(
        2,
        `${PAGES.SELECT_MODE}?tab=${STAGES.STUDENT}`,
        mockHistory,
      );
    });
  });

  // 8b) Switch profile button is clickable and triggers flow.
  it('switch profile button is working', async () => {
    const user = userEvent.setup();
    const view = render(<Leaderboard />);
    await view.findByText('Switch Profile');
    mockApiHandler.removeAssignmentChannel.mockClear();

    await user.click(view.getByText('Switch Profile'));

    await eventually(() => {
      expect(mockApiHandler.removeAssignmentChannel).toHaveBeenCalled();
    });
  });

  // 9a) Dropdown is visible and enabled on leaderboard page.
  it('dropdown is rendered and interactive on leaderboard page', async () => {
    const view = render(<Leaderboard />);
    const filter = await view.findByTestId('leaderboard-filter');
    expect(filter).toBeInTheDocument();
    expect(filter).not.toHaveAttribute('disabled');
  });

  // 9a-2) UI listing keeps type consistency: text fields are text and numeric fields are numeric.
  it('keeps leaderboard row data type-consistent for text and numbers', async () => {
    const view = render(<Leaderboard />);
    await view.findByText('Weekly Topper');

    const rows = document.querySelectorAll('#leaderboard-right-UI > div');
    expect(rows.length).toBeGreaterThan(1);

    const headerCells = rows[0].querySelectorAll(
      'p#leaderboard-right-UI-content',
    );
    expect(headerCells[0].textContent?.trim()).toBe('#');
    expect(headerCells[1].textContent?.trim()).toBe('Name');
    expect(headerCells[2].textContent?.trim()).toBe('Lessons Played');
    expect(headerCells[3].textContent?.trim()).toBe('Score');
    expect(headerCells[4].textContent?.trim()).toBe('Time Spent');

    const firstDataCells = rows[1].querySelectorAll(
      'p#leaderboard-right-UI-content',
    );
    expect(firstDataCells[1].textContent?.trim()).toBe('Weekly Topper');
    expect(firstDataCells[0].textContent?.trim()).toMatch(/^\d+$/);
    expect(firstDataCells[2].textContent?.trim()).toMatch(/^\d+$/);
    expect(firstDataCells[3].textContent?.trim()).toMatch(/^\d+$/);
    expect(firstDataCells[4].textContent?.trim()).toMatch(
      /^\d+\s+min\s+\d+\s+sec$/,
    );
  });

  // 9a-2b) Text fields should always contain valid non-empty text values.
  it('keeps text fields type-safe with non-empty string content', async () => {
    const view = render(<Leaderboard />);
    await view.findByText('Weekly Topper');

    const rows = document.querySelectorAll('#leaderboard-right-UI > div');
    expect(rows.length).toBeGreaterThan(1);

    const headerName = rows[0].querySelectorAll(
      'p#leaderboard-right-UI-content',
    )[1]?.textContent;
    expect(typeof headerName).toBe('string');
    expect(headerName?.trim()).toBe('Name');

    // Validate each visible name cell in listing rows is non-empty textual content.
    for (let i = 1; i < rows.length; i++) {
      const nameCell = rows[i].querySelectorAll(
        'p#leaderboard-right-UI-content',
      )[1];
      const nameText = nameCell?.textContent;
      expectTextLikeValue(nameText);
    }
  });

  // 9a-2c) Left-panel textual labels should be non-empty and text-like.
  it('keeps left panel text labels type-safe for all visible label fields', async () => {
    const view = render(<Leaderboard />);
    await view.findByText('Weekly Topper');

    const studentName = document.getElementById(
      'leaderboard-student-name',
    )?.textContent;
    const noteMessage = document.getElementById(
      'leaderboard-left-note-message',
    )?.textContent;
    expectTextLikeValue(studentName);
    expectTextLikeValue(noteMessage);

    expectTextLikeValue(view.getByText('Rank').textContent);
    expectTextLikeValue(view.getAllByText('Lessons Played')[0].textContent);
    expectTextLikeValue(view.getAllByText('Score')[0].textContent);
    expectTextLikeValue(view.getAllByText('Time Spent')[0].textContent);
  });

  // 9a-2d) Dropdown and primary action texts should be non-empty and text-like.
  it('keeps dropdown option labels and action labels type-safe', async () => {
    const view = render(<Leaderboard />);
    await view.findByText('Weekly Topper');

    const dropdown = view.getByTestId(
      'leaderboard-filter',
    ) as HTMLSelectElement;
    const optionTexts = Array.from(dropdown.options)
      .filter((opt) => !opt.disabled)
      .map((opt) => opt.textContent);
    expect(optionTexts.length).toBeGreaterThan(0);
    optionTexts.forEach((txt) => expectTextLikeValue(txt));

    expectTextLikeValue(
      view.getByRole('button', { name: LEADERBOARDHEADERLIST.LEADERBOARD })
        .textContent,
    );
    expectTextLikeValue(view.getByText('Switch Profile').textContent);
  });

  // 9a-2e) Debug popup text fields should be non-empty and text-like.
  it('keeps debug popup text labels type-safe', async () => {
    const user = userEvent.setup();
    const view = render(<Leaderboard />);
    const leaderboardTab = await view.findByRole('button', {
      name: LEADERBOARDHEADERLIST.LEADERBOARD,
    });

    for (let i = 0; i < 7; i++) {
      await user.click(leaderboardTab);
    }

    const messageText = await view.findByText(
      'Do you want to Open Debug Mode?',
    );
    const cancelText = view.getByText('Cancel');
    const debugText = view.getByText('debugMode');

    expectTextLikeValue(messageText.textContent);
    expectTextLikeValue(cancelText.textContent);
    expectTextLikeValue(debugText.textContent);
  });

  // 9a-2f) Visible leaderboard values should be type-safe as numeric or varchar-like content.
  it('keeps visible field values type-safe as numerics or varchars', async () => {
    const view = render(<Leaderboard />);
    await view.findByText('Weekly Topper');

    const valueNodes = Array.from(
      document.querySelectorAll(
        '#leaderboard-student-name, #leaderboard-left-UI-content, #leaderboard-right-UI-content, #leaderboard-profile-name',
      ),
    ) as HTMLElement[];

    expect(valueNodes.length).toBeGreaterThan(0);

    valueNodes.forEach((node) => {
      const text = (node.textContent ?? '').trim();
      expect(text.length).toBeGreaterThan(0);

      const isNumericLike = /^\d+\+?$/.test(text);
      const isVarcharLike = /[A-Za-z]/.test(text);
      const isTimeLike = /^\d+\s*min\s*\d+\s*sec$/i.test(text);
      const isHeaderSymbol = text === '#';

      expect(
        isNumericLike || isVarcharLike || isTimeLike || isHeaderSymbol,
      ).toBe(true);
    });
  });

  // 9a-3) Core leaderboard UI data should be visible and consistent on initial render.
  it('shows all core leaderboard ui content consistently on screen', async () => {
    const view = render(<Leaderboard />);

    expect(await view.findByText('Switch Profile')).toBeInTheDocument();
    expect(
      view.getByRole('button', { name: LEADERBOARDHEADERLIST.LEADERBOARD }),
    ).toBeInTheDocument();
    expect(view.getByTestId('leaderboard-filter')).toBeInTheDocument();
    expect(view.getAllByText('Current Student').length).toBeGreaterThan(0);
    expect(
      view.getByText(
        '***Be among the top performers in your class to win an exciting reward',
      ),
    ).toBeInTheDocument();

    expect(view.getAllByText('Rank').length).toBeGreaterThan(0);
    expect(view.getAllByText('Lessons Played').length).toBeGreaterThan(0);
    expect(view.getAllByText('Score').length).toBeGreaterThan(0);
    expect(view.getAllByText('Time Spent').length).toBeGreaterThan(0);
    expect(view.getByText('Weekly Topper')).toBeInTheDocument();
  });

  // 9b) 200+ rows should render for weekly/monthly/all-time and stay scrollable.
  it('renders 200+ listing rows across all dropdown values and allows scrolling', async () => {
    const user = userEvent.setup();
    const makeRows = (prefix: string) =>
      Array.from({ length: 205 }, (_, index) => ({
        userId: `${prefix.toLowerCase()}-student-${index + 1}`,
        name: `${prefix} Student ${index + 1}`,
        score: 50 + (index % 50),
        lessonsPlayed: 1 + (index % 10),
        timeSpent: 60 + index,
      }));

    const bigWeekly = makeRows('W');
    const bigMonthly = makeRows('M');
    const bigAllTime = makeRows('A');

    mockApiHandler.getLeaderboardResults.mockResolvedValue({
      weekly: bigWeekly,
      monthly: bigMonthly,
      allTime: bigAllTime,
    });

    const view = render(<Leaderboard />);
    expect(await view.findByText('W Student 2')).toBeInTheDocument();
    expect(await view.findByText('W Student 205')).toBeInTheDocument();

    const listContainer = document.getElementById('leaderboard-right-UI');
    expect(listContainer).toBeTruthy();
    if (!listContainer)
      throw new Error('Leaderboard listing container missing');

    listContainer.scrollTop = 99999;
    listContainer.dispatchEvent(new Event('scroll'));
    expect(listContainer.scrollTop).toBe(99999);

    await user.selectOptions(view.getByTestId('leaderboard-filter'), '1');
    expect(await view.findByText('M Student 2')).toBeInTheDocument();
    expect(await view.findByText('M Student 205')).toBeInTheDocument();

    listContainer.scrollTop = 99999;
    listContainer.dispatchEvent(new Event('scroll'));
    expect(listContainer.scrollTop).toBe(99999);

    await user.selectOptions(view.getByTestId('leaderboard-filter'), '2');
    expect(await view.findByText('A Student 2')).toBeInTheDocument();
    expect(await view.findByText('A Student 205')).toBeInTheDocument();

    listContainer.scrollTop = 99999;
    listContainer.dispatchEvent(new Event('scroll'));
    expect(listContainer.scrollTop).toBe(99999);
  });

  // 9) Register app listeners and handle deeplink to build home back path.
  it('wires appStateChange to appUrlOpen and forwards deeplink path to back-button helper', async () => {
    render(<Leaderboard />);

    await eventually(() => {
      expect(mockAddListener).toHaveBeenCalled();
    });

    const calls = mockAddListener.mock.calls as any[][];
    const appStateChangeCall = calls.find(
      (call) => call[0] === 'appStateChange',
    );
    expect(appStateChangeCall).toBeTruthy();

    const appStateChangeHandler = appStateChangeCall?.[1];
    expect(typeof appStateChangeHandler).toBe('function');
    if (typeof appStateChangeHandler !== 'function') {
      throw new Error('appStateChange handler is missing');
    }
    appStateChangeHandler();

    const appUrlOpenCall = calls.find((call) => call[0] === 'appUrlOpen');
    expect(appUrlOpenCall).toBeTruthy();

    const appUrlOpenHandler = appUrlOpenCall?.[1];
    expect(typeof appUrlOpenHandler).toBe('function');
    if (typeof appUrlOpenHandler !== 'function') {
      throw new Error('appUrlOpen handler is missing');
    }
    appUrlOpenHandler({
      url: 'https://example.com/leaderboard?classCode=class-123',
    });

    expect(mockSetPathToBackButton).toHaveBeenCalledWith(
      `${PAGES.HOME}?page=/leaderboard&classCode=class-123`,
      mockHistory,
    );
  });
});
