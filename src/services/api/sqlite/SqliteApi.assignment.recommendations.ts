import {
  LIDO_ASSESSMENT,
  LeaderboardRewards,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import Course from '../../../models/Course';
import Lesson from '../../../models/Lesson';
import { readAssignmentCartFromStorage } from '../../../teachers-module/pages/AssignmentCartStorage';
import logger from '../../../utility/logger';
import { AssignmentCartData } from '../ServiceApi';
import { SqliteApiAssignmentSchoolLookups } from './SqliteApi.assignment.schoolLookups';

export class SqliteApiAssignmentRecommendations extends SqliteApiAssignmentSchoolLookups {
  [key: string]: any;
  async getRecommendedLessons(
    studentId: string,
    classId?: string,
  ): Promise<TableTypes<'lesson'>[]> {
    await this.ensureInitialized();
    // This Query will give last played lessons
    const lastPlayedLessonsQuery = `
  WITH
  get_user_courses as (
    select
      c.*,
      c.id as course_id,
      sort_index as course_index
    from
      ${classId ? TABLES.ClassCourse : TABLES.UserCourse} as u
      join ${TABLES.Course} as c
    on
      course_id=c.id
      and ${classId ? `class_id = '${classId}'` : `user_id = '${studentId}'`}
  ),
  course_details AS (
    SELECT
      c.name AS chapter_name,
      l.name AS lesson_name,
      course_index,
      c.course_id,
      c.id AS chapter_id,
      l.id AS lesson_id,
      c.sort_index AS chapter_index,
      cl.sort_index AS lesson_index,
      l.cocos_subject_code,
      l.cocos_chapter_code,
      l.cocos_lesson_id,
      l.lido_lesson_id,
      l.image,
      l.outcome,
      l.plugin_type,
      l.status,
      l.created_by,
      l.subject_id,
      l.target_age_from,
      l.target_age_to,
      l.language_id,
      l.created_at,
      l.updated_at,
      l.is_deleted,
      l.color
    FROM
      ${TABLES.Lesson} l
      JOIN ${TABLES.ChapterLesson} cl ON l.id = cl.lesson_id
      JOIN ${TABLES.Chapter} c ON cl.chapter_id = c.id
      JOIN get_user_courses co on co.course_id = c.course_id
    WHERE
      l.is_deleted = 0
      AND cl.is_deleted = 0
      AND c.is_deleted = 0
    ORDER BY
      c.course_id,
      chapter_index,
      lesson_index
  ),
  last_played_lessons AS (
    SELECT
      cd.*,
      (
        SELECT
          l.lesson_id
        FROM
          course_details l
        WHERE
          l.chapter_id = cd.chapter_id
          AND l.lesson_index > cd.lesson_index
        ORDER BY
          l.lesson_index
        LIMIT
          1
      ) AS next_lesson_id
    from
      (
        SELECT
          c.*,
          r.id,
          r.assignment_id,
          r.score,
          ROW_NUMBER() OVER (
            PARTITION BY
              r.student_id,
              c.course_id
            ORDER BY
              r.updated_at DESC
          ) AS rn
        FROM
          result r,
          course_details c
        where
          r.lesson_id = c.lesson_id
          and r.student_id = '${studentId}'
      ) as cd
    where
      rn = 1
  ),
  next_played_lesson as (
    select
      lpl.next_lesson_id,
      cd.*
    FROM
      last_played_lessons lpl,
      course_details as cd
    where
      lpl.chapter_id = cd.chapter_id
      and lpl.next_lesson_id = cd.lesson_id
  ),
  not_played_courses as (
    SELECT
      cd.course_id
    FROM
      course_details cd
    WHERE
      NOT EXISTS (
        SELECT
          1
        FROM
          last_played_lessons lpl
        WHERE
          cd.course_id = lpl.course_id
      )
    GROUP BY
      cd.course_id -- Ensures only one row per course_id
  ),
  played_with_first_lesson as (
    SELECT distinct
      c.*
    FROM
      (
        SELECT
          *
        FROM
          course_details
        WHERE
          lesson_index = 0
          AND chapter_index = 0
      ) c,
      not_played_courses n
    WHERE
      NOT EXISTS (
        SELECT
          1
        FROM
          last_played_lessons lpl
        WHERE
          c.course_id = lpl.course_id
      )
    ORDER BY
      c.course_id,
      c.chapter_name,
      c.lesson_name
  )
      select
  chapter_name,
  lesson_name,
  course_id,
  course_index,
  lesson_id as id,
  lesson_name as name,
  cocos_subject_code,
  cocos_chapter_code,
  cocos_lesson_id,
  lido_lesson_id,
  image,
  outcome,
  plugin_type,
  status,
  created_by,
  subject_id,
  target_age_from,
  target_age_to,
  language_id,
  created_at,
  updated_at,
  is_deleted,
  color
from
  last_played_lessons
union all
select
  chapter_name,
  lesson_name,
  course_id,
  course_index,
  lesson_id as id,
  lesson_name as name,
  cocos_subject_code,
  cocos_chapter_code,
  cocos_lesson_id,
  lido_lesson_id,
  image,
  outcome,
  plugin_type,
  status,
  created_by,
  subject_id,
  target_age_from,
  target_age_to,
  language_id,
  created_at,
  updated_at,
  is_deleted,
  color
from
  played_with_first_lesson
union all
select
  chapter_name,
  lesson_name,
  course_id,
  course_index,
  next_lesson_id as id,
  lesson_name as name,
  cocos_subject_code,
  cocos_chapter_code,
  cocos_lesson_id,
  lido_lesson_id,
  image,
  outcome,
  plugin_type,
  status,
  created_by,
  subject_id,
  target_age_from,
  target_age_to,
  language_id,
  created_at,
  updated_at,
  is_deleted,
  color
from
  next_played_lesson
order by
  course_index,
  course_id,
  chapter_name,
  lesson_name;
  `;
    const res = await this._db?.query(lastPlayedLessonsQuery);
    if (!res) {
      return [];
    }
    let listOfLessons = res.values as TableTypes<'lesson'>[];
    return listOfLessons;
  }

  async searchLessons(searchString: string): Promise<TableTypes<'lesson'>[]> {
    await this.ensureInitialized();
    if (!this._db) return [];
    const res: TableTypes<'lesson'>[] = [];

    try {
      const serverResults = await this._serverApi.searchLessons(searchString);
      res.push(...serverResults);
    } catch (error) {
      logger.error('🚀 ~ SqliteApi ~ searchLessons ~ error:', error);
    }

    if (res.length > 0) return res;
    const limit = 20;
    const nameSearchQuery = `
        SELECT *
        FROM lesson
        WHERE name LIKE ?
        LIMIT ?;
`;
    const nameResults = await this._db.query(nameSearchQuery, [
      `%${searchString}%`,
      limit,
    ]);
    if (nameResults.values) res.push(...nameResults.values);
    logger.info('🚀 ~ SqliteApi ~ searchLessons ~ dat:', nameResults);
    const outcomeSearchQuery = `
    SELECT *
    FROM lesson
    WHERE outcome LIKE ?
    LIMIT ?;
`;
    const outcomeLength = limit - res.length;
    const outcomeResults = await this._db.query(outcomeSearchQuery, [
      `%${searchString}%`,
      outcomeLength,
    ]);
    if (outcomeResults.values) res.push(...outcomeResults.values);
    logger.info('🚀 ~ SqliteApi ~ searchLessons ~ dat1:', outcomeResults);
    return res;
  }

  async getChapterByLesson(
    lessonId: string,
    classId?: string,
    userId?: string,
  ): Promise<String | undefined> {
    await this.ensureInitialized();
    try {
      const class_course = classId
        ? await this.getCoursesForClassStudent(classId)
        : await this.getCoursesForParentsStudent(userId ?? '');
      const res = await this._db?.query(
        `SELECT cl.lesson_id, c.course_id ,cl.chapter_id
         FROM ${TABLES.ChapterLesson} cl
         JOIN ${TABLES.Chapter} c ON cl.chapter_id = c.id
         WHERE cl.lesson_id = "${lessonId}" AND cl.is_deleted = 0`,
      );
      if (!res || !res.values || res.values.length < 1) return;
      const classCourseIds = new Set(class_course.map((course) => course.id));
      const matchedLesson = res.values.find((lesson: any) =>
        classCourseIds.has(lesson.course_id),
      );

      return matchedLesson
        ? matchedLesson.chapter_id
        : res.values[0].chapter_id;
    } catch (error) {
      logger.error('Error fetching chapter by IDs:', error);
      return;
    }
  }

  async getResultByAssignmentIds(
    assignmentIds: string[], // Expect an array of strings
  ): Promise<TableTypes<'result'>[] | undefined> {
    await this.ensureInitialized();
    if (!assignmentIds || assignmentIds.length === 0) return;

    const placeholders = assignmentIds.map(() => '?').join(', ');
    const query = `SELECT *
      FROM ${TABLES.Result}
      WHERE assignment_id IN (${placeholders});`;

    const res = await this._db?.query(query, assignmentIds);

    if (!res || !res.values || res.values.length < 1) return;
    return res.values;
  }

  async getResultByAssignmentIdsForCurrentClassMembers(
    assignmentIds: string[],
    classId: string,
  ): Promise<TableTypes<'result'>[] | undefined> {
    await this.ensureInitialized();
    if (!assignmentIds || assignmentIds.length === 0) return;

    const placeholders = assignmentIds.map(() => '?').join(', ');
    const query = `
      SELECT r.*
      FROM ${TABLES.Result} r
      INNER JOIN ${TABLES.ClassUser} cu ON r.student_id = cu.user_id
      WHERE r.assignment_id IN (${placeholders})
        AND cu.class_id = ?
        AND cu.is_deleted = 0
        AND cu.role = 'student'
        AND r.is_deleted = 0;
    `;

    const res = await this._db?.query(query, [...assignmentIds, classId]);

    if (!res || !res.values || res.values.length < 1) return;
    return res.values;
  }

  async getAssignmentUserByAssignmentIds(
    assignmentIds: string[],
  ): Promise<TableTypes<'assignment_user'>[]> {
    await this.ensureInitialized();
    // If there are no assignment IDs, return an empty array immediately.
    if (!assignmentIds || assignmentIds.length === 0) {
      return [];
    }

    // Create a comma-separated list of placeholders for the query.
    const placeholders = assignmentIds.map(() => '?').join(', ');

    // Construct the SQL query using the placeholders.
    const query = `
      SELECT *
      FROM ${TABLES.Assignment_user}
      WHERE assignment_id IN (${placeholders});
    `;

    // Execute the query. (Assuming this._db.query returns an object with a 'values' property)
    const res = await this._db?.query(query, assignmentIds);

    // If no results were returned, return an empty array.
    if (!res || !res.values || res.values.length < 1) {
      return [];
    }

    // Otherwise, return the results.
    return res.values;
  }

  async getStudentLastTenResults(
    studentId: string,
    courseIds: string[],
    assignmentIds: string[],
    classId: string,
  ): Promise<TableTypes<'result'>[]> {
    await this.ensureInitialized();
    const assignmentholders = assignmentIds.map(() => '?').join(', ');
    const courseholders = courseIds.map(() => '?').join(', ');
    const res = await this._db?.query(
      `
        WITH base_results AS (
        SELECT r.*, l.plugin_type
        FROM ${TABLES.Result} r
        JOIN ${TABLES.Lesson} l ON l.id = r.lesson_id
        WHERE r.student_id = ?
          AND r.course_id IN (${courseholders})
          AND r.class_id = ?
          AND r.is_deleted = false
      ),

      -- LIDO lessons → average score per lesson (same lesson counted once)
        lido_results AS (
          SELECT
            lesson_id,
            assignment_id,
            AVG(score) AS score,
            MAX(created_at) AS created_at
          FROM base_results
          WHERE plugin_type = '${LIDO_ASSESSMENT}'
          GROUP BY lesson_id, assignment_id
        ),

        -- Non-LIDO lessons → return ALL attempts (duplicate rows allowed)
        non_lido_results AS (
          SELECT
            lesson_id,
            assignment_id,
            score,
            created_at
          FROM base_results
          WHERE plugin_type <> '${LIDO_ASSESSMENT}'
            OR plugin_type IS NULL
        ),
      -- Combine aggregated lessons
      final_results AS (
        SELECT * FROM lido_results
        UNION ALL
        SELECT * FROM non_lido_results
      ),

      -- Last 5 non-assignments
      non_assignment AS (
        SELECT *
        FROM final_results
        WHERE assignment_id IS NULL
        ORDER BY created_at DESC
        LIMIT 5
      ),

      -- Last 5 assignments
      assignment AS (
        SELECT *
        FROM final_results
        WHERE assignment_id IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 5
      )

      SELECT *
      FROM non_assignment
      UNION ALL
      SELECT *
      FROM assignment
      ORDER BY created_at DESC;

    `,
      [studentId, ...courseIds, classId],
    );
    return res?.values ?? [];
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
    await this.ensureInitialized();
    const courseholders = courseIds.map(() => '?').join(', ');
    let query = `SELECT * FROM ${TABLES.Assignment}
             WHERE class_id = ?
             AND created_at BETWEEN ? AND ?
             AND course_id IN (${courseholders})
             AND is_deleted = false`;

    const params: any[] = [classId, endDate, startDate, ...courseIds];
    if (isClassWise) {
      query += ` AND is_class_wise = 1`;
    }
    if (!allAssignments) {
      if (isLiveQuiz) {
        query += ` AND type = 'liveQuiz'`;
      } else {
        query += ` AND type != 'liveQuiz'`;
      }
    }
    query += ` ORDER BY created_at DESC`;
    const res = await this._db?.query(query, params);
    return res?.values;
  }

  async getLastAssignmentsForRecommendations(
    classId: string,
  ): Promise<TableTypes<'assignment'>[] | undefined> {
    await this.ensureInitialized();
    const query = `WITH RankedAssignments AS (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY course_id ORDER BY created_at DESC) AS rn
    FROM ${TABLES.Assignment}
    WHERE class_id = '${classId}'
      AND is_deleted = 0
    )
    SELECT *
    FROM RankedAssignments
    WHERE rn = 1
    ORDER BY created_at DESC;`;

    const res = await this._db?.query(query);

    if (!res || !res.values || res.values.length < 1) return;
    return res.values;
  }

  updateRewardsForStudent(studentId: string, unlockReward: LeaderboardRewards) {
    throw new Error('Method not implemented.');
  }

  async getUserAssignmentCart(
    userId: string,
  ): Promise<AssignmentCartData | undefined> {
    const cart = readAssignmentCartFromStorage(userId);
    return cart;
  }
}
