import { DBSQLiteValues } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { v4 as uuidv4 } from 'uuid';
import {
  COURSES,
  DEFAULT_LOCALE_ID,
  DEFAULT_SUBJECT_IDS,
  LIVE_QUIZ,
  MUTATE_TYPES,
  OTHER_CURRICULUM,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import { StudentLessonResult } from '../../../common/courseConstants';
import { AvatarObj } from '../../../components/animation/Avatar';
import logger from '../../../utility/logger';
import { Util } from '../../../utility/util';
import { ServiceConfig } from '../../ServiceConfig';

import { SqliteApiUser } from './SqliteApi.user';
export interface SqliteApiCourse {
  [key: string]: any;
}
export class SqliteApiCourse extends SqliteApiUser {
  async getCourseByUserGradeId(
    gradeDocId: string | null,
    boardDocId: string | null,
  ): Promise<TableTypes<'course'>[]> {
    if (!gradeDocId) {
      throw new Error('Grade document ID is required.');
    }

    if (!boardDocId) {
      throw new Error('Board document ID is required.');
    }

    let courseIds: TableTypes<'course'>[] = [];
    const gradeCourses = await this.getCoursesByGrade(gradeDocId);
    const curriculumCourses = gradeCourses.filter(
      (course: TableTypes<'course'>) => {
        return course.curriculum_id === boardDocId;
      },
    );

    curriculumCourses.forEach((course: TableTypes<'course'>) => {
      courseIds.push(course);
    });

    let subjectIds: string[] = [];
    curriculumCourses.forEach((course: TableTypes<'course'>) => {
      if (course.subject_id) {
        subjectIds.push(course.subject_id);
      }
    });

    const remainingSubjects = DEFAULT_SUBJECT_IDS.filter(
      (subjectId) => !subjectIds.includes(subjectId),
    );

    remainingSubjects.forEach((subjectId) => {
      const courses = gradeCourses.filter((course: TableTypes<'course'>) => {
        const subjectRef = course.subject_id;
        return (
          !!subjectRef &&
          subjectRef === subjectId &&
          course.curriculum_id === OTHER_CURRICULUM
        );
      });
      courses.forEach((course: TableTypes<'course'>) => {
        courseIds.push(course);
      });
    });

    return courseIds;
  }

  async getAllCurriculums(): Promise<TableTypes<'curriculum'>[]> {
    await this.ensureInitialized();
    const res = await this._db?.query(
      `SELECT * FROM ${TABLES.Curriculum} ORDER BY name ASC`,
    );
    logger.info('🚀 ~ SqliteApi ~ getAllCurriculums ~ res:', res);
    return res?.values ?? [];
  }
  async getAllGrades(): Promise<TableTypes<'grade'>[]> {
    await this.ensureInitialized();
    const res = await this._db?.query('select * from ' + TABLES.Grade);
    return res?.values ?? [];
  }

  async getGradeById(id: string): Promise<TableTypes<'grade'> | undefined> {
    await this.ensureInitialized();
    const res = await this._db?.query(
      `select * from ${TABLES.Grade} where id = "${id}"`,
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }
  async getGradeByName(name: string): Promise<TableTypes<'grade'> | undefined> {
    const res = await this._db?.query(
      `SELECT * FROM ${TABLES.Grade} WHERE name = ? AND is_deleted = 0 LIMIT 1`,
      [name],
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }
  async getGradesByIds(gradeIds: string[]): Promise<TableTypes<'grade'>[]> {
    await this.ensureInitialized();
    if (!gradeIds || gradeIds.length === 0) {
      return [];
    }
    // Format the IDs for the SQL query
    const formattedIds = gradeIds.map((id) => `"${id}"`).join(', ');
    // Construct and execute the query
    const res = await this._db?.query(
      `SELECT * FROM ${TABLES.Grade} WHERE id IN (${formattedIds})`,
    );

    if (!res || !res.values || res.values.length === 0) {
      return []; // Return an empty array if no grades are found
    }
    // Return the retrieved grades
    return res.values;
  }

  async getCurriculumById(
    id: string,
  ): Promise<TableTypes<'curriculum'> | undefined> {
    await this.ensureInitialized();
    const res = await this._db?.query(
      `select * from ${TABLES.Curriculum} where id = "${id}"`,
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }
  async getCurriculumsByIds(
    ids: string[],
  ): Promise<TableTypes<'curriculum'>[]> {
    await this.ensureInitialized();
    if (!ids || ids.length === 0) {
      return [];
    }

    // Format the IDs for the SQL query
    const formattedIds = ids.map((id) => `"${id}"`).join(', ');

    // Construct and execute the query
    const res = await this._db?.query(
      `SELECT * FROM ${TABLES.Curriculum} WHERE id IN (${formattedIds})`,
    );

    if (!res || !res.values || res.values.length < 1) {
      return [];
    }

    // Assuming you need to return the first item or an empty array
    return res.values;
  }

  async getAllLanguages(): Promise<TableTypes<'language'>[]> {
    await this.ensureInitialized();
    const res = await this._db?.query('select * from ' + TABLES.Language);
    logger.info('🚀 ~ SqliteApi ~ getAllLanguages ~ res:', res);
    return res?.values ?? [];
  }

  async subscribeToClassTopic(): Promise<void> {
    var students: TableTypes<'user'>[] = await this.getParentStudentProfiles();
    for (const student of students) {
      const linkedData = await this.getStudentClassesAndSchools(student.id);
      if (
        !!linkedData &&
        !!linkedData.classes &&
        linkedData.classes.length > 0
      ) {
        Util.subscribeToClassTopic(
          linkedData.classes[0].id,
          linkedData.schools[0].id,
        );
      }
    }
  }

  async getParentStudentProfiles(): Promise<TableTypes<'user'>[]> {
    await this.ensureInitialized();
    if (!this._db) throw 'Db is not initialized';
    const authHandler = ServiceConfig.getI()?.authHandler;
    const currentUser = await authHandler?.getCurrentUser();
    if (!currentUser) throw 'User is not Logged in';
    const query = `
  SELECT *
  FROM ${TABLES.ParentUser} AS parent
  JOIN ${TABLES.User} AS student ON parent.student_id = student.id
  WHERE parent.parent_id = "${currentUser.id}" AND parent.is_deleted = 0 AND student.is_deleted = 0;
`;
    const res = await this._db.query(query);
    return res.values ?? [];
  }

  get currentStudent(): TableTypes<'user'> | undefined {
    return this._currentStudent;
  }

  set currentStudent(value: TableTypes<'user'> | undefined) {
    this._currentStudent = value;
  }

  get currentClass(): TableTypes<'class'> | undefined {
    return this._currentClass;
  }

  set currentClass(value: TableTypes<'class'> | undefined) {
    this._currentClass = value;
  }

  get currentSchool(): TableTypes<'school'> | undefined {
    return this._currentSchool;
  }

  set currentSchool(value: TableTypes<'school'> | undefined) {
    this._currentSchool = value;
  }

  get currentCourse():
    | Map<string, TableTypes<'course'> | undefined>
    | undefined {
    return this._currentCourse;
  }

  set currentCourse(
    value: Map<string, TableTypes<'course'> | undefined> | undefined,
  ) {
    this._currentCourse = value;
  }

  async updateSoundFlag(userId: string, value: boolean) {
    const query = `
    UPDATE "user"
    SET sfx_off = ${value ? 1 : 0}
    WHERE id = "${userId}";
  `;
    const res = await this.executeQuery(query);
    this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, {
      sfx_off: value ? 1 : 0,
      id: userId,
    });
  }
  async updateMusicFlag(userId: string, value: boolean) {
    const query = `
    UPDATE "user"
    SET music_off = ${value ? 1 : 0}
    WHERE id = "${userId}";
  `;
    const res = await this.executeQuery(query);
    logger.info('🚀 ~ SqliteApi ~ updateMusicFlag ~ res:', res);
    this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, {
      music_off: value ? 1 : 0,
      id: userId,
    });
  }
  async updateLanguage(userId: string, value: string) {
    const countryCode = await this.getClientCountryCode();
    const locale = await this.getLocaleByIdOrCode(undefined, countryCode);
    const localeId = locale?.id ?? DEFAULT_LOCALE_ID;

    const query = `
      UPDATE "user"
      SET language_id = ?, locale_id = ?
      WHERE id = ?;
    `;
    const res = await this.executeQuery(query, [value, localeId, userId]);
    logger.info('🚀 ~ SqliteApi ~ updateLanguage ~ res:', res);
    this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, {
      language_id: value,
      locale_id: localeId,
      id: userId,
    });
  }
  async updateTcAccept(userId: string) {
    const query = `
    UPDATE "user"
    SET is_tc_accepted = 1
    WHERE id = "${userId}";
  `;
    const res = await this.executeQuery(query);
    logger.info(
      '🚀 ~ SqliteApi ~ updateTcAccept ~ res:',
      res,
      ServiceConfig.getI().authHandler.currentUser,
    );
    const auth = ServiceConfig.getI().authHandler;
    const currentUser = await auth.getCurrentUser();
    if (currentUser) {
      auth.currentUser = {
        ...currentUser,
        is_tc_accepted: true,
      };
    }
    this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, {
      is_tc_accepted: 1,
      id: userId,
    });
  }

  async updateTcAgreedVersion(userId: string, version: number) {
    const query = `
    UPDATE "user"
    SET tc_agreed_version = ${version},
        updated_at = "${new Date().toISOString()}"
    WHERE id = "${userId}";
  `;
    try {
      await this.executeQuery(query);
      this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, {
        tc_agreed_version: version,
        id: userId,
      });
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : '';

      if (errorMessage.includes('no such column: tc_agreed_version')) {
        try {
          await this.executeQuery(`
            ALTER TABLE "user"
            ADD COLUMN tc_agreed_version NUMERIC;
          `);

          await this.executeQuery(query);

          this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, {
            tc_agreed_version: version,
            id: userId,
          });
        } catch (alterError: unknown) {
          logger.error('Failed to add column and retry update', alterError);
        }
      } else {
        logger.error('Update failed', e);
      }
    }
  }
  async getLanguageWithId(
    id: string,
  ): Promise<TableTypes<'language'> | undefined> {
    await this.ensureInitialized();
    const res = await this._db?.query(
      `select * from ${TABLES.Language} where id = "${id}"`,
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }

  async getLessonWithCocosLessonId(
    lessonId: string,
  ): Promise<TableTypes<'lesson'> | null> {
    await this.ensureInitialized();
    const res = await this._db?.query(
      `
        select *
        from ${TABLES.Lesson}
        where cocos_lesson_id = ?
          and is_deleted = 0
        order by
          coalesce(datetime(updated_at), datetime(created_at)) desc,
          updated_at desc,
          created_at desc
        limit 1
      `,
      [lessonId],
    );
    if (!res || !res.values || res.values.length < 1) return null;
    return res.values[0];
  }

  async getCoursesForParentsStudent(
    studentId: string,
  ): Promise<TableTypes<'course'>[]> {
    await this.ensureInitialized();
    const query = `
    SELECT *
    FROM ${TABLES.UserCourse} AS uc
    JOIN ${TABLES.Course} AS course ON uc.course_id= course.id
    WHERE uc.user_id = "${studentId}" AND uc.is_deleted = 0;
  `;
    const res = await this._db?.query(query);
    return res?.values ?? [];
  }

  async getAdditionalCourses(
    studentId: string,
  ): Promise<TableTypes<'course'>[]> {
    await this.ensureInitialized();
    const res = await this._db?.query(`
    SELECT c.*
    FROM ${TABLES.Course} c
    LEFT JOIN user_course uc ON c.id = uc.course_id AND uc.user_id = "${studentId}"
    WHERE uc.course_id IS NULL;
    `);
    return res?.values ?? [];
  }

  async getCoursesForClassStudent(
    classId: string,
  ): Promise<TableTypes<'course'>[]> {
    await this.ensureInitialized();
    const query = `
      SELECT course.*
      FROM ${TABLES.ClassCourse} AS cc
      JOIN ${TABLES.Course} AS course ON cc.course_id = course.id
      WHERE cc.class_id = ? AND cc.is_deleted = 0
      ORDER BY course.sort_index ASC;
    `;
    const res = await this._db?.query(query, [classId]);
    return res?.values ?? [];
  }

  async getLesson(id: string): Promise<TableTypes<'lesson'> | undefined> {
    await this.ensureInitialized();
    const res = await this._db?.query(
      `select * from ${TABLES.Lesson} where id = "${id}" and is_deleted = 0`,
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }
  async getChapterById(id: string): Promise<TableTypes<'chapter'> | undefined> {
    await this.ensureInitialized();
    const res = await this._db?.query(
      `select * from ${TABLES.Chapter} where id = "${id}" and is_deleted = 0`,
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }

  async getLessonsForChapter(
    chapterId: string,
  ): Promise<TableTypes<'lesson'>[]> {
    await this.ensureInitialized();
    const student = this.currentStudent;
    let langId = student?.language_id;
    const localeId = student?.locale_id;

    try {
      const courseLanguageId =
        await this.resolveCourseLanguageIdForChapter(chapterId);
      if (courseLanguageId) {
        langId = courseLanguageId;
      }
    } catch (error) {
      logger.error('Error resolving chapter course language:', error);
    }

    const query = `
    SELECT *
    FROM ${TABLES.ChapterLesson} AS cl
    JOIN ${TABLES.Lesson} AS lesson ON cl.lesson_id= lesson.id
    WHERE cl.chapter_id = "${chapterId}"
    AND cl.is_deleted = 0
    AND (
      (cl.language_id IS NULL AND cl.locale_id IS NULL)
      ${
        langId
          ? `OR (cl.language_id = "${langId}" AND cl.locale_id IS NULL)`
          : ''
      }
      ${
        localeId
          ? `OR (cl.language_id IS NULL AND cl.locale_id = "${localeId}")`
          : ''
      }
      ${
        langId && localeId
          ? `OR (cl.language_id = "${langId}" AND cl.locale_id = "${localeId}")`
          : ''
      }
    )
    ORDER BY cl.sort_index ASC;
  `;
    const res = await this._db?.query(query);
    return res?.values ?? [];
  }

  async getDifferentGradesForCourse(course: TableTypes<'course'>): Promise<{
    grades: TableTypes<'grade'>[];
    courses: TableTypes<'course'>[];
  }> {
    await this.ensureInitialized();
    const query = `
    SELECT c.*,
    JSON_OBJECT(
      'id',g.id,
      'name',g.name,
      'image',g.image,
      'description',g.description,
      'sort_index',g.sort_index,
      'created_at',g.created_at,
      'updated_at',g.updated_at,
      'is_deleted',g.is_deleted
    ) AS grade
    FROM ${TABLES.Course} c
    JOIN ${TABLES.Grade} g ON c.grade_id = g.id
    WHERE c.subject_id = "${course.subject_id}"
    AND c.curriculum_id = "${course.curriculum_id}";

  `;
    const res = await this._db?.query(query);
    const gradesById = new Map<string, TableTypes<'grade'>>();
    const coursesByGradeId = new Map<string, TableTypes<'course'>[]>();
    for (const data of res?.values ?? []) {
      const grade = JSON.parse(data.grade);
      delete data.grade;
      const courseDoc = data;
      gradesById.set(grade.id, grade);
      const currentGradeCourses = coursesByGradeId.get(grade.id) ?? [];
      currentGradeCourses.push(courseDoc);
      coursesByGradeId.set(grade.id, currentGradeCourses);
    }

    if (course.grade_id) {
      const currentGradeCourses = coursesByGradeId.get(course.grade_id) ?? [];
      if (!currentGradeCourses.some((_course) => _course.id === course.id)) {
        currentGradeCourses.push(course);
        coursesByGradeId.set(course.grade_id, currentGradeCourses);
      }

      if (!gradesById.has(course.grade_id)) {
        const courseGrade = await this.getGradeById(course.grade_id);
        if (courseGrade) {
          gradesById.set(course.grade_id, courseGrade);
        }
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

    const grades = Array.from(gradesById.values()).sort((a, b) => {
      //Number.MAX_SAFE_INTEGER is using when sortIndex is not found GRADES (i.e it gives default value)
      const sortIndexA = a.sort_index || Number.MAX_SAFE_INTEGER;
      const sortIndexB = b.sort_index || Number.MAX_SAFE_INTEGER;

      return sortIndexA - sortIndexB;
    });
    const gradeMap = {
      grades,
      courses: grades
        .map((grade) => pickCourseForGrade(grade.id))
        .filter(
          (mappedCourse): mappedCourse is TableTypes<'course'> =>
            !!mappedCourse,
        ),
    };
    return gradeMap as any;
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
    await this.ensureInitialized();
    const now = new Date().toISOString();
    const query = `
    SELECT a.*
    FROM ${TABLES.Assignment} a
    LEFT JOIN ${TABLES.Assignment_user} au ON a.id = au.assignment_id
    LEFT JOIN result r ON a.id = r.assignment_id AND r.student_id = "${studentId}"
   WHERE a.class_id = '${classId}' and a.type = "${LIVE_QUIZ}" and (a.is_class_wise = 1 or au.user_id = "${studentId}") and r.assignment_id IS NULL
    and a.starts_at <= '${now}'
    and a.ends_at > '${now}'
    order by a.created_at desc;
    `;
    const res = await this._db?.query(query);
    if (!res || !res.values || res.values.length < 1) return [];
    return res.values;
  }

  async getLiveQuizRoomDoc(
    liveQuizRoomDocId: string,
  ): Promise<TableTypes<'live_quiz_room'>> {
    const roomData =
      await this._serverApi.getLiveQuizRoomDoc(liveQuizRoomDocId);
    return roomData;
  }

  async updateFavoriteLesson(
    studentId: string,
    lessonId: string,
  ): Promise<TableTypes<'favorite_lesson'>> {
    await this.ensureInitialized();
    const favoriteId = uuidv4();
    var favoriteLesson: TableTypes<'favorite_lesson'>;
    const isExist = await this._db?.query(
      `SELECT * FROM ${TABLES.FavoriteLesson}
       WHERE user_id= '${studentId}' and lesson_id = '${lessonId}';`,
    );
    if (!isExist || !isExist.values || isExist.values.length < 1) {
      favoriteLesson = {
        id: favoriteId,
        lesson_id: lessonId,
        user_id: studentId ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false,
        is_firebase: false,
      };
      const res = await this.executeQuery(
        `
      INSERT INTO favorite_lesson (id, lesson_id, user_id, created_at, updated_at, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?);
      `,
        [
          favoriteLesson.id,
          favoriteLesson.lesson_id,
          favoriteLesson.user_id,
          favoriteLesson.created_at,
          favoriteLesson.updated_at,
          favoriteLesson.is_deleted,
        ],
      );
      this.updatePushChanges(
        TABLES.FavoriteLesson,
        MUTATE_TYPES.INSERT,
        favoriteLesson,
      );
    } else {
      var liked_lesson = isExist.values[0];
      favoriteLesson = {
        id: liked_lesson.id,
        lesson_id: liked_lesson.lesson_id,
        user_id: liked_lesson.student_id,
        created_at: liked_lesson.created_at,
        updated_at: new Date().toISOString(),
        is_deleted: false,
        is_firebase: false,
      };

      await this.executeQuery(
        `
      UPDATE  favorite_lesson SET updated_at = '${favoriteLesson.updated_at}'
      WHERE id = "${favoriteLesson.id}";
       `,
      );
      this.updatePushChanges(TABLES.FavoriteLesson, MUTATE_TYPES.UPDATE, {
        id: favoriteLesson.id,
        updated_at: favoriteLesson.updated_at,
      });
    }

    return favoriteLesson;
  }

  async getLidoCommonAudioUrl(
    languageId: string,
    localeId?: string | null,
  ): Promise<{ lido_common_audio_url: string | null } | null> {
    try {
      if (!localeId) {
        const countryCode = await this.getClientCountryCode();
        const locale = await this.getLocaleByIdOrCode(undefined, countryCode);
        localeId = locale?.id ?? null;
      }

      const data = await this.executeQuery(
        `
      SELECT lido_common_audio_url
      FROM language_locale
      WHERE is_deleted = false
        AND (
          (language_id = ? AND locale_id = ?)
          OR (language_id = ? AND locale_id IS NULL)
          OR (language_id IS NULL AND locale_id = ?)
          OR (language_id IS NULL AND locale_id IS NULL)
        )
      ORDER BY
        CASE
          WHEN language_id = ? AND locale_id = ? THEN 1
          WHEN language_id = ? AND locale_id IS NULL THEN 2
          WHEN language_id IS NULL AND locale_id = ? THEN 3
          ELSE 4
        END
      LIMIT 1;
      `,
        [
          languageId,
          localeId ?? null,
          languageId,
          localeId ?? null,
          languageId,
          localeId ?? null,
          languageId,
          localeId ?? null,
        ],
      );

      const rows = data?.values ?? [];

      return rows[0];
    } catch (err) {
      logger.error('[SQLite] getLidoCommonAudioUrl failed:', err);
      return null;
    }
  }
  async getSubjectLessonsBySubjectId(
    subjectId: string,
    student?: TableTypes<'user'>,
    courseId?: string,
  ): Promise<TableTypes<'subject_lesson'>> {
    if (!student) return {} as TableTypes<'subject_lesson'>;
    const studentId = student.id;
    let langId = student.language_id ?? null;
    const localeId = student.locale_id ?? null;

    try {
      type CourseLanguageRow = {
        code?: string | null;
        id?: string | null;
      };
      type SubjectLessonSetRow = {
        set_number: number;
        language_id: string | null;
        locale_id: string | null;
        lesson_id: string | null;
      };
      type ResultStatusRow = {
        lesson_id: string | null;
        status: string | null;
      };
      type ResultLessonRow = { lesson_id: string | null };

      if (courseId) {
        try {
          const courseRes = await this.executeQuery(
            `
              SELECT code
              FROM course
              WHERE id = ?
                AND is_deleted = 0
              LIMIT 1;
            `,
            [courseId],
          );
          const courseCode = (
            ((courseRes as DBSQLiteValues | undefined)?.values?.[0] ??
              {}) as CourseLanguageRow
          ).code
            ?.trim()
            .toLowerCase();
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
            const courseLanguageId = (
              ((languageRes as DBSQLiteValues | undefined)?.values?.[0] ??
                {}) as CourseLanguageRow
            ).id;

            if (courseLanguageId) {
              langId = courseLanguageId;
            }
          }
        } catch (error) {
          logger.error(
            'Error resolving subject lesson course language:',
            error,
          );
        }
      }

      // 1️⃣ Fetch all available set_numbers (+ language/locale for in-memory preference)
      const setQuery = `
      SELECT DISTINCT set_number, language_id, locale_id, lesson_id
      FROM subject_lesson
      WHERE subject_id = ?
        AND is_deleted = 0
        AND set_number IS NOT NULL;
    `;
      const setRes = await this.executeQuery(setQuery, [subjectId]);
      const setRows = ((setRes as DBSQLiteValues | undefined)?.values ??
        []) as SubjectLessonSetRow[];

      if (!setRows.length) {
        return {} as TableTypes<'subject_lesson'>;
      }

      const uniqueSets = Array.from(new Set(setRows.map((r) => r.set_number)));
      if (!uniqueSets.length) {
        return {} as TableTypes<'subject_lesson'>;
      }

      // 2️⃣ Prefer sets that have student's language, fallback to all sets
      const preferredSets = langId
        ? Array.from(
            new Set(
              setRows
                .filter((r) =>
                  localeId
                    ? r.language_id === langId &&
                      (r.locale_id === localeId || r.locale_id == null)
                    : r.language_id === langId,
                )
                .map((r) => r.set_number),
            ),
          )
        : localeId
          ? Array.from(
              new Set(
                setRows
                  .filter(
                    (r) =>
                      r.language_id == null &&
                      (r.locale_id === localeId || r.locale_id == null),
                  )
                  .map((r) => r.set_number),
              ),
            )
          : [];

      const candidateSets = preferredSets.length ? preferredSets : uniqueSets;
      const randomIndex = Math.floor(Math.random() * candidateSets.length);
      const setNumber = candidateSets[randomIndex];
      const useStrictLanguageTrack =
        !!langId && preferredSets.includes(setNumber);
      const assessmentTrackRows = useStrictLanguageTrack
        ? setRows.filter((row) =>
            localeId
              ? row.language_id === langId &&
                (row.locale_id === localeId || row.locale_id == null)
              : row.language_id === langId,
          )
        : setRows.filter((row) =>
            localeId
              ? row.language_id == null &&
                (row.locale_id === localeId || row.locale_id == null)
              : row.language_id == null,
          );
      const assessmentLessonIds = Array.from(
        new Set(
          assessmentTrackRows
            .map((row) => row.lesson_id)
            .filter((lessonId): lessonId is string => !!lessonId),
        ),
      );

      if (!assessmentLessonIds.length) {
        return {} as TableTypes<'subject_lesson'>;
      }

      /* ==========================================
       * 3️⃣ Abort Check (with assignment_id IS NULL)
       * ========================================== */
      const abortLessonPlaceholders = assessmentLessonIds
        .map(() => '?')
        .join(', ');
      const abortQuery = `
        SELECT lesson_id, status
        FROM (
            SELECT lesson_id, status, created_at,
                  ROW_NUMBER() OVER (
                      PARTITION BY lesson_id
                      ORDER BY created_at DESC
                  ) as rn
            FROM result
            WHERE student_id = ?
              AND subject_id = ?
              AND assignment_id IS NULL
              AND lesson_id IN (${abortLessonPlaceholders})
              AND is_deleted = 0
        ) t
        WHERE rn = 1
        ORDER BY created_at DESC
        LIMIT 50;
      `;

      const abortParams: (string | null)[] = [
        studentId,
        subjectId,
        ...assessmentLessonIds,
      ];
      const abortRes = await this.executeQuery(abortQuery, abortParams);

      const uniqueAssessmentResults = ((abortRes as DBSQLiteValues | undefined)
        ?.values ?? []) as ResultStatusRow[];
      const lastTwo = uniqueAssessmentResults.slice(0, 2);

      const isAssessmentTerminated = uniqueAssessmentResults.some(
        (r) => r.status === 'assessment_terminated',
      );
      const isAborted =
        lastTwo.length === 2 &&
        lastTwo.every((r) => r.status === 'system_exit');

      if (isAssessmentTerminated || isAborted) {
        return {} as TableTypes<'subject_lesson'>; // Aborted group
      }

      /* ==========================================
       * 4️⃣ Fetch all candidate lessons from set
       * ========================================== */
      const lessonLanguageFilter = useStrictLanguageTrack
        ? localeId
          ? `(sl.language_id = ? AND (sl.locale_id = ? OR sl.locale_id IS NULL))`
          : `sl.language_id = ?`
        : langId
          ? localeId
            ? `(
              (sl.language_id = ? AND sl.locale_id = ?)
              OR (sl.language_id = ? AND sl.locale_id IS NULL)
              OR (sl.language_id IS NULL AND sl.locale_id = ?)
              OR (sl.language_id IS NULL AND sl.locale_id IS NULL)
            )`
            : `(sl.language_id = ? OR sl.language_id IS NULL)`
          : localeId
            ? `(
              (sl.language_id IS NULL AND sl.locale_id = ?)
              OR (sl.language_id IS NULL AND sl.locale_id IS NULL)
            )`
            : `(sl.language_id IS NULL AND sl.locale_id IS NULL)`;

      const lessonQuery = `
        SELECT sl.*
        FROM subject_lesson sl
        WHERE sl.subject_id = ?
          AND sl.set_number = ?
          AND sl.is_deleted = 0
          AND ${lessonLanguageFilter}

        ORDER BY
          sl.set_number ASC,
          sl.sort_index ASC;
      `;

      const lessonParams = [subjectId, setNumber];
      if (useStrictLanguageTrack && langId) {
        lessonParams.push(langId);
        if (localeId) lessonParams.push(localeId);
      } else if (langId) {
        lessonParams.push(langId);
        if (localeId) {
          lessonParams.push(localeId, langId, localeId);
        }
      } else if (localeId) {
        lessonParams.push(localeId);
      }
      const lessonRes = await this.executeQuery(lessonQuery, lessonParams);

      const allLessons = ((lessonRes as DBSQLiteValues | undefined)?.values ??
        []) as TableTypes<'subject_lesson'>[];
      const matchedLessons = allLessons.filter(
        (lesson) => lesson.language_id === langId,
      );
      const fallbackLessons = allLessons.filter(
        (lesson) => lesson.language_id == null,
      );
      let candidateLessons = useStrictLanguageTrack
        ? allLessons
        : matchedLessons.length
          ? matchedLessons
          : fallbackLessons;

      if (useStrictLanguageTrack && localeId) {
        const localePriority = (lesson: TableTypes<'subject_lesson'>) => {
          if (lesson.language_id === langId && lesson.locale_id === localeId)
            return 1;
          if (lesson.language_id === langId && lesson.locale_id == null)
            return 2;
          return 3;
        };
        candidateLessons = [...candidateLessons].sort((a, b) => {
          if ((a.sort_index ?? 0) !== (b.sort_index ?? 0)) {
            return (a.sort_index ?? 0) - (b.sort_index ?? 0);
          }
          return localePriority(a) - localePriority(b);
        });
      }

      if (!candidateLessons.length) {
        return {} as TableTypes<'subject_lesson'>;
      }

      const lessonIds = candidateLessons.map((lesson) => lesson.lesson_id);
      const resultPlaceholders = lessonIds.map(() => '?').join(', ');
      const resultQuery = `
        SELECT DISTINCT lesson_id
        FROM result
        WHERE student_id = ?
          AND subject_id = ?
          AND is_deleted = 0
          AND lesson_id IN (${resultPlaceholders});
      `;
      const resultParams: (string | null)[] = [studentId, subjectId];
      resultParams.push(...lessonIds);
      const resultRes = await this.executeQuery(resultQuery, resultParams);
      const completedLessons = ((resultRes as DBSQLiteValues | undefined)
        ?.values ?? []) as ResultLessonRow[];
      const completedLessonIds = new Set(
        completedLessons
          .map((result) => result.lesson_id)
          .filter((lessonId): lessonId is string => !!lessonId),
      );
      const pendingLessons = candidateLessons.filter(
        (lesson) => !completedLessonIds.has(lesson.lesson_id),
      );

      return pendingLessons.length
        ? pendingLessons[0]
        : ({} as TableTypes<'subject_lesson'>);
    } catch (error) {
      logger.error(
        '❌ Error fetching subject lessons by subject (SQL):',
        error,
      );
      return {} as TableTypes<'subject_lesson'>;
    }
  }

  private async prefetchLidoCommonAudioAfterSync(): Promise<void> {
    if (!this._db || !Capacitor.isNativePlatform()) return;

    try {
      const students = await this.getParentStudentProfiles();
      if (!students?.length) return;

      const studentsByLanguage = new Map<string, TableTypes<'user'>>();
      for (const student of students) {
        if (
          !student?.language_id ||
          studentsByLanguage.has(student.language_id)
        ) {
          continue;
        }
        studentsByLanguage.set(student.language_id, student);
      }

      for (const student of studentsByLanguage.values()) {
        const audioConfig = await this.getLidoCommonAudioUrl(
          student.language_id!,
          student.locale_id ?? null,
        );

        if (!audioConfig?.lido_common_audio_url) {
          continue;
        }

        await Util.downloadLidoCommonAudio(
          audioConfig.lido_common_audio_url,
          student.language_id!,
        );
      }
    } catch (error) {
      logger.warn(
        '[LidoCommonAudio] Failed to prefetch common audio after sync',
        error,
      );
    }
  }
}
