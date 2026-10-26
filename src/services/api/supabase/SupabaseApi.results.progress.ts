import { TABLES, TableTypes } from '../../../common/constants';
import logger from '../../../utility/logger';
import { SupabaseApiResultsCourseSelection } from './SupabaseApi.results.courseSelection';

type StudentProgressRowWithLesson = TableTypes<'result'> & {
  lesson?: {
    name?: string;
    chapter_lesson?:
      | {
          chapter?: {
            id?: string;
            name?: string;
            course_id?: string;
          } | null;
        }[]
      | null;
  } | null;
};
export interface SupabaseApiResultsProgress {
  [key: string]: any;
}
export class SupabaseApiResultsProgress extends SupabaseApiResultsCourseSelection {
  async getStudentResult(
    studentId: string,
    fromCache?: boolean,
  ): Promise<TableTypes<'result'>[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from('result')
      .select('*')
      .eq('student_id', studentId)
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error fetching student results:', error);
      return [];
    }

    return data ?? [];
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
    if (!this.supabase) return {};

    // Use chapter_lesson to join lesson and chapter
    const { data, error } = await this.supabase
      .from('result')
      .select(
        `
      *,
      lesson (
        name,
        chapter_lesson:chapter_lesson!inner(
          chapter (
            id,
            name,
            course_id
          )
        )
      )
    `,
      )
      .eq('student_id', studentId)
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error fetching student progress:', error);
      return {};
    }

    const resultMap: Record<
      string,
      (TableTypes<'result'> & { lesson_name?: string; chapter_name?: string })[]
    > = {};

    if (!data) return resultMap;

    const progressRows = data as StudentProgressRowWithLesson[];
    if (progressRows.length > 0) {
      progressRows.forEach((result) => {
        const lesson = result.lesson;
        const chapter = lesson?.chapter_lesson?.find((chapterLesson) =>
          chapterLesson.chapter?.id
            ? chapterLesson.chapter.id === result.chapter_id ||
              chapterLesson.chapter.course_id === result.course_id
            : false,
        )?.chapter;
        const resultWithNames: TableTypes<'result'> & {
          lesson_name?: string;
          chapter_name?: string;
        } = {
          ...result,
          lesson_name: lesson?.name ?? '',
          chapter_name: chapter?.name ?? '',
        };
        const courseId = result.course_id;
        if (courseId && !resultMap[courseId]) {
          resultMap[courseId] = [];
        }
        if (courseId) {
          resultMap[courseId].push(resultWithNames);
        }
      });
    }
    return resultMap;
  }
  async getStudentResultInMap(
    studentId: string,
  ): Promise<{ [lessonDocId: string]: TableTypes<'result'> }> {
    if (!this.supabase) return {};

    const { data, error } = await this.supabase.rpc(
      'get_latest_results_by_student',
      { student_uuid: studentId },
    );

    if (error || !data) {
      logger.error('RPC failed:', error);
      return {};
    }

    const resultMap: { [lessonId: string]: TableTypes<'result'> } = {};
    for (const row of data) {
      if (row.lesson_id !== null && row.lesson_id !== undefined) {
        resultMap[row.lesson_id] = row;
      }
    }
    return resultMap;
  }
  async hasStudentResult(studentId: string): Promise<boolean> {
    if (!this.supabase) return false;

    try {
      const { classes } = await this.getStudentClassesAndSchools(studentId);
      const classId = this.currentClass?.id ?? classes[0]?.id;

      if (classes.length > 0) {
        if (!classId) {
          logger.warn(
            '[SupabaseApi] Unable to resolve class for linked student result check',
            { studentId },
          );
          return false;
        }

        const { data, error } = await this.supabase
          .from(TABLES.Result)
          .select('id')
          .eq('student_id', studentId)
          .eq('class_id', classId)
          .eq('is_deleted', false)
          .limit(1);

        if (error) {
          logger.error(
            'Error checking linked student result existence:',
            error,
          );
          return false;
        }

        return (data?.length ?? 0) > 0;
      }

      const { data, error } = await this.supabase
        .from(TABLES.Result)
        .select('id')
        .eq('student_id', studentId)
        .eq('is_deleted', false)
        .limit(1);

      if (error) {
        logger.error('Error checking student result existence:', error);
        return false;
      }

      return (data?.length ?? 0) > 0;
    } catch (error) {
      logger.error('Error checking student result', error);
      return true;
    }
  }
}
