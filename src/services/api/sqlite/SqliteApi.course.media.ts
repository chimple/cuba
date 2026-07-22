import { COURSES, TableTypes } from '../../../common/constants';
import logger from '../../../utility/logger';
import { DBSQLiteValues } from '@capacitor-community/sqlite';
import { SqliteApiCourseGradeOptions } from './SqliteApi.course.gradeOptions';

export class SqliteApiCourseMedia extends SqliteApiCourseGradeOptions {
  [key: string]: any;
  async getSubjectLessonsBySubjectId(
    subjectId: string,
    student?: TableTypes<'user'>,
    courseId?: string,
  ): Promise<TableTypes<'subject_lesson'>> {
    if (!student) return {} as TableTypes<'subject_lesson'>;
    const studentId = student.id;
    let langId = student.language_id ?? null;
    const localeId = student.locale_id ?? null;

    try {
      type CourseLanguageRow = {
        code?: string | null;
        id?: string | null;
      };
      type SubjectLessonSetRow = {
        set_number: number;
        language_id: string | null;
        locale_id: string | null;
        lesson_id: string | null;
      };
      type ResultStatusRow = {
        lesson_id: string | null;
        status: string | null;
      };
      type ResultLessonRow = { lesson_id: string | null };

      if (courseId) {
        try {
          const courseRes = await this.executeQuery(
            `
              SELECT code
              FROM course
              WHERE id = ?
                AND is_deleted = 0
              LIMIT 1;
            `,
            [courseId],
          );
          const courseCode = (
            ((courseRes as DBSQLiteValues | undefined)?.values?.[0] ??
              {}) as CourseLanguageRow
          ).code
            ?.trim()
            .toLowerCase();
          const courseLanguageCode =
            courseCode === COURSES.MATHS
              ? COURSES.ENGLISH
              : courseCode?.includes('-')
                ? courseCode.split('-').pop()
                : courseCode;

          if (courseLanguageCode) {
            const languageRes = await this.executeQuery(
              `
                SELECT id
                FROM language
                WHERE LOWER(code) = ?
                  AND is_deleted = 0
                LIMIT 1;
              `,
              [courseLanguageCode],
            );
            const courseLanguageId = (
              ((languageRes as DBSQLiteValues | undefined)?.values?.[0] ??
                {}) as CourseLanguageRow
            ).id;

            if (courseLanguageId) {
              langId = courseLanguageId;
            }
          }
        } catch (error) {
          logger.error(
            'Error resolving subject lesson course language:',
            error,
          );
        }
      }

      // 1️⃣ Fetch all available set_numbers (+ language/locale for in-memory preference)
      const setQuery = `
      SELECT DISTINCT set_number, language_id, locale_id, lesson_id
      FROM subject_lesson
      WHERE subject_id = ?
        AND is_deleted = 0
        AND set_number IS NOT NULL;
    `;
      const setRes = await this.executeQuery(setQuery, [subjectId]);
      const setRows = ((setRes as DBSQLiteValues | undefined)?.values ??
        []) as SubjectLessonSetRow[];

      if (!setRows.length) {
        return {} as TableTypes<'subject_lesson'>;
      }

      const uniqueSets = Array.from(new Set(setRows.map((r) => r.set_number)));
      if (!uniqueSets.length) {
        return {} as TableTypes<'subject_lesson'>;
      }

      // 2️⃣ Prefer sets that have student's language, fallback to all sets
      const preferredSets = langId
        ? Array.from(
            new Set(
              setRows
                .filter((r) =>
                  localeId
                    ? r.language_id === langId &&
                      (r.locale_id === localeId || r.locale_id == null)
                    : r.language_id === langId,
                )
                .map((r) => r.set_number),
            ),
          )
        : localeId
          ? Array.from(
              new Set(
                setRows
                  .filter(
                    (r) =>
                      r.language_id == null &&
                      (r.locale_id === localeId || r.locale_id == null),
                  )
                  .map((r) => r.set_number),
              ),
            )
          : [];

      const candidateSets = preferredSets.length ? preferredSets : uniqueSets;
      const randomIndex = Math.floor(Math.random() * candidateSets.length);
      const setNumber = candidateSets[randomIndex];
      const useStrictLanguageTrack =
        !!langId && preferredSets.includes(setNumber);
      const assessmentTrackRows = useStrictLanguageTrack
        ? setRows.filter((row: any) =>
            localeId
              ? row.language_id === langId &&
                (row.locale_id === localeId || row.locale_id == null)
              : row.language_id === langId,
          )
        : setRows.filter((row: any) =>
            localeId
              ? row.language_id == null &&
                (row.locale_id === localeId || row.locale_id == null)
              : row.language_id == null,
          );
      const assessmentLessonIds = Array.from(
        new Set(
          assessmentTrackRows
            .map((row: any) => row.lesson_id)
            .filter((lessonId): lessonId is string => !!lessonId),
        ),
      );

      if (!assessmentLessonIds.length) {
        return {} as TableTypes<'subject_lesson'>;
      }

      /* ==========================================
       * 3️⃣ Abort Check (with assignment_id IS NULL)
       * ========================================== */
      const abortLessonPlaceholders = assessmentLessonIds
        .map(() => '?')
        .join(', ');
      const abortQuery = `
        SELECT lesson_id, status
        FROM (
            SELECT lesson_id, status, created_at,
                  ROW_NUMBER() OVER (
                      PARTITION BY lesson_id
                      ORDER BY created_at DESC
                  ) as rn
            FROM result
            WHERE student_id = ?
              AND subject_id = ?
              AND assignment_id IS NULL
              AND lesson_id IN (${abortLessonPlaceholders})
              AND is_deleted = 0
        ) t
        WHERE rn = 1
        ORDER BY created_at DESC
        LIMIT 50;
      `;

      const abortParams: (string | null)[] = [
        studentId,
        subjectId,
        ...assessmentLessonIds,
      ];
      const abortRes = await this.executeQuery(abortQuery, abortParams);

      const uniqueAssessmentResults = ((abortRes as DBSQLiteValues | undefined)
        ?.values ?? []) as ResultStatusRow[];
      const lastTwo = uniqueAssessmentResults.slice(0, 2);

      const isAssessmentTerminated = uniqueAssessmentResults.some(
        (r) => r.status === 'assessment_terminated',
      );
      const isAborted =
        lastTwo.length === 2 &&
        lastTwo.every((r) => r.status === 'system_exit');

      if (isAssessmentTerminated || isAborted) {
        return {} as TableTypes<'subject_lesson'>; // Aborted group
      }

      /* ==========================================
       * 4️⃣ Fetch all candidate lessons from set
       * ========================================== */
      const lessonLanguageFilter = useStrictLanguageTrack
        ? localeId
          ? `(sl.language_id = ? AND (sl.locale_id = ? OR sl.locale_id IS NULL))`
          : `sl.language_id = ?`
        : langId
          ? localeId
            ? `(
              (sl.language_id = ? AND sl.locale_id = ?)
              OR (sl.language_id = ? AND sl.locale_id IS NULL)
              OR (sl.language_id IS NULL AND sl.locale_id = ?)
              OR (sl.language_id IS NULL AND sl.locale_id IS NULL)
            )`
            : `(sl.language_id = ? OR sl.language_id IS NULL)`
          : localeId
            ? `(
              (sl.language_id IS NULL AND sl.locale_id = ?)
              OR (sl.language_id IS NULL AND sl.locale_id IS NULL)
            )`
            : `(sl.language_id IS NULL AND sl.locale_id IS NULL)`;

      const lessonQuery = `
        SELECT sl.*
        FROM subject_lesson sl
        WHERE sl.subject_id = ?
          AND sl.set_number = ?
          AND sl.is_deleted = 0
          AND ${lessonLanguageFilter}

        ORDER BY
          sl.set_number ASC,
          sl.sort_index ASC;
      `;

      const lessonParams = [subjectId, setNumber];
      if (useStrictLanguageTrack && langId) {
        lessonParams.push(langId);
        if (localeId) lessonParams.push(localeId);
      } else if (langId) {
        lessonParams.push(langId);
        if (localeId) {
          lessonParams.push(localeId, langId, localeId);
        }
      } else if (localeId) {
        lessonParams.push(localeId);
      }
      const lessonRes = await this.executeQuery(lessonQuery, lessonParams);

      const allLessons = ((lessonRes as DBSQLiteValues | undefined)?.values ??
        []) as TableTypes<'subject_lesson'>[];
      const matchedLessons = allLessons.filter(
        (lesson: any) => lesson.language_id === langId,
      );
      const fallbackLessons = allLessons.filter(
        (lesson: any) => lesson.language_id == null,
      );
      let candidateLessons = useStrictLanguageTrack
        ? allLessons
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

      const lessonIds = candidateLessons.map((lesson: any) => lesson.lesson_id);
      const resultPlaceholders = lessonIds.map(() => '?').join(', ');
      const resultQuery = `
        SELECT DISTINCT lesson_id
        FROM result
        WHERE student_id = ?
          AND subject_id = ?
          AND is_deleted = 0
          AND lesson_id IN (${resultPlaceholders});
      `;
      const resultParams: (string | null)[] = [studentId, subjectId];
      resultParams.push(...lessonIds);
      const resultRes = await this.executeQuery(resultQuery, resultParams);
      const completedLessons = ((resultRes as DBSQLiteValues | undefined)
        ?.values ?? []) as ResultLessonRow[];
      const completedLessonIds = new Set(
        completedLessons
          .map((result: any) => result.lesson_id)
          .filter((lessonId): lessonId is string => !!lessonId),
      );
      const pendingLessons = candidateLessons.filter(
        (lesson: any) => !completedLessonIds.has(lesson.lesson_id),
      );

      return pendingLessons.length
        ? pendingLessons[0]
        : ({} as TableTypes<'subject_lesson'>);
    } catch (error) {
      logger.error(
        '❌ Error fetching subject lessons by subject (SQL):',
        error,
      );
      return {} as TableTypes<'subject_lesson'>;
    }
  }

