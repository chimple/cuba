import { ApiHandlerSchoolManagement } from './ApiHandler.schoolManagement';
import { TableTypes } from '../../../common/constants';
import { AvatarObj } from '../../../components/animation/Avatar';
import Course from '../../../models/Course';
import Lesson from '../../../models/Lesson';

export class ApiHandlerContentCatalog extends ApiHandlerSchoolManagement {
  async getAllCurriculums(): Promise<TableTypes<'curriculum'>[]> {
    return await this.s.getAllCurriculums();
  }

  async getAllGrades(): Promise<TableTypes<'grade'>[]> {
    return await this.s.getAllGrades();
  }

  async getGradeById(id: string): Promise<TableTypes<'grade'> | undefined> {
    return await this.s.getGradeById(id);
  }

  async getGradeByName(name: string): Promise<TableTypes<'grade'> | undefined> {
    return await this.s.getGradeByName(name);
  }

  async getGradesByIds(ids: string[]): Promise<TableTypes<'grade'>[]> {
    return await this.s.getGradesByIds(ids);
  }

  async getCurriculumById(
    id: string,
  ): Promise<TableTypes<'curriculum'> | undefined> {
    return await this.s.getCurriculumById(id);
  }

  async getCurriculumsByIds(
    ids: string[],
  ): Promise<TableTypes<'curriculum'>[]> {
    return await this.s.getCurriculumsByIds(ids);
  }

  async getAllLanguages(): Promise<TableTypes<'language'>[]> {
    return await this.s.getAllLanguages();
  }

  async getCourseByUserGradeId(
    gradeDocId: string | null | undefined,
    boardDocId: string | null | undefined,
  ): Promise<TableTypes<'course'>[]> {
    return await this.s.getCourseByUserGradeId(gradeDocId, boardDocId);
  }

  async getLanguageWithId(
    id: string,
  ): Promise<TableTypes<'language'> | undefined> {
    return await this.s.getLanguageWithId(id);
  }

  async getLessonWithCocosLessonId(
    lessonId: string,
  ): Promise<TableTypes<'lesson'> | null> {
    return await this.s.getLessonWithCocosLessonId(lessonId);
  }

  async getCoursesForParentsStudent(
    studentId: string,
  ): Promise<TableTypes<'course'>[]> {
    return await this.s.getCoursesForParentsStudent(studentId);
  }

  async getAdditionalCourses(
    studentId: string,
  ): Promise<TableTypes<'course'>[]> {
    return await this.s.getAdditionalCourses(studentId);
  }

  async addCourseForParentsStudent(
    courses: TableTypes<'course'>[],
    student: TableTypes<'user'>,
  ): Promise<TableTypes<'course'>[] | void> {
    return this.s.addCourseForParentsStudent(courses, student);
  }

  async getCoursesForClassStudent(
    classId: string,
  ): Promise<TableTypes<'course'>[]> {
    return await this.s.getCoursesForClassStudent(classId);
  }

  async getLesson(id: string): Promise<TableTypes<'lesson'> | undefined> {
    return await this.s.getLesson(id);
  }

  async getBonusesByIds(ids: string[]): Promise<TableTypes<'lesson'>[]> {
    return await this.s.getBonusesByIds(ids);
  }

  async getChapterById(id: string): Promise<TableTypes<'chapter'> | undefined> {
    return await this.s.getChapterById(id);
  }

  async getLessonsForChapter(
    chapterId: string,
  ): Promise<TableTypes<'lesson'>[]> {
    return await this.s.getLessonsForChapter(chapterId);
  }

  async getDifferentGradesForCourse(course: TableTypes<'course'>): Promise<{
    grades: TableTypes<'grade'>[];
    courses: TableTypes<'course'>[];
  }> {
    return await this.s.getDifferentGradesForCourse(course);
  }

  async getChaptersForCourse(
    courseId: string,
  ): Promise<TableTypes<'chapter'>[]> {
    return this.s.getChaptersForCourse(courseId);
  }

  async getSubject(id: string): Promise<TableTypes<'subject'> | undefined> {
    return await this.s.getSubject(id);
  }

