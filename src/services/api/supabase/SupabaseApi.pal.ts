import { SupabaseApiWhatsApp } from './SupabaseApi.whatsapp';
import { COURSES, TABLES, TableTypes } from '../../../common/constants';
import logger from '../../../utility/logger';

export interface SupabaseApiPal {
  [key: string]: any;
}
export class SupabaseApiPal extends SupabaseApiWhatsApp {
  async getDomainsBySubjectAndFramework(
    subjectId: string,
    frameworkId: string,
  ): Promise<TableTypes<'domain'>[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from('domain')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('framework_id', frameworkId)
      .or('is_deleted.eq.false');

    if (error) {
      logger.error('Error fetching domains:', error);
      return [];
    }

    return data ?? [];
  }

  async getCompetenciesByDomainIds(
    domainIds: string[],
  ): Promise<TableTypes<'competency'>[]> {
    if (!this.supabase || !domainIds || domainIds.length === 0) return [];

    const { data, error } = await this.supabase
      .from('competency')
      .select('*')
      .in('domain_id', domainIds)
      .or('is_deleted.eq.false');

    if (error) {
      logger.error('Error fetching competencies:', error);
      return [];
    }

    return data ?? [];
  }

  async getOutcomesByCompetencyIds(
    competencyIds: string[],
  ): Promise<TableTypes<'outcome'>[]> {
    if (!this.supabase || !competencyIds || competencyIds.length === 0)
      return [];

    const { data, error } = await this.supabase
      .from('outcome')
      .select('*')
      .in('competency_id', competencyIds)
      .or('is_deleted.eq.false');

    if (error) {
      logger.error('Error fetching outcomes:', error);
      return [];
    }

    return data ?? [];
  }

  async getSkillsByOutcomeIds(
    outcomeIds: string[],
  ): Promise<TableTypes<'skill'>[]> {
    if (!this.supabase || !outcomeIds || outcomeIds.length === 0) return [];

    const { data, error } = await this.supabase
      .from('skill')
      .select('*')
      .in('outcome_id', outcomeIds)
      .or('is_deleted.eq.false');

    if (error) {
      logger.error('Error fetching skills:', error);
      return [];
    }

    return data ?? [];
  }

  async getResultsBySkillIds(
    studentId: string,
    skillIds: string[],
  ): Promise<TableTypes<'result'>[]> {
    if (!this.supabase || !skillIds || skillIds.length === 0) return [];

    const { data, error } = await this.supabase
      .from('result')
      .select('*')
      .eq('student_id', studentId)
      .in('skill_id', skillIds)
      .or('is_deleted.eq.false')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching results by skills:', error);
      return [];
    }

