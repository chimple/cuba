import { ApiHandlerRewards } from './ApiHandler.rewards';
import type {
  AssignmentCartData,
  AssignmentDateRangeData,
} from '../ServiceApi';
import { TableTypes } from '../../../common/constants';

export class ApiHandlerAssignments extends ApiHandlerRewards {
  async getRecommendedLessons(
    studentId: string,
    classId?: string,
  ): Promise<TableTypes<'lesson'>[]> {
    return this.s.getRecommendedLessons(studentId, classId);
  }

  searchLessons(searchString: string): Promise<TableTypes<'lesson'>[]> {
    return this.s.searchLessons(searchString);
  }

  createOrUpdateAssignmentCart(
    userId: string,
    lessons: string,
  ): Promise<boolean | undefined> {
    return this.s.createOrUpdateAssignmentCart(userId, lessons);
  }

  getUserAssignmentCart(
    userId: string,
  ): Promise<AssignmentCartData | undefined> {
    return this.s.getUserAssignmentCart(userId);
  }

  getChapterByLesson(
    lessonId: string,
    classId?: string,
    userId?: string,
  ): Promise<String | undefined> {
    return this.s.getChapterByLesson(lessonId, classId, userId);
  }

  getAssignmentOrLiveQuizByClassByDate(
    classId: string,
    courseIds: string[],
    startDate: string,
    endDate: string,
    isClassWise: boolean,
    isLiveQuiz: boolean,
    allAssignments: boolean,
  ): Promise<TableTypes<'assignment'>[] | undefined> {
    return this.s.getAssignmentOrLiveQuizByClassByDate(
      classId,
      courseIds,
      startDate,
      endDate,
      isClassWise,
      isLiveQuiz,
      allAssignments,
    );
  }

  getStudentLastTenResults(
    studentId: string,
    courseIds: string[],
    assignmentIds: string[],
    classId: string,
  ): Promise<TableTypes<'result'>[]> {
    return this.s.getStudentLastTenResults(
      studentId,
      courseIds,
      assignmentIds,
      classId,
    );
  }

  createClass(
    schoolId: string,
    className: string,
    groupId?: string,
    whatsapp_invite_link?: string,
    gradeId?: string,
    standard?: string,
  ): Promise<TableTypes<'class'>> {
    return this.s.createClass(
      schoolId,
      className,
      groupId,
      whatsapp_invite_link,
      gradeId,
      standard,
    );
  }

  updateClass(
    classId: string,
    className: string,
    groupId?: string,
    whatsapp_invite_link?: string,
  ) {
    return this.s.updateClass(
      classId,
      className,
      groupId,
      whatsapp_invite_link,
    );
  }

  async deleteClass(classId: string) {
    return await this.s.deleteClass(classId);
  }

  getResultByAssignmentIds(
    assignmentIds: string[],
  ): Promise<TableTypes<'result'>[] | undefined> {
    return this.s.getResultByAssignmentIds(assignmentIds);
  }

  getResultByAssignmentIdsForCurrentClassMembers(
    assignmentIds: string[],
    classId: string,
  ): Promise<TableTypes<'result'>[] | undefined> {
    return this.s.getResultByAssignmentIdsForCurrentClassMembers(
      assignmentIds,
      classId,
    );
  }

  async getLastAssignmentsForRecommendations(
    classId: string,
  ): Promise<TableTypes<'assignment'>[] | undefined> {
    return this.s.getLastAssignmentsForRecommendations(classId);
  }

  getAssignmentUserByAssignmentIds(
    assignmentIds: string[],
  ): Promise<TableTypes<'assignment_user'>[]> {
    return this.s.getAssignmentUserByAssignmentIds(assignmentIds);
  }

  async createAssignment(
    student_list: string[],
    userId: string,
    starts_at: string,
    ends_at: string,
    is_class_wise: boolean,
    class_id: string,
    school_id: string,
    lesson_id: string,
    chapter_id: string,
    course_id: string,
    type: string,
    batch_id: string,
    source: string | null,
    created_at?: string,
  ): Promise<void> {
    return this.s.createAssignment(
      student_list,
      userId,
      starts_at,
      ends_at,
      is_class_wise,
      class_id,
      school_id,
      lesson_id,
      chapter_id,
      course_id,
      type,
      batch_id,
      source,
      created_at,
    );
  }

  getTeachersForClass(
    classId: string,
  ): Promise<TableTypes<'user'>[] | undefined> {
    return this.s.getTeachersForClass(classId);
  }

  getUserByEmail(email: string): Promise<TableTypes<'user'> | undefined> {
    return this.s.getUserByEmail(email);
  }

  getUserByPhoneNumber(phone: string): Promise<TableTypes<'user'> | undefined> {
    return this.s.getUserByPhoneNumber(phone);
  }

  addTeacherToClass(
    schoolId: string,
    classId: string,
    user: TableTypes<'user'>,
  ): Promise<void> {
    return this.s.addTeacherToClass(schoolId, classId, user);
  }

  checkUserExistInSchool(schoolId: string, userId: string): Promise<boolean> {
    return this.s.checkUserExistInSchool(schoolId, userId);
  }

  checkTeacherExistInClass(
    schoolId: string,
    classId: string,
    userId: string,
  ): Promise<boolean> {
    return this.s.checkTeacherExistInClass(schoolId, classId, userId);
  }

  checkUserIsManagerOrDirector(
    schoolId: string,
    userId: string,
  ): Promise<boolean> {
    return this.s.checkUserIsManagerOrDirector(schoolId, userId);
  }

  async getAssignmentsByAssignerAndClass(
    userId: string,
    classId: string,
    startDate: string,
    endDate: string,
  ): Promise<{
    classWiseAssignments: TableTypes<'assignment'>[];
    individualAssignments: TableTypes<'assignment'>[];
  }> {
    return this.s.getAssignmentsByAssignerAndClass(
      userId,
      classId,
      startDate,
      endDate,
    );
  }

  async getAssignmentDateRangeDataForClassAndSchool(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<AssignmentDateRangeData> {
    return this.s.getAssignmentDateRangeDataForClassAndSchool(
      userId,
      startDate,
      endDate,
    );
  }

  async getCoinAndStreakCount(
    userId: string,
    classId: string,
    schoolId: string,
  ): Promise<{ coins: number; streak: number } | undefined> {
    return this.s.getCoinAndStreakCount(userId, classId, schoolId);
  }

  getAssignmentById(id: string): Promise<TableTypes<'assignment'> | undefined> {
    return this.s.getAssignmentById(id);
  }

  getAssignmentsByIds(ids: string[]): Promise<TableTypes<'assignment'>[]> {
    return this.s.getAssignmentsByIds(ids);
  }

  getStudentResultsByAssignmentId(assignmentId: string) {
    return this.s.getStudentResultsByAssignmentId(assignmentId);
  }

  getAssignedStudents(assignmentId: string): Promise<string[]> {
    return this.s.getAssignedStudents(assignmentId);
  }

  async isAssignmentAlreadyAssigned(
    schoolId: string,
    classId: string,
    courseId: string,
    chapterId: string,
    lessonId: string,
  ): Promise<boolean> {
    return this.s.isAssignmentAlreadyAssigned(
      schoolId,
      classId,
      courseId,
      chapterId,
      lessonId,
    );
  }

  getAssignmentInfoForLessonsPerClass(
    classId: string,
    lessonIds: string[],
  ): Promise<string[]> {
    return this.s.getAssignmentInfoForLessonsPerClass(classId, lessonIds);
  }
}
