import { DocumentData, Unsubscribe } from 'firebase/firestore';
import {
  MODES,
  LeaderboardDropdownList,
  LeaderboardRewards,
  TABLES,
  TableTypes,
  MUTATE_TYPES,
  LIVE_QUIZ,
  CURRENT_SQLITE_VERSION,
  DEFAULT_SUBJECT_IDS,
  OTHER_CURRICULUM,
  grade1,
  aboveGrade3,
  belowGrade1,
  grade2,
  grade3,
} from '../../common/constants';
import { StudentLessonResult } from '../../common/courseConstants';
import { AvatarObj } from '../../components/animation/Avatar';
import Course from '../../models/course';
import Lesson from '../../models/lesson';
import LiveQuizRoomObject from '../../models/liveQuizRoom';
import User from '../../models/user';
import { LeaderboardInfo, ServiceApi } from './ServiceApi';
import {
  SQLiteDBConnection,
  SQLiteConnection,
  CapacitorSQLite,
  capSQLiteResult,
  DBSQLiteValues,
} from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { SupabaseApi } from './SupabaseApi';
import { APIMode, ServiceConfig } from '../ServiceConfig';
import { v4 as uuidv4 } from 'uuid';
import { RoleType } from '../../interface/modelInterfaces';
import { Util } from '../../utility/util';
import { Table } from '@mui/material';
import ApiDataProcessor from './ApiDataProcessor';

export class SqliteApi implements ServiceApi {
  public static i: SqliteApi;
  private _db: SQLiteDBConnection | undefined;
  private _sqlite: SQLiteConnection | undefined;
  private DB_NAME = 'db_issue10';
  private DB_VERSION = 1;
  private _serverApi: SupabaseApi;
  private _currentMode: MODES;
  private _currentStudent: TableTypes<'user'> | undefined;
  private _currentClass: TableTypes<'class'> | undefined;
  private _currentSchool: TableTypes<'school'> | undefined;
  private _currentCourse:
    | Map<string, TableTypes<'course'> | undefined>
    | undefined;
  private _syncTableData = {};

  public static async getInstance(): Promise<SqliteApi> {
    if (!SqliteApi.i) {
      SqliteApi.i = new SqliteApi();
      SqliteApi.i._serverApi = SupabaseApi.getInstance();
      await SqliteApi.i.init();
    }
    return SqliteApi.i;
  }

  // No need to doing dataProcessor 
  private async init() {
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
      console.log('🚀 ~ Api ~ init ~ error:', error);
    }
    try {
      const localVersion = localStorage.getItem(CURRENT_SQLITE_VERSION);
      if (
        localVersion &&
        !Number.isNaN(localVersion) &&
        Number(localVersion) !== this.DB_VERSION
      ) {
        let upgradeStatements: string[] = [];
        const localVersionNumber = Number(localVersion);
        const data = await fetch('databases/upgradeStatements.json');
        if (!data || !data.ok) return;
        const upgradeStatementsMap: {
          [key: string]: string[];
        } = await data.json();
        for (
          let version = localVersionNumber + 1;
          version <= this.DB_VERSION;
          version++
        ) {
          if (
            upgradeStatementsMap[version] &&
            upgradeStatementsMap[version]['statements']
          ) {
            upgradeStatements = upgradeStatements.concat(
              upgradeStatementsMap[version]['statements']
            );

            const versionData = upgradeStatementsMap[version];
            if (versionData && versionData['tableChanges']) {
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
          }
        }
        console.log(
          '🚀 ~ SqliteApi ~ init ~ upgradeStatements:',
          upgradeStatements
        );
        await this._sqlite.addUpgradeStatement(
          this.DB_NAME,
          this.DB_VERSION,
          upgradeStatements
        );
        localStorage.setItem(
          CURRENT_SQLITE_VERSION,
          this.DB_VERSION.toString()
        );
      }
    } catch (error) {
      console.log('🚀 ~ SqliteApi ~ init ~ error:', JSON.stringify(error));
    }

    if (ret && ret.result && isConn) {
      this._db = await this._sqlite.retrieveConnection(this.DB_NAME, false);
    } else {
      this._db = await this._sqlite.createConnection(
        this.DB_NAME,
        false,
        'no-encryption',
        this.DB_VERSION,
        false
      );
    }
    try {
      await this._db.open();
    } catch (err) {
      console.log('🚀 ~ SqliteApi ~ init ~ err:', err);
    }
    await this.setUpDatabase();
    return this._db;
  }

  // data setup
  private async setUpDatabase() {
    console.log('🚀 ~ SqliteApi ~ setUpDatabase ~ setUpDatabase:');
    if (!this._db || !this._sqlite) return;
    try {
      const exportedData = await this._db.exportToJson('full');
      console.log(
        '🚀 ~ Api ~ setUpDatabase ~ exportedData:',
        JSON.stringify(exportedData.export?.tables)
      );
      if (exportedData.export?.tables) {
        for (const da of exportedData.export?.tables) {
          console.log(
            'new schema name: ',
            da.name,
            ' schema: ',
            JSON.stringify(da.schema)
          );
        }
      }
    } catch (error) {
      console.log('🚀 ~ SqliteApi ~ setUpDatabase ~ error:', error);
    }
    let res1: DBSQLiteValues | undefined = undefined;
    try {
      const stmt =
        "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table';";
      res1 = await this._db.query(stmt);
      console.log('🚀 ~ SqliteApi ~ setUpDatabase ~ res1:', res1);
    } catch (error) {
      console.log(
        '🚀 ~ SqliteApi ~ setUpDatabase ~ error:',
        JSON.stringify(error)
      );
    }
    if (
      !res1 ||
      !res1.values ||
      !res1.values.length ||
      res1.values[0].count < 10
    ) {
      try {
        // const data = await fetch("databases/init_sqlite.json");
        // if (!data || !data.ok) return;
        // const queries = await data.json();
        // for (const query of queries) {
        //   const res298 = await this.executeQuery(query);
        // }

        try {
          const importData = await fetch('databases/import.json');
          if (!importData || !importData.ok) return;
          const importJson = JSON.stringify((await importData.json()) ?? {});
          const resImport = await this._sqlite.importFromJson(importJson);
          localStorage.setItem(
            CURRENT_SQLITE_VERSION,
            this.DB_VERSION.toString()
          );
          console.log('🚀 ~ SqliteApi ~ setUpDatabase ~ resImport:', resImport);
          // if (!Capacitor.isNativePlatform())
          window.location.reload();
        } catch (error) {
          console.log('🚀 ~ SqliteApi ~ setUpDatabase ~ error:', error);
        }
      } catch (error) {
        console.log('🚀 ~ SqliteApi ~ setUpDatabase ~ error:', error);
      }
    }
    if (this._syncTableData) {
      const tableNames = Object.keys(this._syncTableData) ?? [];
      if (tableNames.length > 0) {
        const tables = "'" + tableNames.join("', '") + "'";
        const tablePullSync = `SELECT * FROM pull_sync_info WHERE table_name IN (${tables});`;
        const res = (await this._db?.query(tablePullSync))?.values ?? [];
        res.forEach((row) => {
          if (
            row.last_pulled &&
            new Date(this._syncTableData[row.table_name]) >
              new Date(row.last_pulled)
          ) {
            this._syncTableData[row.table_name] = row.last_pulled;
          }
        });
        for (const _tableName of Object.keys(this._syncTableData)) {
          const updatePullSyncQuery = `UPDATE pull_sync_info SET last_pulled = '${this._syncTableData[_tableName]}' WHERE table_name = '${_tableName}'`;
          console.log(
            '🚀 ~ SqliteApi ~ setUpDatabase ~ updatePullSyncQuery:',
            updatePullSyncQuery
          );
          await this.executeQuery(updatePullSyncQuery);
        }
      }
    }

    const config = ServiceConfig.getInstance(APIMode.SQLITE);
    const isUserLoggedIn = await config.authHandler.isUserLoggedIn();
    if (isUserLoggedIn) {
      console.log('syncing');
      let user;
      try {
        user = await config.authHandler.getCurrentUser();
      } catch (error) {
        console.log('🚀 ~ SqliteApi ~ setUpDatabase ~ error:', error);
      }
      if (!user) {
        await this.syncDbNow();
      } else {
        this.syncDbNow();
      }
    } else {
      console.log('not syncing');
    }
  }

  // no need to move 
  private async executeQuery(
    statement: string,
    values?: any[] | undefined,
    isSQL92?: boolean | undefined
  ) {
    if (!this._db || !this._sqlite) return;
    const res = await this._db.query(statement, values, isSQL92);
    if (!Capacitor.isNativePlatform())
      await this._sqlite?.saveToStore(this.DB_NAME);
    return res;
  }

  // no need to change and move 
  private async pullChanges(tableNames: TABLES[]) {
    if (!this._db) return;
    const tables = "'" + tableNames.join("', '") + "'";

    const tablePullSync = `SELECT * FROM pull_sync_info WHERE table_name IN (${tables});`;
    let res: any[] = [];
    try {
      res = (await this._db.query(tablePullSync)).values ?? [];
    } catch (error) {
      console.log('🚀 ~ Api ~ syncDB ~ error:', error);
      await this.createSyncTables();
    }
    const lastPullTables = new Map();
    if (res?.length) {
      res.forEach((row) => {
        lastPullTables.set(row.table_name, row.last_pulled);
      });
    }
    const data = await SupabaseApi.i.getTablesData(tableNames, lastPullTables);
    for (const tableName of tableNames) {
      if (data.get(tableName)) {
        const tableData = data.get(tableName) ?? [];
        const existingColumns = await this.getTableColumns(tableName);
        console.log(
          '🚀 ~ SqliteApi ~ pullChanges ~ tableInfo:',
          existingColumns
        );
        if (existingColumns) {
          for (const row of tableData) {
            const fieldNames = Object.keys(row).filter((fieldName) =>
              existingColumns.includes(fieldName)
            );
            const fieldValues = fieldNames.map((fieldName) => row[fieldName]);
            const fieldPlaceholders = fieldNames.map(() => '?').join(', ');

            if (fieldNames.length === 0) continue; // Skip if no valid columns

            const stmt = `INSERT OR REPLACE INTO ${tableName} (${fieldNames.join(', ')}) VALUES (${fieldPlaceholders})`;
            console.log(
              '🚀 ~ pullChanges ~ stmt, fieldValues:',
              stmt,
              fieldValues,
              fieldValues.length
            );

            try {
              await this.executeQuery(stmt, fieldValues);
            } catch (error) {
              console.log('🚀 ~ pullChanges ~ Error:', error);
            }
          }
        }

        const lastPulled = new Date().toISOString();
        const stmt = `INSERT OR REPLACE INTO pull_sync_info (table_name, last_pulled) VALUES (?, ?)`;
        await this.executeQuery(stmt, [tableName, lastPulled]);
      }
    }
  }
  // PRAGMA data table
  async getTableColumns(tableName: string): Promise<string[] | undefined> {
    const query = `PRAGMA table_info(${tableName})`;
    const result = await this._db?.query(query);
    
    return result?.values?.map((row: any) => row.name);
  }

  private async pushChanges(tableNames: TABLES[]) {
    if (!this._db) return false;
    const tables = "'" + tableNames.join("', '") + "'";

    const tablePushSync = `SELECT * FROM push_sync_info WHERE table_name IN (${tables}) ORDER BY created_at;`;
    let res: any[] = [];
    try {
      res = (await this._db.query(tablePushSync)).values ?? [];
      console.log('🚀 ~ syncDB ~ tablePushSync:', res);
    } catch (error) {
      console.log('🚀 ~ Api ~ syncDB ~ error:', error);
      await this.createSyncTables();
    }
    if (res && res.length) {
      for (const data of res) {
        const newData = JSON.parse(data.data);
        console.log('🚀 ~ SqliteApi ~ pushChanges ~ newData:', newData);
        const isMutated = await this._serverApi.mutate(
          data.change_type,
          data.table_name,
          newData,
          newData.id
        );
        console.log('🚀 ~ Api ~ pushChanges ~ isMutated:', isMutated);
        if (!isMutated) {
          return false;
        }
        await this.executeQuery(
          `DELETE FROM push_sync_info WHERE id = ? AND table_name = ?`,
          [data.id, data.table_name]
        );
      }
    }
    return true;
  }

  // sync upadte data 
  async syncDbNow(
    tableNames: TABLES[] = Object.values(TABLES),
    refreshTables: TABLES[] = []
  ) {
    if (!this._db) return;
    const refresh_tables = "'" + refreshTables.join("', '") + "'";
    await this.executeQuery(
      `UPDATE pull_sync_info SET last_pulled = '2024-01-01 00:00:00' WHERE table_name IN (${refresh_tables})`
    );
    await this.pullChanges(tableNames);
    const res = await this.pushChanges(tableNames);
    const tables = "'" + tableNames.join("', '") + "'";
    this.executeQuery(
      `UPDATE pull_sync_info SET last_pulled = CURRENT_TIMESTAMP WHERE table_name IN (${tables})`
    );
    return res;
  }

  private async createSyncTables() {
    const createPullSyncInfoTable = `CREATE TABLE IF NOT EXISTS pull_sync_info (
      table_name TEXT NOT NULL PRIMARY KEY,
      last_pulled TIMESTAMP NOT NULL
  )`;
    const createPushSyncInfoTable = `CREATE TABLE IF NOT EXISTS push_sync_info (
      id TEXT NOT NULL PRIMARY KEY,
      table_name TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      change_type TEXT NOT NULL,
      data TEXT NOT NULL
  )`;

    await this.executeQuery(createPullSyncInfoTable);
    await this.executeQuery(createPushSyncInfoTable);
  }