  async getCourse(id: string): Promise<TableTypes<'course'> | undefined> {
    return await this.s.getCourse(id);
  }

  async getCourses(courseIds: string[]): Promise<TableTypes<'course'>[]> {
    return await this.s.getCourses(courseIds);
  }

  async getAllCourses(): Promise<TableTypes<'course'>[]> {
    return await this.s.getAllCourses();
  }

  async getCoursesByGrade(gradeDocId: any): Promise<TableTypes<'course'>[]> {
    return await this.s.getCoursesByGrade(gradeDocId);
  }

  getAllLessonsForCourse(courseId: string): Promise<TableTypes<'lesson'>[]> {
    return this.s.getAllLessonsForCourse(courseId);
  }

  getLessonFromCourse(
    course: Course,
    lessonId: string,
  ): Promise<Lesson | undefined> {
    return this.s.getLessonFromCourse(course, lessonId);
  }

  async getLessonFromChapter(
    chapterId: string,
    lessonId: string,
  ): Promise<{
    lesson: TableTypes<'lesson'>[];
    course: TableTypes<'course'>[];
  }> {
    return this.s.getLessonFromChapter(chapterId, lessonId);
  }

  async getCoursesFromLesson(
    lessonId: string,
  ): Promise<TableTypes<'course'>[]> {
    return this.s.getCoursesFromLesson(lessonId);
  }

  async getSubjectLessonsBySubjectId(
    subjectId: string,
    student?: TableTypes<'user'>,
    courseId?: string,
  ): Promise<TableTypes<'subject_lesson'> | null> {
    return await this.s.getSubjectLessonsBySubjectId(
      subjectId,
      student,
      courseId,
    );
  }

  async getLidoCommonAudioUrl(
    languageId: string,
    localeId?: string | null,
  ): Promise<{ lido_common_audio_url: string | null } | null> {
    return await this.s.getLidoCommonAudioUrl(languageId, localeId);
  }

  async getDomainsBySubjectAndFramework(
    subjectId: string,
    frameworkId: string,
  ): Promise<TableTypes<'domain'>[]> {
    return this.s.getDomainsBySubjectAndFramework(subjectId, frameworkId);
  }

  async getCompetenciesByDomainIds(
    domainIds: string[],
  ): Promise<TableTypes<'competency'>[]> {
    return this.s.getCompetenciesByDomainIds(domainIds);
  }

  async getOutcomesByCompetencyIds(
    competencyIds: string[],
  ): Promise<TableTypes<'outcome'>[]> {
    return this.s.getOutcomesByCompetencyIds(competencyIds);
  }

  async getSkillsByOutcomeIds(
    outcomeIds: string[],
  ): Promise<TableTypes<'skill'>[]> {
    return this.s.getSkillsByOutcomeIds(outcomeIds);
  }

  async getResultsBySkillIds(
    studentId: string,
    skillIds: string[],
  ): Promise<TableTypes<'result'>[]> {
    return this.s.getResultsBySkillIds(studentId, skillIds);
  }

  async getSkillRelationsByTargetIds(
    targetSkillIds: string[],
  ): Promise<TableTypes<'skill_relation'>[]> {
    return this.s.getSkillRelationsByTargetIds(targetSkillIds);
  }

  async getSkillLessonsBySkillIds(
    skillIds: string[],
    languageCode?: string,
  ): Promise<TableTypes<'skill_lesson'>[]> {
    return this.s.getSkillLessonsBySkillIds(skillIds, languageCode);
  }

  async getSkillByLessonIdentifier(
    lessonIdentifier: string,
  ): Promise<TableTypes<'skill'>[]> {
    return this.s.getSkillByLessonIdentifier(lessonIdentifier);
  }

  async getSkillById(
    skillId: string,
  ): Promise<TableTypes<'skill'> | undefined> {
    return await this.s.getSkillById(skillId);
  }

  async getSubjectBySkillId(
    skillId: string,
  ): Promise<TableTypes<'subject'> | undefined> {
    return await this.s.getSubjectBySkillId(skillId);
  }

  async getAvatarInfo(): Promise<AvatarObj | undefined> {
    return await this.s.getAvatarInfo();
  }
}
