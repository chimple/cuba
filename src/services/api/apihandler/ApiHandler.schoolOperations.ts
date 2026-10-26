import { ApiHandlerAssignments } from './ApiHandler.assignments';
import type {
  OpsStudentPerformanceBandsParams,
  OpsStudentPerformanceBandRow,
} from '../ServiceApi';
import {
  TableTypes,
  TABLES,
  CoordinatorAPIResponse,
  PrincipalAPIResponse,
} from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';

export class ApiHandlerSchoolOperations extends ApiHandlerAssignments {
  async updateCoins(
    userId: string,
    schoolId: string,
    classId: string,
    coins: number,
    streakIncrement?: number,
  ): Promise<TableTypes<TABLES.UserAchivements>> {
    return this.s.updateCoins(
      userId,
      schoolId,
      classId,
      coins,
      streakIncrement,
    );
  }

  getTeacherJoinedDate(
    userId: string,
    classId: string,
  ): Promise<TableTypes<'class_user'> | undefined> {
    return this.s.getTeacherJoinedDate(userId, classId);
  }

  getStudentResultByDate(
    studentId: string,
    courseIds: string[],
    startDate: string,
    endDate: string,
    classId: string,
  ): Promise<TableTypes<'result'>[] | undefined> {
    return this.s.getStudentResultByDate(
      studentId,
      courseIds,
      startDate,
      endDate,
      classId,
    );
  }

  getStudentPlayStatus(
    studentId: string,
    classId: string,
  ): Promise<{ hasPlayed: boolean; lastPlayedAt?: string }> {
    return this.s.getStudentPlayStatus(studentId, classId);
  }

  getOpsStudentPerformanceBands(
    params: OpsStudentPerformanceBandsParams,
  ): Promise<OpsStudentPerformanceBandRow[]> {
    if (!this.s.getOpsStudentPerformanceBands) {
      return Promise.resolve([]);
    }

    return this.s.getOpsStudentPerformanceBands(params);
  }

  getLessonsBylessonIds(
    lessonIds: string[], // Expect an array of strings
  ): Promise<TableTypes<'lesson'>[] | undefined> {
    return this.s.getLessonsBylessonIds(lessonIds);
  }

  deleteTeacher(classId: string, teacherId: string) {
    return this.s.deleteTeacher(classId, teacherId);
  }

  getClassCodeById(class_id: string): Promise<number | undefined> {
    return this.s.getClassCodeById(class_id);
  }

  getResultByChapterByDate(
    chapter_id: string,
    course_id: string,
    startDate: string,
    endDate: string,
    classId: string,
  ): Promise<TableTypes<'result'>[] | undefined> {
    return this.s.getResultByChapterByDate(
      chapter_id,
      course_id,
      startDate,
      endDate,
      classId,
    );
  }

  getUniqueAssignmentIdsByCourseAndChapter(
    classId: string,
    courseId: string,
    chapterIdOrIds: string | string[],
  ): Promise<string[]> {
    return this.s.getUniqueAssignmentIdsByCourseAndChapter(
      classId,
      courseId,
      chapterIdOrIds,
    );
  }

  createClassCode(classId: string): Promise<number> {
    return this.s.createClassCode(classId);
  }

  getSchoolsWithRoleAutouser(
    schoolIds: string[],
    userId: string,
  ): Promise<TableTypes<'school'>[] | undefined> {
    return this.s.getSchoolsWithRoleAutouser(schoolIds, userId);
  }

  getPrincipalsForSchool(
    schoolId: string,
  ): Promise<TableTypes<'user'>[] | undefined> {
    return this.s.getPrincipalsForSchool(schoolId);
  }

  getPrincipalsForSchoolPaginated(
    schoolId: string,
    page?: number,
    limit?: number,
  ): Promise<PrincipalAPIResponse> {
    return this.s.getPrincipalsForSchoolPaginated(schoolId, page, limit);
  }

  getCoordinatorsForSchool(
    schoolId: string,
  ): Promise<TableTypes<'user'>[] | undefined> {
    return this.s.getCoordinatorsForSchool(schoolId);
  }

  getCoordinatorsForSchoolPaginated(
    schoolId: string,
    page?: number,
    limit?: number,
  ): Promise<CoordinatorAPIResponse> {
    return this.s.getCoordinatorsForSchoolPaginated(schoolId, page, limit);
  }

