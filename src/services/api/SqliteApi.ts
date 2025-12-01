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
  DEFAULT_SUBJECT_IDS,
  OTHER_CURRICULUM,
  grade1,
  aboveGrade3,
  belowGrade1,
  grade2,
  grade3,
  PROFILETYPE,
  STARS_COUNT,
  LATEST_STARS,
  SchoolRoleMap,
  MODEL,
  FilteredSchoolsForSchoolListingOps,
  COURSES,
  CHIMPLE_HINDI,
  GRADE1_KANNADA,
  GRADE1_MARATHI,
  CHIMPLE_ENGLISH,
  CHIMPLE_MATHS,
  CHIMPLE_DIGITAL_SKILLS,
  TabType,
  AVATARS,
  BASE_NAME,
  DELETED_CLASSES,
  StudentInfo,
  StudentAPIResponse,
  TeacherAPIResponse,
  TeacherInfo,
  PrincipalInfo,
  PrincipalAPIResponse,
  CoordinatorInfo,
  CoordinatorAPIResponse,
  EVENTS,
  EnumType,
  CACHETABLES,
  RequestTypes,
  STATUS,
  GeoDataParams,
  SearchSchoolsParams,
  SearchSchoolsResult,
  REWARD_LESSON,
  CURRENT_USER,
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
  capSQLiteVersionUpgrade,
} from "@capacitor-community/sqlite";
import { Capacitor } from "@capacitor/core";
import { SupabaseApi } from "./SupabaseApi";
import { APIMode, ServiceConfig } from "../ServiceConfig";
import { v4 as uuidv4 } from "uuid";
import { RoleType } from "../../interface/modelInterfaces";
import { Util } from "../../utility/util";
import { Table } from "@mui/material";
import { create } from "domain";
import { error } from "console";
import {
  UserSchoolClassParams,
  UserSchoolClassResult,
} from "../../ops-console/pages/NewUserPageOps";

export class SqliteApi implements ServiceApi {
  public static i: SqliteApi;
  private _db: SQLiteDBConnection | undefined;
  private _sqlite: SQLiteConnection | undefined;
  private DB_NAME = "db_issue10";
  private DB_VERSION = 7;
  private _serverApi: SupabaseApi;
  private _currentMode: MODES;
  private _currentStudent: TableTypes<"user"> | undefined;
  private _currentClass: TableTypes<"class"> | undefined;
  private _currentSchool: TableTypes<"school"> | undefined;
  private _currentCourse:
    | Map<string, TableTypes<"course"> | undefined>
    | undefined;
  private _syncTableData = {};

  public static getI(): SqliteApi {
    if (!SqliteApi.i) {
      SqliteApi.i = new SqliteApi();
      SqliteApi.i._serverApi = SupabaseApi.getInstance();
    }
    return SqliteApi.i;
  }

