import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfileMenu from './ProfileMenu';
import { useFeatureIsOn } from '@growthbook/growthbook-react';
import { ServiceConfig } from '../../services/ServiceConfig';
import { Util } from '../../utility/util';
import { useAppSelector } from '../../redux/hooks';
import { MemoryRouter } from 'react-router-dom';
import {
  CURRENT_MODE,
  EVENTS,
  MODES,
  PAGES,
  STICKER_BOOK_NOTIFICATION_DOT_ENABLED,
  ENABLE_STICKER_BOOK,
} from '../../common/constants';
import { schoolUtil } from '../../utility/schoolUtil';

// --- Mocks ---

jest.mock('@growthbook/growthbook-react');
jest.mock('../../utility/util');
jest.mock('../../redux/hooks');
jest.mock('i18next', () => ({
  t: (key: string) => key,
  use: jest.fn().mockReturnThis(),
  init: jest.fn().mockReturnThis(),
  language: 'en',
  changeLanguage: jest.fn(),
}));

jest.mock('../../i18n', () => ({
  __esModule: true,
  default: {
    language: 'en',
    changeLanguage: jest.fn(),
    t: (key: string) => key,
  },
}));

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useHistory: () => ({
    push: mockPush,
    replace: mockReplace,
    location: { pathname: '/' },
  }),
}));

jest.mock('../../utility/schoolUtil', () => ({
  schoolUtil: {
    setCurrentClass: jest.fn(),
  },
}));

// Mock useGbContext
jest.mock('../../growthbook/Growthbook', () => ({
  useGbContext: () => ({ setGbUpdated: jest.fn() }),
  updateLocalAttributes: jest.fn(),
  setCachedGrowthBookFeatureValue: jest.fn(),
}));

const mockApi = {
  getUserStickerBook: jest.fn(),
  markStciekercolledasTrue: jest.fn().mockResolvedValue(undefined),
  updateRewardAsSeen: jest.fn(),
  getAllLanguages: jest.fn().mockResolvedValue([]),
};

const mockStudent = { id: 'student-123', name: 'Test Student' };
const mockSetCurrentClass = schoolUtil.setCurrentClass as jest.Mock;

describe('ProfileMenu Notification Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockApi.getUserStickerBook.mockReset();
    mockApi.getUserStickerBook.mockResolvedValue([]);
    mockApi.markStciekercolledasTrue.mockReset();
    mockApi.markStciekercolledasTrue.mockResolvedValue(undefined);
    mockApi.updateRewardAsSeen.mockReset();

    // Use spyOn for ServiceConfig
    jest.spyOn(ServiceConfig, 'getI').mockReturnValue({
      apiHandler: mockApi,
    } as any);

    (useAppSelector as jest.Mock).mockImplementation((selector: any) =>
      selector({
        auth: { user: { id: 'user-1', language_id: 'lang-1' } },
        growthbook: { featureValues: {} },
      }),
    );
    (Util.getCurrentStudent as jest.Mock).mockReturnValue(mockStudent);
    (Util.fetchCurrentClassAndSchool as jest.Mock).mockResolvedValue({
      className: 'Class 1',
      schoolName: 'Test School',
    });

    // Default: Flag ON
    (useFeatureIsOn as jest.Mock).mockImplementation((flag) => {
      if (flag === STICKER_BOOK_NOTIFICATION_DOT_ENABLED) return true;
      if (flag === ENABLE_STICKER_BOOK) return true;
      return false;
    });
  });

  test('shows notification dot when there are unseen stickers', async () => {
    mockApi.getUserStickerBook.mockResolvedValue([
      { id: 's1', is_seen: false },
    ]);

    render(
      <MemoryRouter>
        <ProfileMenu onClose={jest.fn()} />
      </MemoryRouter>,
    );

    // Wait for data to load
    await waitFor(() =>
      expect(mockApi.getUserStickerBook).toHaveBeenCalledWith(mockStudent.id),
    );

    // Check for the dot
    const dot = screen.getByTestId('sticker-book-notification-dot');
    expect(dot).toBeInTheDocument();
  });

  test('hides notification dot when all stickers are seen', async () => {
    mockApi.getUserStickerBook.mockResolvedValue([{ id: 's1', is_seen: true }]);

    render(
      <MemoryRouter>
        <ProfileMenu onClose={jest.fn()} />
      </MemoryRouter>,
    );

    await waitFor(() => expect(mockApi.getUserStickerBook).toHaveBeenCalled());

    const dot = screen.queryByTestId('sticker-book-notification-dot');
    expect(dot).not.toBeInTheDocument();
  });

  test('hides notification dot when feature flag is disabled', async () => {
    mockApi.getUserStickerBook.mockResolvedValue([
      { id: 's1', is_seen: false },
    ]);
    (useFeatureIsOn as jest.Mock).mockImplementation((flag) => {
      if (flag === STICKER_BOOK_NOTIFICATION_DOT_ENABLED) return false;
      return true;
    });

    render(
      <MemoryRouter>
        <ProfileMenu onClose={jest.fn()} />
      </MemoryRouter>,
    );

    await waitFor(() => expect(mockApi.getUserStickerBook).toHaveBeenCalled());

    const dot = screen.queryByTestId('sticker-book-notification-dot');
    expect(dot).not.toBeInTheDocument();
  });

  test('clears notification when clicking Sticker Book', async () => {
    mockApi.getUserStickerBook.mockResolvedValue([
      { id: 's1', is_seen: false },
    ]);

    render(
      <MemoryRouter>
        <ProfileMenu onClose={jest.fn()} />
      </MemoryRouter>,
    );

    await screen.findByTestId('sticker-book-notification-dot');

    const stickerBookItem = screen
      .getByText(/STICKER BOOK/i)
      .closest('.profile-menu-item');
    fireEvent.click(stickerBookItem!);

    expect(Util.logEvent).toHaveBeenCalledWith(
      EVENTS.STICKER_BOOK_MENU_TAP,
      expect.any(Object),
    );
    expect(mockApi.markStciekercolledasTrue).toHaveBeenCalledWith(
      mockStudent.id,
    );
    expect(mockApi.updateRewardAsSeen).not.toHaveBeenCalled();

    // Dot should disappear from UI
    await waitFor(() => {
      expect(
        screen.queryByTestId('sticker-book-notification-dot'),
      ).not.toBeInTheDocument();
    });

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: PAGES.STICKER_BOOK,
        state: expect.any(Object),
      }),
    );
  });

  test('keeps school-mode switch profile on SelectMode selection flow', async () => {
    localStorage.setItem(CURRENT_MODE, MODES.TEACHER_SCHOOL);

    render(
      <MemoryRouter>
        <ProfileMenu onClose={jest.fn()} />
      </MemoryRouter>,
    );

    await waitFor(() => expect(mockApi.getUserStickerBook).toHaveBeenCalled());

    const switchProfileItem = screen
      .getByText(/Switch Profile/i)
      .closest('.profile-menu-item');
    fireEvent.click(switchProfileItem!);

    await waitFor(() => {
      expect(Util.setCurrentStudent).toHaveBeenCalledWith(null);
    });
    expect(mockSetCurrentClass).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: PAGES.SELECT_MODE,
        state: {
          from: '/',
          fromSchoolModeSwitchProfile: true,
        },
      }),
    );
  });
});