  getSponsorsForSchool(
    schoolId: string,
  ): Promise<TableTypes<'user'>[] | undefined> {
    return this.s.getSponsorsForSchool(schoolId);
  }

  async addUserToSchool(
    schoolId: string,
    user: TableTypes<'user'>,
    role: RoleType,
  ): Promise<void> {
    return this.s.addUserToSchool(schoolId, user, role);
  }

  async deleteUserFromSchool(
    schoolId: string,
    userId: string,
    role: RoleType,
  ): Promise<{ success: boolean; message: string }> {
    return this.s.deleteUserFromSchool(schoolId, userId, role);
  }

  async updateSchoolLastModified(schoolId: string): Promise<void> {
    return await this.s.updateSchoolLastModified(schoolId);
  }

  async updateClassLastModified(classId: string): Promise<void> {
    return await this.s.updateClassLastModified(classId);
  }

  async updateUserLastModified(userId: string): Promise<void> {
    return await this.s.updateUserLastModified(userId);
  }

  async validateSchoolData(
    schoolId: string,
    schoolName: string,
  ): Promise<{ status: string; errors?: string[] }> {
    return this.s.validateSchoolData(schoolId, schoolName);
  }

  async validateParentAndStudentInClass(
    phoneNumber: string,
    studentName: string,
    className: string,
    schoolId: string,
  ): Promise<{ status: string; errors?: string[]; message?: string }> {
    return this.s.validateParentAndStudentInClass(
      phoneNumber,
      studentName,
      className,
      schoolId,
    );
  }

  async validateProgramName(
    programName: string,
  ): Promise<{ status: string; errors?: string[] }> {
    return this.s.validateProgramName(programName);
  }

  async validateSchoolUdiseCode(
    schoolId: string,
  ): Promise<{ status: string; errors?: string[] }> {
    return this.s.validateSchoolUdiseCode(schoolId);
  }

  async validateClassNameWithSchoolID(
    schoolId: string,
    className: string,
  ): Promise<{ status: string; errors?: string[] }> {
    return this.s.validateClassNameWithSchoolID(schoolId, className);
  }

  async validateStudentInClassWithoutPhone(
    studentName: string,
    className: string,
    schoolId: string,
  ): Promise<{ status: string; errors?: string[]; message?: string }> {
    return this.s.validateStudentInClassWithoutPhone(
      studentName,
      className,
      schoolId,
    );
  }

  async validateClassCurriculumAndSubject(
    curriculumName: string,
    subjectName: string,
    gradeName: string,
  ): Promise<{ status: string; errors?: string[] }> {
    return this.s.validateClassCurriculumAndSubject(
      curriculumName,
      subjectName,
      gradeName,
    );
  }

  async validateUserContacts(
    programManagerPhone: string,
    fieldCoordinatorPhone?: string,
  ): Promise<{ status: string; errors?: string[] }> {
    return this.s.validateUserContacts(
      programManagerPhone,
      fieldCoordinatorPhone,
    );
  }

  async validateWhatsappBotNumber(
    whatsappBotNumber: string,
  ): Promise<{ status: string; errors?: string[] }> {
    return this.s.validateWhatsappBotNumber(whatsappBotNumber);
  }

  async validateWhatsappGroupLink(
    whatsappBotNumber: string,
    whatsappGroupLink: string,
  ): Promise<{ status: string; errors?: string[] }> {
    return this.s.validateWhatsappGroupLink(
      whatsappBotNumber,
      whatsappGroupLink,
    );
  }

  async setStarsForStudents(
    studentId: string,
    starsCount: number,
  ): Promise<void> {
    return this.s.setStarsForStudents(studentId, starsCount);
  }

  async countAllPendingPushes(): Promise<number> {
    return this.s.countAllPendingPushes();
  }

  async getDebugInfoLast30Days(parentId: string): Promise<any[]> {
    return this.s.getDebugInfoLast30Days(parentId);
  }

  async getCoursesForPathway(
    studentId: string,
  ): Promise<TableTypes<'course'>[]> {
    return await this.s.getCoursesForPathway(studentId);
  }

  async updateLearningPath(
    student: TableTypes<'user'>,
    learning_path: string, // New parameter for learning_path
  ): Promise<TableTypes<'user'>> {
    return await this.s.updateLearningPath(student, learning_path);
  }
}
