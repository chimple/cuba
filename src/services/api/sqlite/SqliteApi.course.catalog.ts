import logger from '../../../utility/logger';
import { Util } from '../../../utility/util';
import { Capacitor } from '@capacitor/core';
import {
  DEFAULT_LOCALE_ID,
  DEFAULT_SUBJECT_IDS,
  MUTATE_TYPES,
  OTHER_CURRICULUM,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import Course from '../../../models/Course';
import Lesson from '../../../models/Lesson';
import { ServiceConfig } from '../../ServiceConfig';
import { v4 as uuidv4 } from 'uuid';
import { SqliteApiUserLeaderboards } from './SqliteApi.user.leaderboards';

export class SqliteApiCourseCatalog extends SqliteApiUserLeaderboards {
  [key: string]: any;
  protected async prefetchLidoCommonAudioAfterSync(): Promise<void> {
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

  async addCourseForParentsStudent(
    courses: TableTypes<'course'>[],
    student: TableTypes<'user'>,
  ) {
    const courseIds = courses?.map((course) => course.id);
    for (const courseId of courseIds) {
      const newUserCourse: TableTypes<'user_course'> = {
        course_id: courseId,
        created_at: new Date().toISOString(),
        id: uuidv4(),
        is_deleted: false,
        updated_at: new Date().toISOString(),
        user_id: student.id,
        is_firebase: null,
      };
      await this.executeQuery(
        `
        INSERT INTO user_course (id, user_id, course_id)
      VALUES (?, ?, ?);
    `,
        [newUserCourse.id, newUserCourse.user_id, newUserCourse.course_id],
      );
      this.updatePushChanges(
        TABLES.UserCourse,
        MUTATE_TYPES.INSERT,
        newUserCourse,
      );
    }
  }

  async updateFcmToken(userId: string) {
    const token = await Util.getToken();
    const query = `
    UPDATE "user"
    SET fcm_token = "${token}"
    WHERE id = "${userId}";
  `;
    const res = await this.executeQuery(query);
    logger.info('🚀 ~ SqliteApi ~ updateFCM Token:', res);
    await this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, {
      fcm_token: token,
      id: userId,
    });
  }
}
