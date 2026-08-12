import { TABLES } from '../../../common/constants';
import logger from '../../../utility/logger';
import {
  CampaignAssignmentFilters,
  CampaignAssignmentOptions,
  CampaignAssignmentOptionsParams,
  CampaignAssignmentsResponse,
  CampaignAudiencePayload,
  CampaignOption,
  CampaignSavedAudienceGroup,
} from '../ServiceApi';
import { SupabaseApiCampaignAudience } from './SupabaseApi.campaign.audience';
import {
  chunkArray,
  firstOrSelf,
  type CampaignAssignmentChapterLessonRow,
  type CampaignAssignmentChapterRow,
  type CampaignAssignmentCourseRow,
  type CampaignAssignmentSchoolCourseRow,
  type CampaignSavedAudienceGroupRow,
} from './SupabaseApi.campaign.helpers';

export interface SupabaseApiCampaignAssignmentOptions {
  [key: string]: any;
}
export class SupabaseApiCampaignAssignmentOptions extends SupabaseApiCampaignAudience {
  async getCampaignAssignmentOptions({
    schoolIds,
    gradeIds,
  }: CampaignAssignmentOptionsParams): Promise<CampaignAssignmentOptions> {
    if (!this.supabase || gradeIds.length === 0) {
      return { grades: [] };
    }

    const courseMap = new Map<string, CampaignAssignmentCourseRow>();

    if (schoolIds.length > 0) {
      for (const schoolIdBatch of chunkArray(schoolIds, 500)) {
        const { data, error } = await this.supabase
          .from('school_course')
          .select(
            'course:course_id(id, name, grade_id, sort_index, subject_id)',
          )
          .in('school_id', schoolIdBatch)
          .eq('is_deleted', false);

        if (error) {
          logger.error('Error fetching campaign assignment courses:', error);
          continue;
        }

        ((data ?? []) as CampaignAssignmentSchoolCourseRow[]).forEach((row) => {
          const course = firstOrSelf(row.course);
          if (!course?.id || !course.name || !course.grade_id) return;
          if (!gradeIds.includes(String(course.grade_id))) return;
          courseMap.set(String(course.id), course);
        });
      }
    }

    const subjectsByGrade = new Map<
      string,
      CampaignAssignmentOptions['grades'][number]['subjects']
    >();

    const sortedCourses = Array.from(courseMap.values()).sort(
      (a, b) =>
        Number(a.sort_index ?? 9999) - Number(b.sort_index ?? 9999) ||
        String(a.name).localeCompare(String(b.name)),
    );

    const courseIds = sortedCourses.map((course) => String(course.id));
    const chapterRows: CampaignAssignmentChapterRow[] = [];

    for (const courseIdBatch of chunkArray(courseIds, 500)) {
      const { data, error } = await this.supabase
        .from(TABLES.Chapter)
        .select('id, name, course_id, sort_index')
        .in('course_id', courseIdBatch)
        .eq('is_deleted', false)
        .order('sort_index', { ascending: true });

      if (error) {
        logger.error('Error fetching campaign assignment chapters:', error);
        continue;
      }

      chapterRows.push(...((data ?? []) as CampaignAssignmentChapterRow[]));
    }

    const chapterIds = chapterRows.map((chapter) => String(chapter.id));
    const chapterLessonRows: CampaignAssignmentChapterLessonRow[] = [];

    for (const chapterIdBatch of chunkArray(chapterIds, 500)) {
      const { data, error } = await this.supabase
        .from(TABLES.ChapterLesson)
        .select('chapter_id, lesson_id, sort_index, lesson:lesson_id(id, name)')
        .in('chapter_id', chapterIdBatch)
        .eq('is_deleted', false)
        .order('sort_index', { ascending: true });

      if (error) {
        logger.error('Error fetching campaign assignment lessons:', error);
        continue;
      }

      chapterLessonRows.push(
        ...((data ?? []) as CampaignAssignmentChapterLessonRow[]),
      );
    }

    const lessonsByChapter = new Map<
      string,
      CampaignAssignmentOptions['grades'][number]['subjects'][number]['chapters'][number]['lessons']
    >();
    const lessonIdsByChapter = new Map<string, Set<string>>();

    chapterLessonRows
      .sort(
        (a, b) =>
          Number(a.sort_index ?? 9999) - Number(b.sort_index ?? 9999) ||
          String(a.lesson_id).localeCompare(String(b.lesson_id)),
      )
      .forEach((row) => {
        const lesson = firstOrSelf(row.lesson);
        if (!row.chapter_id || !lesson?.id) return;

        const chapterId = String(row.chapter_id);
        const lessonId = String(lesson.id);
        if (!lessonsByChapter.has(chapterId))
          lessonsByChapter.set(chapterId, []);
        if (!lessonIdsByChapter.has(chapterId)) {
          lessonIdsByChapter.set(chapterId, new Set<string>());
        }
        if (lessonIdsByChapter.get(chapterId)?.has(lessonId)) return;

        lessonIdsByChapter.get(chapterId)?.add(lessonId);
        lessonsByChapter.get(chapterId)?.push({
          id: lessonId,
          name: lesson.name || 'Untitled lesson',
        });
      });

    const chaptersByCourse = new Map<
      string,
      CampaignAssignmentOptions['grades'][number]['subjects'][number]['chapters']
    >();

    chapterRows
      .sort(
        (a, b) =>
          Number(a.sort_index ?? 9999) - Number(b.sort_index ?? 9999) ||
          String(a.name ?? '').localeCompare(String(b.name ?? '')),
      )
      .forEach((chapter) => {
        if (!chapter.id || !chapter.course_id) return;
        const courseId = String(chapter.course_id);
        if (!chaptersByCourse.has(courseId)) chaptersByCourse.set(courseId, []);
        chaptersByCourse.get(courseId)?.push({
          id: String(chapter.id),
          name: chapter.name || 'Untitled chapter',
          lessons: lessonsByChapter.get(String(chapter.id)) ?? [],
        });
      });

    const subjectOptions = sortedCourses.map((course) => ({
      id: String(course.id),
      name: course.name,
      gradeId: String(course.grade_id),
      chapters: chaptersByCourse.get(String(course.id)) ?? [],
    }));

    subjectOptions.forEach((subject) => {
      if (!subjectsByGrade.has(subject.gradeId)) {
        subjectsByGrade.set(subject.gradeId, []);
      }
      subjectsByGrade.get(subject.gradeId)?.push(subject);
    });

    return {
      grades: gradeIds.map((gradeId) => ({
        gradeId,
        subjects: subjectsByGrade.get(gradeId) ?? [],
      })),
    };
  }

