import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MODES, PAGES } from '../common/constants';
import { renderWithProviders } from '../tests/test-utils';

const originalStderrWrite = process.stderr.write.bind(process.stderr);
beforeAll(() => {
  (process.stderr.write as any) = process.stdout.write.bind(process.stdout);
});
afterAll(() => {
  (process.stderr.write as any) = originalStderrWrite;
});

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

jest.mock('react-share', () => ({
  EmailShareButton: ({ children }: any) => <div>{children}</div>,
  EmailIcon: () => <span />,
  FacebookIcon: () => <span />,
  TwitterIcon: () => <span />,
  WhatsappIcon: () => <span />,
}));

const mockChangeLanguage = jest.fn();
jest.mock('../i18n', () => ({
  __esModule: true,
  default: {
    changeLanguage: (...args: any[]) => mockChangeLanguage(...args),
  },
}));

const mockHistoryReplace = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useHistory: () => ({
      replace: mockHistoryReplace,
    }),
  };
});

const mockSetCurrMode = jest.fn();
const mockGetCurrMode = jest.fn();
jest.mock('../utility/schoolUtil', () => ({
  schoolUtil: {
    setCurrMode: (...args: any[]) => mockSetCurrMode(...args),
    getCurrMode: (...args: any[]) => mockGetCurrMode(...args),
  },
}));

const mockSetPathToBackButton = jest.fn();
const mockMergeStudentsByUpdatedAt = jest.fn();
const mockSetCurrentSound = jest.fn();
const mockSetCurrentMusic = jest.fn();
jest.mock('../utility/util', () => ({
  Util: {
    setPathToBackButton: (...args: any[]) => mockSetPathToBackButton(...args),
    mergeStudentsByUpdatedAt: (...args: any[]) =>
      mockMergeStudentsByUpdatedAt(...args),
    getCurrentSound: jest.fn(() => 0),
    getCurrentMusic: jest.fn(() => 0),
    setCurrentSound: (...args: any[]) => mockSetCurrentSound(...args),
    setCurrentMusic: (...args: any[]) => mockSetCurrentMusic(...args),
  },
}));

jest.mock('../components/parent/ProfileCard', () => ({
  __esModule: true,
  default: ({ userType, user, setReloadProfiles }: any) => (
    <div>
      <div data-testid="profile-card">
        {userType ? (user?.id ?? 'student') : 'empty'}
      </div>
      {userType ? (
        <button
          type="button"
          onClick={() => setReloadProfiles?.((p: boolean) => !p)}
        >
          reload
        </button>
      ) : null}
    </div>
  ),
}));

const mockToggleCheckedByTitle = new Map<string, boolean>();
jest.mock('../components/parent/ToggleButton', () => ({
  __esModule: true,
  default: ({ title, onIonChangeClick }: any) => (
    <button
      type="button"
      onClick={() => {
        const prev = mockToggleCheckedByTitle.get(title) ?? false;
        const next = !prev;
        mockToggleCheckedByTitle.set(title, next);

        try {
          onIonChangeClick?.({ detail: { checked: next } });
        } catch {
          onIonChangeClick?.();
        }
      }}
    >
      {title}
    </button>
  ),
}));

jest.mock('../components/DropDown', () => ({
  __esModule: true,
  default: ({ optionList, currentValue, onValueChange }: any) => (
    <select
      aria-label="language-dropdown"
      value={currentValue ?? ''}
      onChange={(e) => onValueChange(e.target.value)}
    >
      <option value="" disabled>
        select
      </option>
      {(optionList ?? []).map((opt: any) => (
        <option key={opt.id} value={opt.id}>
          {opt.displayName}
        </option>
      ))}
    </select>
  ),
}));

jest.mock('../components/parent/ParentLogout', () => ({
  __esModule: true,
  default: () => <div data-testid="parent-logout" />,
}));

jest.mock('../components/parent/DeleteParentAccount', () => ({
  __esModule: true,
  default: () => <div data-testid="delete-parent-account" />,
}));

jest.mock('../components/studentProgress/CustomAppBar', () => ({
  __esModule: true,
  default: ({ tabs, onChange, handleBackButton }: any) => (
    <div data-testid="custom-app-bar">
      <button type="button" onClick={() => handleBackButton?.()}>
        back
      </button>
      <button type="button" onClick={() => onChange?.('___unknown___')}>
        unknown
      </button>
      {Object.keys(tabs ?? {}).map((k) => (
        <button key={k} type="button" onClick={() => onChange(k)}>
          {k}
        </button>
      ))}
    </div>
  ),
}));

