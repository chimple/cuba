import { ApiHandlerStudentProgress } from './ApiHandler.studentProgress';
import type { LeaderboardInfo } from '../ServiceApi';
import { TableTypes, LeaderboardDropdownList } from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';

export class ApiHandlerClassroom extends ApiHandlerStudentProgress {
  async getPendingAssignments(
    classId: string,
    studentId: string,
  ): Promise<TableTypes<'assignment'>[]> {
    return await this.s.getPendingAssignments(classId, studentId);
  }

  async getSchoolsForUser(
    userId: string,
    options?: { page?: number; page_size?: number; search?: string },
  ): Promise<{ school: TableTypes<'school'>; role: RoleType }[]> {
    return await this.s.getSchoolsForUser(userId, options);
  }

  async getSchoolsForUserBySearchTerm(
    userId: string,
    searchTerm: string,
  ): Promise<{ school: TableTypes<'school'>; role: RoleType }[]> {
    return await this.s.getSchoolsForUserBySearchTerm!(userId, searchTerm);
  }

  async getUserRoleForSchool(
    userId: string,
    schoolId: string,
  ): Promise<RoleType | undefined> {
    return await this.s.getUserRoleForSchool(userId, schoolId);
  }

  async isUserTeacher(userId: string): Promise<boolean> {
    return await this.s.isUserTeacher(userId);
  }

  async getClassesForSchool(
    schoolId: string,
    userId: string,
  ): Promise<TableTypes<'class'>[]> {
    return await this.s.getClassesForSchool(schoolId, userId);
  }

  async getStudentsForClass(classId: string): Promise<TableTypes<'user'>[]> {
    return await this.s.getStudentsForClass(classId);
  }

  async getDataByInviteCode(inviteCode: number): Promise<any> {
    return await this.s.getDataByInviteCode(inviteCode);
  }

  async getDataByInviteCodeNew(inviteCode: number): Promise<any> {
    return await this.s.getDataByInviteCodeNew(inviteCode);
  }

  async storeJoinClassLookupDataLocally(
    classData: TableTypes<'class'>,
    schoolData: TableTypes<'school'>,
  ): Promise<void> {
    return await this.s.storeJoinClassLookupDataLocally(classData, schoolData);
  }

  async linkStudent(inviteCode: number, studentId: string): Promise<any> {
    return await this.s.linkStudent(inviteCode, studentId);
  }

  async getLeaderboardResults(
    sectionId: string,
    leaderboardDropdownType: LeaderboardDropdownList,
  ): Promise<LeaderboardInfo | undefined> {
    return await this.s.getLeaderboardResults(
      sectionId,
      leaderboardDropdownType,
    );
  }

  async getLeaderboardStudentResultFromB2CCollection(
    studentId: string,
  ): Promise<LeaderboardInfo | undefined> {
    return await this.s.getLeaderboardStudentResultFromB2CCollection(studentId);
  }

  async getClassById(id: string): Promise<TableTypes<'class'> | undefined> {
    return await this.s.getClassById(id);
  }

  async isStudentLinked(
    studentId: string,
    fromCache: boolean = true,
  ): Promise<boolean> {
    return await this.s.isStudentLinked(studentId, fromCache);
  }

  async getClassesBySchoolId(schoolId: string): Promise<TableTypes<'class'>[]> {
    return await this.s.getClassesBySchoolId(schoolId);
  }

  async addParentToNewClass(classId: string, studentId: string): Promise<void> {
    return await this.s.addParentToNewClass(classId, studentId);
  }

  async getClassByUserId(
    userId: string,
  ): Promise<TableTypes<'class'> | undefined> {
    return this.s.getClassByUserId(userId);
  }
}
