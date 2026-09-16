import { renderHook, waitFor } from '@testing-library/react';
import { useDisplaySchools } from './useDisplaySchools';
import { ServiceConfig } from '../../services/ServiceConfig';
import { Util } from '../../utility/util';
import { schoolUtil } from '../../utility/schoolUtil';
import { MODES, PAGES, USER_SELECTION_STAGE } from '../../common/constants';
import { useAppSelector } from '../../redux/hooks';
import type { ReactNode } from 'react';

const mockReplace = jest.fn();
const mockGetCurrentUser = jest.fn();
const mockGetSchoolsForUser = jest.fn();
const mockGetUserRoleForSchool = jest.fn();
const mockHandleClassAndSubjects = jest.fn();
const mockSetCurrentSchool = jest.fn();
const mockSetCurrentClass = jest.fn();
const mockValidateCurrentSchoolContext = jest.fn();
const mockUpdateUserLanguage = jest.fn();
const mockGetClassesForSchool = jest.fn();
const mockGetExistingSchoolRequest = jest.fn();

jest.mock('react-router', () => ({
  useHistory: () => ({ replace: mockReplace }),
  useLocation: () => ({ pathname: '/display-schools' }),
}));

jest.mock('../../redux/hooks', () => ({
  useAppSelector: jest.fn(),
}));

jest.mock('../../services/ServiceConfig', () => ({
  ServiceConfig: {
    getI: () => ({
      apiHandler: {
        getSchoolsForUser: mockGetSchoolsForUser,
        getUserRoleForSchool: mockGetUserRoleForSchool,
        getClassesForSchool: mockGetClassesForSchool,
        getExistingSchoolRequest: mockGetExistingSchoolRequest,
      },
      authHandler: {
        getCurrentUser: mockGetCurrentUser,
      },
    }),
  },
}));

jest.mock('../../utility/util', () => ({
  Util: {
    getCurrentSchool: jest.fn(),
    getCurrentClass: jest.fn(),
    setCurrentSchool: jest.fn(),
    setCurrentClass: jest.fn(),
    handleClassAndSubjects: jest.fn(),
    validateCurrentSchoolContext: jest.fn(),
    updateUserLanguage: jest.fn(),
  },
}));

jest.mock('../../utility/schoolUtil', () => ({
  schoolUtil: {
    getCurrMode: jest.fn(),
  },
}));

jest.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: jest.fn(() => false) },
}));

jest.mock('@capacitor/screen-orientation', () => ({
  ScreenOrientation: { lock: jest.fn() },
}));

jest.mock('../../components/Loading', () => () => null);
jest.mock('../components/homePage/Header', () => () => null);
jest.mock('../../common/CommonToggle', () => () => null);
jest.mock('react-icons/pi', () => ({ PiUserSwitchFill: () => null }));
jest.mock('ionicons/icons', () => ({ addOutline: 'add-outline' }));
jest.mock('@ionic/react', () => ({
  IonFabButton: ({ children }: { children?: ReactNode }) => children,
  IonIcon: () => null,
  IonPage: ({ children }: { children?: ReactNode }) => children,
}));
jest.mock('history', () => ({
  parsePath: (path: string) => ({ pathname: path }),
}));
jest.mock('../../utility/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
}));

const mockUseAppSelector = useAppSelector as jest.Mock;
const mockUtil = Util as jest.Mocked<typeof Util>;

describe('useDisplaySchools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem(USER_SELECTION_STAGE, 'false');
    (schoolUtil.getCurrMode as jest.Mock).mockResolvedValue(MODES.TEACHER);
    (Util.getCurrentSchool as jest.Mock).mockReturnValue(null);
    (Util.getCurrentClass as jest.Mock).mockReturnValue(null);
    mockUtil.setCurrentSchool.mockClear();
    mockUtil.setCurrentClass.mockClear();
    mockUtil.handleClassAndSubjects.mockClear();
    mockUtil.validateCurrentSchoolContext.mockClear();
    mockUtil.updateUserLanguage.mockClear();
    mockGetCurrentUser.mockResolvedValue({ id: 'teacher-1', name: 'Teacher' });
    mockGetSchoolsForUser.mockResolvedValue([]);
    mockGetUserRoleForSchool.mockResolvedValue(null);
    mockGetClassesForSchool.mockResolvedValue([]);
    mockGetExistingSchoolRequest.mockResolvedValue(null);
    mockUseAppSelector.mockImplementation(
      (
        selector: (state: {
          auth: { roles: string[]; isOpsUser: boolean };
        }) => unknown,
      ) => selector({ auth: { roles: [], isOpsUser: false } }),
    );
  });

  it('auto-selects a single active school and navigates home', async () => {
    const school = {
      id: 'school-1',
      name: 'School One',
      is_deleted: false,
    } as { id: string; name: string; is_deleted: boolean };
    mockGetSchoolsForUser.mockResolvedValue([{ school, role: 'teacher' }]);
    mockGetClassesForSchool.mockResolvedValue([{ id: 'class-1' }]);

    renderHook(() => useDisplaySchools());

    await waitFor(() => {
      expect(mockUtil.setCurrentSchool).toHaveBeenCalledWith(school, 'teacher');
    });
    expect(mockUtil.handleClassAndSubjects).toHaveBeenCalledWith(
      'school-1',
      'teacher-1',
      expect.any(Object),
      PAGES.DISPLAY_SCHOOLS,
    );
    expect(mockGetClassesForSchool).toHaveBeenCalledWith(
      'school-1',
      'teacher-1',
    );
    expect(mockUtil.setCurrentClass).toHaveBeenCalledWith({ id: 'class-1' });
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: PAGES.HOME_PAGE,
      state: { tabValue: 0 },
    });
  });

  it('stays on selection when multiple active schools exist', async () => {
    mockGetSchoolsForUser.mockResolvedValue([
      { school: { id: 'school-1', name: 'School One' }, role: 'teacher' },
      { school: { id: 'school-2', name: 'School Two' }, role: 'teacher' },
    ]);

    renderHook(() => useDisplaySchools());

    await waitFor(() => {
      expect(mockGetSchoolsForUser).toHaveBeenCalled();
    });
    expect(mockUtil.setCurrentSchool).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalledWith({
      pathname: PAGES.HOME_PAGE,
      state: { tabValue: 0 },
    });
  });
});