  private async updatePushChanges(
    tableName: TABLES,
    mutateType: MUTATE_TYPES,
    data: { [key: string]: any }
  ) {
    if (!this._db) return;
    data['updated_at'] = new Date().toISOString();
    const stmt = `INSERT OR REPLACE INTO push_sync_info (id, table_name, change_type, data) VALUES (?, ?, ?, ?)`;
    const variables = [
      uuidv4(),
      tableName.toString(),
      mutateType,
      JSON.stringify(data),
    ];
    console.log('🚀 ~ Api ~ variables:', stmt, variables);
    await this.executeQuery(stmt, variables);
    return await this.syncDbNow([tableName]);
  }

  async createProfile(
    name: string,
    age: number | undefined,
    gender: string | undefined,
    avatar: string | undefined,
    image: string | undefined,
    boardDocId: string | undefined,
    gradeDocId: string | undefined,
    languageDocId: string | undefined
  ): Promise<TableTypes<'user'>> {
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw 'User is not Logged in';
    const studentId = uuidv4();
    const newStudent: TableTypes<'user'> = {
      id: studentId,
      name,
      age: age ?? null,
      gender: gender ?? null,
      avatar: avatar ?? null,
      image: image ?? null,
      curriculum_id: boardDocId ?? null,
      grade_id: gradeDocId ?? null,
      language_id: languageDocId ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
      is_tc_accepted: true,
      email: null,
      phone: null,
      fcm_token: null,
      music_off: false,
      sfx_off: false,
      student_id: null,
    };

    await this.executeQuery(
      `
      INSERT INTO user (id, name, age, gender, avatar, image, curriculum_id, grade_id, language_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
      [
        newStudent.id,
        newStudent.name,
        newStudent.age,
        newStudent.gender,
        newStudent.avatar,
        newStudent.image,
        newStudent.curriculum_id,
        newStudent.grade_id,
        newStudent.language_id,
        newStudent.created_at,
        newStudent.updated_at,
      ]
    );

    const parentUserId = uuidv4();
    await this.executeQuery(
      `
      INSERT INTO parent_user (id, parent_id, student_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?);
      `,
      [
        parentUserId,
        _currentUser.id,
        studentId,
        new Date().toISOString(),
        new Date().toISOString(),
      ]
    );

    let courses;
    if (gradeDocId && boardDocId) {
      courses = await this.getCourseByUserGradeId(gradeDocId, boardDocId);
    }

    await this.updatePushChanges(TABLES.User, MUTATE_TYPES.INSERT, newStudent);
    await this.updatePushChanges(TABLES.ParentUser, MUTATE_TYPES.INSERT, {
      id: parentUserId,
      parent_id: _currentUser.id,
      student_id: studentId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
    });

    for (const course of courses) {
      const newUserCourse: TableTypes<'user_course'> = {
        course_id: course.id,
        created_at: new Date().toISOString(),
        id: uuidv4(),
        is_deleted: false,
        updated_at: new Date().toISOString(),
        user_id: studentId,
      };
      await this.executeQuery(
        `
      INSERT INTO user_course (id, user_id, course_id)
    VALUES (?, ?, ?);
  `,
        [newUserCourse.id, newUserCourse.user_id, newUserCourse.course_id]
      );
      this.updatePushChanges(
        TABLES.UserCourse,
        MUTATE_TYPES.INSERT,
        newUserCourse
      );
    }

    return newStudent;
  }
  async createSchool(
    name: string,
    group1: string,
    group2: string,
    group3: string
  ): Promise<TableTypes<'school'>> {
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw 'User is not Logged in';

    const schoolId = uuidv4();
    const newSchool: TableTypes<'school'> = {
      id: schoolId,
      name,
      group1: group1 ?? null,
      group2: group2 ?? null,
      group3: group3 ?? null,
      image: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
    };
    console.log('school data..', newSchool);

    await this.executeQuery(
      `
      INSERT INTO school (id, name, group1, group2, group3, image, created_at, updated_at, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
      [
        newSchool.id,
        newSchool.name,
        newSchool.group1,
        newSchool.group2,
        newSchool.group3,
        newSchool.image,
        newSchool.created_at,
        newSchool.updated_at,
        newSchool.is_deleted,
      ]
    );

    await this.updatePushChanges(TABLES.School, MUTATE_TYPES.INSERT, newSchool);

    // Insert into school_user table
    const schoolUserId = uuidv4();
    const newSchoolUser: TableTypes<'school_user'> = {
      id: schoolUserId,
      school_id: schoolId,
      user_id: _currentUser.id,
      role: RoleType.PRINCIPAL,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
    };
    console.log('school user data..', newSchoolUser);

    await this.executeQuery(
      `
      INSERT INTO school_user (id,school_id, user_id, role, created_at, updated_at, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?);
      `,
      [
        newSchoolUser.id,
        newSchoolUser.school_id,
        newSchoolUser.user_id,
        newSchoolUser.role,
        newSchoolUser.created_at,
        newSchoolUser.updated_at,
        newSchoolUser.is_deleted,
      ]
    );

    await this.updatePushChanges(
      TABLES.SchoolUser,
      MUTATE_TYPES.INSERT,
      newSchoolUser
    );
    return newSchool;
  }
  async updateSchoolProfile(
    school: TableTypes<'school'>,
    name: string,
    group1: string,
    group2: string,
    group3: string
  ): Promise<TableTypes<'school'>> {
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw 'User is not Logged in';

    const updatedSchool: TableTypes<'school'> = {
      name: name ?? school.name,
      group1: group1 ?? school.group1,
      group2: group2 ?? school.group2,
      group3: group3 ?? school.group3,
      updated_at: new Date().toISOString(),
      created_at: school.created_at,
      id: school.id,
      image: null,
      is_deleted: false,
    };
    const updatedSchoolQuery = `
    UPDATE school
    SET name = ?, group1 = ?, group2 = ?, group3 = ?, updated_at=?
    WHERE id = ?;
    `;

    await this.executeQuery(updatedSchoolQuery, [
      updatedSchool.name,
      updatedSchool.group1,
      updatedSchool.group2,
      updatedSchool.group3,
      updatedSchool.updated_at,
      school.id,
    ]);

    this.updatePushChanges(TABLES.School, MUTATE_TYPES.UPDATE, updatedSchool);

    return updatedSchool;
  }

  async createStudentProfile(
    name: string,
    age: number | undefined,
    gender: string | undefined,
    avatar: string | null,
    image: string | null,
    boardDocId: string | null,
    gradeDocId: string | null,
    languageDocId: string | null,
    classId: string,
    role: 'student',
    studentId: string
  ): Promise<TableTypes<'user'>> {
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw 'User is not Logged in';

    const userId = uuidv4();
    const newStudent: TableTypes<'user'> = {
      id: userId,
      name,
      age: age ?? null,
      gender: gender ?? null,
      avatar: avatar ?? null,
      image: image ?? null,
      curriculum_id: boardDocId ?? null,
      grade_id: gradeDocId ?? null,
      language_id: languageDocId ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
      is_tc_accepted: true,
      email: null,
      phone: null,
      fcm_token: null,
      music_off: false,
      sfx_off: false,
      student_id: studentId ?? null,
    };
    // Insert into user table
    await this.executeQuery(
      `
      INSERT INTO user (id, name, age, gender, avatar, image, curriculum_id, grade_id, language_id, created_at, updated_at, student_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
      [
        newStudent.id,
        newStudent.name,
        newStudent.age,
        newStudent.gender,
        newStudent.avatar,
        newStudent.image,
        newStudent.curriculum_id,
        newStudent.grade_id,
        newStudent.language_id,
        newStudent.created_at,
        newStudent.updated_at,
        newStudent.student_id,
      ]
    );
    await this.updatePushChanges(TABLES.User, MUTATE_TYPES.INSERT, newStudent);
    // Insert into class_user table
    const classUserId = uuidv4();
    const newClassUser: TableTypes<'class_user'> = {
      id: classUserId,
      class_id: classId,
      user_id: userId,
      role: role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
    };

    await this.executeQuery(
      `
      INSERT INTO class_user (id, class_id, user_id, role, created_at, updated_at, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?);
      `,
      [
        newClassUser.id,
        newClassUser.class_id,
        newClassUser.user_id,
        newClassUser.role,
        newClassUser.created_at,
        newClassUser.updated_at,
        newClassUser.is_deleted,
      ]
    );
    this.updatePushChanges(TABLES.ClassUser, MUTATE_TYPES.INSERT, newClassUser);
    return newStudent;
  }

  async updateSchoolCourseSelection(
    schoolId: string,
    selectedCourseIds: string[]
  ): Promise<void> {
    const currentDate = new Date().toISOString();
    console.log(
      'check how many lessons we are getting in api',
      selectedCourseIds
    );

    for (const courseId of selectedCourseIds) {
      // Check if the course is already assigned to the school
      const isExist = await this._db?.query(
        `SELECT * FROM school_course WHERE school_id = ? AND course_id = ?;`,
        [schoolId, courseId]
      );

      if (!isExist || !isExist.values || isExist.values.length < 1) {
        // Case 1: Course is not assigned, so we insert it
        const newId = uuidv4();
        const newSchoolCourseEntry = {
          id: newId,
          school_id: schoolId,
          course_id: courseId,
          created_at: currentDate,
          updated_at: currentDate,
          is_deleted: false, // New entry should have is_deleted set to false
        };

        await this.executeQuery(
          `INSERT INTO school_course (id, school_id, course_id, created_at, updated_at, is_deleted)
           VALUES (?, ?, ?, ?, ?, ?);`,
          [
            newSchoolCourseEntry.id,
            newSchoolCourseEntry.school_id,
            newSchoolCourseEntry.course_id,
            newSchoolCourseEntry.created_at,
            newSchoolCourseEntry.updated_at,
            newSchoolCourseEntry.is_deleted,
          ]
        );

        // Trigger change notification for the new entry
        this.updatePushChanges(
          TABLES.SchoolCourse,
          MUTATE_TYPES.INSERT,
          newSchoolCourseEntry
        );
      } else {
        // Case 2: Course is already assigned
        const existingEntry = isExist.values[0];

        if (existingEntry.is_deleted) {
          // Case 2a: Course was marked as deleted, reactivate it
          await this.executeQuery(
            `UPDATE school_course SET is_deleted = 0, updated_at = ? WHERE id = ?;`,
            [currentDate, existingEntry.id]
          );

          // Trigger change notification for the re-activation
          this.updatePushChanges(TABLES.SchoolCourse, MUTATE_TYPES.UPDATE, {
            id: existingEntry.id,
            is_deleted: false,
            updated_at: currentDate,
          });
        } else {
          // Case 2b: Course is already active, update the updated_at field
          await this.executeQuery(
            `UPDATE school_course SET updated_at = ? WHERE id = ?;`,
            [currentDate, existingEntry.id]
          );

          // Trigger change notification for the updated timestamp
          this.updatePushChanges(TABLES.SchoolCourse, MUTATE_TYPES.UPDATE, {
            id: existingEntry.id,
            updated_at: currentDate,
          });
        }
      }
    }
  }

  async updateClassCourseSelection(
    classId: string,
    selectedCourseIds: string[]
  ): Promise<void> {
    const currentDate = new Date().toISOString();

    for (const courseId of selectedCourseIds) {
      // Check if the course is already assigned to the class
      const isExist = await this._db?.query(
        `SELECT * FROM class_course WHERE class_id = ? AND course_id = ?;`,
        [classId, courseId]
      );

      if (!isExist || !isExist.values || isExist.values.length < 1) {
        // Case 1: Course is not assigned, so we insert it
        const newId = uuidv4();
        const newClassCourseEntry = {
          id: newId,
          class_id: classId,
          course_id: courseId,
          created_at: currentDate,
          updated_at: currentDate,
          is_deleted: false, // New entry should have is_deleted set to false
        };

        await this.executeQuery(
          `INSERT INTO class_course (id, class_id, course_id, created_at, updated_at, is_deleted)
        VALUES (?, ?, ?, ?, ?, ?);`,
          [
            newClassCourseEntry.id,
            newClassCourseEntry.class_id,
            newClassCourseEntry.course_id,
            newClassCourseEntry.created_at,
            newClassCourseEntry.updated_at,
            newClassCourseEntry.is_deleted, // always false for new entries
          ]
        );

        // Trigger change notification for the new entry
        this.updatePushChanges(
          TABLES.ClassCourse,
          MUTATE_TYPES.INSERT,
          newClassCourseEntry
        );
      } else {
        // Case 2: Course is already assigned
        const existingEntry = isExist.values[0];

        if (existingEntry.is_deleted) {
          // Case 2a: Course was marked as deleted, reactivate it
          await this.executeQuery(
            `UPDATE class_course SET is_deleted = 0, updated_at = ? WHERE id = ?;`,
            [currentDate, existingEntry.id]
          );

          // Trigger change notification for the re-activation
          this.updatePushChanges(TABLES.ClassCourse, MUTATE_TYPES.UPDATE, {
            id: existingEntry.id,
            is_deleted: false,
            updated_at: currentDate,
          });
        } else {
          // Case 2b: Course is already active, update the updated_at field
          await this.executeQuery(
            `UPDATE class_course SET updated_at = ? WHERE id = ?;`,
            [currentDate, existingEntry.id]
          );

          // Trigger change notification for the updated timestamp
          this.updatePushChanges(TABLES.ClassCourse, MUTATE_TYPES.UPDATE, {
            id: existingEntry.id,
            updated_at: currentDate,
          });
        }
      }
    }
  }

  async deleteProfile(studentId: string) {
    if (!this._db) return;
    try {
      const authHandler = ServiceConfig.getI()?.authHandler;
      const currentUser = await authHandler?.getCurrentUser();
      if (!currentUser) return;
      await this._serverApi.deleteProfile(studentId);

      const localParentId = currentUser.id;

      // Check if the student is connected to any class
      const classResult = await this._db.query(
        `SELECT class_id FROM class_user WHERE user_id = ? AND is_deleted = 0 LIMIT 1`,
        [studentId]
      );
      const localClassId =
        classResult?.values && classResult.values.length > 0
          ? classResult.values[0].class_id
          : null;
      if (localClassId) {
        // Remove the student's connection to the class
        await this.executeQuery(
          `DELETE FROM class_user WHERE user_id = ? AND is_deleted = 0`,
          [studentId]
        );

        // Check if any other child of the parent is connected to the same class
        const otherChildrenConnected = await this._db.query(
          `
          SELECT 1
           FROM class_user cu
           JOIN parent_user pu ON cu.user_id = pu.student_id
           WHERE cu.class_id = ?
           AND pu.parent_id = ?
           AND pu.student_id != ?
           AND cu.is_deleted = 0
           AND pu.is_deleted = 0
         `,
          [localClassId, localParentId, studentId]
        );
        // If no other child is connected, remove the parent's connection from the class
        if (
          otherChildrenConnected.values == null ||
          otherChildrenConnected.values.length < 1 ||
          !otherChildrenConnected.values[0]
        ) {
          await this.executeQuery(
            `
          DELETE FROM class_user
          WHERE class_id = ?
          AND user_id = ?
          AND role = 'parent'`,
            [localClassId, localParentId]
          );
        }
      }

      // Remove the student's connection to the parent and other related records
      await this.executeQuery(`DELETE FROM parent_user WHERE student_id = ?`, [
        studentId,
      ]);
      await this.executeQuery(`DELETE FROM user_badge WHERE user_id = ?`, [
        studentId,
      ]);
      await this.executeQuery(`DELETE FROM user_bonus WHERE user_id = ?`, [
        studentId,
      ]);
      await this.executeQuery(`DELETE FROM user_course WHERE user_id = ?`, [
        studentId,
      ]);
      await this.executeQuery(`DELETE FROM user_sticker WHERE user_id = ?`, [
        studentId,
      ]);
      await this.executeQuery(`DELETE FROM assignment_user WHERE user_id = ?`, [
        studentId,
      ]);
      await this.executeQuery(`DELETE FROM favorite_lesson WHERE user_id = ?`, [
        studentId,
      ]);
      await this.executeQuery(`DELETE FROM result WHERE student_id = ?`, [
        studentId,
      ]);
      await this.executeQuery(`DELETE FROM user WHERE id = ?`, [studentId]);
    } catch (error) {
      console.log('🚀 ~ SqliteApi ~ deleteProfile ~ error:', error);
    }
  }

  async getCourseByUserGradeId(
    gradeDocId: string | null,
    boardDocId: string | null
  ): Promise<TableTypes<'course'>[]> {
    if (!gradeDocId) {
      throw new Error('Grade document ID is required.');
    }

    if (!boardDocId) {
      throw new Error('Board document ID is required.');
    }

    let courseIds: TableTypes<'course'>[] = [];
    let isGrade1: boolean = false;
    let isGrade2: boolean = false;

    if (gradeDocId === grade1 || gradeDocId === belowGrade1) {
      isGrade1 = true;
    } else if (
      gradeDocId === grade2 ||
      gradeDocId === grade3 ||
      gradeDocId === aboveGrade3
    ) {
      isGrade2 = true;
    } else {
      isGrade2 = true;
    }

    const gradeLevel = isGrade1 ? grade1 : isGrade2 ? grade2 : gradeDocId;
    
    const gradeCourses = await this.getCoursesByGrade(gradeLevel);
    const curriculumCourses = gradeCourses.filter(
      (course: TableTypes<'course'>) => {
        return course.curriculum_id === boardDocId;
      }
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
      (subjectId) => !subjectIds.includes(subjectId)
    );

    remainingSubjects.forEach((subjectId) => {
      const courses = gradeCourses.filter((course) => {
        const subjectRef = course.subject_id;
        if (
          !!subjectRef &&
          subjectRef === subjectId &&
          course.curriculum_id === OTHER_CURRICULUM
        )
          return true;
      });
      courses.forEach((course) => {
        courseIds.push(course);
      });
    });

    return courseIds;
  }

  async getAllCurriculums(): Promise<TableTypes<'curriculum'>[]> {
    const res = await this._db?.query(
      `SELECT * FROM ${TABLES.Curriculum} ORDER BY name ASC`
    );
    console.log('🚀 ~ SqliteApi ~ getAllCurriculums ~ res:', res);
    return res?.values ?? [];
  }

  async getAllGrades(): Promise<TableTypes<'grade'>[]> {
    const res = await this._db?.query('select * from ' + TABLES.Grade);
    return res?.values ?? [];
  }

  async getGradeById(id: string): Promise<TableTypes<'grade'> | undefined> {
    const res = await this._db?.query(
      `select * from ${TABLES.Grade} where id = "${id}"`
    );

    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }

  async getGradesByIds(gradeIds: string[]): Promise<TableTypes<'grade'>[]> {
    if (!gradeIds || gradeIds.length === 0) {
      return [];
    }
    // Format the IDs for the SQL query
    const formattedIds = gradeIds.map((id) => `"${id}"`).join(', ');
    // Construct and execute the query
    const res = await this._db?.query(
      `SELECT * FROM ${TABLES.Grade} WHERE id IN (${formattedIds})`
    );

    if (!res || !res.values || res.values.length === 0) {
      return []; // Return an empty array if no grades are found
    }
    // Return the retrieved grades
    return res.values;
  }

  async getCurriculumById(
    id: string
  ): Promise<TableTypes<'curriculum'> | undefined> {
    const res = await this._db?.query(
      `select * from ${TABLES.Curriculum} where id = "${id}"`
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }

  async getCurriculumsByIds(
    ids: string[]
  ): Promise<TableTypes<'curriculum'>[]> {
    if (!ids || ids.length === 0) {
      return [];
    }

    // Format the IDs for the SQL query
    const formattedIds = ids.map((id) => `"${id}"`).join(', ');

    // Construct and execute the query
    const res = await this._db?.query(
      `SELECT * FROM ${TABLES.Curriculum} WHERE id IN (${formattedIds})`
    );

    if (!res || !res.values || res.values.length < 1) {
      return [];
    }

    // Assuming you need to return the first item or an empty array
    return res.values;
  }

  async getAllLanguages(): Promise<TableTypes<'language'>[]> {
    const res = await this._db?.query('select * from ' + TABLES.Language);
    console.log('🚀 ~ SqliteApi ~ getAllLanguages ~ res:', res);
    return res?.values ?? [];
  }

  // pending data
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
          linkedData.schools[0].id
        );
      }
    }
  }

  async getParentStudentProfiles(): Promise<TableTypes<'user'>[]> {
    if (!this._db) throw 'Db is not initialized';
    const authHandler = ServiceConfig.getI()?.authHandler;
    const currentUser = await authHandler?.getCurrentUser();
        if (!currentUser) throw 'User is not Logged in';
        const query = `
      SELECT *
      FROM ${TABLES.ParentUser} AS parent
      JOIN ${TABLES.User} AS student ON parent.student_id = student.id
      WHERE parent.parent_id = "${currentUser.id}";
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
    value: Map<string, TableTypes<'course'> | undefined> | undefined
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
    console.log('🚀 ~ SqliteApi ~ updateSoundFlag ~ res:', res);
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
    console.log('🚀 ~ SqliteApi ~ updateMusicFlag ~ res:', res);
    this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, {
      music_off: value ? 1 : 0,
      id: userId,
    });
  }
  async updateLanguage(userId: string, value: string) {
    const query = `
      UPDATE "user"
      SET language_id = "${value}"
      WHERE id = "${userId}";
    `;
    const res = await this.executeQuery(query);
    console.log('🚀 ~ SqliteApi ~ updateLanguage ~ res:', res);
    this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, {
      language_id: value,
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
    console.log(
      '🚀 ~ SqliteApi ~ updateTcAccept ~ res:',
      res,
      ServiceConfig.getI().authHandler.currentUser
    );
    const auth = ServiceConfig.getI().authHandler;
    const currentUser = await auth.getCurrentUser();
    if (currentUser) {
      currentUser.is_tc_accepted = true;
      auth.currentUser = currentUser;
    }
    this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, {
      is_tc_accepted: 1,
      id: userId,
    });
  }
  async getLanguageWithId(
    id: string
  ): Promise<TableTypes<'language'> | undefined> {
    const res = await this._db?.query(
      `select * from ${TABLES.Language} where id = "${id}"`
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }

  async getLessonWithCocosLessonId(
    lessonId: string
  ): Promise<TableTypes<'lesson'> | null> {
    const res = await this._db?.query(
      `select * from ${TABLES.Lesson} where cocos_lesson_id = "${lessonId}"`
    );
    if (!res || !res.values || res.values.length < 1) return null;
    return res.values[0];
  }

  // its working no need to move  
  async getCoursesForParentsStudent(
    studentId: string
  ): Promise<TableTypes<'course'>[]> {
    const query = `
    SELECT *
    FROM ${TABLES.UserCourse} AS uc
    JOIN ${TABLES.Course} AS course ON uc.course_id= course.id
    WHERE uc.user_id = "${studentId}";
  `;
    const res = await this._db?.query(query);
    return res?.values ?? [];
  }

  async getAdditionalCourses(
    studentId: string
  ): Promise<TableTypes<'course'>[]> {
    const res = await this._db?.query(`
    SELECT c.*
    FROM ${TABLES.Course} c
    LEFT JOIN user_course uc ON c.id = uc.course_id AND uc.user_id = "${studentId}"
    WHERE uc.course_id IS NULL;
    `);
    return res?.values ?? [];
  }

  async getCoursesForClassStudent(
    classId: string
  ): Promise<TableTypes<'course'>[]> {
    const query = `
      SELECT course.*
      FROM ${TABLES.ClassCourse} AS cc
      JOIN ${TABLES.Course} AS course ON cc.course_id = course.id
      WHERE cc.class_id = ? AND cc.is_deleted = 0;
    `;
    const res = await this._db?.query(query, [classId]);
    return res?.values ?? [];
  }

  async getLesson(id: string): Promise<TableTypes<'lesson'> | undefined> {
    const res = await this._db?.query(
      `select * from ${TABLES.Lesson} where id = "${id}"`
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }

  async getChapterById(id: string): Promise<TableTypes<'chapter'> | undefined> {
    const res = await this._db?.query(
      `select * from ${TABLES.Chapter} where id = "${id}"`
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }

  async getLessonsForChapter(
    chapterId: string
  ): Promise<TableTypes<'lesson'>[]> {
    const query = `
    SELECT *
    FROM ${TABLES.ChapterLesson} AS cl
    JOIN ${TABLES.Lesson} AS lesson ON cl.lesson_id= lesson.id
    WHERE cl.chapter_id = "${chapterId}"
    ORDER BY sort_index ASC;
  `;
    const res = await this._db?.query(query);
    return res?.values ?? [];
  }

  async getDifferentGradesForCourse(course: TableTypes<'course'>): Promise<{
    grades: TableTypes<'grade'>[];
    courses: TableTypes<'course'>[];
  }> {
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
    const gradeMap: {
      grades: TableTypes<'grade'>[];
      courses: TableTypes<'course'>[];
    } = { grades: [], courses: [] };
    for (const data of res?.values ?? []) {
      const grade = JSON.parse(data.grade);
      delete data.grade;
      const course = data;
      const gradeAlreadyExists = gradeMap.grades.find(
        (_grade) => _grade.id === grade.id
      );
      if (gradeAlreadyExists) continue;
      gradeMap.courses.push(course);
      gradeMap.grades.push(grade);
    }

    gradeMap.grades.sort((a, b) => {
      //Number.MAX_SAFE_INTEGER is using when sortIndex is not found GRADES (i.e it gives default value)
      const sortIndexA = a.sort_index || Number.MAX_SAFE_INTEGER;
      const sortIndexB = b.sort_index || Number.MAX_SAFE_INTEGER;

      return sortIndexA - sortIndexB;
    });
    return gradeMap as any;
  }

  // not impletment 
  getAvatarInfo(): Promise<AvatarObj | undefined> {
    throw new Error('Method not implemented.');
  }

  // not impletment 
  getLessonResultsForStudent(
    studentId: string
  ): Promise<Map<string, StudentLessonResult> | undefined> {
    throw new Error('Method not implemented.');
  }

  // 
  async getLiveQuizLessons(
    classId: string,
    studentId: string
  ): Promise<TableTypes<'assignment'>[]> {
    const now = new Date().toISOString();
    const query = `
    SELECT a.*
    FROM ${TABLES.Assignment} a
    LEFT JOIN ${TABLES.Assignment_user} au ON a.id = au.assignment_id
    LEFT JOIN result r ON a.id = r.assignment_id AND r.student_id = "${studentId}"
   WHERE a.class_id = '${classId}' and type = "${LIVE_QUIZ}" and (a.is_class_wise = 1 or au.user_id = "${studentId}") and r.assignment_id IS NULL  
    and a.starts_at <= '${now}'
    and a.ends_at > '${now}'
    order by a.created_at desc;
    `;
    const res = await this._db?.query(query);
    if (!res || !res.values || res.values.length < 1) return [];
    return res.values;
  }

  async getLiveQuizRoomDoc(
    liveQuizRoomDocId: string
  ): Promise<TableTypes<'live_quiz_room'>> {
    const roomData =
      await this._serverApi.getLiveQuizRoomDoc(liveQuizRoomDocId);
    return roomData;
  }

  async updateFavoriteLesson(
    studentId: string,
    lessonId: string
  ): Promise<TableTypes<'favorite_lesson'>> {
    const favoriteId = uuidv4();
    var favoriteLesson: TableTypes<'favorite_lesson'>;
    const isExist = await this._db?.query(
      `SELECT * FROM ${TABLES.FavoriteLesson} 
       WHERE user_id= '${studentId}' and lesson_id = '${lessonId}';`
    );
    if (!isExist || !isExist.values || isExist.values.length < 1) {
      favoriteLesson = {
        id: favoriteId,
        lesson_id: lessonId,
        user_id: studentId ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false,
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
        ]
      );
      this.updatePushChanges(
        TABLES.FavoriteLesson,
        MUTATE_TYPES.INSERT,
        favoriteLesson
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
      };

      await this.executeQuery(
        `
      UPDATE  favorite_lesson SET updated_at = '${favoriteLesson.updated_at}'
      WHERE id = "${favoriteLesson.id}";
       `
      );
      this.updatePushChanges(TABLES.FavoriteLesson, MUTATE_TYPES.UPDATE, {
        id: favoriteLesson.id,
        updated_at: favoriteLesson.updated_at,
      });
    }

    return favoriteLesson;
  }
  async updateResult(
    studentId: string,
    courseId: string | undefined,
    lessonId: string,
    score: number,
    correctMoves: number,
    wrongMoves: number,
    timeSpent: number,
    assignmentId: string | undefined,
    chapterId: string,
    classId: string | undefined,
    schoolId: string | undefined
  ): Promise<TableTypes<'result'>> {
    const resultId = uuidv4();
    console.log('🚀 ~ SqliteApi ~ id:', studentId);
    const newResult: TableTypes<'result'> = {
      id: resultId,
      assignment_id: assignmentId ?? null,
      correct_moves: correctMoves,
      lesson_id: lessonId,
      school_id: schoolId ?? null,
      score: score,
      student_id: studentId,
      time_spent: timeSpent,
      wrong_moves: wrongMoves,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
      chapter_id: chapterId,
      course_id: courseId ?? '',
    };

    const res = await this.executeQuery(
      `
    INSERT INTO result (id, assignment_id, correct_moves, lesson_id, school_id, score, student_id, time_spent, wrong_moves, created_at, updated_at, is_deleted, course_id, chapter_id )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `,
      [
        newResult.id,
        newResult.assignment_id,
        newResult.correct_moves,
        newResult.lesson_id,
        newResult.school_id,
        newResult.score,
        newResult.student_id,
        newResult.time_spent,
        newResult.wrong_moves,
        newResult.created_at,
        newResult.updated_at,
        newResult.is_deleted,
        newResult.course_id,
        newResult.chapter_id,
      ]
    );
    console.log('🚀 ~ SqliteApi ~ res:', res);
    this.updatePushChanges(TABLES.Result, MUTATE_TYPES.INSERT, newResult);
    return newResult;
  }

  async updateUserProfile(
    user: TableTypes<'user'>,
    fullName: string,
    email: string,
    phoneNum: string,
    languageDocId: string,
    profilePic: string | undefined
  ): Promise<TableTypes<'user'>> {
    const updateUserProfileQuery = `
      UPDATE "user"
      SET 
        name = ?,
        email = ?,
        phone = ?,
        language_id = ?,
        image = ?
      WHERE id = ?;
    `;

    await this.executeQuery(updateUserProfileQuery, [
      fullName,
      email,
      phoneNum,
      languageDocId,
      profilePic ?? null,
      user.id,
    ]);

    // Update the user object with new details
    user.name = fullName;
    user.email = email;
    user.phone = phoneNum;
    user.language_id = languageDocId;
    user.image = profilePic ?? null;

    // Push changes for synchronization
    this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, {
      name: fullName,
      email: email,
      phone: phoneNum,
      language_id: languageDocId,
      image: profilePic ?? null,
      id: user.id,
    });
    return user;
  }

  async updateStudent(
    student: TableTypes<'user'>,
    name: string,
    age: number,
    gender: string,
    avatar: string,
    image: string | undefined,
    boardDocId: string,
    gradeDocId: string,
    languageDocId: string
  ): Promise<TableTypes<'user'>> {
    const updateUserQuery = `
      UPDATE "user"
      SET 
        name = ?,
        age = ?,
        gender = ?,
        avatar = ?,
        image = ?,
        curriculum_id = ?,
        grade_id = ?,
        language_id = ?
      WHERE id = ?;
    `;

    await this.executeQuery(updateUserQuery, [
      name,
      age,
      gender,
      avatar,
      image ?? null,
      boardDocId,
      gradeDocId,
      languageDocId,
      student.id,
    ]);

    let courses;
    if (gradeDocId && boardDocId) {
      courses = await this.getCourseByUserGradeId(gradeDocId, boardDocId);
    }
    // Update student object with new details
    student.name = name;
    student.age = age;
    student.gender = gender;
    student.avatar = avatar;
    student.image = image ?? null;
    student.curriculum_id = boardDocId;
    student.grade_id = gradeDocId;
    student.language_id = languageDocId;

    if (courses && courses.length > 0) {
      const now = new Date().toISOString();
      for (const course of courses) {
        const checkCourseExistsQuery = `
          SELECT COUNT(*) as count FROM user_course WHERE user_id = ? AND course_id = ?;
        `;

        let result;
        result = await this.executeQuery(checkCourseExistsQuery, [
          student.id,
          course.id,
        ]);

        const count = result.values[0].count;
        if (count === 0) {
          const newUserCourse: TableTypes<'user_course'> = {
            course_id: course.id,
            created_at: now,
            id: uuidv4(),
            is_deleted: false,
            updated_at: now,
            user_id: student.id,
          };
          await this.executeQuery(
            `
            INSERT INTO user_course (id, user_id, course_id)
            VALUES (?, ?, ?);
            `,
            [newUserCourse.id, newUserCourse.user_id, newUserCourse.course_id]
          );

          this.updatePushChanges(
            TABLES.UserCourse,
            MUTATE_TYPES.INSERT,
            newUserCourse
          );
        }
      }
    }

    this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, {
      name: name,
      age: age,
      gender: gender,
      avatar: avatar,
      image: image ?? null,
      curriculum_id: boardDocId,
      grade_id: gradeDocId,
      language_id: languageDocId,
      id: student.id,
    });
    return student;
  }

  async getCurrentClassIdForStudent(studentId: string): Promise<string | null> {
    const query = `
      SELECT class_id 
      FROM class_user 
      WHERE user_id = ? AND is_deleted = false
      ORDER BY updated_at DESC
      LIMIT 1;
    `;
    const res = await this.executeQuery(query, [studentId]);
    // Check if a result was found
    if (!res || !res.values || res.values.length < 1) {
      return null;
    }
    return res?.values[0];
  }

  async updateStudentFromSchoolMode(
    student: TableTypes<'user'>,
    name: string,
    age: number,
    gender: string,
    avatar: string,
    image: string | undefined,
    boardDocId: string,
    gradeDocId: string,
    languageDocId: string,
    student_id: string,
    newClassId: string
  ): Promise<TableTypes<'user'>> {
    console.log('fsgdgdfg', name, newClassId);
    const updateUserQuery = `
      UPDATE "user"
      SET 
        name = ?,
        age = ?,
        gender = ?,
        avatar = ?,
        image = ?,
        curriculum_id = ?,
        grade_id = ?,
        language_id = ?,
        student_id = ?
      WHERE id = ?;
    `;
    try {
      await this.executeQuery(updateUserQuery, [
        name,
        age,
        gender,
        avatar,
        image ?? null,
        boardDocId,
        gradeDocId,
        languageDocId,
        student_id,
        student.id,
      ]);

      student.name = name;
      student.age = age;
      student.gender = gender;
      student.avatar = avatar;
      student.image = image ?? null;
      student.curriculum_id = boardDocId;
      student.grade_id = gradeDocId;
      student.language_id = languageDocId;
      student.student_id = student_id;

      this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, {
        name,
        age,
        gender,
        avatar,
        image: image ?? null,
        curriculum_id: boardDocId,
        grade_id: gradeDocId,
        language_id: languageDocId,
        student_id: student_id,
        id: student.id,
      });

      // Check if the class has changed
      // const currentClassId = await this.getCurrentClassIdForStudent(student.id); // Assume this function retrieves the current class ID
      const currentClassId = Util.getCurrentClass();
      console.log('fdsfsf', currentClassId, newClassId);
      if (currentClassId?.id !== newClassId) {
        // Update class_user table to set previous record as deleted
        const deleteOldClassUserQuery = `
          UPDATE class_user
          SET is_deleted = 1, updated_at = ?
          WHERE user_id = ? AND is_deleted = 0;
        `;
        const now = new Date().toISOString();
        await this.executeQuery(deleteOldClassUserQuery, [now, student.id]);
        // Push changes for the update (marking the old class_user as deleted)
        this.updatePushChanges(TABLES.ClassUser, MUTATE_TYPES.UPDATE, {
          user_id: student.id,
          is_deleted: true,
          updated_at: now,
        });
        // Create new class_user entry
        const newClassUserId = uuidv4();
        const newClassUser: TableTypes<'class_user'> = {
          id: newClassUserId,
          class_id: newClassId,
          user_id: student.id,
          role: 'student',
          created_at: now,
          updated_at: now,
          is_deleted: false,
        };

        await this.executeQuery(
          `
            INSERT INTO class_user (id, class_id, user_id, role, created_at, updated_at, is_deleted)
            VALUES (?, ?, ?, ?, ?, ?, ?);
            `,
          [
            newClassUser.id,
            newClassUser.class_id,
            newClassUser.user_id,
            newClassUser.role,
            newClassUser.created_at,
            newClassUser.updated_at,
            newClassUser.is_deleted,
          ]
        );
        this.updatePushChanges(
          TABLES.ClassUser,
          MUTATE_TYPES.INSERT,
          newClassUser
        );
      }

      return student;
    } catch (error) {
      console.error('Error updating student:', error);
      throw error; // Rethrow error after logging
    }
  }

