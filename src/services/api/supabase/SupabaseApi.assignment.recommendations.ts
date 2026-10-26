import { LeaderboardRewards, TableTypes } from '../../../common/constants';
import { readAssignmentCartFromStorage } from '../../../teachers-module/pages/AssignmentCartStorage';
import logger from '../../../utility/logger';
import { AssignmentCartData } from '../ServiceApi';
import { SupabaseApiAssignmentSchoolLookups } from './SupabaseApi.assignment.schoolLookups';

export interface SupabaseApiAssignmentRecommendations {
  [key: string]: any;
}
export class SupabaseApiAssignmentRecommendations extends SupabaseApiAssignmentSchoolLookups {
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

    // Flatten: class_user[] → user → result[]
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
}
