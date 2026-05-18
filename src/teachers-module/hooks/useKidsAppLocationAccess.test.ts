import { configureStore } from '@reduxjs/toolkit';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { PAGES } from '../../common/constants';
import { RoleType } from '../../interface/modelInterfaces';
import authReducer, { AuthState } from '../../redux/slices/auth/authSlice';

const mockReplace = jest.fn();
const mockGetCurrentUser = jest.fn();
const mockGetSchoolsForUser = jest.fn();

interface HookWrapperProps {
  children: React.ReactNode;
}

const createAuthState = (roles: string[]): AuthState => ({
  authUser: null,
  user: null,
  refreshToken: null,
  isOpsUser: false,
  roles,
  loading: false,
  error: {
    phone: null,
    student: null,
    email: null,
    otp: null,
    general: null,
  },
});

const createWrapper = (roles: string[]): React.FC<HookWrapperProps> => {
  const store = configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: createAuthState(roles),
    },
  });

  const HookWrapper: React.FC<HookWrapperProps> = ({
    children,
  }): React.ReactElement => React.createElement(Provider, { store }, children);

  return HookWrapper;
};

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useHistory: () => ({
    replace: mockReplace,
  }),
}));

jest.mock('../../services/ServiceConfig', () => ({
  ServiceConfig: {
    getI: () => ({
      authHandler: {
        getCurrentUser: mockGetCurrentUser,
      },
      apiHandler: {
        getSchoolsForUser: mockGetSchoolsForUser,
      },
    }),
  },
}));

jest.mock('../../utility/logger', () => ({
  warn: jest.fn(),
}));

const { hasKidsAppLocationRoleAccess, useKidsAppLocationAccess } =
  require('./useKidsAppLocationAccess') as typeof import('./useKidsAppLocationAccess');

describe('hasKidsAppLocationRoleAccess', () => {
  test.each([[RoleType.TEACHER], [RoleType.PRINCIPAL], [RoleType.COORDINATOR]])(
    'allows %s role',
    (role) => {
      expect(hasKidsAppLocationRoleAccess([role])).toBe(true);
    },
  );

  test.each([[RoleType.PARENT], [RoleType.STUDENT], [RoleType.SPONSOR]])(
    'blocks %s role',
    (role) => {
      expect(hasKidsAppLocationRoleAccess([role])).toBe(false);
    },
  );
});

describe('useKidsAppLocationAccess', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockGetSchoolsForUser.mockResolvedValue([]);
  });

  test('allows access from stored teacher role', async () => {
    const { result } = renderHook(() => useKidsAppLocationAccess(), {
      wrapper: createWrapper([RoleType.TEACHER]),
    });

    await waitFor(() => {
      expect(result.current.isCheckingAccess).toBe(false);
    });
    expect(result.current.isAccessAllowed).toBe(true);
    expect(mockGetSchoolsForUser).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test('allows access from school coordinator role fallback', async () => {
    mockGetSchoolsForUser.mockResolvedValue([{ role: RoleType.COORDINATOR }]);

    const { result } = renderHook(() => useKidsAppLocationAccess(), {
      wrapper: createWrapper([RoleType.PARENT]),
    });

    await waitFor(() => {
      expect(result.current.isCheckingAccess).toBe(false);
    });
    expect(result.current.isAccessAllowed).toBe(true);
    expect(mockGetSchoolsForUser).toHaveBeenCalledWith('user-1');
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test('blocks access and redirects when roles are not allowed', async () => {
    const { result } = renderHook(() => useKidsAppLocationAccess(), {
      wrapper: createWrapper([RoleType.PARENT]),
    });

    await waitFor(() => {
      expect(result.current.isCheckingAccess).toBe(false);
    });
    expect(result.current.isAccessAllowed).toBe(false);
    expect(mockReplace).toHaveBeenCalledWith(PAGES.DISPLAY_STUDENT);
  });
});
