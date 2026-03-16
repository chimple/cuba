import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfileMenu from './ProfileMenu';
import { useFeatureIsOn } from '@growthbook/growthbook-react';
import { ServiceConfig } from '../../services/ServiceConfig';
import { Util } from '../../utility/util';
import { useAppSelector } from '../../redux/hooks';
import { MemoryRouter } from 'react-router-dom';
import {
  EVENTS,
  PAGES,
  STICKER_BOOK_NOTIFICATION_DOT_ENABLED,
  ENABLE_STICKER_BOOK,
} from '../../common/constants';

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
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useHistory: () => ({
    push: mockPush,
    replace: jest.fn(),
    location: { pathname: '/' },
  }),
}));

// Mock useGbContext
jest.mock('../../growthbook/Growthbook', () => ({
  useGbContext: () => ({ setGbUpdated: jest.fn() }),
}));

const mockApi = {
  getUserSticker: jest.fn(),
  updateRewardAsSeen: jest.fn(),
  getAllLanguages: jest.fn().mockResolvedValue([]),
};

const mockStudent = { id: 'student-123', name: 'Test Student' };

describe('ProfileMenu Notification Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Use spyOn for ServiceConfig
    jest.spyOn(ServiceConfig, 'getI').mockReturnValue({
      apiHandler: mockApi,
    } as any);

    (useAppSelector as jest.Mock).mockReturnValue({
      user: { id: 'user-1', language_id: 'lang-1' },
    });
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
    mockApi.getUserSticker.mockResolvedValue([{ id: 's1', is_seen: false }]);

    render(
      <MemoryRouter>
        <ProfileMenu onClose={jest.fn()} />
      </MemoryRouter>,
    );

    // Wait for data to load
    await waitFor(() =>
      expect(mockApi.getUserSticker).toHaveBeenCalledWith(mockStudent.id),
    );

    // Check for the dot
    const dot = screen.getByTestId('sticker-book-notification-dot');
    expect(dot).toBeInTheDocument();
  });

  test('hides notification dot when all stickers are seen', async () => {
    mockApi.getUserSticker.mockResolvedValue([{ id: 's1', is_seen: true }]);

    render(
      <MemoryRouter>
        <ProfileMenu onClose={jest.fn()} />
      </MemoryRouter>,
    );

    await waitFor(() => expect(mockApi.getUserSticker).toHaveBeenCalled());

    const dot = screen.queryByTestId('sticker-book-notification-dot');
    expect(dot).not.toBeInTheDocument();
  });

  test('hides notification dot when feature flag is disabled', async () => {
    mockApi.getUserSticker.mockResolvedValue([{ id: 's1', is_seen: false }]);
    (useFeatureIsOn as jest.Mock).mockImplementation((flag) => {
      if (flag === STICKER_BOOK_NOTIFICATION_DOT_ENABLED) return false;
      return true;
    });

    render(
      <MemoryRouter>
        <ProfileMenu onClose={jest.fn()} />
      </MemoryRouter>,
    );

    await waitFor(() => expect(mockApi.getUserSticker).toHaveBeenCalled());

    const dot = screen.queryByTestId('sticker-book-notification-dot');
    expect(dot).not.toBeInTheDocument();
  });

  test('clears notification and calls API when clicking Sticker Book', async () => {
    mockApi.getUserSticker.mockResolvedValue([{ id: 's1', is_seen: false }]);

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
    expect(mockApi.updateRewardAsSeen).toHaveBeenCalledWith(mockStudent.id);

    // Dot should disappear from UI
    await waitFor(() => {
      expect(
        screen.queryByTestId('sticker-book-notification-dot'),
      ).not.toBeInTheDocument();
    });

    expect(mockPush).toHaveBeenCalledWith(
      PAGES.STICKER_BOOK,
      expect.any(Object),
    );
  });
});