  async getLidoCommonAudioUrl(
    languageId: string,
    localeId?: string | null,
  ): Promise<{ lido_common_audio_url: string | null } | null> {
    try {
      if (!localeId) {
        const countryCode = await this.getClientCountryCode();
        const locale = await this.getLocaleByIdOrCode(undefined, countryCode);
        localeId = locale?.id ?? null;
      }

      const data = await this.executeQuery(
        `
      SELECT lido_common_audio_url
      FROM language_locale
      WHERE is_deleted = false
        AND (
          (language_id = ? AND locale_id = ?)
          OR (language_id = ? AND locale_id IS NULL)
          OR (language_id IS NULL AND locale_id = ?)
          OR (language_id IS NULL AND locale_id IS NULL)
        )
      ORDER BY
        CASE
          WHEN language_id = ? AND locale_id = ? THEN 1
          WHEN language_id = ? AND locale_id IS NULL THEN 2
          WHEN language_id IS NULL AND locale_id = ? THEN 3
          ELSE 4
        END
      LIMIT 1;
      `,
        [
          languageId,
          localeId ?? null,
          languageId,
          localeId ?? null,
          languageId,
          localeId ?? null,
          languageId,
          localeId ?? null,
        ],
      );

      const rows = data?.values ?? [];

      return rows[0];
    } catch (err) {
      logger.error('[SQLite] getLidoCommonAudioUrl failed:', err);
      return null;
    }
  }
}