const mockApiHandler = {
  getParentStudentProfiles: jest.fn(),
  getSchoolsForUser: jest.fn(),
  getAllLanguages: jest.fn(),
  updateLanguage: jest.fn(),
  updateSoundFlag: jest.fn(),
  updateMusicFlag: jest.fn(),
};
const mockAuthHandler = {
  getCurrentUser: jest.fn(),
};
jest.mock('../services/ServiceConfig', () => ({
  ServiceConfig: {
    getI: () => ({
      apiHandler: mockApiHandler,
      authHandler: mockAuthHandler,
    }),
  },
}));

const Parent = require('./Parent').default;

describe('Parent page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToggleCheckedByTitle.clear();

    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('school', JSON.stringify({ id: 'school-1' }));
    localStorage.setItem('class', JSON.stringify({ id: 'class-1' }));
    localStorage.setItem('language', 'en');

    (window as any).open = jest.fn();

    mockGetCurrMode.mockResolvedValue(MODES.PARENT);
    mockMergeStudentsByUpdatedAt.mockImplementation(
      (profiles: any[]) => profiles,
    );

    mockApiHandler.getSchoolsForUser.mockResolvedValue([]);
    mockApiHandler.getAllLanguages.mockResolvedValue([
      { id: 'lang-1', name: 'English', code: 'en' },
      { id: 'lang-2', name: 'Hindi', code: 'hi' },
    ]);
    mockApiHandler.getParentStudentProfiles.mockResolvedValue([
      { id: 'student-1' },
    ]);
  });

  it('renders the Profile tab by default and shows student profile cards', async () => {
    mockAuthHandler.getCurrentUser.mockResolvedValue({
      id: 'parent-1',
      name: 'Parent',
      language_id: 'lang-1',
    });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([
      { school: { id: 'school-1' }, role: 'TEACHER' },
    ]);

    renderWithProviders(<Parent />);

    await waitFor(() =>
      expect(mockApiHandler.getParentStudentProfiles).toHaveBeenCalledTimes(1),
    );
    await waitFor(() =>
      expect(mockApiHandler.getSchoolsForUser).toHaveBeenCalledWith('parent-1'),
    );

    await waitFor(() =>
      expect(screen.getAllByTestId('profile-card')).toHaveLength(3),
    );
  });

  it('switches to Setting tab via app bar', async () => {
    const user = userEvent.setup();
    mockAuthHandler.getCurrentUser.mockResolvedValue({
      id: 'parent-1',
      name: 'Parent',
      language_id: 'lang-1',
    });

    renderWithProviders(<Parent />);

    await user.click(await screen.findByRole('button', { name: 'setting' }));
    expect(await screen.findByText('Language')).toBeInTheDocument();
    expect(screen.getByLabelText('language-dropdown')).toBeInTheDocument();
  });

  it('navigates to Add Teacher Name when switching to teacher mode and name is missing', async () => {
    const user = userEvent.setup();
    mockAuthHandler.getCurrentUser.mockResolvedValue({
      id: 'parent-1',
      name: '  ',
      language_id: 'lang-1',
    });

    renderWithProviders(<Parent />);

    await user.click(await screen.findByRole('button', { name: 'setting' }));
    await user.click(
      await screen.findByRole('button', { name: "Switch to Teacher's Mode" }),
    );

    await waitFor(() =>
      expect(mockHistoryReplace).toHaveBeenCalledWith(PAGES.ADD_TEACHER_NAME),
    );
  });

  it('switches to teacher mode when name is present', async () => {
    const user = userEvent.setup();
    mockAuthHandler.getCurrentUser.mockResolvedValue({
      id: 'parent-1',
      name: 'Parent1',
      language_id: 'lang-1',
    });

    renderWithProviders(<Parent />);

    await user.click(await screen.findByRole('button', { name: 'setting' }));
    await user.click(
      await screen.findByRole('button', { name: "Switch to Teacher's Mode" }),
    );

    await waitFor(() => {
      expect(mockSetCurrMode).toHaveBeenCalledWith(MODES.TEACHER);
      expect(mockHistoryReplace).toHaveBeenCalledWith(PAGES.DISPLAY_SCHOOLS);
    });
  });

  it('updates language via dropdown selection', async () => {
    const user = userEvent.setup();
    mockAuthHandler.getCurrentUser.mockResolvedValue({
      id: 'parent-1',
      name: 'Parent1',
      language_id: 'lang-1',
    });

    renderWithProviders(<Parent />);

    await user.click(await screen.findByRole('button', { name: 'setting' }));

    await user.selectOptions(
      screen.getByLabelText('language-dropdown'),
      'lang-2',
    );

    await waitFor(() =>
      expect(mockApiHandler.updateLanguage).toHaveBeenCalledWith(
        'parent-1',
        'lang-2',
      ),
    );
    expect(localStorage.getItem('language')).toBe('hi');
    expect(mockChangeLanguage).toHaveBeenCalledWith('hi');
  });

  it('calls Util.setPathToBackButton when back is pressed', async () => {
    const user = userEvent.setup();
    mockAuthHandler.getCurrentUser.mockResolvedValue({
      id: 'parent-1',
      name: 'Parent',
      language_id: 'lang-1',
    });

    renderWithProviders(<Parent />);

    await user.click(await screen.findByRole('button', { name: 'back' }));
    expect(mockSetPathToBackButton).toHaveBeenCalledWith(
      PAGES.DISPLAY_STUDENT,
      expect.objectContaining({ replace: mockHistoryReplace }),
    );
  });

  it('toggles Sound and Music and updates flags', async () => {
    const user = userEvent.setup();
    mockAuthHandler.getCurrentUser.mockResolvedValue({
      id: 'parent-1',
      name: 'Parent',
      language_id: 'lang-1',
    });

    renderWithProviders(<Parent />);

    await user.click(await screen.findByRole('button', { name: 'setting' }));

    await user.click(screen.getByRole('button', { name: 'Sound' }));
    await waitFor(() => expect(mockSetCurrentSound).toHaveBeenCalledWith(0));
    await waitFor(() =>
      expect(mockApiHandler.updateSoundFlag).toHaveBeenCalledWith(
        'parent-1',
        true,
      ),
    );

    await user.click(screen.getByRole('button', { name: 'Music' }));
    await waitFor(() => expect(mockSetCurrentMusic).toHaveBeenCalledWith(0));
    await waitFor(() =>
      expect(mockApiHandler.updateMusicFlag).toHaveBeenCalledWith(
        'parent-1',
        true,
      ),
    );
  });

  it('renders Help tab and opens external links', async () => {
    const user = userEvent.setup();
    mockAuthHandler.getCurrentUser.mockResolvedValue({
      id: 'parent-1',
      name: 'Parent',
      language_id: 'lang-1',
    });

    renderWithProviders(<Parent />);

    await user.click(await screen.findByRole('button', { name: 'help' }));
    expect(await screen.findByText('Chimple Help Desk')).toBeInTheDocument();

    await user.click(screen.getByText('Visit Website'));
    expect(window.open).toHaveBeenCalledWith(
      'https://www.chimple.org/',
      '_system',
    );

    await user.click(screen.getByText('WhatsApp Us'));
    expect(window.open).toHaveBeenCalledWith(
      'https://api.whatsapp.com/send?phone=919606018552&text=Hiii !!!!',
      '_system',
    );

    await user.click(screen.getByText('Instagram'));
    expect(window.open).toHaveBeenCalledWith(
      'https://api.instagram.com/chimple_learning/',
      '_system',
    );

    await user.click(screen.getByText('Facebook'));
    expect(window.open).toHaveBeenCalledWith(
      'https://www.facebook.com/chimple',
      '_system',
    );

    await user.click(screen.getByText('Twitter'));
    expect(window.open).toHaveBeenCalledWith(
      'https://twitter.com/chimple_org',
      '_system',
    );
  });

  it('renders FAQ tab and opens the FAQ website link', async () => {
    const user = userEvent.setup();
    mockAuthHandler.getCurrentUser.mockResolvedValue({
      id: 'parent-1',
      name: 'Parent1',
      language_id: 'lang-1',
    });

    renderWithProviders(<Parent />);

    await user.click(await screen.findByRole('button', { name: 'faq' }));
    await user.click(screen.getByText('Please Visit Our Website'));
    expect(window.open).toHaveBeenCalledWith(
      'https://www.chimple.org/in-school-guide-for-teachers',
      '_system',
    );
  });

  it('handles unknown tab change (selectedHeader not found)', async () => {
    const user = userEvent.setup();
    mockAuthHandler.getCurrentUser.mockResolvedValue({
      id: 'parent-1',
      name: 'Parent',
      language_id: 'lang-1',
    });

    renderWithProviders(<Parent />);
    await user.click(await screen.findByRole('button', { name: 'unknown' }));

    expect(screen.getByTestId('custom-app-bar')).toBeInTheDocument();
    expect(screen.queryByText('Language')).not.toBeInTheDocument();
    expect(screen.queryByText('Chimple Help Desk')).not.toBeInTheDocument();
  });

  it('does not crash when auth returns null (init does nothing)', async () => {
    mockAuthHandler.getCurrentUser.mockResolvedValue(null);

    renderWithProviders(<Parent />);

    await waitFor(() =>
      expect(mockApiHandler.getAllLanguages).not.toHaveBeenCalled(),
    );
    expect(screen.getByTestId('custom-app-bar')).toBeInTheDocument();
  });

  it('covers schools condition false paths (null, non-array, empty array)', async () => {
    const user = userEvent.setup();
    mockAuthHandler.getCurrentUser.mockResolvedValueOnce({
      id: 'parent-1',
      name: 'Parent',
      language_id: 'lang-1',
    });
    mockApiHandler.getSchoolsForUser.mockResolvedValueOnce(null as any);
    renderWithProviders(<Parent />);

    await waitFor(() =>
      expect(mockApiHandler.getSchoolsForUser).toHaveBeenCalledWith('parent-1'),
    );

    mockAuthHandler.getCurrentUser.mockResolvedValueOnce({
      id: 'parent-1',
      name: 'Parent',
      language_id: 'lang-1',
    });
    mockApiHandler.getSchoolsForUser.mockResolvedValueOnce({} as any); // non-array
    await user.click(await screen.findByRole('button', { name: 'reload' }));

    await waitFor(() =>
      expect(mockApiHandler.getSchoolsForUser).toHaveBeenCalledTimes(2),
    );

    mockAuthHandler.getCurrentUser.mockResolvedValueOnce({
      id: 'parent-1',
      name: 'Parent',
      language_id: 'lang-1',
    });
    mockApiHandler.getSchoolsForUser.mockResolvedValueOnce([]); // empty array
    await user.click(await screen.findByRole('button', { name: 'reload' }));

    await waitFor(() =>
      expect(mockApiHandler.getSchoolsForUser).toHaveBeenCalledTimes(3),
    );
  });

  it('covers init early return when languages are empty and when not an array', async () => {
    const user = userEvent.setup();
    mockAuthHandler.getCurrentUser.mockResolvedValueOnce({
      id: 'parent-1',
      name: 'Parent',
      language_id: 'lang-1',
    });
    mockApiHandler.getAllLanguages.mockResolvedValueOnce([]);

    renderWithProviders(<Parent />);

    await waitFor(() =>
      expect(mockApiHandler.getAllLanguages).toHaveBeenCalled(),
    );
    expect(mockChangeLanguage).not.toHaveBeenCalled();

    mockAuthHandler.getCurrentUser.mockResolvedValueOnce({
      id: 'parent-1',
      name: 'Parent',
      language_id: 'lang-1',
    });
    mockApiHandler.getAllLanguages.mockResolvedValueOnce(null as any);
    await user.click(await screen.findByRole('button', { name: 'reload' }));

    await waitFor(() =>
      expect(mockApiHandler.getAllLanguages).toHaveBeenCalledTimes(2),
    );
  });

  it('does not call i18n.changeLanguage when selected language has no code', async () => {
    mockAuthHandler.getCurrentUser.mockResolvedValue({
      id: 'parent-1',
      name: 'Parent',
      language_id: 'lang-nocode',
    });
    mockApiHandler.getAllLanguages.mockResolvedValue([
      { id: 'lang-nocode', name: 'NoCode' }, // code missing
    ] as any);

    renderWithProviders(<Parent />);

    await waitFor(() =>
      expect(mockApiHandler.getAllLanguages).toHaveBeenCalled(),
    );
    expect(mockChangeLanguage).not.toHaveBeenCalled();
  });

  it('language change: returns early when langDoc is not found, and skips updateLanguage when currentUser is null', async () => {
    const user = userEvent.setup();

    mockAuthHandler.getCurrentUser.mockResolvedValueOnce({
      id: 'parent-1',
      name: 'Parent',
      language_id: 'lang-1',
    });
    mockAuthHandler.getCurrentUser.mockResolvedValueOnce(null);

    renderWithProviders(<Parent />);

    await user.click(await screen.findByRole('button', { name: 'setting' }));

    const select = screen.getByLabelText('language-dropdown');

    mockApiHandler.getAllLanguages.mockResolvedValueOnce([
      { id: 'lang-1', name: 'English', code: 'en' },
    ]);
    fireEvent.change(select, { target: { value: 'missing-lang' } });

    await waitFor(() =>
      expect(mockApiHandler.updateLanguage).not.toHaveBeenCalled(),
    );

    mockApiHandler.getAllLanguages.mockResolvedValueOnce([
      { id: 'lang-1', name: 'English', code: 'en' },
      { id: 'lang-2', name: 'Hindi', code: 'hi' },
    ]);
    fireEvent.change(select, { target: { value: 'lang-2' } });

    await waitFor(() =>
      expect(mockApiHandler.updateLanguage).not.toHaveBeenCalled(),
    );
  });

  it('Sound/Music toggles cover checked=false and currentUser=null branches', async () => {
    const user = userEvent.setup();
    mockAuthHandler.getCurrentUser
      .mockResolvedValueOnce({
        id: 'parent-1',
        name: 'Parent',
        language_id: 'lang-1',
      })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'parent-1',
        name: 'Parent1',
        language_id: 'lang-1',
      });

    renderWithProviders(<Parent />);
    await user.click(await screen.findByRole('button', { name: 'setting' }));

    await user.click(screen.getByRole('button', { name: 'Sound' }));
    await user.click(screen.getByRole('button', { name: 'Sound' }));
    await waitFor(() => expect(mockSetCurrentSound).toHaveBeenCalledWith(1));

    await user.click(screen.getByRole('button', { name: 'Music' }));
    await user.click(screen.getByRole('button', { name: 'Music' }));
    await waitFor(() => expect(mockSetCurrentMusic).toHaveBeenCalledWith(1));
  });

  it('re-runs init after reloadProfiles to cover the tabIndex already-set path', async () => {
    const user = userEvent.setup();
    mockAuthHandler.getCurrentUser.mockResolvedValue({
      id: 'parent-1',
      name: 'Parent',
      language_id: 'lang-1',
    });

    renderWithProviders(<Parent />);

    await waitFor(() =>
      expect(mockApiHandler.getAllLanguages).toHaveBeenCalledTimes(1),
    );

    await user.click(await screen.findByRole('button', { name: 'reload' }));

    await waitFor(() =>
      expect(mockApiHandler.getAllLanguages).toHaveBeenCalledTimes(2),
    );
  });

  it('uses English when parent language_id is null', async () => {
    mockAuthHandler.getCurrentUser.mockResolvedValue({
      id: 'parent-1',
      name: 'Parent1',
      language_id: null,
    });
    mockApiHandler.getAllLanguages.mockResolvedValue([
      { id: 'lang-2', name: 'Hindi', code: 'hi' },
      {
        id: '7eaf3509-e44e-460f-80a1-7f6a13a8a883',
        name: 'English',
        code: 'en',
      },
    ]);

    renderWithProviders(<Parent />);

    await waitFor(() =>
      expect(mockApiHandler.getAllLanguages).toHaveBeenCalled(),
    );
    expect(mockChangeLanguage).toHaveBeenCalledWith('en');
    expect(localStorage.getItem('language')).toBe('en');
  });

  it('language change covers nullish-coalescing when langDoc.code is undefined', async () => {
    const user = userEvent.setup();
    mockAuthHandler.getCurrentUser.mockResolvedValue({
      id: 'parent-1',
      name: 'Parent1',
      language_id: 'lang-1',
    });
    mockApiHandler.getAllLanguages.mockResolvedValue([
      { id: 'lang-1', name: 'English', code: 'en' },
      { id: 'lang-3', name: 'NoCode', code: undefined },
    ] as any);

    renderWithProviders(<Parent />);
    await user.click(await screen.findByRole('button', { name: 'setting' }));

    await user.selectOptions(
      screen.getByLabelText('language-dropdown'),
      'lang-3',
    );

    await waitFor(() => expect(mockChangeLanguage).toHaveBeenCalledWith(''));
    expect(localStorage.getItem('language')).toBe('');
  });

  it('Music toggle covers currentUser=null branch (does not call updateMusicFlag)', async () => {
    const user = userEvent.setup();

    mockAuthHandler.getCurrentUser
      // init user
      .mockResolvedValueOnce({
        id: 'parent-1',
        name: 'Parent',
        language_id: 'lang-1',
      })
      // music toggle user fetch
      .mockResolvedValueOnce(null);

    renderWithProviders(<Parent />);

    await user.click(await screen.findByRole('button', { name: 'setting' }));
    await user.click(screen.getByRole('button', { name: 'Music' }));

    await waitFor(() => expect(mockSetCurrentMusic).toHaveBeenCalled());
    expect(mockApiHandler.updateMusicFlag).not.toHaveBeenCalled();
  });
});