    return data ?? [];
  }

  async getSkillRelationsByTargetIds(
    targetSkillIds: string[],
  ): Promise<TableTypes<'skill_relation'>[]> {
    if (!this.supabase || !targetSkillIds || targetSkillIds.length === 0)
      return [];

    const { data, error } = await this.supabase
      .from('skill_relation')
      .select('*')
      .in('target_skill_id', targetSkillIds)
      .or('is_deleted.eq.false');

    if (error) {
      logger.error('Error fetching skill relations:', error);
      return [];
    }

    return data ?? [];
  }

  async getSkillByLessonIdentifier(
    lessonIdentifier: string,
  ): Promise<TableTypes<'skill'>[]> {
    if (!this.supabase || !lessonIdentifier) return [];

    const fetchLessonByColumn = async (
      column: 'id' | 'cocos_lesson_id' | 'lido_lesson_id',
    ) => {
      const { data, error } = await this.supabase!.from(TABLES.Lesson)
        .select('id')
        .eq(column, lessonIdentifier)
        .or('is_deleted.eq.false,is_deleted.is.null')
        .order('updated_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false, nullsFirst: false })
        .limit(1);

      if (error) {
        logger.error('Error fetching lesson for skill lookup:', error);
        return undefined;
      }

      return data?.[0] as { id: string } | undefined;
    };

    const lesson =
      (await fetchLessonByColumn('id')) ??
      (await fetchLessonByColumn('cocos_lesson_id')) ??
      (await fetchLessonByColumn('lido_lesson_id'));

    if (!lesson?.id) return [];

    const { data: skillLessons, error: skillLessonError } = await this.supabase
      .from(TABLES.SkillLesson)
      .select('skill_id')
      .eq('lesson_id', lesson.id)
      .or('is_deleted.eq.false,is_deleted.is.null')
      .order('sort_index', { ascending: true, nullsFirst: false });

    if (skillLessonError) {
      logger.error('Error fetching skill lesson for lesson:', skillLessonError);
      return [];
    }

    const skillIds = Array.from(
      new Set(
        (skillLessons ?? [])
          .map((row) => row.skill_id)
          .filter((skillId): skillId is string => !!skillId),
      ),
    );

    const skills = await Promise.all(
      skillIds.map(
        async (skillId) =>
          (await this.getSkillById(skillId)) ??
          ({ id: skillId } as TableTypes<'skill'>),
      ),
    );
    return skills;
  }

  async getSkillLessonsBySkillIds(
    skillIds: string[],
    languageCode?: string,
  ): Promise<TableTypes<'skill_lesson'>[]> {
    if (!this.supabase || !skillIds || skillIds.length === 0) return [];
    const supabase = this.supabase;

    const student = this.currentStudent;
    const studentLangId = student?.language_id ?? undefined;
    const localeId = student?.locale_id;

    const resolveLanguageId = async (code?: string) => {
      if (!code) return undefined;
      const { data, error } = await supabase
        .from(TABLES.Language)
        .select('id')
        .ilike('code', code)
        .eq('is_deleted', false)
        .limit(1);

      if (error) {
        logger.error('Error fetching skill lesson language:', error);
        return undefined;
      }

      return data?.[0]?.id as string | undefined;
    };

    const fetchSkillLessons = async (langId?: string) => {
      const orConditions: string[] = [];
      orConditions.push('language_id.is.null,locale_id.is.null');
      if (langId) {
        orConditions.push(`language_id.eq.${langId},locale_id.is.null`);
      }
      if (localeId) {
        orConditions.push(`language_id.is.null,locale_id.eq.${localeId}`);
      }
      if (langId && localeId) {
        orConditions.push(`language_id.eq.${langId},locale_id.eq.${localeId}`);
      }

      const { data, error } = await supabase
        .from('skill_lesson')
        .select('*')
        .in('skill_id', skillIds)
        .eq('is_deleted', false)
        .or(orConditions.join(','))
        .order('sort_index', { ascending: true });

      if (error) {
        logger.error('Error fetching skill lessons:', error);
        return [];
      }

      return data ?? [];
    };

    const langId = languageCode
      ? ((await resolveLanguageId(languageCode)) ?? studentLangId)
      : studentLangId;
    const skillLessons = await fetchSkillLessons(langId);
    if (skillLessons.length) {
      return skillLessons;
    }

    const { data, error } = await supabase
      .from('skill_lesson')
      .select('*')
      .in('skill_id', skillIds)
      .eq('is_deleted', false)
      .order('sort_index', { ascending: true });

    if (error) {
      logger.error('Error fetching skill lessons:', error);
      return [];
    }

    return data ?? [];
  }

  async getSkillById(
    skillId: string,
  ): Promise<TableTypes<'skill'> | undefined> {
    if (!this.supabase) return;

    const { data, error } = await this.supabase
      .from('skill') // ⚠️ Check if your table is named "skill" or "skills" in Supabase
      .select('*')
      .eq('id', skillId)
      .eq('is_deleted', false)
      .limit(1)
      .single();

    if (error) {
      logger.error('Error fetching skill by skillId:', error);
      return undefined;
    }

    return data ?? undefined;
  }

  async getSubjectBySkillId(
    skillId: string,
  ): Promise<TableTypes<'subject'> | undefined> {
    if (!this.supabase || !skillId) return undefined;

    type MaybeArray<T> = T | T[] | undefined;
    type SkillSubjectRow = {
      outcome?: MaybeArray<{
        competency?: MaybeArray<{
          domain?: MaybeArray<{
            subject?: MaybeArray<TableTypes<'subject'>>;
          }>;
        }>;
      }>;
    };

    const { data, error } = await this.supabase
      .from('skill')
      .select(
        `
          outcome!inner(
            competency!inner(
              domain!inner(
                subject!inner(*)
              )
            )
          )
        `,
      )
      .eq('id', skillId)
      .eq('is_deleted', false)
      .eq('outcome.is_deleted', false)
      .eq('outcome.competency.is_deleted', false)
      .eq('outcome.competency.domain.is_deleted', false)
      .eq('outcome.competency.domain.subject.is_deleted', false)
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching subject by skillId:', error);
      return undefined;
    }

    const row = data as SkillSubjectRow | null;
    const outcome = Array.isArray(row?.outcome)
      ? row?.outcome[0]
      : row?.outcome;
    const competency = Array.isArray(outcome?.competency)
      ? outcome?.competency[0]
      : outcome?.competency;
    const domain = Array.isArray(competency?.domain)
      ? competency?.domain[0]
      : competency?.domain;
    const subject = Array.isArray(domain?.subject)
      ? domain?.subject[0]
      : domain?.subject;

    return subject ?? undefined;
  }

  async isStudentPlayedPalLesson(
    studentId: string,
    courseId: string,
  ): Promise<boolean> {
    try {
      if (!this.supabase) return false;

      const course = await this.getCourse(courseId);
      if (!course?.subject_id) return false;
      const subjectId = course.subject_id;
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
            'Error fetching PAL assessment history language:',
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
          .eq('subject_id', subjectId)
          .or('is_deleted.eq.false,is_deleted.is.null');

      if (assessmentLessonsError) {
        logger.error(
          '❌ Error fetching assessment lessons for PAL history:',
          assessmentLessonsError,
        );
        return false;
      }

      const assessmentLessonIds = Array.from(
        new Set(
          (langId &&
          (assessmentLessons ?? []).some(
            (lesson) => lesson.language_id === langId,
          )
            ? (assessmentLessons ?? []).filter(
                (lesson) => lesson.language_id === langId,
              )
            : (assessmentLessons ?? []).filter(
                (lesson) => lesson.language_id == null,
              )
          )
            .map((lesson) => lesson.lesson_id)
            .filter((lessonId): lessonId is string => !!lessonId),
        ),
      );

      let resultsQuery = this.supabase
        .from('result')
        .select('lesson_id, status')
        .eq('student_id', studentId)
        .eq('subject_id', subjectId)
        .or('is_deleted.eq.false,is_deleted.is.null');

      if (assessmentLessonIds.length) {
        resultsQuery = resultsQuery.or(
          `status.eq.assessment_terminated,lesson_id.in.(${assessmentLessonIds.join(',')})`,
        );
      } else {
        resultsQuery = resultsQuery.filter(
          'status',
          'eq',
          'assessment_terminated',
        );
      }

      const { data: results, error } = await resultsQuery;

      if (error) {
        logger.error('❌ Error checking PAL assessment history:', error);
        return false;
      }

      const resultRows = results ?? [];
      if (
        resultRows.some(
          (result) =>
            (result.status as string | null) === 'assessment_terminated',
        )
      ) {
        return true;
      }

      const assessmentLessonIdSet = new Set(assessmentLessonIds);
      const systemExitAssessmentLessonIds = new Set(
        resultRows
          .filter(
            (result) =>
              result.status === 'system_exit' &&
              !!result.lesson_id &&
              assessmentLessonIdSet.has(result.lesson_id),
          )
          .map((result) => result.lesson_id),
      );

      if (systemExitAssessmentLessonIds.size >= 2) {
        return true;
      }

      return resultRows.some(
        (result) =>
          result.status !== 'system_exit' &&
          !!result.lesson_id &&
          assessmentLessonIdSet.has(result.lesson_id),
      );
    } catch (error) {
      logger.error('❌ Error checking PAL assessment history:', error);
      return false;
    }
  }
}
