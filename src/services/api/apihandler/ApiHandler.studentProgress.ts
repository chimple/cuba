import { ApiHandlerContentCatalog } from './ApiHandler.contentCatalog';
import { TableTypes, RESULT_STATUS, SOURCE } from '../../../common/constants';
import { StudentLessonResult } from '../../../common/courseConstants';

export class ApiHandlerStudentProgress extends ApiHandlerContentCatalog {
  async updateResult(
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
  ): Promise<TableTypes<'result'>> {
    return await this.s.updateResult(
      student,
      courseId,
      lessonId,
      score,
      correctMoves,
      wrongMoves,
      timeSpent,
      assignmentId,
      chapterId,
      classId,
      schoolId,
      isImediateSync,
      isHomework,
      skill_id,
      skill_ability,
      outcome_id,
      outcome_ability,
      competency_id,
      competency_ability,
      domain_id,
      domain_ability,
      subject_id,
      subject_ability,
      activities_scores,
      user_id,
      status,
      source,
    );
  }

  async getStudentResult(
    studentId: string,
    fromCache?: boolean,
  ): Promise<TableTypes<'result'>[]> {
    return await this.s.getStudentResult(studentId, fromCache);
  }

  async getStudentProgress(studentId: string): Promise<
    Record<
      string,
      (TableTypes<'result'> & {
        lesson_name?: string;
        chapter_name?: string;
      })[]
    >
  > {
    return await this.s.getStudentProgress(studentId);
  }

  async getStudentResultInMap(
    studentId: string,
  ): Promise<{ [lessonDocId: string]: TableTypes<'result'> }> {
    return await this.s.getStudentResultInMap(studentId);
  }

  async hasStudentResult(studentId: string): Promise<boolean> {
    return await this.s.hasStudentResult(studentId);
  }

  async getLessonResultsForStudent(
    studentId: string,
  ): Promise<Map<string, StudentLessonResult> | undefined> {
    return await this.s.getLessonResultsForStudent(studentId);
  }

  async updateFavoriteLesson(
    studentId: string,
    lessonId: string,
  ): Promise<TableTypes<'favorite_lesson'>> {
    return await this.s.updateFavoriteLesson(studentId, lessonId);
  }

  async getPendingAssignmentForLesson(
    lessonId: string,
    classId: string,
    studentId: string,
  ): Promise<TableTypes<'assignment'> | undefined> {
    return this.s.getPendingAssignmentForLesson(lessonId, classId, studentId);
  }

  getFavouriteLessons(userId: string): Promise<TableTypes<'lesson'>[]> {
    return this.s.getFavouriteLessons(userId);
  }

  getStudentClassesAndSchools(userId: string): Promise<{
    classes: TableTypes<'class'>[];
    schools: TableTypes<'school'>[];
  }> {
    return this.s.getStudentClassesAndSchools(userId);
  }

  async isStudentPlayedPalLesson(
    studentId: string,
    courseId: string,
  ): Promise<boolean> {
    return await this.s.isStudentPlayedPalLesson(studentId, courseId);
  }

  async hasPendingAbortedAssessment(
    studentId: string,
    courseId: string,
  ): Promise<boolean> {
    return await this.s.hasPendingAbortedAssessment(studentId, courseId);
  }

  async getLatestAssessmentGroup(
    classId: string,
    student: TableTypes<'user'>,
    courseId?: string,
  ): Promise<TableTypes<'assignment'>[]> {
    return this.s.getLatestAssessmentGroup(classId, student, courseId);
  }
}
