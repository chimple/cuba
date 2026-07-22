import { COURSES, TABLES, TableTypes } from '../../../common/constants';
import logger from '../../../utility/logger';
import { DBSQLiteValues } from '@capacitor-community/sqlite';
import { SqliteApiAssignmentStudentProgress } from './SqliteApi.assignment.studentProgress';

export class SqliteApiAssignmentAssessments extends SqliteApiAssignmentStudentProgress {
  [key: string]: any;
  async getLatestAssessmentGroup(
    classId: string,
    student: TableTypes<'user'>,
    courseId?: string,
  ): Promise<TableTypes<'assignment'>[]> {
    await this.ensureInitialized();
    const nowIso = new Date().toISOString();
    const studentId = student.id;
    const langId = student.language_id;

    /* ==========================================
     * Get latest valid assessment batch
     * ========================================== */
    const latestBatchQuery = `
      SELECT a.batch_id
      FROM assignment a
      LEFT JOIN assignment_user au
        ON a.id = au.assignment_id
        AND au.is_deleted = false
      WHERE a.class_id = '${classId}'
        AND a.course_id = '${courseId}'
        AND a.type = 'assessment'
        AND a.is_deleted = false
        AND a.batch_id IS NOT NULL

        -- Active time window
        AND (
          a.starts_at IS NULL
          OR a.starts_at = ''
          OR datetime(a.starts_at) <= datetime('${nowIso}')
        )
        AND (
          a.ends_at IS NULL
          OR a.ends_at = ''
          OR datetime(a.ends_at) > datetime('${nowIso}')
        )

        -- Assigned to this student
        AND (
          a.is_class_wise = true
          OR au.user_id = '${studentId}'
        )

      ORDER BY a.created_at DESC
      LIMIT 1;
    `;

    const batchRes = await this._db?.query(latestBatchQuery);
    const latestBatchId = batchRes?.values?.[0]?.batch_id;

    if (!latestBatchId) return [];

    const latestBatchLessonQuery = `
      SELECT a.lesson_id
      FROM assignment a
      LEFT JOIN assignment_user au
        ON a.id = au.assignment_id
        AND au.is_deleted = 0
      WHERE a.class_id = ?
        AND a.course_id = ?
        AND a.type = 'assessment'
        AND a.is_deleted = 0
        AND a.batch_id = ?
        AND (
          a.starts_at IS NULL
          OR a.starts_at = ''
          OR datetime(a.starts_at) <= datetime(?)
        )
        AND (
          a.ends_at IS NULL
          OR a.ends_at = ''
          OR datetime(a.ends_at) > datetime(?)
        )
        AND (
          a.is_class_wise = 1
          OR au.user_id = ?
        );
    `;
    const latestBatchLessonRes = await this._db?.query(latestBatchLessonQuery, [
      classId,
      courseId,
      latestBatchId,
      nowIso,
      nowIso,
      studentId,
    ]);
    const latestBatchLessonIds = new Set(
      ((latestBatchLessonRes?.values ?? []) as { lesson_id?: string | null }[])
        .map((assignment: any) => assignment.lesson_id)
        .filter((lessonId): lessonId is string => !!lessonId),
    );

    const courseTerminationQuery = `
      SELECT r.lesson_id, r.status
      FROM result r
      INNER JOIN assignment a
        ON a.id = r.assignment_id
      WHERE r.student_id = ?
        AND r.status = 'assessment_terminated'
        AND r.is_deleted = 0
        AND a.class_id = ?
        AND a.course_id = ?
        AND a.type = 'assessment'
      LIMIT 1;
    `;

    const courseTerminationRes = await this._db?.query(courseTerminationQuery, [
      studentId,
      classId,
      courseId,
    ]);
    const courseTerminationRows = (courseTerminationRes?.values ?? []) as {
      lesson_id?: string | null;
    }[];
    const isLatestBatchReassignment = courseTerminationRows.some(
      (result: any) =>
        !!result.lesson_id && latestBatchLessonIds.has(result.lesson_id),
    );
    if (courseTerminationRows.length && !isLatestBatchReassignment) {
      return [];
    }

    /* ==========================================
     * Check if batch is closed by termination or abort
     * ========================================== */
    const abortCheckQuery = `
    SELECT assignment_id, status
    FROM (
        SELECT r.assignment_id,
              r.status,
              r.created_at,
              ROW_NUMBER() OVER (
                  PARTITION BY r.assignment_id
                  ORDER BY r.created_at DESC
              ) as rn
        FROM result r
        INNER JOIN assignment a
            ON a.id = r.assignment_id
        WHERE r.student_id = '${studentId}'
          AND r.is_deleted = false
          AND a.batch_id = '${latestBatchId}'
          AND a.course_id = '${courseId}'
          AND a.type = 'assessment'
    ) t
    WHERE rn = 1
    ORDER BY created_at DESC
    LIMIT 50;
    `;

    const abortRes = await this._db?.query(abortCheckQuery);
    type AssignmentAbortResultRow = {
      assignment_id?: string | null;
      status?: string | null;
    };
    const uniqueAssignmentResults = (abortRes?.values ??
      []) as AssignmentAbortResultRow[];
    const lastTwoResults = uniqueAssignmentResults.slice(0, 2);

    const isAssessmentTerminated = uniqueAssignmentResults.some(
      (result: any) => result.status === 'assessment_terminated',
    );
    const isAborted =
      isAssessmentTerminated ||
      (lastTwoResults.length === 2 &&
        lastTwoResults.every((r) => r.status === 'system_exit'));

    if (isAborted) {
      // 🚫 Assessment group is aborted
      return [];
    }

    /* ==========================================
     * Get only INCOMPLETE assignments
     * from that latest batch
     * ========================================== */
    const assignmentsQuery = `
      SELECT a.*
      FROM assignment a

      LEFT JOIN assignment_user au
        ON a.id = au.assignment_id
        AND au.is_deleted = false

      LEFT JOIN result r
        ON r.assignment_id = a.id
        AND r.student_id = '${studentId}'
        AND r.is_deleted = false

      WHERE a.class_id = '${classId}'
        AND a.course_id = '${courseId}'
        AND a.type = 'assessment'
        AND a.is_deleted = false
        AND a.batch_id = '${latestBatchId}'

        -- time window
        AND (
          a.starts_at IS NULL
          OR a.starts_at = ''
          OR datetime(a.starts_at) <= datetime('${nowIso}')
        )
        AND (
          a.ends_at IS NULL
          OR a.ends_at = ''
          OR datetime(a.ends_at) > datetime('${nowIso}')
        )

        -- Assigned to this student
        AND (
          a.is_class_wise = true
          OR au.user_id = '${studentId}'
        )

        -- NOT completed
        AND r.assignment_id IS NULL

        -- subject_lesson validation (LANGUAGE ONLY)
        AND EXISTS (
          SELECT 1
          FROM subject_lesson sl
          WHERE sl.lesson_id = a.lesson_id
            AND sl.set_number = a.set_number
            AND sl.is_deleted = false
            AND (
              sl.language_id IS NULL
              OR sl.language_id = '${langId}'
            )
        )

      ORDER BY (
        SELECT sl.sort_index
        FROM subject_lesson sl
        WHERE sl.lesson_id = a.lesson_id
          AND sl.set_number = a.set_number
          AND sl.is_deleted = false
        LIMIT 1
      ) ASC,
      a.created_at DESC;
    `;

    const res = await this._db?.query(assignmentsQuery);
    const pendingAssignments = (res?.values ??
      []) as TableTypes<'assignment'>[];

    return pendingAssignments.length ? pendingAssignments : [];
  }

