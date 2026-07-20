import { DBSQLiteValues } from '@capacitor-community/sqlite';
import { v4 as uuidv4 } from 'uuid';
import {
  COURSES,
  LIDO_ASSESSMENT,
  MUTATE_TYPES,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import {
  AssignmentBatchGroupRow,
  AssignmentDateRangeData,
  OpsStudentPerformanceBandRow,
  OpsStudentPerformanceBandsParams,
} from '../ServiceApi';

import { SqliteApiSchool } from './SqliteApi.school';
export interface SqliteApiAssignment {
  [key: string]: any;
}
export class SqliteApiAssignment extends SqliteApiSchool {
  async getStudentProgress(studentId: string): Promise<
    Record<
      string,
      (TableTypes<'result'> & {
        lesson_name?: string;
        chapter_name?: string;
      })[]
    >
  > {
    await this.ensureInitialized();
    const query = `
      SELECT r.*, l.name AS lesson_name, c.course_id AS course_id, c.name AS chapter_name
      FROM ${TABLES.Result} r
      JOIN ${TABLES.Lesson} l ON r.lesson_id = l.id
      JOIN ${TABLES.ChapterLesson} cl ON l.id = cl.lesson_id and r.chapter_id=cl.chapter_id
      JOIN ${TABLES.Chapter} c ON cl.chapter_id = c.id and r.course_id=c.course_id
      WHERE r.student_id = '${studentId}'
    `;
    const res = await this._db?.query(query);
    const resultMap: Record<
      string,
      (TableTypes<'result'> & { lesson_name?: string; chapter_name?: string })[]
    > = {};
    if (res && res.values) {
      res.values.forEach((result) => {
        const courseId = result.course_id;
        if (!resultMap[courseId]) {
          resultMap[courseId] = [];
        }
        resultMap[courseId].push(
          result as TableTypes<'result'> & {
            lesson_name?: string;
            chapter_name?: string;
          },
        );
      });
    }
    return resultMap;
  }
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
      const matchedLesson = res.values.find((lesson) =>
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
  async getLessonsBylessonIds(
    lessonIds: string[], // Expect an array of strings
  ): Promise<TableTypes<'lesson'>[] | undefined> {
    await this.ensureInitialized();
    if (!lessonIds || lessonIds.length === 0) return;

    const placeholders = lessonIds.map(() => '?').join(', ');
    const query = `SELECT *
      FROM ${TABLES.Lesson}
      WHERE id IN (${placeholders}) AND is_deleted = 0;`;

    const res = await this._db?.query(query, lessonIds);

    if (!res || !res.values || res.values.length < 1) return;
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

  async getStudentResultByDate(
    studentId: string,
    courseIds: string[],
    startDate: string,
    endDate: string,
    classId: string,
  ): Promise<TableTypes<'result'>[] | undefined> {
    await this.ensureInitialized();
    const courseholders = courseIds.map(() => '?').join(', ');

    const query = `
    SELECT *
    FROM ${TABLES.Result}
    WHERE student_id = ?
    AND course_id IN (${courseholders})
    AND class_id = ?
    AND created_at BETWEEN ? AND ?
    ORDER BY created_at DESC;
  `;

    const params = [studentId, ...courseIds, classId, startDate, endDate];

    const res = await this._db?.query(query, params);

    if (!res || !res.values || res.values.length < 1) return;
    return res.values;
  }
  async getStudentPlayStatus(
    studentId: string,
    classId: string,
  ): Promise<{ hasPlayed: boolean; lastPlayedAt?: string }> {
    await this.ensureInitialized();
    const query = `
      SELECT created_at
      FROM ${TABLES.Result}
      WHERE student_id = ?
      AND class_id = ?
      AND is_deleted = 0
      ORDER BY created_at DESC
      LIMIT 1;
    `;
    const params = [studentId, classId];
    const res = await this._db?.query(query, params);
    const firstRow = res?.values?.[0] as { created_at?: string } | undefined;

    if (!firstRow?.created_at) {
      return { hasPlayed: false };
    }

    return { hasPlayed: true, lastPlayedAt: firstRow.created_at };
  }
  async getOpsStudentPerformanceBands(
    params: OpsStudentPerformanceBandsParams,
  ): Promise<OpsStudentPerformanceBandRow[]> {
    logger.warn(
      'getOpsStudentPerformanceBands is not supported in SQLite mode',
    );
    return this._serverApi.getOpsStudentPerformanceBands(params);
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
  async getTeachersForClass(
    classId: string,
  ): Promise<TableTypes<'user'>[] | undefined> {
    await this.ensureInitialized();
    const query = `
    SELECT user.*
    FROM ${TABLES.ClassUser} AS cu
    JOIN ${TABLES.User} AS user ON cu.user_id= user.id
    WHERE cu.class_id = "${classId}" and cu.role = '${RoleType.TEACHER}' and cu.is_deleted = false;
  `;
    const res = await this._db?.query(query);
    return res?.values ?? [];
  }
  async getUserByEmail(email: string): Promise<TableTypes<'user'> | undefined> {
    return this._serverApi.getUserByEmail(email);
  }
  async getUserByPhoneNumber(
    phone: string,
  ): Promise<TableTypes<'user'> | undefined> {
    return this._serverApi.getUserByPhoneNumber(phone);
  }
  async addTeacherToClass(
    schoolId: string,
    classId: string,
    user: TableTypes<'user'>,
  ): Promise<void> {
    const classUserId = uuidv4();
    const classUser = {
      id: classUserId,
      class_id: classId,
      user_id: user.id,
      role: RoleType.TEACHER,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
    };

    await this.executeQuery(
      `
    INSERT INTO class_user (id, class_id, user_id, role, created_at, updated_at, is_deleted)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [
        classUser.id,
        classUser.class_id,
        classUser.user_id,
        classUser.role,
        classUser.created_at,
        classUser.updated_at,
        classUser.is_deleted,
      ],
    );

    await this.updatePushChanges(
      TABLES.ClassUser,
      MUTATE_TYPES.INSERT,
      classUser,
    );
    // var user_doc = await this._serverApi.getUserByDocId(userId);
    if (user) {
      await this.executeQuery(
        `
        INSERT INTO user (id, name, age, gender, avatar, image, curriculum_id, language_id,created_at,updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO NOTHING;
        `,
        [
          user.id,
          user.name,
          user.age,
          user.gender,
          user.avatar,
          user.image,
          user.curriculum_id,
          user.language_id,
          user.created_at,
          user.updated_at,
        ],
      );
    }
  }

  async checkUserIsManagerOrDirector(
    schoolId: string,
    userId: string,
  ): Promise<boolean> {
    // Check if user is PROGRAM_MANAGER, OPERATIONAL_DIRECTOR, or FIELD_COORDINATOR in school_user
    const result = await this.executeQuery(
      `SELECT * FROM school_user
     WHERE school_id = ? AND user_id = ?
     AND role IN (?, ?, ?)
     AND is_deleted = false`,
      [
        schoolId,
        userId,
        RoleType.PROGRAM_MANAGER,
        RoleType.OPERATIONAL_DIRECTOR,
        RoleType.FIELD_COORDINATOR,
      ],
    );

    if (result?.values && result.values.length > 0) {
      return true;
    }
    return false;
  }

  async checkUserExistInSchool(
    schoolId: string,
    userId: string,
  ): Promise<boolean> {
    // Check if the user is present in school_user but not as a parent
    const schoolUserResult = await this.executeQuery(
      `SELECT * FROM school_user
     WHERE school_id = ? AND user_id = ?
     AND role != ?
     AND is_deleted = false`,
      [schoolId, userId, RoleType.PARENT],
    );

    if (schoolUserResult?.values && schoolUserResult.values.length > 0) {
      return true;
    }

    // Step 2: Fetch all classes for the given school
    const classResult = await this.executeQuery(
      `SELECT id FROM class
     WHERE school_id = ?
     AND is_deleted = false`,
      [schoolId],
    );

    if (!classResult?.values || classResult.values.length === 0) {
      return false;
    }
    const classIds = classResult.values.map((row: { id: string }) => row.id);
    // Step 3: Check if the user is a teacher in any of these classes
    const placeholders = classIds.map(() => '?').join(', ');
    const teacherResult = await this.executeQuery(
      `SELECT * FROM class_user
       WHERE class_id IN (${placeholders})
       AND user_id = ?
       AND role = ?
       AND is_deleted = false`,
      [...classIds, userId, RoleType.TEACHER],
    );

    if (teacherResult?.values && teacherResult.values.length > 0) {
      return true;
    }
    return false;
  }
  async checkTeacherExistInClass(
    schoolId: string,
    classId: string,
    userId: string,
  ): Promise<boolean> {
    // Check if the user is present in school_user but not as a parent
    const schoolUserResult = await this.executeQuery(
      `SELECT * FROM school_user
     WHERE school_id = ? AND user_id = ?
     AND role != ?
     AND is_deleted = false`,
      [schoolId, userId, RoleType.PARENT],
    );

    if (schoolUserResult?.values && schoolUserResult.values.length > 0) {
      return true;
    }
    // Step 2: Check if the user is a teacher in this class
    const result = await this.executeQuery(
      `SELECT * FROM class_user
      WHERE class_id = ?
      AND user_id = ?
      AND role = ?
      AND is_deleted = false`,
      [classId, userId, RoleType.TEACHER],
    );
    return !!(result?.values && result.values.length > 0);
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
    await this.ensureInitialized();
    const query = `
      SELECT *
      FROM ${TABLES.Assignment}
      WHERE created_by = '${userId}'
        AND (class_id = '${classId}')
        AND created_at >= '${startDate}T00:00:00'
        AND created_at <= '${endDate}T23:59:59.999'
      ORDER BY is_class_wise DESC, created_at ASC;
    `;
    const res = await this._db?.query(query);
    const assignments = res?.values ?? [];

    const classWiseAssignments = assignments.filter(
      (assignment) => assignment.is_class_wise === 1,
    );
    const individualAssignments = assignments.filter(
      (assignment) => assignment.is_class_wise === 0,
    );

    return { classWiseAssignments, individualAssignments };
  }
  async getAssignmentDateRangeDataForClassAndSchool(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<AssignmentDateRangeData> {
    await this.ensureInitialized();

    const query = `
      SELECT
        *
      FROM ${TABLES.Assignment}
      WHERE created_by = ?
        AND created_at >= ?
        AND created_at <= ?
        AND (is_deleted = 0 OR is_deleted = false OR is_deleted IS NULL)
      ORDER BY created_at ASC;
    `;

    try {
      const res = await this.executeQuery(query, [userId, startDate, endDate]);

      const assignments = (res?.values ?? []) as TableTypes<'assignment'>[];
      const groupedByBatch = new Map<string, AssignmentBatchGroupRow>();

      assignments.forEach((assignment) => {
        const batchId = assignment.batch_id ?? null;
        const key = batchId ?? '__null_batch_id__';
        const existing = groupedByBatch.get(key);

        if (!existing) {
          groupedByBatch.set(key, {
            batchId,
            assignmentCount: 1,
            latestCreatedAt: assignment.created_at ?? null,
          });
          return;
        }

        existing.assignmentCount += 1;
        if (
          assignment.created_at &&
          (!existing.latestCreatedAt ||
            assignment.created_at > existing.latestCreatedAt)
        ) {
          existing.latestCreatedAt = assignment.created_at;
        }
      });

      const batchGroups = Array.from(groupedByBatch.values()).sort((a, b) => {
        const aTime = a.latestCreatedAt
          ? new Date(a.latestCreatedAt).getTime()
          : Number.NEGATIVE_INFINITY;
        const bTime = b.latestCreatedAt
          ? new Date(b.latestCreatedAt).getTime()
          : Number.NEGATIVE_INFINITY;
        return aTime - bTime;
      });

      return { assignments, batchGroups };
    } catch (error) {
      logger.error(
        'Error fetching assignment date range data from sqlite:',
        error,
      );
      return { assignments: [], batchGroups: [] };
    }
  }

  async getCoinAndStreakCount(
    userId: string,
    classId: string,
    schoolId: string,
  ): Promise<{ coins: number; streak: number } | undefined> {
    logger.warn('coming here....................');
    await this.ensureInitialized();
    const query = `
    SELECT coins , streak
    FROM ${TABLES.UserAchivements}
    where user_id = ?
    and (is_deleted = 0 OR is_deleted = false OR is_deleted IS NULL)
    ORDER BY created_at DESC`;

    try {
      const res = await this._db?.query(query, [userId]);
      logger.warn('data or result', res?.values);
      if (res?.values && res.values.length > 0) {
        const { coins, streak } = res.values[0];
        return { coins, streak };
      }
    } catch (error) {
      logger.error('Error fetching coin and streak count:', error);
    }
    return undefined;
  }

  async updateCoins(
    userId: string,
    schoolId: string,
    classId: string,
    coins: number,
    streakIncrement = 0,
  ): Promise<TableTypes<TABLES.UserAchivements>> {
    await this.ensureInitialized();

    const now = new Date().toISOString();
    const coinsToAdd = Number(coins) || 0;
    const streakToAdd = Number(streakIncrement) || 0;

    try {
      const existingRes = await this.executeQuery(
        `
      SELECT *
      FROM ${TABLES.UserAchivements}
      WHERE user_id = ?
        AND (is_deleted = 0 OR is_deleted = false OR is_deleted IS NULL)
      ORDER BY created_at DESC
      LIMIT 1;
      `,
        [userId],
      );

      const existing = existingRes?.values?.[0] as
        | (TableTypes<TABLES.UserAchivements> & { id?: string })
        | undefined;

      if (existing) {
        const updatedCoins = Number(existing.coins ?? 1000) + coinsToAdd;
        const updatedStreak = Number(existing.streak ?? 0) + streakToAdd;

        await this.executeQuery(
          `
        UPDATE ${TABLES.UserAchivements}
        SET coins = ?, streak = ?, updated_at = ?, is_deleted = 0
        WHERE user_id = ?;
        `,
          [updatedCoins, updatedStreak, now, userId],
        );

        const updatedRow = {
          ...existing,
          coins: updatedCoins,
          streak: updatedStreak,
          updated_at: now,
          is_deleted: false,
        } as TableTypes<TABLES.UserAchivements>;

        await this.updatePushChanges(
          TABLES.UserAchivements,
          MUTATE_TYPES.UPDATE,
          updatedRow,
        );

        return updatedRow;
      }

      const id = uuidv4();
      const newRow = {
        id,
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
      } as TableTypes<TABLES.UserAchivements>;

      await this.executeQuery(
        `
      INSERT INTO ${TABLES.UserAchivements}
      (
        id, user_id, program_id, school_id, class_id, coins, streak,
        last_rewarded_week, last_penalty_week, is_deleted, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
        [
          id,
          userId,
          null,
          schoolId,
          classId,
          1000 + coinsToAdd,
          streakToAdd,
          null,
          null,
          0,
          now,
          now,
        ],
      );

      await this.updatePushChanges(
        TABLES.UserAchivements,
        MUTATE_TYPES.INSERT,
        newRow,
      );

      return newRow;
    } catch (error) {
      logger.error('Error updating/inserting user_achievements coins:', error);
      throw error;
    }
  }

  async getTeacherJoinedDate(
    userId: string,
    classId: string,
  ): Promise<TableTypes<'class_user'> | undefined> {
    await this.ensureInitialized();
    const query = `
    SELECT *
    FROM ${TABLES.ClassUser}
    WHERE user_id = $1
    AND role = $2 AND class_id = $3 AND is_deleted = 0
    LIMIT 1`;

    const values = [userId, RoleType.TEACHER, classId];

    try {
      const res = await this._db?.query(query, values);
      if (res?.values) {
        return res.values[0];
      }
    } catch (error) {
      logger.error('Error fetching teacher joined date:', error);
    }

    return undefined;
  }
  async getAssignedStudents(assignmentId: string): Promise<string[]> {
    await this.ensureInitialized();
    //getting the student ids for the individual assignments
    const query = `
    SELECT user_id
    FROM assignment_user
    WHERE assignment_id = '${assignmentId}';
  `;

    try {
      const res = await this._db?.query(query);
      let userIds: string[] = [];

      if (res?.values) {
        userIds = res?.values.map((row: { user_id: string }) => row.user_id);
      }

      return userIds ?? [];
    } catch (error) {
      logger.error('Error fetching user IDs:', error);
      return [];
    }
  }

  async hasPendingAbortedAssessment(
    studentId: string,
    courseId: string,
  ): Promise<boolean> {
    await this.ensureInitialized();

    try {
      const course = await this.getCourse(courseId);
      const subjectId = course?.subject_id;
      if (!subjectId) {
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

      const assessmentLessonsRes = await this.executeQuery(
        `
          SELECT lesson_id, language_id
          FROM subject_lesson
          WHERE subject_id = ?
            AND COALESCE(is_deleted, 0) = 0
        `,
        [subjectId],
      );

      const assessmentLessonRows =
        (assessmentLessonsRes as DBSQLiteValues | undefined)?.values ?? [];
      const languageTrackLessons =
        langId &&
        assessmentLessonRows.some((lesson) => lesson.language_id === langId)
          ? assessmentLessonRows.filter(
              (lesson) => lesson.language_id === langId,
            )
          : assessmentLessonRows.filter((lesson) => lesson.language_id == null);
      const assessmentLessonIds: string[] = [];
      const placeholderParts: string[] = [];
      for (const row of languageTrackLessons) {
        const lessonId = row.lesson_id;
        if (!lessonId) continue;
        assessmentLessonIds.push(lessonId);
        placeholderParts.push('?');
      }

      if (!assessmentLessonIds.length) {
        return false;
      }

      const placeholders = placeholderParts.join(', ');
      const pendingAbortRes = await this.executeQuery(
        `
          SELECT status
          FROM result
          WHERE student_id = ?
            AND assignment_id IS NULL
            AND COALESCE(is_deleted, 0) = 0
            AND lesson_id IN (${placeholders})
          ORDER BY created_at DESC
          LIMIT 1
        `,
        [studentId, ...assessmentLessonIds],
      );

      const latestStatus = ((pendingAbortRes as DBSQLiteValues | undefined)
        ?.values ?? [])[0]?.status;

      return latestStatus === 'system_exit';
    } catch (error) {
      logger.error('❌ Error checking pending aborted assessment:', error);
      return false;
    }
  }
  async getLatestAssessmentGroup(
    classId: string,
    student: TableTypes<'user'>,
    courseId?: string,
  ): Promise<TableTypes<'assignment'>[]> {
    await this.ensureInitialized();
    const nowIso = new Date().toISOString();
    const studentId = student.id;
    const langId = student.language_id;

    /* ==========================================
     * Get latest valid assessment batch
     * ========================================== */
    const latestBatchQuery = `
      SELECT a.batch_id
      FROM assignment a
      LEFT JOIN assignment_user au
        ON a.id = au.assignment_id
        AND au.is_deleted = false
      WHERE a.class_id = '${classId}'
        AND a.course_id = '${courseId}'
        AND a.type = 'assessment'
        AND a.is_deleted = false
        AND a.batch_id IS NOT NULL

        -- Active time window
        AND (
          a.starts_at IS NULL
          OR a.starts_at = ''
          OR datetime(a.starts_at) <= datetime('${nowIso}')
        )
        AND (
          a.ends_at IS NULL
          OR a.ends_at = ''
          OR datetime(a.ends_at) > datetime('${nowIso}')
        )

        -- Assigned to this student
        AND (
          a.is_class_wise = true
          OR au.user_id = '${studentId}'
        )

      ORDER BY a.created_at DESC
      LIMIT 1;
    `;

    const batchRes = await this._db?.query(latestBatchQuery);
    const latestBatchId = batchRes?.values?.[0]?.batch_id;

    if (!latestBatchId) return [];

    const latestBatchLessonQuery = `
      SELECT a.lesson_id
      FROM assignment a
      LEFT JOIN assignment_user au
        ON a.id = au.assignment_id
        AND au.is_deleted = 0
      WHERE a.class_id = ?
        AND a.course_id = ?
        AND a.type = 'assessment'
        AND a.is_deleted = 0
        AND a.batch_id = ?
        AND (
          a.starts_at IS NULL
          OR a.starts_at = ''
          OR datetime(a.starts_at) <= datetime(?)
        )
        AND (
          a.ends_at IS NULL
          OR a.ends_at = ''
          OR datetime(a.ends_at) > datetime(?)
        )
        AND (
          a.is_class_wise = 1
          OR au.user_id = ?
        );
    `;
    const latestBatchLessonRes = await this._db?.query(latestBatchLessonQuery, [
      classId,
      courseId,
      latestBatchId,
      nowIso,
      nowIso,
      studentId,
    ]);
    const latestBatchLessonIds = new Set(
      ((latestBatchLessonRes?.values ?? []) as { lesson_id?: string | null }[])
        .map((assignment) => assignment.lesson_id)
        .filter((lessonId): lessonId is string => !!lessonId),
    );

    const courseTerminationQuery = `
      SELECT r.lesson_id, r.status
      FROM result r
      INNER JOIN assignment a
        ON a.id = r.assignment_id
      WHERE r.student_id = ?
        AND r.status = 'assessment_terminated'
        AND r.is_deleted = 0
        AND a.class_id = ?
        AND a.course_id = ?
        AND a.type = 'assessment'
      LIMIT 1;
    `;

    const courseTerminationRes = await this._db?.query(courseTerminationQuery, [
      studentId,
      classId,
      courseId,
    ]);
    const courseTerminationRows = (courseTerminationRes?.values ?? []) as {
      lesson_id?: string | null;
    }[];
    const isLatestBatchReassignment = courseTerminationRows.some(
      (result) =>
        !!result.lesson_id && latestBatchLessonIds.has(result.lesson_id),
    );
    if (courseTerminationRows.length && !isLatestBatchReassignment) {
      return [];
    }

    /* ==========================================
     * Check if batch is closed by termination or abort
     * ========================================== */
    const abortCheckQuery = `
    SELECT assignment_id, status
    FROM (
        SELECT r.assignment_id,
              r.status,
              r.created_at,
              ROW_NUMBER() OVER (
                  PARTITION BY r.assignment_id
                  ORDER BY r.created_at DESC
              ) as rn
        FROM result r
        INNER JOIN assignment a
            ON a.id = r.assignment_id
        WHERE r.student_id = '${studentId}'
          AND r.is_deleted = false
          AND a.batch_id = '${latestBatchId}'
          AND a.course_id = '${courseId}'
          AND a.type = 'assessment'
    ) t
    WHERE rn = 1
    ORDER BY created_at DESC
    LIMIT 50;
    `;

    const abortRes = await this._db?.query(abortCheckQuery);
    type AssignmentAbortResultRow = {
      assignment_id?: string | null;
      status?: string | null;
    };
    const uniqueAssignmentResults = (abortRes?.values ??
      []) as AssignmentAbortResultRow[];
    const lastTwoResults = uniqueAssignmentResults.slice(0, 2);

    const isAssessmentTerminated = uniqueAssignmentResults.some(
      (result) => result.status === 'assessment_terminated',
    );
    const isAborted =
      isAssessmentTerminated ||
      (lastTwoResults.length === 2 &&
        lastTwoResults.every((r) => r.status === 'system_exit'));

    if (isAborted) {
      // 🚫 Assessment group is aborted
      return [];
    }

    /* ==========================================
     * Get only INCOMPLETE assignments
     * from that latest batch
     * ========================================== */
    const assignmentsQuery = `
      SELECT a.*
      FROM assignment a

      LEFT JOIN assignment_user au
        ON a.id = au.assignment_id
        AND au.is_deleted = false

      LEFT JOIN result r
        ON r.assignment_id = a.id
        AND r.student_id = '${studentId}'
        AND r.is_deleted = false

      WHERE a.class_id = '${classId}'
        AND a.course_id = '${courseId}'
        AND a.type = 'assessment'
        AND a.is_deleted = false
        AND a.batch_id = '${latestBatchId}'

        -- time window
        AND (
          a.starts_at IS NULL
          OR a.starts_at = ''
          OR datetime(a.starts_at) <= datetime('${nowIso}')
        )
        AND (
          a.ends_at IS NULL
          OR a.ends_at = ''
          OR datetime(a.ends_at) > datetime('${nowIso}')
        )

        -- Assigned to this student
        AND (
          a.is_class_wise = true
          OR au.user_id = '${studentId}'
        )

        -- NOT completed
        AND r.assignment_id IS NULL

        -- subject_lesson validation (LANGUAGE ONLY)
        AND EXISTS (
          SELECT 1
          FROM subject_lesson sl
          WHERE sl.lesson_id = a.lesson_id
            AND sl.set_number = a.set_number
            AND sl.is_deleted = false
            AND (
              sl.language_id IS NULL
              OR sl.language_id = '${langId}'
            )
        )

      ORDER BY (
        SELECT sl.sort_index
        FROM subject_lesson sl
        WHERE sl.lesson_id = a.lesson_id
          AND sl.set_number = a.set_number
          AND sl.is_deleted = false
        LIMIT 1
      ) ASC,
      a.created_at DESC;
    `;

    const res = await this._db?.query(assignmentsQuery);
    const pendingAssignments = (res?.values ??
      []) as TableTypes<'assignment'>[];

    return pendingAssignments.length ? pendingAssignments : [];
  }
  async getAssignmentInfoForLessonsPerClass(
    classId: string,
    lessonIds: string[],
  ): Promise<string[]> {
    await this.ensureInitialized();
    if (!lessonIds?.length) return [];

    const placeholders = lessonIds.map(() => '?').join(', ');

    const query = `
    SELECT DISTINCT lesson_id
    FROM ${TABLES.Assignment}
    WHERE class_id = ?
      AND lesson_id IN (${placeholders})
      AND is_deleted = 0;
  `;

    const res = await this._db?.query(query, [classId, ...lessonIds]);

    if (!res?.values?.length) return [];

    return res.values
      .map((row: any) => row.lesson_id as string | undefined)
      .filter((id): id is string => Boolean(id));
  }
  async isAssignmentAlreadyAssigned(
    schoolId: string,
    classId: string,
    courseId: string,
    chapterId: string,
    lessonId: string,
  ): Promise<boolean> {
    await this.ensureInitialized();
    try {
      const res = await this._db?.query(
        `
      SELECT id
      FROM ${TABLES.Assignment}
      WHERE school_id = ?
        AND class_id = ?
        AND course_id = ?
        AND chapter_id = ?
        AND lesson_id = ?
        AND is_deleted = 0
      LIMIT 1
      `,
        [schoolId, classId, courseId, chapterId, lessonId],
      );

      return !!(res?.values && res.values.length > 0);
    } catch (error) {
      logger.error('Error checking existing assignment:', error);
      return false;
    }
  }
}
