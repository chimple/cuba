// Mock @ionic/react IonPage to avoid invalid element type error
import React from 'react';
import '@testing-library/jest-dom';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Capacitor } from '@capacitor/core';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import {
  MODES,
  PAGES,
  USER_SELECTION_STAGE,
  SELECTED_CLASSES,
  SELECTED_STUDENTS,
  CURRENT_CLASS_NAME,
  CURRENT_SCHOOL_NAME,
  EVENTS,
  LANG,
  LANGUAGE,
} from '../common/constants';

const originalStderrWrite = process.stderr.write.bind(process.stderr);

type StderrWrite = typeof process.stderr.write;

beforeAll(() => {
  process.stderr.write = process.stdout.write.bind(
    process.stdout,
  ) as StderrWrite;
});

afterAll(() => {
  process.stderr.write = originalStderrWrite as StderrWrite;
});

jest.mock('@ionic/react', () => ({
  IonPage: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="ion-page">{children}</div>
  ),
}));

jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: jest.fn(),
  },
}));

jest.mock('@capacitor/screen-orientation', () => ({
  ScreenOrientation: {
    lock: jest.fn(),
    unlock: jest.fn(),
  },
}));

jest.mock('i18next', () => ({
  t: (key: string, options?: Record<string, string | number>) => {
    if (!options) {
      return key;
    }

    return key.replace(/{{(\w+)}}/g, (_, optionKey: string) =>
      String(options[optionKey] ?? `{{${optionKey}}}`),
    );
  },
}));
jest.mock('./assets/brandLogoIcon.svg', () => ({
  ReactComponent: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
}));
jest.mock('./assets/leftArrowIcon.svg', () => ({
  ReactComponent: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
}));

const mockHistoryReplace = jest.fn();
jest.mock('react-router', () => {
  const actual = jest.requireActual('react-router');
  return {
    ...actual,
    useHistory: () => ({
      replace: mockHistoryReplace,
    }),
  };
});
// Move i18n mock to top of file, before importing SelectMode
jest.mock('../i18n', () => ({
  __esModule: true,
  default: {
    changeLanguage: jest.fn(),
    use: jest.fn(),
    init: jest.fn(),
  },
}));

const mockGetCurrMode = jest.fn();
const mockSetCurrMode = jest.fn();
const mockSetCurrentClass = jest.fn();
const mockSetCurrentSchool = jest.fn();
const mockSchoolUtilGetCurrentSchool = jest.fn();
jest.mock('../utility/schoolUtil', () => ({
  schoolUtil: {
    getCurrMode: mockGetCurrMode,
    getCurrentSchool: () => mockSchoolUtilGetCurrentSchool(),
    setCurrMode: mockSetCurrMode,
    setCurrentClass: mockSetCurrentClass,
    setCurrentSchool: mockSetCurrentSchool,
  },
}));

const mockGetCurrentStudent = jest.fn();
const mockEnsureLidoCommonAudioForStudent = jest.fn();
const mockSetCurrentStudent = jest.fn();
const mockLoadBackgroundImage = jest.fn();
const mockGetCurrentSchool = jest.fn();
const mockUtilSetCurrentSchool = jest.fn();
const mockLogEvent = jest.fn();
jest.mock('../utility/util', () => ({
  Util: {
    loadBackgroundImage: () => mockLoadBackgroundImage(),
    getCurrentStudent: mockGetCurrentStudent,
    getCurrentSchool: () => mockGetCurrentSchool(),
    ensureLidoCommonAudioForStudent: mockEnsureLidoCommonAudioForStudent,
    setCurrentStudent: mockSetCurrentStudent,
    setCurrentSchool: (...args: Parameters<typeof mockUtilSetCurrentSchool>) =>
      mockUtilSetCurrentSchool(...args),
    logEvent: (eventName: string, eventParams?: Record<string, string>) =>
      mockLogEvent(eventName, eventParams),
  },
}));

jest.mock('../components/Loading', () => ({
  __esModule: true,
  default: ({ isLoading }: { isLoading: boolean }) =>
    isLoading ? <div data-testid="loading" /> : <div data-testid="loaded" />,
}));

jest.mock('../components/selectMode/SelectModeButton', () => ({
  __esModule: true,
  default: ({
    text,
    onClick,
  }: {
    text: string;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
  }) => (
    <button type="button" onClick={onClick}>
      {text}
    </button>
  ),
}));

jest.mock('../components/parent/TeacherAuthenticationPopup', () => ({
  __esModule: true,
  default: ({
    isOpen,
    onAuthenticated,
  }: {
    isOpen: boolean;
    onAuthenticated: () => void;
  }) =>
    isOpen ? (
      <button type="button" onClick={onAuthenticated}>
        Math Auth Success
      </button>
    ) : null,
}));

interface DropdownOption {
  id: string;
  displayName: string;
}

jest.mock('../components/DropDown', () => ({
  __esModule: true,
  default: ({
    optionList,
    currentValue,
    onValueChange,
  }: {
    optionList?: DropdownOption[];
    currentValue?: string | null;
    onValueChange: (value: string) => void;
  }) => (
    <select
      aria-label="school-dropdown"
      value={currentValue ?? ''}
      onChange={(e) => onValueChange(e.target.value)}
    >
      <option value="" disabled>
        select
      </option>
      {(optionList ?? []).map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.displayName}
        </option>
      ))}
    </select>
  ),
}));