  async getCampaignAssignments(
    campaignId: string,
    filters: CampaignAssignmentFilters,
  ): Promise<CampaignAssignmentsResponse> {
    if (!this.supabase || !campaignId) {
      return {
        assignments: [],
        uniqueSubjects: [],
        total: 0,
      };
    }

    type CampaignAssignmentRpcRow = {
      assignment_id: string;
      assignment_date: string;
      grade_id: string;
      grade_name: string;
      subject_id: string;
      subject_name: string;
      lesson_id: string;
      lesson_name: string;
      unique_subjects?: Array<{
        subject_id: string;
        subject_name: string;
        grade_ids?: string[] | null;
      }> | null;
      total_count: string | number;
    };

    const { data, error } = await this.supabase.rpc(
      'get_campaign_assignments',
      {
        p_campaign_id: campaignId,
        p_grade_ids: filters.gradeIds?.length ? filters.gradeIds : null,
        p_subject_ids: filters.subjectIds?.length ? filters.subjectIds : null,
        p_page: filters.page ?? 1,
        p_page_size: filters.pageSize ?? 10,
      },
    );

    logger.info(
      `Fetched ${data?.length ?? 0} campaign assignments for campaign ${campaignId}`,
    );

    if (error) {
      throw error;
    }

    const rpcRows = data as CampaignAssignmentRpcRow[] | null | undefined;
    const firstRow = rpcRows?.[0];
    const uniqueSubjects = Array.isArray(firstRow?.unique_subjects)
      ? firstRow.unique_subjects.map((subject) => ({
          id: String(subject.subject_id),
          name: String(subject.subject_name),
          gradeIds: Array.isArray(subject.grade_ids)
            ? subject.grade_ids.map(String)
            : [],
        }))
      : [];

    return {
      assignments:
        rpcRows?.map((row) => ({
          assignmentId: row.assignment_id,
          assignmentDate: row.assignment_date,

          gradeId: row.grade_id,
          gradeName: row.grade_name,

          subjectId: row.subject_id,
          subjectName: row.subject_name,

          lessonId: row.lesson_id,
          lessonName: row.lesson_name,
        })) ?? [],
      uniqueSubjects,
      total: rpcRows?.length ? Number(firstRow?.total_count ?? 0) : 0,
    };
  }

