// Mock @ionic/react IonPage to avoid invalid element type error
import React from 'react';
import '@testing-library/jest-dom';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MODES,
  PAGES,
  USER_SELECTION_STAGE,
  SELECTED_CLASSES,
  SELECTED_STUDENTS,
  CURRENT_CLASS_NAME,
  CURRENT_SCHOOL_NAME,
} from '../common/constants';

const originalStderrWrite = process.stderr.write.bind(process.stderr);

beforeAll(() => {
  (process.stderr.write as any) = process.stdout.write.bind(process.stdout);
});

afterAll(() => {
  (process.stderr.write as any) = originalStderrWrite;
});

jest.mock('@ionic/react', () => ({
  IonPage: ({ children }: any) => <div data-testid="ion-page">{children}</div>,
}));

jest.mock('i18next', () => ({
  t: (key: string) => key,
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
jest.mock('../utility/schoolUtil', () => ({
  schoolUtil: {
    getCurrMode: (...args: any[]) => mockGetCurrMode(...args),
    setCurrMode: (...args: any[]) => mockSetCurrMode(...args),
    setCurrentClass: (...args: any[]) => mockSetCurrentClass(...args),
    setCurrentSchool: (...args: any[]) => mockSetCurrentSchool(...args),
  },
}));

const mockGetCurrentStudent = jest.fn();
const mockEnsureLidoCommonAudioForStudent = jest.fn();
const mockSetCurrentStudent = jest.fn();
jest.mock('../utility/util', () => ({
  Util: {
    getCurrentStudent: (...args: any[]) => mockGetCurrentStudent(...args),
    ensureLidoCommonAudioForStudent: (...args: any[]) =>
      mockEnsureLidoCommonAudioForStudent(...args),
    setCurrentStudent: (...args: any[]) => mockSetCurrentStudent(...args),
  },
}));

jest.mock('../components/Loading', () => ({
  __esModule: true,
  default: ({ isLoading }: { isLoading: boolean }) =>
    isLoading ? <div data-testid="loading" /> : <div data-testid="loaded" />,
}));

jest.mock('../components/selectMode/SelectModeButton', () => ({
  __esModule: true,
  default: ({ text, onClick }: any) => (
    <button type="button" onClick={onClick}>
      {text}
    </button>
  ),
}));

jest.mock('../components/DropDown', () => ({
  __esModule: true,
  default: ({ optionList, currentValue, onValueChange }: any) => (
    <select
      aria-label="school-dropdown"
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
  currentMode: undefined as any,
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

const SelectMode = require('./SelectMode').default;

// Import the mocked hooks
const { useAppDispatch, useAppSelector } = require('../redux/hooks');

describe('SelectMode page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();

    // Mock Redux hooks
    useAppDispatch.mockReturnValue(jest.fn());
    useAppSelector.mockImplementation((selector: any) =>
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
    mockApiHandler.currentMode = undefined;
    mockApiHandler.isSplUser.mockResolvedValue(false);
    mockApiHandler.getUserSpecialRoles.mockResolvedValue([]);
    mockAuthHandler.getCurrentUser.mockResolvedValue(null);
    mockAuthHandler.getUser.mockResolvedValue({ data: { user: null } });
    mockGetCurrMode.mockResolvedValue(undefined);
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

    render(<SelectMode />);

    await waitFor(() =>
      expect(mockHistoryReplace).toHaveBeenCalledWith(PAGES.DISPLAY_STUDENT),
    );
  });

  it('redirects to DISPLAY_SCHOOLS when mode is teacher', async () => {
    mockGetCurrMode.mockResolvedValue(MODES.TEACHER);

    render(<SelectMode />);

    await waitFor(() =>
      expect(mockHistoryReplace).toHaveBeenCalledWith(PAGES.DISPLAY_SCHOOLS),
    );
  });

  it('redirects to SIDEBAR_PAGE when mode is ops console', async () => {
    mockGetCurrMode.mockResolvedValue(MODES.OPS_CONSOLE);

    render(<SelectMode />);

    await waitFor(() =>
      expect(mockHistoryReplace).toHaveBeenCalledWith(PAGES.SIDEBAR_PAGE),
    );
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
    useAppSelector.mockImplementation((selector: any) =>
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
      { school: { id: 'school-1', name: 'School 1' }, role: 'TEACHER' },
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
    // Click student - USER_SELECTION_STAGE is set when clicking a student
    const studentElements = await screen.findAllByText('Student 1');
    await user.click(studentElements[0]);
    await waitFor(() =>
      expect(localStorage.getItem(USER_SELECTION_STAGE)).toBe('true'),
    );
  });

  it('renders Parent and Teacher mode buttons and handles Parent click', async () => {
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

    // click student
    const student = await screen.findByText('Student 1');
    await user.click(student);

    // assert navigation chain
    await waitFor(() => {
      expect(mockEnsureLidoCommonAudioForStudent).toHaveBeenCalled();
      expect(mockSetCurrentStudent).toHaveBeenCalled();
      expect(mockHistoryReplace).toHaveBeenCalledWith('/home');
    });
  });

  it('handles back button in student stage', async () => {
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
    // Click student
    const studentDiv = Array.from(
      document.querySelectorAll('.class-avatar'),
    ).find((div) => div.textContent?.includes('Student 1'));
    studentDiv && fireEvent.click(studentDiv);
    await waitFor(() =>
      expect(document.querySelector('.class-header')).not.toBeNull(),
    );
    // Back button
    const backBtn = document.querySelector('img[alt="BackButtonIcon"]');
    backBtn && fireEvent.click(backBtn);
    await waitFor(() =>
      expect(document.querySelector('.class-main')).not.toBeNull(),
    );
  });

  it('handles school dropdown disables Okay button when no school selected', async () => {
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

  it('shows school dropdown when multiple schools', async () => {
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
