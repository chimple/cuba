import { v4 as uuidv4 } from 'uuid';
import {
  CHIMPLE_MATHS,
  COURSES,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import logger from '../../../utility/logger';
import { SupabaseApiResultsStudentProfiles } from './SupabaseApi.results.studentProfiles';

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
export interface SupabaseApiResultsCourseSelection {
  [key: string]: any;
}
export class SupabaseApiResultsCourseSelection extends SupabaseApiResultsStudentProfiles {
  async updateClassCourseSelection(
    classId: string,
    selectedCourseIds: string[],
  ): Promise<void> {
    if (!this.supabase) return;

    const now = new Date().toISOString();

    await Promise.all(
      selectedCourseIds.map(async (courseId) => {
        // Check existing entry
        if (!this.supabase) return;
        const { data: existingEntry, error } = await this.supabase
          .from('class_course')
          .select('*')
          .eq('class_id', classId)
          .eq('course_id', courseId)
          .eq('is_deleted', false)
          .maybeSingle();

        if (error) {
          logger.error('Error fetching class_course:', error);
          throw error;
        }

        if (!existingEntry) {
          // Insert new
          const newEntry = {
            id: uuidv4(),
            class_id: classId,
            course_id: courseId,
            created_at: now,
            updated_at: now,
            is_deleted: false,
          };
          const { error: insertError } = await this.supabase
            .from('class_course')
            .insert(newEntry);

          if (insertError) {
            logger.error('Error inserting class_course:', insertError);
            throw insertError;
          }
        } else if (existingEntry.is_deleted) {
          // Reactivate
          const { error: updateError } = await this.supabase
            .from('class_course')
            .update({ is_deleted: false, updated_at: now })
            .eq('id', existingEntry.id);

          if (updateError) {
            logger.error('Error updating class_course:', updateError);
            throw updateError;
          }
        } else {
          // Update timestamp
          const { error: timestampError } = await this.supabase
            .from('class_course')
            .update({ updated_at: now })
            .eq('id', existingEntry.id);

          if (timestampError) {
            logger.error('Error updating updated_at:', timestampError);
            throw timestampError;
          }
        }
      }),
    );
  }

  async updateSchoolCourseSelection(
    schoolId: string,
    selectedCourseIds: string[],
  ): Promise<void> {
    if (!this.supabase) return;

    const now = new Date().toISOString();
    const courseIds = Array.from(new Set(selectedCourseIds.filter(Boolean)));
    const { data: schoolLinks, error: schoolLinksError } = await this.supabase
      .from('school_course')
      .select('id, course_id, is_deleted')
      .eq('school_id', schoolId);
    if (schoolLinksError) throw schoolLinksError;

    const links = schoolLinks ?? [];
    const activeCourseIds = new Set(
      links
        .filter((link) => !link.is_deleted)
        .map((link) => link.course_id)
        .filter((id): id is string => Boolean(id)),
    );
    const removedCourseIds = [...activeCourseIds].filter(
      (courseId) => !courseIds.includes(courseId),
    );

    const activeLinksByCourse = new Map<string, string>();
    const duplicateLinkIds: string[] = [];
    for (const link of links) {
      if (link.is_deleted || !link.course_id) continue;
      if (activeLinksByCourse.has(link.course_id)) {
        duplicateLinkIds.push(link.id);
      } else {
        activeLinksByCourse.set(link.course_id, link.id);
      }
    }
    const schoolLinksToDelete = links.filter(
      (link) =>
        !link.is_deleted &&
        (!courseIds.includes(link.course_id) ||
          duplicateLinkIds.includes(link.id)),
    );
    if (schoolLinksToDelete.length) {
      const { error } = await this.supabase
        .from('school_course')
        .update({ is_deleted: true, updated_at: now })
        .in(
          'id',
          schoolLinksToDelete.map((link) => link.id),
        );
      if (error) throw error;
    }

    const classes = await this.getClassesBySchoolId(schoolId);
    const classIds = classes.map(
      (classRow: TableTypes<'class'>) => classRow.id,
    );
    const { data: classLinks, error: classLinksError } = classIds.length
      ? await this.supabase
          .from('class_course')
          .select('id, class_id, course_id, is_deleted')
          .in('class_id', classIds)
      : { data: [], error: null };
    if (classLinksError) throw classLinksError;

    const classCourseLinks = classLinks ?? [];
    const classLinksToDelete = classCourseLinks.filter(
      (link) => !link.is_deleted && removedCourseIds.includes(link.course_id),
    );
    if (classLinksToDelete.length) {
      const { error } = await this.supabase
        .from('class_course')
        .update({ is_deleted: true, updated_at: now })
        .in(
          'id',
          classLinksToDelete.map((link) => link.id),
        );
      if (error) throw error;
    }

    const selectedCourses = await this.getCourses(courseIds);
    const coursesById = new Map(
      selectedCourses.map((course) => [course.id, course]),
    );
    const schoolRowsToInsert = [];
    const schoolRowsToReactivate: string[] = [];
    const classRowsToInsert = [];
    const classRowsToReactivate: string[] = [];

    for (const courseId of courseIds) {
      const schoolLink =
        links.find((link) => link.course_id === courseId && !link.is_deleted) ??
        links.find((link) => link.course_id === courseId);
      if (schoolLink?.is_deleted) {
        schoolRowsToReactivate.push(schoolLink.id);
      } else if (!schoolLink) {
        schoolRowsToInsert.push({
          id: uuidv4(),
          school_id: schoolId,
          course_id: courseId,
          created_at: now,
          updated_at: now,
          is_deleted: false,
        });
      }

      const course = coursesById.get(courseId);
      if (!course?.grade_id) continue;
      for (const classRow of classes.filter(
        (row: TableTypes<'class'>) => row.grade_id === course.grade_id,
      )) {
        const classLink =
          classCourseLinks.find(
            (link) =>
              link.class_id === classRow.id &&
              link.course_id === courseId &&
              !link.is_deleted,
          ) ??
          classCourseLinks.find(
            (link) =>
              link.class_id === classRow.id && link.course_id === courseId,
          );
        if (classLink?.is_deleted) {
          classRowsToReactivate.push(classLink.id);
        } else if (!classLink) {
          classRowsToInsert.push({
            id: uuidv4(),
            class_id: classRow.id,
            course_id: courseId,
            created_at: now,
            updated_at: now,
            is_deleted: false,
          });
        }
      }
    }

    if (schoolRowsToReactivate.length) {
      const { error } = await this.supabase
        .from('school_course')
        .update({ is_deleted: false, updated_at: now })
        .in('id', schoolRowsToReactivate);
      if (error) throw error;
    }
    if (schoolRowsToInsert.length) {
      const { error } = await this.supabase
        .from('school_course')
        .insert(schoolRowsToInsert);
      if (error) throw error;
    }
    if (classRowsToReactivate.length) {
      const { error } = await this.supabase
        .from('class_course')
        .update({ is_deleted: false, updated_at: now })
        .in('id', classRowsToReactivate);
      if (error) throw error;
    }
    if (classRowsToInsert.length) {
      const { error } = await this.supabase
        .from('class_course')
        .insert(classRowsToInsert);
      if (error) throw error;
    }
  }

  async getSubject(id: string): Promise<TableTypes<'subject'> | undefined> {
    if (!this.supabase) return undefined;
    const { data, error } = await this.supabase
      .from('subject')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();
    if (error) {
      logger.error('Error fetching subject:', error);
      return undefined;
    }
    return data ?? undefined;
  }
  async getCourse(id: string): Promise<TableTypes<'course'> | undefined> {
    if (!this.supabase) return undefined;
    const { data, error } = await this.supabase
      .from('course')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();
    if (error) {
      logger.error('Error fetching course:', error);
      return undefined;
    }
    return data ?? undefined;
  }

  async resolveMathCourseByLanguage(
    languageDocId?: string | null,
  ): Promise<TableTypes<'course'> | undefined> {
    if (!this.supabase) return undefined;

    const englishMathCourse = await this.getCourse(CHIMPLE_MATHS);
    if (!englishMathCourse?.subject_id) return englishMathCourse;

    if (!languageDocId) return englishMathCourse;

    const language = await this.getLanguageWithId(languageDocId);
    const languageCode = (language?.code ?? '').toLowerCase();
    if (!languageCode || languageCode === COURSES.ENGLISH) {
      return englishMathCourse;
    }

    const { data, error } = await this.supabase
      .from(TABLES.Course)
      .select('*')
      .eq('subject_id', englishMathCourse.subject_id)
      .eq('code', `maths-${languageCode}`)
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error fetching language-specific math course:', error);
      return englishMathCourse;
    }

    const matchingCourse =
      (data ?? []).find(
        (course) =>
          course.curriculum_id === englishMathCourse.curriculum_id &&
          course.grade_id === englishMathCourse.grade_id,
      ) ?? data?.[0];

    return matchingCourse ?? englishMathCourse;
  }
  async getCourses(ids: string[]): Promise<TableTypes<'course'>[]> {
    if (!this.supabase || !ids || ids.length === 0) return [];

    const { data, error } = await this.supabase
      .from('course')
      .select('*')
      .in('id', ids) // fetch all courses in one go
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error fetching courses:', error);
      return [];
    }

    return data ?? [];
  }
}
