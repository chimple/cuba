import { TableTypes, RESULT_STATUS, SOURCE } from '../../../common/constants';
import { StudentLessonResult } from '../../../common/courseConstants';

export interface ServiceApiStudentProgress {
  updateResult(
    student: TableTypes<'user'>,
    courseId: string | undefined,
    lessonId: string,
    score: number,
    correctMoves: number,
    wrongMoves: number,
    timeSpent: number,
    assignmentId: string | undefined,
    chapterId: string | null,
    classId: string | undefined,
    schoolId: string | undefined,
    isImediateSync?: boolean,
    isHomework?: boolean,
    skill_id?: string | undefined,
    skill_ability?: number | undefined,
    outcome_id?: string | undefined,
    outcome_ability?: number | undefined,
    competency_id?: string | undefined,
    competency_ability?: number | undefined,
    domain_id?: string | undefined,
    domain_ability?: number | undefined,
    subject_id?: string | undefined,
    subject_ability?: number | undefined,
    activities_scores?: string | undefined,
    user_id?: string | undefined,
    status?: RESULT_STATUS | undefined,
    source?: SOURCE | undefined,
  ): Promise<TableTypes<'result'>>;

  getStudentResult(
    studentId: string,
    fromCache?: boolean,
  ): Promise<TableTypes<'result'>[]>;

  getStudentProgress(studentId: string): Promise<
    Record<
      string,
      (TableTypes<'result'> & {
        lesson_name?: string;
        chapter_name?: string;
      })[]
    >
  >;

  getStudentResultInMap(
    studentId: string,
  ): Promise<{ [lessonDocId: string]: TableTypes<'result'> }>;

  hasStudentResult(studentId: string): Promise<boolean>;

  getLessonResultsForStudent(
    studentId: string,
  ): Promise<Map<string, StudentLessonResult> | undefined>;

  updateFavoriteLesson(
    studentId: string,
    lessonId: string,
  ): Promise<TableTypes<'favorite_lesson'>>;

  getPendingAssignmentForLesson(
    lessonId: string,
    classId: string,
    studentId: string,
  ): Promise<TableTypes<'assignment'> | undefined>;

  getFavouriteLessons(userId: string): Promise<TableTypes<'lesson'>[]>;

  getStudentClassesAndSchools(userId: string): Promise<{
    classes: TableTypes<'class'>[];
    schools: TableTypes<'school'>[];
  }>;

  isStudentPlayedPalLesson(
    studentId: string,
    courseId: string,
  ): Promise<boolean>;

  hasPendingAbortedAssessment(
    studentId: string,
    courseId: string,
  ): Promise<boolean>;

  getLatestAssessmentGroup(
    classId: string,
    student: TableTypes<'user'>,
    courseId?: string,
  ): Promise<TableTypes<'assignment'>[]>;
}