  public static async getInstance(): Promise<SqliteApi> {
    if (!SqliteApi.i) {
      SqliteApi.i = new SqliteApi();
      SqliteApi.i._serverApi = SupabaseApi.getInstance();
    }
    if (!SqliteApi.i._db) {
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
      console.error("🚀 ~ Api ~ init ~ error:", error);
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

        const data = await fetch("databases/upgradeStatements.json");

        if (!data || !data.ok) return;
        const upgradeStatementsMap: { [key: string]: string[] } =
          await data.json();

        for (
          let version = localVersionNumber + 1;
          version <= this.DB_VERSION;
          version++
        ) {
          const versionData = upgradeStatementsMap[version];

          if (versionData && versionData["statements"]) {
            upgradeStatements.push({
              toVersion: version,
              statements: versionData["statements"],
            });

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

        console.log(
          "🚀 ~ SqliteApi ~ init ~ upgradeStatements:",
          upgradeStatements
        );

        await this._sqlite.addUpgradeStatement(this.DB_NAME, upgradeStatements);

        localStorage.setItem(
          CURRENT_SQLITE_VERSION,
          this.DB_VERSION.toString()
        );
      }
    } catch (error) {
      console.error("🚀 ~ SqliteApi ~ init ~ error:", JSON.stringify(error));
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
      await this._db?.open();
    } catch (err) {
      console.error("🚀 ~ SqliteApi ~ init ~ err:", err);
    }
    await this.setUpDatabase();
    return this._db;
  }

  private async setUpDatabase() {
    if (!this._db || !this._sqlite) return;
    // try {
    //   const exportedData = await this._db.exportToJson("full");
    //   console.log(
    //     "🚀 ~ Api ~ setUpDatabase ~ exportedData:",
    //     JSON.stringify(exportedData.export?.tables)
    //   );
    // } catch (error) {
    //   console.error("🚀 ~ SqliteApi ~ setUpDatabase ~ error:", error);
    // }
    let res1: DBSQLiteValues | undefined = undefined;
    try {
      const stmt =
        "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table';";
      res1 = await this._db.query(stmt);
    } catch (error) {
      console.error(
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
          // window.location.reload();
          window.location.replace(BASE_NAME || "/");
          return;
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

    // Move sync logic to a separate method that can be called after full initialization
    await this.checkAndSyncData();
  }

  private async checkAndSyncData() {
    try {
      const config = ServiceConfig.getInstance(APIMode.SQLITE);
      const isUserLoggedIn = await config.authHandler.isUserLoggedIn();

      if (isUserLoggedIn) {
        console.log("syncing");
        const user = await config.authHandler.getCurrentUser();

        if (!user) {
          await this.syncDbNow();
        } else {
          this.syncDbNow();
        }
      }
    } catch (error) {
      console.log("🚀 ~ SqliteApi ~ checkAndSyncData ~ error:", error);
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

  private async showToastWithRetry(
    message: string,
    actionLabel = "Retry",
    duration = 15000
  ): Promise<boolean> {
    return new Promise((resolve) => {
      let resolved = false;
      let timeoutId: number | null = null;
      let overlay: HTMLDivElement | null = null;

      const finish = (val: boolean) => {
        if (resolved) return;
        resolved = true;
        try {
          if (overlay && overlay.parentElement)
            overlay.parentElement.removeChild(overlay);
        } catch {}
        if (timeoutId) window.clearTimeout(timeoutId);
        resolve(val);
      };

      try {
        // Ionic style presenter
        if (typeof (window as any).presentToast === "function") {
          (window as any).presentToast({
            message,
            duration,
            position: "bottom",
            color: "warning",
            buttons: [
              {
                text: actionLabel,
                handler: () => finish(true),
              },
            ],
          });
          timeoutId = window.setTimeout(() => finish(false), duration + 200);
          return;
        }

        // Fallback DOM toast
        overlay = document.createElement("div");
        overlay.setAttribute(
          "style",
          [
            "position:fixed",
            "left:12px",
            "right:12px",
            "bottom:20px",
            "z-index:2147483647",
            "display:flex",
            "align-items:center",
            "justify-content:space-between",
            "gap:12px",
            "padding:10px 14px",
            "background:rgba(0,0,0,0.85)",
            "color:#fff",
            "border-radius:8px",
            "font-family:system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
            "box-shadow:0 6px 18px rgba(0,0,0,0.3)",
          ].join(";")
        );

        const msgSpan = document.createElement("div");
        msgSpan.textContent = message;
        msgSpan.style.flex = "1";
        msgSpan.style.fontSize = "13px";
        msgSpan.style.overflow = "hidden";
        msgSpan.style.textOverflow = "ellipsis";
        msgSpan.style.whiteSpace = "nowrap";

        const btn = document.createElement("button");
        btn.textContent = actionLabel;
        btn.setAttribute(
          "style",
          [
            "margin-left:12px",
            "padding:6px 10px",
            "border-radius:6px",
            "border:none",
            "background:#fff",
            "color:#000",
            "cursor:pointer",
            "font-weight:600",
          ].join(";")
        );
        btn.onclick = () => finish(true);

        overlay.appendChild(msgSpan);
        overlay.appendChild(btn);
        document.body?.appendChild(overlay);

        timeoutId = window.setTimeout(() => finish(false), duration + 200);
      } catch (err) {
        console.warn("Fallback toast failed:", err);
        timeoutId = window.setTimeout(() => finish(false), duration);
      }
    });
  }

  private async pullChanges(tableNames: TABLES[], isFirstSync?: boolean) {
    if (!this._db) return;

    const isInitialFetch = isFirstSync;
    console.log("🚀 ~ pullChanges ~ isInitialFetch:", isInitialFetch);
    const tables = tableNames.map((t) => `'${t}'`).join(", ");
    const tablePullSync = `SELECT * FROM pull_sync_info WHERE table_name IN (${tables});`;
    let lastPullTables = new Map<string, string>();
    try {
      const res = (await this._db.query(tablePullSync)).values ?? [];
      res.forEach((row) => lastPullTables.set(row.table_name, row.last_pulled));
    } catch (error) {
      console.error("🚀 ~ Api ~ syncDB ~ error:", error);
      await this.createSyncTables();
    }
    let data = new Map<string, any[]>();
    if (isInitialFetch === true) {
      let attempt = 1;
      try {
        data = await this._serverApi.getTablesData(
          tableNames,
          lastPullTables,
          isInitialFetch
        );
      } catch (err) {
        console.error(`❌ Attempt ${attempt}: getTablesData failed`, err);
        if (attempt < 5) {
          const delay = 500 * Math.pow(2, attempt);
          await new Promise((res) => setTimeout(res, delay));
          return this.pullChanges(tableNames, isFirstSync);
        } else {
          console.warn("❌ All 5 retries failed. Truncating local tables...");
          if (!this._db) return;
          const query = `PRAGMA foreign_keys=OFF;`;
          const result = await this._db?.query(query);
          console.log(result);
          for (const table of tableNames) {
            const tableDel = `DELETE FROM "${table}";`;
            const res = await this._db.query(tableDel);
            console.log(res);
          }
          const vaccum = `VACUUM;`;
          const resv = await this._db.query(vaccum);
          console.log(resv);
          const querys = `PRAGMA foreign_keys=ON;`;
          const results = await this._db?.query(querys);
          console.log(results);
          const userWantsRetry = await this.showToastWithRetry(
            "Sync failed. Retry now?"
          );
          if (userWantsRetry) {
            console.warn("🔁 Final retry triggered by user.");
            return this.pullChanges(tableNames, isFirstSync); // restart pullChanges
          } else {
            console.warn("⛔ User canceled final retry.");
            return; // do nothing
          }
        }
      }
    } else {
      data = await this._serverApi.getTablesData(
        tableNames,
        lastPullTables,
        isInitialFetch
      );
    }
    const lastPulled = new Date().toISOString();
    let batchQueries: { statement: string; values: any[] }[] = [];
    for (const tableName of tableNames) {
      const tableData = data.get(tableName) ?? [];
      if (tableData.length === 0) continue;

      const existingColumns = await this.getTableColumns(tableName);
      if (!existingColumns || existingColumns.length === 0) continue;

      for (const row of tableData) {
        const fieldNames = Object.keys(row).filter((f) =>
          existingColumns.includes(f)
        );
        if (fieldNames.length === 0) continue;

        const fieldValues = fieldNames.map((f) => row[f]);
        const placeholders = fieldNames.map(() => "?").join(", ");
        const stmt = `INSERT OR REPLACE INTO ${tableName} (${fieldNames.join(
          ", "
        )}) VALUES (${placeholders})`;

        batchQueries.push({ statement: stmt, values: fieldValues });
      }

      // Update sync timestamp
      batchQueries.push({
        statement: `INSERT OR REPLACE INTO pull_sync_info (table_name, last_pulled) VALUES (?, ?)`,
        values: [tableName, lastPulled],
      });
    }

    // Update debug info
    let totalpulledRows = 0;
    let filteredObject = {};
    for (const [key, value] of data.entries()) {
      if (Array.isArray(value) && value.length > 0) {
        totalpulledRows += value.length;
        filteredObject[key] = value; // include only non-empty arrays
      }
    }
    const jsonString = JSON.stringify(filteredObject);
    const pulledRowsSizeInBytes = new TextEncoder().encode(jsonString).length;
    this.updateDebugInfo(0, totalpulledRows, pulledRowsSizeInBytes);
    if (batchQueries.length > 0) {
      try {
        await this._db.executeSet(batchQueries);
      } catch (error) {
        console.error("🚀 ~ pullChanges ~ Error executing batch:", error);
      }
    }
    if (!isInitialFetch) {
      const new_school = data.get(TABLES.School);
      if (new_school && new_school?.length > 0) {
        await this.syncDbNow(Object.values(TABLES), [
          TABLES.Assignment,
          TABLES.Assignment_user,
          TABLES.SchoolCourse,
          TABLES.Class,
          TABLES.ClassInvite_code,
          TABLES.Result,
          TABLES.User,
          TABLES.ClassUser,
          TABLES.SchoolUser,
          TABLES.ClassCourse,
        ]);
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

      this.updateDebugInfo(res.length, 0, 0); //update debug info
    } catch (error) {
      console.error("🚀 ~ Api ~ syncDB ~ error:", error);
      await this.createSyncTables();
    }
    if (res && res.length) {
      for (const data of res) {
        const newData = JSON.parse(data.data);
        const mutate = await this._serverApi.mutate(
          data.change_type,
          data.table_name,
          newData,
          newData.id
        );
        console.log("🚀 ~ Api ~ pushChanges ~ isMutated:", mutate);
        if (!mutate || mutate.error) {
          const _currentUser =
            await ServiceConfig.getI().authHandler.getCurrentUser();
          Util.logEvent(EVENTS.ERROR_LOGS, {
            user_id: _currentUser?.id,
            ...mutate?.error,
          });
          if (mutate?.error?.code === "23505") {
          } else {
            return false;
          }
        }
        await this.executeQuery(
          `DELETE FROM push_sync_info WHERE id = ? AND table_name = ?`,
          [data.id, data.table_name]
        );
        await this.executeQuery(
          `INSERT OR REPLACE INTO pull_sync_info (table_name, last_pulled) VALUES (?, ?)`,
          [data.table_name, new Date().toISOString()]
        );
      }
    }
    return true;
  }

  async syncDbNow(
    tableNames: TABLES[] = Object.values(TABLES),
    refreshTables: TABLES[] = [],
    isFirstSync?: boolean
  ) {
    if (!this._db) return;
    const refresh_tables = "'" + refreshTables.join("', '") + "'";
    console.log("logs to check synced tables", JSON.stringify(refresh_tables));
    await this.executeQuery(
      `UPDATE pull_sync_info SET last_pulled = '2024-01-01 00:00:00' WHERE table_name IN (${refresh_tables})`
    );
    await this.pullChanges(tableNames, isFirstSync);
    const res = await this.pushChanges(tableNames);
    const tables = "'" + tableNames.join("', '") + "'";
    console.log("logs to check synced tables1", JSON.stringify(tables));

    const currentTimestamp = new Date();
    const reducedTimestamp = new Date(currentTimestamp); // clone it
    reducedTimestamp.setMinutes(reducedTimestamp.getMinutes() - 1);
    const formattedTimestamp = reducedTimestamp.toISOString();

    this.executeQuery(
      `UPDATE pull_sync_info SET last_pulled = '${formattedTimestamp}'  WHERE table_name IN (${tables})`
    );
    console.log("logs to check synced tables2", JSON.stringify(tables));
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
    data["updated_at"] = new Date().toISOString();
    const stmt = `INSERT OR REPLACE INTO push_sync_info (id, table_name, change_type, data) VALUES (?, ?, ?, ?)`;
    const variables = [
      uuidv4(),
      tableName.toString(),
      mutateType,
      JSON.stringify(data),
    ];
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
  ): Promise<TableTypes<"user">> {
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw "User is not Logged in";
    const studentId = uuidv4();
    const newStudent: TableTypes<"user"> = {
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
      firebase_id: null,
      is_firebase: null,
      is_ops: null,
      learning_path: null,
      ops_created_by: null,
      reward: null,
      stars: null,
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

    await this.updatePushChanges(TABLES.User, MUTATE_TYPES.INSERT, newStudent);
    await this.updatePushChanges(TABLES.ParentUser, MUTATE_TYPES.INSERT, {
      id: parentUserId,
      parent_id: _currentUser.id,
      student_id: studentId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
    });
    let courses: TableTypes<"course">[] = [];
    if (gradeDocId && boardDocId) {
      courses = await this.getCourseByUserGradeId(gradeDocId, boardDocId);
      for (const course of courses) {
        const newUserCourse: TableTypes<"user_course"> = {
          course_id: course.id,
          created_at: new Date().toISOString(),
          id: uuidv4(),
          is_deleted: false,
          updated_at: new Date().toISOString(),
          user_id: studentId,
          is_firebase: null,
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
    } else {
      const englishCourse = await this.getCourse(CHIMPLE_ENGLISH);
      const mathsCourse = await this.getCourse(CHIMPLE_MATHS);
      const digitalSkillsCourse = await this.getCourse(CHIMPLE_DIGITAL_SKILLS);
      const language = await this.getLanguageWithId(languageDocId!);
      let langCourse;
      if (language && language.code !== COURSES.ENGLISH) {
        // Map language code to courseId
        const thirdLanguageCourseMap: Record<string, string> = {
          hi: CHIMPLE_HINDI,
          kn: GRADE1_KANNADA,
          mr: GRADE1_MARATHI,
        };

        const courseId = thirdLanguageCourseMap[language.code ?? ""];
        if (courseId) {
          langCourse = await this.getCourse(courseId);
        }
      }
      const coursesToAdd = [
        englishCourse,
        mathsCourse,
        langCourse,
        digitalSkillsCourse,
      ].filter(Boolean);
      for (const course of coursesToAdd) {
        const newUserCourse: TableTypes<"user_course"> = {
          course_id: course.id,
          created_at: new Date().toISOString(),
          id: uuidv4(),
          is_deleted: false,
          updated_at: new Date().toISOString(),
          user_id: studentId,
          is_firebase: null,
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
    return newStudent;
  }

  async addProfileImages(
    id: string,
    file: File,
    profileType: PROFILETYPE
  ): Promise<string | null> {
    return await this._serverApi.addProfileImages(id, file, profileType);
  }

  async uploadData(payload: any): Promise<boolean | null> {
    return await this._serverApi.uploadData(payload);
  }

  async createSchool(
    name: string,
    group1: string,
    group2: string,
    group3: string,
    group4: string | null,
    image: File | null,
    program_id: string | null,
    udise: string | null,
    address: string | null,
    country: string | null,
    onlySchool?: boolean,
    onlySchoolUser?: boolean
  ): Promise<TableTypes<"school">> {
    const oSchool = onlySchool ?? true;
    const oSchoolUser = onlySchoolUser ?? true;
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw "User is not Logged in";

    const schoolId = uuidv4();
    const result = image
      ? await this.addProfileImages(schoolId, image, PROFILETYPE.SCHOOL)
      : null;
    const newSchool: TableTypes<"school"> = {
      id: schoolId,
      name,
      group1: group1 ?? null,
      group2: group2 ?? null,
      group3: group3 ?? null,
      group4: group4 ?? null,
      image: result ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
      program_id: program_id ?? null,
      udise: udise ?? null,
      address: address ?? null,
      model: null,
      academic_year: null,
      firebase_id: null,
      is_firebase: null,
      is_ops: null,
      language: null,
      ops_created_by: null,
      student_login_type: null,
      status: STATUS.REQUESTED,
      key_contacts: null,
      country: country,
      location_link:null,
    };
    if (oSchool) {
      await this.executeQuery(
        `
      INSERT INTO school (id, name, group1, group2, group3, image, created_at, updated_at, is_deleted, status, country)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
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
          newSchool.status,
          newSchool.country,
        ]
      );

      await this.updatePushChanges(
        TABLES.School,
        MUTATE_TYPES.INSERT,
        newSchool
      );
    }

    // Insert into school_user table
    const schoolUserId = uuidv4();
    const newSchoolUser: TableTypes<"school_user"> = {
      id: schoolUserId,
      school_id: schoolId,
      user_id: _currentUser.id,
      role: RoleType.PRINCIPAL,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
      is_firebase: null,
      is_ops: null,
      ops_created_by: null,
    };

    if (oSchoolUser) {
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
    }
    return newSchool;
  }
  async updateSchoolProfile(
    school: TableTypes<"school">,
    name: string,
    group1: string,
    group2: string,
    group3: string,
    image: File | null,
    group4: string | null,
    program_id: string | null,
    udise: string | null,
    address: string | null
  ): Promise<TableTypes<"school">> {
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw "User is not Logged in";

    const result = image
      ? await this.addProfileImages(school.id, image, PROFILETYPE.SCHOOL)
      : school.image;

    const updatedSchool: TableTypes<"school"> = {
      name: name ?? school.name,
      group1: group1 ?? school.group1,
      group2: group2 ?? school.group2,
      group3: group3 ?? school.group3,
      image: result ?? school.image,
      group4: group4 ?? school.group4,
      updated_at: new Date().toISOString(),
      created_at: school.created_at,
      id: school.id,
      is_deleted: false,
      program_id: program_id ?? null,
      udise: udise ?? null,
      address: address ?? null,
      model: null,
      academic_year: null,
      firebase_id: null,
      is_firebase: null,
      is_ops: null,
      language: null,
      ops_created_by: null,
      student_login_type: null,
      status: null,
      key_contacts: null,
      country: null,
      location_link: null,
    };
    const updatedSchoolQuery = `
    UPDATE school
    SET name = ?, group1 = ?, group2 = ?, group3 = ?, image = ?, updated_at=?
    WHERE id = ?;
    `;

    await this.executeQuery(updatedSchoolQuery, [
      updatedSchool.name,
      updatedSchool.group1,
      updatedSchool.group2,
      updatedSchool.group3,
      updatedSchool.image,
      updatedSchool.updated_at,
      school.id,
    ]);

    this.updatePushChanges(TABLES.School, MUTATE_TYPES.UPDATE, updatedSchool);

    return updatedSchool;
  }

  // add request for creating new school
  async requestNewSchool(
    name: string,
    state: string,
    district: string,
    city: string,
    image: File | null,
    udise_id?: string
  ): Promise<TableTypes<"req_new_school"> | null> {
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw "User is not Logged in";

    // Check if request already exists for the user
    const res = await this.executeQuery(
      `SELECT * FROM req_new_school WHERE user_id = ?`,
      [_currentUser.id]
    );
    const existingRequests = res?.values ?? [];

    if (existingRequests.length > 0) {
      return existingRequests[0];
    }

    const requestId = uuidv4();
    const imageUrl = image
      ? await this.addProfileImages(requestId, image, PROFILETYPE.SCHOOL)
      : null;

    const newRequest: TableTypes<"req_new_school"> = {
      id: requestId,
      user_id: _currentUser.id,
      name,
      state,
      district,
      city,
      image: imageUrl ?? null,
      udise_id: udise_id ?? null,
      is_resolved: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
    };
    await this.executeQuery(
      `INSERT INTO req_new_school (id, user_id, name, state, district, city, image, udise_id, is_resolved, created_at, updated_at, is_deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newRequest.id,
        newRequest.user_id,
        newRequest.name,
        newRequest.state,
        newRequest.district,
        newRequest.city,
        newRequest.image,
        newRequest.udise_id,
        newRequest.is_resolved,
        newRequest.created_at,
        newRequest.updated_at,
        newRequest.is_deleted,
      ]
    );

    await this.updatePushChanges(
      TABLES.ReqNewSchool,
      MUTATE_TYPES.INSERT,
      newRequest
    );

    return newRequest;
  }
  // Add this new function to check if a create school request already exists
  async getExistingSchoolRequest(
    requested_by: string
  ): Promise<TableTypes<"ops_requests"> | null> {
    const query = `
      SELECT *
      FROM ${TABLES.OpsRequests}
      WHERE requested_by = ? AND is_deleted = 0`;
    const res = await this._db?.query(query, [requested_by]);
    return res?.values?.length ? res.values[0] : null;
  }

  async deleteApprovedOpsRequestsForUser(
    requested_by: string,
    school_id?: string,
    class_id?: string
  ): Promise<void> {
    if (!this._db) return;

    let query = `
    UPDATE ${TABLES.OpsRequests}
    SET is_deleted = 1,
        updated_at = ?
    WHERE requested_by = ?
      AND is_deleted = 0
  `;

    const params: any[] = [new Date().toISOString(), requested_by];

    if (school_id) {
      query += ` AND school_id = ?`;
      params.push(school_id);
    }

    if (class_id) {
      query += ` AND class_id = ?`;
      params.push(class_id);
    }

    // Execute the UPDATE
    await this._db.run(query, params);

    // Push sync mutation
    await this.updatePushChanges(TABLES.OpsRequests, MUTATE_TYPES.UPDATE, {
      requested_by,
      school_id: school_id ?? null,
      class_id: class_id ?? null,
      is_deleted: 1,
    });
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
    role: "student",
    studentId: string
  ): Promise<TableTypes<"user">> {
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw "User is not Logged in";

    const userId = uuidv4();
    const newStudent: TableTypes<"user"> = {
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
      firebase_id: null,
      is_firebase: null,
      is_ops: null,
      learning_path: null,
      ops_created_by: null,
      stars: null,
      reward: null,
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
    const newClassUser: TableTypes<"class_user"> = {
      id: classUserId,
      class_id: classId,
      user_id: userId,
      role: role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
      is_firebase: null,
      is_ops: null,
      ops_created_by: null,
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

  // async deleteProfile(studentId: string) {
  //   if (!this._db) return;
  //   try {
  //     const authHandler = ServiceConfig.getI()?.authHandler;
  //     const currentUser = await authHandler?.getCurrentUser();
  //     if (!currentUser) return;
  //     await this._serverApi.deleteProfile(studentId);

  //     const localParentId = currentUser.id;

  //     // Check if the student is connected to any class
  //     const classResult = await this._db.query(
  //       `SELECT class_id FROM class_user WHERE user_id = ? AND is_deleted = 0 LIMIT 1`,
  //       [studentId]
  //     );
  //     const localClassId =
  //       classResult?.values && classResult.values.length > 0
  //         ? classResult.values[0].class_id
  //         : null;
  //     if (localClassId) {
  //       // Remove the student's connection to the class
  //       await this.executeQuery(`DELETE FROM class_user WHERE user_id = ?`, [
  //         studentId,
  //       ]);

  //       // Check if any other child of the parent is connected to the same class
  //       const otherChildrenConnected = await this._db.query(
  //         `
  //         SELECT 1
  //          FROM class_user cu
  //          JOIN parent_user pu ON cu.user_id = pu.student_id
  //          WHERE cu.class_id = ?
  //          AND pu.parent_id = ?
  //          AND pu.student_id != ?
  //          AND cu.is_deleted = 0
  //          AND pu.is_deleted = 0
  //        `,
  //         [localClassId, localParentId, studentId]
  //       );
  //       // If no other child is connected, remove the parent's connection from the class
  //       if (
  //         otherChildrenConnected.values == null ||
  //         otherChildrenConnected.values.length < 1 ||
  //         !otherChildrenConnected.values[0]
  //       ) {
  //         await this.executeQuery(
  //           `
  //         DELETE FROM class_user
  //         WHERE class_id = ?
  //         AND user_id = ?
  //         AND role = 'parent'`,
  //           [localClassId, localParentId]
  //         );
  //       }
  //     }

  //     // Remove the student's connection to the parent and other related records
  //     await this.executeQuery(`DELETE FROM parent_user WHERE student_id = ?`, [
  //       studentId,
  //     ]);
  //     await this.executeQuery(`DELETE FROM user_badge WHERE user_id = ?`, [
  //       studentId,
  //     ]);
  //     await this.executeQuery(`DELETE FROM user_bonus WHERE user_id = ?`, [
  //       studentId,
  //     ]);
  //     await this.executeQuery(`DELETE FROM user_course WHERE user_id = ?`, [
  //       studentId,
  //     ]);
  //     await this.executeQuery(`DELETE FROM user_sticker WHERE user_id = ?`, [
  //       studentId,
  //     ]);
  //     await this.executeQuery(`DELETE FROM assignment_user WHERE user_id = ?`, [
  //       studentId,
  //     ]);
  //     await this.executeQuery(`DELETE FROM favorite_lesson WHERE user_id = ?`, [
  //       studentId,
  //     ]);
  //     await this.executeQuery(`DELETE FROM result WHERE student_id = ?`, [
  //       studentId,
  //     ]);
  //     await this.executeQuery(`DELETE FROM user WHERE id = ?`, [studentId]);
  //   } catch (error) {
  //     console.error("🚀 ~ SqliteApi ~ deleteProfile ~ error:", error);
  //   }
  // }

  async deleteProfile(studentId: string) {
    if (!this._db) return;
    try {
      const authHandler = ServiceConfig.getI()?.authHandler;
      const currentUser = await authHandler?.getCurrentUser();
      if (!currentUser) return;
      await this._serverApi.deleteProfile(studentId);

      const localParentId = currentUser.id;
      const timestamp = new Date().toISOString();

      // Get all class_ids the student is connected to
      const classResults = await this._db.query(
        `SELECT DISTINCT class_id FROM class_user WHERE user_id = ? AND is_deleted = 0`,
        [studentId]
      );

      const classIds: string[] =
        classResults?.values?.map((row) => row.class_id) ?? [];

      for (const classId of classIds) {
        // Soft delete student from class_user
        await this.executeQuery(
          `UPDATE class_user SET is_deleted = 1, updated_at = ? WHERE user_id = ? AND class_id = ? AND is_deleted = 0`,
          [timestamp, studentId, classId]
        );

        // Check if other children of the parent are connected to the same class
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
          [classId, localParentId, studentId]
        );
        // If no other child is connected, remove the parent's connection from the class
        if (
          otherChildrenConnected.values == null ||
          otherChildrenConnected.values.length < 1 ||
          !otherChildrenConnected.values[0]
        ) {
          await this.executeQuery(
            `
          UPDATE class_user
          SET is_deleted = 1,
              updated_at = ?
          WHERE class_id = ? AND user_id = ? AND role = 'parent' AND is_deleted = 0
          `,
            [timestamp, classId, localParentId]
          );
        }
      }

      // Soft delete the parent-student connection
      await this.executeQuery(
        `UPDATE parent_user SET is_deleted = 1, updated_at = ? WHERE student_id = ? AND parent_id = ? AND is_deleted = 0`,
        [timestamp, studentId, localParentId]
      );
    } catch (error) {
      console.error("🚀 ~ SqliteApi ~ deleteProfile ~ error:", error);
    }
  }
  async getCourseByUserGradeId(
    gradeDocId: string | null,
    boardDocId: string | null
  ): Promise<TableTypes<"course">[]> {
    if (!gradeDocId) {
      throw new Error("Grade document ID is required.");
    }

    if (!boardDocId) {
      throw new Error("Board document ID is required.");
    }

    let courseIds: TableTypes<"course">[] = [];
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
      (course: TableTypes<"course">) => {
        return course.curriculum_id === boardDocId;
      }
    );

    curriculumCourses.forEach((course: TableTypes<"course">) => {
      courseIds.push(course);
    });

    let subjectIds: string[] = [];
    curriculumCourses.forEach((course: TableTypes<"course">) => {
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

  async getAllCurriculums(): Promise<TableTypes<"curriculum">[]> {
    const res = await this._db?.query(
      `SELECT * FROM ${TABLES.Curriculum} ORDER BY name ASC`
    );
    console.log("🚀 ~ SqliteApi ~ getAllCurriculums ~ res:", res);
    return res?.values ?? [];
  }
  async getAllGrades(): Promise<TableTypes<"grade">[]> {
    const res = await this._db?.query("select * from " + TABLES.Grade);
    return res?.values ?? [];
  }

  async getGradeById(id: string): Promise<TableTypes<"grade"> | undefined> {
    const res = await this._db?.query(
      `select * from ${TABLES.Grade} where id = "${id}"`
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }
  async getGradesByIds(gradeIds: string[]): Promise<TableTypes<"grade">[]> {
    if (!gradeIds || gradeIds.length === 0) {
      return [];
    }
    // Format the IDs for the SQL query
    const formattedIds = gradeIds.map((id) => `"${id}"`).join(", ");
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
  ): Promise<TableTypes<"curriculum"> | undefined> {
    const res = await this._db?.query(
      `select * from ${TABLES.Curriculum} where id = "${id}"`
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }
  async getCurriculumsByIds(
    ids: string[]
  ): Promise<TableTypes<"curriculum">[]> {
    if (!ids || ids.length === 0) {
      return [];
    }

    // Format the IDs for the SQL query
    const formattedIds = ids.map((id) => `"${id}"`).join(", ");

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

  async getAllLanguages(): Promise<TableTypes<"language">[]> {
    const res = await this._db?.query("select * from " + TABLES.Language);
    console.log("🚀 ~ SqliteApi ~ getAllLanguages ~ res:", res);
    return res?.values ?? [];
  }

  async subscribeToClassTopic(): Promise<void> {
    var students: TableTypes<"user">[] = await this.getParentStudentProfiles();
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

  async getParentStudentProfiles(): Promise<TableTypes<"user">[]> {
    if (!this._db) throw "Db is not initialized";
    const authHandler = ServiceConfig.getI()?.authHandler;
    const currentUser = await authHandler?.getCurrentUser();
    if (!currentUser) throw "User is not Logged in";
    const query = `
  SELECT *
  FROM ${TABLES.ParentUser} AS parent
  JOIN ${TABLES.User} AS student ON parent.student_id = student.id
  WHERE parent.parent_id = "${currentUser.id}" AND parent.is_deleted = 0 AND student.is_deleted = 0;
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

  get currentCourse():
    | Map<string, TableTypes<"course"> | undefined>
    | undefined {
    return this._currentCourse;
  }

  set currentCourse(
    value: Map<string, TableTypes<"course"> | undefined> | undefined
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
    console.log("🚀 ~ SqliteApi ~ updateLanguage ~ res:", res);
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
      `select * from ${TABLES.Lesson} where cocos_lesson_id = "${lessonId}" and is_deleted = 0`
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
    WHERE uc.user_id = "${studentId}" AND uc.is_deleted = 0;
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
      SELECT course.*
      FROM ${TABLES.ClassCourse} AS cc
      JOIN ${TABLES.Course} AS course ON cc.course_id = course.id
      WHERE cc.class_id = ? AND cc.is_deleted = 0
      ORDER BY course.sort_index ASC;
    `;
    const res = await this._db?.query(query, [classId]);
    return res?.values ?? [];
  }

  async getLesson(id: string): Promise<TableTypes<"lesson"> | undefined> {
    const res = await this._db?.query(
      `select * from ${TABLES.Lesson} where id = "${id}" and is_deleted = 0`
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }

  async getChapterById(id: string): Promise<TableTypes<"chapter"> | undefined> {
    const res = await this._db?.query(
      `select * from ${TABLES.Chapter} where id = "${id}" and is_deleted = 0`
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
    WHERE cl.chapter_id = "${chapterId}" AND cl.is_deleted = 0
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
    liveQuizRoomDocId: string
  ): Promise<TableTypes<"live_quiz_room">> {
    const roomData = await this._serverApi.getLiveQuizRoomDoc(
      liveQuizRoomDocId
    );
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
        is_firebase: false,
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
    student: TableTypes<"user">,
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
  ): Promise<TableTypes<"result">> {
    let resultId = uuidv4();

    // Ensure unique ID
    let isDuplicate = true;
    while (isDuplicate) {
      const check = await this.executeQuery(
        `SELECT id FROM result WHERE id = ? LIMIT 1`,
        [resultId]
      );
      if (!check?.values || check.values.length === 0) {
        isDuplicate = false;
      } else {
        resultId = uuidv4(); // now this won't throw error
      }
    }
    const newResult: TableTypes<"result"> = {
      id: resultId,
      assignment_id: assignmentId ?? null,
      correct_moves: correctMoves,
      lesson_id: lessonId,
      school_id: schoolId ?? null,
      score: score,
      student_id: student.id,
      time_spent: timeSpent,
      wrong_moves: wrongMoves,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
      chapter_id: chapterId,
      course_id: courseId ?? null,
      class_id: classId ?? null,
      firebase_id: null,
      is_firebase: null,
    };

    const res = await this.executeQuery(
      `
    INSERT INTO result (id, assignment_id, correct_moves, lesson_id, school_id, score, student_id, time_spent, wrong_moves, created_at, updated_at, is_deleted, course_id, chapter_id , class_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
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
        newResult.class_id,
      ]
    );
    // ⭐ reward update
    const currentUser = await this.getUserByDocId(student.id);
    const rewardLesson = sessionStorage.getItem(REWARD_LESSON);
    let newReward: { reward_id: string; timestamp: string } | null = null;
    let currentUserReward: { reward_id: string; timestamp: string } | null =
      null;

    if (rewardLesson == "true" && currentUser) {
      sessionStorage.removeItem(REWARD_LESSON);

      const todaysReward = await Util.fetchTodaysReward();
      const todaysTimestamp = new Date().toISOString();

      currentUserReward = currentUser.reward
        ? JSON.parse(currentUser.reward as string)
        : null;

      if (todaysReward) {
        const alreadyGiven =
          currentUserReward &&
          currentUserReward.reward_id === todaysReward.id &&
          new Date(currentUserReward.timestamp).toISOString().split("T")[0] ===
            todaysTimestamp.split("T")[0];

        if (!alreadyGiven) {
          newReward = {
            reward_id: todaysReward.id,
            timestamp: todaysTimestamp,
          };
        }
      }
    }
    let starsEarned = 0;
    if (score > 25) starsEarned++;
    if (score > 50) starsEarned++;
    if (score > 75) starsEarned++;

    const allStarsMap = localStorage.getItem(LATEST_STARS);
    const allStars = allStarsMap ? JSON.parse(allStarsMap) : {};
    const currentLocalStars = allStars[student.id] ?? 0;

    allStars[student.id] = currentLocalStars + starsEarned;
    localStorage.setItem(LATEST_STARS, JSON.stringify(allStars));
    let query = `UPDATE ${TABLES.User} SET `;
    let params: any[] = [];

    if (newReward !== null) {
      query += `reward = ?, `;
      params.push(JSON.stringify(newReward));
    }

    query += `stars = COALESCE(stars, 0) + ? WHERE id = ?;`;
    params.push(starsEarned, student.id);

    await this.executeQuery(query, params);

    const updatedStudent = await this.getUserByDocId(student.id);
    if (updatedStudent) {
      updatedStudent.language_id = student.language_id;
      Util.setCurrentStudent(updatedStudent);
    }
    this.updatePushChanges(TABLES.Result, MUTATE_TYPES.INSERT, newResult);
    const pushData: any = {
      id: student.id,
      stars: updatedStudent?.stars,
    };
    if (newReward !== null && currentUser) {
      let userId: string = "anonymous";
      try {
        const data = localStorage.getItem(CURRENT_USER);
        if (data) {
          const userData = JSON.parse(data);
          userId = userData?.user?.id ?? userData?.id ?? "anonymous";
        }
      } catch (error) {
        console.error("Failed to parse CURRENT_USER from localStorage:", error);
      }
      pushData.reward = JSON.stringify(newReward);
      await Util.logEvent(EVENTS.REWARD_COLLECTED, {
        user_id: userId,
        student_id: currentUser.id,
        reward_id: newReward.reward_id,
        prev_reward_id: currentUserReward?.reward_id ?? null,
        timestamp: newReward.timestamp,
        course_id: courseId ?? null,
        chapter_id: chapterId,
        lesson_id: lessonId,
        assignment_id: assignmentId ?? null,
        class_id: classId ?? null,
        school_id: schoolId ?? null,
        score: score,
        stars_earned: starsEarned,
      });
    }
    this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, pushData);
    return newResult;
  }

  async updateUserProfile(
    user: TableTypes<"user">,
    fullName: string,
    email: string,
    phoneNum: string,
    languageDocId: string,
    profilePic: string | undefined,
    options?: {
      age?: string;
      gender?: string;
    }
  ): Promise<TableTypes<"user">> {
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
        updated_at = ?
      WHERE id = ?;
    `;
    const now = new Date().toISOString();
    await this.executeQuery(updateUserQuery, [
      name,
      age,
      gender,
      avatar,
      image ?? null,
      boardDocId ?? null,
      gradeDocId ?? null,
      languageDocId,
      now,
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
    student.curriculum_id = boardDocId ?? null;
    student.grade_id = gradeDocId ?? null;
    student.language_id = languageDocId;
    student.updated_at = now;

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
          const newUserCourse: TableTypes<"user_course"> = {
            course_id: course.id,
            created_at: now,
            id: uuidv4(),
            is_deleted: false,
            updated_at: now,
            user_id: student.id,
            is_firebase: null,
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
      updated_at: now,
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
    student: TableTypes<"user">,
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
  ): Promise<TableTypes<"user">> {
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
      const currentClassIdQuery = `
        SELECT class_id FROM class_user
        WHERE user_id = ? AND is_deleted = 0 AND role = 'student'
        LIMIT 1
      `;
      const currentClassRes = await this.executeQuery(currentClassIdQuery, [
        student.id,
      ]);
      const currentClassId = currentClassRes?.values?.[0]?.class_id;

      if (currentClassId !== newClassId) {
        // Update class_user table to set previous record as deleted
        const currentClassUserId = `SELECT id FROM class_user where user_id =? AND class_id = ? AND is_deleted = 0`;
        var data = await this.executeQuery(currentClassUserId, [
          student.id,
          currentClassId,
        ]);
        const deleteOldClassUserQuery = `
          UPDATE class_user
          SET is_deleted = 1, updated_at = ?
          WHERE id = ? AND is_deleted = 0;
        `;
        const now = new Date().toISOString();
        await this.executeQuery(deleteOldClassUserQuery, [
          now,
          data?.values?.[0]?.id,
        ]);
        // Push changes for the update (marking the old class_user as deleted)
        this.updatePushChanges(TABLES.ClassUser, MUTATE_TYPES.UPDATE, {
          id: data?.values?.[0]?.id,
          is_deleted: true,
          updated_at: now,
        });
        // Create new class_user entry
        const newClassUserId = uuidv4();
        const newClassUser: TableTypes<"class_user"> = {
          id: newClassUserId,
          class_id: newClassId,
          user_id: student.id,
          role: "student",
          created_at: now,
          updated_at: now,
          is_deleted: false,
          is_firebase: null,
          is_ops: null,
          ops_created_by: null,
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
        await this._serverApi.addParentToNewClass(newClassId, student.id);
      }
      return student;
    } catch (error) {
      console.error("Error updating student:", error);
      throw error; // Rethrow error after logging
    }
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
      `select * from ${TABLES.Course} where id = "${id}" and is_deleted = 0`
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }
  async getCourses(courseIds: string[]): Promise<TableTypes<"course">[]> {
    if (!courseIds || courseIds.length === 0) {
      return [];
    }

    // create placeholders (?, ?, ?) based on number of courseIds
    const placeholders = courseIds.map(() => "?").join(",");

    const query = `
      SELECT *
      FROM ${TABLES.Course}
      WHERE id IN (${placeholders})
        AND is_deleted = 0
    `;

    const res = await this._db?.query(query, courseIds);
    return res?.values ?? [];
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
  public async getUserRoleForSchool(
    userId: string,
    schoolId: string
  ): Promise<RoleType | undefined> {
    return await this._serverApi.getUserRoleForSchool(userId, schoolId);
  }

  async isStudentLinked(
    studentId: string,
    fromCache: boolean
  ): Promise<boolean> {
    const res = await this._db?.query(
      `select * from ${TABLES.ClassUser}
      where user_id = "${studentId}"
      and role = "${RoleType.STUDENT}" and is_deleted = 0`
    );
    console.log("🚀 ~ SqliteApi ~ isStudentLinked ~ res:", res);
    if (!res || !res.values || res.values.length < 1) return false;
    return true;
  }
  async getPendingAssignments(
    classId: string,
    studentId: string
  ): Promise<TableTypes<"assignment">[]> {
    const nowIso = new Date().toISOString();

    const query = `
  SELECT a.*
  FROM ${TABLES.Assignment} a
  LEFT JOIN ${TABLES.Assignment_user} au ON a.id = au.assignment_id
  LEFT JOIN result r ON a.id = r.assignment_id AND r.student_id = "${studentId}"
  WHERE a.class_id = '${classId}'
    AND (a.is_class_wise = 1 OR au.user_id = "${studentId}")
    AND r.assignment_id IS NULL
    AND (
      a.ends_at IS NULL OR
      TRIM(a.ends_at) = '' OR
      datetime(a.ends_at) > datetime('${nowIso}')
    )
    AND (
      a.starts_at IS NULL OR
      TRIM(a.starts_at) = '' OR
      datetime(a.starts_at) <= datetime('${nowIso}')
    )
  ORDER BY a.created_at DESC;
`;

    const res = await this._db?.query(query);
    if (!res || !res.values || res.values.length < 1) return [];
    return res.values;
  }

  async getSchoolsForUser(
    userId: string
  ): Promise<{ school: TableTypes<"school">; role: RoleType }[]> {
    const finalData: { school: TableTypes<"school">; role: RoleType }[] = [];
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
          ORDER BY s.name ASC;
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
    ORDER BY s.name ASC;
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
            role: data.role, // "autouser"
          });
        } else {
          // Update role if already exists in finalData
          const existingEntry = finalData.find(
            (entry) => entry.school.id === schoolId
          );
          if (existingEntry) {
            existingEntry.role = data.role; // Override role
          }
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

  async isUserTeacher(userId: string): Promise<boolean> {
    const schools = await this.getSchoolsForUser(userId);
    return schools.length > 0;
  }
  async getClassesForSchool(
    schoolId: string,
    userId: string
  ): Promise<TableTypes<"class">[]> {
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
    const deletedClass = sessionStorage.getItem(DELETED_CLASSES);
    if (deletedClass) {
      const deletedClasses = JSON.parse(deletedClass);
      const filteredClassList = allClassesRes.values.filter(
        (item) => !deletedClasses.includes(item.id)
      );
      return filteredClassList;
    }
    return allClassesRes.values;
  }

  async getCoursesByClassId(
    classId: string
  ): Promise<TableTypes<"class_course">[]> {
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
  ): Promise<TableTypes<"school_course">[]> {
    const query = `
      SELECT *
      FROM ${TABLES.SchoolCourse}
      WHERE school_id = ? AND is_deleted = 0
    `;
    const res = await this._db?.query(query, [schoolId]);
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

      const placeholders = classIds.map(() => "?").join(", ");
      const result = await this.executeQuery(
        `SELECT 1 FROM class_course
         WHERE class_id IN (${placeholders}) AND course_id = ? AND is_deleted = 0
         LIMIT 1`,
        [...classIds, courseId]
      );

      if (!result?.values) return false;
      return result.values.length > 0; // Return true if at least one match is found
    } catch (error) {
      console.error("Error checking course in classes:", error);
      throw error;
    }
  }

  async removeCoursesFromClass(ids: string[]): Promise<void> {
    try {
      if (ids.length === 0) {
        console.warn("No course IDs provided for removal.");
        return;
      }

      const placeholders = ids.map(() => "?").join(", ");
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
      console.error("Error removing courses from class_course", error);
    }
  }
  async removeCoursesFromSchool(ids: string[]): Promise<void> {
    try {
      if (ids.length === 0) {
        console.warn("No course IDs provided for removal.");
        return;
      }

      const placeholders = ids.map(() => "?").join(", ");
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
      console.error("Error removing courses from school_course", error);
    }
  }
  async deleteUserFromClass(userId: string, class_id: string): Promise<void> {
    const updatedAt = new Date().toISOString();
    try {
      await this.executeQuery(
        `UPDATE class_user SET is_deleted = 1, updated_at = ? WHERE user_id = ? AND class_id = ? AND is_deleted = 0`,
        [updatedAt, userId, class_id]
      );
      const query = `
      SELECT *
      FROM ${TABLES.ClassUser}
      WHERE user_id = ? AND class_id = ? AND updated_at = ? AND is_deleted = 1`;
      const res = await this._db?.query(query, [userId, class_id, updatedAt]);
      let userData;
      if (res && res.values && res.values.length > 0) {
        userData = res.values[0];
      }
      this.updatePushChanges(TABLES.ClassUser, MUTATE_TYPES.UPDATE, {
        id: userData.id,
        is_deleted: true,
        updated_at: updatedAt,
      });

      await this.executeQuery(
        `UPDATE ops_requests SET is_deleted = 1, updated_at = ? WHERE requested_by = ? AND class_id = ? AND is_deleted = 0`,
        [updatedAt, userId, class_id]
      );
      const query1 = `
      SELECT *
      FROM ${TABLES.OpsRequests}
      WHERE requested_by = ? AND class_id = ? AND updated_at = ? AND is_deleted = 1`;
      const res1 = await this._db?.query(query1, [userId, class_id, updatedAt]);
      let userData1;
      if (res1 && res1.values && res1.values.length > 0) {
        userData1 = res1.values[0];
      }
      this.updatePushChanges(TABLES.OpsRequests, MUTATE_TYPES.UPDATE, {
        id: userData1.id,
        is_deleted: true,
        updated_at: updatedAt,
      });
    } catch (error) {
      console.error("Error deleting user from class_user", error);
    }
  }

  async getStudentsForClass(classId: string): Promise<TableTypes<"user">[]> {
    const query = `
      SELECT user.*
      FROM ${TABLES.ClassUser} AS cu
      JOIN ${TABLES.User} AS user ON cu.user_id = user.id
      WHERE cu.class_id = ?
        AND cu.role = ?
        AND cu.is_deleted = 0
        ORDER BY name ASC ;
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
    className: string,
    groupId?: string
  ): Promise<TableTypes<"class">> {
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw "User is not Logged in";

    const classId = uuidv4();
    const newClass: TableTypes<"class"> = {
      id: classId,
      name: className,
      image: null,
      school_id: schoolId,
      group_id: groupId ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),

      is_deleted: false,
      academic_year: null,
      firebase_id: null,
      is_firebase: null,
      is_ops: null,
      ops_created_by: null,
      standard: null,
      status: null,
    };

    await this.executeQuery(
      `
      INSERT INTO class (id, name , image, school_id, created_at, updated_at, is_deleted, group_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `,
      [
        newClass.id,
        newClass.name,
        newClass.image,
        newClass.school_id,
        newClass.created_at,
        newClass.updated_at,
        newClass.is_deleted,
        newClass.group_id,
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
    } catch (error) {
      console.error("Failed to delete class:", error);
      throw error;
    }
  }
  async updateClass(classId: string, className: string, groupId?: string) {
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw "User is not Logged in";

    let updatedClassQuery = `UPDATE class SET name = "${className}"`;
    if (groupId !== undefined) {
      updatedClassQuery += `, group_id = "${groupId}"`;
    }
    updatedClassQuery += ` WHERE id = "${classId}";`;

    const res = await this.executeQuery(updatedClassQuery);
    console.log("🚀 ~ SqliteApi ~ updateClass ~ res:", res);

    // Include group_id in push only if provided
    const updatedData: any = { id: classId, name: className };
    if (groupId !== undefined) updatedData.group_id = groupId;

    this.updatePushChanges(TABLES.Class, MUTATE_TYPES.UPDATE, updatedData);
  }
  async linkStudent(inviteCode: number, studentId: string): Promise<any> {
    let linkData = await this._serverApi.linkStudent(inviteCode, studentId);
    await this.syncDbNow(Object.values(TABLES), [
      TABLES.Assignment,
      TABLES.Class,
      TABLES.School,
      TABLES.ClassCourse,
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
        SELECT 'allTime' as type, res.student_id, name,
               count(res.id) as lessons_played,
               sum(score) as total_score,
               sum(time_spent) as total_time_spent
        FROM ${TABLES.Result} res
        JOIN ${TABLES.User} u ON u.id = res.student_id
        WHERE res.student_id = '${studentId}'
        GROUP BY res.student_id, u.name
        UNION ALL
        SELECT 'monthly' as type, res.student_id, u.name,
               count(res.id) as lessons_played,
               sum(score) as total_score,
               sum(time_spent) as total_time_spent
        FROM ${TABLES.Result} res
        JOIN ${TABLES.User} u ON u.id = res.student_id
        WHERE res.student_id = '${studentId}'
        AND strftime('%m', res.created_at) = strftime('%m', datetime('now'))
        GROUP BY res.student_id, u.name
        UNION ALL
        SELECT 'weekly' as type, res.student_id, u.name,
               count(res.id) as lessons_played,
               sum(score) as total_score,
               sum(time_spent) as total_time_spent
        FROM ${TABLES.Result} res
        JOIN ${TABLES.User} u ON u.id = res.student_id
        WHERE res.student_id = '${studentId}'
        AND strftime('%W', res.created_at) = strftime('%W', datetime('now'))
        GROUP BY res.student_id, u.name
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

  async getLessonFromChapter(
    chapterId: string,
    lessonId: string
  ): Promise<{
    lesson: TableTypes<"lesson">[];
    course: TableTypes<"course">[];
  }> {
    const data: {
      lesson: TableTypes<"lesson">[];
      course: TableTypes<"course">[];
    } = {
      lesson: [],
      course: [],
    };
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
    WHERE c.id='${chapterId}' and c.is_deleted = 0 and l.id = '${lessonId}' and l.is_deleted = 0
    `;
    const res = await this._db?.query(query);
    if (!res || !res.values || res.values.length < 1) return data;
    data.lesson = res.values;
    data.course = res.values.map((val) => JSON.parse(val.course));
    return data;
  }

  async getCoursesByGrade(gradeDocId: any): Promise<TableTypes<"course">[]> {
    try {
      const gradeCoursesRes = await this._db?.query(
        `SELECT * FROM ${TABLES.Course} WHERE grade_id = "${gradeDocId}" AND is_deleted = 0`
      );

      const puzzleCoursesRes = await this._db?.query(
        `SELECT * FROM ${TABLES.Course} WHERE name = "Digital Skills"  AND is_deleted = 0`
      );

      const courses = [
        ...(gradeCoursesRes?.values ?? []),
        ...(puzzleCoursesRes?.values ?? []),
      ];
      return courses;
    } catch (error) {
      console.error("Error fetching courses by grade:", error);
      return [];
    }
  }

  async getAllCourses(): Promise<TableTypes<"course">[]> {
    const res = await this._db?.query(
      `select * from ${TABLES.Course} ORDER BY sort_index ASC`
    );
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
    WHERE l.id = '${lessonId} and l.is_deleted = 0'
    `;
    const res = await this._db?.query(query);
    return res?.values ?? [];
  }
  async assignmentListner(
    studentId: string,
    onDataChange: (assignment: TableTypes<"assignment"> | undefined) => void
  ) {
    const handleDataChange = async (
      assignmet: TableTypes<"assignment"> | undefined
    ) => {
      if (assignmet) {
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
        onDataChange(assignmet);
      }
    };
    return await this._serverApi.assignmentListner(studentId, handleDataChange);
  }

  async removeAssignmentChannel() {
    return await this._serverApi.removeAssignmentChannel();
  }
  async assignmentUserListner(
    studentId: string,
    onDataChange: (
      assignment_user: TableTypes<"assignment_user"> | undefined
    ) => void
  ) {
    const handleDataChange = async (
      assignment_user: TableTypes<"assignment_user"> | undefined
    ) => {
      if (assignment_user) {
        await this.executeQuery(
          `
          INSERT INTO assignment_user (id, assignment_id, user_id, created_at, updated_at, is_deleted)
          VALUES (?, ?, ?, ?, ?, ?);
          `,
          [
            assignment_user.id,
            assignment_user.assignment_id,
            assignment_user.user_id,
            assignment_user.created_at,
            assignment_user.updated_at,
            assignment_user.is_deleted,
          ]
        );
        onDataChange(assignment_user);
      }
    };

    return await this._serverApi.assignmentUserListner(
      studentId,
      handleDataChange
    );
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
  async removeLiveQuizChannel() {
    return await this._serverApi.removeLiveQuizChannel();
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
  async getStudentResultsByAssignmentId(assignmentId: string): Promise<
    {
      result_data: TableTypes<"result">[];
      user_data: TableTypes<"user">[];
    }[]
  > {
    const res = await this._serverApi.getStudentResultsByAssignmentId(
      assignmentId
    );
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

  async addCourseForParentsStudent(
    courses: TableTypes<"course">[],
    student: TableTypes<"user">
  ) {
    const courseIds = courses?.map((course) => course.id);
    for (const courseId of courseIds) {
      const newUserCourse: TableTypes<"user_course"> = {
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
        [newUserCourse.id, newUserCourse.user_id, newUserCourse.course_id]
      );
      this.updatePushChanges(
        TABLES.UserCourse,
        MUTATE_TYPES.INSERT,
        newUserCourse
      );
    }
  }

  updateRewardsForStudent(studentId: string, unlockReward: LeaderboardRewards) {
    throw new Error("Method not implemented.");
  }

  async getChaptersForCourse(
    courseId: string
  ): Promise<TableTypes<"chapter">[]> {
    const query = `
    SELECT * FROM ${TABLES.Chapter}
    WHERE course_id = "${courseId}" AND is_deleted = 0
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
      ORDER BY fl.created_at DESC
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
      where c.is_deleted = 0 and user_id = "${userId}" and role = "${RoleType.STUDENT}" and cu.is_deleted = 0 order by cu.updated_at desc`
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
    await this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, {
      fcm_token: token,
      id: userId,
    });
  }

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
    type: string,
    batch_id: string,
    source: string | null,
    created_at?: string
  ): Promise<void> {
    const assignmentUUid = uuidv4();
    const timestamp = new Date().toISOString(); // Cache timestamp for reuse

    try {
      // Insert into assignment table
      await this.executeQuery(
        `INSERT INTO assignment
          (id, created_by, starts_at, ends_at, is_class_wise, class_id, school_id, lesson_id, type, created_at, updated_at, is_deleted, chapter_id, course_id, source, batch_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
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
          created_at ?? timestamp,
          timestamp,
          false,
          chapter_id,
          course_id,
          source ?? null,
          batch_id,
        ]
      );

      // Prepare assignment data for push changes
      const assignment_data: TableTypes<"assignment"> = {
        id: assignmentUUid,
        created_by: userId,
        starts_at: starts_at,
        ends_at: ends_at,
        is_class_wise: is_class_wise,
        class_id: class_id,
        school_id: school_id,
        lesson_id: lesson_id,
        type: type,
        created_at: created_at ?? timestamp,
        updated_at: timestamp,
        is_deleted: false,
        chapter_id: chapter_id,
        course_id: course_id,
        batch_id: batch_id ?? null,
        source: source ?? null,
        firebase_id: null,
        is_firebase: null,
      };

      this.updatePushChanges(
        TABLES.Assignment,
        MUTATE_TYPES.INSERT,
        assignment_data
      );

      // If the assignment is not class-wide, assign it to individual students

      if (!is_class_wise && student_list.length > 0) {
        for (const student of student_list) {
          const assignment_user_UUid = uuidv4();
          const newAssignmentUser: TableTypes<"assignment_user"> = {
            assignment_id: assignmentUUid,
            created_at: new Date().toISOString(),
            id: assignment_user_UUid,
            is_deleted: false,
            updated_at: new Date().toISOString(),
            user_id: student,
            is_firebase: null,
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
          this.updatePushChanges(
            TABLES.Assignment_user,
            MUTATE_TYPES.INSERT,
            newAssignmentUser
          );
        }
      }
    } catch (error) {
      console.error("Error in createAssignment:", error);
    }
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
    await this.updatePushChanges(TABLES.User, MUTATE_TYPES.INSERT, user);

    return user;
  }

  async syncDB(
    tableNames: TABLES[] = Object.values(TABLES),
    refreshTables: TABLES[] = [],
    isFirstSync?: boolean
  ): Promise<boolean> {
    try {
      await this.syncDbNow(tableNames, refreshTables, isFirstSync);
      return true;
    } catch (error) {
      console.error("🚀 ~ SqliteApi ~ syncDB ~ error:", error);
      return false;
    }
  }
  async getUserAssignmentCart(
    userId: string
  ): Promise<TableTypes<"assignment_cart"> | undefined> {
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
  async getRecommendedLessons(
    studentId: string,
    classId?: string
  ): Promise<TableTypes<"lesson">[]> {
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
    let listOfLessons = res.values as TableTypes<"lesson">[];
    return listOfLessons;
  }

  async searchLessons(searchString: string): Promise<TableTypes<"lesson">[]> {
    if (!this._db) return [];
    const res: TableTypes<"lesson">[] = [];

    try {
      const serverResults = await this._serverApi.searchLessons(searchString);
      res.push(...serverResults);
    } catch (error) {
      console.error("🚀 ~ SqliteApi ~ searchLessons ~ error:", error);
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

  async getChapterByLesson(
    lessonId: string,
    classId?: string,
    userId?: string
  ): Promise<String | undefined> {
    try {
      const class_course = classId
        ? await this.getCoursesForClassStudent(classId)
        : await this.getCoursesForParentsStudent(userId ?? "");
      const res = await this._db?.query(
        `SELECT cl.lesson_id, c.course_id ,cl.chapter_id
         FROM ${TABLES.ChapterLesson} cl
         JOIN ${TABLES.Chapter} c ON cl.chapter_id = c.id
         WHERE cl.lesson_id = "${lessonId}" AND cl.is_deleted = 0`
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
      console.error("Error fetching chapter by IDs:", error);
      return;
    }
  }

  async getResultByAssignmentIds(
    assignmentIds: string[] // Expect an array of strings
  ): Promise<TableTypes<"result">[] | undefined> {
    if (!assignmentIds || assignmentIds.length === 0) return;

    const placeholders = assignmentIds.map(() => "?").join(", ");
    const query = `SELECT *
      FROM ${TABLES.Result}
      WHERE assignment_id IN (${placeholders});`;

    const res = await this._db?.query(query, assignmentIds);

    if (!res || !res.values || res.values.length < 1) return;
    return res.values;
  }

  async getResultByAssignmentIdsForCurrentClassMembers(
    assignmentIds: string[],
    classId: string
  ): Promise<TableTypes<"result">[] | undefined> {
    if (!assignmentIds || assignmentIds.length === 0) return;

    const placeholders = assignmentIds.map(() => "?").join(", ");
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
    assignmentIds: string[]
  ): Promise<TableTypes<"assignment_user">[]> {
    // If there are no assignment IDs, return an empty array immediately.
    if (!assignmentIds || assignmentIds.length === 0) {
      return [];
    }

    // Create a comma-separated list of placeholders for the query.
    const placeholders = assignmentIds.map(() => "?").join(", ");

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
    lessonIds: string[] // Expect an array of strings
  ): Promise<TableTypes<"lesson">[] | undefined> {
    if (!lessonIds || lessonIds.length === 0) return;

    const placeholders = lessonIds.map(() => "?").join(", ");
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
    classId
  ): Promise<TableTypes<"result">[]> {
    const assignmentholders = assignmentIds.map(() => "?").join(", ");
    const courseholders = courseIds.map(() => "?").join(", ");
    const res = await this._db?.query(
      `WITH null_assignments AS (
     SELECT *
     FROM ${TABLES.Result}
     WHERE student_id = ?
     AND course_id IN (${courseholders})
     AND class_id = ?
     AND assignment_id IS NULL
     AND is_deleted = false
     ORDER BY created_at DESC
     LIMIT 5
   ),
   non_null_assignments AS (
     SELECT *
     FROM ${TABLES.Result}
     WHERE student_id = ?
     AND course_id IN (${courseholders})
     AND class_id = ?
     AND assignment_id IN (${assignmentholders})
     AND is_deleted = false
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
      [
        studentId,
        ...courseIds,
        classId,
        studentId,
        ...courseIds,
        classId,
        ...assignmentIds,
      ]
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
    allAssignments: boolean
  ): Promise<TableTypes<"assignment">[] | undefined> {
    const courseholders = courseIds.map(() => "?").join(", ");
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
    classId: string
  ): Promise<TableTypes<"result">[] | undefined> {
    const courseholders = courseIds.map(() => "?").join(", ");

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

  async getLastAssignmentsForRecommendations(
    classId: string
  ): Promise<TableTypes<"assignment">[] | undefined> {
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
  async getTeachersForClass(
    classId: string
  ): Promise<TableTypes<"user">[] | undefined> {
    const query = `
    SELECT user.*
    FROM ${TABLES.ClassUser} AS cu
    JOIN ${TABLES.User} AS user ON cu.user_id= user.id
    WHERE cu.class_id = "${classId}" and cu.role = '${RoleType.TEACHER}' and cu.is_deleted = false;
  `;
    const res = await this._db?.query(query);
    return res?.values ?? [];
  }
  async getUserByEmail(email: string): Promise<TableTypes<"user"> | undefined> {
    return this._serverApi.getUserByEmail(email);
  }
  async getUserByPhoneNumber(
    phone: string
  ): Promise<TableTypes<"user"> | undefined> {
    return this._serverApi.getUserByPhoneNumber(phone);
  }
  async addTeacherToClass(
    schoolId: string,
    classId: string,
    user: TableTypes<"user">
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
      ]
    );

    await this.updatePushChanges(
      TABLES.ClassUser,
      MUTATE_TYPES.INSERT,
      classUser
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
        ]
      );
    }
  }

  async checkUserIsManagerOrDirector(
    schoolId: string,
    userId: string
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
      ]
    );

    if (result?.values && result.values.length > 0) {
      return true;
    }
    return false;
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
    const placeholders = classIds.map(() => "?").join(", ");
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
  async checkTeacherExistInClass(
    schoolId: string,
    classId: string,
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
    // Step 2: Check if the user is a teacher in this class
    const result = await this.executeQuery(
      `SELECT * FROM class_user
      WHERE class_id = ?
      AND user_id = ?
      AND role = ?
      AND is_deleted = false`,
      [classId, userId, RoleType.TEACHER]
    );
    return !!(result?.values && result.values.length > 0);
  }

  async getAssignmentsByAssignerAndClass(
    userId: string,
    classId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    classWiseAssignments: TableTypes<"assignment">[];
    individualAssignments: TableTypes<"assignment">[];
  }> {
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
      (assignment) => assignment.is_class_wise === 1
    );
    const individualAssignments = assignments.filter(
      (assignment) => assignment.is_class_wise === 0
    );

    return { classWiseAssignments, individualAssignments };
  }

  async getTeacherJoinedDate(
    userId: string,
    classId: string
  ): Promise<TableTypes<"class_user"> | undefined> {
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
      console.error("Error fetching teacher joined date:", error);
    }

    return undefined;
  }
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

      return userIds ?? [];
    } catch (error) {
      console.error("Error fetching user IDs:", error);
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
      } else {
        throw new Error("Teacher not found after update.");
      }

      await this.updatePushChanges(TABLES.ClassUser, MUTATE_TYPES.UPDATE, {
        id: userData.id,
        is_deleted: true,
      });
    } catch (error) {
      console.error("🚀 ~ SqliteApi ~ deleteTeacher ~ error:", error);
    }
  }
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
      console.error("Error executing query:", error); // Log any errors
      return;
    }
  }

  async createClassCode(classId: string): Promise<number> {
    if (!classId) {
      throw new Error("Class ID is required to create a class code.");
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
  async getResultByChapterByDate(
    chapter_id: string,
    course_id: string,
    startDate: string,
    endDate: string,
    classId: string
  ): Promise<TableTypes<"result">[] | undefined> {
    const query = `SELECT *
       FROM ${TABLES.Result}
       WHERE chapter_id = '${chapter_id}'
       AND course_id = '${course_id}'
       AND class_id ='${classId}'
       AND created_at BETWEEN '${startDate}' AND '${endDate}'
       ORDER BY created_at DESC;`;

    const res = await this._db?.query(query);

    if (!res || !res.values || res.values.length < 1) return;
    return res.values;
  }

  async getSchoolsWithRoleAutouser(
    schoolIds: string[]
  ): Promise<TableTypes<"school">[] | undefined> {
    // Escape schoolIds array for use in the SQL query
    const placeholders = schoolIds.map(() => "?").join(", "); // Generates ?, ?, ? for query placeholders
    const query = `
      SELECT DISTINCT school.*
      FROM ${TABLES.SchoolUser} AS su
      JOIN ${TABLES.School} AS school ON su.school_id = school.id
      WHERE su.school_id IN (${placeholders})
        AND su.role = '${RoleType.AUTOUSER}'
        AND su.is_deleted = false;
    `;

    const res = await this._db?.query(query, schoolIds);
    return res?.values ?? [];
  }
  async getPrincipalsForSchool(
    schoolId: string
  ): Promise<TableTypes<"user">[] | undefined> {
    const query = `
    SELECT user.*
    FROM ${TABLES.SchoolUser} AS su
    JOIN ${TABLES.User} AS user ON su.user_id= user.id
    WHERE su.school_id = "${schoolId}" and su.role = '${RoleType.PRINCIPAL}' and su.is_deleted = false;
  `;
    const res = await this._db?.query(query);
    return res?.values ?? [];
  }

  async getPrincipalsForSchoolPaginated(
    schoolId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PrincipalAPIResponse> {
    if (!this._db) {
      console.warn("SQLite DB not initialized.");
      return { data: [], total: 0 };
    }

    // Define the common WHERE clause conditions for both queries
    const whereConditions = `
    su.school_id = ? 
    AND su.role = ? 
    AND su.is_deleted = false
  `;
    const queryParams = [schoolId, RoleType.PRINCIPAL];

    // --- Step 1: Get the TOTAL COUNT of all principals in one efficient query ---
    const countQuery = `
    SELECT COUNT(user.id) as total
    FROM ${TABLES.SchoolUser} AS su
    JOIN ${TABLES.User} AS user ON su.user_id = user.id
    WHERE ${whereConditions};
  `;
    const countRes = await this._db.query(countQuery, queryParams);
    const totalCount = countRes?.values?.[0]?.total ?? 0;

    // If there are no principals, we can stop here.
    if (totalCount === 0) {
      return { data: [], total: 0 };
    }

    // --- Step 2: Get the PAGINATED data for the current page ---
    const offset = (page - 1) * limit;
    const dataQuery = `
    SELECT user.*
    FROM ${TABLES.SchoolUser} AS su
    JOIN ${TABLES.User} AS user ON su.user_id = user.id
    WHERE ${whereConditions}
    ORDER BY user.created_at ASC
    LIMIT ? OFFSET ?;
  `;

    // Add the LIMIT and OFFSET parameters to our query parameter array
    const dataRes = await this._db.query(dataQuery, [
      ...queryParams,
      limit,
      offset,
    ]);

    // The result is already in the correct format, so we can cast it directly.
    const principals: PrincipalInfo[] =
      (dataRes?.values as PrincipalInfo[]) ?? [];

    // --- Step 3: Return the final object matching the PrincipalAPIResponse shape ---
    return {
      data: principals,
      total: totalCount,
    };
  }
  async getClassesBySchoolId(schoolId: string): Promise<TableTypes<"class">[]> {
    const query = `
    SELECT *
    FROM ${TABLES.Class}
    WHERE school_id = ?
      AND is_deleted = false;
  `;

    const res = await this._db?.query(query, [schoolId]);

    return res?.values ?? [];
  }
  async getCoordinatorsForSchool(
    schoolId: string
  ): Promise<TableTypes<"user">[] | undefined> {
    const query = `
    SELECT user.*
    FROM ${TABLES.SchoolUser} AS su
    JOIN ${TABLES.User} AS user ON su.user_id= user.id
    WHERE su.school_id = "${schoolId}" and su.role = '${RoleType.COORDINATOR}' and su.is_deleted = false;
  `;
    const res = await this._db?.query(query);
    return res?.values ?? [];
  }

  async getCoordinatorsForSchoolPaginated(
    schoolId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<CoordinatorAPIResponse> {
    if (!this._db) {
      console.warn("SQLite DB not initialized.");
      return { data: [], total: 0 };
    }

    // Define the common WHERE clause conditions and parameters for both queries
    const whereConditions = `
    su.school_id = ? 
    AND su.role = ? 
    AND su.is_deleted = false
  `;
    const queryParams = [schoolId, RoleType.COORDINATOR];
    // --- Step 1: Get the TOTAL COUNT of all coordinators in one efficient query ---
    const countQuery = `
    SELECT COUNT(user.id) as total
    FROM ${TABLES.SchoolUser} AS su
    JOIN ${TABLES.User} AS user ON su.user_id = user.id
    WHERE ${whereConditions};
  `;
    const countRes = await this._db.query(countQuery, queryParams);
    const totalCount = countRes?.values?.[0]?.total ?? 0;

    // If there are no coordinators, we can stop here.
    if (totalCount === 0) {
      return { data: [], total: 0 };
    }

    // --- Step 2: Get the PAGINATED data for the current page ---
    const offset = (page - 1) * limit;
    const dataQuery = `
    SELECT user.*
    FROM ${TABLES.SchoolUser} AS su
    JOIN ${TABLES.User} AS user ON su.user_id = user.id
    WHERE ${whereConditions}
    ORDER BY user.created_at ASC
    LIMIT ? OFFSET ?;
  `;

    // Add the LIMIT and OFFSET parameters to our query parameter array
    const dataRes = await this._db.query(dataQuery, [
      ...queryParams,
      limit,
      offset,
    ]);

    // The result is already in the correct format, so we can cast it directly.
    const coordinators: CoordinatorInfo[] =
      (dataRes?.values as CoordinatorInfo[]) ?? [];

    // --- Step 3: Return the final object matching the CoordinatorAPIResponse shape ---
    return {
      data: coordinators,
      total: totalCount,
    };
  }
  async getSponsorsForSchool(
    schoolId: string
  ): Promise<TableTypes<"user">[] | undefined> {
    const query = `
    SELECT user.*
    FROM ${TABLES.SchoolUser} AS su
    JOIN ${TABLES.User} AS user ON su.user_id= user.id
    WHERE su.school_id = "${schoolId}" and su.role = '${RoleType.SPONSOR}' and su.is_deleted = false;
  `;
    const res = await this._db?.query(query);
    return res?.values ?? [];
  }
  async addUserToSchool(
    schoolId: string,
    user: TableTypes<"user">,
    role: RoleType
  ): Promise<void> {
    const schoolUserId = uuidv4();
    const schoolUser = {
      id: schoolUserId,
      school_id: schoolId,
      user_id: user.id,
      role: role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
    };

    // Check if a duplicate already exists
    const existing = await this.executeQuery(
      `
      SELECT 1 FROM school_user
      WHERE school_id = ? AND user_id = ? AND role = ? AND is_deleted = ?
      LIMIT 1
      `,
      [
        schoolUser.school_id,
        schoolUser.user_id,
        schoolUser.role,
        schoolUser.is_deleted,
      ]
    );

    // Only insert if not exists
    if (!existing || !existing.values || existing.values.length === 0) {
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
    }

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
        ]
      );
    }
  }
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
      const updatedAt = new Date().toISOString();

      await this.executeQuery(
        `UPDATE school_user SET is_deleted = 1 , updated_at = ? WHERE user_id = ?
        AND school_id = ? AND role = '${role}' AND is_deleted = 0`,
        [updatedAt, userId, schoolId]
      );

      let userData;
      if (res && res.values && res.values.length > 0) {
        userData = res.values[0];
      } else {
        throw new Error("school user not found after update.");
      }
      await this.updatePushChanges(TABLES.SchoolUser, MUTATE_TYPES.UPDATE, {
        id: userData.id,
        is_deleted: true,
      });
    } catch (error) {
      console.error("🚀 ~ SqliteApi ~ deleteUserFromSchool ~ error:", error);
    }
  }
  async updateSchoolLastModified(schoolId: string): Promise<void> {
    const updatedAt = new Date().toISOString();
    await this.executeQuery(`UPDATE school SET updated_at = ? WHERE id = ?;`, [
      updatedAt,
      schoolId,
    ]);
    this.updatePushChanges(TABLES.School, MUTATE_TYPES.UPDATE, {
      id: schoolId,
      updated_at: updatedAt,
    });
  }

  async updateClassLastModified(classId: string): Promise<void> {
    const updatedAt = new Date().toISOString();
    await this.executeQuery(`UPDATE class SET updated_at = ? WHERE id = ?;`, [
      updatedAt,
      classId,
    ]);
    this.updatePushChanges(TABLES.Class, MUTATE_TYPES.UPDATE, {
      id: classId,
      updated_at: updatedAt,
    });
  }

  async updateUserLastModified(userId: string): Promise<void> {
    const updatedAt = new Date().toISOString();
    await this.executeQuery(`UPDATE user SET updated_at = ? WHERE id = ?;`, [
      updatedAt,
      userId,
    ]);
    this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, {
      id: userId,
      updated_at: updatedAt,
    });
  }
  async validateParentAndStudentInClass(
    phoneNumber: string,
    studentName: string,
    className: string,
    schoolId: string
  ): Promise<{ status: string; errors?: string[]; message?: string }> {
    const validatedData = await this._serverApi.validateParentAndStudentInClass(
      schoolId,
      studentName,
      className,
      phoneNumber
    );
    if (validatedData.status === "error") {
      const errors = validatedData.errors?.map((err: any) =>
        typeof err === "string" ? err : err.message || JSON.stringify(err)
      );
      return { status: "error", errors };
    }

    return { status: "success" };
  }
  async validateSchoolUdiseCode(
    schoolId: string
  ): Promise<{ status: string; errors?: string[] }> {
    const validatedData = await this._serverApi.validateSchoolUdiseCode(
      schoolId
    );
    if (validatedData.status === "error") {
      const errors = validatedData.errors?.map((err: any) =>
        typeof err === "string" ? err : err.message || JSON.stringify(err)
      );
      return { status: "error", errors };
    }

    return { status: "success" };
  }
  async validateProgramName(
    programName: string
  ): Promise<{ status: string; errors?: string[] }> {
    const validatedData = await this._serverApi.validateProgramName(
      programName
    );
    if (validatedData.status === "error") {
      const errors = validatedData.errors?.map((err: any) =>
        typeof err === "string" ? err : err.message || JSON.stringify(err)
      );
      return { status: "error", errors };
    }

    return { status: "success" };
  }
  async validateClassNameWithSchoolID(
    schoolId: string,
    className: string
  ): Promise<{ status: string; errors?: string[] }> {
    const validatedData = await this._serverApi.validateClassNameWithSchoolID(
      schoolId,
      className
    );
    if (validatedData.status === "error") {
      const errors = validatedData.errors?.map((err: any) =>
        typeof err === "string" ? err : err.message || JSON.stringify(err)
      );
      return { status: "error", errors };
    }

    return { status: "success" };
  }

  async validateStudentInClassWithoutPhone(
    studentName: string,
    className: string,
    schoolId: string
  ): Promise<{ status: string; errors?: string[]; message?: string }> {
    const validatedData =
      await this._serverApi.validateStudentInClassWithoutPhone(
        studentName,
        className,
        schoolId
      );
    if (validatedData.status === "error") {
      const errors = validatedData.errors?.map((err: any) =>
        typeof err === "string" ? err : err.message || JSON.stringify(err)
      );
      return { status: "error", errors };
    }

    return { status: "success" };
  }

  async validateSchoolData(
    schoolId: string,
    schoolName: string
  ): Promise<{ status: string; errors?: string[] }> {
    const schoolData = await this._serverApi.validateSchoolData(
      schoolId,
      schoolName
    );
    if (schoolData.status === "error") {
      return { status: "error", errors: schoolData.errors };
    }
    return { status: "success" };
  }

  async validateClassCurriculumAndSubject(
    curriculumName: string,
    subjectName: string,
    gradeName: string
  ): Promise<{ status: string; errors?: string[] }> {
    const ClassCurriculum =
      await this._serverApi.validateClassCurriculumAndSubject(
        curriculumName,
        subjectName,
        gradeName
      );
    if (ClassCurriculum.status === "error") {
      return {
        status: "error",
        errors: ClassCurriculum.errors || ["Invalid class curriculum"],
      };
    }
    return { status: "success" };
  }

  async validateUserContacts(
    programManagerPhone: string,
    fieldCoordinatorPhone?: string
  ): Promise<{ status: string; errors?: string[] }> {
    const response = await this._serverApi.validateUserContacts(
      programManagerPhone,
      fieldCoordinatorPhone
    );
    if (response.status === "error") {
      return {
        status: "error",
        errors: response.errors || ["Invalid user contacts"],
      };
    }
    return { status: "success" };
  }
  async setStarsForStudents(
    studentId: string,
    starsCount: number
  ): Promise<void> {
    if (!studentId) return;
    try {
      const be = await this.getUserByDocId(studentId);
      const allStarsMap = localStorage.getItem(LATEST_STARS);
      const allStars = allStarsMap ? JSON.parse(allStarsMap) : {};
      const currentLocalStars = allStars[studentId] ?? 0;

      allStars[studentId] = currentLocalStars + starsCount;
      localStorage.setItem(LATEST_STARS, JSON.stringify(allStars));

      await this.executeQuery(
        `UPDATE ${TABLES.User} SET stars = COALESCE(stars, 0) + ? WHERE id = ?;`,
        [starsCount, studentId]
      );

      const updatedStudent = await this.getUserByDocId(studentId);
      this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, {
        id: studentId,
        stars: updatedStudent?.stars,
      });
    } catch (error) {
      console.error("Error setting stars for student:", error);
    }
  }
  async getCoursesForPathway(
    studentId: string
  ): Promise<TableTypes<"course">[]> {
    const query = `
      SELECT *
      FROM ${TABLES.UserCourse} AS uc
      JOIN ${TABLES.Course} AS course ON uc.course_id = course.id
      WHERE uc.user_id = "${studentId}"  AND uc.is_deleted = 0
      ORDER BY course.sort_index ASC;
    `;
    const res = await this._db?.query(query);
    return res?.values ?? [];
  }
  async updateLearningPath(
    student: TableTypes<"user">,
    learningPath: string
  ): Promise<TableTypes<"user">> {
    try {
      const updateUserQuery = `UPDATE ${TABLES.User}
      SET learning_path = ?
      WHERE id = ?;`;
      await this.executeQuery(updateUserQuery, [learningPath, student.id]);
      student.learning_path = learningPath;
      this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, {
        id: student.id,
        learning_path: learningPath,
      });
    } catch (error) {
      console.error("Error updating learning path:", error);
    }
    return student;
  }
  async getClassByUserId(
    userId: string
  ): Promise<TableTypes<"class"> | undefined> {
    // Step 1: Get class_id from class_user
    const classUserRes = await this._db?.query(
      `SELECT class_id FROM ${TABLES.ClassUser} WHERE user_id = "${userId}" AND is_deleted = false`
    );
    if (!classUserRes || !classUserRes.values || classUserRes.values.length < 1)
      return;
    const classId = classUserRes.values[0].class_id;

    // Step 2: Get class from class table using class_id
    const classRes = await this._db?.query(
      `SELECT * FROM ${TABLES.Class} WHERE id = "${classId}" AND is_deleted = false`
    );

    if (!classRes || !classRes.values || classRes.values.length < 1) return;
    return classRes.values[0];
  }
  async countAllPendingPushes(): Promise<number> {
    if (!this._db) return 0;
    const tableNames = Object.values(TABLES);
    const tables = "'" + tableNames.join("', '") + "'";

    const tablePushSync = `SELECT * FROM push_sync_info WHERE table_name IN (${tables}) ORDER BY created_at;`;
    let res: any[] = [];
    try {
      res = (await this._db.query(tablePushSync)).values ?? [];
      return res.length;
    } catch (error) {
      console.error("❌ Failed to count pending changes:", error);
      return 0;
    }
  }

  async deleteOldDebugInfoData(): Promise<void> {
    const deleteQuery = `
      DELETE FROM debug_info
      WHERE DATE(created_at) < DATE('now', '-30 days')
    `;
    await this.executeQuery(deleteQuery);
  }

  async getDebugInfoLast30Days(parentId: string): Promise<any[]> {
    await this.createDebugInfoTables();
    this.deleteOldDebugInfoData();

    const query = `
    SELECT 
      parent_id,
      SUM(No_of_pushed) AS total_pushed,
      SUM(No_of_pulled) AS total_pulled,
      SUM(data_transferred) AS total_transferred,
      DATE(updated_at) AS date
    FROM debug_info
    WHERE parent_id = ?
      AND DATE(updated_at) >= DATE('now', '-30 days')
    GROUP BY DATE(updated_at)
    ORDER BY DATE(updated_at) DESC
  `;
    const result = await this.executeQuery(query, [parentId]);
    return result?.values || [];
  }

  private async createDebugInfoTables() {
    const createDebugInfoTable = `
      CREATE TABLE IF NOT EXISTS debug_info (
        id TEXT NOT NULL PRIMARY KEY,
        parent_id TEXT NOT NULL,
        No_of_pushed INTEGER,
        No_of_pulled INTEGER,
        data_transferred INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL
      )
    `;
    await this.executeQuery(createDebugInfoTable);
  }

  async updateDebugInfo(
    noOfPushed?: number,
    noOfPulled?: number,
    dataTransferred?: number
  ) {
    await this.createDebugInfoTables();

    const authHandler = ServiceConfig.getI()?.authHandler;
    const currentUser = await authHandler?.getCurrentUser();
    const parentId = currentUser?.id;
    const today = new Date().toISOString().split("T")[0];

    const selectQuery = `
      SELECT * FROM debug_info
      WHERE parent_id = ? AND DATE(updated_at) = ?
    `;
    const existingRows = await this.executeQuery(selectQuery, [
      parentId,
      today,
    ]);

    if (existingRows?.values?.length && existingRows.values.length > 0) {
      // Update existing row
      const updateParts: string[] = ["updated_at = CURRENT_TIMESTAMP"];
      const params: any[] = [];

      if (noOfPushed !== undefined) {
        updateParts.push("No_of_pushed = No_of_pushed + ?");
        params.push(noOfPushed);
      }
      if (noOfPulled !== undefined) {
        updateParts.push("No_of_pulled = No_of_pulled + ?");
        params.push(noOfPulled);
      }
      if (dataTransferred !== undefined) {
        updateParts.push("data_transferred = data_transferred + ?");
        params.push(dataTransferred);
      }
      const updateQuery = `
        UPDATE debug_info SET ${updateParts.join(", ")}
        WHERE parent_id = ? AND DATE(updated_at) = ?
      `;
      params.push(parentId, today);
      await this.executeQuery(updateQuery, params);
    } else {
      // Insert new row
      const insertQuery = `
        INSERT INTO debug_info (
          id, parent_id,
          No_of_pushed, No_of_pulled, data_transferred,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;

      await this.executeQuery(insertQuery, [
        uuidv4(),
        parentId,
        noOfPushed ?? 0,
        noOfPulled ?? 0,
        dataTransferred ?? 0,
      ]);
    }
  }

  async getProgramFilterOptions(): Promise<Record<string, string[]>> {
    return await this._serverApi.getProgramFilterOptions();
  }
  async getPrograms(params: {
    currentUserId: string;
    filters?: Record<string, string[]>;
    searchTerm?: string;
    tab?: TabType;
    limit?: number;
    offset?: number;
    orderBy?: string;
    order?: "asc" | "desc";
  }): Promise<{ data: any[] }> {
    const {
      currentUserId,
      filters,
      searchTerm,
      tab,
      limit,
      offset,
      orderBy,
      order,
    } = params;
    return await this._serverApi.getPrograms({
      currentUserId,
      filters,
      searchTerm,
      tab,
      limit,
      offset,
      orderBy,
      order,
    });
  }

  async insertProgram(payload: any): Promise<boolean | null> {
    return await this._serverApi.insertProgram(payload);
  }

  async getProgramManagers(): Promise<{ name: string; id: string }[]> {
    return await this._serverApi.getProgramManagers();
  }

  async getUniqueGeoData(): Promise<{
    Country: string[];
    State: string[];
    Block: string[];
    Cluster: string[];
    District: string[];
  }> {
    return await this._serverApi.getUniqueGeoData();
  }

  async getProgramForSchool(
    schoolId: string
  ): Promise<TableTypes<"program"> | undefined> {
    const prog = await this._serverApi.getProgramForSchool(schoolId);
    return prog;
  }

  async getProgramManagersForSchool(
    schoolId: string
  ): Promise<TableTypes<"user">[] | undefined> {
    const users = await this._serverApi.getProgramManagersForSchool(schoolId);
    return users;
  }
  async updateStudentStars(
    studentId: string,
    totalStars: number
  ): Promise<void> {
    if (!studentId) return;
    try {
      await this.executeQuery(
        `UPDATE ${TABLES.User} SET stars = ? WHERE id = ?;`,
        [totalStars, studentId]
      );

      this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, {
        id: studentId,
        stars: totalStars,
      });
    } catch (error) {
      console.error("Error setting stars for student:", error);
    }
  }
  async getChapterIdbyQrLink(
    link: string
  ): Promise<TableTypes<"chapter_links"> | undefined> {
    if (!link) return;
    try {
      const res = await this._db?.query(
        `SELECT * FROM ${TABLES.ChapterLinks} WHERE link = ? AND is_deleted = 0 LIMIT 1;`,
        [link]
      );

      if (!res || !res.values || res.values.length < 1) return;
      return res.values[0];
    } catch (error) {
      console.error("Error fetching chapter by QR link:", error);
      return;
    }
  }
  async getSchoolsForAdmin(
    limit: number = 10,
    offset: number = 0
  ): Promise<TableTypes<"school">[]> {
    return await this._serverApi.getSchoolsForAdmin(limit, offset);
  }
  async getSchoolsByModel(
    model: EnumType<"program_model">,
    limit: number = 10,
    offset: number = 0
  ): Promise<TableTypes<"school">[]> {
    return await this._serverApi.getSchoolsByModel(model, limit, offset);
  }
  async getTeachersForSchools(schoolIds: string[]): Promise<SchoolRoleMap[]> {
    return await this._serverApi.getTeachersForSchools(schoolIds);
  }
  async getStudentsForSchools(schoolIds: string[]): Promise<SchoolRoleMap[]> {
    return await this._serverApi.getStudentsForSchools(schoolIds);
  }
  async getProgramManagersForSchools(
    schoolIds: string[]
  ): Promise<SchoolRoleMap[]> {
    return await this._serverApi.getProgramManagersForSchools(schoolIds);
  }
  async getProgramData(programId: string): Promise<{
    programDetails: { id: string; label: string; value: string }[];
    locationDetails: { id: string; label: string; value: string }[];
    partnerDetails: { id: string; label: string; value: string }[];
    programManagers: { name: string; role: string; phone: string }[];
  } | null> {
    return await this._serverApi.getProgramData(programId);
  }
  async getFieldCoordinatorsForSchools(
    schoolIds: string[]
  ): Promise<SchoolRoleMap[]> {
    return await this._serverApi.getFieldCoordinatorsForSchools(schoolIds);
  }

  async getSchoolFilterOptionsForSchoolListing(): Promise<
    Record<string, string[]>
  > {
    return await this._serverApi.getSchoolFilterOptionsForSchoolListing();
  }

  async getSchoolFilterOptionsForProgram(
    programId: string
  ): Promise<Record<string, string[]>> {
    return await this._serverApi.getSchoolFilterOptionsForProgram(programId);
  }

  async getFilteredSchoolsForSchoolListing(params: {
    filters?: Record<string, string[]>;
    programId?: string;
    page?: number;
    page_size?: number;
    order_by?: string;
    order_dir?: "asc" | "desc";
    search?: string;
  }): Promise<{ data: FilteredSchoolsForSchoolListingOps[]; total: number }> {
    return await this._serverApi.getFilteredSchoolsForSchoolListing(params);
  }

  async createOrAddUserOps(payload: {
    name: string;
    email?: string;
    phone?: string;
    role: string;
  }): Promise<{
    success: boolean;
    user_id?: string;
    message?: string;
    error?: string;
  }> {
    return await this._serverApi.createOrAddUserOps(payload);
  }

  async getTeacherInfoBySchoolId(
    schoolId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<TeacherAPIResponse> {
    if (!this._db) {
      console.warn("SQLite DB not initialized.");
      return { data: [], total: 0 };
    }

    // STEP 1: Get the total count of unique teachers for the school.
    const countQuery = `
    SELECT COUNT(DISTINCT cu.user_id) as total
    FROM ${TABLES.ClassUser} cu
    INNER JOIN ${TABLES.Class} c ON cu.class_id = c.id
    WHERE c.school_id = ?
      AND cu.role = 'teacher'
      AND cu.is_deleted = false
      AND c.is_deleted = false;
  `;

    const countRes = await this._db.query(countQuery, [schoolId]);
    const total = countRes?.values?.[0]?.total || 0;

    if (total === 0) {
      return { data: [], total: 0 };
    }

    const offset = (page - 1) * limit;

    const dataQuery = `
    SELECT
      u.*,
      c.name as class_name
    FROM ${TABLES.ClassUser} cu
    INNER JOIN ${TABLES.User} u ON cu.user_id = u.id
    INNER JOIN ${TABLES.Class} c ON cu.class_id = c.id
    WHERE c.school_id = ?
      AND cu.role = 'teacher'
      AND cu.is_deleted = false
      AND c.is_deleted = false
      AND u.is_deleted = false
    -- Group by teacher to handle cases where a teacher has multiple classes,
    -- ensuring we only get one row per teacher for pagination.
    GROUP BY u.id
    ORDER BY u.name ASC
    LIMIT ? OFFSET ?;
  `;

    const dataRes = await this._db.query(dataQuery, [schoolId, limit, offset]);
    const rows = dataRes?.values ?? [];

    // STEP 3: Map the flat SQL result into the nested TeacherInfo structure.
    const teacherInfoList: TeacherInfo[] = rows.map((row: any) => {
      const { class_name, ...teacherUser } = row;

      const { grade, section } = this.parseClassName(class_name || "");

      return {
        user: teacherUser as TableTypes<"user">,
        grade: grade,
        classSection: section,
      };
    });

    return {
      data: teacherInfoList,
      total: total,
    };
  }
  parseClassName(className: string): { grade: number; section: string } {
    const cleanedName = className.trim();
    if (!cleanedName) {
      return { grade: 0, section: "" };
    }

    let grade = 0;
    let section = "";

    // Pattern 1: Just a number (e.g., "1", "5", "10")
    const numericMatch = cleanedName.match(/^(\d+)$/);
    if (numericMatch) {
      grade = parseInt(numericMatch[1], 10);
      return { grade: isNaN(grade) ? 0 : grade, section: "" };
    }

    // Pattern 2: Number followed by letters or words (e.g., "3A", "5 B")
    const alphanumericMatch = cleanedName.match(/(\d+)\s*(\w+)/i);
    if (alphanumericMatch) {
      grade = parseInt(alphanumericMatch[1], 10);
      section = alphanumericMatch[2];
      return { grade: isNaN(grade) ? 0 : grade, section };
    }

    console.warn(
      `Could not parse grade from class name: "${cleanedName}". Assigning grade 0.`
    );
    return { grade: 0, section: cleanedName };
  }

  async getStudentInfoBySchoolId(
    schoolId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<StudentAPIResponse> {
    if (!this._db) {
      console.warn("Database not initialized, cannot fetch student info.");
      return { data: [], total: 0 };
    }

    const offset = (page - 1) * limit;

    // Step 1: Get total count (Your query is perfect)
    const countQuery = `
    SELECT COUNT(DISTINCT cu.user_id) as total
    FROM ${TABLES.ClassUser} cu
    INNER JOIN ${TABLES.Class} c ON cu.class_id = c.id
    WHERE cu.role = 'student'
      AND cu.is_deleted = false
      AND c.school_id = ?
      AND c.is_deleted = false;
  `;
    const countRes = await this._db.query(countQuery, [schoolId]);
    const total = countRes?.values?.[0]?.total ?? 0;

    if (total === 0) {
      return { data: [], total: 0 };
    }

    // Step 2: Fetch paginated data
    const query = `
    SELECT 
      u.*,
      c.name as class_name,
      p.id as parent_id,
      p.name as parent_name,
      p.email as parent_email,
      p.phone as parent_phone
      -- Add any other parent fields you want here, aliased with 'parent_'
    FROM ${TABLES.ClassUser} cu
    INNER JOIN ${TABLES.Class} c ON cu.class_id = c.id
    INNER JOIN ${TABLES.User} u ON cu.user_id = u.id
    LEFT JOIN ${TABLES.ParentUser} pu ON pu.student_id = u.id AND pu.is_deleted = false
    LEFT JOIN ${TABLES.User} p ON p.id = pu.parent_id AND p.is_deleted = false
    WHERE cu.role = 'student'
      AND cu.is_deleted = false
      AND c.school_id = ?
      AND c.is_deleted = false
      AND u.is_deleted = false
    -- Important to group by student to avoid duplicates if a student is in multiple classes
    GROUP BY u.id
    ORDER BY u.name ASC
    LIMIT ? OFFSET ?;
  `;
    const res = await this._db.query(query, [schoolId, limit, offset]);
    const rows = res?.values ?? [];

    const studentInfoList: StudentInfo[] = rows.map((row: any) => {
      const {
        class_name,
        parent_id,
        parent_name,
        parent_email,
        parent_phone,
        ...studentUser
      } = row;

      const { grade, section } = this.parseClassName(class_name || "");
      const parentObject: TableTypes<"user"> | null = parent_id
        ? {
            id: parent_id,
            name: parent_name,
            email: parent_email,
            phone: parent_phone,
            age: null,
            avatar: null,
            created_at: new Date().toISOString(),
            curriculum_id: null,
            fcm_token: null,
            firebase_id: null,
            gender: null,
            grade_id: null,
            image: null,
            is_deleted: false,
            is_firebase: false,
            is_ops: false,
            is_tc_accepted: false,
            language_id: null,
            learning_path: null,
            music_off: false,
            ops_created_by: null,
            reward: null,
            sfx_off: false,
            stars: null,
            student_id: null,
            updated_at: null,
          }
        : null;

      return {
        user: studentUser as TableTypes<"user">,
        grade,
        classSection: section,
        parent: parentObject,
      };
    });

    return {
      data: studentInfoList,
      total,
    };
  }
  async getStudentsAndParentsByClassId(
    classId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<StudentAPIResponse> {
    if (!this._db) {
      console.warn("Database not initialized, cannot fetch student info.");
      return { data: [], total: 0 };
    }

    const offset = (page - 1) * limit;

    // Step 1: Get total count for the specified class
    const countQuery = `
    SELECT COUNT(DISTINCT cu.user_id) as total
    FROM ${TABLES.ClassUser} cu
    INNER JOIN ${TABLES.Class} c ON cu.class_id = c.id
    WHERE cu.role = 'student'
      AND cu.is_deleted = false
      AND cu.class_id = ? -- Filter by class_id directly
      AND c.is_deleted = false;
  `;
    const countRes = await this._db.query(countQuery, [classId]);
    const total = countRes?.values?.[0]?.total ?? 0;

    if (total === 0) {
      return { data: [], total: 0 };
    }

    // Step 2: Fetch paginated data for the specified class
    const query = `
    SELECT
      u.*,
      c.name as class_name,
      p.id as parent_id,
      p.name as parent_name,
      p.email as parent_email,
      p.phone as parent_phone
      -- Add any other parent fields you want here, aliased with 'parent_'
    FROM ${TABLES.ClassUser} cu
    INNER JOIN ${TABLES.Class} c ON cu.class_id = c.id
    INNER JOIN ${TABLES.User} u ON cu.user_id = u.id
    LEFT JOIN ${TABLES.ParentUser} pu ON pu.student_id = u.id AND pu.is_deleted = false
    LEFT JOIN ${TABLES.User} p ON p.id = pu.parent_id AND p.is_deleted = false
    WHERE cu.role = 'student'
      AND cu.is_deleted = false
      AND cu.class_id = ? -- Filter by class_id directly
      AND c.is_deleted = false
      AND u.is_deleted = false
    -- Important to group by student to avoid duplicates if a student is in multiple classes (though less likely when filtering by specific class)
    GROUP BY u.id
    ORDER BY u.name ASC
    LIMIT ? OFFSET ?;
  `;
    const res = await this._db.query(query, [classId, limit, offset]);
    const rows = res?.values ?? [];

    const studentInfoList: StudentInfo[] = rows.map((row: any) => {
      const {
        class_name,
        parent_id,
        parent_name,
        parent_email,
        parent_phone,
        ...studentUser
      } = row;

      const { grade, section } = this.parseClassName(class_name || "");
      const parentObject: TableTypes<"user"> | null = parent_id
        ? {
            id: parent_id,
            name: parent_name,
            email: parent_email,
            phone: parent_phone,
            age: null, // Assuming these fields are nullable or have default values in your User table type
            avatar: null,
            created_at: new Date().toISOString(), // Example, adjust if you fetch this
            curriculum_id: null,
            fcm_token: null,
            firebase_id: null,
            gender: null,
            grade_id: null,
            image: null,
            is_deleted: false,
            is_firebase: false,
            is_ops: false,
            is_tc_accepted: false,
            language_id: null,
            learning_path: null,
            music_off: false,
            ops_created_by: null,
            reward: null,
            sfx_off: false,
            stars: null,
            student_id: null,
            updated_at: null,
          }
        : null;

      return {
        user: studentUser as TableTypes<"user">,
        grade,
        classSection: section,
        parent: parentObject,
      };
    });

    return {
      data: studentInfoList,
      total,
    };
  }
  async getStudentAndParentByStudentId(
    studentId: string
  ): Promise<{ user: any; parents: any[] }> {
    if (!this._db) {
      console.warn("Database not initialized.");
      return { user: null, parents: [] };
    }

    try {
      // Fetch student details
      const studentRes = await this._db.query(
        `SELECT * FROM user WHERE id = ? AND is_deleted = 0`,
        [studentId]
      );
      const studentRows = studentRes?.values ?? [];

      if (studentRows.length === 0) {
        return { user: null, parents: [] };
      }

      const student = studentRows[0];

      // Fetch parent details
      const parentRes = await this._db.query(
        `SELECT p.*
       FROM parent_user pu
       JOIN user p ON pu.parent_id = p.id
       WHERE pu.student_id = ? AND p.is_deleted = 0`,
        [studentId]
      );
      const parentRows = parentRes?.values ?? [];

      return {
        user: student,
        parents: parentRows,
      };
    } catch (error) {
      console.error(
        "Error fetching student and parent by student ID (SQLite):",
        error
      );
      return { user: null, parents: [] };
    }
  }

  async mergeStudentRequest(
    requestId: string,
    existingStudentId: string,
    newStudentId: string,
    respondedBy: string
  ): Promise<void> {
    if (!this._db) {
      throw new Error("SQLite DB not initialized.");
    }

    const now = new Date().toISOString();

    try {
      // 1. Get new student details + parents
      const newStudentRes = await this._db.query(
        `SELECT * FROM user WHERE id = ? AND is_deleted = 0`,
        [newStudentId]
      );
      const newStudent = newStudentRes?.values?.[0];
      if (!newStudent) throw new Error("New student not found");

      const newParentsRes = await this._db.query(
        `SELECT p.* FROM parent_user pu
       JOIN user p ON pu.parent_id = p.id
       WHERE pu.student_id = ? AND pu.is_deleted = 0 AND p.is_deleted = 0`,
        [newStudentId]
      );
      const newParents = newParentsRes?.values || [];

      // 2. Get existing student details + parents
      const existingStudentRes = await this._db.query(
        `SELECT * FROM user WHERE id = ? AND is_deleted = 0`,
        [existingStudentId]
      );
      const existingStudent = existingStudentRes?.values?.[0];
      if (!existingStudent) throw new Error("Existing student not found");

      const existingParentsRes = await this._db.query(
        `SELECT p.* FROM parent_user pu
       JOIN user p ON pu.parent_id = p.id
       WHERE pu.student_id = ? AND pu.is_deleted = 0 AND p.is_deleted = 0`,
        [existingStudentId]
      );
      const existingParents = existingParentsRes?.values || [];

      // 3. Compare phone/email
      const existingContact =
        existingParents?.[0]?.phone || existingParents?.[0]?.email || null;
      const newContact =
        newParents?.[0]?.phone || newParents?.[0]?.email || null;

      // 4. Transfer results
      const resultRes = await this._db.query(
        `SELECT * FROM result WHERE student_id = ? AND is_deleted = 0`,
        [newStudentId]
      );
      const results = resultRes?.values || [];

      if (results.length > 0) {
        await this._db.run(
          `UPDATE result SET student_id = ?, updated_at = ? 
         WHERE student_id = ? AND is_deleted = 0`,
          [existingStudentId, now, newStudentId]
        );
      }

      // 5. Link new parents if contact differs
      if (newContact && newContact !== existingContact) {
        for (const parent of newParents) {
          const alreadyLinked = existingParents.some(
            (p: any) =>
              (p.phone && parent.phone && p.phone === parent.phone) ||
              (p.email && parent.email && p.email === parent.email)
          );

          if (!alreadyLinked) {
            await this._db.run(
              `INSERT INTO parent_user (student_id, parent_id, is_deleted, created_at, updated_at)
             VALUES (?, ?, 0, ?, ?)`,
              [existingStudentId, parent.id, now, now]
            );
          }
        }
      }

      // 6. Soft-delete merged student + relations
      await this._db.run(
        `UPDATE class_user SET is_deleted = 1, updated_at = ? WHERE user_id = ?`,
        [now, newStudentId]
      );

      await this._db.run(
        `UPDATE parent_user SET is_deleted = 1, updated_at = ? WHERE student_id = ?`,
        [now, newStudentId]
      );

      await this._db.run(
        `UPDATE user SET is_deleted = 1, updated_at = ? WHERE id = ?`,
        [now, newStudentId]
      );

      // 7. (Optional) mark ops_requests as approved/merged
      await this._db.run(
        `UPDATE ops_requests SET status = 'approved', merged_to = ?, updated_at = ?, responded_by = ? WHERE request_id = ?`,
        [existingStudentId, now, respondedBy, requestId]
      );
    } catch (error) {
      console.error(
        "Error merging student in SQLite (mergeStudentRequestSqlite):",
        error
      );
      throw error;
    }
  }

  async createAutoProfile(
    languageDocId: string | undefined
  ): Promise<TableTypes<"user">> {
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw "User is not Logged in";
    const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
    const studentProfile = await this.getParentStudentProfiles();
    if (studentProfile.length > 0) return studentProfile[0];
    const studentId = uuidv4();
    const newStudent: TableTypes<"user"> = {
      id: studentId,
      name: null,
      age: null,
      gender: null,
      avatar: randomAvatar,
      image: null,
      curriculum_id: null,
      grade_id: null,
      language_id: languageDocId ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
      is_tc_accepted: true,
      email: null,
      phone: null,
      fcm_token: null,
      music_off: false,
      reward: null,
      sfx_off: false,
      student_id: null,
      firebase_id: null,
      is_firebase: null,
      is_ops: null,
      learning_path: null,
      ops_created_by: null,
      stars: null,
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

    // Find English, Maths, and language-dependent subject
    const englishCourse = await this.getCourse(CHIMPLE_ENGLISH);
    const mathsCourse = await this.getCourse(CHIMPLE_MATHS);
    const digitalSkillsCourse = await this.getCourse(CHIMPLE_DIGITAL_SKILLS);
    const language = await this.getLanguageWithId(languageDocId!);
    let langCourse;
    if (language && language.code !== COURSES.ENGLISH) {
      // Map language code to courseId
      const thirdLanguageCourseMap: Record<string, string> = {
        hi: CHIMPLE_HINDI,
        kn: GRADE1_KANNADA,
        mr: GRADE1_MARATHI,
      };

      const courseId = thirdLanguageCourseMap[language.code ?? ""];
      if (courseId) {
        langCourse = await this.getCourse(courseId);
      }
    }
    const coursesToAdd = [
      englishCourse,
      mathsCourse,
      langCourse,
      digitalSkillsCourse,
    ].filter(Boolean);

    await this.updatePushChanges(TABLES.User, MUTATE_TYPES.INSERT, newStudent);
    await this.updatePushChanges(TABLES.ParentUser, MUTATE_TYPES.INSERT, {
      id: parentUserId,
      parent_id: _currentUser.id,
      student_id: studentId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
    });

    for (const course of coursesToAdd) {
      const newUserCourse: TableTypes<"user_course"> = {
        course_id: course.id,
        created_at: new Date().toISOString(),
        id: uuidv4(),
        is_deleted: false,
        updated_at: new Date().toISOString(),
        user_id: studentId,
        is_firebase: null,
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

  async isProgramUser(): Promise<boolean> {
    return await this._serverApi.isProgramUser();
  }

  async program_activity_stats(programId: string): Promise<{
    total_students: number;
    total_teachers: number;
    total_schools: number;
    active_student_percentage: number;
    active_teacher_percentage: number;
    avg_weekly_time_minutes: number;
  }> {
    return await this._serverApi.program_activity_stats(programId);
  }

  async getManagersAndCoordinators(
    page: number = 1,
    search: string = "",
    limit: number = 10,
    sortBy: keyof TableTypes<"user"> = "name",
    sortOrder: "asc" | "desc" = "asc"
  ): Promise<{
    data: { user: TableTypes<"user">; role: string }[];
    totalCount: number;
  }> {
    return await this._serverApi.getManagersAndCoordinators(
      page,
      search,
      limit,
      sortBy,
      sortOrder
    );
  }

  async school_activity_stats(schoolId: string): Promise<{
    active_student_percentage: number;
    active_teacher_percentage: number;
    avg_weekly_time_minutes: number;
  }> {
    return await this._serverApi.school_activity_stats(schoolId);
  }
  async isProgramManager(): Promise<boolean> {
    return await this._serverApi.isProgramManager();
  }

  async getUserSpecialRoles(userId: string): Promise<string[]> {
    return await this._serverApi.getUserSpecialRoles(userId);
  }
  async updateSpecialUserRole(userId: string, role: string): Promise<void> {
    return await this._serverApi.updateSpecialUserRole(userId, role);
  }
  async deleteSpecialUser(userId: string): Promise<void> {
    return await this._serverApi.deleteSpecialUser(userId);
  }
  async updateProgramUserRole(userId: string, role: string): Promise<void> {
    return await this._serverApi.updateProgramUserRole(userId, role);
  }
  async deleteProgramUser(userId: string): Promise<void> {
    return await this._serverApi.deleteProgramUser(userId);
  }
  async deleteUserFromSchoolsWithRole(
    userId: string,
    role: RoleType
  ): Promise<void> {
    return await this._serverApi.deleteUserFromSchoolsWithRole(userId, role);
  }
  /**
   * Fetches school login type and program model using UDISE code from SQLite
   * @param {string} udiseCode - The UDISE ID of the school
   * @returns An object with studentLoginType, programId, and programModel if found, else null
   */
  async getSchoolDetailsByUdise(udiseCode: string): Promise<{
    studentLoginType: string;
    schoolModel: string;
  } | null> {
    // Step 1: Get school info by UDISE code
    const schoolRes = await this.executeQuery(
      `SELECT student_login_type, model FROM school WHERE udise = ? AND is_deleted = 0`,
      [udiseCode]
    );

    if (!schoolRes?.values?.length) {
      return null;
    }

    const { student_login_type, model } = schoolRes.values[0];

    return {
      studentLoginType: student_login_type || "",
      schoolModel: model || "",
    };
  }
  async getSchoolDataByUdise(udiseCode: string): Promise<TableTypes<"school_data">| null> {
   const schoolRes = await this.executeQuery(
      `SELECT * FROM school_data WHERE udise = ?`,
      [udiseCode]
    );
    if (!schoolRes?.values?.length) {
      return null;
    }
    return schoolRes.values[0];
  }

  async getChaptersByIds(
    chapterIds: string[]
  ): Promise<TableTypes<"chapter">[]> {
    if (!chapterIds || chapterIds.length === 0) {
      console.warn("getChaptersByIds was called with no chapter IDs.");
      return [];
    }

    try {
      const placeholders = chapterIds.map(() => "?").join(", ");

      const query = `SELECT *
        FROM ${TABLES.Chapter}
        WHERE id IN (${placeholders})
          AND is_deleted = 0;`;

      const res = await this.executeQuery(query, chapterIds);

      if (!res || !res.values) {
        console.warn("No chapters found for the provided ChapterIDs");
        return [];
      }

      return res.values as TableTypes<"chapter">[];
    } catch (error) {
      console.error("Error fetching chapters", error);
      return [];
    }
  }
  async addParentToNewClass(classID: string, studentId: string) {
    throw new Error("Method not implemented.");
  }
  async getOpsRequests(
    requestStatus: EnumType<"ops_request_status">,
    page: number = 1,
    limit: number = 20,
    orderBy: string = "created_at",
    orderDir: "asc" | "desc" = "asc",
    filters?: { request_type?: string[]; school?: string[] },
    searchTerm?: string
  ) {
    throw new Error("Method not implemented.");
  }
  async getRequestFilterOptions() {
    throw new Error("Method not implemented.");
  }

  async searchStudentsInSchool(
    schoolId: string,
    searchTerm: string,
    page: number,
    limit: number
  ): Promise<{ data: any[]; total: number }> {
    if (!this._db) return { data: [], total: 0 };
    // Build query for multi-field search
    let whereClause = `cu.role = 'student' AND cu.is_deleted = 0 AND c.school_id = ?`;
    let params: any[] = [schoolId];
    if (searchTerm && searchTerm.trim() !== "") {
      whereClause += ` AND (u.name LIKE ? OR u.student_id LIKE ? OR u.phone LIKE ?)`;
      const likeTerm = `%${searchTerm}%`;
      params.push(likeTerm, likeTerm, likeTerm);
    }
    const offset = (page - 1) * limit;
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM class_user cu JOIN user u ON cu.user_id = u.id JOIN class c ON cu.class_id = c.id WHERE ${whereClause}`;
    const countResult = await this._db.query(countQuery, params);
    const total = countResult?.values?.[0]?.total ?? 0;
    // Get paginated data
    const query = `
      SELECT u.id, u.name, u.student_id, u.phone, cu.class_id, c.name as class_name, pu.parent_id, p.name as parent_name
      FROM class_user cu
      JOIN user u ON cu.user_id = u.id
      JOIN class c ON cu.class_id = c.id
      LEFT JOIN parent_user pu ON pu.student_id = u.id AND pu.is_deleted = 0
      LEFT JOIN user p ON pu.parent_id = p.id
      WHERE ${whereClause}
      ORDER BY u.name
      LIMIT ? OFFSET ?
    `;
    const result = await this._db.query(query, [...params, limit, offset]);
    return { data: result?.values ?? [], total };
  }

  async searchTeachersInSchool(
    schoolId: string,
    searchTerm: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: any[]; total: number }> {
    if (!this._db) return { data: [], total: 0 };
    let whereClause = `cu.role = 'teacher' AND cu.is_deleted = 0 AND c.school_id = ?`;
    let params: any[] = [schoolId];
    if (searchTerm && searchTerm.trim() !== "") {
      whereClause += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
      const likeTerm = `%${searchTerm}%`;
      params.push(likeTerm, likeTerm, likeTerm);
    }
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM class_user cu
      JOIN user u ON cu.user_id = u.id
      JOIN class c ON cu.class_id = c.id
      WHERE ${whereClause}
    `;
    const countResult = await this._db.query(countQuery, params);
    const total = countResult?.values?.[0]?.total ?? 0;
    // Paginated query
    const offset = (page - 1) * limit;
    const query = `
      SELECT u.id, u.name, u.email, u.phone, cu.class_id, c.name as class_name
      FROM class_user cu
      JOIN user u ON cu.user_id = u.id
      JOIN class c ON cu.class_id = c.id
      WHERE ${whereClause}
      ORDER BY u.name
      LIMIT ? OFFSET ?
    `;
    const result = await this._db.query(query, [...params, limit, offset]);
    return { data: result?.values ?? [], total };
  }
  async respondToSchoolRequest(
    requestId: string,
    respondedBy: string,
    status: (typeof STATUS)[keyof typeof STATUS],
    rejectedReasonType?: string,
    rejectedReasonDescription?: string
  ): Promise<TableTypes<"ops_requests"> | undefined> {
    return await this._serverApi.respondToSchoolRequest(
      requestId,
      respondedBy,
      status,
      rejectedReasonType,
      rejectedReasonDescription
    );
  }
  async getFieldCoordinatorsByProgram(
    programId: string
  ): Promise<{ data: TableTypes<"user">[] }> {
    return await this._serverApi.getFieldCoordinatorsByProgram(programId);
  }
  async getProgramsByRole(): Promise<{ data: TableTypes<"program">[] }> {
    return await this._serverApi.getProgramsByRole();
  }
  async updateSchoolStatus(
    schoolId: string,
    schoolStatus: (typeof STATUS)[keyof typeof STATUS],
    address?: {
      state?: string;
      district?: string;
      city?: string;
      address?: string;
    },
    keyContacts?: any
  ): Promise<void> {
    return await this._serverApi.updateSchoolStatus(
      schoolId,
      schoolStatus,
      address,
      keyContacts
    );
  }
  async clearCacheData(tableNames: readonly CACHETABLES[]): Promise<void> {
    if (!this._db) return;
    const query = `PRAGMA foreign_keys=OFF;`;
    const result = await this._db?.query(query);
    console.log(result);
    for (const table of tableNames) {
      const tableDel = `DELETE FROM "${table}";`;
      const res = await this._db.query(tableDel);
      console.log(res);
    }
    const vaccum = `VACUUM;`;
    const resv = await this._db.query(vaccum);
    console.log(resv);
  }
  async approveOpsRequest(
    requestId: string,
    respondedBy: string,
    role: (typeof RequestTypes)[keyof typeof RequestTypes],
    schoolId?: string,
    classId?: string
  ): Promise<TableTypes<"ops_requests"> | undefined> {
    return await this._serverApi.approveOpsRequest(
      requestId,
      respondedBy,
      role,
      schoolId,
      classId
    );
  }
  async getGeoData(params: GeoDataParams): Promise<string[]> {
    return await this._serverApi.getGeoData(params);
  }
  async searchSchools(
    params: SearchSchoolsParams
  ): Promise<SearchSchoolsResult> {
    {
      return await this._serverApi.searchSchools(params);
    }
  }
  async sendJoinSchoolRequest(
    schoolId: string,
    requestType: RequestTypes,
    classId?: string
  ): Promise<void> {
    const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!currentUser) throw "User is not Logged in";
    const ops_request_id = uuidv4();

    const now = new Date().toISOString();
    const newRequest = {
      id: ops_request_id,
      school_id: schoolId,
      class_id: classId ?? null,
      request_type: requestType,
      requested_by: currentUser.id,
      request_status: STATUS.REQUESTED,
      rejected_reason_description: "",
      rejected_reason_type: "",
      created_at: now,
      updated_at: now,
      is_deleted: false,
    };
    await this.executeQuery(
      `
      INSERT INTO ops_requests
        (id,school_id, class_id, request_type, requested_by, request_status, rejected_reason_description, rejected_reason_type, created_at, updated_at, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
      [
        newRequest.id,
        newRequest.school_id,
        newRequest.class_id,
        newRequest.request_type,
        newRequest.requested_by,
        newRequest.request_status,
        newRequest.rejected_reason_description,
        newRequest.rejected_reason_type,
        newRequest.created_at,
        newRequest.updated_at,
        newRequest.is_deleted,
      ]
    );
    await this.updatePushChanges(
      TABLES.OpsRequests,
      MUTATE_TYPES.INSERT,
      newRequest
    );
  }
  async getAllClassesBySchoolId(
    schoolId: string
  ): Promise<TableTypes<"class">[]> {
    return await this._serverApi.getAllClassesBySchoolId(schoolId);
  }
  async getRewardById(
    rewardId: string
  ): Promise<TableTypes<"rive_reward"> | undefined> {
    try {
      const query = `SELECT * FROM rive_reward WHERE id = ? AND is_deleted = 0;`;
      const res = await this.executeQuery(query, [rewardId]);
      if (!res || !res.values || res.values.length === 0) {
        console.warn(`No reward found for ID: ${rewardId}`);
        return undefined;
      }
      return res.values[0] as TableTypes<"rive_reward">;
    } catch (error) {
      console.error("Error fetching reward by ID", error);
      return undefined;
    }
  }
  async getAllRewards(): Promise<TableTypes<"rive_reward">[] | []> {
    try {
      const query = `SELECT * FROM rive_reward WHERE type='normal' AND is_deleted = 0 ORDER BY state_number_input ASC;`;
      const res = await this.executeQuery(query, []);
      if (!res || !res.values) {
        console.warn(`No rewards found`);
        return [];
      }
      return res.values as TableTypes<"rive_reward">[];
    } catch (error) {
      console.error("Error fetching all rewards", error);
      return [];
    }
  }
  async updateUserReward(
    userId: string,
    rewardId: string,
    created_at?: string
  ): Promise<void> {
    if (!rewardId) {
      console.warn("No rewardId provided to updateUserReward");
      return;
    }

    try {
      const currentUser = (await this.getUserByDocId(
        userId
      )) as TableTypes<"user"> | null;
      if (!currentUser) {
        console.warn(`No user found`);
        return;
      }

      const timestamp = created_at ?? new Date().toISOString();

      const newReward = {
        reward_id: rewardId,
        timestamp: timestamp,
      };
      const rewardString = JSON.stringify(newReward);

      // Update the same currentUser object
      currentUser.reward = rewardString;

      const query = `UPDATE user SET reward = ?, updated_at= ? WHERE id = ? AND is_deleted = 0;`;
      await this.executeQuery(query, [rewardString, timestamp, userId]);
      await this.updatePushChanges(
        TABLES.User,
        MUTATE_TYPES.UPDATE,
        currentUser
      );
      Util.setCurrentStudent(currentUser);
    } catch (error) {
      console.error("❌ Error updating user reward:", error);
    }
  }
  async getActiveStudentsCountByClass(classId: string): Promise<string> {
    return await this._serverApi.getActiveStudentsCountByClass(classId);
  }
  async getCompletedAssignmentsCountForSubjects(
    studentId: string,
    subjectIds: string[]
  ): Promise<{ subject_id: string; completed_count: number }[]> {
    if (!studentId || !subjectIds.length) {
      return [];
    }
    // Generate a placeholder for each subjectId (e.g., "?,?,?").
    const placeholders = subjectIds.map(() => "?").join(",");

    const query = `
    SELECT l.subject_id, COUNT(r.lesson_id) AS completed_count
    FROM result r
    JOIN lesson l ON r.lesson_id = l.id
    WHERE r.student_id = ?
      AND r.is_deleted = 0
      AND l.subject_id IN (${placeholders})
    GROUP BY l.subject_id;
  `;

    // Create a single array of parameters in the correct order.
    const params = [studentId, ...subjectIds];

    try {
      // Execute the query with the safely bound parameters.
      const res = await this.executeQuery(query, params);
      return res?.values ?? [];
    } catch (err) {
      console.error("Error fetching completed homework counts in SQLite:", err);
      return [];
    }
  }
  public async getOrcreateschooluser(
    params: UserSchoolClassParams
  ): Promise<UserSchoolClassResult> {
    return this._serverApi.getOrcreateschooluser(params);
  }
  async insertSchoolDetails(
    schoolId: string,
    schoolModel: string,
    locationLink?: string,
    keyContacts?: any
  ): Promise<void> {
    try {
      let fields = "model = ?";
      const values: any[] = [schoolModel];

      if (locationLink !== undefined && locationLink !== null) {
        fields += ", location_link = ?";
        values.push(locationLink);
      }

      if (keyContacts) {
        fields += ", key_contacts = ?";
        values.push(JSON.stringify(keyContacts));
      }

      const timestamp = new Date().toISOString();
      fields += ", updated_at = ?";
      values.push(timestamp);

      values.push(schoolId);

      const query = `
        UPDATE school
        SET ${fields}
        WHERE id = ? AND is_deleted = 0;
      `;
      await this.executeQuery(query, values);

      const pushObject = {
        id: schoolId,
        model: schoolModel,
        location_link: locationLink ?? null,
        key_contacts: JSON.stringify(keyContacts) ?? null,
        updated_at: timestamp
      };

      await this.updatePushChanges(
        TABLES.School,
        MUTATE_TYPES.UPDATE,
        pushObject
      );

    } catch (error) {
      console.error("❌ Error inserting school details:", error);
    }
  }

  async updateClassCourses(
    classId: string,
    selectedCourseIds: string[]
  ): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const deleteQuery = `
        UPDATE class_course
        SET is_deleted = 1, updated_at = ?
        WHERE class_id = ? AND is_deleted = 0;
      `;
      await this.executeQuery(deleteQuery, [timestamp, classId]);
      for (const courseId of selectedCourseIds) {
        const id = uuidv4();

        const insertQuery = `
          INSERT INTO class_course (
            id,
            class_id,
            course_id,
            created_at,
            updated_at,
            is_deleted
          )
          VALUES (?, ?, ?, ?, ?, 0);
        `;

        await this.executeQuery(insertQuery, [
          id,
          classId,
          courseId,
          timestamp,
          timestamp
        ]);
        this.updatePushChanges(
          TABLES.ClassCourse,
          MUTATE_TYPES.INSERT,
          {
            id,
            class_id: classId,
            course_id: courseId,
            created_at: timestamp,
            updated_at: timestamp,
            is_deleted: 0
          }
        );
      }

    } catch (error) {
      console.error("❌ Error replacing class courses:", error);
    }
  }
  public async addStudentWithParentValidation(params: {
    phone: string;
    name: string;
    gender: string;
    age: string;
    classId: string;
    schoolId?: string;
    parentName?: string;
    email?: string;
  }): Promise<{ success: boolean; message: string; data?: any }> {
    return this._serverApi.addStudentWithParentValidation(params);
  }

}
