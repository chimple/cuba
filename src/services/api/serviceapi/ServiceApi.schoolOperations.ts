import {
  TableTypes,
  TABLES,
  CoordinatorAPIResponse,
  PrincipalAPIResponse,
} from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import type {
  OpsStudentPerformanceBandsParams,
  OpsStudentPerformanceBandRow,
} from './ServiceApi.types';

export interface ServiceApiSchoolOperations {
  updateCoins(
    userId: string,
    schoolId: string,
    classId: string,
    coins: number,
    streakIncrement?: number,
  ): Promise<TableTypes<TABLES.UserAchivements>>;

  getTeacherJoinedDate(
    userId: string,
    classId: string,
  ): Promise<TableTypes<'class_user'> | undefined>;

  getStudentResultByDate(
    studentId: string,
    courseIds: string[],
    startDate: string,
    endDate: string,
    classId: string,
  ): Promise<TableTypes<'result'>[] | undefined>;

  getStudentPlayStatus(
    studentId: string,
    classId: string,
  ): Promise<{ hasPlayed: boolean; lastPlayedAt?: string }>;

  getOpsStudentPerformanceBands?(
    params: OpsStudentPerformanceBandsParams,
  ): Promise<OpsStudentPerformanceBandRow[]>;

  getLessonsBylessonIds(
    lessonIds: string[], // Expect an array of strings
  ): Promise<TableTypes<'lesson'>[] | undefined>;

  deleteTeacher(classId: string, teacherId: string): Promise<void>;

  getClassCodeById(class_id: string): Promise<number | undefined>;

  getResultByChapterByDate(
    chapter_id: string,
    course_id: string,
    startDate: string,
    endDate: string,
    classId: string,
  ): Promise<TableTypes<'result'>[] | undefined>;

  getUniqueAssignmentIdsByCourseAndChapter(
    classId: string,
    courseId: string,
    chapterIdOrIds: string | string[],
  ): Promise<string[]>;

  createClassCode(classId: string): Promise<number>;

  getSchoolsWithRoleAutouser(
    schoolIds: string[],
    userId: string,
  ): Promise<TableTypes<'school'>[] | undefined>;

  getPrincipalsForSchool(
    schoolId: string,
  ): Promise<TableTypes<'user'>[] | undefined>;

  getPrincipalsForSchoolPaginated(
    schoolId: string,
    page?: number,
    limit?: number,
  ): Promise<PrincipalAPIResponse>;

  getCoordinatorsForSchool(
    schoolId: string,
  ): Promise<TableTypes<'user'>[] | undefined>;

  getCoordinatorsForSchoolPaginated(
    schoolId: string,
    page?: number,
    limit?: number,
  ): Promise<CoordinatorAPIResponse>;

  getSponsorsForSchool(
    schoolId: string,
  ): Promise<TableTypes<'user'>[] | undefined>;

  addUserToSchool(
    schoolId: string,
    user: TableTypes<'user'>,
    role: RoleType,
  ): Promise<void>;

  deleteUserFromSchool(
    schoolId: string,
    userId: string,
    role: RoleType,
  ): Promise<{ success: boolean; message: string }>;

  updateSchoolLastModified(id: string): Promise<void>;

  updateClassLastModified(id: string): Promise<void>;

  updateUserLastModified(id: string): Promise<void>;

  validateSchoolData(
    schoolId: string,
    schoolName: string,
  ): Promise<{ status: string; errors?: string[] }>;

  validateParentAndStudentInClass(
    phoneNumber: string,
    studentName: string,
    className: string,
    schoolId: string,
  ): Promise<{ status: string; errors?: string[]; message?: string }>;

  validateProgramName(
    programName: string,
  ): Promise<{ status: string; errors?: string[] }>;

  validateSchoolUdiseCode(
    schoolId: string,
  ): Promise<{ status: string; errors?: string[] }>;

  validateClassNameWithSchoolID(
    schoolId: string,
    className: string,
  ): Promise<{ status: string; errors?: string[] }>;

  validateStudentInClassWithoutPhone(
    studentName: string,
    className: string,
    schoolId: string,
  ): Promise<{ status: string; errors?: string[]; message?: string }>;

  validateClassCurriculumAndSubject(
    curriculumName: string,
    subjectName: string,
    gradeName: string,
  ): Promise<{ status: string; errors?: string[] }>;

  validateUserContacts(
    programManagerPhone: string,
    fieldCoordinatorPhone?: string,
  ): Promise<{ status: string; errors?: string[] }>;

  validateWhatsappBotNumber(
    whatsappBotNumber: string,
  ): Promise<{ status: string; errors?: string[] }>;

  validateWhatsappGroupLink(
    whatsappBotNumber: string,
    whatsappGroupLink: string,
  ): Promise<{ status: string; errors?: string[] }>;

  setStarsForStudents(studentId: string, starsCount: number): Promise<void>;

  countAllPendingPushes(): Promise<number>;

  getDebugInfoLast30Days(parentId: string): Promise<any[]>;

  getCoursesForPathway(studentId: string): Promise<TableTypes<'course'>[]>;

  updateLearningPath(
    student: TableTypes<'user'>,
    learning_path: string,
  ): Promise<TableTypes<'user'>>;
}
