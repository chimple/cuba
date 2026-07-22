import { COURSES, TableTypes } from '../../../common/constants';
import logger from '../../../utility/logger';
import { SupabaseApiCourseGradeOptions } from './SupabaseApi.course.gradeOptions';
export interface SupabaseApiCourseMedia {
  [key: string]: any;
}
export class SupabaseApiCourseMedia extends SupabaseApiCourseGradeOptions {
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
      // ✅ Build OR conditions safely
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

      // ✅ Priority sort (exact → fallback)
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
       * 1️⃣ Fetch all available set_numbers (+ language/locale for in-memory preference)
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
       * 2️⃣ Abort Check (assignment_id IS NULL)
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
        return {} as TableTypes<'subject_lesson'>; // 🚫 Aborted group
      }

      /* ==========================================
       * 3️⃣ Fetch lessons from selected set
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
       * 4️⃣ Remove completed lessons
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
        '❌ Error fetching subject lessons by subject (Supabase):',
        error,
      );
      return {} as TableTypes<'subject_lesson'>;
    }
  }
}