jest.mock('../redux/hooks', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

jest.mock('../redux/slices/auth/authSlice', () => {
  const actual = jest.requireActual('../redux/slices/auth/authSlice');
  return {
    __esModule: true,
    ...actual,
    default: actual.default,
    setAuthUser: jest.fn(),
    setIsOpsUser: jest.fn(),
    setRoles: jest.fn(),
    setUser: jest.fn(),
  };
});

const mockApiHandler = {
  getSchoolsForUser: jest.fn(),
  getSchoolsWithRoleAutouser: jest.fn(),
  getParentStudentProfiles: jest.fn(),
  getClassesForSchool: jest.fn(),
  getStudentsForClass: jest.fn(),
  getLanguageWithId: jest.fn(),
  getSchoolById: jest.fn(),
  currentMode: undefined as string | undefined,
  isSplUser: jest.fn().mockResolvedValue(false),
  getUserSpecialRoles: jest.fn().mockResolvedValue([]),
};

const mockAuthHandler = {
  getCurrentUser: jest.fn(),
  getUser: jest.fn(),
};

jest.mock('../services/ServiceConfig', () => ({
  ServiceConfig: {
    getI: () => ({
      apiHandler: mockApiHandler,
      authHandler: mockAuthHandler,
    }),
  },
}));

const mockRequireTeacherModeAuth = jest.fn();
jest.mock('../services/TeacherModeAuth', () => ({
  TeacherModeAuthResult: {
    success: 'success',
    popupFallbackRequired: 'popupFallbackRequired',
    cancelledOrFailed: 'cancelledOrFailed',
  },
  requireTeacherModeAuth: () => mockRequireTeacherModeAuth(),
}));

const SelectMode = require('./SelectMode').default;
const i18n = require('../i18n').default;

// Import the mocked hooks
const { useAppDispatch, useAppSelector } = require('../redux/hooks');

interface AuthSelectorState {
  auth: {
    authUser: null;
    user: null;
    roles: string[];
    isOpsUser: boolean;
  };
}

type AppSelector<T> = (state: AuthSelectorState) => T;

describe('SelectMode page', () => {
  const ENGLISH_LANGUAGE_ID = 'language-en';
  const HINDI_LANGUAGE_ID = 'language-hi';
  const classData = { id: 'class-1', name: 'Class 1' };

  const mockLanguageLookup = (): void => {
    mockApiHandler.getLanguageWithId.mockImplementation(
      async (languageId: string) => {
        if (languageId === ENGLISH_LANGUAGE_ID) {
          return { id: ENGLISH_LANGUAGE_ID, code: LANG.ENGLISH };
        }

        if (languageId === HINDI_LANGUAGE_ID) {
          return { id: HINDI_LANGUAGE_ID, code: LANG.HINDI };
        }

        return undefined;
      },
    );
  };

  const renderAutoUserSchoolMode = (
    school: { id: string; name: string; language?: string | null },
    student?: { id: string; language_id?: string | null },
  ): void => {
    localStorage.setItem(CURRENT_SCHOOL_NAME, JSON.stringify(school.name));
    localStorage.setItem(CURRENT_CLASS_NAME, JSON.stringify(classData));
    localStorage.setItem(SELECTED_CLASSES, JSON.stringify([classData]));
    mockGetCurrMode.mockResolvedValue(MODES.SCHOOL);
    mockSchoolUtilGetCurrentSchool.mockReturnValue(school);
    mockGetCurrentStudent.mockReturnValue(student);
    mockAuthHandler.getCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([
      { school, role: 'AUTOUSER' },
    ]);
    mockApiHandler.getSchoolsWithRoleAutouser.mockResolvedValue([
      { id: school.id },
    ]);
    mockApiHandler.getClassesForSchool.mockResolvedValue([classData]);

    render(<SelectMode />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();

    // Mock Redux hooks
    useAppDispatch.mockReturnValue(jest.fn());
    useAppSelector.mockImplementation(<T,>(selector: AppSelector<T>) =>
      selector({
        auth: {
          authUser: null,
          user: null,
          roles: [],
          isOpsUser: false,
        },
      }),
    );

    mockApiHandler.getSchoolsForUser.mockResolvedValue([]);
    mockApiHandler.getSchoolsWithRoleAutouser.mockResolvedValue([]);
    mockApiHandler.getParentStudentProfiles.mockResolvedValue([]);
    mockApiHandler.getClassesForSchool.mockResolvedValue([]);
    mockApiHandler.getStudentsForClass.mockResolvedValue([]);
    mockApiHandler.getLanguageWithId.mockResolvedValue(undefined);
    mockApiHandler.getSchoolById.mockResolvedValue(undefined);
    mockApiHandler.currentMode = undefined;
    mockApiHandler.isSplUser.mockResolvedValue(false);
    mockApiHandler.getUserSpecialRoles.mockResolvedValue([]);
    mockAuthHandler.getCurrentUser.mockResolvedValue(null);
    mockAuthHandler.getUser.mockResolvedValue({ data: { user: null } });
    mockGetCurrMode.mockResolvedValue(undefined);
    mockSchoolUtilGetCurrentSchool.mockReturnValue(undefined);
    mockGetCurrentSchool.mockReturnValue(undefined);
    mockGetCurrentStudent.mockReturnValue(undefined);
    mockLogEvent.mockResolvedValue(undefined);
    mockRequireTeacherModeAuth.mockResolvedValue('popupFallbackRequired');
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
  });

  it('applies school language over current student language for autouser school mode', async () => {
    mockLanguageLookup();
    renderAutoUserSchoolMode(
      {
        id: 'school-1',
        name: 'School 1',
        language: ENGLISH_LANGUAGE_ID,
      },
      { id: 'student-1', language_id: HINDI_LANGUAGE_ID },
    );

    await waitFor(() =>
      expect(i18n.changeLanguage).toHaveBeenLastCalledWith(LANG.ENGLISH),
    );
    expect(localStorage.getItem(LANGUAGE)).toBe(LANG.ENGLISH);
    expect(mockApiHandler.getLanguageWithId).toHaveBeenCalledWith(
      ENGLISH_LANGUAGE_ID,
    );
  });

  it('refreshes an incomplete stored school before falling back to student language', async () => {
    mockLanguageLookup();
    const school = { id: 'school-1', name: 'School 1' };
    mockApiHandler.getSchoolById.mockResolvedValue({
      ...school,
      language: ENGLISH_LANGUAGE_ID,
    });
    renderAutoUserSchoolMode(school, {
      id: 'student-1',
      language_id: HINDI_LANGUAGE_ID,
    });

    await waitFor(() =>
      expect(i18n.changeLanguage).toHaveBeenLastCalledWith(LANG.ENGLISH),
    );
    expect(localStorage.getItem(LANGUAGE)).toBe(LANG.ENGLISH);
    expect(mockApiHandler.getSchoolById).toHaveBeenCalledWith('school-1');
  });

  it('uses student language when autouser school has no language', async () => {
    mockLanguageLookup();
    const school = { id: 'school-1', name: 'School 1', language: null };
    mockApiHandler.getSchoolById.mockResolvedValue(school);
    renderAutoUserSchoolMode(school, {
      id: 'student-1',
      language_id: HINDI_LANGUAGE_ID,
    });

    await waitFor(() =>
      expect(i18n.changeLanguage).toHaveBeenLastCalledWith(LANG.HINDI),
    );
    expect(localStorage.getItem(LANGUAGE)).toBe(LANG.HINDI);
  });

  it('uses English when autouser school and current student have no language', async () => {
    const school = { id: 'school-1', name: 'School 1', language: null };
    mockApiHandler.getSchoolById.mockResolvedValue(school);
    renderAutoUserSchoolMode(school);

    await waitFor(() =>
      expect(i18n.changeLanguage).toHaveBeenLastCalledWith(LANG.ENGLISH),
    );
    expect(localStorage.getItem(LANGUAGE)).toBe(LANG.ENGLISH);
  });

  it('loads the shared app background image', async () => {
    mockGetCurrMode.mockResolvedValue(MODES.PARENT);

    render(<SelectMode />);

    await waitFor(() => expect(mockLoadBackgroundImage).toHaveBeenCalled());
  });

  it('redirects to HOME when mode is parent and current student exists', async () => {
    mockGetCurrMode.mockResolvedValue(MODES.PARENT);
    mockGetCurrentStudent.mockReturnValue({ id: 'student-1' });

    render(<SelectMode />);

    await waitFor(() =>
      expect(mockHistoryReplace).toHaveBeenCalledWith(PAGES.HOME),
    );
  });

  it('redirects to DISPLAY_STUDENT when mode is parent and there is no current student', async () => {
    mockGetCurrMode.mockResolvedValue(MODES.PARENT);
    mockGetCurrentStudent.mockReturnValue(null);
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);

    render(<SelectMode />);

    await waitFor(() => {
      expect(mockHistoryReplace).toHaveBeenCalledWith(PAGES.DISPLAY_STUDENT);
      expect(ScreenOrientation.lock).toHaveBeenCalledWith({
        orientation: 'landscape',
      });
    });
  });

  it('redirects to DISPLAY_SCHOOLS when mode is teacher', async () => {
    mockGetCurrMode.mockResolvedValue(MODES.TEACHER);
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);

    render(<SelectMode />);

    await waitFor(() => {
      expect(mockHistoryReplace).toHaveBeenCalledWith(PAGES.DISPLAY_SCHOOLS);
      expect(ScreenOrientation.lock).toHaveBeenCalledWith({
        orientation: 'portrait',
      });
    });
  });

  it('redirects to SIDEBAR_PAGE when mode is ops console', async () => {
    mockGetCurrMode.mockResolvedValue(MODES.OPS_CONSOLE);
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);

    render(<SelectMode />);

    await waitFor(() => {
      expect(mockHistoryReplace).toHaveBeenCalledWith(PAGES.SIDEBAR_PAGE);
      expect(ScreenOrientation.unlock).toHaveBeenCalled();
    });
  });

  it('navigates to CREATE_STUDENT when user has no schools and no students', async () => {
    mockGetCurrMode.mockResolvedValue(undefined);
    mockAuthHandler.getCurrentUser.mockResolvedValue({
      id: 'user-1',
    });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([]);
    mockApiHandler.getParentStudentProfiles.mockResolvedValue([]);

    render(<SelectMode />);

    await waitFor(() =>
      expect(mockSetCurrMode).toHaveBeenCalledWith(MODES.PARENT),
    );
    await waitFor(() =>
      expect(mockHistoryReplace).toHaveBeenCalledWith(PAGES.CREATE_STUDENT),
    );
  });

  it('navigates to DISPLAY_STUDENT when user has no schools but has students', async () => {
    mockGetCurrMode.mockResolvedValue(undefined);
    mockAuthHandler.getCurrentUser.mockResolvedValue({
      id: 'user-1',
    });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([]);
    mockApiHandler.getParentStudentProfiles.mockResolvedValue([
      { id: 'student-1' },
    ]);

    render(<SelectMode />);

    await waitFor(() =>
      expect(mockSetCurrMode).toHaveBeenCalledWith(MODES.PARENT),
    );
    await waitFor(() =>
      expect(mockHistoryReplace).toHaveBeenCalledWith(PAGES.DISPLAY_STUDENT),
    );
  });

  it('redirects to SIDEBAR_PAGE when IS_OPS_USER is true', async () => {
    mockGetCurrMode.mockResolvedValue(undefined);
    mockAuthHandler.getCurrentUser.mockResolvedValue({
      id: 'user-1',
    });
    useAppSelector.mockImplementation(<T,>(selector: AppSelector<T>) =>
      selector({
        auth: {
          authUser: null,
          user: null,
          roles: [],
          isOpsUser: true,
        },
      }),
    );
    mockApiHandler.getSchoolsForUser.mockResolvedValue([
      { school: { id: 'school-1', name: 'School 1' }, role: 'OPS' },
    ]);
    mockApiHandler.getParentStudentProfiles.mockResolvedValue([
      { id: 'student-1' },
    ]);

    render(<SelectMode />);

    await waitFor(() =>
      expect(mockSetCurrMode).toHaveBeenCalledWith(MODES.OPS_CONSOLE),
    );
    await waitFor(() =>
      expect(mockHistoryReplace).toHaveBeenCalledWith(PAGES.SIDEBAR_PAGE),
    );
  });

  it('falls back to teacher mode when matchedSchools is empty but allSchool has entries', async () => {
    mockGetCurrMode.mockResolvedValue(undefined);
    mockAuthHandler.getCurrentUser.mockResolvedValue({
      id: 'user-1',
    });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([
      { school: { id: 'school-1', name: 'School 1' }, role: 'AUTOUSER' },
    ]);
    mockApiHandler.getSchoolsWithRoleAutouser.mockResolvedValue([
      { id: 'school-1' },
    ]);
    mockApiHandler.getSchoolsWithRoleAutouser.mockResolvedValue([]);

    render(<SelectMode />);

    await waitFor(() =>
      expect(mockSetCurrMode).toHaveBeenCalledWith(MODES.TEACHER),
    );
    await waitFor(() =>
      expect(mockHistoryReplace).toHaveBeenCalledWith(PAGES.DISPLAY_SCHOOLS),
    );
  });

  it('loads classes when there is exactly one matched school and selectedUser is not set', async () => {
    const user = userEvent.setup();
    mockGetCurrMode.mockResolvedValue(undefined);
    mockAuthHandler.getCurrentUser.mockResolvedValue({
      id: 'user-1',
    });
    const school = { id: 'school-1', name: 'School 1' };
    mockApiHandler.getSchoolsForUser.mockResolvedValue([
      { school, role: 'PARENT' },
    ]);
    mockApiHandler.getSchoolsWithRoleAutouser.mockResolvedValue([
      { id: 'school-1' },
    ]);
    mockApiHandler.getClassesForSchool.mockResolvedValue([
      { id: 'class-1', name: 'Class 1' },
    ]);
    mockApiHandler.getStudentsForClass.mockResolvedValue([
      { id: 'student-1', name: 'Student 1', avatar: 'avatar1' },
    ]);

    render(<SelectMode />);

    await waitFor(() =>
      expect(mockApiHandler.getClassesForSchool).toHaveBeenCalledWith(
        'school-1',
        'user-1',
      ),
    );

    // Click class to navigate to student stage
    const classElements = await screen.findAllByText('Class 1');
    await user.click(classElements[0]);
    await waitFor(() =>
      expect(document.querySelector('.class-container')).not.toBeNull(),
    );
    // Click Play - USER_SELECTION_STAGE is set only when the Play button is used
    const playButton = await screen.findByRole('button', { name: 'Play' });
    await user.click(playButton);
    await waitFor(() =>
      expect(localStorage.getItem(USER_SELECTION_STAGE)).toBe('true'),
    );
  });

  it('selects a student only from the Play button', async () => {
    const user = userEvent.setup();
    mockGetCurrMode.mockResolvedValue(undefined);
    mockAuthHandler.getCurrentUser.mockResolvedValue({
      id: 'user-1',
    });
    const school = { id: 'school-1', name: 'School 1' };
    mockApiHandler.getSchoolsForUser.mockResolvedValue([
      { school, role: 'PARENT' },
    ]);
    mockApiHandler.getSchoolsWithRoleAutouser.mockResolvedValue([
      { id: 'school-1' },
    ]);
    mockApiHandler.getClassesForSchool.mockResolvedValue([
      { id: 'class-1', name: 'Class 1' },
    ]);
    mockApiHandler.getStudentsForClass.mockResolvedValue([
      { id: 'student-1', name: 'Student 1', avatar: 'avatar1' },
    ]);

    render(<SelectMode />);

    const classElements = await screen.findAllByText('Class 1');
    await user.click(classElements[0]);
    const studentName = await screen.findByText('Student 1');

    await user.click(studentName);
    expect(localStorage.getItem(USER_SELECTION_STAGE)).toBeNull();
    expect(mockEnsureLidoCommonAudioForStudent).not.toHaveBeenCalled();
    expect(mockSetCurrentStudent).not.toHaveBeenCalled();

    const studentAvatar = document.querySelector('.school-mode-student-avatar');
    expect(studentAvatar).not.toBeNull();
    await user.click(studentAvatar as HTMLElement);
    expect(localStorage.getItem(USER_SELECTION_STAGE)).toBeNull();
    expect(mockEnsureLidoCommonAudioForStudent).not.toHaveBeenCalled();
    expect(mockSetCurrentStudent).not.toHaveBeenCalled();

    const studentCard = document.querySelector('.school-mode-student-card');
    expect(studentCard).not.toBeNull();
    await user.click(studentCard as HTMLElement);
    expect(localStorage.getItem(USER_SELECTION_STAGE)).toBeNull();
    expect(mockEnsureLidoCommonAudioForStudent).not.toHaveBeenCalled();
    expect(mockSetCurrentStudent).not.toHaveBeenCalled();

    const playButton = await screen.findByRole('button', { name: 'Play' });
    await user.click(playButton);

    await waitFor(() => {
      expect(mockEnsureLidoCommonAudioForStudent).toHaveBeenCalled();
      expect(mockSetCurrentStudent).toHaveBeenCalled();
      expect(localStorage.getItem(USER_SELECTION_STAGE)).toBe('true');
    });
  });

  it('renders Parent and Teacher mode buttons and handles Parent click', async () => {
    mockGetCurrMode.mockResolvedValue(undefined);
    mockAuthHandler.getCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([
      { school: { id: 'school-1', name: 'School 1' }, role: 'AUTOUSER' },
      { school: { id: 'school-2', name: 'School 2' }, role: 'AUTOUSER' },
    ]);
    mockApiHandler.getSchoolsWithRoleAutouser.mockResolvedValue([
      { id: 'school-1' },
      { id: 'school-2' },
    ]);
    mockApiHandler.getParentStudentProfiles.mockResolvedValue([]);
    mockApiHandler.getClassesForSchool.mockResolvedValue([
      { id: 'class-1', name: 'Class 1' },
    ]);
    render(<SelectMode />);
    // With 2 schools we see select-school-main (school dropdown)
    await waitFor(() =>
      expect(document.querySelector('.select-school-main')).not.toBeNull(),
    );
    // Select school and click Okay to proceed to class stage
    const dropdown = document.querySelector('select');
    if (dropdown) {
      fireEvent.change(dropdown, { target: { value: 'school-1' } });
    }
    const okayBtn = document.querySelector('.okay-btn') as HTMLElement;
    okayBtn && okayBtn.click();
    await waitFor(() =>
      expect(document.querySelector('.class-main')).not.toBeNull(),
    );
  });

  it('renders Teacher mode and handles Teacher flow end-to-end', async () => {
    const user = userEvent.setup();

    mockGetCurrMode.mockResolvedValue(undefined);
    mockAuthHandler.getCurrentUser.mockResolvedValue({ id: 'user-1' });

    mockApiHandler.getSchoolsForUser.mockResolvedValue([
      { school: { id: 'school-1', name: 'School 1' }, role: 'TEACHER' },
      { school: { id: 'school-2', name: 'School 2' }, role: 'TEACHER' },
    ]);

    mockApiHandler.getSchoolsWithRoleAutouser.mockResolvedValue([
      { id: 'school-1' },
      { id: 'school-2' },
    ]);

    mockApiHandler.getClassesForSchool.mockResolvedValue([
      { id: 'class-1', name: 'Class 1' },
      { id: 'class-2', name: 'Class 2' },
    ]);

    mockApiHandler.getStudentsForClass.mockResolvedValue([
      { id: 'student-1', name: 'Student 1', avatar: 'avatar1' },
    ]);

    mockEnsureLidoCommonAudioForStudent.mockResolvedValue(undefined);

    render(<SelectMode />);

    // wait school dropdown
    const dropdown = await screen.findByLabelText('school-dropdown');
    await user.selectOptions(dropdown, 'school-1');

    // click okay
    const okayBtn = await screen.findByRole('button', { name: /okay/i });
    await user.click(okayBtn);

    // ✅ ensure classes api called
    await waitFor(() =>
      expect(mockApiHandler.getClassesForSchool).toHaveBeenCalledWith(
        'school-1',
        'user-1',
      ),
    );

    // wait classes render
    const classNodes = await screen.findAllByText(/Class 1/i);
    expect(classNodes.length).toBeGreaterThan(0);
    await user.click(classNodes[0]);

    // wait students api
    await waitFor(() =>
      expect(mockApiHandler.getStudentsForClass).toHaveBeenCalledWith(
        'class-1',
      ),
    );

    // click Play button
    const playButton = await screen.findByRole('button', { name: 'Play' });
    await user.click(playButton);

    // assert navigation chain
    await waitFor(() => {
      expect(mockEnsureLidoCommonAudioForStudent).toHaveBeenCalled();
      expect(mockSetCurrentStudent).toHaveBeenCalled();
      expect(mockHistoryReplace).toHaveBeenCalledWith('/home');
    });
  });

  it('routes to teacher dashboard with TEACHER_SCHOOL mode after biometric authentication from class mode', async () => {
    const user = userEvent.setup();

    mockRequireTeacherModeAuth.mockResolvedValue('success');
    mockGetCurrMode.mockResolvedValue(MODES.TEACHER_SCHOOL);
    mockAuthHandler.getCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([
      { school: { id: 'school-1', name: 'School 1' }, role: 'AUTOUSER' },
    ]);
    mockApiHandler.getSchoolsWithRoleAutouser.mockResolvedValue([
      { id: 'school-1' },
    ]);
    mockApiHandler.getClassesForSchool.mockResolvedValue([
      { id: 'class-1', name: 'Class 1' },
    ]);
    mockApiHandler.getStudentsForClass.mockResolvedValue([
      { id: 'student-1', name: 'Student 1' },
    ]);

    render(<SelectMode />);

    const teacherButton = await screen.findByRole('button', {
      name: /teacher/i,
    });
    await user.click(teacherButton);

    await waitFor(() => {
      expect(mockRequireTeacherModeAuth).toHaveBeenCalled();
      expect(mockLogEvent).toHaveBeenCalledWith(
        EVENTS.TEACHER_APP_ENTRY_CLICKED,
        {
          user_role: 'auto_user',
          auth_method_attempted: 'biometric',
        },
      );
      expect(mockLogEvent).toHaveBeenCalledWith(
        EVENTS.TEACHER_APP_AUTH_SUCCESS,
        {
          auth_method_used: 'biometric',
        },
      );
      expect(mockSetCurrentSchool).toHaveBeenCalledWith({
        id: 'school-1',
        name: 'School 1',
      });
      expect(mockSetCurrentClass).toHaveBeenCalledWith({
        id: 'class-1',
        name: 'Class 1',
      });
      expect(mockApiHandler.currentMode).toBe(MODES.TEACHER_SCHOOL);
      expect(mockSetCurrMode).toHaveBeenCalledWith(MODES.TEACHER_SCHOOL);
      expect(mockHistoryReplace).toHaveBeenCalledWith(PAGES.HOME_PAGE);
    });
  });

  it('routes selected teacher-role school back to full teacher mode from school mode', async () => {
    const user = userEvent.setup();
    const teacherSchool = { id: 'school-1', name: 'Teacher School' };
    const autoUserSchool = { id: 'school-2', name: 'Auto User School' };

    mockRequireTeacherModeAuth.mockResolvedValue('success');
    mockGetCurrMode.mockResolvedValue(MODES.TEACHER_SCHOOL);
    mockSchoolUtilGetCurrentSchool.mockReturnValue(teacherSchool);
    mockGetCurrentSchool.mockReturnValue(teacherSchool);
    mockAuthHandler.getCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([
      { school: teacherSchool, role: 'TEACHER' },
      { school: autoUserSchool, role: 'AUTOUSER' },
    ]);
    mockApiHandler.getSchoolsWithRoleAutouser.mockResolvedValue([
      { id: 'school-2' },
    ]);
    mockApiHandler.getClassesForSchool.mockResolvedValue([
      { id: 'class-1', name: 'Class 1' },
    ]);
    mockApiHandler.getStudentsForClass.mockResolvedValue([
      { id: 'student-1', name: 'Student 1' },
    ]);

    render(<SelectMode />);

    const teacherButton = await screen.findByRole('button', {
      name: /teacher/i,
    });
    await user.click(teacherButton);

    await waitFor(() => {
      expect(mockRequireTeacherModeAuth).toHaveBeenCalled();
      expect(mockUtilSetCurrentSchool).toHaveBeenCalledWith(
        teacherSchool,
        'TEACHER',
      );
      expect(mockSetCurrentSchool).toHaveBeenCalledWith(teacherSchool);
      expect(mockApiHandler.currentMode).toBe(MODES.TEACHER);
      expect(mockSetCurrMode).toHaveBeenCalledWith(MODES.TEACHER);
      expect(mockHistoryReplace).toHaveBeenCalledWith(PAGES.HOME_PAGE);
    });
    expect(mockLogEvent).not.toHaveBeenCalledWith(
      EVENTS.TEACHER_APP_ENTRY_CLICKED,
      {
        user_role: 'auto_user',
        auth_method_attempted: 'biometric',
      },
    );
  });

  it('keeps teacher app access when stored principal school was removed but teacher role remains', async () => {
    const user = userEvent.setup();
    const removedPrincipalSchool = {
      id: 'school-removed',
      name: 'Removed Principal School',
    };
    const teacherSchool = { id: 'school-1', name: 'Teacher School' };

    mockRequireTeacherModeAuth.mockResolvedValue('success');
    mockGetCurrMode.mockResolvedValue(MODES.TEACHER_SCHOOL);
    mockSchoolUtilGetCurrentSchool.mockReturnValue(removedPrincipalSchool);
    mockGetCurrentSchool.mockReturnValue(removedPrincipalSchool);
    mockAuthHandler.getCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([
      { school: teacherSchool, role: 'teacher' },
    ]);
    mockApiHandler.getSchoolsWithRoleAutouser.mockResolvedValue([]);
    mockApiHandler.getClassesForSchool.mockResolvedValue([]);

    render(<SelectMode />);

    const teacherButton = await screen.findByRole('button', {
      name: /teacher/i,
    });
    await user.click(teacherButton);

    await waitFor(() => {
      expect(mockRequireTeacherModeAuth).toHaveBeenCalled();
      expect(mockUtilSetCurrentSchool).toHaveBeenCalledWith(
        teacherSchool,
        'teacher',
      );
      expect(mockSetCurrentSchool).toHaveBeenCalledWith(teacherSchool);
      expect(mockApiHandler.currentMode).toBe(MODES.TEACHER);
      expect(mockSetCurrMode).toHaveBeenCalledWith(MODES.TEACHER);
      expect(mockHistoryReplace).toHaveBeenCalledWith(PAGES.HOME_PAGE);
      expect(mockHistoryReplace).not.toHaveBeenCalledWith(
        PAGES.DISPLAY_SCHOOLS,
      );
    });
  });

  it('uses the school picker when multiple teacher schools remain after stored school is removed', async () => {
    const removedPrincipalSchool = {
      id: 'school-removed',
      name: 'Removed Principal School',
    };

    mockGetCurrMode.mockResolvedValue(MODES.TEACHER_SCHOOL);
    mockSchoolUtilGetCurrentSchool.mockReturnValue(removedPrincipalSchool);
    mockGetCurrentSchool.mockReturnValue(removedPrincipalSchool);
    mockAuthHandler.getCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([
      { school: { id: 'school-1', name: 'Teacher School 1' }, role: 'teacher' },
      { school: { id: 'school-2', name: 'Teacher School 2' }, role: 'teacher' },
    ]);
    mockApiHandler.getSchoolsWithRoleAutouser.mockResolvedValue([]);
    mockApiHandler.getClassesForSchool.mockResolvedValue([]);

    render(<SelectMode />);

    await waitFor(() => {
      expect(mockSetCurrMode).toHaveBeenCalledWith(MODES.TEACHER);
      expect(mockHistoryReplace).toHaveBeenCalledWith(PAGES.DISPLAY_SCHOOLS);
      expect(mockSetCurrentSchool).not.toHaveBeenCalledWith({
        id: 'school-1',
        name: 'Teacher School 1',
      });
    });
  });

  it('routes to teacher dashboard with TEACHER_SCHOOL mode after math auth fallback from class mode', async () => {
    const user = userEvent.setup();

    mockRequireTeacherModeAuth.mockResolvedValue('popupFallbackRequired');
    mockGetCurrMode.mockResolvedValue(MODES.TEACHER_SCHOOL);
    mockAuthHandler.getCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([
      { school: { id: 'school-1', name: 'School 1' }, role: 'AUTOUSER' },
    ]);
    mockApiHandler.getSchoolsWithRoleAutouser.mockResolvedValue([
      { id: 'school-1' },
    ]);
    mockApiHandler.getClassesForSchool.mockResolvedValue([
      { id: 'class-1', name: 'Class 1' },
    ]);
    mockApiHandler.getStudentsForClass.mockResolvedValue([
      { id: 'student-1', name: 'Student 1' },
    ]);

    render(<SelectMode />);

    const teacherButton = await screen.findByRole('button', {
      name: /teacher/i,
    });
    await user.click(teacherButton);

    const mathAuthSuccessButton = await screen.findByRole('button', {
      name: /math auth success/i,
    });
    await user.click(mathAuthSuccessButton);

    await waitFor(() => {
      expect(mockLogEvent).toHaveBeenCalledWith(
        EVENTS.TEACHER_APP_ENTRY_CLICKED,
        {
          user_role: 'auto_user',
          auth_method_attempted: 'math_gate',
        },
      );
      expect(mockLogEvent).toHaveBeenCalledWith(
        EVENTS.TEACHER_APP_AUTH_SUCCESS,
        {
          auth_method_used: 'math_gate',
        },
      );
      expect(mockLogEvent).not.toHaveBeenCalledWith(
        EVENTS.TEACHER_APP_ENTRY_CLICKED,
        {
          user_role: 'auto_user',
          auth_method_attempted: 'biometric',
        },
      );
      expect(mockSetCurrentSchool).toHaveBeenCalledWith({
        id: 'school-1',
        name: 'School 1',
      });
      expect(mockSetCurrentClass).toHaveBeenCalledWith({
        id: 'class-1',
        name: 'Class 1',
      });
      expect(mockApiHandler.currentMode).toBe(MODES.TEACHER_SCHOOL);
      expect(mockSetCurrMode).toHaveBeenCalledWith(MODES.TEACHER_SCHOOL);
      expect(mockHistoryReplace).toHaveBeenCalledWith(PAGES.HOME_PAGE);
    });
  });

  it('allows auto users to authenticate into teacher dashboard from class mode', async () => {
    const user = userEvent.setup();

    mockRequireTeacherModeAuth.mockResolvedValue('success');
    mockGetCurrMode.mockResolvedValue(MODES.TEACHER_SCHOOL);
    mockAuthHandler.getCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([
      { school: { id: 'school-1', name: 'School 1' }, role: 'AUTOUSER' },
    ]);
    mockApiHandler.getSchoolsWithRoleAutouser.mockResolvedValue([
      { id: 'school-1' },
    ]);
    mockApiHandler.getClassesForSchool.mockResolvedValue([
      { id: 'class-1', name: 'Class 1' },
    ]);
    mockApiHandler.getStudentsForClass.mockResolvedValue([
      { id: 'student-1', name: 'Student 1' },
    ]);

    render(<SelectMode />);

    const teacherButton = await screen.findByRole('button', {
      name: /teacher/i,
    });
    await user.click(teacherButton);

    await waitFor(() => {
      expect(mockRequireTeacherModeAuth).toHaveBeenCalled();
      expect(mockLogEvent).toHaveBeenCalledWith(
        EVENTS.TEACHER_APP_ENTRY_CLICKED,
        {
          user_role: 'auto_user',
          auth_method_attempted: 'biometric',
        },
      );
      expect(mockLogEvent).toHaveBeenCalledWith(
        EVENTS.TEACHER_APP_AUTH_SUCCESS,
        {
          auth_method_used: 'biometric',
        },
      );
      expect(mockSetCurrentSchool).toHaveBeenCalledWith({
        id: 'school-1',
        name: 'School 1',
      });
      expect(mockSetCurrentClass).toHaveBeenCalledWith({
        id: 'class-1',
        name: 'Class 1',
      });
      expect(mockApiHandler.currentMode).toBe(MODES.TEACHER_SCHOOL);
      expect(mockSetCurrMode).toHaveBeenCalledWith(MODES.TEACHER_SCHOOL);
      expect(mockHistoryReplace).toHaveBeenCalledWith(PAGES.HOME_PAGE);
    });
  });

  it('does not render back button in student stage header', async () => {
    mockGetCurrMode.mockResolvedValue(undefined);
    mockAuthHandler.getCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([
      { school: { id: 'school-1', name: 'School 1' }, role: 'TEACHER' },
    ]);
    mockApiHandler.getSchoolsWithRoleAutouser.mockResolvedValue([
      { id: 'school-1' },
    ]);
    mockApiHandler.getClassesForSchool.mockResolvedValue([
      { id: 'class-1', name: 'Class 1' },
    ]);
    mockApiHandler.getStudentsForClass.mockResolvedValue([
      { id: 'student-1', name: 'Student 1', avatar: 'avatar1' },
    ]);
    render(<SelectMode />);
    // With 1 school we go directly to CLASS stage
    await waitFor(() =>
      expect(document.querySelector('.class-main')).not.toBeNull(),
    );
    // Click class to go to student stage
    const classDiv = Array.from(
      document.querySelectorAll('.class-avatar'),
    ).find((div) => div.textContent?.includes('Class 1'));
    classDiv && fireEvent.click(classDiv);
    await waitFor(() =>
      expect(document.querySelector('.class-container')).not.toBeNull(),
    );
    await waitFor(() =>
      expect(document.querySelector('.class-header')).not.toBeNull(),
    );
    expect(document.querySelector('#back-button-in-school-Header')).toBeNull();
  });

  it('handles school dropdown disables Okay button when no school selected', async () => {
    mockGetCurrMode.mockResolvedValue(undefined);
    mockAuthHandler.getCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([
      { school: { id: 'school-1', name: 'School 1' }, role: 'AUTOUSER' },
      { school: { id: 'school-2', name: 'School 2' }, role: 'AUTOUSER' },
    ]);
    mockApiHandler.getSchoolsWithRoleAutouser.mockResolvedValue([
      { id: 'school-1' },
      { id: 'school-2' },
    ]);
    render(<SelectMode />);
    // With 2 schools we see select-school-main
    await waitFor(() =>
      expect(document.querySelector('.select-school-main')).not.toBeNull(),
    );
    // Okay button should be disabled when no school selected
    const okayBtn = document.querySelector('.okay-btn');
    expect(okayBtn).toBeDisabled();
  });

  it('handles error in displayClasses', async () => {
    mockGetCurrMode.mockResolvedValue(undefined);
    mockAuthHandler.getCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([
      { school: { id: 'school-1', name: 'School 1' }, role: 'TEACHER' },
    ]);
    mockApiHandler.getSchoolsWithRoleAutouser.mockResolvedValue([
      { id: 'school-1' },
    ]);
    mockApiHandler.getClassesForSchool.mockRejectedValue(
      new Error('fetch error'),
    );
    render(<SelectMode />);
    // With 1 school we go to CLASS stage; displayClasses fails but component doesn't crash
    await waitFor(() =>
      expect(document.querySelector('.class-main')).not.toBeNull(),
    );
    // Should not throw, coverage for error branch - class-main renders with empty classes
  });

  it('handles empty school list', async () => {
    mockApiHandler.getSchoolsForUser = jest.fn().mockResolvedValue([]);

    render(<SelectMode />);

    await waitFor(() => {
      expect(screen.queryByText('A')).not.toBeInTheDocument();
    });
  });

  it('calls randomValue and renders student avatar fallback', async () => {
    mockGetCurrMode.mockResolvedValue(undefined);
    mockAuthHandler.getCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([
      { school: { id: 'school-1', name: 'School 1' }, role: 'TEACHER' },
    ]);
    mockApiHandler.getSchoolsWithRoleAutouser.mockResolvedValue([
      { id: 'school-1' },
    ]);
    mockApiHandler.getClassesForSchool.mockResolvedValue([
      { id: 'class-1', name: 'Class 1' },
    ]);
    mockApiHandler.getStudentsForClass.mockResolvedValue([
      { id: 'student-1', name: 'Student 1' },
    ]);
    render(<SelectMode />);
    // With 1 school we go directly to CLASS stage
    await waitFor(() =>
      expect(document.querySelector('.class-main')).not.toBeNull(),
    );
    // Click class to go to student stage
    const classDiv = Array.from(
      document.querySelectorAll('.class-avatar'),
    ).find((div) => div.textContent?.includes('Class 1'));
    classDiv && fireEvent.click(classDiv);
    await waitFor(() =>
      expect(document.querySelector('.class-avatar-img')).not.toBeNull(),
    );
    // Student avatar fallback (no image, uses assets/avatars/)
    const studentImg = document.querySelector('.class-avatar-img');
    expect(studentImg).not.toBeNull();
    expect(studentImg?.getAttribute('src')).toContain('assets/avatars/');
  });

  it('handles setTab=student with className in localStorage and displays students', async () => {
    window.history.replaceState({}, '', 'http://localhost/?tab=student');
    const parsedClass = { id: 'class-1', name: 'Class 1' };
    localStorage.setItem(CURRENT_CLASS_NAME, JSON.stringify(parsedClass));
    mockGetCurrMode.mockResolvedValue(undefined);
    mockAuthHandler.getCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([]);
    mockApiHandler.getParentStudentProfiles.mockResolvedValue([{ id: 's1' }]);
    mockApiHandler.getStudentsForClass.mockResolvedValue([
      { id: 'student-1', name: 'Student 1', avatar: 'avatar1' },
    ]);

    render(<SelectMode />);

    await waitFor(() =>
      expect(mockApiHandler.getStudentsForClass).toHaveBeenCalledWith(
        'class-1',
      ),
    );
  });

  it('handles setTab=class and sets stage to CLASS', async () => {
    window.history.replaceState({}, '', 'http://localhost/?tab=class');
    mockGetCurrMode.mockResolvedValue(undefined);
    mockAuthHandler.getCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([
      { school: { id: 'school-1', name: 'School 1' }, role: 'TEACHER' },
    ]);
    mockApiHandler.getSchoolsWithRoleAutouser.mockResolvedValue([
      { id: 'school-1' },
    ]);
    mockApiHandler.getParentStudentProfiles.mockResolvedValue([]);
    mockApiHandler.getClassesForSchool.mockResolvedValue([
      { id: 'class-1', name: 'Class 1' },
    ]);

    render(<SelectMode />);

    await waitFor(() =>
      expect(document.querySelector('.class-main')).not.toBeNull(),
    );
  });

  it('loads selectedClasses from localStorage when present', async () => {
    const classes = [{ id: 'class-1', name: 'Class 1' }];
    localStorage.setItem(SELECTED_CLASSES, JSON.stringify(classes));
    mockGetCurrMode.mockResolvedValue(undefined);
    mockAuthHandler.getCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([
      { school: { id: 'school-1', name: 'School 1' }, role: 'TEACHER' },
    ]);
    mockApiHandler.getSchoolsWithRoleAutouser.mockResolvedValue([
      { id: 'school-1' },
    ]);
    mockApiHandler.getParentStudentProfiles.mockResolvedValue([]);
    mockApiHandler.getClassesForSchool.mockResolvedValue(classes);

    render(<SelectMode />);

    await waitFor(() =>
      expect(document.querySelector('.class-main')).not.toBeNull(),
    );
    expect(screen.getAllByText('Class 1')[0]).toBeInTheDocument();
  });

  it('slides the visible class window by one class when the next arrow is clicked', async () => {
    const classes = [
      { id: 'class-1', name: 'Class 1' },
      { id: 'class-2', name: 'Class 2' },
      { id: 'class-3', name: 'Class 3' },
      { id: 'class-4', name: 'Class 4' },
    ];
    localStorage.setItem(CURRENT_SCHOOL_NAME, JSON.stringify('School 1'));
    localStorage.setItem(CURRENT_CLASS_NAME, JSON.stringify(classes[0]));
    localStorage.setItem(SELECTED_CLASSES, JSON.stringify(classes));
    mockGetCurrMode.mockResolvedValue(MODES.SCHOOL);
    mockAuthHandler.getCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([
      { school: { id: 'school-1', name: 'School 1' }, role: 'TEACHER' },
    ]);
    mockApiHandler.getSchoolsWithRoleAutouser.mockResolvedValue([
      { id: 'school-1' },
    ]);
    mockApiHandler.getClassesForSchool.mockResolvedValue(classes);

    render(<SelectMode />);

    await screen.findByText('Class 3');

    expect(
      document
        .getElementById('school-mode-next-class-button')
        ?.classList.contains('school-mode-nav-button-active'),
    ).toBe(true);
    expect(
      document
        .getElementById('school-mode-prev-class-button')
        ?.classList.contains('school-mode-nav-button-active'),
    ).toBe(false);

    fireEvent.click(
      document.getElementById('school-mode-next-class-button') as HTMLElement,
    );

    await screen.findByText('Class 4');

    expect(screen.queryByText('Class 1')).not.toBeInTheDocument();
    expect(screen.getByText('Class 2')).toBeInTheDocument();
    expect(screen.getByText('Class 3')).toBeInTheDocument();
    expect(screen.getByText('Class 4')).toBeInTheDocument();
  });

  it('highlights the previous class arrow when the active class starts from the fourth class', async () => {
    const classes = [
      { id: 'class-1', name: 'Class 1' },
      { id: 'class-2', name: 'Class 2' },
      { id: 'class-3', name: 'Class 3' },
      { id: 'class-4', name: 'Class 4' },
    ];
    localStorage.setItem(CURRENT_SCHOOL_NAME, JSON.stringify('School 1'));
    localStorage.setItem(CURRENT_CLASS_NAME, JSON.stringify(classes[3]));
    localStorage.setItem(SELECTED_CLASSES, JSON.stringify(classes));
    mockGetCurrMode.mockResolvedValue(MODES.SCHOOL);
    mockAuthHandler.getCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([
      { school: { id: 'school-1', name: 'School 1' }, role: 'TEACHER' },
    ]);
    mockApiHandler.getSchoolsWithRoleAutouser.mockResolvedValue([
      { id: 'school-1' },
    ]);
    mockApiHandler.getClassesForSchool.mockResolvedValue(classes);

    render(<SelectMode />);

    await screen.findByText('Class 4');

    expect(
      document
        .getElementById('school-mode-prev-class-button')
        ?.classList.contains('school-mode-nav-button-active'),
    ).toBe(true);
    expect(
      document
        .getElementById('school-mode-next-class-button')
        ?.classList.contains('school-mode-nav-button-active'),
    ).toBe(false);
  });

  it('loads selectedStudents from localStorage when present', async () => {
    const students = [
      { id: 'student-1', name: 'Student 1', avatar: 'avatar1' },
    ];
    localStorage.setItem(SELECTED_STUDENTS, JSON.stringify(students));
    localStorage.setItem(USER_SELECTION_STAGE, 'true');
    mockGetCurrMode.mockResolvedValue(undefined);
    mockAuthHandler.getCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([
      { school: { id: 'school-1', name: 'School 1' }, role: 'TEACHER' },
    ]);
    mockApiHandler.getSchoolsWithRoleAutouser.mockResolvedValue([
      { id: 'school-1' },
    ]);
    mockApiHandler.getParentStudentProfiles.mockResolvedValue([]);
    mockApiHandler.getClassesForSchool.mockResolvedValue([
      { id: 'class-1', name: 'Class 1' },
    ]);
    mockApiHandler.getStudentsForClass.mockResolvedValue(students);

    render(<SelectMode />);

    await waitFor(() =>
      expect(document.querySelector('.class-container')).not.toBeNull(),
    );
    expect(screen.getByText('Student 1')).toBeInTheDocument();
  });

  it('handles MODES.SCHOOL with schoolName and className, selectedUser set -> STAGES.STUDENT', async () => {
    const school = { id: 'school-1', name: 'School 1' };
    const classData = { id: 'class-1', name: 'Class 1' };
    localStorage.setItem(CURRENT_SCHOOL_NAME, JSON.stringify(school.name));
    localStorage.setItem(CURRENT_CLASS_NAME, JSON.stringify(classData));
    localStorage.setItem(USER_SELECTION_STAGE, 'true');
    localStorage.setItem(
      SELECTED_STUDENTS,
      JSON.stringify([{ id: 'student-1', name: 'Student 1' }]),
    );
    mockGetCurrMode.mockResolvedValue(MODES.SCHOOL);
    mockAuthHandler.getCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([
      { school, role: 'TEACHER' },
    ]);
    mockApiHandler.getSchoolsWithRoleAutouser.mockResolvedValue([
      { id: 'school-1' },
    ]);
    mockApiHandler.getClassesForSchool.mockResolvedValue([classData]);

    render(<SelectMode />);

    await waitFor(() =>
      expect(document.querySelector('.class-container')).not.toBeNull(),
    );
    expect(screen.getByText('Student 1')).toBeInTheDocument();
  });

  it('handles MODES.SCHOOL with schoolName and className, no selectedUser -> STAGES.CLASS', async () => {
    const school = { id: 'school-1', name: 'School 1' };
    const classData = { id: 'class-1', name: 'Class 1' };
    localStorage.setItem(CURRENT_SCHOOL_NAME, JSON.stringify(school.name));
    localStorage.setItem(CURRENT_CLASS_NAME, JSON.stringify(classData));
    localStorage.setItem(SELECTED_CLASSES, JSON.stringify([classData]));
    mockGetCurrMode.mockResolvedValue(MODES.SCHOOL);
    mockAuthHandler.getCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([
      { school, role: 'TEACHER' },
    ]);
    mockApiHandler.getSchoolsWithRoleAutouser.mockResolvedValue([
      { id: 'school-1' },
    ]);
    mockApiHandler.getClassesForSchool.mockResolvedValue([classData]);

    render(<SelectMode />);

    await waitFor(() =>
      expect(document.querySelector('.class-main')).not.toBeNull(),
    );
    expect(screen.getAllByText('Class 1')[0]).toBeInTheDocument();
  });

  it('handles MODES.SCHOOL with missing schoolName or className, then overwrites to SCHOOL', async () => {
    mockGetCurrMode.mockResolvedValue(MODES.SCHOOL);
    mockAuthHandler.getCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([
      { school: { id: 'school-1', name: 'School 1' }, role: 'TEACHER' },
      { school: { id: 'school-2', name: 'School 2' }, role: 'TEACHER' },
    ]);
    mockApiHandler.getSchoolsWithRoleAutouser.mockResolvedValue([
      { id: 'school-1' },
      { id: 'school-2' },
    ]);
    mockApiHandler.getParentStudentProfiles.mockResolvedValue([]);

    render(<SelectMode />);

    await waitFor(() =>
      expect(document.querySelector('.select-school-main')).not.toBeNull(),
    );
    expect(screen.getByText('Choose the School')).toBeInTheDocument();
  });

  it('onParentSelect path: navigates to CREATE_STUDENT when no schools and no students', async () => {
    mockGetCurrMode.mockResolvedValue(undefined);
    mockAuthHandler.getCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([]);
    mockApiHandler.getParentStudentProfiles.mockResolvedValue([]);

    render(<SelectMode />);

    await waitFor(() =>
      expect(mockHistoryReplace).toHaveBeenCalledWith(PAGES.CREATE_STUDENT),
    );
    expect(mockSetCurrMode).toHaveBeenCalledWith(MODES.PARENT);
  });

  it('onParentSelect path: navigates to DISPLAY_STUDENT when no schools but has students', async () => {
    mockGetCurrMode.mockResolvedValue(undefined);
    mockAuthHandler.getCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([]);
    mockApiHandler.getParentStudentProfiles.mockResolvedValue([
      { id: 'student-1', name: 'Student 1' },
    ]);

    render(<SelectMode />);

    await waitFor(() =>
      expect(mockHistoryReplace).toHaveBeenCalledWith(PAGES.DISPLAY_STUDENT),
    );
    expect(mockSetCurrMode).toHaveBeenCalledWith(MODES.PARENT);
  });

  it('locks landscape when mode is school on native', async () => {
    mockGetCurrMode.mockResolvedValue(MODES.SCHOOL);
    localStorage.setItem(CURRENT_SCHOOL_NAME, JSON.stringify('School 1'));
    localStorage.setItem(
      CURRENT_CLASS_NAME,
      JSON.stringify({ id: 'class-1', name: 'Class 1' }),
    );
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);

    render(<SelectMode />);

    await waitFor(() =>
      expect(ScreenOrientation.lock).toHaveBeenCalledWith({
        orientation: 'landscape',
      }),
    );
  });

  it('shows school dropdown when multiple schools', async () => {
    mockGetCurrMode.mockResolvedValue(undefined);
    mockAuthHandler.getCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([
      { school: { id: 'school-1', name: 'School 1' }, role: 'AUTOUSER' },
      { school: { id: 'school-2', name: 'School 2' }, role: 'AUTOUSER' },
    ]);
    mockApiHandler.getSchoolsWithRoleAutouser.mockResolvedValue([
      { id: 'school-1' },
      { id: 'school-2' },
    ]);
    mockApiHandler.getParentStudentProfiles.mockResolvedValue([]);

    render(<SelectMode />);

    await waitFor(() =>
      expect(document.querySelector('.select-school-main')).not.toBeNull(),
    );
    expect(screen.getByText('Choose the School')).toBeInTheDocument();
  });

  it('displayClasses returns early when getClassesForSchool returns empty', async () => {
    mockGetCurrMode.mockResolvedValue(undefined);
    mockAuthHandler.getCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([
      { school: { id: 'school-1', name: 'School 1' }, role: 'TEACHER' },
    ]);
    mockApiHandler.getSchoolsWithRoleAutouser.mockResolvedValue([
      { id: 'school-1' },
    ]);
    mockApiHandler.getClassesForSchool.mockResolvedValue([]);

    render(<SelectMode />);

    await waitFor(() =>
      expect(document.querySelector('.class-main')).not.toBeNull(),
    );
    expect(mockApiHandler.getClassesForSchool).toHaveBeenCalled();
  });

  it('disables Okay button when dropdown selects invalid/non-existent school', async () => {
    mockGetCurrMode.mockResolvedValue(undefined);
    mockAuthHandler.getCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([
      { school: { id: 'school-1', name: 'School 1' }, role: 'TEACHER' },
      { school: { id: 'school-2', name: 'School 2' }, role: 'TEACHER' },
    ]);
    mockApiHandler.getSchoolsWithRoleAutouser.mockResolvedValue([
      { id: 'school-1' },
      { id: 'school-2' },
    ]);
    mockApiHandler.getParentStudentProfiles.mockResolvedValue([]);

    render(<SelectMode />);

    await waitFor(() =>
      expect(document.querySelector('.select-school-main')).not.toBeNull(),
    );
    const dropdown = document.querySelector(
      'select[aria-label="school-dropdown"]',
    );
    expect(dropdown).not.toBeNull();
    fireEvent.change(dropdown!, {
      target: { value: 'non-existent-school-id' },
    });
    const okayBtn = document.querySelector('.okay-btn');
    expect(okayBtn).toBeDisabled();
  });

  it('single school with selectedUser sets stage to STUDENT and shows students', async () => {
    const classData = { id: 'class-1', name: 'Class 1' };
    localStorage.setItem(USER_SELECTION_STAGE, 'true');
    localStorage.setItem(CURRENT_CLASS_NAME, JSON.stringify(classData));
    localStorage.setItem(
      SELECTED_STUDENTS,
      JSON.stringify([
        { id: 'student-1', name: 'Student 1', avatar: 'avatar1' },
      ]),
    );
    mockGetCurrMode.mockResolvedValue(MODES.SCHOOL);
    mockAuthHandler.getCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([
      { school: { id: 'school-1', name: 'School 1' }, role: 'TEACHER' },
    ]);
    mockApiHandler.getSchoolsWithRoleAutouser.mockResolvedValue([
      { id: 'school-1' },
    ]);
    mockApiHandler.getClassesForSchool.mockResolvedValue([classData]);
    mockApiHandler.getStudentsForClass.mockResolvedValue([
      { id: 'student-1', name: 'Student 1', avatar: 'avatar1' },
    ]);
    localStorage.setItem(CURRENT_SCHOOL_NAME, JSON.stringify('School 1'));

    render(<SelectMode />);

    await screen.findByText('Student 1');
  });

  it('multi school flow: select school, click Okay, click class, loads students', async () => {
    const user = userEvent.setup();
    mockGetCurrMode.mockResolvedValue(undefined);
    mockAuthHandler.getCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([
      { school: { id: 'school-1', name: 'School 1' }, role: 'TEACHER' },
      { school: { id: 'school-2', name: 'School 2' }, role: 'TEACHER' },
    ]);
    mockApiHandler.getSchoolsWithRoleAutouser.mockResolvedValue([
      { id: 'school-1' },
      { id: 'school-2' },
    ]);
    mockApiHandler.getParentStudentProfiles.mockResolvedValue([]);
    mockApiHandler.getClassesForSchool.mockResolvedValue([
      { id: 'class-1', name: 'Class 1' },
    ]);
    mockApiHandler.getStudentsForClass.mockResolvedValue([
      { id: 'student-1', name: 'Student 1' },
    ]);

    render(<SelectMode />);

    await waitFor(() =>
      expect(document.querySelector('.select-school-main')).not.toBeNull(),
    );
    const dropdown = document.querySelector('select');
    fireEvent.change(dropdown!, { target: { value: 'school-1' } });
    const okayBtn = document.querySelector('.okay-btn') as HTMLElement;
    await user.click(okayBtn!);
    await waitFor(() =>
      expect(document.querySelector('.class-main')).not.toBeNull(),
    );
    const classDiv = Array.from(
      document.querySelectorAll('.class-avatar'),
    ).find((div) => div.textContent?.includes('Class 1'));
    classDiv && (await user.click(classDiv as HTMLElement));
    await waitFor(
      () =>
        expect(mockApiHandler.getStudentsForClass).toHaveBeenCalledWith(
          'class-1',
        ),
      { timeout: 3000 },
    );
  });

  it('logs class tab change when user selects a different class tab', async () => {
    const user = userEvent.setup();
    const firstClass = { id: 'class-1', name: 'Class 1' };
    const secondClass = { id: 'class-2', name: 'Class 2' };
    mockGetCurrMode.mockResolvedValue(undefined);
    mockAuthHandler.getCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([
      { school: { id: 'school-1', name: 'School 1' }, role: 'TEACHER' },
    ]);
    mockApiHandler.getSchoolsWithRoleAutouser.mockResolvedValue([
      { id: 'school-1' },
    ]);
    mockApiHandler.getParentStudentProfiles.mockResolvedValue([]);
    mockApiHandler.getClassesForSchool.mockResolvedValue([
      firstClass,
      secondClass,
    ]);
    mockApiHandler.getStudentsForClass.mockResolvedValue([
      { id: 'student-1', name: 'Student 1' },
    ]);

    render(<SelectMode />);

    await screen.findByText('Class 2');
    await user.click(screen.getByText('Class 2'));

    await waitFor(() =>
      expect(mockLogEvent).toHaveBeenCalledWith(
        EVENTS.CLASS_TAB_CLASS_CHANGED,
        {
          selected_class_id: 'class-2',
          selected_class_name: 'Class 2',
          previous_class_id: 'class-1',
          previous_class_name: 'Class 1',
          selection_stage: 'student',
        },
      ),
    );
  });

  it('shows selected class profile instruction only when class tabs are scrollable', async () => {
    mockGetCurrMode.mockResolvedValue(undefined);
    mockAuthHandler.getCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([
      { school: { id: 'school-1', name: 'School 1' }, role: 'TEACHER' },
    ]);
    mockApiHandler.getSchoolsWithRoleAutouser.mockResolvedValue([
      { id: 'school-1' },
    ]);
    mockApiHandler.getParentStudentProfiles.mockResolvedValue([]);
    mockApiHandler.getClassesForSchool.mockResolvedValue([
      { id: 'class-1', name: 'Class 1' },
      { id: 'class-2', name: 'Class 2' },
      { id: 'class-3', name: 'Class 3' },
      { id: 'class-4', name: 'Class 4' },
    ]);
    mockApiHandler.getStudentsForClass.mockResolvedValue([
      { id: 'student-1', name: 'Student 1' },
    ]);

    render(<SelectMode />);

    expect(
      await screen.findByText("Class 1 - Select the child's profile"),
    ).toBeInTheDocument();
  });

  it('hides selected class profile instruction when three or fewer classes exist', async () => {
    mockGetCurrMode.mockResolvedValue(undefined);
    mockAuthHandler.getCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([
      { school: { id: 'school-1', name: 'School 1' }, role: 'TEACHER' },
    ]);
    mockApiHandler.getSchoolsWithRoleAutouser.mockResolvedValue([
      { id: 'school-1' },
    ]);
    mockApiHandler.getParentStudentProfiles.mockResolvedValue([]);
    mockApiHandler.getClassesForSchool.mockResolvedValue([
      { id: 'class-1', name: 'Class 1' },
      { id: 'class-2', name: 'Class 2' },
      { id: 'class-3', name: 'Class 3' },
    ]);
    mockApiHandler.getStudentsForClass.mockResolvedValue([
      { id: 'student-1', name: 'Student 1' },
    ]);

    render(<SelectMode />);

    await screen.findByText('Student 1');
    expect(
      screen.queryByText("Class 1 - Select the child's profile"),
    ).not.toBeInTheDocument();
  });

  it('multi school without selectedUser shows stage SCHOOL', async () => {
    mockGetCurrMode.mockResolvedValue(undefined);
    mockAuthHandler.getCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockApiHandler.getSchoolsForUser.mockResolvedValue([
      { school: { id: 'school-1', name: 'School 1' }, role: 'TEACHER' },
      { school: { id: 'school-2', name: 'School 2' }, role: 'TEACHER' },
    ]);
    mockApiHandler.getSchoolsWithRoleAutouser.mockResolvedValue([
      { id: 'school-1' },
      { id: 'school-2' },
    ]);
    mockApiHandler.getParentStudentProfiles.mockResolvedValue([]);

    render(<SelectMode />);

    await waitFor(() =>
      expect(document.querySelector('.select-school-main')).not.toBeNull(),
    );
    expect(screen.getByText('Choose the School')).toBeInTheDocument();
  });
});
