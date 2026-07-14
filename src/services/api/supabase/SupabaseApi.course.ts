import { v4 as uuidv4 } from 'uuid';
import {
  COURSES,
  DEFAULT_LOCALE_ID,
  DEFAULT_SUBJECT_IDS,
  LIVE_QUIZ,
  OTHER_CURRICULUM,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import { StudentLessonResult } from '../../../common/courseConstants';
import { AvatarObj } from '../../../components/animation/Avatar';
import logger from '../../../utility/logger';
import { Util } from '../../../utility/util';
import { ServiceConfig } from '../../ServiceConfig';
import { SupabaseApiSchool } from './SupabaseApi.school';

type ChapterLessonRow = {
  lesson: TableTypes<'lesson'> | null;
};

export interface SupabaseApiCourse {
  [key: string]: any;
}
export class SupabaseApiCourse extends SupabaseApiSchool {
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
    const gradeCourses = (await this.getCoursesByGrade(
      gradeDocId,
    )) as TableTypes<'course'>[];
    const curriculumCourses = gradeCourses.filter(
      (course: TableTypes<'course'>) => course.curriculum_id === boardDocId,
    );

    courseIds.push(...curriculumCourses);

    const subjectIds = curriculumCourses
      .map((course: TableTypes<'course'>) => course.subject_id)
      .filter((id: string | null | undefined): id is string => !!id);

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

  async getDifferentGradesForCourse(course: TableTypes<'course'>): Promise<{
    grades: TableTypes<'grade'>[];
    courses: TableTypes<'course'>[];
  }> {
    if (!this.supabase) return { grades: [], courses: [] };

    // Fetch all courses for the subject + curriculum
    const { data: courses, error: courseError } = await this.supabase
      .from('course')
      .select('*')
      .eq('subject_id', course.subject_id!)
      .eq('curriculum_id', course.curriculum_id!)
      .eq('is_deleted', false)
      .order('sort_index', { ascending: true });

    if (courseError || !courses) {
      logger.error('Error fetching courses:', courseError);
      return { grades: [], courses: [] };
    }

    // Extract unique grade_ids
    const gradeIds = [
      ...new Set(
        courses.map((c) => c.grade_id).filter((id): id is string => !!id),
      ),
    ];
    if (gradeIds.length === 0) {
      return { grades: [], courses }; // no grades to fetch
    }

    // Fetch grades by IDs
    const { data: grades, error: gradeError } = await this.supabase
      .from('grade')
      .select('*')
      .in('id', gradeIds)
      .eq('is_deleted', false)
      .order('sort_index', { ascending: true });

    if (gradeError || !grades) {
      logger.error('Error fetching grades:', gradeError);
      return { grades: [], courses };
    }

    const coursesByGradeId = new Map<string, TableTypes<'course'>[]>();
    for (const courseDoc of courses) {
      if (!courseDoc.grade_id) continue;
      const currentGradeCourses =
        coursesByGradeId.get(courseDoc.grade_id) ?? [];
      currentGradeCourses.push(courseDoc);
      coursesByGradeId.set(courseDoc.grade_id, currentGradeCourses);
    }

    if (course.grade_id) {
      const currentGradeCourses = coursesByGradeId.get(course.grade_id) ?? [];
      if (!currentGradeCourses.some((_course) => _course.id === course.id)) {
        currentGradeCourses.push(course);
        coursesByGradeId.set(course.grade_id, currentGradeCourses);
      }
    }

    const currentCourseCode = course.code?.toLowerCase() ?? '';
    const isMathCourse =
      currentCourseCode === COURSES.MATHS ||
      currentCourseCode.startsWith(`${COURSES.MATHS}-`);

    const pickCourseForGrade = (gradeId: string) => {
      const gradeCourses = coursesByGradeId.get(gradeId) ?? [];
      if (gradeCourses.length === 0) return undefined;

      if (course.grade_id === gradeId) {
        const selectedCourse = gradeCourses.find(
          (_course) => _course.id === course.id,
        );
        if (selectedCourse) return selectedCourse;
      }

      if (isMathCourse) {
        const matchingMathVariant = gradeCourses.find(
          (_course) => _course.code?.toLowerCase() === currentCourseCode,
        );
        if (matchingMathVariant) return matchingMathVariant;

        const regularMathCourse = gradeCourses.find(
          (_course) => _course.code?.toLowerCase() === COURSES.MATHS,
        );
        if (regularMathCourse) return regularMathCourse;
      }

      return gradeCourses[0];
    };

    return {
      grades,
      courses: grades
        .map((grade) => pickCourseForGrade(grade.id))
        .filter(
          (mappedCourse): mappedCourse is TableTypes<'course'> =>
            !!mappedCourse,
        ),
    };
  }
  getAvatarInfo(): Promise<AvatarObj | undefined> {
    throw new Error('Method not implemented.');
  }
  getLessonResultsForStudent(
    studentId: string,
  ): Promise<Map<string, StudentLessonResult> | undefined> {
    throw new Error('Method not implemented.');
  }
  async getLiveQuizLessons(
    classId: string,
    studentId: string,
  ): Promise<TableTypes<'assignment'>[]> {
    if (!this.supabase) return [];

    const now = new Date().toISOString();

    const { data, error } = await this.supabase
      .from('assignment')
      .select('*, assignment_user:assignment_user!inner(user_id), result(*)')
      .eq('class_id', classId)
      .eq('type', LIVE_QUIZ)
      .lte('starts_at', now)
      .gt('ends_at', now)
      .or(`is_class_wise.eq.true,assignment_user->user_id.eq.${studentId}`)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching live quiz lessons:', error);
      return [];
    }

    // Filter assignments with no result for this student
    const filtered = (data ?? []).filter(
      (assignment) =>
        !Array.isArray(assignment.result) ||
        !(assignment.result ?? []).some((r: any) => r.student_id === studentId),
    );

    return filtered;
  }
  async getLiveQuizRoomDoc(
    liveQuizRoomDocId: string,
  ): Promise<TableTypes<'live_quiz_room'>> {
    const res = await this.supabase
      ?.from('live_quiz_room')
      .select('*')
      .eq('id', liveQuizRoomDocId)
      .single();
    return res?.data as TableTypes<'live_quiz_room'>;
  }
  async updateFavoriteLesson(
    studentId: string,
    lessonId: string,
  ): Promise<TableTypes<'favorite_lesson'>> {
    if (!this.supabase) return {} as TableTypes<'favorite_lesson'>;

    const now = new Date().toISOString();

    const { data: existing, error } = await this.supabase
      .from('favorite_lesson')
      .select('*')
      .eq('user_id', studentId)
      .eq('lesson_id', lessonId)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) {
      logger.error('Favorite fetch error:', error);
      return {} as TableTypes<'favorite_lesson'>;
    }

    const favorite: TableTypes<'favorite_lesson'> = {
      id: existing?.id ?? uuidv4(),
      lesson_id: lessonId,
      user_id: studentId,
      created_at: existing?.created_at ?? now,
      updated_at: now,
      is_deleted: false,
      is_firebase: null,
    };

    const { error: upsertError } = await this.supabase
      .from('favorite_lesson')
      .upsert(favorite, { onConflict: 'id' });

    if (upsertError) {
      logger.error('Favorite upsert error:', upsertError);
      return {} as TableTypes<'favorite_lesson'>;
    }

    return favorite;
  }

  async getLidoCommonAudioUrl(
    languageId: string,
    localeId?: string | null,
  ): Promise<{ lido_common_audio_url: string | null } | null> {
    if (!this.supabase) return null;
    if (!localeId) {
      const countryCode = await this.getClientCountryCode();
      const locale = await this.getLocaleByIdOrCode(undefined, countryCode);
      localeId = locale?.id ?? null;
    }

    try {
      // ? Build OR conditions safely
      const orConditions: string[] = [];

      if (languageId && localeId) {
        orConditions.push(
          `and(language_id.eq.${languageId},locale_id.eq.${localeId})`,
        );
      }

      if (languageId) {
        orConditions.push(
          `and(language_id.eq.${languageId},locale_id.is.null)`,
        );
      }

      if (localeId) {
        orConditions.push(`and(language_id.is.null,locale_id.eq.${localeId})`);
      }

      // global fallback
      orConditions.push(`and(language_id.is.null,locale_id.is.null)`);

      const { data, error } = await this.supabase
        .from('language_locale')
        .select('lido_common_audio_url, language_id, locale_id')
        .eq('is_deleted', false)
        .or(orConditions.join(','));

      if (error) {
        logger.error('[Supabase] getLidoCommonAudioUrl error:', error);
        return null;
      }

      if (!data || data.length === 0) return null;

      // ? Priority sort (exact ? fallback)
      const priority = (r: any) => {
        if (r.language_id === languageId && r.locale_id === localeId) return 1;
        if (r.language_id === languageId && r.locale_id === null) return 2;
        if (r.language_id === null && r.locale_id === localeId) return 3;
        return 4;
      };

      data.sort((a, b) => priority(a) - priority(b));

      return {
        lido_common_audio_url: data[0].lido_common_audio_url ?? null,
      };
    } catch (err) {
      logger.error('[Supabase] getLidoCommonAudioUrl failed:', err);
      return null;
    }
  }
  // Inside class SupabaseApi

  /**
   * 1. Trigger Logic: Checks if the student has any data for this course.
   * If this returns empty, the Cold Start assessment starts.
   */
  async getSubjectLessonsBySubjectId(
    subjectId: string,
    student?: TableTypes<'user'>,
    courseId?: string,
  ): Promise<TableTypes<'subject_lesson'>> {
    if (!this.supabase || !student) return {} as TableTypes<'subject_lesson'>;

    const studentId = student.id;
    let langId = student.language_id ?? null;
    const localeId = student.locale_id ?? null;

    try {
      type ResultStatusRow = {
        lesson_id: string | null;
        status: string | null;
        created_at: string | null;
      };

      if (courseId) {
        const { data: courseRows, error: courseError } = await this.supabase
          .from('course')
          .select('code')
          .eq('id', courseId)
          .eq('is_deleted', false)
          .limit(1);

        if (courseError) {
          logger.error('Error fetching subject lesson course:', courseError);
        } else {
          const courseCode = courseRows?.[0]?.code?.trim().toLowerCase();
          const courseLanguageCode =
            courseCode === COURSES.MATHS
              ? COURSES.ENGLISH
              : courseCode?.includes('-')
                ? courseCode.split('-').pop()
                : courseCode;

          if (courseLanguageCode) {
            const { data: languageRows, error: languageError } =
              await this.supabase
                .from('language')
                .select('id')
                .ilike('code', courseLanguageCode)
                .eq('is_deleted', false)
                .limit(1);

            if (languageError) {
              logger.error(
                'Error fetching subject lesson language:',
                languageError,
              );
            } else if (languageRows?.[0]?.id) {
              langId = languageRows[0].id;
            }
          }
        }
      }

      /* ==========================================
       * 1?? Fetch all available set_numbers (+ language/locale for in-memory preference)
       * ========================================== */
      const { data: setRows, error: setError } = await this.supabase
        .from('subject_lesson')
        .select('set_number, language_id, locale_id, lesson_id')
        .eq('subject_id', subjectId)
        .eq('is_deleted', false)
        .not('set_number', 'is', null);

      if (setError) throw setError;
      if (!setRows?.length) return {} as TableTypes<'subject_lesson'>;

      const uniqueSets = Array.from(
        new Set(
          setRows
            .map((r) => r.set_number)
            .filter((n): n is number => n !== null),
        ),
      );

      if (!uniqueSets.length) return {} as TableTypes<'subject_lesson'>;

      const preferredSets = langId
        ? Array.from(
            new Set(
              (setRows ?? [])
                .filter((r) =>
                  localeId
                    ? r.language_id === langId &&
                      (r.locale_id === localeId || r.locale_id == null)
                    : r.language_id === langId,
                )
                .map((r) => r.set_number)
                .filter((n): n is number => n !== null),
            ),
          )
        : localeId
          ? Array.from(
              new Set(
                (setRows ?? [])
                  .filter(
                    (r) =>
                      r.language_id == null &&
                      (r.locale_id === localeId || r.locale_id == null),
                  )
                  .map((r) => r.set_number)
                  .filter((n): n is number => n !== null),
              ),
            )
          : [];

      const candidateSets = preferredSets.length ? preferredSets : uniqueSets;
      const randomIndex = Math.floor(Math.random() * candidateSets.length);
      const setNumber = candidateSets[randomIndex];
      const useStrictLanguageTrack =
        !!langId && preferredSets.includes(setNumber);
      const assessmentTrackRows = useStrictLanguageTrack
        ? (setRows ?? []).filter((row) =>
            localeId
              ? row.language_id === langId &&
                (row.locale_id === localeId || row.locale_id == null)
              : row.language_id === langId,
          )
        : (setRows ?? []).filter((row) =>
            localeId
              ? row.language_id == null &&
                (row.locale_id === localeId || row.locale_id == null)
              : row.language_id == null,
          );
      const assessmentLessonIds = Array.from(
        new Set(
          assessmentTrackRows
            .map((row) => row.lesson_id)
            .filter((lessonId): lessonId is string => !!lessonId),
        ),
      );

      if (!assessmentLessonIds.length) {
        return {} as TableTypes<'subject_lesson'>;
      }

      /* ==========================================
       * 2?? Abort Check (assignment_id IS NULL)
       * ========================================== */
      const abortQuery = this.supabase
        .from('result')
        .select('lesson_id, status, created_at')
        .eq('student_id', studentId)
        .eq('subject_id', subjectId)
        .is('assignment_id', null)
        .in('lesson_id', assessmentLessonIds)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(50);

      const { data, error } = await abortQuery;
      logger.info('Abort query result:', data);
      if (error) {
        logger.error('Abort query error:', error);
        return {} as TableTypes<'subject_lesson'>;
      }

      // Empty result set is expected for first-time.
      // Only block assessment if it was previously terminated or aborted.
      const resultRows = (data ?? []) as ResultStatusRow[];

      /* -----------------------------------------
        Keep latest result per unique lesson
      ------------------------------------------ */
      const uniqueMap = new Map<string, ResultStatusRow>();

      for (const row of resultRows as ResultStatusRow[]) {
        if (!row.lesson_id) continue;
        if (!uniqueMap.has(row.lesson_id)) {
          uniqueMap.set(row.lesson_id, row);
        }

        // Stop early when we get 2 unique lessons
        if (uniqueMap.size === 2) break;
      }

      const lastTwoUniqueLessons = Array.from(uniqueMap.values());

      /* -----------------------------------------
        Abort check
      ------------------------------------------ */
      const isAssessmentTerminated = resultRows.some(
        (r) => r.status === 'assessment_terminated',
      );
      const isAborted =
        lastTwoUniqueLessons.length === 2 &&
        lastTwoUniqueLessons.every((r) => r.status === 'system_exit');

      if (isAssessmentTerminated || isAborted) {
        logger.info('Assessment is terminated or aborted.');
        return {} as TableTypes<'subject_lesson'>; // ?? Aborted group
      }

      /* ==========================================
       * 3?? Fetch lessons from selected set
       * ========================================== */
      let lessonsQuery = this.supabase
        .from('subject_lesson')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('set_number', setNumber)
        .eq('is_deleted', false)
        .order('set_number', { ascending: true })
        .order('sort_index', { ascending: true });

      if (useStrictLanguageTrack && langId) {
        if (localeId) {
          lessonsQuery = lessonsQuery.or(
            `and(language_id.eq.${langId},locale_id.eq.${localeId}),and(language_id.eq.${langId},locale_id.is.null)`,
          );
        } else {
          lessonsQuery = lessonsQuery.eq('language_id', langId);
        }
      } else if (langId) {
        const orConditions: string[] = [];
        if (localeId) {
          orConditions.push(
            `and(language_id.eq.${langId},locale_id.eq.${localeId})`,
          );
        }
        orConditions.push(`and(language_id.eq.${langId},locale_id.is.null)`);
        if (localeId) {
          orConditions.push(
            `and(language_id.is.null,locale_id.eq.${localeId})`,
          );
        }
        orConditions.push(`and(language_id.is.null,locale_id.is.null)`);
        lessonsQuery = lessonsQuery.or(orConditions.join(','));
      } else if (localeId) {
        lessonsQuery = lessonsQuery.or(
          `and(language_id.is.null,locale_id.eq.${localeId}),and(language_id.is.null,locale_id.is.null)`,
        );
      } else {
        lessonsQuery = lessonsQuery
          .is('language_id', null)
          .is('locale_id', null);
      }

      const { data: lessons, error: lessonError } = await lessonsQuery;

      if (lessonError || !lessons?.length)
        return {} as TableTypes<'subject_lesson'>;

      const matchedLessons = lessons.filter(
        (lesson) => lesson.language_id === langId,
      );
      const fallbackLessons = lessons.filter(
        (lesson) => lesson.language_id == null,
      );
      let candidateLessons = useStrictLanguageTrack
        ? lessons
        : matchedLessons.length
          ? matchedLessons
          : fallbackLessons;

      if (useStrictLanguageTrack && localeId) {
        const localePriority = (lesson: TableTypes<'subject_lesson'>) => {
          if (lesson.language_id === langId && lesson.locale_id === localeId)
            return 1;
          if (lesson.language_id === langId && lesson.locale_id == null)
            return 2;
          return 3;
        };
        candidateLessons = [...candidateLessons].sort((a, b) => {
          if ((a.sort_index ?? 0) !== (b.sort_index ?? 0)) {
            return (a.sort_index ?? 0) - (b.sort_index ?? 0);
          }
          return localePriority(a) - localePriority(b);
        });
      }

      if (!candidateLessons.length) {
        return {} as TableTypes<'subject_lesson'>;
      }

      /* ==========================================
       * 4?? Remove completed lessons
       * (assignment_id IS NULL only)
       * ========================================== */
      const lessonIds = candidateLessons.map((lesson) => lesson.lesson_id);

      const resultsQuery = this.supabase
        .from('result')
        .select('lesson_id')
        .in('lesson_id', lessonIds)
        .eq('student_id', studentId)
        .eq('is_deleted', false);

      const { data: results } = await resultsQuery;

      const completedLessonIds = new Set(
        (results ?? []).map((r) => r.lesson_id),
      );

      const pendingLessons = candidateLessons.filter(
        (lesson) => !completedLessonIds.has(lesson.lesson_id),
      );

      return pendingLessons.length
        ? pendingLessons[0]
        : ({} as TableTypes<'subject_lesson'>);
    } catch (error) {
      logger.error(
        '? Error fetching subject lessons by subject (Supabase):',
        error,
      );
      return {} as TableTypes<'subject_lesson'>;
    }
  }
}
