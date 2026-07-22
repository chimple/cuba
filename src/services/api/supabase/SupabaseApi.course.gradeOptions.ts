import { v4 as uuidv4 } from 'uuid';
import { COURSES, LIVE_QUIZ, TableTypes } from '../../../common/constants';
import { StudentLessonResult } from '../../../common/courseConstants';
import { AvatarObj } from '../../../components/animation/Avatar';
import logger from '../../../utility/logger';
import { SupabaseApiCourseCatalog } from './SupabaseApi.course.catalog';
export interface SupabaseApiCourseGradeOptions {
  [key: string]: any;
}
export class SupabaseApiCourseGradeOptions extends SupabaseApiCourseCatalog {
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
}
