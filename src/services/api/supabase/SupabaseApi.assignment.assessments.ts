import { COURSES, TABLES, TableTypes } from '../../../common/constants';
import logger from '../../../utility/logger';
import { SupabaseApiAssignmentStudentProgress } from './SupabaseApi.assignment.studentProgress';

type AssessmentAssignmentUserLink = Pick<
  TableTypes<'assignment_user'>,
  'user_id' | 'is_deleted'
>;

type AssessmentBatchRow = Pick<
  TableTypes<'assignment'>,
  'batch_id' | 'created_at' | 'is_class_wise'
> & {
  assignment_user?: AssessmentAssignmentUserLink[] | null;
};

type AssessmentAssignmentRow = TableTypes<'assignment'> & {
  assignment_user?: AssessmentAssignmentUserLink[] | null;
};

type AssessmentBatchLessonRow = Pick<
  TableTypes<'assignment'>,
  'lesson_id' | 'is_class_wise'
> & {
  assignment_user?: AssessmentAssignmentUserLink[] | null;
};

type AssessmentResultRow = Pick<
  TableTypes<'result'>,
  'assignment_id' | 'status' | 'created_at'
>;
export interface SupabaseApiAssignmentAssessments {
  [key: string]: any;
}
export class SupabaseApiAssignmentAssessments extends SupabaseApiAssignmentStudentProgress {
  async hasPendingAbortedAssessment(
    studentId: string,
    courseId: string,
  ): Promise<boolean> {
    try {
      if (!this.supabase) return false;

      const course = await this.getCourse(courseId);
      if (!course?.subject_id) {
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
        const { data: languageRows, error: languageError } = await this.supabase
          .from('language')
          .select('id')
          .ilike('code', courseLanguageCode)
          .eq('is_deleted', false)
          .limit(1);

        if (languageError) {
          logger.error(
            'Error fetching pending abort assessment language:',
            languageError,
          );
        } else {
          langId = languageRows?.[0]?.id ?? null;
        }
      }

      const { data: assessmentLessons, error: assessmentLessonsError } =
        await this.supabase
          .from('subject_lesson')
          .select('lesson_id, language_id')
          .eq('subject_id', course.subject_id)
          .or('is_deleted.eq.false,is_deleted.is.null');

      if (assessmentLessonsError) {
        logger.error(
          '❌ Error fetching assessment lessons for pending abort check:',
          assessmentLessonsError,
        );
        return false;
      }

      const languageTrackLessons =
        langId &&
        (assessmentLessons ?? []).some(
          (lesson) => lesson.language_id === langId,
        )
          ? (assessmentLessons ?? []).filter(
              (lesson) => lesson.language_id === langId,
            )
          : (assessmentLessons ?? []).filter(
              (lesson) => lesson.language_id == null,
            );

      const seenLessonIds = new Set<string>();
      const assessmentLessonIds: string[] = [];
      for (const lesson of languageTrackLessons) {
        const lessonId = lesson.lesson_id;
        if (!lessonId || seenLessonIds.has(lessonId)) continue;
        seenLessonIds.add(lessonId);
        assessmentLessonIds.push(lessonId);
      }

      if (!assessmentLessonIds.length) {
        return false;
      }

      const { data: pendingAbortResults, error } = await this.supabase
        .from('result')
        .select('status')
        .eq('student_id', studentId)
        .is('assignment_id', null)
        .in('lesson_id', assessmentLessonIds)
        .or('is_deleted.eq.false,is_deleted.is.null')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        logger.error('❌ Error checking pending aborted assessment:', error);
        return false;
      }

      return pendingAbortResults?.[0]?.status === 'system_exit';
    } catch (error) {
      logger.error('❌ Error checking pending aborted assessment:', error);
      return false;
    }
  }
  async getLatestAssessmentGroup(
    classId: string,
    student: TableTypes<'user'>,
    courseId?: string,
  ): Promise<TableTypes<'assignment'>[]> {
    if (!this.supabase) return [];

    const nowIso = new Date().toISOString();
    const studentId = student.id;
    const langId = student.language_id;

    courseId = courseId ?? '';

    const isAssignedToStudent = (
      assignment:
        | AssessmentBatchRow
        | AssessmentAssignmentRow
        | AssessmentBatchLessonRow,
    ) =>
      assignment.is_class_wise === true ||
      (assignment.assignment_user ?? []).some(
        (assignmentUser) =>
          assignmentUser.user_id === studentId &&
          assignmentUser.is_deleted !== true,
      );

    /* ==========================================
     * STEP 1️⃣  Get latest valid batch for course
     * ========================================== */
    const { data: latestBatchData, error: batchError } = await this.supabase
      .from(TABLES.Assignment)
      .select(
        `
        batch_id,
        created_at,
        is_class_wise,
        assignment_user:assignment_user!left(user_id, is_deleted)
      `,
      )
      .eq('class_id', classId)
      .eq('course_id', courseId)
      .eq('type', 'assessment')
      .eq('is_deleted', false)
      .not('batch_id', 'is', null)
      .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
      .or(`ends_at.is.null,ends_at.gt.${nowIso}`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (batchError || !latestBatchData?.length) return [];

    const latestAssignedBatch = (
      latestBatchData as unknown as AssessmentBatchRow[]
    ).find((assignment) => isAssignedToStudent(assignment));
    const latestBatchId = latestAssignedBatch?.batch_id;
    if (!latestBatchId) return [];

    const { data: latestBatchLessons, error: latestBatchLessonsError } =
      await this.supabase
        .from(TABLES.Assignment)
        .select(
          `
          lesson_id,
          is_class_wise,
          assignment_user:assignment_user!left(user_id, is_deleted)
        `,
        )
        .eq('class_id', classId)
        .eq('course_id', courseId)
        .eq('type', 'assessment')
        .eq('is_deleted', false)
        .eq('batch_id', latestBatchId)
        .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
        .or(`ends_at.is.null,ends_at.gt.${nowIso}`);

    if (latestBatchLessonsError) {
      logger.error(
        'Latest assessment batch lesson query error:',
        latestBatchLessonsError,
      );
      return [];
    }

    const latestBatchLessonIds = new Set(
      ((latestBatchLessons ?? []) as unknown as AssessmentBatchLessonRow[])
        .filter((assignment) => isAssignedToStudent(assignment))
        .map((assignment) => assignment.lesson_id)
        .filter((lessonId): lessonId is string => !!lessonId),
    );

    const { data: courseTerminationResults, error: courseTerminationError } =
      await this.supabase
        .from(TABLES.Result)
        .select(
          `
          lesson_id,
          status,
          assignment!inner(class_id, course_id, type)
        `,
        )
        .eq('student_id', studentId)
        .eq('status', 'assessment_terminated')
        .eq('is_deleted', false)
        .eq('assignment.class_id', classId)
        .eq('assignment.course_id', courseId)
        .eq('assignment.type', 'assessment')
        .limit(1);

    if (courseTerminationError) {
      logger.error(
        'Course assessment termination query error:',
        courseTerminationError,
      );
      return [];
    }

    const isLatestBatchReassignment = (courseTerminationResults ?? []).some(
      (result) => {
        const lessonId = result.lesson_id;
        return !!lessonId && latestBatchLessonIds.has(lessonId);
      },
    );

    if (courseTerminationResults?.length && !isLatestBatchReassignment) {
      return [];
    }

    /* ==========================================
     * STEP 2️⃣  Abort check
     * ========================================== */
    const { data, error: abortError } = await this.supabase
      .from(TABLES.Result)
      .select(
        `
        assignment_id,
        status,
        created_at,
        assignment!inner(batch_id, course_id, type)
      `,
      )
      .eq('student_id', studentId)
      .eq('is_deleted', false)
      .eq('assignment.batch_id', latestBatchId)
      .eq('assignment.course_id', courseId)
      .eq('assignment.type', 'assessment')
      .order('created_at', { ascending: false })
      .limit(50);

    if (abortError) {
      logger.error('Abort query error:', abortError);
      return [];
    }

    /* -----------------------------------------
      Keep latest result per unique assignment
    ------------------------------------------ */
    const uniqueMap = new Map<string, AssessmentResultRow>();

    for (const row of (data ?? []) as AssessmentResultRow[]) {
      if (!row.assignment_id) continue;

      if (!uniqueMap.has(row.assignment_id)) {
        uniqueMap.set(row.assignment_id, row);
      }
    }

    const uniqueAssignments = Array.from(uniqueMap.values());
    const lastTwoUniqueAssignments = uniqueAssignments.slice(0, 2);

    /* -----------------------------------------
      Abort check
    ------------------------------------------ */
    const isAssessmentTerminated = uniqueAssignments.some(
      (r) => r.status === 'assessment_terminated',
    );
    const isAborted =
      isAssessmentTerminated ||
      (lastTwoUniqueAssignments.length === 2 &&
        lastTwoUniqueAssignments.every((r) => r.status === 'system_exit'));

    if (isAborted) {
      return [];
    }

    /* ==========================================
     * STEP 3️⃣  Get incomplete assignments
     * ========================================== */
    const { data: assignments, error: lessonError } = await this.supabase
      .from(TABLES.Assignment)
      .select(
        `
        *,
        assignment_user:assignment_user!left(user_id, is_deleted)
      `,
      )
      .eq('class_id', classId)
      .eq('course_id', courseId)
      .eq('type', 'assessment')
      .eq('is_deleted', false)
      .eq('batch_id', latestBatchId)
      .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
      .or(`ends_at.is.null,ends_at.gt.${nowIso}`);

    if (lessonError || !assignments?.length) return [];

    const assignedAssessments = (
      assignments as unknown as AssessmentAssignmentRow[]
    ).filter((assignment) => isAssignedToStudent(assignment));

    if (!assignedAssessments.length) return [];

    const assignmentIds = assignedAssessments.map((a) => a.id);
    const { data: assignmentResults } = await this.supabase
      .from(TABLES.Result)
      .select('assignment_id')
      .in('assignment_id', assignmentIds)
      .eq('student_id', studentId)
      .eq('is_deleted', false);

    const completedAssignmentIds = new Set(
      (assignmentResults ?? []).map((r) => r.assignment_id),
    );

    const incompleteAssignments = assignedAssessments.filter(
      (a) => !completedAssignmentIds.has(a.id),
    );

    if (!incompleteAssignments.length) return [];

    /* ==========================================
     * STEP 4️⃣  subject_lesson validation
     * (lesson_id + set_number + language)
     * ========================================== */
    const lessonIds = incompleteAssignments.map((a) => a.lesson_id);

    const { data: subjectLessons } = await this.supabase
      .from(TABLES.SubjectLesson)
      .select('lesson_id, set_number, language_id, sort_index')
      .in('lesson_id', lessonIds)
      .eq('is_deleted', false);

    if (!subjectLessons?.length) return [];

    const validAssignments = incompleteAssignments.filter((a) =>
      subjectLessons.some(
        (sl) =>
          sl.lesson_id === a.lesson_id &&
          sl.set_number === a.set_number &&
          (!sl.language_id || sl.language_id === langId),
      ),
    );

    if (!validAssignments.length) return [];

    /* ==========================================
     * STEP 5️⃣  Sort by subject_lesson.sort_index
     * ========================================== */
    validAssignments.sort((a, b) => {
      const slA = subjectLessons.find(
        (sl) => sl.lesson_id === a.lesson_id && sl.set_number === a.set_number,
      );
      const slB = subjectLessons.find(
        (sl) => sl.lesson_id === b.lesson_id && sl.set_number === b.set_number,
      );

      return (slA?.sort_index ?? 0) - (slB?.sort_index ?? 0);
    });

    return validAssignments as TableTypes<'assignment'>[];
  }
  async getAssignmentInfoForLessonsPerClass(
    classId: string,
    lessonIds: string[],
  ): Promise<string[]> {
    if (!this.supabase) return [];

    try {
      if (!lessonIds?.length) return [];

      const { data, error } = await this.supabase
        .from(TABLES.Assignment)
        .select('lesson_id')
        .eq('class_id', classId)
        .eq('is_deleted', false)
        .in('lesson_id', lessonIds);

      if (error) {
        logger.error(
          'Supabase error in getAssignmentInfoForLessonsPerClass:',
          error,
        );
        return [];
      }

      return Array.from(
        new Set((data ?? []).map((row: any) => row.lesson_id).filter(Boolean)),
      ) as string[];
    } catch (err) {
      logger.error('Error in getAssignmentInfoForLessonsPerClass:', err);
      return [];
    }
  }
  async isAssignmentAlreadyAssigned(
    schoolId: string,
    classId: string,
    courseId: string,
    chapterId: string,
    lessonId: string,
  ): Promise<boolean> {
    if (!this.supabase) return false;

    const { data, error } = await this.supabase
      .from(TABLES.Assignment)
      .select('id')
      .eq('school_id', schoolId)
      .eq('class_id', classId)
      .eq('course_id', courseId)
      .eq('chapter_id', chapterId)
      .eq('lesson_id', lessonId)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) {
      logger.error('Error checking existing assignment:', error);
      return false;
    }

    return !!data;
  }
}