  async getCampaignSubjectsByCampaignId(
    campaignId: string,
  ): Promise<CampaignOption[]> {
    if (!this.supabase || !campaignId) {
      return [];
    }

    const { data, error } = await this.supabase
      .from(TABLES.Assignment)
      .select(
        `
        course:course_id(
          subject:subject_id(
            id,
            name
          )
        )
      `,
      )
      .eq('campaign_id', campaignId)
      .eq('is_deleted', false)
      .not('course_id', 'is', null);

    if (error) {
      logger.error('Error fetching campaign subjects:', error);
      return [];
    }

    const uniqueSubjects = new Map<string, CampaignOption>();

    (
      (data ?? []) as Array<{
        course?: {
          subject?: CampaignOption | CampaignOption[] | null;
        } | null;
      }>
    ).forEach((row) => {
      const course = Array.isArray(row.course) ? row.course[0] : row.course;
      const subject = Array.isArray(course?.subject)
        ? course?.subject[0]
        : course?.subject;

      if (subject?.id && subject?.name) {
        uniqueSubjects.set(String(subject.id), {
          id: String(subject.id),
          name: String(subject.name),
        });
      }
    });

    return Array.from(uniqueSubjects.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  private mapCampaignSavedAudienceGroup(
    group: CampaignSavedAudienceGroupRow,
  ): CampaignSavedAudienceGroup {
    const schoolLinks = Array.isArray(group.campaign_target_audience_school)
      ? group.campaign_target_audience_school
      : [];
    const gradeLinks = Array.isArray(group.campaign_target_audience_grade)
      ? group.campaign_target_audience_grade
      : [];

    return {
      id: String(group.id),
      name: String(group.name),
      programId: String(group.program_id),
      isAllSchools: Boolean(group.is_all_schools),
      isAllGrades: Boolean(group.is_all_grades),
      schoolIds: schoolLinks
        .map((link) => link.school_id)
        .filter((schoolId: unknown): schoolId is string => !!schoolId),
      gradeIds: gradeLinks
        .map((link) => link.grade_id)
        .filter((gradeId: unknown): gradeId is string => !!gradeId),
    };
  }

  async getCampaignGradesForSchools(
    schoolIds: string[],
  ): Promise<CampaignOption[]> {
    return await this.fetchDistinctClassGradesForSchools(schoolIds);
  }

  private async insertCampaignTargetAudience(
    payload: CampaignAudiencePayload,
  ): Promise<string> {
    if (!this.supabase) {
      throw new Error('Supabase client is not initialized.');
    }

    const {
      data: { user },
    } = await this.supabase.auth.getUser();

    const { data, error } = await this.supabase
      .from('campaign_target_audience')
      .insert({
        name: payload.isSaved ? payload.name : null,
        program_id: payload.programId,
        is_all_schools: payload.isAllSchools,
        is_all_grades: payload.isAllGrades,
        is_saved: payload.isSaved,
        created_by: user?.id ?? null,
      })
      .select('id')
      .single();

    if (error) {
      logger.error('Error creating campaign target audience:', error);
      throw error;
    }

    const targetAudienceId = String(data.id);

    try {
      if (!payload.isAllSchools && payload.schoolIds.length > 0) {
        const { error: schoolInsertError } = await this.supabase
          .from('campaign_target_audience_school')
          .insert(
            payload.schoolIds.map((schoolId) => ({
              target_audience_id: targetAudienceId,
              school_id: schoolId,
            })),
          );

        if (schoolInsertError) {
          logger.error(
            'Error creating campaign target audience schools:',
            schoolInsertError,
          );
          throw schoolInsertError;
        }
      }

      if (!payload.isAllGrades && payload.gradeIds.length > 0) {
        const { error: gradeInsertError } = await this.supabase
          .from('campaign_target_audience_grade')
          .insert(
            payload.gradeIds.map((gradeId) => ({
              target_audience_id: targetAudienceId,
              grade_id: gradeId,
            })),
          );

        if (gradeInsertError) {
          logger.error(
            'Error creating campaign target audience grades:',
            gradeInsertError,
          );
          throw gradeInsertError;
        }
      }
    } catch (error) {
      await this.deleteCampaignTargetAudience(targetAudienceId);
      throw error;
    }

    return targetAudienceId;
  }

  private async deleteCampaignTargetAudience(targetAudienceId: string) {
    if (!this.supabase) return;

    const cleanupSteps = [
      this.supabase
        .from('campaign_target_audience_school')
        .delete()
        .eq('target_audience_id', targetAudienceId),
      this.supabase
        .from('campaign_target_audience_grade')
        .delete()
        .eq('target_audience_id', targetAudienceId),
      this.supabase
        .from('campaign_target_audience')
        .delete()
        .eq('id', targetAudienceId),
    ];

    for (const cleanupStep of cleanupSteps) {
      const { error } = await cleanupStep;
      if (error) {
        logger.error('Error cleaning up campaign target audience:', error);
      }
    }
  }
}