  async getAssignmentInfoForLessonsPerClass(
    classId: string,
    lessonIds: string[],
  ): Promise<string[]> {
    await this.ensureInitialized();
    if (!lessonIds?.length) return [];

    const placeholders = lessonIds.map(() => '?').join(', ');

    const query = `
    SELECT DISTINCT lesson_id
    FROM ${TABLES.Assignment}
    WHERE class_id = ?
      AND lesson_id IN (${placeholders})
      AND is_deleted = 0;
  `;

    const res = await this._db?.query(query, [classId, ...lessonIds]);

    if (!res?.values?.length) return [];

    return res.values
      .map((row: any) => row.lesson_id as string | undefined)
      .filter((id: string | undefined): id is string => Boolean(id));
  }

  async isAssignmentAlreadyAssigned(
    schoolId: string,
    classId: string,
    courseId: string,
    chapterId: string,
    lessonId: string,
  ): Promise<boolean> {
    await this.ensureInitialized();
    try {
      const res = await this._db?.query(
        `
      SELECT id
      FROM ${TABLES.Assignment}
      WHERE school_id = ?
        AND class_id = ?
        AND course_id = ?
        AND chapter_id = ?
        AND lesson_id = ?
        AND is_deleted = 0
      LIMIT 1
      `,
        [schoolId, classId, courseId, chapterId, lessonId],
      );

      return !!(res?.values && res.values.length > 0);
    } catch (error) {
      logger.error('Error checking existing assignment:', error);
      return false;
    }
  }

  async hasPendingAbortedAssessment(
    studentId: string,
    courseId: string,
  ): Promise<boolean> {
    await this.ensureInitialized();

    try {
      const course = await this.getCourse(courseId);
      const subjectId = course?.subject_id;
      if (!subjectId) {
        return false;
      }
      let langId: string | null = null;
      const courseCode = course.code?.trim().toLowerCase();
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
        langId =
          (((languageRes as DBSQLiteValues | undefined)?.values ?? [])[0]
            ?.id as string | undefined) ?? null;
      }

      const assessmentLessonsRes = await this.executeQuery(
        `
          SELECT lesson_id, language_id
          FROM subject_lesson
          WHERE subject_id = ?
            AND COALESCE(is_deleted, 0) = 0
        `,
        [subjectId],
      );

      const assessmentLessonRows =
        (assessmentLessonsRes as DBSQLiteValues | undefined)?.values ?? [];
      const languageTrackLessons =
        langId &&
        assessmentLessonRows.some(
          (lesson: any) => lesson.language_id === langId,
        )
          ? assessmentLessonRows.filter(
              (lesson: any) => lesson.language_id === langId,
            )
          : assessmentLessonRows.filter(
              (lesson: any) => lesson.language_id == null,
            );
      const assessmentLessonIds: string[] = [];
      const placeholderParts: string[] = [];
      for (const row of languageTrackLessons) {
        const lessonId = row.lesson_id;
        if (!lessonId) continue;
        assessmentLessonIds.push(lessonId);
        placeholderParts.push('?');
      }

      if (!assessmentLessonIds.length) {
        return false;
      }

      const placeholders = placeholderParts.join(', ');
      const pendingAbortRes = await this.executeQuery(
        `
          SELECT status
          FROM result
          WHERE student_id = ?
            AND assignment_id IS NULL
            AND COALESCE(is_deleted, 0) = 0
            AND lesson_id IN (${placeholders})
          ORDER BY created_at DESC
          LIMIT 1
        `,
        [studentId, ...assessmentLessonIds],
      );

      const latestStatus = ((pendingAbortRes as DBSQLiteValues | undefined)
        ?.values ?? [])[0]?.status;

      return latestStatus === 'system_exit';
    } catch (error) {
      logger.error('❌ Error checking pending aborted assessment:', error);
      return false;
    }
  }
}
