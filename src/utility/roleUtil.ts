import { MODES } from '../common/constants';
import { RoleType } from '../interface/modelInterfaces';

const TEACHER_APP_ROLES = new Set<string>([
  RoleType.TEACHER,
  RoleType.PRINCIPAL,
  RoleType.COORDINATOR,
]);

export const isRoleMatch = (
  roleValue: string | null | undefined,
  roleToMatch: RoleType,
): boolean => (roleValue ?? '').toLowerCase() === roleToMatch;

export const isAutoUserRole = (roleValue: string | null | undefined): boolean =>
  isRoleMatch(roleValue, RoleType.AUTOUSER);

export const isTeacherAppRole = (
  roleValue: string | null | undefined,
): boolean => TEACHER_APP_ROLES.has((roleValue ?? '').toLowerCase());

export const resolveTeacherAppModeForRole = (
  roleValue: string | null | undefined,
  hasAutoUserRoleFallback: boolean,
): MODES => {
  if (isTeacherAppRole(roleValue)) {
    return MODES.TEACHER;
  }

  if (isAutoUserRole(roleValue) || hasAutoUserRoleFallback) {
    return MODES.TEACHER_SCHOOL;
  }

  return MODES.TEACHER;
};
