import { v4 as uuidv4 } from 'uuid';
import {
  COURSES,
  DEFAULT_LOCALE_ID,
  DEFAULT_SUBJECT_IDS,
  OTHER_CURRICULUM,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import logger from '../../../utility/logger';
import { Util } from '../../../utility/util';
import { ServiceConfig } from '../../ServiceConfig';
import { SupabaseApiCoreSync } from './SupabaseApi.core.sync';

type ChapterLessonRow = {
  lesson: TableTypes<'lesson'> | null;
};
export interface SupabaseApiCourseCatalog {
  [key: string]: any;
}
export class SupabaseApiCourseCatalog extends SupabaseApiCoreSync {
  async getCourseByUserGradeId(
    gradeDocId: string | null | undefined,
    boardDocId: string | null | undefined,
  ): Promise<TableTypes<'course'>[]> {
    if (!this.supabase) return [];
    if (!gradeDocId) {
      throw new Error('Grade document ID is required.');
    }

    if (!boardDocId) {
      throw new Error('Board document ID is required.');
    }

    let courseIds: TableTypes<'course'>[] = [];
    const gradeCourses = await this.getCoursesByGrade(gradeDocId);
    const curriculumCourses = gradeCourses.filter(
      (course: TableTypes<'course'>) => course.curriculum_id === boardDocId,
    );

    courseIds.push(...curriculumCourses);

    const subjectIds = curriculumCourses
      .map((course: TableTypes<'course'>) => course.subject_id)
      .filter((id: string | null): id is string => !!id);

    const remainingSubjects = DEFAULT_SUBJECT_IDS.filter(
      (subjectId) => !subjectIds.includes(subjectId),
    );

    remainingSubjects.forEach((subjectId) => {
      const otherCourses = gradeCourses.filter(
        (course: TableTypes<'course'>) =>
          course.subject_id === subjectId &&
          course.curriculum_id === OTHER_CURRICULUM,
      );
      courseIds.push(...otherCourses);
    });

    return courseIds;
  }
  get currentStudent(): TableTypes<'user'> | undefined {
    return this._currentStudent;
  }
  set currentStudent(value: TableTypes<'user'> | undefined) {
    this._currentStudent = value;
  }
  get currentClass(): TableTypes<'class'> | undefined {
    return this._currentClass;
  }
  set currentClass(value: TableTypes<'class'> | undefined) {
    this._currentClass = value;
  }
  get currentSchool(): TableTypes<'school'> | undefined {
    return this._currentSchool;
  }
  set currentSchool(value: TableTypes<'school'> | undefined) {
    this._currentSchool = value;
  }

  get currentCourse():
    | Map<string, TableTypes<'course'> | undefined>
    | undefined {
    return this._currentCourse;
  }
  set currentCourse(
    value: Map<string, TableTypes<'course'> | undefined> | undefined,
  ) {
    this._currentCourse = value;
  }
  async updateSoundFlag(userId: string, value: boolean) {
    if (!this.supabase) return;
    try {
      const { error } = await this.supabase
        .from('user')
        .update({ sfx_off: value })
        .eq('id', userId);

      if (error) {
        throw new Error(`Failed to update sound flag: ${error.message}`);
      }
    } catch (error) {
      logger.error('Error updating sound flag:', error);
    }
  }
  async updateMusicFlag(userId: string, value: boolean) {
    if (!this.supabase) return;

    try {
      const { error } = await this.supabase
        .from('user')
        .update({ music_off: value })
        .eq('id', userId);

      if (error) {
        throw new Error(`Failed to update music flag: ${error.message}`);
      }
    } catch (error) {
      logger.error('Error updating music flag:', error);
    }
  }
  async updateLanguage(userId: string, value: string) {
    if (!this.supabase) return;
    try {
      const countryCode = await this.getClientCountryCode();
      let locale: TableTypes<'locale'> | null = null;
      if (countryCode) {
        locale = await this.getLocaleByIdOrCode(undefined, countryCode);
      }
      const { error } = await this.supabase
        .from('user')
        .update({
          language_id: value,
          locale_id: locale?.id ?? DEFAULT_LOCALE_ID,
        })
        .eq('id', userId);

      if (error) {
        throw new Error(`Failed to update language: ${error.message}`);
      }
    } catch (error) {
      logger.error('Error updating language:', error);
    }
  }
  async updateFcmToken(userId: string) {
    if (!this.supabase) return;
    try {
      const token = await Util.getToken();
      const { error } = await this.supabase
        .from('user')
        .update({ fcm_token: token })
        .eq('id', userId);

      if (error) {
        throw new Error(`Failed to update FCM token: ${error.message}`);
      }
    } catch (error) {
      logger.error('Error updating FCM token:', error);
    }
  }
  async updateTcAccept(userId: string) {
    if (!this.supabase) return;
    try {
      const { error } = await this.supabase
        .from('user')
        .update({ is_tc_accepted: true })
        .eq('id', userId);

      if (error) {
        throw new Error(`Failed to update T&C acceptance: ${error.message}`);
      }

      const auth = ServiceConfig.getI().authHandler;
      const currentUser = await auth.getCurrentUser();
      if (currentUser) {
        auth.currentUser = {
          ...currentUser,
          is_tc_accepted: true,
        };
      }
    } catch (error) {
      logger.error('Error updating T&C acceptance:', error);
      throw error;
    }
  }

  async updateTcAgreedVersion(userId: string, version: number) {
    if (!this.supabase) return;
    try {
      const { error } = await this.supabase
        .from('user')
        .update({
          tc_agreed_version: version,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        throw new Error(`Failed to update T&C acceptance: ${error.message}`);
      }
    } catch (error) {
      logger.error('Error updating T&C acceptance:', error);
      throw error;
    }
  }
  async getLanguageWithId(
    id: string,
  ): Promise<TableTypes<'language'> | undefined> {
    if (!this.supabase) return;
    try {
      const { data, error } = await this.supabase
        .from('language')
        .select('*')
        .eq('id', id)
        .eq('is_deleted', false)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(
          `Failed to fetch language with id ${id}: ${error.message}`,
        );
      }

      return data ?? undefined;
    } catch (error) {
      logger.error('Error in getLanguageWithId:', error);
      return Promise.reject(error);
    }
  }
  async getLessonWithCocosLessonId(
    lessonId: string,
  ): Promise<TableTypes<'lesson'> | null> {
    if (!this.supabase) return null;
    const { data, error } = await this.supabase
      .from('lesson')
      .select('*')
      .eq('cocos_lesson_id', lessonId)
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false, nullsFirst: false })
      .limit(1);

    if (error) {
      logger.error('Error fetching lesson:', error);
      throw new Error(
        `Failed to fetch lesson with cocos_lesson_id ${lessonId}: ${error.message}`,
      );
    }

    return data?.[0] ?? null;
  }
  async getCoursesForParentsStudent(
    studentId: string,
  ): Promise<TableTypes<'course'>[]> {
    if (!this.supabase) return [];

    // Step 1: Fetch all course IDs for the student
    const { data: userCourses, error: userCourseError } = await this.supabase
      .from('user_course')
      .select('course_id')
      .eq('user_id', studentId)
      .eq('is_deleted', false);

    if (userCourseError) {
      throw new Error(
        `Failed to fetch user_course entries: ${userCourseError.message}`,
      );
    }

    const courseIds = userCourses.map((uc) => uc.course_id).filter(Boolean);

    if (courseIds.length === 0) return [];

    // Step 2: Fetch course details for those IDs
    const { data: courses, error: courseError } = await this.supabase
      .from('course')
      .select('*')
      .in('id', courseIds)
      .eq('is_deleted', false)
      .order('sort_index', { ascending: true });

    if (courseError) {
      throw new Error(`Failed to fetch course details: ${courseError.message}`);
    }

    return courses;
  }
  async getAdditionalCourses(
    studentId: string,
  ): Promise<TableTypes<'course'>[]> {
    if (!this.supabase) return [];
    const { data: userCourses, error: ucError } = await this.supabase
      .from('user_course')
      .select('course_id')
      .eq('user_id', studentId)
      .eq('is_deleted', false);

    if (ucError) {
      logger.error('Error fetching user courses:', ucError);
      return [];
    }

    const userCourseIds = userCourses?.map((uc) => uc.course_id) ?? [];

    let query = this.supabase
      .from('course')
      .select('*')
      .eq('is_deleted', false);

    if (userCourseIds.length > 0) {
      query = query.not('id', 'in', `(${userCourseIds.join(',')})`);
    }

    const { data: courses, error: cError } = await query;

    if (cError) {
      logger.error('Error fetching additional courses:', cError);
      return [];
    }

    return courses ?? [];
  }
  async addCourseForParentsStudent(
    courses: TableTypes<'course'>[],
    student: TableTypes<'user'>,
  ) {
    if (!this.supabase) return;

    const newUserCourses: TableTypes<'user_course'>[] = courses.map(
      (course) => ({
        id: uuidv4(),
        user_id: student.id,
        course_id: course.id,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_firebase: false,
      }),
    );

    const { error } = await this.supabase
      .from('user_course')
      .insert(newUserCourses);

    if (error) {
      logger.error('Error inserting user_course:', error);
      throw error;
    }
  }
  async getCoursesForClassStudent(
    classId: string,
  ): Promise<TableTypes<'course'>[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from('class_course')
      .select('course!inner(*)')
      .eq('class_id', classId)
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error fetching courses for class student:', error);
      throw error;
    }
    const courses = (data ?? [])
      .map((item: any) => item.course)
      .sort((a, b) => (a.sort_index ?? 0) - (b.sort_index ?? 0));
    return courses ?? [];
  }
  async getLesson(id: string): Promise<TableTypes<'lesson'> | undefined> {
    if (!this.supabase) return undefined;
    const { data, error } = await this.supabase
      .from('lesson')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();
    if (error) {
      logger.error('Error fetching lesson:', error);
      return undefined;
    }
    return data ?? undefined;
  }
  async getChapterById(id: string): Promise<TableTypes<'chapter'> | undefined> {
    if (!this.supabase) return undefined;
    const { data, error } = await this.supabase
      .from('chapter')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();
    if (error) {
      logger.error('Error fetching chapter:', error);
      return undefined;
    }
    return data ?? undefined;
  }
  async getLessonsForChapter(
    chapterId: string,
  ): Promise<TableTypes<'lesson'>[]> {
    if (!this.supabase) return [];

    const student = this.currentStudent;
    let langId = student?.language_id;
    const localeId = student?.locale_id;

    const { data: chapterRows, error: chapterError } = await this.supabase
      .from(TABLES.Chapter)
      .select('course:course_id(code)')
      .eq('id', chapterId)
      .eq('is_deleted', false)
      .limit(1);

    if (chapterError) {
      logger.error('Error fetching chapter course:', chapterError);
    } else {
      const courseCode = (
        chapterRows?.[0]?.course as { code?: string | null } | null | undefined
      )?.code
        ?.trim()
        .toLowerCase();
      const courseLanguageCode =
        courseCode === COURSES.MATHS
          ? COURSES.ENGLISH
          : courseCode?.includes('-')
            ? courseCode.split('-').pop()
            : courseCode;

      if (courseLanguageCode) {
        const { data: languageRows, error: languageError } = await this.supabase
          .from(TABLES.Language)
          .select('id')
          .ilike('code', courseLanguageCode)
          .eq('is_deleted', false)
          .limit(1);

        if (languageError) {
          logger.error('Error fetching course language:', languageError);
        } else if (languageRows?.[0]?.id) {
          langId = languageRows[0].id;
        }
      }
    }

    const orFilters: string[] = [];
    orFilters.push('language_id.is.null,locale_id.is.null');
    if (langId) {
      orFilters.push(`language_id.eq.${langId},locale_id.is.null`);
    }
    if (localeId) {
      orFilters.push(`language_id.is.null,locale_id.eq.${localeId}`);
    }
    if (langId && localeId) {
      orFilters.push(`language_id.eq.${langId},locale_id.eq.${localeId}`);
    }

    const { data, error } = await this.supabase
      .from(TABLES.ChapterLesson)
      .select('lesson:lesson_id(*)')
      .eq('chapter_id', chapterId)
      .eq('is_deleted', false)
      .or(orFilters.join(','))
      .order('sort_index', { ascending: true });

    if (error) {
      logger.error('Error fetching chapter lessons:', error);
      return [];
    }

    return ((data ?? []) as ChapterLessonRow[])
      .map((item) => item.lesson)
      .filter((lesson): lesson is TableTypes<'lesson'> => !!lesson);
  }
}
