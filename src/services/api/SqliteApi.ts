import { DocumentData, Unsubscribe } from "firebase/firestore";
import {
  MODES,
  LeaderboardDropdownList,
  LeaderboardRewards,
  TABLES,
  TableTypes,
  MUTATE_TYPES,
  LIVE_QUIZ,
  CURRENT_SQLITE_VERSION,
} from "../../common/constants";
import { StudentLessonResult } from "../../common/courseConstants";
import { AvatarObj } from "../../components/animation/Avatar";
import Course from "../../models/course";
import Lesson from "../../models/lesson";
import LiveQuizRoomObject from "../../models/liveQuizRoom";
import User from "../../models/user";
import { LeaderboardInfo, ServiceApi } from "./ServiceApi";
import {
  SQLiteDBConnection,
  SQLiteConnection,
  CapacitorSQLite,
  capSQLiteResult,
  DBSQLiteValues,
} from "@capacitor-community/sqlite";
import { Capacitor } from "@capacitor/core";
import { SupabaseApi } from "./SupabaseApi";
import { APIMode, ServiceConfig } from "../ServiceConfig";
import { v4 as uuidv4 } from "uuid";
import { RoleType } from "../../interface/modelInterfaces";
import { Util } from "../../utility/util";

export class SqliteApi implements ServiceApi {
  public static i: SqliteApi;
  private _db: SQLiteDBConnection | undefined;
  private _sqlite: SQLiteConnection | undefined;
  private DB_NAME = "db_issue10";
  private DB_VERSION = 1;
  private _serverApi: SupabaseApi;
  private _currentMode: MODES;
  private _currentStudent: TableTypes<"user"> | undefined;
  private _currentClass: TableTypes<"class"> | undefined;
  private _currentSchool: TableTypes<"school"> | undefined;
  private _syncTableData = {};

  public static async getInstance(): Promise<SqliteApi> {
    if (!SqliteApi.i) {
      SqliteApi.i = new SqliteApi();
      SqliteApi.i._serverApi = SupabaseApi.getInstance();
      await SqliteApi.i.init();
    }
    return SqliteApi.i;
  }

  private async init() {
    SupabaseApi.getInstance();
    const platform = Capacitor.getPlatform();
    this._sqlite = new SQLiteConnection(CapacitorSQLite);
    if (platform === "web") {
      const jeepEl = document.createElement("jeep-sqlite");
      document.body.appendChild(jeepEl);
      await customElements.whenDefined("jeep-sqlite");
      await this._sqlite.initWebStore();
    }
    let ret: capSQLiteResult | undefined;
    let isConn: boolean | undefined;
    try {
      ret = await this._sqlite.checkConnectionsConsistency();
      isConn = (await this._sqlite.isConnection(this.DB_NAME, false)).result;
    } catch (error) {
      console.log("🚀 ~ Api ~ init ~ error:", error);
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
        const data = await fetch("databases/upgradeStatements.json");
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
            upgradeStatementsMap[version]["statements"]
          ) {
            upgradeStatements = upgradeStatements.concat(
              upgradeStatementsMap[version]["statements"]
            );

            const versionData = upgradeStatementsMap[version];
            if (versionData && versionData["tableChanges"]) {
              if (versionData["tableChanges"]) {
                for (const tableName in versionData["tableChanges"]) {
                  const changeDate = versionData["tableChanges"][tableName];

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
          "🚀 ~ SqliteApi ~ init ~ upgradeStatements:",
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
      console.log("🚀 ~ SqliteApi ~ init ~ error:", JSON.stringify(error));
    }

    if (ret && ret.result && isConn) {
      this._db = await this._sqlite.retrieveConnection(this.DB_NAME, false);
    } else {
      this._db = await this._sqlite.createConnection(
        this.DB_NAME,
        false,
        "no-encryption",
        this.DB_VERSION,
        false
      );
    }
    try {
      await this._db.open();
    } catch (err) {
      console.log("🚀 ~ SqliteApi ~ init ~ err:", err);
    }
    await this.setUpDatabase();
    return this._db;
  }

  private async setUpDatabase() {
    console.log("🚀 ~ SqliteApi ~ setUpDatabase ~ setUpDatabase:");
    if (!this._db || !this._sqlite) return;
    try {
      const exportedData = await this._db.exportToJson("full");
      console.log(
        "🚀 ~ Api ~ setUpDatabase ~ exportedData:",
        JSON.stringify(exportedData.export?.tables)
      );
      if (exportedData.export?.tables) {
        for (const da of exportedData.export?.tables) {
          console.log(
            "new schema name: ",
            da.name,
            " schema: ",
            JSON.stringify(da.schema)
          );
        }
      }
    } catch (error) {
      console.log("🚀 ~ SqliteApi ~ setUpDatabase ~ error:", error);
    }
    let res1: DBSQLiteValues | undefined = undefined;
    try {
      const stmt =
        "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table';";
      res1 = await this._db.query(stmt);
      console.log("🚀 ~ SqliteApi ~ setUpDatabase ~ res1:", res1);
    } catch (error) {
      console.log(
        "🚀 ~ SqliteApi ~ setUpDatabase ~ error:",
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
          const importData = await fetch("databases/import.json");
          if (!importData || !importData.ok) return;
          const importJson = JSON.stringify((await importData.json()) ?? {});
          const resImport = await this._sqlite.importFromJson(importJson);
          localStorage.setItem(
            CURRENT_SQLITE_VERSION,
            this.DB_VERSION.toString()
          );
          console.log("🚀 ~ SqliteApi ~ setUpDatabase ~ resImport:", resImport);
          // if (!Capacitor.isNativePlatform())
          window.location.reload();
        } catch (error) {
          console.log("🚀 ~ SqliteApi ~ setUpDatabase ~ error:", error);
        }
      } catch (error) {
        console.log("🚀 ~ SqliteApi ~ setUpDatabase ~ error:", error);
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
            "🚀 ~ SqliteApi ~ setUpDatabase ~ updatePullSyncQuery:",
            updatePullSyncQuery
          );
          await this.executeQuery(updatePullSyncQuery);
        }
      }
    }

    const config = ServiceConfig.getInstance(APIMode.SQLITE);
    const isUserLoggedIn = await config.authHandler.isUserLoggedIn();
    if (isUserLoggedIn) {
      console.log("syncing");
      let user;
      try {
        user = await config.authHandler.getCurrentUser();
      } catch (error) {
        console.log("🚀 ~ SqliteApi ~ setUpDatabase ~ error:", error);
      }
      if (!user) {
        await this.syncDbNow();
      } else {
        this.syncDbNow();
      }
    } else {
      console.log("not syncing");
    }
  }

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