  async getSubject(id: string): Promise<TableTypes<'subject'> | undefined> {
    const res = await this._db?.query(
      `select * from ${TABLES.Subject} where id = "${id}"`
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }

  async getCourse(id: string): Promise<TableTypes<'course'> | undefined> {
    const res = await this._db?.query(
      `select * from ${TABLES.Course} where id = "${id}"`
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }

  async getStudentResult(
    studentId: string,
    fromCache?: boolean
  ): Promise<TableTypes<'result'>[]> {
    const query = `
    SELECT * FROM ${TABLES.Result}
    where student_id = '${studentId}'
    `;
    const res = await this._db?.query(query);
    return res?.values ?? [];
  }


  // statudent result data
  async getStudentResultInMap(
    studentId: string
  ): Promise<{ [lessonDocId: string]: TableTypes<'result'>}> {
    const query = `
    SELECT *
    FROM ${TABLES.Result}
    WHERE (student_id = '${studentId}')
    AND (lesson_id, updated_at) IN (
    SELECT lesson_id, MAX(updated_at)
    FROM ${TABLES.Result}
    WHERE student_id = '${studentId}'
    GROUP BY lesson_id
  );
    `;
    const res = await this._db?.query(query);
     return ApiDataProcessor.dataProcessorStudentResultInMap(res);
  }

  async getClassById(id: string): Promise<TableTypes<'class'> | undefined> {
    const res = await this._db?.query(
      `select * from ${TABLES.Class} where id = "${id}"`
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }

  async getSchoolById(id: string): Promise<TableTypes<'school'> | undefined> {
    const res = await this._db?.query(
      `select * from ${TABLES.School} where id = "${id}"`
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }

  async isStudentLinked(
    studentId: string,
    fromCache: boolean
  ): Promise<boolean> {
    const res = await this._db?.query(
      `select * from ${TABLES.ClassUser} 
      where user_id = "${studentId}" 
      and role = "${RoleType.STUDENT}"`
    );
    console.log('🚀 ~ SqliteApi ~ isStudentLinked ~ res:', res);
    if (!res || !res.values || res.values.length < 1) return false;
    return true;
  }

  async getPendingAssignments(
    classId: string,
    studentId: string
  ): Promise<TableTypes<'assignment'>[]> {
    const query = `
    SELECT a.*
    FROM ${TABLES.Assignment} a
    LEFT JOIN ${TABLES.Assignment_user} au ON a.id = au.assignment_id
    LEFT JOIN result r ON a.id = r.assignment_id AND r.student_id = "${studentId}"
    WHERE a.class_id = '${classId}' and (a.is_class_wise = 1 or au.user_id = "${studentId}") and r.assignment_id IS NULL and a.type !='liveQuiz';
    `;
    const res = await this._db?.query(query);
    return res?.values ?? [];
  }

  async getSchoolsForUser(
    userId: string
  ): Promise<{ school: TableTypes<'school'>; role: RoleType }[]> {
    const finalData: { school: TableTypes<'school'>; role: RoleType }[] = [];
    const schoolIds: Set<string> = new Set();

    let query = `
    SELECT cu.class_id, c.school_id
    FROM ${TABLES.ClassUser} cu
    JOIN ${TABLES.Class} c ON cu.class_id = c.id
    WHERE cu.user_id = "${userId}" AND cu.role = "${RoleType.TEACHER}" AND cu.is_deleted = 0 AND c.is_deleted = 0
  `;
    const classUserRes = await this._db?.query(query);

    if (classUserRes && classUserRes.values && classUserRes.values.length > 0) {
      for (const classData of classUserRes.values) {
        const schoolId = classData.school_id;

        if (!schoolIds.has(schoolId)) {
          schoolIds.add(schoolId);

          query = `
          SELECT JSON_OBJECT(
            'id', s.id,
            'name', s.name,
            'group1', s.group1,
            'group2', s.group2,
            'group3', s.group3,
            'image', s.image,
            'created_at', s.created_at,
            'updated_at', s.updated_at,
            'is_deleted', s.is_deleted
          ) AS school
          FROM ${TABLES.School} s
          WHERE s.id = "${schoolId}" AND s.is_deleted = 0
        `;
          const schoolRes = await this._db?.query(query);
          if (schoolRes && schoolRes.values && schoolRes.values.length > 0) {
            finalData.push({
              school: JSON.parse(schoolRes.values[0].school),
              role: RoleType.TEACHER,
            });
          }
        }
      }
    }

    query = `
    SELECT su.*, 
    JSON_OBJECT(
      'id', s.id,
      'name', s.name,
      'group1', s.group1,
      'group2', s.group2,
      'group3', s.group3,
      'image', s.image,
      'created_at', s.created_at,
      'updated_at', s.updated_at,
      'is_deleted', s.is_deleted
    ) AS school
    FROM ${TABLES.SchoolUser} su
    JOIN ${TABLES.School} s ON su.school_id = s.id
    WHERE su.user_id = "${userId}" 
    AND su.role != "${RoleType.PARENT}" 
    AND su.is_deleted = 0 
    AND s.is_deleted = 0
  `;
    const schoolUserRes = await this._db?.query(query);

    if (
      schoolUserRes &&
      schoolUserRes.values &&
      schoolUserRes.values.length > 0
    ) {
      for (const data of schoolUserRes.values) {
        const schoolId = JSON.parse(data.school).id;

        if (!schoolIds.has(schoolId)) {
          schoolIds.add(schoolId);
          finalData.push({
            school: JSON.parse(data.school),
            role: data.role,
          });
        }
      }
    }
    return finalData;
  }

  public get currentMode(): MODES {
    return this._currentMode;
  }

  public set currentMode(value: MODES) {
    this._currentMode = value;
  }

  // not move 
  async isUserTeacher(userId: string): Promise<boolean> {
    const schools = await this.getSchoolsForUser(userId);
    return schools.length > 0;
  }


  async getClassesForSchool(
    schoolId: string,
    userId: string
  ): Promise<TableTypes<'class'>[]> {
    let query = `
    SELECT DISTINCT cu.class_id, cu.role, c.*
    FROM ${TABLES.ClassUser} cu
    JOIN ${TABLES.Class} c ON cu.class_id = c.id
    WHERE cu.user_id = '${userId}' 
    AND c.school_id = '${schoolId}' 
    AND cu.role != '${RoleType.PARENT}'
    AND cu.is_deleted = 0
    AND c.is_deleted = 0
  `;
    const res = await this._db?.query(query);
    
    if (res && res.values && res.values.length > 0) {
      const teacherClasses = res.values.map((classData) => classData);
      return teacherClasses.length > 0 ? teacherClasses : [];
    }

    query = `
    SELECT *
    FROM ${TABLES.Class}
    WHERE school_id = '${schoolId}' AND is_deleted = 0
  `;
    const allClassesRes = await this._db?.query(query);

    if (
      !allClassesRes ||
      !allClassesRes.values ||
      allClassesRes.values.length < 1
    ) {
      return [];
    }

    return allClassesRes.values;
  }

  async getCoursesByClassId(
    classId: string
  ): Promise<TableTypes<'class_course'>[]> {
    const query = `
    SELECT * 
    FROM ${TABLES.ClassCourse}
    WHERE class_id = ? AND is_deleted = 0
  `;
    const res = await this._db?.query(query, [classId]);
    return res?.values ?? [];
  }

  async getCoursesBySchoolId(
    schoolId: string
  ): Promise<TableTypes<'school_course'>[]> {
    const query = `
      SELECT * 
      FROM ${TABLES.SchoolCourse}
      WHERE school_id = ? AND is_deleted = 0
    `;
    const res = await this._db?.query(query, [schoolId]);
    console.log('res of school course', res);
    return res?.values ?? [];
  }

  async checkCourseInClasses(
    classIds: string[],
    courseId: string
  ): Promise<boolean> {
    try {
      if (classIds.length === 0) {
        return false; // No classes to check
      }

      const placeholders = classIds.map(() => '?').join(', ');
      const result = await this.executeQuery(
        `SELECT 1 FROM class_course 
         WHERE class_id IN (${placeholders}) AND course_id = ? AND is_deleted = 0 
         LIMIT 1`,
        [...classIds, courseId]
      );

      if (!result?.values) return false;
      console.log('result value for classids', result, classIds, courseId);
      return result.values.length > 0; // Return true if at least one match is found
    } catch (error) {
      console.error('Error checking course in classes:', error);
      throw error;
    }
  }

  async removeCoursesFromClass(ids: string[]): Promise<void> {
    try {
      if (ids.length === 0) {
        console.warn('No course IDs provided for removal.');
        return;
      }

      const placeholders = ids.map(() => '?').join(', ');
      await this.executeQuery(
        `UPDATE class_course SET is_deleted = 1 WHERE id IN (${placeholders})`,
        ids
      );

      ids.forEach((id) => {
        this.updatePushChanges(TABLES.ClassCourse, MUTATE_TYPES.UPDATE, {
          id: id,
          is_deleted: true,
        });
      });
    } catch (error) {
      console.error('Error removing courses from class_course', error);
    }
  }
  async removeCoursesFromSchool(ids: string[]): Promise<void> {
    try {
      if (ids.length === 0) {
        console.warn('No course IDs provided for removal.');
        return;
      }

      const placeholders = ids.map(() => '?').join(', ');
      await this.executeQuery(
        `UPDATE school_course SET is_deleted = 1 WHERE id IN (${placeholders})`,
        ids
      );

      ids.forEach((id) => {
        this.updatePushChanges(TABLES.SchoolCourse, MUTATE_TYPES.UPDATE, {
          id: id,
          is_deleted: true,
        });
      });
    } catch (error) {
      console.error('Error removing courses from school_course', error);
    }
  }
  
  async deleteUserFromClass(userId: string): Promise<void> {
    try {
      await this.executeQuery(
        `UPDATE class_user SET is_deleted = 1 WHERE user_id = ?`,
        [userId]
      );
      const query = `
      SELECT * 
      FROM ${TABLES.ClassUser}
      WHERE user_id = ?
    `;
      const res = await this._db?.query(query, [userId]);
      let userData;
      if (res && res.values && res.values.length > 0) {
        userData = res.values[0];
      }
      this.updatePushChanges(TABLES.ClassUser, MUTATE_TYPES.UPDATE, {
        id: userData.id,
        is_deleted: true,
      });
    } catch (error) {
      console.error('Error deleting user from class_user', error);
    }
  }

  async getStudentsForClass(classId: string): Promise<TableTypes<'user'>[]> {
    const query = `
      SELECT user.*
      FROM ${TABLES.ClassUser} AS cu
      JOIN ${TABLES.User} AS user ON cu.user_id = user.id
      WHERE cu.class_id = ? 
        AND cu.role = ? 
        AND cu.is_deleted = 0; 
    `;
    const res = await this._db?.query(query, [classId, RoleType.STUDENT]);
    return res?.values ?? [];
  }

  async getDataByInviteCode(inviteCode: number): Promise<any> {
    let inviteData = await this._serverApi.getDataByInviteCode(inviteCode);
    return inviteData;
  }
  async createClass(
    schoolId: string,
    className: string
  ): Promise<TableTypes<'class'>> {
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw 'User is not Logged in';

    const classId = uuidv4();
    const newClass: TableTypes<'class'> = {
      id: classId,
      name: className,
      image: null,
      school_id: schoolId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),

      is_deleted: false,
    };
    console.log('school data..', newClass);

    await this.executeQuery(
      `
      INSERT INTO class (id, name , image, school_id, created_at, updated_at, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?);
      `,
      [
        newClass.id,
        newClass.name,
        newClass.image,
        newClass.school_id,
        newClass.created_at,
        newClass.updated_at,
        newClass.is_deleted,
      ]
    );

    await this.updatePushChanges(TABLES.Class, MUTATE_TYPES.INSERT, newClass);
    return newClass;
  }
  async deleteClass(classId: string) {
    try {
      // Update is_deleted to true for all class_user records where role is teacher
      await this.executeQuery(
        `UPDATE class_user SET is_deleted = 1 WHERE class_id = ? AND role = ?`,
        [classId, RoleType.TEACHER]
      );

      // Retrieve the ids of the affected class_user rows
      const classUserQuery = `
      SELECT id 
      FROM ${TABLES.ClassUser}
      WHERE class_id = ? AND role = ? AND is_deleted = 1
    `;
      const classUserRes = await this._db?.query(classUserQuery, [
        classId,
        RoleType.TEACHER,
      ]);

      if (
        classUserRes &&
        classUserRes.values &&
        classUserRes.values.length > 0
      ) {
        for (const row of classUserRes.values) {
          // Push changes for each affected class_user (teachers)
          this.updatePushChanges(TABLES.ClassUser, MUTATE_TYPES.UPDATE, {
            id: row.id,
            is_deleted: true,
          });
        }
      } else {
        console.log('No class_user records found for the teachers.');
      }

      //Update is_deleted to true for all class_course records where class_id matches
      await this.executeQuery(
        `UPDATE class_course SET is_deleted = 1 WHERE class_id = ?`,
        [classId]
      );

      // Retrieve the ids of the affected class_course rows
      const classCourseQuery = `
      SELECT id 
      FROM ${TABLES.ClassCourse}
      WHERE class_id = ? AND is_deleted = 1
    `;
      const classCourseRes = await this._db?.query(classCourseQuery, [classId]);

      if (
        classCourseRes &&
        classCourseRes.values &&
        classCourseRes.values.length > 0
      ) {
        for (const row of classCourseRes.values) {
          // Push changes for each affected class_course
          this.updatePushChanges(TABLES.ClassCourse, MUTATE_TYPES.UPDATE, {
            id: row.id,
            is_deleted: true,
          });
        }
      } else {
        console.log('No class_course records found for the class.');
      }

      // Update is_deleted to true for the class itself
      await this.executeQuery(
        `UPDATE class SET is_deleted = 1 WHERE id = ? AND is_deleted = 0`,
        [classId]
      );

      // Push changes for the class itself
      this.updatePushChanges(TABLES.Class, MUTATE_TYPES.UPDATE, {
        id: classId,
        is_deleted: true,
      });

      console.log('Class and related data marked as deleted successfully.');
    } catch (error) {
      console.error('Failed to delete class:', error);
      throw error;
    }
  }
  async updateClass(classId: string, className: string) {
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw 'User is not Logged in';

    const updatedClassQuery = `
    UPDATE class SET name = "${className}"
    WHERE id = "${classId}";
    `;
    const res = await this.executeQuery(updatedClassQuery);
    console.log('🚀 ~ SqliteApi ~ updateClass ~ res:', res);

    this.updatePushChanges(TABLES.Class, MUTATE_TYPES.UPDATE, {
      name: className,
      id: classId,
    });
  }
  async linkStudent(inviteCode: number, studentId: string): Promise<any> {
    let linkData = await this._serverApi.linkStudent(inviteCode, studentId);
    await this.syncDbNow(Object.values(TABLES), [
      TABLES.Assignment,
      TABLES.Class,
      TABLES.School,
    ]);
    return linkData;
  }

  async getLeaderboardResults(
    sectionId: string,
    leaderboardDropdownType: LeaderboardDropdownList
  ): Promise<LeaderboardInfo | undefined> {
    if (sectionId) {
      // Getting Class wise Leaderboard
      let classLeaderboard = await this._serverApi.getLeaderboardResults(
        sectionId,
        leaderboardDropdownType
      );
      return classLeaderboard;
    } else {
      // Getting Generic Leaderboard
      let genericQueryResult =
        await this._serverApi.getLeaderboardStudentResultFromB2CCollection();
      if (!genericQueryResult) {
        return;
      }
      return genericQueryResult;
    }
  }

  async getLeaderboardStudentResultFromB2CCollection(
    studentId: string
  ): Promise<LeaderboardInfo | undefined> {
    try {
      // Ensure the database instance is initialized
      if (!this._db) throw new Error('Database is not initialized');

      // Define the query to fetch the leaderboard data for the given student
      const currentStudentQuery = `
        SELECT 'allTime' as type, student_id, name, 
               count(res.id) as lessons_played, 
               sum(score) as total_score, 
               sum(time_spent) as total_time_spent
        FROM ${TABLES.Result} res
        JOIN ${TABLES.User} u ON u.id = res.student_id
        WHERE res.student_id = '${studentId}'
        GROUP BY student_id, u.name
        UNION ALL
        SELECT 'monthly' as type, student_id, u.name, 
               count(res.id) as lessons_played, 
               sum(score) as total_score, 
               sum(time_spent) as total_time_spent
        FROM ${TABLES.Result} res
        JOIN ${TABLES.User} u ON u.id = res.student_id
        WHERE res.student_id = '${studentId}' 
        AND strftime('%m', res.created_at) = strftime('%m', datetime('now'))
        GROUP BY student_id, u.name
        UNION ALL
        SELECT 'weekly' as type, student_id, u.name, 
               count(res.id) as lessons_played, 
               sum(score) as total_score, 
               sum(time_spent) as total_time_spent
        FROM ${TABLES.Result} res
        JOIN ${TABLES.User} u ON u.id = res.student_id
        WHERE res.student_id = '${studentId}' 
        AND strftime('%W', res.created_at) = strftime('%W', datetime('now'))
        GROUP BY student_id, u.name
      `;

      // Execute the query
      const currentUserResult = await this._db.query(currentStudentQuery);
      
      // Handle case where no data is returned
      if (!currentUserResult.values) {
        return;
      }

      // Initialize the leaderboard structure
      let leaderBoardList: LeaderboardInfo = {
        weekly: [],
        allTime: [],
        monthly: [],
      };

      // Process the results
      currentUserResult.values.forEach((result) => {
        if (!result) return;

        const leaderboardEntry = {
          name: result.name || '',
          score: result.total_score || 0,
          timeSpent: result.total_time_spent || 0,
          lessonsPlayed: result.lessons_played || 0,
          userId: studentId,
        };

        switch (result.type) {
          case 'allTime':
            leaderBoardList.allTime.push(leaderboardEntry);
            break;
          case 'monthly':
            leaderBoardList.monthly.push(leaderboardEntry);
            break;
          case 'weekly':
            leaderBoardList.weekly.push(leaderboardEntry);
            break;
          default:
            console.warn('Unknown leaderboard type: ', result.type);
        }
      });

      return leaderBoardList;

    } catch (error) {
      console.error(
        'Error in getLeaderboardStudentResultFromB2CCollection: ',
        error
      );
    }
  }

  // till here

  //No data Manipulations
  async getAllLessonsForCourse(
    courseId: string
  ): Promise<TableTypes<'lesson'>[]> {
    const query = `
    SELECT l.* FROM ${TABLES.Chapter} as c
    JOIN ${TABLES.ChapterLesson} cl ON cl.chapter_id = c.id
    JOIN ${TABLES.Lesson} l ON l.id = cl.lesson_id
    WHERE c.course_id = '${courseId}'
    `;
    const res = await this._db?.query(query);
    return res?.values ?? [];
  }

  getLessonFromCourse(
    course: Course,
    lessonId: string
  ): Promise<Lesson | undefined> {
    throw new Error('Method not implemented.');
  }

  async getLessonFromChapter(
    chapterId: string,
    lessonId: string
  ): Promise<{
    lesson: TableTypes<'lesson'>[];
    course: TableTypes<'course'>[];
  }> {
    const query = `
    SELECT l.*,JSON_OBJECT(
          'id',co.id,
          'code',co.code,
          'color',co.color,
          'created_at',co.created_at,
          'curriculum_id',co.curriculum_id,
          'description',co.description,
          'grade_id',co.grade_id,
          'image',co.image,
          'is_deleted',co.is_deleted,
          'name',co.name,
          'sort_index',co.sort_index,
          'subject_id',co.subject_id,
          'updated_at',co.updated_at
      ) AS course FROM ${TABLES.Lesson} as l
    JOIN ${TABLES.ChapterLesson} cl ON l.id = cl.lesson_id
    JOIN ${TABLES.Chapter} c ON c.id = cl.chapter_id
    JOIN ${TABLES.Course} co ON co.id = c.course_id
    WHERE c.id='${chapterId}' and l.id = '${lessonId}'
    `;
    const res = await this._db?.query(query);
    return ApiDataProcessor.dataProcessorLessonFromChapter(res);
  }

  async getCoursesByGrade(gradeDocId: any): Promise<TableTypes<'course'>[]> {
    try {
      const gradeCoursesRes = await this._db?.query(
        `SELECT * FROM ${TABLES.Course} WHERE grade_id = "${gradeDocId}"`
      );

      const puzzleCoursesRes = await this._db?.query(
        `SELECT * FROM ${TABLES.Course} WHERE name = "Digital Skills"`
      );

      const courses = [
        ...(gradeCoursesRes?.values ?? []),
        ...(puzzleCoursesRes?.values ?? []),
      ];
      return courses;
    } catch (error) {
      console.error('Error fetching courses by grade:', error);
      return [];
    }
  }

  //No data Manipulations
  async getAllCourses(): Promise<TableTypes<'course'>[]> {
    const res = await this._db?.query(`select * from ${TABLES.Course}`);
    return res?.values ?? [];
  }
  //No data Manipulations
  deleteAllUserData(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  //No data Manipulations
  async getCoursesFromLesson(
    lessonId: string
  ): Promise<TableTypes<'course'>[]> {
    const query = `
    SELECT co.* FROM ${TABLES.Lesson} as l
    JOIN ${TABLES.ChapterLesson} cl ON l.id = cl.lesson_id
    JOIN ${TABLES.Chapter} c ON c.id = cl.chapter_id
    JOIN ${TABLES.Course} co ON co.id = c.course_id
    WHERE l.id = '${lessonId}'
    `;
    const res = await this._db?.query(query);
    return res?.values ?? [];
  }
  //No data Manipulations
  async assignmentListner(
    studentId: string,
    onDataChange: (assignment: TableTypes<'assignment'> | undefined) => void
  ) {
    const handleDataChange = async (
      assignmet: TableTypes<'assignment'> | undefined
    ) => {
      if (assignmet)
        await this.executeQuery(
          `
          INSERT INTO assignment (id, created_by, starts_at,ends_at,is_class_wise,class_id,school_id,lesson_id,type,created_at,updated_at,is_deleted,chapter_id,course_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
          [
            assignmet.id,
            assignmet.created_by,
            assignmet.starts_at,
            assignmet.ends_at,
            assignmet.is_class_wise,
            assignmet.class_id,
            assignmet.school_id,
            assignmet.lesson_id,
            assignmet.type,
            assignmet.created_at,
            assignmet.updated_at,
            assignmet.is_deleted,
            assignmet.chapter_id,
            assignmet.course_id,
          ]
        );
    };
    return await this._serverApi.assignmentListner(studentId, handleDataChange);
  }
  //No data Manipulations
  async removeAssignmentChannel() {
    return await this._serverApi.removeAssignmentChannel();
  }
  //No data Manipulations
  async assignmentUserListner(
    studentId: string,
    onDataChange: (
      assignment_user: TableTypes<'assignment_user'> | undefined
    ) => void
  ) {
    const handleDataChange = async (
      assignmet_user: TableTypes<'assignment_user'> | undefined
    ) => {
      if (assignmet_user)
        await this.executeQuery(
          `
          INSERT INTO assignment_user (id, assignment_id, user_id,created_at,updated_at,is_deleted)
        VALUES (?, ?, ?, ?, ?, ?);
      `,
          [
            assignmet_user.id,
            assignmet_user.assignment_id,
            assignmet_user.user_id,
            assignmet_user.created_at,
            assignmet_user.updated_at,
            assignmet_user.is_deleted,
          ]
        );
    };

    return await this._serverApi.assignmentUserListner(
      studentId,
      handleDataChange
    );
  }
  //No data Manipulations
  async liveQuizListener(
    liveQuizRoomDocId: string,
    onDataChange: (roomDoc: TableTypes<'live_quiz_room'> | undefined) => void
  ) {
    return await this._serverApi.liveQuizListener(
      liveQuizRoomDocId,
      onDataChange
    );
  }
  //No data Manipulations
  async removeLiveQuizChannel() {
    return await this._serverApi.removeLiveQuizChannel();
  }

  //No data Manipulations
  async updateLiveQuiz(
    roomDocId: string,
    studentId: string,
    questionId: string,
    timeSpent: number,
    score: number
  ): Promise<void> {
    await this._serverApi.updateLiveQuiz(
      roomDocId,
      studentId,
      questionId,
      timeSpent,
      score
    );
  }

  //No data Manipulations
  async joinLiveQuiz(
    assignmentId: string,
    studentId: string
  ): Promise<string | undefined> {
    const data = await this._serverApi.joinLiveQuiz(assignmentId, studentId);
    return data;
  }

  //No data Manipulations
  async getStudentResultsByAssignmentId(assignmentId: string): Promise<
    {
      result_data: TableTypes<'result'>[];
      user_data: TableTypes<'user'>[];
    }[]
  > {
    const res =
      await this._serverApi.getStudentResultsByAssignmentId(assignmentId);
    return res;
  }

  //No data Manipulations
  async getAssignmentById(
    id: string
  ): Promise<TableTypes<'assignment'> | undefined> {
    const res = await this._db?.query(
      `select * from ${TABLES.Assignment} where id = "${id}"`
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }
  //No data Manipulations
  async getBadgesByIds(ids: string[]): Promise<TableTypes<'badge'>[]> {
    if (ids.length === 0) return [];

    const quotedIds = ids.map((id) => `"${id}"`).join(', ');
    try {
      const res = await this._db?.query(
        `SELECT * FROM ${TABLES.Badge} WHERE id IN (${quotedIds})`
      );
      if (!res || !res.values || res.values.length < 1) return [];

      return res.values;
    } catch (error) {
      console.error('Error fetching badges by IDs:', error);
      return [];
    }
  }
  //No data Manipulations
  async getStickersByIds(ids: string[]): Promise<TableTypes<'sticker'>[]> {
    if (ids.length === 0) return [];

    const quotedIds = ids.map((id) => `"${id}"`).join(`, `);
    try {
      const res = await this._db?.query(
        `select * FROM ${TABLES.Sticker} WHERE id IN (${quotedIds})`
      );
      if (!res || !res.values || res.values.length < 1) return [];
      return res.values;
    } catch (error) {
      console.error('Error fetching stickers by IDs:', error);
      return [];
    }
  }
  //No data Manipulations
  async getBonusesByIds(ids: string[]): Promise<TableTypes<'lesson'>[]> {
    if (ids.length === 0) return [];

    const quotedIds = ids.map((id) => `"${id}"`).join(`, `);
    try {
      const res = await this._db?.query(
        `select * FROM ${TABLES.Lesson} WHERE id IN (${quotedIds})`
      );
      if (!res || !res.values || res.values.length < 1) return [];
      return res.values;
    } catch (error) {
      console.error('Error fetching stickers by IDs:', error);
      return [];
    }
  }

  //No data Manipulations
  async getRewardsById(
    id: number,
    periodType: string
  ): Promise<TableTypes<'reward'> | undefined> {
    try {
      const query = `SELECT ${periodType} FROM ${TABLES.Reward} WHERE year = ${id}`;
      const data = await this._db?.query(query);
      if (!data || !data.values || data.values.length === 0) {
        console.error('No reward found for the given year.');
        return;
      }
      const periodData = JSON.parse(data.values[0][periodType]);
      try {
        if (periodData) return periodData;
      } catch (parseError) {
        console.error('Error parsing JSON string:', parseError);
        return undefined;
      }
    } catch (error) {
      console.error('Error fetching reward by ID:', error);
      return undefined;
    }
  }

  async getUserSticker(userId: string): Promise<TableTypes<'user_sticker'>[]> {
    try {
      const query = `select * from ${TABLES.UserSticker} where user_id = "${userId}"`;
      const data = await this._db?.query(query);

      if (!data || !data.values || data.values.length === 0) {
        console.error('No sticker found for the given user id.');
        return [];
      }

      const periodData = data.values;
      return periodData;
    } catch (error) {
      console.error('Error fetching sticker by user ID:', error);
      return [];
    }
  }
  async getUserBadge(userId: string): Promise<TableTypes<'user_badge'>[]> {
    try {
      const query = `select * from ${TABLES.UserBadge} where user_id = "${userId}"`;
      const data = await this._db?.query(query);

      if (!data || !data.values || data.values.length === 0) {
        console.error('No badge found for the given user id.');
        return [];
      }

      const periodData = data.values;
      return periodData;
    } catch (error) {
      console.error('Error fetching user bade by user iD:', error);
      return [];
    }
  }

  async getUserBonus(userId: string): Promise<TableTypes<'user_bonus'>[]> {
    try {
      const query = `select * from ${TABLES.UserBonus} where user_id = "${userId}"`;
      const data = await this._db?.query(query);

      if (!data || !data.values || data.values.length === 0) {
        console.error('No bonus found for the given user id.');
        return [];
      }

      const periodData = data.values;
      return periodData;
    } catch (error) {
      console.error('Error fetching bonus by user ID:', error);
      return [];
    }
  }

  //No data Manipulations
  async updateRewardAsSeen(studentId: string): Promise<void> {
    try {
      const query = `UPDATE ${TABLES.UserSticker} SET is_seen = true WHERE user_id = "${studentId}" AND is_seen = false`;
      await this._db?.query(query);
      console.log(`Updated unseen rewards to seen for student ${studentId}`);
    } catch (error) {
      console.error('Error updating rewards as seen:', error);
      throw new Error('Error updating rewards as seen.');
    }
  }
  //No data Manipulations
  async getUserByDocId(
    studentId: string
  ): Promise<TableTypes<'user'> | undefined> {
    const res = await this._db?.query(
      `select * from ${TABLES.User} where id = "${studentId}"`
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }

  // method dependency on executeQuery and updatedPushChanges
  async addCourseForParentsStudent(
    courses: TableTypes<'course'>[],
    student: TableTypes<'user'>
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
      };
      await this.executeQuery(
        `
        INSERT INTO user_course (id, user_id, course_id)
      VALUES (?, ?, ?);
    `,
        [newUserCourse.id, newUserCourse.user_id, newUserCourse.course_id]
      );
      this.updatePushChanges(
        TABLES.UserCourse,
        MUTATE_TYPES.INSERT,
        newUserCourse
      );
    }
  }

  //No data Manipulations
  updateRewardsForStudent(studentId: string, unlockReward: LeaderboardRewards) {
    throw new Error('Method not implemented.');
  }
  //No data Manipulations
  async getChaptersForCourse(
    courseId: string
  ): Promise<TableTypes<'chapter'>[]> {
    const query = `
    SELECT * FROM ${TABLES.Chapter} 
    WHERE course_id = "${courseId}"
    ORDER BY sort_index ASC;
    `;
    const res = await this._db?.query(query);
    return res?.values ?? [];
  }

  //No data Manipulations
  async getPendingAssignmentForLesson(
    lessonId: string,
    classId: string,
    studentId: string
  ): Promise<TableTypes<'assignment'> | undefined> {
    const query = `
    SELECT a.*
    FROM ${TABLES.Assignment} a
    LEFT JOIN ${TABLES.Assignment_user} au ON a.id = au.assignment_id
    LEFT JOIN result r ON a.id = r.assignment_id AND r.student_id = '${studentId}'
    WHERE a.lesson_id = '${lessonId}' AND a.class_id = '${classId}' and (a.is_class_wise = 1 or au.user_id = '${studentId}') and r.assignment_id IS NULL
    ORDER BY a.updated_at DESC
    LIMIT 1;
    `;
    const res = await this._db?.query(query);
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }

  //No data Manipulations
  async getFavouriteLessons(userId: string): Promise<TableTypes<'lesson'>[]> {
    const query = `
    SELECT DISTINCT l.*
    FROM ${TABLES.FavoriteLesson} fl
    JOIN ${TABLES.Lesson} l 
    ON fl.lesson_id = l.id
    WHERE fl.user_id = '${userId}'
    `;
    const res = await this._db?.query(query);
    if (!res || !res.values || res.values.length < 1) return [];
    return res.values;
  }

  async getStudentClassesAndSchools(userId: string): Promise<{
    classes: TableTypes<'class'>[];
    schools: TableTypes<'school'>[];
  }> {
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
      where user_id = "${userId}" and role = "${RoleType.STUDENT}"`
    );
    if (!res || !res.values || res.values.length < 1) return data;
    data.classes = res.values;
    data.schools = res.values.map((val) => JSON.parse(val.school));
    return data;
  }
  // method dependency on executeQuery and updatedPushChanges
  async updateFcmToken(userId: string) {
    const token = await Util.getToken();
    const query = `
    UPDATE "user"
    SET fcm_token = "${token}"
    WHERE id = "${userId}";
  `;
    const res = await this.executeQuery(query);
    console.log('🚀 ~ SqliteApi ~ updateFCM Token:', res);
    this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, {
      fcm_token: token,
      id: userId,
    });
  }

  // method dependency on executeQuery and updatedPushChanges
  async createOrUpdateAssignmentCart(
    userId: string,
    lessons: string
  ): Promise<boolean | undefined> {
    await this.executeQuery(
      `
      INSERT INTO assignment_cart (
          id,
          lessons,
          updated_at
      ) VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
          lessons = excluded.lessons,
          updated_at = excluded.updated_at;
      `,
      [userId, lessons, new Date().toISOString()]
    );
    await this._serverApi.pushAssignmentCart(
      {
        id: userId,
        lessons: lessons,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false,
      },
      userId
    );
    // await this.updatePushChanges(
    //   TABLES.Assignment_cart,
    //   MUTATE_TYPES.UPDATE,
    //   {
    //     id: userId,
    //     lessons: lessons,
    //     created_at: new Date().toISOString(),
    //     updated_at: new Date().toISOString(),
    //     is_deleted: false,
    //   }
    // )
    return true;
  }

  // method dependency on executeQuery and updatedPushChanges
  async createAssignment(
    student_list: string[],
    userId: string,
    starts_at: string,
    ends_at: string,
    is_class_wise: boolean,
    class_id: string,
    school_id: string,
    lesson_id: string,
    chapter_id: string,
    course_id: string,
    type: string
  ): Promise<boolean> {
    const assignmentUUid = uuidv4();
    const timestamp = new Date().toISOString(); // Cache timestamp for reuse
    console.log('createAssignment called', assignmentUUid);

    try {
      // Insert into assignment table
      await this.executeQuery(
        `INSERT INTO assignment 
          (id, created_by, starts_at, ends_at, is_class_wise, class_id, school_id, lesson_id, type, created_at, updated_at, is_deleted, chapter_id, course_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          assignmentUUid,
          userId,
          starts_at,
          ends_at,
          is_class_wise,
          class_id,
          school_id,
          lesson_id,
          type,
          timestamp,
          timestamp,
          false,
          chapter_id,
          course_id,
        ]
      );

      // Prepare assignment data for push changes
      const assignment_data: TableTypes<'assignment'> = {
        id: assignmentUUid,
        created_by: userId,
        starts_at: timestamp,
        ends_at: timestamp,
        is_class_wise: is_class_wise,
        class_id: class_id,
        school_id: school_id,
        lesson_id: lesson_id,
        type: type,
        created_at: timestamp,
        updated_at: timestamp,
        is_deleted: false,
        chapter_id: chapter_id,
        course_id: course_id,
      };

      console.log('Assignment data:', assignment_data);

      const res = await this.updatePushChanges(
        TABLES.Assignment,
        MUTATE_TYPES.INSERT,
        assignment_data
      );
      console.log('Push changes result:', res);

      // If the assignment is not class-wide, assign it to individual students

      if (!is_class_wise && student_list.length > 0) {
        for (const student of student_list) {
          const assignment_user_UUid = uuidv4();
          const newAssignmentUser: TableTypes<'assignment_user'> = {
            assignment_id: assignmentUUid,
            created_at: new Date().toISOString(),
            id: assignment_user_UUid,
            is_deleted: false,
            updated_at: new Date().toISOString(),
            user_id: student,
          };
          await this.executeQuery(
            `
          INSERT INTO assignment_user (id, assignment_id, user_id,created_at,updated_at,is_deleted)
        VALUES (?, ?, ?, ?, ?, ?);
      `,
            [
              assignment_user_UUid,
              assignmentUUid,
              student,
              new Date().toISOString(),
              new Date().toISOString(),
              false,
            ]
          );
          const assignmentUserPushRes = await this.updatePushChanges(
            TABLES.Assignment_user,
            MUTATE_TYPES.INSERT,
            newAssignmentUser
          );
          console.log(
            'const assignmentUserPushRes ',
            newAssignmentUser,
            assignmentUserPushRes
          );
        }
      }

      return res ?? false;
    } catch (error) {
      console.error('Error in createAssignment:', error);
      return false; // Return false in case of error
    }
  }

  // method dependency on executeQuery and updatedPushChanges
  async createUserDoc(
    user: TableTypes<'user'>
  ): Promise<TableTypes<'user'> | undefined> {
    await this.executeQuery(
      `
      INSERT INTO user (id, name, age, gender, avatar, image, curriculum_id, language_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
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
      ]
    );
    this.updatePushChanges(TABLES.User, MUTATE_TYPES.INSERT, user);

    return user;
  }

  //No data Manipulations
  async syncDB(): Promise<boolean> {
    try {
      await this.syncDbNow();
      return true;
    } catch (error) {
      console.log('🚀 ~ SqliteApi ~ syncDB ~ error:', error);
      return false;
    }
  }

  //No data Manipulations
  async getUserAssignmentCart(
    userId: string
  ): Promise<TableTypes<'assignment_cart'> | undefined> {
    const res = await this._db?.query(
      `select * from ${TABLES.Assignment_cart} where id = "${userId}"`
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }
  async getStudentProgress(studentId: string): Promise<Map<string, string>> {
    const query = `
      SELECT r.*, l.name AS lesson_name, c.course_id AS course_id, c.name AS chapter_name
      FROM ${TABLES.Result} r
      JOIN ${TABLES.Lesson} l ON r.lesson_id = l.id
      JOIN ${TABLES.ChapterLesson} cl ON l.id = cl.lesson_id and r.chapter_id=cl.chapter_id
      JOIN ${TABLES.Chapter} c ON cl.chapter_id = c.id and r.course_id=c.course_id
      WHERE r.student_id = '${studentId}'
    `;
    const res = await this._db?.query(query);
    let resultMap: Map<string, string> = new Map<string, string>();
    if (res && res.values) {
      res.values.forEach((result) => {
        const courseId = result.course_id;
        if (!resultMap[courseId]) {
          resultMap[courseId] = [];
        }
        resultMap[courseId].push(result);
      });
    }
    return resultMap;
  }

  //No data Manipulations
  async getRecommendedLessons(
    studentId: string,
    classId?: string
  ): Promise<TableTypes<'lesson'>[]> {
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
    if (!this._db) return [];
    const res: TableTypes<'lesson'>[] = [];

    try {
      const serverResults = await this._serverApi.searchLessons(searchString);
      res.push(...serverResults);
    } catch (error) {
      console.log('🚀 ~ SqliteApi ~ searchLessons ~ error:', error);
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
    console.log('🚀 ~ SqliteApi ~ searchLessons ~ dat:', nameResults);
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
    console.log('🚀 ~ SqliteApi ~ searchLessons ~ dat1:', outcomeResults);
    return res;
  }

  async getChapterByLesson(
    lessonId: string,
    classId?: string,
    userId?: string
  ): Promise<String | undefined> {
    try {
      const class_course = classId
        ? await this.getCoursesForClassStudent(classId)
        : await this.getCoursesForParentsStudent(userId ?? '');
      const res = await this._db?.query(
        `SELECT cl.lesson_id, c.course_id ,cl.chapter_id
         FROM ${TABLES.ChapterLesson} cl
         JOIN ${TABLES.Chapter} c ON cl.chapter_id = c.id
         WHERE cl.lesson_id = "${lessonId}"`
      );
      if (!res || !res.values || res.values.length < 1) return;
      const classCourseIds = new Set(class_course.map((course) => course.id));
      const matchedLesson = res.values.find((lesson) =>
        classCourseIds.has(lesson.course_id)
      );

      return matchedLesson
        ? matchedLesson.chapter_id
        : res.values[0].chapter_id;
    } catch (error) {
      console.error('Error fetching chapter by IDs:', error);
      return;
    }
  }

  //No data Manipulations
  async getResultByAssignmentIds(
    assignmentIds: string[] // Expect an array of strings
  ): Promise<TableTypes<'result'>[] | undefined> {
    if (!assignmentIds || assignmentIds.length === 0) return;

    const placeholders = assignmentIds.map(() => '?').join(', ');
    const query = `SELECT * 
      FROM ${TABLES.Result} 
      WHERE assignment_id IN (${placeholders});`;

    const res = await this._db?.query(query, assignmentIds);

    if (!res || !res.values || res.values.length < 1) return;
    return res.values;
  }
  //No data Manipulations
  async getLessonsBylessonIds(
    lessonIds: string[] // Expect an array of strings
  ): Promise<TableTypes<'lesson'>[] | undefined> {
    if (!lessonIds || lessonIds.length === 0) return;

    const placeholders = lessonIds.map(() => '?').join(', ');
    const query = `SELECT * 
      FROM ${TABLES.Lesson} 
      WHERE id IN (${placeholders});`;

    const res = await this._db?.query(query, lessonIds);

    if (!res || !res.values || res.values.length < 1) return;
    return res.values;
  }

  //No data Manipulations
  async getStudentLastTenResults(
    studentId: string,
    courseId: string,
    assignmentIds: string[]
  ): Promise<TableTypes<'result'>[]> {
    const assignmentholders = assignmentIds.map(() => '?').join(', ');
    const res = await this._db?.query(
      `WITH null_assignments AS (
         SELECT * 
         FROM ${TABLES.Result} 
         WHERE student_id = ? 
         AND course_id = ?
         AND assignment_id IS NULL 
         ORDER BY created_at DESC 
         LIMIT 5
       ),
       non_null_assignments AS (
         SELECT * 
         FROM ${TABLES.Result} 
         WHERE student_id = ? 
         AND course_id = ?
         AND assignment_id IN (${assignmentholders}) 
         ORDER BY created_at DESC 
         LIMIT 5
       )
       SELECT * 
       FROM null_assignments
       UNION ALL
       SELECT * 
       FROM non_null_assignments
       ORDER BY created_at DESC
       LIMIT 10;`,
      [studentId, courseId, studentId, courseId, ...assignmentIds]
    );
    return res?.values ?? [];
  }
  //No data Manipulations
  async getAssignmentOrLiveQuizByClassByDate(
    classId: string,
    courseId: string,
    startDate: string,
    endDate: string,
    isClassWise: boolean,
    isLiveQuiz: boolean
  ): Promise<TableTypes<'assignment'>[] | undefined> {
    let query = `SELECT * 
       FROM ${TABLES.Assignment} 
       WHERE class_id = '${classId}'
       AND course_id = '${courseId}'
       AND created_at BETWEEN '${endDate}' AND '${startDate}'`;
    if (isClassWise) {
      query += ` AND is_class_wise = 1`;
    }
    if (isLiveQuiz) {
      query += ` AND type = 'liveQuiz'`;
    } else {
      query += ` AND type != 'liveQuiz'`;
    }
    query += ` ORDER BY created_at DESC;`;
    const res = await this._db?.query(query);

    if (!res || !res.values || res.values.length < 1) return;
    return res.values;
  }

  //No data Manipulations
  async getStudentResultByDate(
    studentId: string,
    course_id: string,
    startDate: string,
    endDate: string
  ): Promise<TableTypes<'result'>[] | undefined> {
    const query = `SELECT * 
       FROM ${TABLES.Result} 
       WHERE student_id = '${studentId}'
       AND course_id = '${course_id}'
       AND created_at BETWEEN '${startDate}' AND '${endDate}'
       ORDER BY created_at DESC;`;

    const res = await this._db?.query(query);

    if (!res || !res.values || res.values.length < 1) return;
    return res.values;
  }

  //No data Manipulations
  async getLastAssignmentsForRecommendations(
    classId: string
  ): Promise<TableTypes<'assignment'>[] | undefined> {
    const query = `WITH RankedAssignments AS (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY course_id ORDER BY created_at DESC) AS rn
    FROM ${TABLES.Assignment} 
    WHERE class_id = '${classId}'
    )
    SELECT *
    FROM RankedAssignments
    WHERE rn = 1
    ORDER BY created_at DESC;`;

    const res = await this._db?.query(query);

    if (!res || !res.values || res.values.length < 1) return;
    return res.values;
  }

  //No data Manipulations
  async getTeachersForClass(
    classId: string
  ): Promise<TableTypes<'user'>[] | undefined> {
    const query = `
    SELECT user.*
    FROM ${TABLES.ClassUser} AS cu
    JOIN ${TABLES.User} AS user ON cu.user_id= user.id
    WHERE cu.class_id = "${classId}" and cu.role = '${RoleType.TEACHER}' and cu.is_deleted = false;
  `;
    const res = await this._db?.query(query);
    return res?.values ?? [];
  }

  //No data Manipulations
  async getUserByEmail(email: string): Promise<TableTypes<'user'> | undefined> {
    return this._serverApi.getUserByEmail(email);
  }

  //No data Manipulations
  async getUserByPhoneNumber(
    phone: string
  ): Promise<TableTypes<'user'> | undefined> {
    return this._serverApi.getUserByPhoneNumber(phone);
  }
  async addTeacherToClass(classId: string, userId: string): Promise<void> {
    const classUserId = uuidv4();
    const classUser = {
      id: classUserId,
      class_id: classId,
      user_id: userId,
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
      ]
    );

    await this.updatePushChanges(
      TABLES.ClassUser,
      MUTATE_TYPES.INSERT,
      classUser
    );
    var user_doc = await this._serverApi.getUserByDocId(userId);
    if (user_doc) {
      await this.executeQuery(
        `
        INSERT INTO user (id, name, age, gender, avatar, image, curriculum_id, language_id,created_at,updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO NOTHING;
        `,
        [
          user_doc.id,
          user_doc.name,
          user_doc.age,
          user_doc.gender,
          user_doc.avatar,
          user_doc.image,
          user_doc.curriculum_id,
          user_doc.language_id,
          user_doc.created_at,
          user_doc.updated_at,
        ]
      );
    }
  }

  async checkUserExistInSchool(
    schoolId: string,
    userId: string
  ): Promise<boolean> {
    // Check if the user is present in school_user but not as a parent
    const schoolUserResult = await this.executeQuery(
      `SELECT * FROM school_user 
     WHERE school_id = ? AND user_id = ? 
     AND role != ?  
     AND is_deleted = false`,
      [schoolId, userId, RoleType.PARENT]
    );

    if (schoolUserResult?.values && schoolUserResult.values.length > 0) {
      return true;
    }

    // Step 2: Fetch all classes for the given school
    const classResult = await this.executeQuery(
      `SELECT id FROM class 
     WHERE school_id = ? 
     AND is_deleted = false`,
      [schoolId]
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
      [...classIds, userId, RoleType.TEACHER]
    );

    if (teacherResult?.values && teacherResult.values.length > 0) {
      return true;
    }
    return false;
  }
  async getAssignmentsByAssignerAndClass(
    userId: string,
    classId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    classWiseAssignments: TableTypes<'assignment'>[];
    individualAssignments: TableTypes<'assignment'>[];
  }> {
    const query = `
    SELECT * 
    FROM ${TABLES.Assignment}
    WHERE created_by = '${userId}'  
      AND (class_id = '${classId}' OR is_class_wise = 1)  
      AND created_at >= '${startDate}'  
      AND created_at <= '${endDate}'  
    ORDER BY is_class_wise DESC, created_at ASC;
  `;

    const res = await this._db?.query(query);
    const assignments = res?.values ?? [];

    console.log('assignments..', assignments);

    const classWiseAssignments = assignments.filter(
      (assignment) => assignment.is_class_wise
    );
    const individualAssignments = assignments.filter(
      (assignment) => !assignment.is_class_wise
    );

    return { classWiseAssignments, individualAssignments };
  }

  // Note: simple method just checking the response we don't have any logic manipulations
  async getTeacherJoinedDate(
    userId: string,
    classId: string
  ): Promise<TableTypes<'class_user'> | undefined> {
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
      console.error('Error fetching teacher joined date:', error);
    }

    return undefined;
  }

  // ! Need to ask
  async getAssignedStudents(assignmentId: string): Promise<string[]> {
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
      console.log('userids..', userIds);

      return userIds ?? [];
    } catch (error) {
      console.error('Error fetching user IDs:', error);
      return [];
    }
  }

  async deleteTeacher(classId: string, teacherId: string) {
    try {
      const query = `
      SELECT * 
      FROM ${TABLES.ClassUser}
      WHERE user_id = ? AND class_id = ?
      AND role = 'teacher' AND is_deleted = 0
    `;
      const res = await this._db?.query(query, [teacherId, classId]);
      await this.executeQuery(
        `UPDATE class_user SET is_deleted = 1 WHERE user_id = ? AND class_id = ? AND role = 'teacher' AND is_deleted = 0`,
        [teacherId, classId]
      );

      let userData;

      if (res && res.values && res.values.length > 0) {
        userData = res.values[0];
        console.log('user..', userData);
      } else {
        throw new Error('Teacher not found after update.');
      }

      await this.updatePushChanges(TABLES.ClassUser, MUTATE_TYPES.UPDATE, {
        id: userData.id,
        is_deleted: true,
      });
    } catch (error) {
      console.log('🚀 ~ SqliteApi ~ deleteTeacher ~ error:', error);
    }
  }

  // Note: This is also dependent method
  async getClassCodeById(class_id: string): Promise<number | undefined> {
    if (!class_id) return;
    const currentDate = new Date().toISOString(); // Convert to a proper format for SQL (ISO 8601)
    const query = `SELECT code 
    FROM ${TABLES.ClassInvite_code} 
    WHERE class_id='${class_id}' 
    AND is_deleted = FALSE 
    AND (expires_at >= '${currentDate}')`;

    try {
      const res = await this._db?.query(query);
      return res?.values?.[0]?.code;
    } catch (error) {
      console.error('Error executing query:', error); // Log any errors
      return;
    }
  }

  // Note: will not separate out this method because it dependent here
  async createClassCode(classId: string): Promise<number> {
    if (!classId) {
      throw new Error('Class ID is required to create a class code.');
    }
    const existingClassCode = await this.getClassCodeById(classId);

    if (existingClassCode) {
      return existingClassCode;
    }
    let classCode = await this._serverApi.createClassCode(classId);
    if (!classCode) {
      throw new Error(`A class code is not created`);
    }
    this.syncDB();
    return classCode;
  }
  // Note: simple method just checking the response we don't have any logic manipulations
  async getResultByChapterByDate(
    chapter_id: string,
    course_id: string,
    startDate: string,
    endDate: string
  ): Promise<TableTypes<'result'>[] | undefined> {
    const query = `SELECT * 
       FROM ${TABLES.Result} 
       WHERE chapter_id = '${chapter_id}'
       AND course_id = '${course_id}'
       AND created_at BETWEEN '${startDate}' AND '${endDate}'
       ORDER BY created_at DESC;`;

    const res = await this._db?.query(query);

    if (!res || !res.values || res.values.length < 1) return;
    return res.values;
  }
  // Note: simple method just checking the response we don't have any logic manipulations
  async getPrincipalsForSchool(
    schoolId: string
  ): Promise<TableTypes<'user'>[] | undefined> {
    const query = `
    SELECT user.*
    FROM ${TABLES.SchoolUser} AS su
    JOIN ${TABLES.User} AS user ON su.user_id= user.id
    WHERE su.school_id = "${schoolId}" and su.role = '${RoleType.PRINCIPAL}' and su.is_deleted = false;
  `;
    const res = await this._db?.query(query);
    return res?.values ?? [];
  }

  // Note: simple method just checking the response we don't have any logic manipulations
  async getCoordinatorsForSchool(
    schoolId: string
  ): Promise<TableTypes<'user'>[] | undefined> {
    const query = `
    SELECT user.*
    FROM ${TABLES.SchoolUser} AS su
    JOIN ${TABLES.User} AS user ON su.user_id= user.id
    WHERE su.school_id = "${schoolId}" and su.role = '${RoleType.COORDINATOR}' and su.is_deleted = false;
  `;
    const res = await this._db?.query(query);
    return res?.values ?? [];
  }

  // Note: simple method just checking the response we don't have any logic manipulations
  async getSponsorsForSchool(
    schoolId: string
  ): Promise<TableTypes<'user'>[] | undefined> {
    const query = `
    SELECT user.*
    FROM ${TABLES.SchoolUser} AS su
    JOIN ${TABLES.User} AS user ON su.user_id= user.id
    WHERE su.school_id = "${schoolId}" and su.role = '${RoleType.SPONSOR}' and su.is_deleted = false;
  `;
    const res = await this._db?.query(query);
    return res?.values ?? [];
  }

  // Note: will not separate out this method because it dependent here
  async addUserToSchool(
    schoolId: string,
    userId: string,
    role: RoleType
  ): Promise<void> {
    const schoolUserId = uuidv4();
    const schoolUser = {
      id: schoolUserId,
      school_id: schoolId,
      user_id: userId,
      role: role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
    };

    await this.executeQuery(
      `
    INSERT INTO school_user (id, school_id, user_id, role, created_at, updated_at, is_deleted)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [
        schoolUser.id,
        schoolUser.school_id,
        schoolUser.user_id,
        schoolUser.role,
        schoolUser.created_at,
        schoolUser.updated_at,
        schoolUser.is_deleted,
      ]
    );

    await this.updatePushChanges(
      TABLES.SchoolUser,
      MUTATE_TYPES.INSERT,
      schoolUser
    );
    var user_doc = await this._serverApi.getUserByDocId(userId);
    if (user_doc) {
      await this.executeQuery(
        `
        INSERT INTO user (id, name, age, gender, avatar, image, curriculum_id, language_id,created_at,updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO NOTHING;
        `,
        [
          user_doc.id,
          user_doc.name,
          user_doc.age,
          user_doc.gender,
          user_doc.avatar,
          user_doc.image,
          user_doc.curriculum_id,
          user_doc.language_id,
          user_doc.created_at,
          user_doc.updated_at,
        ]
      );
    }
  }

  // Todo: will not separate out this method because it dependent here
  async deleteUserFromSchool(
    schoolId: string,
    userId: string,
    role: RoleType
  ): Promise<void> {
    try {
      const query = `
      SELECT * 
      FROM ${TABLES.SchoolUser}
      WHERE user_id = ? AND school_id = ?
      AND role = '${role}' AND is_deleted = 0
    `;
      const res = await this._db?.query(query, [userId, schoolId]);

      await this.executeQuery(
        `UPDATE school_user SET is_deleted = 1 WHERE user_id = ? 
        AND school_id = ? AND role = '${role}' AND is_deleted = 0`,
        [userId, schoolId]
      );

      let userData;
      if (res && res.values && res.values.length > 0) {
        userData = res.values[0];
      } else {
        throw new Error('school user not found after update.');
      }
      await this.updatePushChanges(TABLES.SchoolUser, MUTATE_TYPES.UPDATE, {
        id: userData.id,
        is_deleted: true,
      });
    } catch (error) {
      console.log('🚀 ~ SqliteApi ~ deleteUserFromSchool ~ error:', error);
    }
  }
}
