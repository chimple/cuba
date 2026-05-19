import { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router';
import { PAGES } from '../../common/constants';
import { RoleType } from '../../interface/modelInterfaces';
import { useAppSelector } from '../../redux/hooks';
import { AuthState } from '../../redux/slices/auth/authSlice';
import { RootState } from '../../redux/store';
import { ServiceConfig } from '../../services/ServiceConfig';
import logger from '../../utility/logger';

const KIDS_APP_LOCATION_ALLOWED_ROLES = new Set<string>([
  RoleType.TEACHER,
  RoleType.PRINCIPAL,
  RoleType.COORDINATOR,
]);
const EMPTY_ROLES: string[] = [];

interface SchoolRoleEntry {
  role?: string | null;
}

interface KidsAppLocationAccessState {
  isCheckingAccess: boolean;
  isAccessAllowed: boolean;
}

const normalizeRole = (role: string | null | undefined): string =>
  (role ?? '').toLowerCase();

export const hasKidsAppLocationRoleAccess = (roles: string[]): boolean =>
  roles.some((role) =>
    KIDS_APP_LOCATION_ALLOWED_ROLES.has(normalizeRole(role)),
  );

const getSchoolRolesForCurrentUser = async (): Promise<string[]> => {
  const service = ServiceConfig.getI();
  const currentUser = await service.authHandler.getCurrentUser();

  if (!currentUser?.id) {
    return [];
  }

  const schools: SchoolRoleEntry[] = await service.apiHandler.getSchoolsForUser(
    currentUser.id,
  );

  return schools.map((school) => school.role ?? '');
};

export const useKidsAppLocationAccess = (): KidsAppLocationAccessState => {
  const history = useHistory();
  const authState = useAppSelector(
    (state: RootState) => state.auth as AuthState | undefined,
  );
  const roles = authState?.roles ?? EMPTY_ROLES;
  const [isCheckingAccess, setIsCheckingAccess] = useState<boolean>(true);
  const [isAccessAllowed, setIsAccessAllowed] = useState<boolean>(false);

  const hasStoredRoleAccess = useMemo(
    () => hasKidsAppLocationRoleAccess(roles),
    [roles],
  );

  useEffect(() => {
    let isActive = true;

    const resolveAccess = async (): Promise<void> => {
      if (hasStoredRoleAccess) {
        setIsAccessAllowed(true);
        setIsCheckingAccess(false);
        return;
      }

      try {
        const schoolRoles = await getSchoolRolesForCurrentUser();

        if (!isActive) {
          return;
        }

        const hasSchoolRoleAccess = hasKidsAppLocationRoleAccess(schoolRoles);
        setIsAccessAllowed(hasSchoolRoleAccess);
        setIsCheckingAccess(false);

        if (!hasSchoolRoleAccess) {
          history.replace(PAGES.DISPLAY_STUDENT);
        }
      } catch (error) {
        logger.warn('Failed to resolve kids app location access:', error);
        if (isActive) {
          setIsAccessAllowed(false);
          setIsCheckingAccess(false);
          history.replace(PAGES.DISPLAY_STUDENT);
        }
      }
    };

    void resolveAccess();

    return () => {
      isActive = false;
    };
  }, [hasStoredRoleAccess, history]);

  return { isCheckingAccess, isAccessAllowed };
};
