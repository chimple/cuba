import { TableTypes, LeaderboardDropdownList } from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import type {
  LeaderboardInfo,
  JoinClassInviteLookupResult,
} from './ServiceApi.types';

export interface ServiceApiClassroom {
  getPendingAssignments(
    classId: string,
    studentId: string,
  ): Promise<TableTypes<'assignment'>[]>;

  getSchoolsForUser(
    userId: string,
    options?: { page?: number; page_size?: number; search?: string },
  ): Promise<{ school: TableTypes<'school'>; role: RoleType }[]>;

  getSchoolsForUserBySearchTerm?(
    userId: string,
    searchTerm: string,
  ): Promise<{ school: TableTypes<'school'>; role: RoleType }[]>;

  getUserRoleForSchool(
    userId: string,
    schoolId: string,
  ): Promise<RoleType | undefined>;

  isUserTeacher(userId: string): Promise<boolean>;

  getClassesForSchool(
    schoolId: string,
    userId: string,
  ): Promise<TableTypes<'class'>[]>;

  getStudentsForClass(classId: string): Promise<TableTypes<'user'>[]>;

  getDataByInviteCode(inviteCode: number): Promise<any>;

  getDataByInviteCodeNew(
    inviteCode: number,
  ): Promise<JoinClassInviteLookupResult>;

  storeJoinClassLookupDataLocally(
    classData: TableTypes<'class'>,
    schoolData: TableTypes<'school'>,
  ): Promise<void>;

  linkStudent(inviteCode: number, studentId: string): Promise<any>;

  getLeaderboardResults(
    sectionId: string,
    leaderboardDropdownType: LeaderboardDropdownList,
  ): Promise<LeaderboardInfo | undefined>;

  getLeaderboardStudentResultFromB2CCollection(
    studentId: string,
  ): Promise<LeaderboardInfo | undefined>;

  getClassById(id: string): Promise<TableTypes<'class'> | undefined>;

  isStudentLinked(studentId: string, fromCache: boolean): Promise<boolean>;

  getClassesBySchoolId(schoolId: string): Promise<TableTypes<'class'>[]>;

  addParentToNewClass(classID: string, studentID: string): Promise<void>;

  getClassByUserId(userId: string): Promise<TableTypes<'class'> | undefined>;
}
