import { DBSQLiteValues } from '@capacitor-community/sqlite';
import { COURSES, TABLES, TableTypes } from '../../../common/constants';
import logger from '../../../utility/logger';

import { SqliteApiWhatsApp } from './SqliteApi.whatsapp';
export interface SqliteApiPal {
  [key: string]: any;
}
export class SqliteApiPal extends SqliteApiWhatsApp {
  async isStudentPlayedPalLesson(
    studentId: string,
    courseId: string,
  ): Promise<boolean> {
    try {
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

      const assessmentLessonsQuery = `
        SELECT DISTINCT lesson_id, language_id
        FROM subject_lesson
        WHERE subject_id = ?
          AND COALESCE(is_deleted, 0) = 0
          AND lesson_id IS NOT NULL;
      `;
      const assessmentLessonsRes = await this.executeQuery(
        assessmentLessonsQuery,
        [subjectId],
      );
      const assessmentLessonIds = Array.from(
        new Set(
          (langId &&
          (
            ((assessmentLessonsRes as DBSQLiteValues | undefined)?.values ??
              []) as {
              lesson_id?: string | null;
              language_id?: string | null;
            }[]
          ).some((lesson) => lesson.language_id === langId)
            ? (
                ((assessmentLessonsRes as DBSQLiteValues | undefined)?.values ??
                  []) as {
                  lesson_id?: string | null;
                  language_id?: string | null;
                }[]
              ).filter((lesson) => lesson.language_id === langId)
            : (
                ((assessmentLessonsRes as DBSQLiteValues | undefined)?.values ??
                  []) as {
                  lesson_id?: string | null;
                  language_id?: string | null;
                }[]
              ).filter((lesson) => lesson.language_id == null)
          )
            .map((lesson) => lesson.lesson_id)
            .filter((lessonId): lessonId is string => !!lessonId),
        ),
      );

      const params: string[] = [studentId, subjectId];
      const assessmentLessonFilter = assessmentLessonIds.length
        ? `OR lesson_id IN (${assessmentLessonIds.map(() => '?').join(',')})`
        : '';
      params.push(...assessmentLessonIds);

      const resultQuery = `
        SELECT lesson_id, status
        FROM result
        WHERE student_id = ?
          AND subject_id = ?
          AND COALESCE(is_deleted, 0) = 0
          AND (status = 'assessment_terminated' ${assessmentLessonFilter});
      `;

      const resultRes = await this.executeQuery(resultQuery, params);
      const rows = ((resultRes as DBSQLiteValues | undefined)?.values ??
        []) as {
        lesson_id?: string | null;
        status?: string | null;
      }[];

      if (rows.some((result) => result.status === 'assessment_terminated')) {
        return true;
      }

      const assessmentLessonIdSet = new Set(assessmentLessonIds);
      const systemExitAssessmentLessonIds = new Set(
        rows
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

      return rows.some(
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

  async getDomainsBySubjectAndFramework(
    subjectId: string,
    frameworkId: string,
  ): Promise<TableTypes<'domain'>[]> {
    await this.ensureInitialized();
    const res = await this._db?.query(
      `select * from ${TABLES.Domain} where subject_id = ? and framework_id = ? and (is_deleted = 0)`,
      [subjectId, frameworkId],
    );
    return res?.values ?? [];
  }

  async getCompetenciesByDomainIds(
    domainIds: string[],
  ): Promise<TableTypes<'competency'>[]> {
    await this.ensureInitialized();
    if (!domainIds || domainIds.length === 0) return [];
    const placeholders = domainIds.map(() => '?').join(',');
    const res = await this._db?.query(
      `select * from ${TABLES.Competency} where domain_id in (${placeholders}) and (is_deleted = 0)`,
      domainIds,
    );
    return res?.values ?? [];
  }

  async getOutcomesByCompetencyIds(
    competencyIds: string[],
  ): Promise<TableTypes<'outcome'>[]> {
    await this.ensureInitialized();
    if (!competencyIds || competencyIds.length === 0) return [];
    const placeholders = competencyIds.map(() => '?').join(',');
    const res = await this._db?.query(
      `select * from ${TABLES.Outcome} where competency_id in (${placeholders}) and (is_deleted = 0)`,
      competencyIds,
    );
    return res?.values ?? [];
  }

  async getSkillsByOutcomeIds(
    outcomeIds: string[],
  ): Promise<TableTypes<'skill'>[]> {
    await this.ensureInitialized();
    if (!outcomeIds || outcomeIds.length === 0) return [];
    const placeholders = outcomeIds.map(() => '?').join(',');
    const res = await this._db?.query(
      `select * from ${TABLES.Skill} where outcome_id in (${placeholders}) and (is_deleted = 0)`,
      outcomeIds,
    );
    return res?.values ?? [];
  }

  async getResultsBySkillIds(
    studentId: string,
    skillIds: string[],
  ): Promise<TableTypes<'result'>[]> {
    await this.ensureInitialized();
    if (!skillIds || skillIds.length === 0) return [];
    const placeholders = skillIds.map(() => '?').join(',');
    const res = await this._db?.query(
      `select * from ${TABLES.Result} where student_id = ? and skill_id in (${placeholders}) and (is_deleted = 0)`,
      [studentId, ...skillIds],
    );
    return res?.values ?? [];
  }

  async getSkillByLessonIdentifier(
    lessonIdentifier: string,
  ): Promise<TableTypes<'skill'>[]> {
    await this.ensureInitialized();
    if (!lessonIdentifier) return [];

    const skillLessonRes = await this._db?.query(
      `
      SELECT DISTINCT sl.skill_id
      FROM ${TABLES.Lesson} l
      INNER JOIN ${TABLES.SkillLesson} sl
        ON sl.lesson_id = l.id
        AND COALESCE(sl.is_deleted, 0) = 0
      WHERE (l.id = ? OR l.cocos_lesson_id = ? OR l.lido_lesson_id = ?)
        AND COALESCE(l.is_deleted, 0) = 0
      ORDER BY
        CASE
          WHEN l.id = ? THEN 0
          WHEN l.lido_lesson_id = ? THEN 1
          WHEN l.cocos_lesson_id = ? THEN 2
          ELSE 3
        END,
        sl.sort_index ASC,
        coalesce(datetime(l.updated_at), datetime(l.created_at)) DESC,
        l.updated_at DESC,
        l.created_at DESC
      `,
      [
        lessonIdentifier,
        lessonIdentifier,
        lessonIdentifier,
        lessonIdentifier,
        lessonIdentifier,
        lessonIdentifier,
      ],
    );

    const skillIds = Array.from(
      new Set(
        (skillLessonRes?.values ?? [])
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
    await this.ensureInitialized();
    if (!skillIds || skillIds.length === 0) return [];

    const student = this.currentStudent;
    let langId = student?.language_id;
    const localeId = student?.locale_id;
    if (languageCode) {
      const languageRes = await this._db?.query(
        `
        SELECT id
        FROM ${TABLES.Language}
        WHERE LOWER(code) = ?
          AND is_deleted = 0
        LIMIT 1;
        `,
        [languageCode.toLowerCase()],
      );
      langId = languageRes?.values?.[0]?.id ?? langId;
    }

    const placeholders = skillIds.map(() => '?').join(',');
    const res = await this._db?.query(
      `
      SELECT *
      FROM ${TABLES.SkillLesson}
      WHERE skill_id IN (${placeholders})
        AND is_deleted = 0
        AND (
          (language_id IS NULL AND locale_id IS NULL)
          ${
            langId ? `OR (language_id = "${langId}" AND locale_id IS NULL)` : ''
          }
          ${
            localeId
              ? `OR (language_id IS NULL AND locale_id = "${localeId}")`
              : ''
          }
          ${
            langId && localeId
              ? `OR (language_id = "${langId}" AND locale_id = "${localeId}")`
              : ''
          }
        )
      ORDER BY sort_index ASC
      `,
      skillIds,
    );
    const skillLessons = res?.values ?? [];
    if (skillLessons.length) return skillLessons;
    const fallbackRes = await this._db?.query(
      `
      SELECT *
      FROM ${TABLES.SkillLesson}
      WHERE skill_id IN (${placeholders})
        AND is_deleted = 0
      ORDER BY sort_index ASC
      `,
      skillIds,
    );
    const fallbackLessons = fallbackRes?.values ?? [];
    return fallbackLessons;
  }

  async getSkillRelationsByTargetIds(
    targetSkillIds: string[],
  ): Promise<TableTypes<'skill_relation'>[]> {
    await this.ensureInitialized();
    if (!targetSkillIds || targetSkillIds.length === 0) return [];
    const placeholders = targetSkillIds.map(() => '?').join(',');
    const res = await this._db?.query(
      `select * from ${TABLES.SkillRelation} where target_skill_id in (${placeholders}) and (is_deleted = 0)`,
      targetSkillIds,
    );
    return res?.values ?? [];
  }

  async getSkillById(
    skillId: string,
  ): Promise<TableTypes<'skill'> | undefined> {
    await this.ensureInitialized();
    const res = await this._db?.query(
      `
      SELECT *
      FROM ${TABLES.Skill}
      WHERE id = ?
        AND is_deleted = 0
    `,
      [skillId],
    );

    return res?.values && res.values.length > 0 ? res.values[0] : undefined;
  }

  async getSubjectBySkillId(
    skillId: string,
  ): Promise<TableTypes<'subject'> | undefined> {
    await this.ensureInitialized();
    if (!skillId) return undefined;

    const res = await this._db?.query(
      `
      SELECT subject.*
      FROM  skill
      INNER JOIN  outcome
        ON outcome.id = skill.outcome_id
        AND outcome.is_deleted = 0
      INNER JOIN  competency
        ON competency.id = outcome.competency_id
        AND competency.is_deleted = 0
      INNER JOIN  domain
        ON domain.id = competency.domain_id
        AND domain.is_deleted = 0
      INNER JOIN  subject
        ON subject.id = domain.subject_id
        AND subject.is_deleted = 0
      WHERE skill.id = ?
        AND skill.is_deleted = 0
      LIMIT 1
    `,
      [skillId],
    );

    return res?.values && res.values.length > 0 ? res.values[0] : undefined;
  }
}
