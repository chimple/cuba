import { TableTypes } from '../../../common/constants';
import type {
  AssignmentCartData,
  AssignmentDateRangeData,
} from './ServiceApi.types';

export interface ServiceApiAssignments {
  getRecommendedLessons(
    studentId: string,
    classId?: string,
  ): Promise<TableTypes<'lesson'>[]>;

  searchLessons(searchString: string): Promise<TableTypes<'lesson'>[]>;

  createOrUpdateAssignmentCart(
    userId: string,
    lessons: string,
  ): Promise<boolean | undefined>;

  getUserAssignmentCart(
    userId: string,
  ): Promise<AssignmentCartData | undefined>;

  getChapterByLesson(
    lessonId: string,
    classId?: string,
    userId?: string,
  ): Promise<String | undefined>;

  getAssignmentOrLiveQuizByClassByDate(
    classId: string,
    courseIds: string[],
    startDate: string,
    endDate: string,
    isClassWise: boolean,
    isLiveQuiz: boolean,
    allAssignments: boolean,
  ): Promise<TableTypes<'assignment'>[] | undefined>;

  getStudentLastTenResults(
    studentId: string,
    courseIds: string[],
    assignmentIds: string[],
    classId: string,
  ): Promise<TableTypes<'result'>[]>;

  createClass(
    schoolId: string,
    className: string,
    groupId?: string,
    whatsapp_invite_link?: string,
    gradeId?: string,
    standard?: string,
  ): Promise<TableTypes<'class'>>;

  updateClass(
    classId: string,
    className: string,
    groupId?: string,
    whatsapp_invite_link?: string,
  ): Promise<void>;

  deleteClass(classId: string): Promise<void>;

  getResultByAssignmentIds(
    assignmentIds: string[],
  ): Promise<TableTypes<'result'>[] | undefined>;

  getResultByAssignmentIdsForCurrentClassMembers(
    assignmentIds: string[],
    classId: string,
  ): Promise<TableTypes<'result'>[] | undefined>;

  getLastAssignmentsForRecommendations(
    classId: string,
  ): Promise<TableTypes<'assignment'>[] | undefined>;

  getAssignmentUserByAssignmentIds(
    assignmentIds: string[],
  ): Promise<TableTypes<'assignment_user'>[]>;

  createAssignment(
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
  ): Promise<void>;

  getTeachersForClass(
    classId: string,
  ): Promise<TableTypes<'user'>[] | undefined>;

  getUserByEmail(email: string): Promise<TableTypes<'user'> | undefined>;

  getUserByPhoneNumber(phone: string): Promise<TableTypes<'user'> | undefined>;

  addTeacherToClass(
    schoolId: string,
    classId: string,
    user: TableTypes<'user'>,
  ): Promise<void>;

  checkUserExistInSchool(schoolId: string, userId: string): Promise<boolean>;

  checkTeacherExistInClass(
    schoolId: string,
    classId: string,
    userId: string,
  ): Promise<boolean>;

  checkUserIsManagerOrDirector(
    schoolId: string,
    userId: string,
  ): Promise<boolean>;

  getAssignmentsByAssignerAndClass(
    userId: string,
    classId: string,
    startDate: string,
    endDate: string,
  ): Promise<{
    classWiseAssignments: TableTypes<'assignment'>[];
    individualAssignments: TableTypes<'assignment'>[];
  }>;

  getAssignmentDateRangeDataForClassAndSchool(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<AssignmentDateRangeData>;

  getCoinAndStreakCount(
    userId: string,
    classId: string,
    schoolId: string,
  ): Promise<{ coins: number; streak: number } | undefined>;

  getAssignmentById(id: string): Promise<TableTypes<'assignment'> | undefined>;

  getAssignmentsByIds(ids: string[]): Promise<TableTypes<'assignment'>[]>;

  getStudentResultsByAssignmentId(assignmentId: string): Promise<
    {
      result_data: TableTypes<'result'>[];
      user_data: TableTypes<'user'>[];
    }[]
  >;

  getAssignedStudents(assignmentId: string): Promise<string[]>;

  isAssignmentAlreadyAssigned(
    schoolId: string,
    classId: string,
    courseId: string,
    chapterId: string,
    lessonId: string,
  ): Promise<boolean>;

  getAssignmentInfoForLessonsPerClass(
    classId: string,
    lessonIds: string[],
  ): Promise<string[]>;
}
