import { TableTypes } from '../../../common/constants';
import { AvatarObj } from '../../../components/animation/Avatar';
import Course from '../../../models/Course';
import Lesson from '../../../models/Lesson';

export interface ServiceApiContentCatalog {
  getAllCurriculums(): Promise<TableTypes<'curriculum'>[]>;

  getAllGrades(): Promise<TableTypes<'grade'>[]>;

  getGradeById(id: string): Promise<TableTypes<'grade'> | undefined>;

  getGradeByName(name: string): Promise<TableTypes<'grade'> | undefined>;

  getGradesByIds(ids: string[]): Promise<TableTypes<'grade'>[]>;

  getCurriculumById(id: string): Promise<TableTypes<'curriculum'> | undefined>;

  getCurriculumsByIds(ids: string[]): Promise<TableTypes<'curriculum'>[]>;

  getAllLanguages(): Promise<TableTypes<'language'>[]>;

  getCourseByUserGradeId(
    gradeDocId: string | null | undefined,
    boardDocId: string | null | undefined,
  ): Promise<TableTypes<'course'>[]>;

  getLanguageWithId(id: string): Promise<TableTypes<'language'> | undefined>;

  getLessonWithCocosLessonId(
    lessonId: string,
  ): Promise<TableTypes<'lesson'> | null>;

  getCoursesForParentsStudent(
    studentId: string,
  ): Promise<TableTypes<'course'>[]>;

  getAdditionalCourses(studentId: string): Promise<TableTypes<'course'>[]>;

  addCourseForParentsStudent(
    courses: TableTypes<'course'>[],
    student: TableTypes<'user'>,
  ): Promise<TableTypes<'course'>[] | void>;

  getCoursesForClassStudent(classId: string): Promise<TableTypes<'course'>[]>;

  getLesson(id: string): Promise<TableTypes<'lesson'> | undefined>;

  getBonusesByIds(ids: string[]): Promise<TableTypes<'lesson'>[]>;

  getChapterById(id: string): Promise<TableTypes<'chapter'> | undefined>;

  getLessonsForChapter(chapterId: string): Promise<TableTypes<'lesson'>[]>;

  getDifferentGradesForCourse(course: TableTypes<'course'>): Promise<{
    grades: TableTypes<'grade'>[];
    courses: TableTypes<'course'>[];
  }>;

  getChaptersForCourse(courseId: string): Promise<TableTypes<'chapter'>[]>;

  getSubject(id: string): Promise<TableTypes<'subject'> | undefined>;

  getCourse(id: string): Promise<TableTypes<'course'> | undefined>;

  getCourses(courseIds: string[]): Promise<TableTypes<'course'>[]>;

  getAllCourses(): Promise<TableTypes<'course'>[]>;

  getCoursesByGrade(gradeDocId: any): Promise<TableTypes<'course'>[]>;

  getAllLessonsForCourse(courseId: string): Promise<TableTypes<'lesson'>[]>;

  getLessonFromCourse(
    course: Course,
    lessonId: string,
  ): Promise<Lesson | undefined>;

  getLessonFromChapter(
    chapterId: string,
    lessonId: string,
  ): Promise<{
    lesson: TableTypes<'lesson'>[];
    course: TableTypes<'course'>[];
  }>;

  getCoursesFromLesson(lessonId: string): Promise<TableTypes<'course'>[]>;

  getSubjectLessonsBySubjectId(
    subjectId: string,
    student?: TableTypes<'user'>,
    courseId?: string,
  ): Promise<TableTypes<'subject_lesson'> | null>;

  getLidoCommonAudioUrl(
    languageId: string,
    localeId?: string | null,
  ): Promise<{ lido_common_audio_url: string | null } | null>;

  getDomainsBySubjectAndFramework(
    subjectId: string,
    frameworkId: string,
  ): Promise<TableTypes<'domain'>[]>;

  getCompetenciesByDomainIds(
    domainIds: string[],
  ): Promise<TableTypes<'competency'>[]>;

  getOutcomesByCompetencyIds(
    competencyIds: string[],
  ): Promise<TableTypes<'outcome'>[]>;

  getSkillsByOutcomeIds(outcomeIds: string[]): Promise<TableTypes<'skill'>[]>;

  getResultsBySkillIds(
    studentId: string,
    skillIds: string[],
  ): Promise<TableTypes<'result'>[]>;

  getSkillRelationsByTargetIds(
    targetSkillIds: string[],
  ): Promise<TableTypes<'skill_relation'>[]>;

  getSkillLessonsBySkillIds(
    skillIds: string[],
    languageCode?: string,
  ): Promise<TableTypes<'skill_lesson'>[]>;

  getSkillByLessonIdentifier(
    lessonIdentifier: string,
  ): Promise<TableTypes<'skill'>[]>;

  getSkillById(skillId: string): Promise<TableTypes<'skill'> | undefined>;

  getSubjectBySkillId(
    skillId: string,
  ): Promise<TableTypes<'subject'> | undefined>;

  getAvatarInfo(): Promise<AvatarObj | undefined>;
}
