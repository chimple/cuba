import { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router';
import { MODES, PAGES } from '../../common/constants';
import { RoleType } from '../../interface/modelInterfaces';
import { useAppSelector } from '../../redux/hooks';
import { AuthState } from '../../redux/slices/auth/authSlice';
import { RootState } from '../../redux/store';
import { ServiceConfig } from '../../services/ServiceConfig';
import logger from '../../utility/logger';
import { schoolUtil } from '../../utility/schoolUtil';

const KIDS_APP_LOCATION_ALLOWED_ROLES = new Set<string>([
  RoleType.TEACHER,
  RoleType.PRINCIPAL,
  RoleType.COORDINATOR,
]);
const SCHOOL_MODE_REDIRECT_ROLES = new Set<string>([RoleType.AUTOUSER]);
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

const hasSchoolModeRedirectRole = (roles: string[]): boolean =>
  roles.some((role) => SCHOOL_MODE_REDIRECT_ROLES.has(normalizeRole(role)));

const redirectToSchoolKidsMode = async (
  history: ReturnType<typeof useHistory>,
): Promise<void> => {
  await schoolUtil.setCurrMode(MODES.SCHOOL);
  history.replace(PAGES.SELECT_MODE);
};

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
  const hasStoredSchoolModeRedirectRole = useMemo(
    () => hasSchoolModeRedirectRole(roles),
    [roles],
  );

  useEffect(() => {
    let isActive = true;

    const resolveAccess = async (): Promise<void> => {
      if (hasStoredSchoolModeRedirectRole) {
        await redirectToSchoolKidsMode(history);
        if (isActive) {
          setIsAccessAllowed(false);
          setIsCheckingAccess(false);
        }
        return;
      }

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
        const hasSchoolModeRole = hasSchoolModeRedirectRole(schoolRoles);

        if (hasSchoolModeRole) {
          await redirectToSchoolKidsMode(history);
          if (isActive) {
            setIsAccessAllowed(false);
            setIsCheckingAccess(false);
          }
          return;
        }

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
  }, [hasStoredRoleAccess, hasStoredSchoolModeRedirectRole, history]);

  return { isCheckingAccess, isAccessAllowed };
};
