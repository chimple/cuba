import { TABLES, TableTypes } from '../../../common/constants';
import Course from '../../../models/Course';
import Lesson from '../../../models/Lesson';
import logger from '../../../utility/logger';
import { SupabaseApiUserLeaderboards } from './SupabaseApi.user.leaderboards';

export interface SupabaseApiAssignmentCourseLookups {
  [key: string]: any;
}
export class SupabaseApiAssignmentCourseLookups extends SupabaseApiUserLeaderboards {
  async getAllLessonsForCourse(
    courseId: string,
  ): Promise<TableTypes<'lesson'>[]> {
    if (!this.supabase) return [];

    // 1. Get all chapters for the course
    const { data: chapters, error: chapterError } = await this.supabase
      .from(TABLES.Chapter)
      .select('id')
      .eq('course_id', courseId)
      .eq('is_deleted', false);

    if (chapterError || !chapters || chapters.length === 0) return [];

    const chapterIds = chapters.map((c) => c.id);

    // 2. Get all chapter_lesson entries for these chapters
    const { data: chapterLessons, error: clError } = await this.supabase
      .from(TABLES.ChapterLesson)
      .select('lesson_id')
      .in('chapter_id', chapterIds)
      .eq('is_deleted', false);

    if (clError || !chapterLessons || chapterLessons.length === 0) return [];

    const lessonIds = chapterLessons.map((cl) => cl.lesson_id);

    // 3. Get all lessons by these IDs
    const { data: lessons, error: lessonError } = await this.supabase
      .from(TABLES.Lesson)
      .select('*')
      .in('id', lessonIds)
      .eq('is_deleted', false);

    if (lessonError) return [];

    return lessons ?? [];
  }
  getLessonFromCourse(
    course: Course,
    lessonId: string,
  ): Promise<Lesson | undefined> {
    throw new Error('Method not implemented.');
  }
  async getLessonFromChapter(
    chapterId: string,
    lessonId: string,
  ): Promise<{
    lesson: TableTypes<'lesson'>[];
    course: TableTypes<'course'>[];
  }> {
    if (!this.supabase) {
      return { lesson: [], course: [] };
    }

    const { data, error } = await this.supabase
      .from('chapter_lesson')
      .select(
        `
      lesson(*),
      chapter:chapter_id (
        course:course_id (*)
      )
    `,
      )
      .eq('chapter_id', chapterId)
      .eq('lesson_id', lessonId)
      .eq('is_deleted', false)
      .eq('chapter.is_deleted', false)
      .eq('lesson.is_deleted', false);

    if (error) {
      logger.error('Error fetching lesson from chapter:', error);
      return { lesson: [], course: [] };
    }

    if (!data || data.length === 0) {
      return { lesson: [], course: [] };
    }

    // Flatten lesson in case it's an array or null
    const lessonData = data
      .flatMap((item) =>
        Array.isArray(item.lesson) ? item.lesson : [item.lesson],
      )
      .filter((lesson): lesson is TableTypes<'lesson'> => !!lesson);

    const courseData = data
      .flatMap((item) => item.chapter ?? [])
      .flatMap((chapter) => chapter.course ?? [])
      .filter((course): course is TableTypes<'course'> => !!course);

    return {
      lesson: lessonData,
      course: courseData,
    };
  }
  async getCoursesByGrade(gradeDocId: any): Promise<TableTypes<'course'>[]> {
    if (!this.supabase) return [];
    try {
      const gradeCoursesRes = await this.supabase
        .from(TABLES.Course)
        .select('*')
        .eq('grade_id', gradeDocId)
        .eq('is_deleted', false);

      const puzzleCoursesRes = await this.supabase
        .from(TABLES.Course)
        .select('*')
        .eq('name', 'Digital Skills')
        .eq('is_deleted', false);

      const gradeCourses = gradeCoursesRes.data ?? [];
      const puzzleCourses = puzzleCoursesRes.data ?? [];

      return [...gradeCourses, ...puzzleCourses];
    } catch (error) {
      logger.error('Error fetching courses by grade:', error);
      return [];
    }
  }
  async getAllCourses(): Promise<TableTypes<'course'>[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from('course')
      .select('*')
      .eq('is_deleted', false)
      .order('sort_index', { ascending: true });

    if (error) {
      logger.error('Error fetching all courses:', error);
      return [];
    }

    return data ?? [];
  }
  deleteAllUserData(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  async getCoursesFromLesson(
    lessonId: string,
  ): Promise<TableTypes<'course'>[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from('chapter_lesson')
      .select(
        `
      chapter:chapter_id (
        course:course_id (*)
      )
    `,
      )
      .eq('lesson_id', lessonId)
      .eq('is_deleted', false)
      .eq('chapter.is_deleted', false);

    if (error) {
      logger.error('Error fetching courses from lesson:', error);
      return [];
    }

    // Flatten to get all courses from chapters (each chapter.course is an array)
    const courses = data
      .flatMap((item) => item.chapter ?? [])
      .flatMap((chapter) => chapter.course ?? [])
      .filter((course): course is TableTypes<'course'> => !!course);

    return courses;
  }
  async assignmentUserListner(
    studentId: string,
    onDataChange: (
      assignment_user: TableTypes<'assignment_user'> | undefined,
    ) => void,
  ) {
    try {
      if (this._assignmentUserRealTime) {
        this._assignmentUserRealTime.unsubscribe();
        this._assignmentUserRealTime = undefined;
      }

      this._assignmentUserRealTime = this.supabase?.channel('assignment_user');
      if (!this._assignmentUserRealTime) {
        throw new Error('Failed to establish channel for assignment_user');
      }

      this._assignmentUserRealTime
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'assignment_user',
            filter: `user_id=eq.${studentId}`,
          },
          (payload) => {
            if (onDataChange) {
              onDataChange(payload.new as TableTypes<'assignment_user'>);
            } else {
              logger.error('🛑 onDataChange is undefined for assignment_user!');
            }
          },
        )
        .subscribe();
    } catch (error) {
      logger.error('🛑 Error in Supabase assignment_user listener:', error);
    }
  }

  async assignmentListner(
    classId: string,
    onDataChange: (assignment: TableTypes<'assignment'> | undefined) => void,
  ) {
    try {
      if (this._assignmetRealTime) {
        this._assignmetRealTime.unsubscribe();
        this._assignmetRealTime = undefined;
      }

      this._assignmetRealTime = this.supabase?.channel('assignment');
      if (!this._assignmetRealTime) {
        throw new Error('Failed to establish channel for assignment');
      }
      this._assignmetRealTime
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'assignment',
            filter: `class_id=eq.${classId}`,
          },
          (payload) => {
            if (onDataChange) {
              onDataChange(payload.new as TableTypes<'assignment'>);
            } else {
              logger.error('🛑 onDataChange is undefined!');
            }
          },
        )
        .subscribe();
    } catch (error) {
      logger.error('🛑 Error in Supabase listener:', error);
    }
  }
  async removeAssignmentChannel() {
    try {
      if (this._assignmentUserRealTime)
        this.supabase?.removeChannel(this._assignmentUserRealTime);
      this._assignmentUserRealTime = undefined;
      if (this._assignmetRealTime)
        this.supabase?.removeChannel(this._assignmetRealTime);
      this._assignmetRealTime = undefined;
    } catch (error) {
      throw error;
    }
  }
  async liveQuizListener(
    liveQuizRoomDocId: string,
    onDataChange: (roomDoc: TableTypes<'live_quiz_room'> | undefined) => void,
  ) {
    try {
      const roomDoc = await this.getLiveQuizRoomDoc(liveQuizRoomDocId);
      onDataChange(roomDoc);

      this._liveQuizRealTime = this.supabase?.channel('live_quiz_room');

      if (!this._liveQuizRealTime) {
        throw new Error('Failed to establish channel for live quiz room');
      }

      const res = this._liveQuizRealTime
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'live_quiz_room',
            filter: `id=eq.${liveQuizRoomDocId}`,
          },
          (payload) => {
            onDataChange(payload.new as TableTypes<'live_quiz_room'>);
          },
        )
        .subscribe();
      return;
    } catch (error) {
      logger.error('Error setting up live quiz room listener:', error);
      throw error;
    }
  }
  async removeLiveQuizChannel() {
    try {
      if (this._liveQuizRealTime)
        this.supabase?.removeChannel(this._liveQuizRealTime);
    } catch (error) {
      throw error;
    }
  }
  async updateLiveQuiz(
    roomDocId: string,
    studentId: string,
    questionId: string,
    timeSpent: number,
    score: number,
  ): Promise<void> {
    try {
      await this.supabase?.rpc('update_live_quiz', {
        room_id: roomDocId,
        student_id: studentId,
        question_id: questionId,
        time_spent: timeSpent,
        score: score,
      });
    } catch (error) {
      logger.error('Error updating quiz result:', error);
      throw error;
    }
  }

  async joinLiveQuiz(
    assignmentId: string,
    studentId: string,
  ): Promise<string | undefined> {
    let liveQuizId = await this?.supabase?.rpc('join_live_quiz', {
      _assignment_id: assignmentId,
      _student_id: studentId,
    });

    if (liveQuizId == null || liveQuizId.error || !liveQuizId.data) {
      throw liveQuizId?.error ?? '';
    }
    const data = liveQuizId.data;
    return data;
  }
  async getStudentResultsByAssignmentId(assignmentId: string): Promise<
    {
      result_data: TableTypes<'result'>[];
      user_data: TableTypes<'user'>[];
    }[]
  > {
    try {
      const results = await this?.supabase?.rpc('get_results_by_assignment', {
        _assignment_id: assignmentId,
      });
      if (results == null || results.error || !results.data) {
        throw results?.error ?? '';
      }
      const data = results.data;
      return data;
    } catch (error) {
      throw error;
    }
  }
  async getAssignmentById(
    id: string,
  ): Promise<TableTypes<'assignment'> | undefined> {
    if (!this.supabase) return undefined;

    const { data, error } = await this.supabase
      .from('assignment')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .limit(1)
      .single();

    if (error) {
      logger.error('Error fetching assignment by id:', error);
      return undefined;
    }

    return data ?? undefined;
  }
  async getAssignmentsByIds(
    ids: string[],
  ): Promise<TableTypes<'assignment'>[]> {
    if (!this.supabase || ids.length === 0) return [];

    const { data, error } = await this.supabase
      .from('assignment')
      .select('*')
      .in('id', ids)
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error fetching assignments by ids:', error);
      return [];
    }

    return (data ?? []) as TableTypes<'assignment'>[];
  }
}
