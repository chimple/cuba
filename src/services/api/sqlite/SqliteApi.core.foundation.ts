import {
  CACHETABLES,
  COURSES,
  CURRENT_SQLITE_VERSION,
  DEFAULT_LOCALE_ID,
  MODES,
  MUTATE_TYPES,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import Course from '../../../models/Course';
import Lesson from '../../../models/Lesson';
import logger from '../../../utility/logger';
import { isRecoverableStorageError } from '../../../utility/recoverableStorageError';
import { SupabaseApi } from '../SupabaseApi';
import {
  CapacitorSQLite,
  DBSQLiteValues,
  SQLiteConnection,
  SQLiteDBConnection,
  capSQLiteResult,
  capSQLiteVersionUpgrade,
} from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

export class SqliteApiCoreFoundation {
  [key: string]: any;
  protected _db: SQLiteDBConnection | undefined;
  protected _sqlite: SQLiteConnection | undefined;
  protected DB_NAME = 'db_issue10';
  protected DB_VERSION = 15;
  protected BUNDLED_IMPORT_APP_VERSION_KEY = 'bundledImportAppVersion';
  protected BUNDLED_IMPORT_PULL_SYNC_TABLE = 'pull_sync_info';
  protected BUNDLED_IMPORT_TABLES = new Set<string>([
    TABLES.Curriculum,
    TABLES.Subject,
    TABLES.Grade,
    TABLES.Language,
    TABLES.Badge,
    TABLES.Course,
    TABLES.Sticker,
    TABLES.Reward,
    TABLES.Chapter,
    TABLES.Lesson,
    TABLES.ChapterLesson,
    TABLES.ChapterLinks,
    TABLES.RiveReward,
    TABLES.Framework,
    TABLES.Domain,
    TABLES.Competency,
    TABLES.Outcome,
    TABLES.Skill,
    TABLES.SkillRelation,
    TABLES.SkillLesson,
    TABLES.SubjectLesson,
    TABLES.LanguageLocale,
    TABLES.Locale,
    TABLES.StickerBook,
  ]);
  protected _serverApi: SupabaseApi;
  protected _currentMode: MODES;
  protected _currentStudent: TableTypes<'user'> | undefined;
  protected _currentClass: TableTypes<'class'> | undefined;
  protected _currentSchool: TableTypes<'school'> | undefined;
  protected _currentCourse:
    | Map<string, TableTypes<'course'> | undefined>
    | undefined;
  protected chapterCourseIdCache = new Map<string, string | null>();
  protected courseLanguageIdCache = new Map<string, string | null>();
  protected courseLanguageIdPromiseCache = new Map<
    string,
    Promise<string | null>
  >();
  protected _syncTableData: Record<string, string> = {};
  protected _tablesNeedingFullSync = new Set<string>();
  protected _tableColumnsCache = new Map<string, string[]>();
  protected _initPromise: Promise<void> | null = null;
  protected _syncInProgress = false;
  protected _syncRequestedAgain = false;
  protected _retryRefreshTables: TABLES[] = [];
  protected _postSyncAssetPrefetchScheduled = false;
  protected _postSyncAssetPrefetchRequestedAt: number | null = null;
  protected _shouldImportBundledDataAfterUpgrade = false;
  protected _cachedRewards: TableTypes<'rive_reward'>[] | undefined;

  protected async resolveCourseLanguageId(
    courseId: string,
  ): Promise<string | null> {
    // Reuse successful course-language resolution across chapter lesson fetches.
    if (this.courseLanguageIdCache.has(courseId)) {
      return this.courseLanguageIdCache.get(courseId) ?? null;
    }

    // Deduplicate concurrent lookups for the same course while one query is in flight.
    const inFlightPromise = this.courseLanguageIdPromiseCache.get(courseId);
    if (inFlightPromise) {
      return inFlightPromise;
    }

    const languagePromise = (async () => {
      const courseRes = await this.executeQuery(
        `
          SELECT code
          FROM ${TABLES.Course}
          WHERE id = ?
            AND is_deleted = 0
          LIMIT 1;
        `,
        [courseId],
      );
      if (!courseRes) {
        throw new Error(
          `Failed to fetch course code while resolving language for course ${courseId}`,
        );
      }

      const courseCode = (
        ((courseRes as DBSQLiteValues | undefined)?.values?.[0] ?? {}) as {
          code?: string | null;
        }
      ).code
        ?.trim()
        .toLowerCase();
      const courseLanguageCode =
        courseCode === COURSES.MATHS
          ? COURSES.ENGLISH
          : courseCode?.includes('-')
            ? courseCode.split('-').pop()
            : courseCode;

      if (!courseLanguageCode) {
        return null;
      }

      const languageRes = await this.executeQuery(
        `
          SELECT id
          FROM ${TABLES.Language}
          WHERE LOWER(code) = ?
            AND is_deleted = 0
          LIMIT 1;
        `,
        [courseLanguageCode],
      );
      if (!languageRes) {
        throw new Error(
          `Failed to fetch language id while resolving language for course ${courseId}`,
        );
      }

      const courseLanguageId = (
        ((languageRes as DBSQLiteValues | undefined)?.values?.[0] ?? {}) as {
          id?: string | null;
        }
      ).id;

      return courseLanguageId ?? null;
    })()
      .then((languageId) => {
        // Cache only confirmed language ids so transient query failures can retry later.
        if (languageId) {
          this.courseLanguageIdCache.set(courseId, languageId);
        }
        return languageId;
      })
      .finally(() => {
        this.courseLanguageIdPromiseCache.delete(courseId);
      });

    this.courseLanguageIdPromiseCache.set(courseId, languagePromise);
    return languagePromise;
  }

  protected async resolveCourseLanguageIdForChapter(
    chapterId: string,
  ): Promise<string | null> {
    const cachedCourseId = this.chapterCourseIdCache.get(chapterId);
    if (cachedCourseId !== undefined) {
      return cachedCourseId
        ? this.resolveCourseLanguageId(cachedCourseId)
        : Promise.resolve(null);
    }

    const courseRes = await this.executeQuery(
      `
        SELECT course_id
        FROM ${TABLES.Chapter}
        WHERE id = ?
          AND is_deleted = 0
        LIMIT 1;
      `,
      [chapterId],
    );
    if (!courseRes) {
      throw new Error(
        `Failed to fetch chapter course while resolving language for chapter ${chapterId}`,
      );
    }

    const courseId = (
      ((courseRes as DBSQLiteValues | undefined)?.values?.[0] ?? {}) as {
        course_id?: string | null;
      }
    ).course_id;

    // Keep the chapter -> course mapping only when we resolved a real course id.
    if (courseId) {
      this.chapterCourseIdCache.set(chapterId, courseId);
    }
    return courseId ? this.resolveCourseLanguageId(courseId) : null;
  }

  protected async ensureInitialized(): Promise<void> {
    if (this._db && this._sqlite) return;
    if (!this._initPromise) {
      this._initPromise = this.initializeWithRetry();
    }
    await this._initPromise;
  }

  protected isRecoverableInitError(error: unknown): boolean {
    return isRecoverableStorageError(error);
  }

  protected resetDbHandles(): void {
    this._db = undefined;
  }

  protected async initializeWithRetry(
    attempts = 3,
    delayMs = 400,
  ): Promise<void> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        await this.init();
        return;
      } catch (error) {
        lastError = error;
        this.resetDbHandles();

        if (!this.isRecoverableInitError(error) || attempt === attempts) {
          this._initPromise = null;
          throw error;
        }

        // Resume can briefly race with an in-flight native SQLite connection,
        // so retry a couple of times before surfacing the failure as real.
        logger.warn(
          'SqliteApi init failed during recoverable resume window. Retrying.',
          {
            attempt,
            attempts,
            error,
          },
        );
        await new Promise((resolve) => window.setTimeout(resolve, delayMs));
      }
    }

    this._initPromise = null;
    throw lastError;
  }

  protected async init(): Promise<void> {
    SupabaseApi.getInstance();
    const platform = Capacitor.getPlatform();
    this._sqlite = new SQLiteConnection(CapacitorSQLite);
    if (platform === 'web') {
      const jeepEl = document.createElement('jeep-sqlite');
      document.body.appendChild(jeepEl);

      await customElements.whenDefined('jeep-sqlite');

      await this._sqlite.initWebStore();
    }

    let ret: capSQLiteResult | undefined;
    let isConn: boolean | undefined;
    try {
      ret = await this._sqlite.checkConnectionsConsistency();
      isConn = (await this._sqlite.isConnection(this.DB_NAME, false)).result;
    } catch (error) {
      logger.error('?? ~ Api ~ init ~ error:', error);
    }
    try {
      const localVersion = localStorage.getItem(CURRENT_SQLITE_VERSION);

      if (
        localVersion &&
        !Number.isNaN(localVersion) &&
        Number(localVersion) !== this.DB_VERSION
      ) {
        const upgradeStatements: capSQLiteVersionUpgrade[] = [];
        const localVersionNumber = Number(localVersion);

        const data = await fetch('databases/upgradeStatements.json');

        if (!data || !data.ok) return;
        const upgradeStatementsMap: Record<
          string,
          { statements?: string[]; tableChanges?: Record<string, string> }
        > = await data.json();

        for (
          let version = localVersionNumber + 1;
          version <= this.DB_VERSION;
          version++
        ) {
          const versionData = upgradeStatementsMap[version];

          if (versionData && versionData['statements']) {
            const currentStatements = [...versionData['statements']];

            // Track tables with schema changes for forced full sync
            for (const statement of versionData['statements']) {
              const match = statement.match(
                /(?:ALTER|CREATE|DROP)\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["']?(\w+)["']?/i,
              );
              if (match && match[1]) {
                const tableName = match[1];
                // Mark this table for full sync (will use old timestamp)
                this._tablesNeedingFullSync.add(tableName);
                logger.warn(
                  'setUpDatabase: Auto-detected schema change for table: ' +
                    tableName +
                    '. Will force full sync.',
                );
              }
            }

            upgradeStatements.push({
              toVersion: version,
              statements: currentStatements,
            });
          }

          if (versionData['tableChanges']) {
            for (const tableName in versionData['tableChanges']) {
              const changeDate = versionData['tableChanges'][tableName];
              if (!this._syncTableData[tableName]) {
                this._syncTableData[tableName] = changeDate;
              } else {
                if (
                  new Date(this._syncTableData[tableName]) >
                  new Date(changeDate)
                ) {
                  this._syncTableData[tableName] = changeDate;
                }
              }
            }
          }
        }

        logger.info(
          '?? ~ SqliteApi ~ init ~ upgradeStatements:',
          upgradeStatements,
        );

        await this._sqlite.addUpgradeStatement(this.DB_NAME, upgradeStatements);
        this._shouldImportBundledDataAfterUpgrade = true;

        localStorage.setItem(
          CURRENT_SQLITE_VERSION,
          this.DB_VERSION.toString(),
        );
      }
    } catch (error) {
      logger.error('?? ~ SqliteApi ~ init ~ error:', JSON.stringify(error));
    }

    if (ret && ret.result && isConn) {
      this._db = await this._sqlite.retrieveConnection(this.DB_NAME, false);
    } else {
      this._db = await this._sqlite.createConnection(
        this.DB_NAME,
        false,
        'no-encryption',
        this.DB_VERSION,
        false,
      );
    }
    try {
      await this._db?.open();
    } catch (err) {
      logger.error('?? ~ SqliteApi ~ init ~ err:', err);
      throw err;
    }
    await this.setUpDatabase();
  }

  public async close(): Promise<void> {
    if (this._initPromise) {
      try {
        await this._initPromise;
      } catch (error) {
        logger.error(
          'Error waiting for SQLite initialization before close:',
          error,
        );
      }
    }

    const db = this._db;
    const sqlite = this._sqlite;
    if (!db || !sqlite) return;

    try {
      await db.close();
    } catch (error) {
      logger.error('Error closing SQLite database:', error);
    }

    try {
      await sqlite.closeConnection(this.DB_NAME, false);
    } catch (error) {
      logger.error('Error closing SQLite connection:', error);
    } finally {
      this.resetDbHandles();
      this._initPromise = null;
    }
  }

  async clearCacheData(tableNames: readonly CACHETABLES[]): Promise<void> {
    await this.ensureInitialized();
    if (!this._db) return;
    const query = `PRAGMA foreign_keys=OFF;`;
    const result = await this._db?.query(query);
    logger.warn(result);
    for (const table of tableNames) {
      const tableDel = `DELETE FROM "${table}";`;
      const res = await this._db.query(tableDel);
      logger.info(res);
    }
    const vaccum = `VACUUM;`;
    const resv = await this._db.query(vaccum);
    logger.info(resv);
  }

  async getChaptersForCourse(
    courseId: string,
  ): Promise<TableTypes<'chapter'>[]> {
    await this.ensureInitialized();
    const query = `
    SELECT * FROM ${TABLES.Chapter}
    WHERE course_id = "${courseId}" AND is_deleted = 0
    ORDER BY sort_index ASC;
    `;
    const res = await this._db?.query(query);
    (res?.values ?? []).forEach((chapter: any) => {
      this.chapterCourseIdCache.set(chapter.id, chapter.course_id ?? courseId);
    });
    return res?.values ?? [];
  }

  async getPendingAssignmentForLesson(
    lessonId: string,
    classId: string,
    studentId: string,
  ): Promise<TableTypes<'assignment'> | undefined> {
    await this.ensureInitialized();
    const query = `
    SELECT a.*
    FROM ${TABLES.Assignment} a
    LEFT JOIN ${TABLES.Assignment_user} au
      ON a.id = au.assignment_id
      AND au.user_id = '${studentId}'
      AND au.is_deleted = 0
    LEFT JOIN result r ON a.id = r.assignment_id AND r.student_id = '${studentId}'
    WHERE a.lesson_id = '${lessonId}'
      AND a.class_id = '${classId}'
      AND a.is_deleted = 0
      AND (a.is_class_wise = 1 or au.user_id = '${studentId}')
      AND r.assignment_id IS NULL
    ORDER BY a.updated_at DESC
    LIMIT 1;
    `;
    const res = await this._db?.query(query);
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }

  async getFavouriteLessons(userId: string): Promise<TableTypes<'lesson'>[]> {
    await this.ensureInitialized();
    const query = `
      SELECT DISTINCT l.*
      FROM ${TABLES.FavoriteLesson} fl
      JOIN ${TABLES.Lesson} l
        ON fl.lesson_id = l.id
      WHERE fl.user_id = '${userId}'
      ORDER BY fl.created_at DESC
    `;
    const res = await this._db?.query(query);
    if (!res || !res.values || res.values.length < 1) return [];
    return res.values;
  }

  async getStudentClassesAndSchools(userId: string): Promise<{
    classes: TableTypes<'class'>[];
    schools: TableTypes<'school'>[];
  }> {
    await this.ensureInitialized();
    const data: {
      classes: TableTypes<'class'>[];
      schools: TableTypes<'school'>[];
    } = {
      classes: [],
      schools: [],
    };
    const res = await this._db?.query(
      `select c.*,
      JSON_OBJECT(
        'id',s.id,
        'name',s.name,
        'group1',s.group1,
        'group2',s.group2,
        'group3',s.group3,
        'image',s.image,
        'created_at',s.created_at,
        'updated_at',s.updated_at,
        'is_deleted',s.is_deleted
      ) AS school
       from ${TABLES.ClassUser} cu
      join ${TABLES.Class} c
      ON cu.class_id = c.id
      join ${TABLES.School} s
      ON c.school_id = s.id
      where c.is_deleted = 0 and user_id = "${userId}" and role = "${RoleType.STUDENT}" and cu.is_deleted = 0 order by cu.updated_at desc`,
    );
    if (!res || !res.values || res.values.length < 1) return data;
    data.classes = res.values;
    data.schools = res.values.map((val: any) => JSON.parse(val.school));
    return data;
  }

  async createUserDoc(
    user: TableTypes<'user'>,
  ): Promise<TableTypes<'user'> | undefined> {
    const countryCode = await this.getClientCountryCode();
    let locale: TableTypes<'locale'> | null = await this.getLocaleByIdOrCode(
      undefined,
      countryCode,
    );
    const localeId = locale?.id ?? DEFAULT_LOCALE_ID;
    const tcAgreedVersion = user.tc_agreed_version ?? 0;
    user.tc_agreed_version = tcAgreedVersion;

    await this.executeQuery(
      `
      INSERT INTO user (id, name, age, gender, avatar, image, curriculum_id, language_id, locale_id, tc_agreed_version)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
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
        (user.locale_id = localeId),
        tcAgreedVersion,
      ],
    );
    await this.updatePushChanges(TABLES.User, MUTATE_TYPES.INSERT, user);

    return user;
  }

  async syncDB(
    tableNames: TABLES[] = Object.values(TABLES),
    refreshTables: TABLES[] = [],
    isFirstSync?: boolean,
  ): Promise<boolean> {
    try {
      await this.syncDbNow(tableNames, refreshTables, isFirstSync);
      return true;
    } catch (error) {
      logger.error('🚀 ~ SqliteApi ~ syncDB ~ error:', error);
      return false;
    }
  }

  isSyncInProgress(): boolean {
    return this._syncInProgress;
  }
}