  private async pullChanges(tableNames: TABLES[]) {
    if (!this._db) return;
    const tables = "'" + tableNames.join("', '") + "'";

    const tablePullSync = `SELECT * FROM pull_sync_info WHERE table_name IN (${tables});`;
    let res: any[] = [];
    try {
      res = (await this._db.query(tablePullSync)).values ?? [];
    } catch (error) {
      console.log("🚀 ~ Api ~ syncDB ~ error:", error);
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
          "🚀 ~ SqliteApi ~ pullChanges ~ tableInfo:",
          existingColumns
        );
        if (existingColumns) {
          for (const row of tableData) {
            const fieldNames = Object.keys(row).filter((fieldName) =>
              existingColumns.includes(fieldName)
            );
            const fieldValues = fieldNames.map((fieldName) => row[fieldName]);
            const fieldPlaceholders = fieldNames.map(() => "?").join(", ");

            if (fieldNames.length === 0) continue; // Skip if no valid columns

            const stmt = `INSERT OR REPLACE INTO ${tableName} (${fieldNames.join(", ")}) VALUES (${fieldPlaceholders})`;
            console.log(
              "🚀 ~ pullChanges ~ stmt, fieldValues:",
              stmt,
              fieldValues,
              fieldValues.length
            );

            try {
              await this.executeQuery(stmt, fieldValues);
            } catch (error) {
              console.log("🚀 ~ pullChanges ~ Error:", error);
            }
          }
        }

        const lastPulled = new Date().toISOString();
        const stmt = `INSERT OR REPLACE INTO pull_sync_info (table_name, last_pulled) VALUES (?, ?)`;
        await this.executeQuery(stmt, [tableName, lastPulled]);
      }
    }
  }
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
      console.log("🚀 ~ syncDB ~ tablePushSync:", res);
    } catch (error) {
      console.log("🚀 ~ Api ~ syncDB ~ error:", error);
      await this.createSyncTables();
    }
    if (res && res.length) {
      for (const data of res) {
        const newData = JSON.parse(data.data);
        console.log("🚀 ~ SqliteApi ~ pushChanges ~ newData:", newData);
        const isMutated = await this._serverApi.mutate(
          data.change_type,
          data.table_name,
          newData,
          newData.id
        );
        console.log("🚀 ~ Api ~ pushChanges ~ isMutated:", isMutated);
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
    this.pushChanges(tableNames).then((value) => {
      const tables = "'" + tableNames.join("', '") + "'";
      this.executeQuery(
        `UPDATE pull_sync_info SET last_pulled = CURRENT_TIMESTAMP WHERE table_name IN (${tables})`
      );
    });
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
    data["updated_at"] = new Date().toISOString();
    const stmt = `INSERT OR REPLACE INTO push_sync_info (id, table_name, change_type, data) VALUES (?, ?, ?, ?)`;
    const variables = [
      uuidv4(),
      tableName.toString(),
      mutateType,
      JSON.stringify(data),
    ];
    console.log("🚀 ~ Api ~ variables:", variables);
    await this.executeQuery(stmt, variables);
    this.syncDbNow([tableName]);
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
  ): Promise<TableTypes<"user">> {
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw "User is not Logged in";
    const studentId = uuidv4();
    console.log("🚀 ~ SqliteApi ~ id:", studentId);
    const newStudent: TableTypes<"user"> = {
      age: age ?? null,
      avatar: avatar ?? null,
      created_at: new Date().toISOString(),
      curriculum_id: boardDocId ?? null,
      gender: gender ?? null,
      id: studentId,
      image: image ?? null,
      is_deleted: false,
      is_tc_accepted: true,
      language_id: languageDocId ?? null,
      name: name,
      grade_id: gradeDocId ?? null,
      updated_at: new Date().toISOString(),
      email: null,
      phone: null,
      fcm_token: null,
      music_off: false,
      sfx_off: false,
    };

    const res = await this.executeQuery(
      `
    INSERT INTO user (id, name, age, gender, avatar, image, curriculum_id, language_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
  `,
      [
        newStudent.id,
        newStudent.name,
        newStudent.age,
        newStudent.gender,
        newStudent.avatar,
        newStudent.image,
        newStudent.curriculum_id,
        newStudent.language_id,
      ]
    );
    console.log("🚀 ~ SqliteApi ~ res:", res);
    const parentUserId = uuidv4();
    const newParentUser: TableTypes<"parent_user"> = {
      created_at: new Date().toISOString(),
      id: parentUserId,
      is_deleted: false,
      parent_id: _currentUser.id,
      student_id: studentId,
      updated_at: new Date().toISOString(),
    };
    const res1 = await this.executeQuery(
      `
      INSERT INTO parent_user (id, parent_id, student_id)
    VALUES (?, ?, ?);
  `,
      [newParentUser.id, newParentUser.parent_id, newParentUser.student_id]
    );
    console.log("🚀 ~ SqliteApi ~ res1:", res1);

    this.updatePushChanges(TABLES.User, MUTATE_TYPES.INSERT, newStudent);
    this.updatePushChanges(
      TABLES.ParentUser,
      MUTATE_TYPES.INSERT,
      newParentUser
    );
    const courses = await this.getAllCourses();
    const courseIds = courses.map((val) => val.id);
    for (const courseId of courseIds) {
      const newUserCourse: TableTypes<"user_course"> = {
        course_id: courseId,
        created_at: new Date().toISOString(),
        id: uuidv4(),
        is_deleted: false,
        updated_at: new Date().toISOString(),
        user_id: newStudent.id,
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

  deleteProfile(studentId: string) {
    throw new Error("Method not implemented.");
  }

  async getAllCurriculums(): Promise<TableTypes<"curriculum">[]> {
    const res = await this._db?.query("select * from " + TABLES.Curriculum);
    console.log("🚀 ~ SqliteApi ~ getAllCurriculums ~ res:", res);
    return res?.values ?? [];
  }

  async getAllGrades(): Promise<TableTypes<"grade">[]> {
    const res = await this._db?.query("select * from " + TABLES.Grade);
    return res?.values ?? [];
  }

  async getAllLanguages(): Promise<TableTypes<"language">[]> {
    const res = await this._db?.query("select * from " + TABLES.Language);
    console.log("🚀 ~ SqliteApi ~ getAllLanguages ~ res:", res);
    return res?.values ?? [];
  }

  async getParentStudentProfiles(): Promise<TableTypes<"user">[]> {
    if (!this._db) throw "Db is not initialized";
    const authHandler = ServiceConfig.getI()?.authHandler;
    const currentUser = await authHandler?.getCurrentUser();
    if (!currentUser) throw "User is not Logged in";
    const query = `
  SELECT *
  FROM ${TABLES.ParentUser} AS parent
  JOIN ${TABLES.User} AS student ON parent.student_id = student.id
  WHERE parent.parent_id = "${currentUser.id}";
`;
    const res = await this._db.query(query);
    return res.values ?? [];
  }

  get currentStudent(): TableTypes<"user"> | undefined {
    return this._currentStudent;
  }

  set currentStudent(value: TableTypes<"user"> | undefined) {
    this._currentStudent = value;
  }

  get currentClass(): TableTypes<"class"> | undefined {
    return this._currentClass;
  }

  set currentClass(value: TableTypes<"class"> | undefined) {
    this._currentClass = value;
  }

  get currentSchool(): TableTypes<"school"> | undefined {
    return this._currentSchool;
  }

  set currentSchool(value: TableTypes<"school"> | undefined) {
    this._currentSchool = value;
  }

  async updateSoundFlag(userId: string, value: boolean) {
    const query = `
    UPDATE "user"
    SET sfx_off = ${value ? 1 : 0}
    WHERE id = "${userId}";
  `;
    const res = await this.executeQuery(query);
    console.log("🚀 ~ SqliteApi ~ updateSoundFlag ~ res:", res);
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
    console.log("🚀 ~ SqliteApi ~ updateMusicFlag ~ res:", res);
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
    console.log("🚀 ~ SqliteApi ~ updateMusicFlag ~ res:", res);
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
      "🚀 ~ SqliteApi ~ updateTcAccept ~ res:",
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
  ): Promise<TableTypes<"language"> | undefined> {
    const res = await this._db?.query(
      `select * from ${TABLES.Language} where id = "${id}"`
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }

  async getLessonWithCocosLessonId(
    lessonId: string
  ): Promise<TableTypes<"lesson"> | null> {
    const res = await this._db?.query(
      `select * from ${TABLES.Lesson} where cocos_lesson_id = "${lessonId}"`
    );
    if (!res || !res.values || res.values.length < 1) return null;
    return res.values[0];
  }

  async getCoursesForParentsStudent(
    studentId: string
  ): Promise<TableTypes<"course">[]> {
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
  ): Promise<TableTypes<"course">[]> {
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
  ): Promise<TableTypes<"course">[]> {
    const query = `
    SELECT *
    FROM ${TABLES.ClassCourse} AS cc
    JOIN ${TABLES.Course} AS course ON cc.course_id= course.id
    WHERE cc.class_id = "${classId}";
  `;
    const res = await this._db?.query(query);
    return res?.values ?? [];
  }

  async getLesson(id: string): Promise<TableTypes<"lesson"> | undefined> {
    const res = await this._db?.query(
      `select * from ${TABLES.Lesson} where id = "${id}"`
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }

  async getChapterById(id: string): Promise<TableTypes<"chapter"> | undefined> {
    const res = await this._db?.query(
      `select * from ${TABLES.Chapter} where id = "${id}"`
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }

  async getLessonsForChapter(
    chapterId: string
  ): Promise<TableTypes<"lesson">[]> {
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

  async getDifferentGradesForCourse(course: TableTypes<"course">): Promise<{
    grades: TableTypes<"grade">[];
    courses: TableTypes<"course">[];
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
      grades: TableTypes<"grade">[];
      courses: TableTypes<"course">[];
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

  getAvatarInfo(): Promise<AvatarObj | undefined> {
    throw new Error("Method not implemented.");
  }

  getLessonResultsForStudent(
    studentId: string
  ): Promise<Map<string, StudentLessonResult> | undefined> {
    throw new Error("Method not implemented.");
  }

  async getLiveQuizLessons(
    classId: string,
    studentId: string
  ): Promise<TableTypes<"assignment">[]> {
    const query = `
    SELECT a.*
    FROM ${TABLES.Assignment} a
    LEFT JOIN ${TABLES.Assignment_user} au ON a.id = au.assignment_id
    LEFT JOIN result r ON a.id = r.assignment_id AND r.student_id = "${studentId}"
    WHERE a.class_id = '${classId}' and type = "${LIVE_QUIZ}" and (a.is_class_wise = 1 or au.user_id = "${studentId}") and r.assignment_id IS NULL;
    `;
    const res = await this._db?.query(query);
    if (!res || !res.values || res.values.length < 1) return [];
    return res.values;
  }

  async getLiveQuizRoomDoc(
    liveQuizRoomDocId: string
  ): Promise<TableTypes<"live_quiz_room">> {
    const roomData =
      await this._serverApi.getLiveQuizRoomDoc(liveQuizRoomDocId);
    return roomData;
  }

  async updateFavoriteLesson(
    studentId: string,
    lessonId: string
  ): Promise<TableTypes<"favorite_lesson">> {
    const favoriteId = uuidv4();
    var favoriteLesson: TableTypes<"favorite_lesson">;
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
    classId: string | undefined,
    schoolId: string | undefined
  ): Promise<TableTypes<"result">> {
    const resultId = uuidv4();
    console.log("🚀 ~ SqliteApi ~ id:", studentId);
    const newResult: TableTypes<"result"> = {
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
    };

    const res = await this.executeQuery(
      `
    INSERT INTO result (id, assignment_id, correct_moves, lesson_id, school_id, score, student_id, time_spent, wrong_moves, created_at, updated_at, is_deleted )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
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
      ]
    );
    console.log("🚀 ~ SqliteApi ~ res:", res);
    this.updatePushChanges(TABLES.Result, MUTATE_TYPES.INSERT, newResult);
    return newResult;
  }

  async updateStudent(
    student: TableTypes<"user">,
    name: string,
    age: number,
    gender: string,
    avatar: string,
    image: string | undefined,
    boardDocId: string,
    gradeDocId: string,
    languageDocId: string
  ): Promise<TableTypes<"user">> {
    const query = `
  UPDATE "user"
  SET name = "${name}",
      age = ${age},
      gender = "${gender}",
      avatar = "${avatar}",
      image = "${image}",
      curriculum_id = "${boardDocId}",
      grade_id = "${gradeDocId}",
      language_id = "${languageDocId}"
  WHERE id = "${student.id}";
`;

    const res = await this.executeQuery(query);
    console.log("🚀 ~ SqliteApi ~ updateStudent ~ res:", res);
    this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, {
      name: name,
      age: age,
      gender: gender,
      avatar: avatar,
      image: image,
      curriculum_id: boardDocId,
      grade_id: gradeDocId,
      language_id: languageDocId,
      id: student.id,
    });
    return student;
  }

  async getSubject(id: string): Promise<TableTypes<"subject"> | undefined> {
    const res = await this._db?.query(
      `select * from ${TABLES.Subject} where id = "${id}"`
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }

  async getCourse(id: string): Promise<TableTypes<"course"> | undefined> {
    const res = await this._db?.query(
      `select * from ${TABLES.Course} where id = "${id}"`
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }

  async getStudentResult(
    studentId: string,
    fromCache?: boolean
  ): Promise<TableTypes<"result">[]> {
    const query = `
    SELECT * FROM ${TABLES.Result}
    where student_id = '${studentId}'
    `;
    const res = await this._db?.query(query);
    return res?.values ?? [];
  }

  async getStudentResultInMap(
    studentId: string
  ): Promise<{ [lessonDocId: string]: TableTypes<"result"> }> {
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
    console.log("🚀 ~ SqliteApi ~ getStudentResultInMap ~ res:", res?.values);
    if (!res || !res.values || res.values.length < 1) return {};
    const resultMap = {};
    for (const data of res.values) {
      resultMap[data.lesson_id] = data;
    }
    return resultMap;
  }

  async getClassById(id: string): Promise<TableTypes<"class"> | undefined> {
    const res = await this._db?.query(
      `select * from ${TABLES.Class} where id = "${id}"`
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }

  async getSchoolById(id: string): Promise<TableTypes<"school"> | undefined> {
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
    console.log("🚀 ~ SqliteApi ~ isStudentLinked ~ res:", res);
    if (!res || !res.values || res.values.length < 1) return false;
    return true;
  }
  async getPendingAssignments(
    classId: string,
    studentId: string
  ): Promise<TableTypes<"assignment">[]> {
    const query = `
    SELECT a.*
    FROM ${TABLES.Assignment} a
    LEFT JOIN ${TABLES.Assignment_user} au ON a.id = au.assignment_id
    LEFT JOIN result r ON a.id = r.assignment_id AND r.student_id = "${studentId}"
    WHERE a.class_id = '${classId}' and (a.is_class_wise = 1 or au.user_id = "${studentId}") and r.assignment_id IS NULL;
    `;
    const res = await this._db?.query(query);
    if (!res || !res.values || res.values.length < 1) return [];
    return res.values;
  }

  async getSchoolsForUser(
    userId: string
  ): Promise<{ school: TableTypes<"school">; role: RoleType }[]> {
    const query = `
    SELECT su.*, 
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
    FROM ${TABLES.SchoolUser} su
    JOIN ${TABLES.School} s ON su.school_id = s.id
    WHERE su.user_id = "${userId}" and NOT su.role = "${RoleType.PARENT}"
    `;
    const res = await this._db?.query(query);
    console.log("🚀 ~ SqliteApi ~ getSchoolsForUser ~ res:", res);
    if (!res || !res.values || res.values.length < 1) return [];
    const finalData: { school: TableTypes<"school">; role: RoleType }[] = [];
    for (const data of res.values) {
      finalData.push({
        role: data.role,
        school: JSON.parse(data.school),
      });
    }
    return finalData;
  }

  public get currentMode(): MODES {
    return this._currentMode;
  }

  public set currentMode(value: MODES) {
    this._currentMode = value;
  }

  async isUserTeacher(userId: string): Promise<boolean> {
    const schools = await this.getSchoolsForUser(userId);
    return schools.length > 0;
  }
  async getClassesForSchool(
    schoolId: string,
    userId: string
  ): Promise<TableTypes<"class">[]> {
    const schoolQuery = `
    SELECT * FROM ${TABLES.SchoolUser} WHERE school_id = '${schoolId}' AND user_id = '${userId}' AND NOT role = '${RoleType.PARENT}' 
    `;
    const res = await this._db?.query(schoolQuery);
    if (!res || !res.values || res.values.length < 1) return [];
    const role: RoleType = res.values[0].role;
    if (role === RoleType.TEACHER) {
      const query = `
      SELECT c.*
      FROM ${TABLES.ClassUser} cu
      JOIN ${TABLES.Class} c ON cu.class_id = c.id
      WHERE cu.user_id = "${userId}" and cu.role = "${RoleType.TEACHER}"
      `;
      const res = await this._db?.query(query);
      if (!res || !res.values || res.values.length < 1) return [];
      return res?.values;
    } else {
      const query = `
      SELECT *
      FROM ${TABLES.Class} 
      WHERE school_id = '${schoolId}'
      `;
      const res = await this._db?.query(query);
      if (!res || !res.values || res.values.length < 1) return [];
      return res?.values;
    }
  }

  async getStudentsForClass(classId: string): Promise<TableTypes<"user">[]> {
    const query = `
    SELECT user.*
    FROM ${TABLES.ClassUser} AS cu
    JOIN ${TABLES.User} AS user ON cu.user_id= user.id
    WHERE cu.class_id = "${classId}" and cu.role = '${RoleType.STUDENT}';
  `;
    const res = await this._db?.query(query);
    return res?.values ?? [];
  }

  async getDataByInviteCode(inviteCode: number): Promise<any> {
    let inviteData = await this._serverApi.getDataByInviteCode(inviteCode);
    return inviteData;
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
      if (!this._db) throw new Error("Database is not initialized");

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
          name: result.name || "",
          score: result.total_score || 0,
          timeSpent: result.total_time_spent || 0,
          lessonsPlayed: result.lessons_played || 0,
          userId: studentId,
        };

        switch (result.type) {
          case "allTime":
            leaderBoardList.allTime.push(leaderboardEntry);
            break;
          case "monthly":
            leaderBoardList.monthly.push(leaderboardEntry);
            break;
          case "weekly":
            leaderBoardList.weekly.push(leaderboardEntry);
            break;
          default:
            console.warn("Unknown leaderboard type: ", result.type);
        }
      });

      return leaderBoardList;
    } catch (error) {
      console.error(
        "Error in getLeaderboardStudentResultFromB2CCollection: ",
        error
      );
    }
  }

  async getAllLessonsForCourse(
    courseId: string
  ): Promise<TableTypes<"lesson">[]> {
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
    throw new Error("Method not implemented.");
  }

  async getCoursesByGrade(gradeDocId: any): Promise<TableTypes<"course">[]> {
    const res = await this._db?.query(
      `select * from ${TABLES.Course} where grade_id = "${gradeDocId}"`
    );
    return res?.values ?? [];
  }

  async getAllCourses(): Promise<TableTypes<"course">[]> {
    const res = await this._db?.query(`select * from ${TABLES.Course}`);
    return res?.values ?? [];
  }
  deleteAllUserData(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async getCoursesFromLesson(
    lessonId: string
  ): Promise<TableTypes<"course">[]> {
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

  async liveQuizListener(
    liveQuizRoomDocId: string,
    onDataChange: (roomDoc: TableTypes<"live_quiz_room"> | undefined) => void
  ) {
    return await this._serverApi.liveQuizListener(
      liveQuizRoomDocId,
      onDataChange
    );
  }

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

  async joinLiveQuiz(
    assignmentId: string,
    studentId: string
  ): Promise<string | undefined> {
    const data = await this._serverApi.joinLiveQuiz(assignmentId, studentId);
    return data;
  }
  async getStudentResultsByAssignmentId(
    assignmentId: string
  ): Promise<TableTypes<"result">[]> {
    const res =
      await this._serverApi.getStudentResultsByAssignmentId(assignmentId);
    return res;
  }
  async getAssignmentById(
    id: string
  ): Promise<TableTypes<"assignment"> | undefined> {
    const res = await this._db?.query(
      `select * from ${TABLES.Assignment} where id = "${id}"`
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }

  async getBadgesByIds(ids: string[]): Promise<TableTypes<"badge">[]> {
    if (ids.length === 0) return [];

    const quotedIds = ids.map((id) => `"${id}"`).join(", ");
    try {
      const res = await this._db?.query(
        `SELECT * FROM ${TABLES.Badge} WHERE id IN (${quotedIds})`
      );
      if (!res || !res.values || res.values.length < 1) return [];

      return res.values;
    } catch (error) {
      console.error("Error fetching badges by IDs:", error);
      return [];
    }
  }

  async getStickersByIds(ids: string[]): Promise<TableTypes<"sticker">[]> {
    if (ids.length === 0) return [];

    const quotedIds = ids.map((id) => `"${id}"`).join(`, `);
    try {
      const res = await this._db?.query(
        `select * FROM ${TABLES.Sticker} WHERE id IN (${quotedIds})`
      );
      if (!res || !res.values || res.values.length < 1) return [];
      return res.values;
    } catch (error) {
      console.error("Error fetching stickers by IDs:", error);
      return [];
    }
  }
  async getBonusesByIds(ids: string[]): Promise<TableTypes<"lesson">[]> {
    if (ids.length === 0) return [];

    const quotedIds = ids.map((id) => `"${id}"`).join(`, `);
    try {
      const res = await this._db?.query(
        `select * FROM ${TABLES.Lesson} WHERE id IN (${quotedIds})`
      );
      if (!res || !res.values || res.values.length < 1) return [];
      return res.values;
    } catch (error) {
      console.error("Error fetching stickers by IDs:", error);
      return [];
    }
  }
  async getRewardsById(
    id: number,
    periodType: string
  ): Promise<TableTypes<"reward"> | undefined> {
    try {
      const query = `SELECT ${periodType} FROM ${TABLES.Reward} WHERE year = ${id}`;
      const data = await this._db?.query(query);

      if (!data || !data.values || data.values.length === 0) {
        console.error("No reward found for the given year.");
        return;
      }
      const periodData = JSON.parse(data.values[0][periodType]);
      try {
        if (periodData) return periodData;
      } catch (parseError) {
        console.error("Error parsing JSON string:", parseError);
        return undefined;
      }
    } catch (error) {
      console.error("Error fetching reward by ID:", error);
      return undefined;
    }
  }

  async getUserSticker(userId: string): Promise<TableTypes<"user_sticker">[]> {
    try {
      const query = `select * from ${TABLES.UserSticker} where user_id = "${userId}"`;
      const data = await this._db?.query(query);

      if (!data || !data.values || data.values.length === 0) {
        console.error("No sticker found for the given user id.");
        return [];
      }

      const periodData = data.values;
      return periodData;
    } catch (error) {
      console.error("Error fetching sticker by user ID:", error);
      return [];
    }
  }
  async getUserBadge(userId: string): Promise<TableTypes<"user_badge">[]> {
    try {
      const query = `select * from ${TABLES.UserBadge} where user_id = "${userId}"`;
      const data = await this._db?.query(query);

      if (!data || !data.values || data.values.length === 0) {
        console.error("No badge found for the given user id.");
        return [];
      }

      const periodData = data.values;
      return periodData;
    } catch (error) {
      console.error("Error fetching user bade by user iD:", error);
      return [];
    }
  }

  async getUserBonus(userId: string): Promise<TableTypes<"user_bonus">[]> {
    try {
      const query = `select * from ${TABLES.UserBonus} where user_id = "${userId}"`;
      const data = await this._db?.query(query);

      if (!data || !data.values || data.values.length === 0) {
        console.error("No bonus found for the given user id.");
        return [];
      }

      const periodData = data.values;
      return periodData;
    } catch (error) {
      console.error("Error fetching bonus by user ID:", error);
      return [];
    }
  }

  async updateRewardAsSeen(studentId: string): Promise<void> {
    try {
      const query = `UPDATE ${TABLES.UserSticker} SET is_seen = true WHERE user_id = "${studentId}" AND is_seen = false`;
      await this._db?.query(query);
      console.log(`Updated unseen rewards to seen for student ${studentId}`);
    } catch (error) {
      console.error("Error updating rewards as seen:", error);
      throw new Error("Error updating rewards as seen.");
    }
  }

  async getUserByDocId(
    studentId: string
  ): Promise<TableTypes<"user"> | undefined> {
    const res = await this._db?.query(
      `select * from ${TABLES.User} where id = "${studentId}"`
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }

  addCourseForParentsStudent(courses: Course[], student: User) {
    throw new Error("Method not implemented.");
  }

  updateRewardsForStudent(studentId: string, unlockReward: LeaderboardRewards) {
    throw new Error("Method not implemented.");
  }

  async getChaptersForCourse(
    courseId: string
  ): Promise<TableTypes<"chapter">[]> {
    const query = `
    SELECT * FROM ${TABLES.Chapter} 
    WHERE course_id = "${courseId}"
    ORDER BY sort_index ASC;
    `;
    const res = await this._db?.query(query);
    return res?.values ?? [];
  }
  async getPendingAssignmentForLesson(
    lessonId: string,
    classId: string,
    studentId: string
  ): Promise<TableTypes<"assignment"> | undefined> {
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
  async getFavouriteLessons(userId: string): Promise<TableTypes<"lesson">[]> {
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
    classes: TableTypes<"class">[];
    schools: TableTypes<"school">[];
  }> {
    const data: {
      classes: TableTypes<"class">[];
      schools: TableTypes<"school">[];
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
  async updateFcmToken(userId: string) {
    const token = await Util.getToken();
    const query = `
    UPDATE "user"
    SET fcm_token = "${token}"
    WHERE id = "${userId}";
  `;
    const res = await this.executeQuery(query);
    console.log("🚀 ~ SqliteApi ~ updateFCM Token:", res);
    this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, {
      fcm_token: token,
      id: userId,
    });
  }
  async createUserDoc(
    user: TableTypes<"user">
  ): Promise<TableTypes<"user"> | undefined> {
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

  async syncDB(): Promise<boolean> {
    try {
      await this.syncDbNow();
      return true;
    } catch (error) {
      console.log("🚀 ~ SqliteApi ~ syncDB ~ error:", error);
      return false;
    }
  }
  async getStudentProgress(studentId: string): Promise<Map<string, string>> {
    const query = `
      SELECT r.*, l.name AS lesson_name, c.course_id AS course_id, c.name AS chapter_name
      FROM ${TABLES.Result} r
      JOIN ${TABLES.Lesson} l ON r.lesson_id = l.id
      JOIN ${TABLES.ChapterLesson} cl ON l.id = cl.lesson_id
      JOIN ${TABLES.Chapter} c ON cl.chapter_id = c.id
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
  async getRecommendedLessons(studentId: string): Promise<TableTypes<"lesson">[]> {
    // This Query will give last played lessons
    const lastPlayedLessonsQuery = `
  WITH
  course_details AS (
    SELECT
      c.name AS chapter_name,
      l.name AS lesson_name,
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
  )
select
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
  next_played_lesson;
  `;
    console.log("lastPlayedLessonsQuery ", lastPlayedLessonsQuery);

    const res = await this._db?.query(lastPlayedLessonsQuery);
    console.log("const res =  ", res?.values);
    if (!res || !res.values || res.values?.length <= 0) {
      console.log("if (!res || !res.values || res.values?.length <= 0 ");

      const firstLessonOfEachCourse = `
      WITH
  get_user_courses as (
    select
      *
    from
      ${TABLES.UserCourse}
    where
      user_id = '${studentId}'
  ),
  course_details AS (
    SELECT
      c.name AS chapter_name,
      l.name AS lesson_name,
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
  )
SELECT
  course_id,
  chapter_index,
  lesson_index,
  lesson_id as id,
  chapter_name,
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
FROM
  course_details
WHERE
  lesson_index = 0
  and chapter_index = 0;
`
      const firRes = await this._db?.query(firstLessonOfEachCourse);
      console.log("firRes?.values  ", firRes?.values);
      if (!firRes) {
        return []
      }
      let firstOfCourse = firRes.values as TableTypes<"lesson">[]
      return firstOfCourse
    }
    let listOfLessons = res.values as TableTypes<"lesson">[]

    console.log("listOfLessons ", listOfLessons);


    return listOfLessons;
  }

  async searchLessons(searchString: string): Promise<TableTypes<"lesson">[]> {
    if (!this._db) return [];
    const res: TableTypes<"lesson">[] = [];

    try {
      const serverResults = await this._serverApi.searchLessons(searchString);
      res.push(...serverResults);
    } catch (error) {
      console.log("🚀 ~ SqliteApi ~ searchLessons ~ error:", error);
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
    console.log("🚀 ~ SqliteApi ~ searchLessons ~ dat:", nameResults);
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
    console.log("🚀 ~ SqliteApi ~ searchLessons ~ dat1:", outcomeResults);
    return res;
  }
}
