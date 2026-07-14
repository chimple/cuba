import { v4 as uuidv4 } from 'uuid';
import {
  COURSES,
  LeaderboardRewards,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import Course from '../../../models/Course';
import Lesson from '../../../models/Lesson';
import {
  readAssignmentCartFromStorage,
  writeAssignmentCartToStorage,
} from '../../../teachers-module/pages/AssignmentCartStorage';
import logger from '../../../utility/logger';
import { Database } from '../../database';
import {
  AssignmentCartData,
  AssignmentDateRangeData,
  OpsStudentPerformanceBandRow,
  OpsStudentPerformanceBandsParams,
} from '../ServiceApi';
import { SupabaseApiUser } from './SupabaseApi.user';

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

export interface SupabaseApiAssignment {
  [key: string]: any;
}
export class SupabaseApiAssignment extends SupabaseApiUser {
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
              logger.error('?? onDataChange is undefined for assignment_user!');
            }
          },
        )
        .subscribe();
    } catch (error) {
      logger.error('?? Error in Supabase assignment_user listener:', error);
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
              logger.error('?? onDataChange is undefined!');
            }
          },
        )
        .subscribe();
    } catch (error) {
      logger.error('?? Error in Supabase listener:', error);
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

      this._liveQuizRealTime
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
  async createOrUpdateAssignmentCart(
    userId: string,
    lessons: string,
  ): Promise<boolean | undefined> {
    const now = new Date().toISOString();
    const existing = readAssignmentCartFromStorage(userId);
    writeAssignmentCartToStorage(userId, {
      lessons,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    });

    return true;
  }
  async getSchoolDetailsByUdise(udiseCode: string): Promise<{
    schoolId?: string;
    studentLoginType: string;
    schoolModel: string;
    whatsappBotNumber?: string;
  } | null> {
    if (!this.supabase) return null;

    try {
      // Fetch student_login_type and program_model directly from school table
      const { data: schoolData, error } = await this.supabase
        .from('school')
        .select('id, student_login_type, model, whatsapp_bot_number')
        .eq('udise', udiseCode)
        .eq('is_deleted', false)
        .single();
      if (error || !schoolData) {
        logger.error('Error fetching school data:', error);
        return null;
      }

      const { id, student_login_type, model, whatsapp_bot_number } = schoolData;

      return {
        schoolId: id || '',
        studentLoginType: student_login_type || '',
        schoolModel: model || '',
        whatsappBotNumber: whatsapp_bot_number || '',
      };
    } catch (err) {
      logger.error('Unexpected error in getSchoolDetailsByUdise:', err);
      return null;
    }
  }
  async getSchoolDataByUdise(
    udiseCode: string,
  ): Promise<TableTypes<'school_data'> | null> {
    if (!this.supabase) return null;

    try {
      const { data, error } = await this.supabase
        .from('school_data')
        .select('*')
        .eq('udise_code', udiseCode)
        .single();

      if (error || !data) {
        logger.error('Error fetching school_data record:', error);
        return null;
      }

      return data; // return entire row
    } catch (err) {
      logger.error('Unexpected error in getSchoolDataByUdise:', err);
      return null;
    }
  }

  async getUserByDocId(
    studentId: string,
  ): Promise<TableTypes<'user'> | undefined> {
    try {
      const res = await this.supabase
        ?.from('user')
        .select('*')
        .eq('id', studentId)
        .eq('is_deleted', false);
      return res?.data?.[0];
    } catch (error) {
      throw error;
    }
  }
  async getGradeById(id: string): Promise<TableTypes<'grade'> | undefined> {
    if (!this.supabase) return;

    try {
      const { data, error } = await this.supabase
        .from('grade')
        .select('*')
        .eq('id', id)
        .eq('is_deleted', false)
        .single();

      if (error) {
        logger.error('Error fetching grade by ID:', error);
        return;
      }

      return data;
    } catch (err) {
      logger.error('Unexpected error fetching grade by ID:', err);
      return;
    }
  }
  async getGradeByName(name: string): Promise<TableTypes<'grade'> | undefined> {
    if (!this.supabase) return;

    try {
      const { data, error } = await this.supabase
        .from('grade')
        .select('*')
        .eq('name', name)
        .eq('is_deleted', false)
        .limit(1)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching grade by name:', error);
        return;
      }

      return data ?? undefined;
    } catch (err) {
      logger.error('Unexpected error fetching grade by name:', err);
      return;
    }
  }
  async getGradesByIds(ids: string[]): Promise<TableTypes<'grade'>[]> {
    if (!this.supabase || !ids || ids.length === 0) {
      return [];
    }

    try {
      const { data, error } = await this.supabase
        .from('grade')
        .select('*')
        .in('id', ids)
        .eq('is_deleted', false);

      if (error) {
        logger.error('Error fetching grades by IDs:', error);
        return [];
      }

      return data ?? [];
    } catch (err) {
      logger.error('Unexpected error fetching grades by IDs:', err);
      return [];
    }
  }

  async getCurriculumById(
    id: string,
  ): Promise<TableTypes<'curriculum'> | undefined> {
    if (!this.supabase) return;

    try {
      const { data, error } = await this.supabase
        .from('curriculum')
        .select('*')
        .eq('id', id)
        .eq('is_deleted', false)
        .single();

      if (error) {
        logger.error('Error fetching curriculum by ID:', error);
        return;
      }

      return data ?? undefined;
    } catch (err) {
      logger.error('Unexpected error fetching curriculum by ID:', err);
      return;
    }
  }
  async getCurriculumsByIds(
    ids: string[],
  ): Promise<TableTypes<'curriculum'>[]> {
    if (!this.supabase || ids.length === 0) return [];

    try {
      const { data, error } = await this.supabase
        .from('curriculum')
        .select('*')
        .in('id', ids)
        .eq('is_deleted', false);

      if (error) {
        logger.error('Error fetching curriculums by IDs:', error);
        return [];
      }

      return data ?? [];
    } catch (err) {
      logger.error('Unexpected error fetching curriculums by IDs:', err);
      return [];
    }
  }
  updateRewardsForStudent(studentId: string, unlockReward: LeaderboardRewards) {
    throw new Error('Method not implemented.');
  }

  async getRecommendedLessons(
    studentId: string,
    classId?: string,
  ): Promise<TableTypes<'lesson'>[]> {
    if (!this.supabase) return [];

    // 1. Get courses for the student or class
    let coursesRes;
    if (classId) {
      coursesRes = await this.supabase
        .from('class_course')
        .select('course_id, course(sort_index)')
        .eq('class_id', classId)
        .eq('is_deleted', false);
    } else {
      coursesRes = await this.supabase
        .from('user_course')
        .select('course_id, course(sort_index)')
        .eq('user_id', studentId)
        .eq('is_deleted', false);
    }

    if (coursesRes.error || !coursesRes.data) return [];

    // Build courseIds and courseIndexMap
    const courseIds = coursesRes.data.map((c) => c.course_id);
    const courseIndexMap = new Map<string, number>();
    coursesRes.data.forEach((c) => {
      // c.course may be null if not joined, so fallback to 0
      courseIndexMap.set(c.course_id, c.course?.sort_index ?? 0);
    });

    if (courseIds.length === 0) return [];

    // 2. Get all lessons and chapters for these courses
    const courseDetailsRes = await this.supabase
      .from('chapter_lesson')
      .select(
        `
      lesson (
        id, name, cocos_subject_code, cocos_chapter_code, cocos_lesson_id,
        lido_lesson_id, image, outcome, plugin_type, status, created_by, subject_id,
        target_age_from, target_age_to, language_id, created_at, updated_at,
        is_deleted, color
      ),
      chapter (
        id, name, course_id, sort_index
      ),
      sort_index
    `,
      )
      .in('chapter.course_id', courseIds)
      .eq('is_deleted', false)
      .eq('lesson.is_deleted', false)
      .eq('chapter.is_deleted', false)
      .order('chapter.course_id')
      .order('chapter.sort_index')
      .order('sort_index');

    if (courseDetailsRes.error || !courseDetailsRes.data) return [];

    const courseDetails = (courseDetailsRes.data as any[]).map((item) => ({
      lesson: Array.isArray(item.lesson) ? item.lesson[0] : item.lesson,
      chapter: Array.isArray(item.chapter) ? item.chapter[0] : item.chapter,
      sort_index: item.sort_index,
    })) as {
      lesson: TableTypes<'lesson'>;
      chapter: {
        id: string;
        name: string;
        course_id: string;
        sort_index: number;
      };
      sort_index: number;
    }[];

    // 3. Get all results for this student
    const resultsRes = await this.supabase
      .from('result')
      .select('id, student_id, lesson_id, assignment_id, score, updated_at')
      .eq('student_id', studentId)
      .eq('is_deleted', false);

    if (resultsRes.error || !resultsRes.data) return [];

    // 4. Map lesson_id -> lesson info
    const lessonIdToInfoMap = new Map<
      string,
      {
        course_id: string;
        course_index: number;
        chapter_id: string;
        chapter_index: number;
        lesson_index: number;
        lesson: TableTypes<'lesson'>;
      }
    >();
    courseDetails.forEach((item) => {
      lessonIdToInfoMap.set(item.lesson.id, {
        course_id: item.chapter.course_id,
        course_index: courseIndexMap.get(item.chapter.course_id) ?? 0,
        chapter_id: item.chapter.id,
        chapter_index: item.chapter.sort_index,
        lesson_index: item.sort_index,
        lesson: item.lesson,
      });
    });

    // 5. Find last played lesson per course (latest updated_at)
    const lastPlayedMap = new Map<
      string,
      {
        result: (typeof resultsRes.data)[0];
        info: {
          course_index: number;
          chapter_id: string;
          chapter_index: number;
          lesson_index: number;
          lesson: TableTypes<'lesson'>;
        };
      }
    >();
    for (const r of resultsRes.data) {
      if (!r.lesson_id) continue;
      const info = lessonIdToInfoMap.get(r.lesson_id);
      if (!info) continue;
      const updatedAt = r.updated_at ? new Date(r.updated_at) : null;
      const existing = lastPlayedMap.get(info.course_id);
      const existingUpdatedAt = existing?.result.updated_at
        ? new Date(existing.result.updated_at)
        : null;
      if (updatedAt && (!existingUpdatedAt || updatedAt > existingUpdatedAt)) {
        lastPlayedMap.set(info.course_id, {
          result: r,
          info: {
            course_index: info.course_index,
            chapter_id: info.chapter_id,
            chapter_index: info.chapter_index,
            lesson_index: info.lesson_index,
            lesson: info.lesson,
          },
        });
      }
    }

    // 6. For each last played lesson, get the next lesson in the same chapter
    const nextLessons: TableTypes<'lesson'>[] = [];
    for (const { info } of lastPlayedMap.values()) {
      const sameChapterLessons = courseDetails
        .filter(
          (cd) =>
            cd.chapter.id === info.chapter_id &&
            cd.sort_index > info.lesson_index,
        )
        .sort((a, b) => a.sort_index - b.sort_index);
      if (sameChapterLessons.length > 0) {
        nextLessons.push(sameChapterLessons[0].lesson);
      }
    }

    // 7. For never played courses, get the first lesson (chapter_index=0, lesson_index=0)
    const neverPlayedCourses = courseIds.filter(
      (cid) => !lastPlayedMap.has(cid),
    );
    const firstLessons: TableTypes<'lesson'>[] = courseDetails
      .filter(
        (cd) =>
          neverPlayedCourses.includes(cd.chapter.course_id) &&
          cd.chapter.sort_index === 0 &&
          cd.sort_index === 0,
      )
      .map((cd) => cd.lesson);

    // 8. Last played lessons
    const lastPlayedLessons: TableTypes<'lesson'>[] = Array.from(
      lastPlayedMap.values(),
    ).map((v) => v.info.lesson);

    // 9. Combine and sort
    const allLessons = [
      ...lastPlayedLessons,
      ...firstLessons,
      ...nextLessons,
    ].map((lesson) => ({
      ...lesson,
      course_index:
        courseIndexMap.get(lessonIdToInfoMap.get(lesson.id)?.course_id ?? '') ??
        0,
    }));

    allLessons.sort((a, b) => {
      if (a.course_index !== b.course_index) {
        return a.course_index - b.course_index;
      }
      return (a.name ?? '').localeCompare(b.name ?? '');
    });

    return allLessons;
  }
  async searchLessons(searchText: string): Promise<TableTypes<'lesson'>[]> {
    if (!this.supabase || !searchText) return [];

    const { data, error } = await this.supabase
      .from('lesson')
      .select('*')
      .or(`name.ilike.%${searchText}%,outcome.ilike.%${searchText}%`)
      .limit(20);

    if (error) {
      logger.error('searchLessons error', error);
      return [];
    }

    return data ?? [];
  }

  async getUserAssignmentCart(
    userId: string,
  ): Promise<AssignmentCartData | undefined> {
    const cart = readAssignmentCartFromStorage(userId);
    return cart;
  }

  async getChapterByLesson(
    lessonId: string,
    classId?: string,
    userId?: string,
  ): Promise<String | undefined> {
    try {
      if (!this.supabase) return;

      const classCourses = classId
        ? await this.getCoursesForClassStudent(classId)
        : await this.getCoursesForParentsStudent(userId ?? '');

      const { data, error } = await this.supabase
        .from('chapter_lesson')
        .select('chapter_id, chapter(course_id), lesson!inner(id)')
        .eq('lesson_id', lessonId)
        .eq('is_deleted', false)
        .eq('chapter.is_deleted', false)
        .eq('lesson.is_deleted', false);

      if (error || !data || data.length < 1) return;

      const classCourseIds = new Set(classCourses.map((course) => course.id));

      const matchedLesson = data.find((item) => {
        const courseId = item.chapter?.course_id;
        return courseId && classCourseIds.has(courseId);
      });

      return matchedLesson ? matchedLesson.chapter_id : data[0].chapter_id;
    } catch (error) {
      logger.error('Error fetching chapter by lesson ID:', error);
      return;
    }
  }
  async getAssignmentOrLiveQuizByClassByDate(
    classId: string,
    courseIds: string[],
    startDate: string,
    endDate: string,
    isClassWise: boolean,
    isLiveQuiz: boolean,
    allAssignments: boolean,
  ): Promise<TableTypes<'assignment'>[] | undefined> {
    if (!this.supabase) return;

    let query = this.supabase
      .from('assignment')
      .select('*')
      .eq('class_id', classId)
      .in('course_id', courseIds)
      .gte('created_at', endDate)
      .lte('created_at', startDate)
      .eq('is_deleted', false);

    // Handle both string and array courseIds
    // if (typeof courseId === "string") {
    //   query = query.eq("course_id", courseId);
    // } else if (Array.isArray(courseId) && courseId.length > 0) {
    //   query = query.in("course_id", courseId);
    // }

    if (isClassWise) {
      query = query.eq('is_class_wise', true);
    }

    if (!allAssignments) {
      if (isLiveQuiz) {
        query = query.eq('type', 'liveQuiz');
      } else {
        query = query.neq('type', 'liveQuiz');
      }
    }

    query = query.order('created_at', { ascending: false });
    const { data, error } = await query;

    if (error || !data || data.length < 1) return;
    return data;
  }
  async getStudentLastTenResults(
    studentId: string,
    courseIds: string[],
    assignmentIds: string[],
    classId: string,
  ): Promise<TableTypes<'result'>[]> {
    if (!this.supabase) return [];

    // Build the OR condition for assignment_id
    // Format: assignment_id.is.null,assignment_id.in.(id1,id2,...)
    let orCondition = 'assignment_id.is.null';
    if (assignmentIds.length > 0) {
      orCondition += `,assignment_id.in.(${assignmentIds.join(',')})`;
    }

    const { data, error } = await this.supabase
      .from('result')
      .select('*')
      .eq('student_id', studentId)
      .in('course_id', courseIds)
      .eq('class_id', classId)
      .or(orCondition)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      logger.error('Error fetching student results:', error.message);
      return [];
    }

    return data ?? [];
  }
  async getAssignmentUserByAssignmentIds(
    assignmentIds: string[],
  ): Promise<TableTypes<'assignment_user'>[]> {
    if (!this.supabase) return [];

    if (!assignmentIds || assignmentIds.length === 0) {
      return [];
    }

    const { data, error } = await this.supabase
      .from('assignment_user')
      .select('*')
      .in('assignment_id', assignmentIds)
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error fetching assignment_user records:', error.message);
      return [];
    }

    return data ?? [];
  }
  async getResultByAssignmentIds(
    assignmentIds: string[],
  ): Promise<TableTypes<'result'>[] | undefined> {
    if (!this.supabase || assignmentIds.length === 0) return;

    const { data, error } = await this.supabase
      .from('result')
      .select('*')
      .in('assignment_id', assignmentIds)
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error fetching results by assignment IDs:', error.message);
      return;
    }

    return data ?? [];
  }

  async getResultByAssignmentIdsForCurrentClassMembers(
    assignmentIds: string[],
    classId: string,
  ): Promise<TableTypes<'result'>[]> {
    if (!this.supabase || !assignmentIds?.length) return [];

    const { data, error } = await this.supabase
      .from('class_user')
      .select(
        `
      user!class_user_user_id_fkey (
        result!result_student_id_fkey!inner (*)
      )
    `,
      )
      .eq('class_id', classId)
      .eq('role', 'student')
      .eq('is_deleted', false)
      .in('user.result.assignment_id', assignmentIds)
      .eq('user.result.is_deleted', false);

    if (error) {
      logger.error('Error fetching results for class members:', error.message);
      return [];
    }

    // Flatten: class_user[] ? user ? result[]
    return data?.flatMap((row) => row.user?.result ?? []) ?? [];
  }
  async getLastAssignmentsForRecommendations(
    classId: string,
  ): Promise<TableTypes<'assignment'>[] | undefined> {
    if (!this.supabase) return;

    const { data: assignments, error } = await this.supabase
      .from('assignment')
      .select('*')
      .eq('class_id', classId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching assignments:', error.message);
      return;
    }

    if (!assignments || assignments.length === 0) return [];

    const latestAssignmentsMap = new Map<string, TableTypes<'assignment'>>();

    for (const assignment of assignments) {
      const courseId = assignment.course_id;
      if (typeof courseId === 'string' && !latestAssignmentsMap.has(courseId)) {
        latestAssignmentsMap.set(courseId, assignment);
      }
    }

    const latestAssignments = Array.from(latestAssignmentsMap.values());
    latestAssignments.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return latestAssignments;
  }
  async createAssignment(
    student_list: string[],
    userId: string,
    starts_at: string,
    ends_at: string,
    is_class_wise: boolean,
    class_id: string,
    school_id: string,
    lesson_id: string,
    chapter_id: string,
    course_id: string,
    type: string,
    batch_id: string,
    source: string | null,
    created_at?: string,
  ): Promise<void> {
    if (!this.supabase) return;

    const assignmentId = uuidv4();
    const timestamp = new Date().toISOString();

    try {
      // Insert into assignment table
      const { error: assignmentError } = await this.supabase
        .from('assignment')
        .insert([
          {
            id: assignmentId,
            created_by: userId,
            starts_at,
            ends_at,
            is_class_wise,
            class_id,
            school_id,
            lesson_id,
            chapter_id,
            course_id,
            type,
            source: source ?? null,
            batch_id: batch_id ?? null,
            created_at: created_at ?? timestamp,
            updated_at: timestamp,
            is_deleted: false,
          },
        ]);

      if (assignmentError) {
        logger.error('Error inserting assignment:', assignmentError.message);
      }

      // If not class-wise, insert into assignment_user
      if (!is_class_wise && student_list.length > 0) {
        const assignmentUserEntries = student_list.map((studentId) => ({
          id: uuidv4(),
          assignment_id: assignmentId,
          user_id: studentId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_deleted: false,
        }));

        const { error: userError } = await this.supabase
          .from('assignment_user')
          .insert(assignmentUserEntries);

        if (userError) {
          logger.error(
            'Error inserting assignment_user records:',
            userError.message,
          );
        }
      }
    } catch (error) {
      logger.error('Unexpected error in createAssignment:', error);
    }
  }

  async getTeachersForClass(
    classId: string,
  ): Promise<TableTypes<'user'>[] | undefined> {
    if (!this.supabase) return;

    //  Get all user_ids of teachers for the class
    const { data: classUsers, error: classUserError } = await this.supabase
      .from(TABLES.ClassUser)
      .select('user_id')
      .eq('class_id', classId)
      .eq('role', RoleType.TEACHER)
      .eq('is_deleted', false);

    if (classUserError) {
      logger.error('Error fetching class users:', classUserError);
      return [];
    }

    const userIds = classUsers?.map((cu) => cu.user_id) ?? [];
    if (userIds.length === 0) return [];

    //  Get user details for those user_ids
    const { data: users, error: userError } = await this.supabase
      .from(TABLES.User)
      .select('*')
      .in('id', userIds)
      .eq('is_deleted', false);

    if (userError) {
      logger.error('Error fetching users:', userError);
      return [];
    }

    return users ?? [];
  }
  async getUserByEmail(email: string): Promise<TableTypes<'user'> | undefined> {
    try {
      const results = await this?.supabase?.rpc('get_user_by_email', {
        p_email: email,
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
  async getUserByPhoneNumber(
    phone: string,
  ): Promise<TableTypes<'user'> | undefined> {
    try {
      const results = await this?.supabase?.rpc('get_user_by_phonenumber', {
        p_phone: phone,
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
  async addTeacherToClass(
    schoolId: string,
    classId: string,
    user: TableTypes<'user'>,
  ): Promise<void> {
    if (!this.supabase) return;
    const { data: principalRows, error: principalError } = await this.supabase
      .from(TABLES.SchoolUser)
      .select('id')
      .eq('school_id', schoolId)
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .in('role', [RoleType.PRINCIPAL, 'principal'])
      .limit(1);

    if (principalError) {
      logger.error(
        'Error checking principal role in school_user:',
        principalError,
      );
      throw principalError;
    }

    if (principalRows && principalRows.length > 0) {
      throw new Error(
        'This user is already Principal in this school and cannot be added as Teacher for the same school.',
      );
    }

    const classUserId = uuidv4();
    const now = new Date().toISOString();

    const classUser = {
      id: classUserId,
      class_id: classId,
      user_id: user.id,
      role: RoleType.TEACHER as Database['public']['Enums']['role'],
      created_at: now,
      updated_at: now,
      is_deleted: false,
    };

    // Insert into class_user table

    const { error: insertError } = await this.supabase
      .from(TABLES.ClassUser)
      .insert(classUser);

    if (insertError) {
      logger.error('Error inserting class_user:', insertError);
      throw insertError;
    }

    // Fetch user doc from your server API
    // const user_doc = await this.getUserByDocId(userId);
    await this.supabase
      .from(TABLES.School)
      .update({ updated_at: now })
      .eq('id', schoolId)
      .eq('is_deleted', false);

    // ?? Update 'school_course' table
    await this.supabase
      .from(TABLES.SchoolCourse)
      .update({ updated_at: now })
      .eq('school_id', schoolId)
      .eq('is_deleted', false);
    // Insert into user table with upsert logic (on conflict do nothing)

    await this.supabase
      .from(TABLES.Class)
      .update({ updated_at: now })
      .eq('id', classId)
      .eq('is_deleted', false);

    // ?? Update 'school_course' table
    await this.supabase
      .from(TABLES.ClassCourse)
      .update({ updated_at: now })
      .eq('class_id', classId)
      .eq('is_deleted', false);
    if (user) {
      const { error: userInsertError } = await this.supabase
        .from(TABLES.User)
        .upsert(
          {
            id: user.id,
            name: user.name,
            age: user.age,
            gender: user.gender,
            avatar: user.avatar,
            image: user.image,
            curriculum_id: user.curriculum_id,
            language_id: user.language_id,
            created_at: user.created_at,
            updated_at: user.updated_at,
          },
          { ignoreDuplicates: true },
        );

      if (userInsertError) {
        logger.error('Error inserting user:', userInsertError);
        throw userInsertError;
      }
    }
  }
  async checkUserExistInSchool(
    schoolId: string,
    userId: string,
  ): Promise<boolean> {
    if (!this.supabase) return false;

    //  Check if user is in school_user but NOT as a parent and not deleted
    const { data: schoolUsers, error: schoolUserError } = await this.supabase
      .from(TABLES.SchoolUser)
      .select('*')
      .eq('school_id', schoolId)
      .eq('user_id', userId)
      .neq('role', RoleType.PARENT)
      .eq('is_deleted', false);

    if (schoolUserError) {
      logger.error('Error querying school_user:', schoolUserError);
      return false;
    }
    if (schoolUsers && schoolUsers.length > 0) return true;

    //  Get all classes for this school
    const { data: classes, error: classError } = await this.supabase
      .from(TABLES.Class)
      .select('id')
      .eq('school_id', schoolId)
      .eq('is_deleted', false);

    if (classError) {
      logger.error('Error querying class:', classError);
      return false;
    }
    if (!classes || classes.length === 0) return false;

    const classIds = classes.map((c) => c.id);
    if (classIds.length === 0) return false;

    //  Check if user is teacher in any of these classes
    const { data: teachers, error: teacherError } = await this.supabase
      .from(TABLES.ClassUser)
      .select('*')
      .in('class_id', classIds)
      .eq('user_id', userId)
      .eq('role', RoleType.TEACHER)
      .eq('is_deleted', false);

    if (teacherError) {
      logger.error('Error querying class_user:', teacherError);
      return false;
    }

    return teachers && teachers.length > 0;
  }
  async checkTeacherExistInClass(
    schoolId: string,
    classId: string,
    userId: string,
  ): Promise<boolean> {
    if (!this.supabase) return false;
    //  Check if user is in school_user but NOT as a parent and not deleted
    const { data: schoolUsers, error: schoolUserError } = await this.supabase
      .from(TABLES.SchoolUser)
      .select('*')
      .eq('school_id', schoolId)
      .eq('user_id', userId)
      .neq('role', RoleType.PARENT)
      .eq('is_deleted', false);

    if (schoolUserError) {
      logger.error('Error querying school_user:', schoolUserError);
      return false;
    }
    if (schoolUsers && schoolUsers.length > 0) return true;

    //  Check if user is teacher in this classe
    const { data, error } = await this.supabase
      .from('class_user')
      .select('id')
      .eq('class_id', classId)
      .eq('user_id', userId)
      .eq('role', RoleType.TEACHER)
      .eq('is_deleted', false)
      .maybeSingle(); // Returns null if no match

    if (error) {
      logger.error('Error checking user in class:', error);
      return false;
    }

    return !!data; // true if found, false if not
  }

  async checkUserIsManagerOrDirector(
    schoolId: string,
    userId: string,
  ): Promise<boolean> {
    if (!this.supabase) return false;

    const roles = [
      RoleType.PROGRAM_MANAGER,
      RoleType.OPERATIONAL_DIRECTOR,
      RoleType.FIELD_COORDINATOR,
    ];

    const { data, error } = await this.supabase
      .from(TABLES.SchoolUser)
      .select('*')
      .eq('school_id', schoolId)
      .eq('user_id', userId)
      .in('role', roles)
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error querying school_user:', error);
      return false;
    }

    return !!(data && data.length > 0);
  }
  async getAssignmentsByAssignerAndClass(
    userId: string,
    classId: string,
    startDate: string,
    endDate: string,
  ): Promise<{
    classWiseAssignments: TableTypes<'assignment'>[];
    individualAssignments: TableTypes<'assignment'>[];
  }> {
    if (!this.supabase) {
      return { classWiseAssignments: [], individualAssignments: [] };
    }

    const { data, error } = await this.supabase
      .from(TABLES.Assignment)
      .select('*')
      .eq('created_by', userId)
      .or(`class_id.eq.${classId},is_class_wise.eq.true`)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .eq('is_deleted', false)
      .order('is_class_wise', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Error fetching assignments:', error);
      return { classWiseAssignments: [], individualAssignments: [] };
    }

    const assignments = data ?? [];

    const classWiseAssignments = assignments.filter((a) => a.is_class_wise);
    const individualAssignments = assignments.filter((a) => !a.is_class_wise);

    return { classWiseAssignments, individualAssignments };
  }
  async getAssignmentDateRangeDataForClassAndSchool(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<AssignmentDateRangeData> {
    if (!this.supabase) return { assignments: [], batchGroups: [] };

    const { data, error } = await this.supabase
      .from(TABLES.Assignment)
      .select('*')
      .eq('created_by', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Error fetching assignment date range data:', error);
      return { assignments: [], batchGroups: [] };
    }

    const assignments = (data ?? []) as TableTypes<'assignment'>[];

    const grouped = new Map<
      string,
      {
        batchId: string | null;
        assignmentCount: number;
        latestCreatedAt: string | null;
      }
    >();

    assignments.forEach((row) => {
      const batchId = row.batch_id ?? null;
      const key = batchId ?? '__null__';
      const existing = grouped.get(key);

      if (!existing) {
        grouped.set(key, {
          batchId,
          assignmentCount: 1,
          latestCreatedAt: row.created_at ?? null,
        });
        return;
      }

      existing.assignmentCount += 1;
      existing.latestCreatedAt = row.created_at ?? existing.latestCreatedAt;
    });

    return {
      assignments,
      batchGroups: Array.from(grouped.values()),
    };
  }

  async getCoinAndStreakCount(
    userId: string,
    classId: string,
    schoolId: string,
  ): Promise<{ coins: number; streak: number } | undefined> {
    if (!this.supabase) return;
    const { data, error } = await this.supabase
      .from(TABLES.UserAchivements)
      .select('coins, streak')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .limit(1)
      .maybeSingle();
    if (error) {
      logger.error('Error fetching user achievements:', error);
      return;
    }
    if (!data) return;
    return { coins: data.coins, streak: data.streak };
  }

  async updateCoins(
    userId: string,
    schoolId: string,
    classId: string,
    coins: number,
    streakIncrement = 0,
  ): Promise<TableTypes<TABLES.UserAchivements>> {
    if (!this.supabase) return {} as TableTypes<TABLES.UserAchivements>;

    const now = new Date().toISOString();
    const coinsToAdd = Number(coins) || 0;
    const streakToAdd = Number(streakIncrement) || 0;

    // 1) Check if row already exists for this user/class/school
    const { data: existing, error: fetchError } = await this.supabase
      .from(TABLES.UserAchivements)
      .select('*')
      .eq('user_id', userId)
      .or('is_deleted.is.false,is_deleted.is.null')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      logger.error(
        'Error fetching user_achievements in updateCoins:',
        fetchError,
      );
      return {} as TableTypes<TABLES.UserAchivements>;
    }

    // 2) If exists -> update coins + updated_at
    if (existing) {
      const updatedCoins = Number(existing.coins ?? 1000) + coinsToAdd;
      const updatedStreak = Number(existing.streak ?? 0) + streakToAdd;

      const { error: updateError } = await this.supabase
        .from(TABLES.UserAchivements)
        .update({
          coins: updatedCoins,
          streak: updatedStreak,
          school_id: schoolId,
          class_id: classId,
          updated_at: now,
          is_deleted: false,
        })
        .eq('user_id', userId);

      if (updateError) {
        logger.error('Error updating user_achievements coins:', updateError);
        return {} as TableTypes<TABLES.UserAchivements>;
      }

      return {
        ...existing,
        coins: updatedCoins,
        streak: updatedStreak,
        updated_at: now,
        is_deleted: false,
      } as TableTypes<TABLES.UserAchivements>;
    }

    // 3) If not exists -> create row with default 1000 + reward coins
    const newRow: TableTypes<TABLES.UserAchivements> = {
      user_id: userId,
      school_id: schoolId,
      class_id: classId,
      program_id: null,
      coins: 1000 + coinsToAdd,
      streak: streakToAdd,
      last_rewarded_week: null,
      last_penalty_week: null,
      is_deleted: false,
      created_at: now,
      updated_at: now,
    };

    const { error: insertError } = await this.supabase
      .from(TABLES.UserAchivements)
      .insert(newRow);

    if (insertError) {
      logger.error('Error inserting user_achievements row:', insertError);
      return {} as TableTypes<TABLES.UserAchivements>;
    }

    return newRow;
  }

  async getTeacherJoinedDate(
    userId: string,
    classId: string,
  ): Promise<TableTypes<'class_user'> | undefined> {
    if (!this.supabase) return undefined;

    const { data, error } = await this.supabase
      .from(TABLES.ClassUser)
      .select('*')
      .eq('user_id', userId)
      .eq('role', RoleType.TEACHER)
      .eq('class_id', classId)
      .eq('is_deleted', false)
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching teacher joined date:', error);
      return undefined;
    }

    return data ?? undefined;
  }
  async getAssignedStudents(assignmentId: string): Promise<string[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from(TABLES.Assignment_user)
      .select('user_id')
      .eq('assignment_id', assignmentId)
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error fetching assigned students:', error);
      return [];
    }

    const userIds: string[] = data?.map((row) => row.user_id) ?? [];
    return userIds ?? [];
  }
  async getStudentResultByDate(
    studentId: string,
    courseIds: string[],
    startDate: string,
    endDate: string,
    classId: string,
  ): Promise<TableTypes<'result'>[] | undefined> {
    if (!this.supabase) return;

    const { data, error } = await this.supabase
      .from(TABLES.Result)
      .select('*')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .in('course_id', courseIds)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching student result by date:', error);
      return;
    }

    return data ?? undefined;
  }
  async getStudentPlayStatus(
    studentId: string,
    classId: string,
  ): Promise<{ hasPlayed: boolean; lastPlayedAt?: string }> {
    if (!this.supabase) return { hasPlayed: false };

    const { data, error } = await this.supabase
      .from(TABLES.Result)
      .select('created_at')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      logger.error('Error fetching student play status:', error);
      return { hasPlayed: false };
    }

    if (!data || data.length === 0) return { hasPlayed: false };

    return { hasPlayed: true, lastPlayedAt: data[0].created_at };
  }
  async getOpsStudentPerformanceBands(
    params: OpsStudentPerformanceBandsParams,
  ): Promise<OpsStudentPerformanceBandRow[]> {
    if (!this.supabase) return [];

    const classIds = (params.classIds ?? []).filter(Boolean);
    const studentIds = (params.studentIds ?? []).filter(Boolean);

    if (classIds.length === 0 && studentIds.length === 0) {
      return [];
    }

    let query = this.supabase
      .from('student_performance_mv')
      .select('student_id,class_id,performance');

    if (classIds.length > 0) {
      query = query.in('class_id', classIds);
    }
    if (studentIds.length > 0) {
      query = query.in('student_id', studentIds);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching student performance bands:', error);
      return [];
    }

    return (data ?? []) as OpsStudentPerformanceBandRow[];
  }

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
          '? Error fetching assessment lessons for pending abort check:',
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
        logger.error('? Error checking pending aborted assessment:', error);
        return false;
      }

      return pendingAbortResults?.[0]?.status === 'system_exit';
    } catch (error) {
      logger.error('? Error checking pending aborted assessment:', error);
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
     * STEP 1??  Get latest valid batch for course
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
     * STEP 2??  Abort check
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
     * STEP 3??  Get incomplete assignments
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
     * STEP 4??  subject_lesson validation
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
     * STEP 5??  Sort by subject_lesson.sort_index
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
