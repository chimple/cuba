import { PowerSyncDatabase } from "@powersync/web";
import { ServiceConfig } from "../ServiceConfig";
import { ServiceApi } from "./ServiceApi";
import { PowerSyncSchema } from "./PowersyncSchema";
import {
  DEFAULT_SUBJECT_IDS,
  OTHER_CURRICULUM,
  PROFILETYPE,
  STATUS,
  LIVE_QUIZ,
  STARS_COUNT,
  CHIMPLE_ENGLISH,
  CHIMPLE_MATHS,
  CHIMPLE_DIGITAL_SKILLS,
  CHIMPLE_HINDI,
  GRADE1_KANNADA,
  GRADE1_MARATHI,
  TABLES,
  TableTypes,
} from "../../common/constants";
import { RoleType } from "../../interface/modelInterfaces";
import { v4 as uuidv4 } from "uuid";
import { Util } from "../../utility/util";
import { StudentLessonResult } from "../../common/courseConstants";

type PowerSyncCredentials = {
  endpoint: string;
  token: string;
};

class PowerSyncConnector {
  constructor(
    private readonly fetcher: () => Promise<PowerSyncCredentials | null>
  ) {}

  async fetchCredentials(): Promise<PowerSyncCredentials> {
    const credentials = await this.fetcher();
    if (!credentials) {
      throw new Error("PowerSync credentials are not available.");
    }
    return credentials;
  }

  // Uploading client-side writes to the upstream backend is optional for now.
  // SupabaseApi already handles mutations, so we focus on reading and sync.
  async uploadData() {
    return;
  }
}

/**
 * PowerSync-backed implementation of the ServiceApi contract.
 * It reuses the existing SupabaseApi functionality for business logic while
 * wiring up the PowerSync managed SQLite database for offline/real-time sync.
 */
export class PowersyncApi implements ServiceApi {
  private static instance: PowersyncApi;
  public powerSync: PowerSyncDatabase;
  private powerSyncReady?: Promise<void>;

  private constructor() {
    this.powerSync = new PowerSyncDatabase({
      schema: PowerSyncSchema,
      database: {
        dbFilename: "powersync.db",
      },
    });
  }

  public static getInstance(): PowersyncApi {
    if (!PowersyncApi.instance) {
      PowersyncApi.instance = new PowersyncApi();
      void PowersyncApi.instance.initPowerSync();
    }
    return PowersyncApi.instance;
  }

  private async initPowerSync() {
    const connector = new PowerSyncConnector(async () => {
      const endpoint = process.env.REACT_APP_POWERSYNC_ENDPOINT;
      const authHandler = ServiceConfig.getI()?.authHandler;
      const idToken = await authHandler?.getIdToken();
      const token = idToken ?? process.env.REACT_APP_POWERSYNC_TOKEN;

      if (!endpoint || !token) {
        console.warn(
          "PowerSync is configured but missing endpoint or token. Set REACT_APP_POWERSYNC_ENDPOINT and REACT_APP_POWERSYNC_TOKEN."
        );
        return null;
      }

      return { endpoint, token };
    });

    this.powerSyncReady = (async () => {
      try {
        await this.powerSync.connect(connector as any);
      } catch (error) {
        console.error("Failed to connect PowerSync client:", error);
      }
    })();
  }

  private async ensurePowerSyncReady() {
    if (this.powerSyncReady) {
      await this.powerSyncReady;
    }
  }

  private buildInClause(values: unknown[]): { clause: string; params: any[] } {
    if (!values.length) return { clause: "(NULL)", params: [] };
    return {
      clause: `(${values.map(() => "?").join(",")})`,
      params: values,
    };
  }

  private async queryAll<T>(sql: string, parameters: any[] = []) {
    await this.ensurePowerSyncReady();
    const rows = await this.powerSync.getAll({ sql, parameters });
    return (rows ?? []) as T[];
  }

  private async querySingle<T>(sql: string, parameters: any[] = []) {
    await this.ensurePowerSyncReady();
    try {
      const row = await this.powerSync.get({ sql, parameters });
      return row as T;
    } catch (error) {
      // get() throws if no row; treat that as undefined for read helpers
      return undefined;
    }
  }

  private async execute(sql: string, parameters: any[] = []) {
    await this.ensurePowerSyncReady();
    return this.powerSync.execute( sql, parameters  );
  }

  // ---------- User/Profile creation helpers ----------
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
    const currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!currentUser) throw new Error("User is not logged in");

    const studentId = uuidv4();
    const now = new Date().toISOString();

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
      created_at: now,
      updated_at: now,
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

    await this.execute(
      `INSERT INTO ${TABLES.User} (id,name,age,gender,avatar,image,curriculum_id,grade_id,language_id,created_at,updated_at,is_deleted,is_tc_accepted,email,phone,fcm_token,music_off,sfx_off,student_id,firebase_id,is_firebase,is_ops,learning_path,ops_created_by,reward,stars)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
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
        newStudent.is_deleted ? 1 : 0,
        newStudent.is_tc_accepted ? 1 : 0,
        newStudent.email,
        newStudent.phone,
        newStudent.fcm_token,
        newStudent.music_off ? 1 : 0,
        newStudent.sfx_off ? 1 : 0,
        newStudent.student_id,
        newStudent.firebase_id,
        newStudent.is_firebase,
        newStudent.is_ops,
        newStudent.learning_path,
        newStudent.ops_created_by,
        newStudent.reward,
        newStudent.stars,
      ]
    );

    await this.execute(
      `INSERT INTO ${TABLES.ParentUser} (id,parent_id,student_id,created_at,updated_at,is_deleted,is_firebase,is_ops,ops_created_by)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [uuidv4(), currentUser.id, studentId, now, now, 0, null, null, null]
    );

    if (gradeDocId && boardDocId) {
      const courses = await this.getCourseByUserGradeId(gradeDocId, boardDocId);
      await this.addCourseForParentsStudent(courses, newStudent);
    } else {
      const [englishCourse, mathsCourse, digitalSkillsCourse] =
        await Promise.all([
          this.getCourse(CHIMPLE_ENGLISH),
          this.getCourse(CHIMPLE_MATHS),
          this.getCourse(CHIMPLE_DIGITAL_SKILLS),
        ]);
      const language = await this.getLanguageWithId(languageDocId!);
      const thirdLanguageCourseMap: Record<string, string> = {
        hi: CHIMPLE_HINDI,
        kn: GRADE1_KANNADA,
        mr: GRADE1_MARATHI,
      };
      const langCourseId = language ? thirdLanguageCourseMap[language.code ?? ""] : undefined;
      const langCourse = langCourseId ? await this.getCourse(langCourseId) : undefined;
      const coursesToAdd = [englishCourse, mathsCourse, langCourse, digitalSkillsCourse].filter(
        (c): c is TableTypes<"course"> => !!c
      );
      await this.addCourseForParentsStudent(coursesToAdd, newStudent);
    }

    return newStudent;
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
    role: RoleType.STUDENT,
    studentId: string
  ): Promise<TableTypes<"user">> {
    const currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!currentUser) throw new Error("User is not logged in");

    const userId = uuidv4();
    const timestamp = new Date().toISOString();

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
      created_at: timestamp,
      updated_at: timestamp,
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
      reward: null,
      stars: null,
    };

    await this.execute(
      `INSERT INTO ${TABLES.User} (id,name,age,gender,avatar,image,curriculum_id,grade_id,language_id,created_at,updated_at,is_deleted,is_tc_accepted,email,phone,fcm_token,music_off,sfx_off,student_id,firebase_id,is_firebase,is_ops,learning_path,ops_created_by,reward,stars)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
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
        newStudent.is_deleted ? 1 : 0,
        newStudent.is_tc_accepted ? 1 : 0,
        newStudent.email,
        newStudent.phone,
        newStudent.fcm_token,
        newStudent.music_off ? 1 : 0,
        newStudent.sfx_off ? 1 : 0,
        newStudent.student_id,
        newStudent.firebase_id,
        newStudent.is_firebase,
        newStudent.is_ops,
        newStudent.learning_path,
        newStudent.ops_created_by,
        newStudent.reward,
        newStudent.stars,
      ]
    );

    await this.execute(
      `INSERT INTO ${TABLES.ClassUser} (id,class_id,user_id,role,created_at,updated_at,is_deleted,is_firebase,is_ops,ops_created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [uuidv4(), classId, userId, role, timestamp, timestamp, 0, null, null, null]
    );

    const courses = await this.getCourseByUserGradeId(
      gradeDocId ?? undefined,
      boardDocId ?? undefined
    );
    if (courses.length > 0) {
      await this.addCourseForParentsStudent(courses, newStudent);
    }

    return newStudent;
  }

  async deleteProfile(studentId: string) {
    await this.execute(
      `DELETE FROM ${TABLES.User} WHERE id = ?`,
      [studentId]
    );
  }

  async updateSoundFlag(userId: string, value: boolean) {
    await this.execute(
      `UPDATE ${TABLES.User} SET sfx_off=? WHERE id=?`,
      [value ? 1 : 0, userId]
    );
  }

  async updateMusicFlag(userId: string, value: boolean) {
    await this.execute(
      `UPDATE ${TABLES.User} SET music_off=? WHERE id=?`,
      [value ? 1 : 0, userId]
    );
  }

  async updateLanguage(userId: string, value: string) {
    await this.execute(
      `UPDATE ${TABLES.User} SET language_id=? WHERE id=?`,
      [value, userId]
    );
  }

  async updateFcmToken(userId: string) {
    const token = await Util.getToken();
    await this.execute(
      `UPDATE ${TABLES.User} SET fcm_token=? WHERE id=?`,
      [token, userId]
    );
  }

  async updateTcAccept(userId: string) {
    await this.execute(
      `UPDATE ${TABLES.User} SET is_tc_accepted=1 WHERE id=?`,
      [userId]
    );
  }

  async getChaptersForCourse(
    courseId: string
  ): Promise<TableTypes<"chapter">[]> {
    return this.queryAll<TableTypes<"chapter">>(
      `SELECT * FROM ${TABLES.Chapter} WHERE course_id = ? AND coalesce(is_deleted, 0)=0 ORDER BY sort_index ASC`,
      [courseId]
    );
  }

  async getCoursesByClassId(
    classId: string
  ): Promise<TableTypes<"class_course">[]> {
    return this.queryAll<TableTypes<"class_course">>(
      `SELECT * FROM ${TABLES.ClassCourse} WHERE class_id = ? AND coalesce(is_deleted, 0)=0`,
      [classId]
    );
  }

  async getCoursesBySchoolId(
    schoolId: string
  ): Promise<TableTypes<"school_course">[]> {
    return this.queryAll<TableTypes<"school_course">>(
      `SELECT * FROM ${TABLES.SchoolCourse} WHERE school_id = ? AND coalesce(is_deleted, 0)=0`,
      [schoolId]
    );
  }

  async getAllCurriculums(): Promise<TableTypes<"curriculum">[]> {
    return this.queryAll<TableTypes<"curriculum">>(
      `SELECT * FROM ${TABLES.Curriculum} WHERE coalesce(is_deleted, 0)=0 ORDER BY name ASC`
    );
  }

  async getAllGrades(): Promise<TableTypes<"grade">[]> {
    return this.queryAll<TableTypes<"grade">>(
      `SELECT * FROM ${TABLES.Grade} WHERE coalesce(is_deleted, 0)=0 ORDER BY sort_index ASC`
    );
  }

  async getAllLanguages(): Promise<TableTypes<"language">[]> {
    return this.queryAll<TableTypes<"language">>(
      `SELECT * FROM ${TABLES.Language} WHERE coalesce(is_deleted, 0)=0 ORDER BY code ASC`
    );
  }

  async getGradeById(id: string): Promise<TableTypes<"grade"> | undefined> {
    return this.querySingle<TableTypes<"grade">>(
      `SELECT * FROM ${TABLES.Grade} WHERE id = ? AND coalesce(is_deleted, 0)=0 LIMIT 1`,
      [id]
    );
  }

  async getGradesByIds(ids: string[]): Promise<TableTypes<"grade">[]> {
    if (!ids || ids.length === 0) return [];
    const placeholders = ids.map(() => "?").join(", ");
    return this.queryAll<TableTypes<"grade">>(
      `SELECT * FROM ${TABLES.Grade} WHERE id IN (${placeholders}) AND coalesce(is_deleted, 0)=0`,
      ids
    );
  }

  async getCurriculumById(
    id: string
  ): Promise<TableTypes<"curriculum"> | undefined> {
    return this.querySingle<TableTypes<"curriculum">>(
      `SELECT * FROM ${TABLES.Curriculum} WHERE id = ? AND coalesce(is_deleted, 0)=0 LIMIT 1`,
      [id]
    );
  }

  async getCurriculumsByIds(
    ids: string[]
  ): Promise<TableTypes<"curriculum">[]> {
    if (!ids || ids.length === 0) return [];
    const placeholders = ids.map(() => "?").join(", ");
    return this.queryAll<TableTypes<"curriculum">>(
      `SELECT * FROM ${TABLES.Curriculum} WHERE id IN (${placeholders}) AND coalesce(is_deleted, 0)=0`,
      ids
    );
  }

  async getLanguageWithId(
    id: string
  ): Promise<TableTypes<"language"> | undefined> {
    return this.querySingle<TableTypes<"language">>(
      `SELECT * FROM ${TABLES.Language} WHERE id = ? AND coalesce(is_deleted, 0)=0 LIMIT 1`,
      [id]
    );
  }

  async getLessonWithCocosLessonId(
    lessonId: string
  ): Promise<TableTypes<"lesson"> | null> {
    const row = await this.querySingle<TableTypes<"lesson">>(
      `SELECT * FROM ${TABLES.Lesson} WHERE cocos_lesson_id = ? AND coalesce(is_deleted, 0)=0 LIMIT 1`,
      [lessonId]
    );
    return row ?? null;
  }

  async getFavouriteLessons(userId: string): Promise<TableTypes<"lesson">[]> {
    return this.queryAll<TableTypes<"lesson">>(
      `SELECT l.* FROM ${TABLES.FavoriteLesson} fl
       JOIN ${TABLES.Lesson} l ON fl.lesson_id = l.id
       WHERE fl.user_id = ? AND coalesce(fl.is_deleted,0)=0 AND coalesce(l.is_deleted,0)=0
       ORDER BY fl.created_at DESC`,
      [userId]
    );
  }

  async getParentStudentProfiles(): Promise<TableTypes<"user">[]> {
    const currentUser =
      await ServiceConfig.getI()?.authHandler?.getCurrentUser();
    if (!currentUser) return [];
    return this.queryAll<TableTypes<"user">>(
      `SELECT u.* FROM ${TABLES.ParentUser} pu
       JOIN ${TABLES.User} u ON pu.student_id = u.id
       WHERE pu.parent_id = ? AND coalesce(pu.is_deleted,0)=0 AND coalesce(u.is_deleted,0)=0`,
      [currentUser.id]
    );
  }

  async getLesson(id: string): Promise<TableTypes<"lesson"> | undefined> {
    return this.querySingle<TableTypes<"lesson">>(
      `SELECT * FROM ${TABLES.Lesson} WHERE id = ? AND coalesce(is_deleted,0)=0 LIMIT 1`,
      [id]
    );
  }

  async getChapterById(id: string): Promise<TableTypes<"chapter"> | undefined> {
    return this.querySingle<TableTypes<"chapter">>(
      `SELECT * FROM ${TABLES.Chapter} WHERE id = ? AND coalesce(is_deleted,0)=0 LIMIT 1`,
      [id]
    );
  }

  async getLessonsForChapter(
    chapterId: string
  ): Promise<TableTypes<"lesson">[]> {
    return this.queryAll<TableTypes<"lesson">>(
      `SELECT l.* FROM ${TABLES.ChapterLesson} cl
       JOIN ${TABLES.Lesson} l ON cl.lesson_id = l.id
       WHERE cl.chapter_id = ? AND coalesce(cl.is_deleted,0)=0 AND coalesce(l.is_deleted,0)=0
       ORDER BY cl.sort_index ASC`,
      [chapterId]
    );
  }

  async getSubject(id: string): Promise<TableTypes<"subject"> | undefined> {
    return this.querySingle<TableTypes<"subject">>(
      `SELECT * FROM ${TABLES.Subject} WHERE id = ? AND coalesce(is_deleted,0)=0 LIMIT 1`,
      [id]
    );
  }

  async getCourse(id: string): Promise<TableTypes<"course"> | undefined> {
    return this.querySingle<TableTypes<"course">>(
      `SELECT * FROM ${TABLES.Course} WHERE id = ? AND coalesce(is_deleted,0)=0 LIMIT 1`,
      [id]
    );
  }

  async getCourses(ids: string[]): Promise<TableTypes<"course">[]> {
    if (!ids || ids.length === 0) return [];
    const placeholders = ids.map(() => "?").join(", ");
    return this.queryAll<TableTypes<"course">>(
      `SELECT * FROM ${TABLES.Course} WHERE id IN (${placeholders}) AND coalesce(is_deleted,0)=0`,
      ids
    );
  }

  async getAllCourses(): Promise<TableTypes<"course">[]> {
    return this.queryAll<TableTypes<"course">>(
      `SELECT * FROM ${TABLES.Course} WHERE coalesce(is_deleted,0)=0 ORDER BY sort_index ASC`
    );
  }

  async getCoursesFromLesson(
    lessonId: string
  ): Promise<TableTypes<"course">[]> {
    return this.queryAll<TableTypes<"course">>(
      `SELECT c.* FROM ${TABLES.ChapterLesson} cl
       JOIN ${TABLES.Chapter} ch ON cl.chapter_id = ch.id
       JOIN ${TABLES.Course} c ON ch.course_id = c.id
       WHERE cl.lesson_id = ? AND coalesce(cl.is_deleted,0)=0 AND coalesce(ch.is_deleted,0)=0 AND coalesce(c.is_deleted,0)=0`,
      [lessonId]
    );
  }

  // ---------- Class / School / User helpers ----------
  async createClass(
    schoolId: string,
    className: string
  ): Promise<TableTypes<"class">> {
    const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!currentUser) throw new Error("User is not Logged in");

    const classId = uuidv4();
    const timestamp = new Date().toISOString();

    const newClass: TableTypes<"class"> = {
      id: classId,
      name: className,
      image: null,
      school_id: schoolId,
      group_id: null,
      created_at: timestamp,
      updated_at: timestamp,
      is_deleted: false,
      academic_year: null,
      firebase_id: null,
      is_firebase: null,
      is_ops: null,
      ops_created_by: null,
      standard: null,
      status: null,
    };

    await this.execute(
      `INSERT INTO ${TABLES.Class} (id,name,image,school_id,group_id,created_at,updated_at,is_deleted,academic_year,firebase_id,is_firebase,is_ops,ops_created_by,standard,status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        newClass.id,
        newClass.name,
        newClass.image,
        newClass.school_id,
        newClass.group_id,
        newClass.created_at,
        newClass.updated_at,
        newClass.is_deleted ? 1 : 0,
        newClass.academic_year,
        newClass.firebase_id,
        newClass.is_firebase,
        newClass.is_ops,
        newClass.ops_created_by,
        newClass.standard,
        newClass.status,
      ]
    );
    return newClass;
  }

  async getClassById(id: string): Promise<TableTypes<"class"> | undefined> {
    return this.querySingle<TableTypes<"class">>(
      `SELECT * FROM ${TABLES.Class} WHERE id = ? AND coalesce(is_deleted,0)=0 LIMIT 1`,
      [id]
    );
  }

  async getClassesForSchool(
    schoolId: string
  ): Promise<TableTypes<"class">[]> {
    return this.queryAll<TableTypes<"class">>(
      `SELECT * FROM ${TABLES.Class}
       WHERE school_id = ? AND coalesce(is_deleted,0)=0
       ORDER BY created_at DESC`,
      [schoolId]
    );
  }

  async getClassesBySchoolId(
    schoolId: string
  ): Promise<TableTypes<"class">[]> {
    return this.getClassesForSchool(schoolId);
  }

  async getAllClassesBySchoolId(
    schoolId: string
  ): Promise<TableTypes<"class">[]> {
    return this.getClassesForSchool(schoolId);
  }

  async getClassByUserId(userId: string): Promise<TableTypes<"class">[]> {
    return this.queryAll<TableTypes<"class">>(
      `SELECT c.* FROM ${TABLES.ClassUser} cu
       JOIN ${TABLES.Class} c ON cu.class_id = c.id
       WHERE cu.user_id = ? AND coalesce(cu.is_deleted,0)=0 AND coalesce(c.is_deleted,0)=0`,
      [userId]
    );
  }

  async getClassCodeById(
    classId: string
  ): Promise<TableTypes<"class_invite_code"> | undefined> {
    return this.querySingle<TableTypes<"class_invite_code">>(
      `SELECT * FROM ${TABLES.ClassInvite_code}
       WHERE class_id = ? AND coalesce(is_deleted,0)=0
       ORDER BY created_at DESC
       LIMIT 1`,
      [classId]
    );
  }

  async getSchoolById(
    schoolId: string
  ): Promise<TableTypes<"school"> | undefined> {
    return this.querySingle<TableTypes<"school">>(
      `SELECT * FROM ${TABLES.School} WHERE id = ? AND coalesce(is_deleted,0)=0 LIMIT 1`,
      [schoolId]
    );
  }

  async getSchoolDetailsByUdise(
    udise: string
  ): Promise<TableTypes<"school"> | undefined> {
    return this.querySingle<TableTypes<"school">>(
      `SELECT * FROM ${TABLES.School} WHERE udise = ? AND coalesce(is_deleted,0)=0 LIMIT 1`,
      [udise]
    );
  }

  async requestNewSchool(
    name: string,
    state: string,
    district: string,
    city: string,
    image: File | null,
    udise_id?: string
  ): Promise<TableTypes<"req_new_school"> | null> {
    const currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!currentUser) throw new Error("User is not logged in");

    const existing = await this.querySingle<TableTypes<"req_new_school">>(
      `SELECT * FROM ${TABLES.ReqNewSchool}
       WHERE user_id = ? AND coalesce(is_deleted,0)=0 AND coalesce(is_resolved,0)=0
       ORDER BY created_at DESC
       LIMIT 1`,
      [currentUser.id]
    );
    if (existing) return existing;

    const requestId = uuidv4();
    const timestamp = new Date().toISOString();
    const imageUrl = image
      ? await this.addProfileImages(requestId, image, PROFILETYPE.SCHOOL)
      : null;

    const newRequest: TableTypes<"req_new_school"> = {
      id: requestId,
      user_id: currentUser.id,
      name,
      state,
      district,
      city,
      image: imageUrl ?? null,
      udise_id: udise_id ?? null,
      is_resolved: false,
      created_at: timestamp,
      updated_at: timestamp,
      is_deleted: false,
    };

    await this.execute(
      `INSERT INTO ${TABLES.ReqNewSchool} (id,user_id,name,state,district,city,image,udise_id,is_resolved,created_at,updated_at,is_deleted)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        newRequest.id,
        newRequest.user_id,
        newRequest.name,
        newRequest.state,
        newRequest.district,
        newRequest.city,
        newRequest.image,
        newRequest.udise_id,
        newRequest.is_resolved ? 1 : 0,
        newRequest.created_at,
        newRequest.updated_at,
        newRequest.is_deleted ? 1 : 0,
      ]
    );

    return newRequest;
  }

  async addUserToSchool(
    schoolId: string,
    user: TableTypes<"user">,
    role: RoleType
  ): Promise<void> {
    const existing = await this.querySingle<TableTypes<"school_user">>(
      `SELECT id FROM ${TABLES.SchoolUser}
       WHERE school_id = ? AND user_id = ? AND role = ? AND coalesce(is_deleted,0)=0
       LIMIT 1`,
      [schoolId, user.id, role]
    );
    if (existing) return;

    const timestamp = new Date().toISOString();
    await this.execute(
      `INSERT INTO ${TABLES.SchoolUser} (id,school_id,user_id,role,created_at,updated_at,is_deleted,is_firebase,is_ops,ops_created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        uuidv4(),
        schoolId,
        user.id,
        role,
        timestamp,
        timestamp,
        0,
        null,
        null,
        null,
      ]
    );
  }

  async deleteUserFromSchool(
    schoolId: string,
    userId: string,
    role: RoleType
  ): Promise<void> {
    const updatedAt = new Date().toISOString();
    await this.execute(
      `UPDATE ${TABLES.SchoolUser}
       SET is_deleted=1, updated_at=?
       WHERE school_id = ? AND user_id = ? AND role = ? AND coalesce(is_deleted,0)=0`,
      [updatedAt, schoolId, userId, role]
    );
  }

  async updateSchoolLastModified(schoolId: string): Promise<void> {
    await this.execute(
      `UPDATE ${TABLES.School} SET updated_at=? WHERE id=?`,
      [new Date().toISOString(), schoolId]
    );
  }

  async getExistingSchoolRequest(
    userId: string
  ): Promise<TableTypes<"req_new_school"> | null> {
    return (
      (await this.querySingle<TableTypes<"req_new_school">>(
        `SELECT * FROM ${TABLES.ReqNewSchool}
         WHERE user_id = ? AND coalesce(is_resolved,0)=0 AND coalesce(is_deleted,0)=0
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId]
      )) ?? null
    );
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
    country: string | null
  ): Promise<TableTypes<"school">> {
    const currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!currentUser) throw new Error("User is not Logged in");

    const schoolId = uuidv4();
    const timestamp = new Date().toISOString();
    const uploaded = image
      ? await this.addProfileImages(schoolId, image, PROFILETYPE.SCHOOL)
      : null;

    const newSchool: TableTypes<"school"> = {
      id: schoolId,
      name,
      group1: group1 ?? null,
      group2: group2 ?? null,
      group3: group3 ?? null,
      group4: group4 ?? null,
      program_id: program_id ?? null,
      udise: udise ?? null,
      address: address ?? null,
      country: country ?? null,
      image: uploaded ?? null,
      created_at: timestamp,
      updated_at: timestamp,
      is_deleted: false,
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
    };

    await this.execute(
      `INSERT INTO ${TABLES.School} (id,name,group1,group2,group3,group4,program_id,udise,address,country,image,created_at,updated_at,is_deleted,model,academic_year,firebase_id,is_firebase,is_ops,language,ops_created_by,student_login_type,status,key_contacts)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        newSchool.id,
        newSchool.name,
        newSchool.group1,
        newSchool.group2,
        newSchool.group3,
        newSchool.group4,
        newSchool.program_id,
        newSchool.udise,
        newSchool.address,
        newSchool.country,
        newSchool.image,
        newSchool.created_at,
        newSchool.updated_at,
        newSchool.is_deleted ? 1 : 0,
        newSchool.model,
        newSchool.academic_year,
        newSchool.firebase_id,
        newSchool.is_firebase,
        newSchool.is_ops,
        newSchool.language,
        newSchool.ops_created_by,
        newSchool.student_login_type,
        newSchool.status,
        newSchool.key_contacts,
      ]
    );

    await this.execute(
      `INSERT INTO ${TABLES.SchoolUser} (id,school_id,user_id,role,created_at,updated_at,is_deleted,is_firebase,is_ops,ops_created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        uuidv4(),
        schoolId,
        currentUser.id,
        RoleType.PRINCIPAL,
        timestamp,
        timestamp,
        0,
        null,
        null,
        null,
      ]
    );

    return newSchool;
  }

  async updateSchoolProfile(
    school: TableTypes<"school">,
    name: string,
    group1: string,
    group2: string,
    group3: string,
    image: File | null,
    group4?: string | null,
    program_id?: string | null,
    udise?: string | null,
    address?: string | null
  ): Promise<TableTypes<"school">> {
    const result = image
      ? await this.addProfileImages(school.id, image, PROFILETYPE.SCHOOL)
      : school.image;

    const updatedSchool: TableTypes<"school"> = {
      ...school,
      name: name ?? school.name,
      group1: group1 ?? school.group1,
      group2: group2 ?? school.group2,
      group3: group3 ?? school.group3,
      image: result ?? school.image,
      group4: group4 ?? school.group4,
      program_id: program_id ?? school.program_id,
      udise: udise ?? school.udise,
      address: address ?? school.address,
      updated_at: new Date().toISOString(),
      is_deleted: false,
    };

    await this.execute(
      `UPDATE ${TABLES.School}
       SET name=?, group1=?, group2=?, group3=?, image=?, group4=?, program_id=?, udise=?, address=?, updated_at=?, is_deleted=0
       WHERE id=?`,
      [
        updatedSchool.name,
        updatedSchool.group1,
        updatedSchool.group2,
        updatedSchool.group3,
        updatedSchool.image,
        updatedSchool.group4,
        updatedSchool.program_id,
        updatedSchool.udise,
        updatedSchool.address,
        updatedSchool.updated_at,
        updatedSchool.id,
      ]
    );

    return updatedSchool;
  }

  async getSchoolsForUser(
    userId: string
  ): Promise<{ school: TableTypes<"school">; role: RoleType }[]> {
    const rows = await this.queryAll<{
      school: TableTypes<"school">;
      role: RoleType;
    }>(
      `SELECT s.*, su.role FROM ${TABLES.SchoolUser} su
       JOIN ${TABLES.School} s ON su.school_id = s.id
       WHERE su.user_id = ? AND coalesce(su.is_deleted,0)=0 AND coalesce(s.is_deleted,0)=0`,
      [userId]
    );
    return rows.map((r) => ({ school: r.school ?? (r as any), role: r.role }));
  }

  async getSchoolsWithRoleAutouser(): Promise<TableTypes<"school">[]> {
    return this.queryAll<TableTypes<"school">>(
      `SELECT s.* FROM ${TABLES.SchoolUser} su
       JOIN ${TABLES.School} s ON su.school_id = s.id
       WHERE su.role = 'autouser' AND coalesce(su.is_deleted,0)=0 AND coalesce(s.is_deleted,0)=0`
    );
  }

  async getSchoolsForAdmin(): Promise<TableTypes<"school">[]> {
    return this.queryAll<TableTypes<"school">>(
      `SELECT * FROM ${TABLES.School} WHERE coalesce(is_deleted,0)=0`
    );
  }

  async getSchoolsByModel(
    model: string
  ): Promise<TableTypes<"school">[]> {
    return this.queryAll<TableTypes<"school">>(
      `SELECT * FROM ${TABLES.School} WHERE model = ? AND coalesce(is_deleted,0)=0`,
      [model]
    );
  }

  async getStudentsForClass(
    classId: string
  ): Promise<TableTypes<"user">[]> {
    return this.queryAll<TableTypes<"user">>(
      `SELECT u.* FROM ${TABLES.ClassUser} cu
       JOIN ${TABLES.User} u ON cu.user_id = u.id
       WHERE cu.class_id = ? AND cu.role = 'student'
         AND coalesce(cu.is_deleted,0)=0 AND coalesce(u.is_deleted,0)=0`,
      [classId]
    );
  }

  async getUsersByIds(ids: string[]): Promise<TableTypes<"user">[]> {
    if (!ids || ids.length === 0) return [];
    const { clause, params } = this.buildInClause(ids);
    return this.queryAll<TableTypes<"user">>(
      `SELECT * FROM ${TABLES.User} WHERE id IN ${clause} AND coalesce(is_deleted,0)=0`,
      params
    );
  }

  async getUserByDocId(
    id: string
  ): Promise<TableTypes<"user"> | undefined> {
    return this.querySingle<TableTypes<"user">>(
      `SELECT * FROM ${TABLES.User} WHERE id = ? AND coalesce(is_deleted,0)=0 LIMIT 1`,
      [id]
    );
  }

  async deleteUserFromClass(userId: string, class_id: string): Promise<void> {
    const updatedAt = new Date().toISOString();
    await this.execute(
      `UPDATE ${TABLES.ClassUser}
       SET is_deleted=1, updated_at=?
       WHERE user_id = ? AND class_id = ? AND coalesce(is_deleted,0)=0`,
      [updatedAt, userId, class_id]
    );
  }

  // ---------- Course helpers ----------
  async getCoursesByGrade(
    gradeId: string
  ): Promise<TableTypes<"course">[]> {
    return this.queryAll<TableTypes<"course">>(
      `SELECT * FROM ${TABLES.Course}
       WHERE grade_id = ? AND coalesce(is_deleted,0)=0
       ORDER BY sort_index ASC`,
      [gradeId]
    );
  }

  async getCourseByUserGradeId(
    gradeDocId: string | null | undefined,
    boardDocId: string | null | undefined
  ): Promise<TableTypes<"course">[]> {
    if (!gradeDocId || !boardDocId) return [];
    const gradeCourses = await this.getCoursesByGrade(gradeDocId);
    const curriculumCourses = gradeCourses.filter(
      (course) => course.curriculum_id === boardDocId
    );

    const subjectIds = curriculumCourses
      .map((course) => course.subject_id)
      .filter((id): id is string => !!id);

    const remainingSubjects = DEFAULT_SUBJECT_IDS.filter(
      (subjectId) => !subjectIds.includes(subjectId)
    );

    const otherCourses = gradeCourses.filter(
      (course) =>
        course.curriculum_id === OTHER_CURRICULUM &&
        course.subject_id &&
        remainingSubjects.includes(course.subject_id)
    );

    return [...curriculumCourses, ...otherCourses];
  }

  async getCoursesForParentsStudent(
    studentId: string
  ): Promise<TableTypes<"course">[]> {
    return this.queryAll<TableTypes<"course">>(
      `SELECT c.* FROM ${TABLES.UserCourse} uc
       JOIN ${TABLES.Course} c ON uc.course_id = c.id
       WHERE uc.user_id = ? AND coalesce(uc.is_deleted,0)=0 AND coalesce(c.is_deleted,0)=0
       ORDER BY c.sort_index ASC`,
      [studentId]
    );
  }

  async getAdditionalCourses(
    studentId: string
  ): Promise<TableTypes<"course">[]> {
    const existing = await this.queryAll<{ course_id: string }>(
      `SELECT course_id FROM ${TABLES.UserCourse}
       WHERE user_id = ? AND coalesce(is_deleted,0)=0`,
      [studentId]
    );
    const takenIds = existing.map((r) => r.course_id).filter(Boolean);
    if (!takenIds.length) {
      return this.queryAll<TableTypes<"course">>(
        `SELECT * FROM ${TABLES.Course} WHERE coalesce(is_deleted,0)=0`
      );
    }
    const { clause, params } = this.buildInClause(takenIds);
    return this.queryAll<TableTypes<"course">>(
      `SELECT * FROM ${TABLES.Course}
       WHERE coalesce(is_deleted,0)=0 AND id NOT IN ${clause}`,
      params
    );
  }

  async addCourseForParentsStudent(
    courses: TableTypes<"course">[],
    student: TableTypes<"user">
  ) {
    if (!courses.length) return;
    const now = new Date().toISOString();
    for (const course of courses) {
      await this.execute(
        `INSERT INTO ${TABLES.UserCourse} (id,user_id,course_id,is_deleted,created_at,updated_at,is_firebase)
         VALUES (?,?,?,?,?,?,?)`,
        [uuidv4(), student.id, course.id, 0, now, now, false]
      );
    }
  }

  async getCoursesForClassStudent(
    classId: string
  ): Promise<TableTypes<"course">[]> {
    return this.queryAll<TableTypes<"course">>(
      `SELECT c.* FROM ${TABLES.ClassCourse} cc
       JOIN ${TABLES.Course} c ON cc.course_id = c.id
       WHERE cc.class_id = ? AND coalesce(cc.is_deleted,0)=0 AND coalesce(c.is_deleted,0)=0
       ORDER BY c.sort_index ASC`,
      [classId]
    );
  }

  async checkCourseInClasses(
    classIds: string[],
    courseId: string
  ): Promise<boolean> {
    if (!classIds.length) return false;
    const { clause, params } = this.buildInClause(classIds);
    const row = await this.querySingle<{ count: number }>(
      `SELECT COUNT(1) as count FROM ${TABLES.ClassCourse}
       WHERE class_id IN ${clause} AND course_id = ? AND coalesce(is_deleted,0)=0`,
      [...params, courseId]
    );
    return (row?.count ?? 0) > 0;
  }

  async getDifferentGradesForCourse(course: TableTypes<"course">): Promise<{
    grades: TableTypes<"grade">[];
    courses: TableTypes<"course">[];
  }> {
    const courses = await this.queryAll<TableTypes<"course">>(
      `SELECT * FROM ${TABLES.Course}
       WHERE subject_id = ? AND curriculum_id = ? AND coalesce(is_deleted,0)=0
       ORDER BY sort_index ASC`,
      [course.subject_id, course.curriculum_id]
    );
    const gradeIds = Array.from(
      new Set(courses.map((c) => c.grade_id).filter(Boolean) as string[])
    );
    const grades = gradeIds.length
      ? await this.getGradesByIds(gradeIds)
      : [];
    return { grades, courses };
  }

  async getAllLessonsForCourse(
    courseId: string
  ): Promise<TableTypes<"lesson">[]> {
    return this.queryAll<TableTypes<"lesson">>(
      `SELECT DISTINCT l.* FROM ${TABLES.Chapter} ch
       JOIN ${TABLES.ChapterLesson} cl ON cl.chapter_id = ch.id
       JOIN ${TABLES.Lesson} l ON cl.lesson_id = l.id
       WHERE ch.course_id = ? AND coalesce(ch.is_deleted,0)=0
         AND coalesce(cl.is_deleted,0)=0 AND coalesce(l.is_deleted,0)=0`,
      [courseId]
    );
  }

  async getLessonFromChapter(
    chapterId: string,
    lessonId: string
  ): Promise<{
    lesson: TableTypes<"lesson">[];
    course: TableTypes<"course">[];
  }> {
    const rows = await this.queryAll<{
      lesson: TableTypes<"lesson">;
      course: TableTypes<"course">;
    }>(
      `SELECT l.*, c.* FROM ${TABLES.ChapterLesson} cl
       JOIN ${TABLES.Lesson} l ON cl.lesson_id = l.id
       JOIN ${TABLES.Chapter} ch ON cl.chapter_id = ch.id
       JOIN ${TABLES.Course} c ON ch.course_id = c.id
       WHERE cl.chapter_id = ? AND cl.lesson_id = ?
         AND coalesce(cl.is_deleted,0)=0 AND coalesce(l.is_deleted,0)=0 AND coalesce(c.is_deleted,0)=0`,
      [chapterId, lessonId]
    );
    const lesson = rows.length ? [rows[0].lesson as any as TableTypes<"lesson">] : [];
    const course = rows.length ? [rows[0].course as any as TableTypes<"course">] : [];
    return { lesson, course };
  }

  async getChapterByLesson(
    lessonId: string
  ): Promise<TableTypes<"chapter_lesson"> | undefined> {
    return this.querySingle<TableTypes<"chapter_lesson">>(
      `SELECT * FROM ${TABLES.ChapterLesson}
       WHERE lesson_id = ? AND coalesce(is_deleted,0)=0
       ORDER BY sort_index ASC LIMIT 1`,
      [lessonId]
    );
  }

  async searchLessons(searchString: string): Promise<TableTypes<"lesson">[]> {
    const like = `%${searchString}%`;
    return this.queryAll<TableTypes<"lesson">>(
      `SELECT * FROM ${TABLES.Lesson}
       WHERE coalesce(is_deleted,0)=0 AND (name LIKE ? OR outcome LIKE ?)
       ORDER BY created_at DESC`,
      [like, like]
    );
  }

  async getCoursesForPathway(
    studentId: string
  ): Promise<TableTypes<"course">[]> {
    const courseIds = await this.queryAll<{ course_id: string }>(
      `SELECT course_id FROM ${TABLES.UserCourse}
       WHERE user_id = ? AND coalesce(is_deleted,0)=0`,
      [studentId]
    );
    if (!courseIds.length) return [];
    const ids = courseIds.map((c) => c.course_id);
    const { clause, params } = this.buildInClause(ids);
    return this.queryAll<TableTypes<"course">>(
      `SELECT * FROM ${TABLES.Course}
       WHERE id IN ${clause} AND coalesce(is_deleted,0)=0
       ORDER BY sort_index ASC`,
      params
    );
  }

  async updateLearningPath(
    student: TableTypes<"user">,
    learning_path: string
  ): Promise<TableTypes<"user">> {
    await this.execute(
      `UPDATE ${TABLES.User} SET learning_path=? WHERE id=?`,
      [learning_path, student.id]
    );
    student.learning_path = learning_path;
    return student;
  }


  async updateClassCourseSelection(
    classId: string,
    selectedCourseIds: string[]
  ): Promise<void> {
    const now = new Date().toISOString();

    await Promise.all(
      selectedCourseIds.map(async (courseId) => {
        const existing = await this.querySingle<TableTypes<"class_course">>(
          `SELECT * FROM ${TABLES.ClassCourse}
           WHERE class_id = ? AND course_id = ?
           ORDER BY created_at DESC
           LIMIT 1`,
          [classId, courseId]
        );

        if (!existing) {
          await this.execute(
            `INSERT INTO ${TABLES.ClassCourse} (id,class_id,course_id,created_at,updated_at,is_deleted,is_firebase,is_ops,ops_created_by)
             VALUES (?,?,?,?,?,?,?,?,?)`,
            [uuidv4(), classId, courseId, now, now, 0, null, null, null]
          );
        } else if (existing.is_deleted) {
          await this.execute(
            `UPDATE ${TABLES.ClassCourse}
             SET is_deleted=0, updated_at=?
             WHERE id = ?`,
            [now, existing.id]
          );
        } else {
          await this.execute(
            `UPDATE ${TABLES.ClassCourse} SET updated_at=? WHERE id=?`,
            [now, existing.id]
          );
        }
      })
    );
  }

  async updateSchoolCourseSelection(
    schoolId: string,
    selectedCourseIds: string[]
  ): Promise<void> {
    const now = new Date().toISOString();

    await Promise.all(
      selectedCourseIds.map(async (courseId) => {
        const existing = await this.querySingle<TableTypes<"school_course">>(
          `SELECT * FROM ${TABLES.SchoolCourse}
           WHERE school_id = ? AND course_id = ?
           ORDER BY created_at DESC
           LIMIT 1`,
          [schoolId, courseId]
        );

        if (!existing) {
          await this.execute(
            `INSERT INTO ${TABLES.SchoolCourse} (id,school_id,course_id,created_at,updated_at,is_deleted,is_firebase,is_ops,ops_created_by)
             VALUES (?,?,?,?,?,?,?,?,?)`,
            [uuidv4(), schoolId, courseId, now, now, 0, null, null, null]
          );
        } else if (existing.is_deleted) {
          await this.execute(
            `UPDATE ${TABLES.SchoolCourse}
             SET is_deleted=0, updated_at=?
             WHERE id = ?`,
            [now, existing.id]
          );
        } else {
          await this.execute(
            `UPDATE ${TABLES.SchoolCourse} SET updated_at=? WHERE id=?`,
            [now, existing.id]
          );
        }
      })
    );
  }

  async removeCoursesFromClass(ids: string[]): Promise<void> {
    if (!ids.length) return;
    const updatedAt = new Date().toISOString();
    const { clause, params } = this.buildInClause(ids);
    await this.execute(
      `UPDATE ${TABLES.ClassCourse}
       SET is_deleted=1, updated_at=?
       WHERE id IN ${clause}`,
      [updatedAt, ...params]
    );
  }

  async removeCoursesFromSchool(ids: string[]): Promise<void> {
    if (!ids.length) return;
    const updatedAt = new Date().toISOString();
    const { clause, params } = this.buildInClause(ids);
    await this.execute(
      `UPDATE ${TABLES.SchoolCourse}
       SET is_deleted=1, updated_at=?
       WHERE id IN ${clause}`,
      [updatedAt, ...params]
    );
  }

  // ---------- Assignment helpers ----------
  async getAssignmentById(
    id: string
  ): Promise<TableTypes<"assignment"> | undefined> {
    return this.querySingle<TableTypes<"assignment">>(
      `SELECT * FROM ${TABLES.Assignment} WHERE id = ? AND coalesce(is_deleted,0)=0 LIMIT 1`,
      [id]
    );
  }

  async getAssignmentsByAssignerAndClass(
    assignerId: string,
    classId: string
  ): Promise<TableTypes<"assignment">[]> {
    return this.queryAll<TableTypes<"assignment">>(
      `SELECT * FROM ${TABLES.Assignment}
       WHERE created_by = ? AND class_id = ? AND coalesce(is_deleted,0)=0
       ORDER BY created_at DESC`,
      [assignerId, classId]
    );
  }

  async getAssignmentUserByAssignmentIds(
    assignmentIds: string[]
  ): Promise<TableTypes<"assignment_user">[]> {
    if (!assignmentIds?.length) return [];
    const { clause, params } = this.buildInClause(assignmentIds);
    return this.queryAll<TableTypes<"assignment_user">>(
      `SELECT * FROM ${TABLES.Assignment_user}
       WHERE assignment_id IN ${clause} AND coalesce(is_deleted,0)=0`,
      params
    );
  }

  async getResultByAssignmentIds(
    assignmentIds: string[]
  ): Promise<TableTypes<"result">[] | undefined> {
    if (!assignmentIds?.length) return [];
    const { clause, params } = this.buildInClause(assignmentIds);
    return this.queryAll<TableTypes<"result">>(
      `SELECT * FROM ${TABLES.Result}
       WHERE assignment_id IN ${clause} AND coalesce(is_deleted,0)=0`,
      params
    );
  }

  async getUserAssignmentCart(
    userId: string
  ): Promise<TableTypes<"assignment_cart"> | undefined> {
    return this.querySingle<TableTypes<"assignment_cart">>(
      `SELECT * FROM ${TABLES.Assignment_cart} WHERE id = ? AND coalesce(is_deleted,0)=0 LIMIT 1`,
      [userId]
    );
  }

  async getPendingAssignments(
    classId: string,
    studentId: string
  ): Promise<TableTypes<"assignment">[]> {
    // Class-wise or specific to student, excluding results for student
    return this.queryAll<TableTypes<"assignment">>(
      `SELECT DISTINCT a.* FROM ${TABLES.Assignment} a
       LEFT JOIN ${TABLES.Assignment_user} au ON au.assignment_id = a.id
       LEFT JOIN ${TABLES.Result} r ON r.assignment_id = a.id AND r.student_id = ?
       WHERE a.class_id = ? AND coalesce(a.is_deleted,0)=0
         AND (a.is_class_wise = 1 OR au.user_id = ?)
         AND r.id IS NULL
       ORDER BY a.created_at DESC`,
      [studentId, classId, studentId]
    );
  }

  async getPendingAssignmentForLesson(
    lessonId: string,
    classId: string,
    studentId: string
  ): Promise<TableTypes<"assignment"> | undefined> {
    const rows = await this.queryAll<TableTypes<"assignment">>(
      `SELECT DISTINCT a.* FROM ${TABLES.Assignment} a
       LEFT JOIN ${TABLES.Assignment_user} au ON au.assignment_id = a.id
       LEFT JOIN ${TABLES.Result} r ON r.assignment_id = a.id AND r.student_id = ?
       WHERE a.lesson_id = ? AND a.class_id = ? AND coalesce(a.is_deleted,0)=0
         AND (a.is_class_wise = 1 OR au.user_id = ?)
         AND r.id IS NULL
       ORDER BY a.updated_at DESC, a.created_at DESC
       LIMIT 1`,
      [studentId, lessonId, classId, studentId]
    );
    return rows[0];
  }

  async pushAssignmentCart(data: { [key: string]: any }, id: string) {
    const now = new Date().toISOString();
    await this.execute(
      `INSERT INTO ${TABLES.Assignment_cart} (id,lessons,source,created_at,updated_at,is_deleted,is_firebase)
       VALUES (?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET
         lessons=excluded.lessons,
         source=excluded.source,
         updated_at=excluded.updated_at`,
      [
        id,
        data.lessons ?? null,
        data.source ?? null,
        now,
        now,
        0,
        null,
      ]
    );
  }

  async createOrUpdateAssignmentCart(
    userId: string,
    lessons: string
  ): Promise<boolean | undefined> {
    const now = new Date().toISOString();
    await this.execute(
      `INSERT INTO ${TABLES.Assignment_cart} (id,lessons,updated_at,created_at,is_deleted,is_firebase)
       VALUES (?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET lessons=excluded.lessons, updated_at=excluded.updated_at`,
      [userId, lessons, now, now, 0, null]
    );
    return true;
  }

  async updateFavoriteLesson(
    studentId: string,
    lessonId: string
  ): Promise<TableTypes<"favorite_lesson">> {
    const now = new Date().toISOString();
    const existing = await this.querySingle<TableTypes<"favorite_lesson">>(
      `SELECT * FROM ${TABLES.FavoriteLesson}
       WHERE user_id = ? AND lesson_id = ? AND coalesce(is_deleted,0)=0
       LIMIT 1`,
      [studentId, lessonId]
    );

    const favorite: TableTypes<"favorite_lesson"> = {
      id: existing?.id ?? uuidv4(),
      lesson_id: lessonId,
      user_id: studentId,
      created_at: existing?.created_at ?? now,
      updated_at: now,
      is_deleted: false,
      is_firebase: null,
    };

    await this.execute(
      `INSERT INTO ${TABLES.FavoriteLesson} (id,lesson_id,user_id,created_at,updated_at,is_deleted,is_firebase)
       VALUES (?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET
         updated_at=excluded.updated_at,
         is_deleted=excluded.is_deleted`,
      [
        favorite.id,
        favorite.lesson_id,
        favorite.user_id,
        favorite.created_at,
        favorite.updated_at,
        0,
        favorite.is_firebase,
      ]
    );

    return favorite;
  }

  async getLiveQuizLessons(
    classId: string,
    studentId: string
  ): Promise<TableTypes<"assignment">[]> {
    const now = new Date().toISOString();
    return this.queryAll<TableTypes<"assignment">>(
      `SELECT DISTINCT a.* FROM ${TABLES.Assignment} a
       LEFT JOIN ${TABLES.Assignment_user} au ON au.assignment_id = a.id
       LEFT JOIN ${TABLES.Result} r ON r.assignment_id = a.id AND r.student_id = ?
       WHERE a.class_id = ? AND a.type = ? AND coalesce(a.is_deleted,0)=0
         AND a.starts_at <= ? AND a.ends_at > ?
         AND (a.is_class_wise = 1 OR au.user_id = ?)
         AND r.id IS NULL
       ORDER BY a.created_at DESC`,
      [studentId, classId, LIVE_QUIZ, now, now, studentId]
    );
  }

  async getLiveQuizRoomDoc(
    liveQuizRoomDocId: string
  ): Promise<TableTypes<"live_quiz_room"> | undefined> {
    return this.querySingle<TableTypes<"live_quiz_room">>(
      `SELECT * FROM ${TABLES.Live_quiz_room}
       WHERE id = ? LIMIT 1`,
      [liveQuizRoomDocId]
    );
  }

  async updateLiveQuiz(
    roomDocId: string,
    studentId: string,
    questionId: string,
    timeSpent: number,
    score: number
  ): Promise<void> {
    const now = new Date().toISOString();
    await this.execute(
      `UPDATE ${TABLES.Live_quiz_room}
       SET updated_at = ?, results = json_set(coalesce(results,'{}'), ?, json(?))
       WHERE id = ?`,
      [now, `$.${studentId}.${questionId}`, JSON.stringify({ timeSpent, score }), roomDocId]
    );
  }

  async joinLiveQuiz(
    assignmentId: string,
    studentId: string
  ): Promise<string | undefined> {
    const room = await this.querySingle<TableTypes<"live_quiz_room">>(
      `SELECT * FROM ${TABLES.Live_quiz_room}
       WHERE assignment_id = ? AND coalesce(is_deleted,0)=0
       ORDER BY created_at DESC LIMIT 1`,
      [assignmentId]
    );

    if (!room) return undefined;

    const participants = room.participants
      ? JSON.parse(room.participants as any)
      : [];
    if (!participants.includes(studentId)) {
      participants.push(studentId);
      await this.execute(
        `UPDATE ${TABLES.Live_quiz_room}
         SET participants = ?, updated_at = ?
         WHERE id = ?`,
        [JSON.stringify(participants), new Date().toISOString(), room.id]
      );
    }
    return room.id;
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
  ): Promise<TableTypes<"result">> {
    const resultId = uuidv4();
    const now = new Date().toISOString();

    const newResult: TableTypes<"result"> = {
      id: resultId,
      assignment_id: assignmentId ?? null,
      correct_moves: correctMoves,
      lesson_id: lessonId,
      school_id: schoolId ?? null,
      score,
      student_id: studentId,
      time_spent: timeSpent,
      wrong_moves: wrongMoves,
      created_at: now,
      updated_at: now,
      is_deleted: false,
      chapter_id: chapterId,
      course_id: courseId ?? null,
      class_id: classId ?? null,
      firebase_id: null,
      is_firebase: null,
    };

    await this.execute(
      `INSERT INTO ${TABLES.Result} (id,assignment_id,correct_moves,lesson_id,school_id,score,student_id,time_spent,wrong_moves,created_at,updated_at,is_deleted,chapter_id,course_id,class_id,firebase_id,is_firebase)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
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
        newResult.is_deleted ? 1 : 0,
        newResult.chapter_id,
        newResult.course_id,
        newResult.class_id,
        newResult.firebase_id,
        newResult.is_firebase,
      ]
    );

    let currentStars = 0;
    const previousStarsRaw = localStorage.getItem(STARS_COUNT);
    if (previousStarsRaw) {
      try {
        currentStars = JSON.parse(previousStarsRaw)[studentId] ?? 0;
      } catch {
        currentStars = 0;
      }
    }
    let starsEarned = 0;
    if (score > 25) starsEarned++;
    if (score > 50) starsEarned++;
    if (score > 75) starsEarned++;
    const totalStars = currentStars + starsEarned;
    await this.execute(
      `UPDATE ${TABLES.User} SET stars=? WHERE id=?`,
      [totalStars, studentId]
    );

    const updatedStudent = await this.getUserByDocId(studentId);
    if (updatedStudent) {
      await Util.setCurrentStudent(updatedStudent);
    }

    return newResult;
  }

  async getStudentResult(
    studentId: string
  ): Promise<TableTypes<"result">[]> {
    return this.queryAll<TableTypes<"result">>(
      `SELECT * FROM ${TABLES.Result}
       WHERE student_id = ? AND coalesce(is_deleted,0)=0`,
      [studentId]
    );
  }

  async getStudentResultByDate(
    studentId: string,
    startDate: string,
    endDate: string
  ): Promise<TableTypes<"result">[]> {
    return this.queryAll<TableTypes<"result">>(
      `SELECT * FROM ${TABLES.Result}
       WHERE student_id = ? AND coalesce(is_deleted,0)=0
         AND created_at >= ? AND created_at <= ?`,
      [studentId, startDate, endDate]
    );
  }

  async getStudentLastTenResults(
    studentId: string
  ): Promise<TableTypes<"result">[]> {
    return this.queryAll<TableTypes<"result">>(
      `SELECT * FROM ${TABLES.Result}
       WHERE student_id = ? AND coalesce(is_deleted,0)=0
       ORDER BY created_at DESC
       LIMIT 10`,
      [studentId]
    );
  }

  async getStudentProgress(studentId: string): Promise<Map<string, string>> {
    const rows = await this.queryAll<{
      lesson_id: string;
      chapter_id: string | null;
    }>(
      `SELECT lesson_id, chapter_id FROM ${TABLES.Result}
       WHERE student_id = ? AND coalesce(is_deleted,0)=0`,
      [studentId]
    );
    const map = new Map<string, string>();
    rows.forEach(({ lesson_id, chapter_id }) => {
      if (lesson_id && chapter_id) {
        map.set(lesson_id, chapter_id);
      }
    });
    return map;
  }

  async getStudentResultInMap(
    studentId: string
  ): Promise<Map<string, StudentLessonResult> | undefined> {
    const rows = await this.queryAll<TableTypes<"result">>(
      `SELECT * FROM ${TABLES.Result}
       WHERE student_id = ? AND coalesce(is_deleted,0)=0`,
      [studentId]
    );
    if (!rows.length) return new Map();
    const map = new Map<string, StudentLessonResult>();
    rows.forEach((r) => {
      map.set(r.lesson_id, {
        correctMoves: r.correct_moves ?? 0,
        wrongMoves: r.wrong_moves ?? 0,
        score: r.score ?? 0,
        timeSpent: r.time_spent ?? 0,
        chapter: r.chapter_id ?? "",
        course: r.course_id ?? "",
        classId: r.class_id ?? "",
        schoolId: r.school_id ?? "",
        assignment: r.assignment_id ?? "",
      });
    });
    return map;
  }

  async getAssignmentOrLiveQuizByClassByDate(
    classId: string,
    type: "assignment" | "live_quiz",
    date: string
  ): Promise<TableTypes<"assignment">[]> {
    return this.queryAll<TableTypes<"assignment">>(
      `SELECT * FROM ${TABLES.Assignment}
       WHERE class_id = ? AND type = ? AND coalesce(is_deleted,0)=0
         AND starts_at <= ? AND ends_at >= ?
       ORDER BY created_at DESC`,
      [classId, type, date, date]
    );
  }

  async getLessonsBylessonIds(
    lessonIds: string[]
  ): Promise<TableTypes<"lesson">[]> {
    if (!lessonIds.length) return [];
    const { clause, params } = this.buildInClause(lessonIds);
    return this.queryAll<TableTypes<"lesson">>(
      `SELECT * FROM ${TABLES.Lesson}
       WHERE id IN ${clause} AND coalesce(is_deleted,0)=0`,
      params
    );
  }

  async getLastAssignmentsForRecommendations(
    classId: string
  ): Promise<TableTypes<"assignment">[] | undefined> {
    return this.queryAll<TableTypes<"assignment">>(
      `SELECT * FROM ${TABLES.Assignment}
       WHERE class_id = ? AND coalesce(is_deleted,0)=0
       ORDER BY created_at DESC`,
      [classId]
    );
  }

  // ---------- Remaining student methods ----------
  async getStudentClassesAndSchools(userId: string): Promise<{
    classes: TableTypes<"class">[];
    schools: TableTypes<"school">[];
  }> {
    const classRows = await this.queryAll<{
      class_id: string;
      class: TableTypes<"class">;
      school: TableTypes<"school">;
    }>(
      `SELECT cu.class_id,
              c.*,
              s.*
       FROM ${TABLES.ClassUser} cu
       JOIN ${TABLES.Class} c ON cu.class_id = c.id
       JOIN ${TABLES.School} s ON c.school_id = s.id
       WHERE cu.user_id = ? AND cu.role = ? AND coalesce(cu.is_deleted,0)=0`,
      [userId, RoleType.STUDENT]
    );

    const classes: TableTypes<"class">[] = [];
    const schoolMap = new Map<string, TableTypes<"school">>();
    classRows.forEach((row: any) => {
      const cls = {
        id: row.id,
        name: row.name,
        image: row.image,
        school_id: row.school_id,
        group_id: row.group_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        is_deleted: row.is_deleted,
        academic_year: row.academic_year,
        firebase_id: row.firebase_id,
        is_firebase: row.is_firebase,
        is_ops: row.is_ops,
        ops_created_by: row.ops_created_by,
        standard: row.standard,
        status: row.status,
      } as TableTypes<"class">;
      classes.push(cls);
      // school fields come after class columns, but easiest is to requery by id
      if (row.school_id && !schoolMap.has(row.school_id)) {
        schoolMap.set(row.school_id, {
          id: row.school_id,
          name: row.school_name ?? row.name, // fallback
          group1: row.group1,
          group2: row.group2,
          group3: row.group3,
          group4: row.group4,
          image: row.school_image ?? row.image,
          program_id: row.program_id,
          udise: row.udise,
          address: row.address,
          created_at: row.school_created_at ?? row.created_at,
          updated_at: row.school_updated_at ?? row.updated_at,
          is_deleted: row.school_is_deleted ?? row.is_deleted,
          model: row.model,
          academic_year: row.academic_year,
          firebase_id: row.firebase_id,
          is_firebase: row.is_firebase,
          is_ops: row.is_ops,
          language: row.language,
          ops_created_by: row.ops_created_by,
          student_login_type: row.student_login_type,
          status: row.status,
          key_contacts: row.key_contacts,
          country: row.country,
        } as TableTypes<"school">);
      }
    });

    return { classes, schools: Array.from(schoolMap.values()) };
  }

  async isStudentLinked(studentId: string): Promise<boolean> {
    const row = await this.querySingle<{ count: number }>(
      `SELECT COUNT(1) as count FROM ${TABLES.ClassUser}
       WHERE user_id = ? AND role = ? AND coalesce(is_deleted,0)=0`,
      [studentId, RoleType.STUDENT]
    );
    return (row?.count ?? 0) > 0;
  }

  async getStudentInfoBySchoolId(
    schoolId: string
  ): Promise<TableTypes<"user">[]> {
    return this.queryAll<TableTypes<"user">>(
      `SELECT u.* FROM ${TABLES.ClassUser} cu
       JOIN ${TABLES.Class} c ON cu.class_id = c.id
       JOIN ${TABLES.User} u ON cu.user_id = u.id
       WHERE c.school_id = ? AND cu.role = ? AND coalesce(cu.is_deleted,0)=0 AND coalesce(u.is_deleted,0)=0`,
      [schoolId, RoleType.STUDENT]
    );
  }

  async getStudentsAndParentsByClassId(
    classId: string
  ): Promise<
    {
      student: TableTypes<"user">;
      parent: TableTypes<"parent_user"> | null;
    }[]
  > {
    const students = await this.queryAll<TableTypes<"user">>(
      `SELECT u.* FROM ${TABLES.ClassUser} cu
       JOIN ${TABLES.User} u ON cu.user_id = u.id
       WHERE cu.class_id = ? AND cu.role = ? AND coalesce(cu.is_deleted,0)=0 AND coalesce(u.is_deleted,0)=0`,
      [classId, RoleType.STUDENT]
    );
    const parents = await this.queryAll<TableTypes<"parent_user">>(
      `SELECT * FROM ${TABLES.ParentUser}
       WHERE is_deleted = 0`
    );
    const parentMap = new Map<string, TableTypes<"parent_user">>();
    parents.forEach((p) => parentMap.set(p.student_id, p));
    return students.map((s) => ({
      student: s,
      parent: parentMap.get(s.id) ?? null,
    }));
  }

  async getStudentAndParentByStudentId(
    studentId: string
  ): Promise<{
    student: TableTypes<"user">;
    parent: TableTypes<"parent_user"> | null;
  } | null> {
    const student = await this.getUserByDocId(studentId);
    if (!student) return null;
    const parent = await this.querySingle<TableTypes<"parent_user">>(
      `SELECT * FROM ${TABLES.ParentUser}
       WHERE student_id = ? AND coalesce(is_deleted,0)=0
       LIMIT 1`,
      [studentId]
    );
    return { student, parent: parent ?? null };
  }

  async updateStudent(
    student: TableTypes<"user">,
    name: string,
    age: number,
    gender: string,
    avatar: string,
    image: string | undefined,
    boardDocId: string | undefined,
    gradeDocId: string | undefined,
    languageDocId: string
  ): Promise<TableTypes<"user">> {
    const updatedFields = {
      name,
      age,
      gender,
      avatar,
      image: image ?? null,
      curriculum_id: boardDocId,
      grade_id: gradeDocId,
      language_id: languageDocId,
    };

    await this.execute(
      `UPDATE ${TABLES.User}
       SET name=?, age=?, gender=?, avatar=?, image=?, curriculum_id=?, grade_id=?, language_id=?
       WHERE id=?`,
      [
        updatedFields.name,
        updatedFields.age,
        updatedFields.gender,
        updatedFields.avatar,
        updatedFields.image,
        updatedFields.curriculum_id,
        updatedFields.grade_id,
        updatedFields.language_id,
        student.id,
      ]
    );
    Object.assign(student, updatedFields);

    const courses =
      gradeDocId && boardDocId
        ? await this.getCourseByUserGradeId(gradeDocId, boardDocId)
        : [];
    if (courses && courses.length > 0) {
      const courseIds = courses.map((c) => c.id);
      const { clause, params } = this.buildInClause(courseIds);
      const existing = await this.queryAll<{ course_id: string }>(
        `SELECT course_id FROM ${TABLES.UserCourse}
         WHERE user_id = ? AND course_id IN ${clause} AND coalesce(is_deleted,0)=0`,
        [student.id, ...params]
      );
      const existingSet = new Set(existing.map((e) => e.course_id));
      const now = new Date().toISOString();
      for (const course of courses) {
        if (!existingSet.has(course.id)) {
          await this.execute(
            `INSERT INTO ${TABLES.UserCourse} (id,user_id,course_id,is_deleted,created_at,updated_at,is_firebase)
             VALUES (?,?,?,?,?,?,?)`,
            [uuidv4(), student.id, course.id, 0, now, now, null]
          );
        }
      }
    }

    return student;
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
    const now = new Date().toISOString();
    const updatedFields = {
      name,
      age,
      gender,
      avatar,
      image: image ?? null,
      curriculum_id: boardDocId,
      grade_id: gradeDocId,
      language_id: languageDocId,
      student_id: student.student_id ?? student_id ?? null,
      updated_at: now,
    };

    await this.execute(
      `UPDATE ${TABLES.User}
       SET name=?, age=?, gender=?, avatar=?, image=?, curriculum_id=?, grade_id=?, language_id=?, student_id=?, updated_at=?
       WHERE id=?`,
      [
        updatedFields.name,
        updatedFields.age,
        updatedFields.gender,
        updatedFields.avatar,
        updatedFields.image,
        updatedFields.curriculum_id,
        updatedFields.grade_id,
        updatedFields.language_id,
        updatedFields.student_id,
        updatedFields.updated_at,
        student.id,
      ]
    );

    const currentClassUser = await this.querySingle<{
      id: string;
      class_id: string;
    }>(
      `SELECT id,class_id FROM ${TABLES.ClassUser}
       WHERE user_id = ? AND coalesce(is_deleted,0)=0
       ORDER BY created_at DESC
       LIMIT 1`,
      [student.id]
    );

    if (!currentClassUser || currentClassUser.class_id !== newClassId) {
      if (currentClassUser) {
        await this.execute(
          `UPDATE ${TABLES.ClassUser}
           SET is_deleted=1, updated_at=?
           WHERE id=?`,
          [now, currentClassUser.id]
        );
      }
      await this.execute(
        `INSERT INTO ${TABLES.ClassUser} (id,class_id,user_id,role,created_at,updated_at,is_deleted,is_firebase,is_ops,ops_created_by)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [
          uuidv4(),
          newClassId,
          student.id,
          RoleType.STUDENT,
          now,
          now,
          0,
          null,
          null,
          null,
        ]
      );
    }

    return { ...student, ...updatedFields };
  }

  async linkStudent(inviteCode: number, studentId: string): Promise<any> {
    // Placeholder: PowerSync cannot run Supabase RPC, so perform a lightweight lookup by class_invite_code.
    const codeRow = await this.querySingle<TableTypes<"class_invite_code">>(
      `SELECT * FROM ${TABLES.ClassInvite_code}
       WHERE code = ? AND coalesce(is_deleted,0)=0
       ORDER BY created_at DESC
       LIMIT 1`,
      [inviteCode]
    );
    if (!codeRow) {
      throw new Error("Invalid invite code");
    }
    const now = new Date().toISOString();
    await this.execute(
      `INSERT INTO ${TABLES.ClassUser} (id,class_id,user_id,role,created_at,updated_at,is_deleted,is_firebase,is_ops,ops_created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        uuidv4(),
        codeRow.class_id,
        studentId,
        RoleType.STUDENT,
        now,
        now,
        0,
        null,
        null,
        null,
      ]
    );
    return { class_id: codeRow.class_id };
  }

  async getAssignedStudents(assignmentId: string): Promise<string[]> {
    const rows = await this.queryAll<{ user_id: string }>(
      `SELECT au.user_id FROM ${TABLES.Assignment_user} au
       WHERE au.assignment_id = ? AND coalesce(au.is_deleted,0)=0`,
      [assignmentId]
    );
    return rows.map((r) => r.user_id);
  }

  async updateStudentStars(
    studentId: string,
    stars: number
  ): Promise<void> {
    await this.execute(
      `UPDATE ${TABLES.User} SET stars=? WHERE id=?`,
      [stars, studentId]
    );
  }

  async setStarsForStudents(
    studentIds: string[],
    stars: number
  ): Promise<void> {
    if (!studentIds.length) return;
    const { clause, params } = this.buildInClause(studentIds);
    await this.execute(
      `UPDATE ${TABLES.User} SET stars=? WHERE id IN ${clause}`,
      [stars, ...params]
    );
  }

  async createAutoProfile(): Promise<TableTypes<"user"> | undefined> {
    const user = await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!user) return;
    const now = new Date().toISOString();
    const studentId = uuidv4();
    const auto: TableTypes<"user"> = {
      id: studentId,
      name: user.name ?? "Student",
      age: null,
      gender: null,
      avatar: null,
      image: user.image ?? null,
      curriculum_id: null,
      grade_id: null,
      language_id: null,
      created_at: now,
      updated_at: now,
      is_deleted: false,
      email: user.email ?? null,
      phone: user.phone ?? null,
      is_tc_accepted: true,
      firebase_id: null,
      is_firebase: null,
      is_ops: null,
      learning_path: null,
      ops_created_by: null,
      reward: null,
      stars: null,
      student_id: null,
      fcm_token: null,
      music_off: false,
      sfx_off: false,
    };
    await this.execute(
      `INSERT INTO ${TABLES.User} (id,name,age,gender,avatar,image,curriculum_id,grade_id,language_id,created_at,updated_at,is_deleted,email,phone,is_tc_accepted,firebase_id,is_firebase,is_ops,learning_path,ops_created_by,reward,stars,student_id,fcm_token,music_off,sfx_off)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        auto.id,
        auto.name,
        auto.age,
        auto.gender,
        auto.avatar,
        auto.image,
        auto.curriculum_id,
        auto.grade_id,
        auto.language_id,
        auto.created_at,
        auto.updated_at,
        auto.is_deleted ? 1 : 0,
        auto.email,
        auto.phone,
        auto.is_tc_accepted ? 1 : 0,
        auto.firebase_id,
        auto.is_firebase,
        auto.is_ops,
        auto.learning_path,
        auto.ops_created_by,
        auto.reward,
        auto.stars,
        auto.student_id,
        auto.fcm_token,
        auto.music_off ? 1 : 0,
        auto.sfx_off ? 1 : 0,
      ]
    );
    return auto;
  }
  // ---------- Misc uploads ----------
  async addProfileImages(
    id: string,
    file: File,
    profileType: PROFILETYPE
  ): Promise<string | null> {
    // PowerSync does not handle blob storage; delegate to Supabase storage client.
    return super.addProfileImages(id, file, profileType);
  }

  async uploadData(payload: any): Promise<boolean | null> {
    const currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    const uploadId = uuidv4();
    const now = new Date().toISOString();

    await this.execute(
      `INSERT INTO ${TABLES.Upload_queue} (id,payload,uploading_user,status,created_at,updated_at,is_locked)
       VALUES (?,?,?,?,?,?,?)`,
      [
        uploadId,
        JSON.stringify(payload),
        currentUser?.id ?? null,
        "queued",
        now,
        now,
        0,
      ]
    );
    return true;
  }

  // ---------- Sticker / Badge / Reward helpers ----------
  async getBadgesByIds(ids: string[]): Promise<TableTypes<"badge">[]> {
    if (!ids.length) return [];
    const { clause, params } = this.buildInClause(ids);
    return this.queryAll<TableTypes<"badge">>(
      `SELECT * FROM ${TABLES.Badge}
       WHERE id IN ${clause} AND coalesce(is_deleted,0)=0`,
      params
    );
  }

  async getStickersByIds(ids: string[]): Promise<TableTypes<"sticker">[]> {
    if (!ids.length) return [];
    const { clause, params } = this.buildInClause(ids);
    return this.queryAll<TableTypes<"sticker">>(
      `SELECT * FROM ${TABLES.Sticker}
       WHERE id IN ${clause} AND coalesce(is_deleted,0)=0`,
      params
    );
  }

  async getRewardsById(
    id: number,
    periodType: string
  ): Promise<TableTypes<"reward"> | undefined> {
    const row = await this.querySingle<Record<string, any>>(
      `SELECT ${periodType} FROM ${TABLES.Reward} WHERE year = ? LIMIT 1`,
      [id]
    );
    if (!row || !row[periodType]) return;
    try {
      return JSON.parse(row[periodType]);
    } catch {
      return;
    }
  }

  async getUserSticker(userId: string): Promise<TableTypes<"user_sticker">[]> {
    return this.queryAll<TableTypes<"user_sticker">>(
      `SELECT * FROM ${TABLES.UserSticker}
       WHERE user_id = ? AND coalesce(is_deleted,0)=0`,
      [userId]
    );
  }

  async getUserBadge(userId: string): Promise<TableTypes<"user_badge">[]> {
    return this.queryAll<TableTypes<"user_badge">>(
      `SELECT * FROM ${TABLES.UserBadge}
       WHERE user_id = ? AND coalesce(is_deleted,0)=0`,
      [userId]
    );
  }

  async getUserBonus(userId: string): Promise<TableTypes<"user_bonus">[]> {
    return this.queryAll<TableTypes<"user_bonus">>(
      `SELECT * FROM ${TABLES.UserBonus}
       WHERE user_id = ? AND coalesce(is_deleted,0)=0`,
      [userId]
    );
  }

  async updateRewardAsSeen(studentId: string): Promise<void> {
    await this.execute(
      `UPDATE ${TABLES.UserSticker}
       SET is_seen=1
       WHERE user_id = ? AND coalesce(is_seen,0)=0 AND coalesce(is_deleted,0)=0`,
      [studentId]
    );
  }

  // ---------- User utilities ----------
  async getUserByEmail(
    email: string
  ): Promise<TableTypes<"user"> | undefined> {
    return this.querySingle<TableTypes<"user">>(
      `SELECT * FROM ${TABLES.User}
       WHERE LOWER(email) = LOWER(?) AND coalesce(is_deleted,0)=0
       LIMIT 1`,
      [email]
    );
  }

  async getUserByPhoneNumber(
    phone: string
  ): Promise<TableTypes<"user"> | undefined> {
    return this.querySingle<TableTypes<"user">>(
      `SELECT * FROM ${TABLES.User}
       WHERE phone = ? AND coalesce(is_deleted,0)=0
       LIMIT 1`,
      [phone]
    );
  }

  async isUserTeacher(userId: string): Promise<boolean> {
    const row = await this.querySingle<{ count: number }>(
      `SELECT COUNT(1) as count FROM ${TABLES.ClassUser}
       WHERE user_id = ? AND role = ? AND coalesce(is_deleted,0)=0`,
      [userId, RoleType.TEACHER]
    );
    return (row?.count ?? 0) > 0;
  }

  async getUserRoleForSchool(
    userId: string,
    schoolId: string
  ): Promise<RoleType | undefined> {
    const row = await this.querySingle<{ role: RoleType }>(
      `SELECT role FROM ${TABLES.SchoolUser}
       WHERE user_id = ? AND school_id = ? AND coalesce(is_deleted,0)=0
       LIMIT 1`,
      [userId, schoolId]
    );
    return row?.role;
  }

  public async updateUserProfile(
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
    const updatedFields: Record<string, any> = {
      name: fullName,
      email,
      phone: phoneNum,
      language_id: languageDocId,
      image: profilePic ?? null,
    };

    if (options?.age !== undefined) {
      const parsedAge = parseInt(options.age, 10);
      if (!isNaN(parsedAge)) {
        updatedFields.age = parsedAge;
      }
    }

    if (options?.gender !== undefined) {
      updatedFields.gender = options.gender;
    }

    await this.execute(
      `UPDATE ${TABLES.User}
       SET name=?, email=?, phone=?, language_id=?, image=?, age=?, gender=?
       WHERE id=?`,
      [
        updatedFields.name,
        updatedFields.email,
        updatedFields.phone,
        updatedFields.language_id,
        updatedFields.image,
        updatedFields.age ?? user.age,
        updatedFields.gender ?? user.gender,
        user.id,
      ]
    );
    Object.assign(user, updatedFields);

    return user;
  }

  async updateUserLastModified(userId: string): Promise<void> {
    await this.execute(
      `UPDATE ${TABLES.User} SET updated_at=? WHERE id=?`,
      [new Date().toISOString(), userId]
    );
  }

  async getUserSpecialRoles(
    userId: string
  ): Promise<TableTypes<"special_users">[]> {
    return this.queryAll<TableTypes<"special_users">>(
      `SELECT * FROM ${TABLES.SpecialUsers}
       WHERE user_id = ? AND coalesce(is_deleted,0)=0`,
      [userId]
    );
  }

  async updateSpecialUserRole(
    userId: string,
    role: string
  ): Promise<void> {
    const existing = await this.querySingle<TableTypes<"special_users">>(
      `SELECT * FROM ${TABLES.SpecialUsers}
       WHERE user_id = ? AND coalesce(is_deleted,0)=0
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    const now = new Date().toISOString();
    if (existing) {
      await this.execute(
        `UPDATE ${TABLES.SpecialUsers}
         SET role=?, updated_at=? WHERE id=?`,
        [role, now, existing.id]
      );
    } else {
      await this.execute(
        `INSERT INTO ${TABLES.SpecialUsers} (id,user_id,role,created_at,updated_at,is_deleted)
         VALUES (?,?,?,?,?,?)`,
        [uuidv4(), userId, role, now, now, 0]
      );
    }
  }

  async deleteSpecialUser(userId: string): Promise<void> {
    const now = new Date().toISOString();
    await this.execute(
      `UPDATE ${TABLES.SpecialUsers}
       SET is_deleted=1, updated_at=?
       WHERE user_id = ? AND coalesce(is_deleted,0)=0`,
      [now, userId]
    );
  }

  // ---------- Teacher / class / school helpers ----------
  async getTeachersForSchools(
    schoolIds: string[]
  ): Promise<TableTypes<"user">[]> {
    if (!schoolIds.length) return [];
    const { clause, params } = this.buildInClause(schoolIds);
    return this.queryAll<TableTypes<"user">>(
      `SELECT DISTINCT u.* FROM ${TABLES.SchoolUser} su
       JOIN ${TABLES.User} u ON su.user_id = u.id
       WHERE su.school_id IN ${clause} AND su.role = 'teacher'
         AND coalesce(su.is_deleted,0)=0 AND coalesce(u.is_deleted,0)=0`,
      params
    );
  }

  async getStudentsForSchools(
    schoolIds: string[]
  ): Promise<TableTypes<"user">[]> {
    if (!schoolIds.length) return [];
    const { clause, params } = this.buildInClause(schoolIds);
    return this.queryAll<TableTypes<"user">>(
      `SELECT DISTINCT u.* FROM ${TABLES.ClassUser} cu
       JOIN ${TABLES.Class} c ON cu.class_id = c.id
       JOIN ${TABLES.User} u ON cu.user_id = u.id
       WHERE c.school_id IN ${clause}
         AND cu.role = 'student'
         AND coalesce(cu.is_deleted,0)=0 AND coalesce(u.is_deleted,0)=0`,
      params
    );
  }

  async getTeacherInfoBySchoolId(
    schoolId: string
  ): Promise<TableTypes<"user">[]> {
    return this.queryAll<TableTypes<"user">>(
      `SELECT u.* FROM ${TABLES.SchoolUser} su
       JOIN ${TABLES.User} u ON su.user_id = u.id
       WHERE su.school_id = ? AND su.role = ? AND coalesce(su.is_deleted,0)=0 AND coalesce(u.is_deleted,0)=0`,
      [schoolId, RoleType.TEACHER]
    );
  }

  async getTeachersForClass(
    classId: string
  ): Promise<TableTypes<"user">[]> {
    return this.queryAll<TableTypes<"user">>(
      `SELECT u.* FROM ${TABLES.ClassUser} cu
       JOIN ${TABLES.User} u ON cu.user_id = u.id
       WHERE cu.class_id = ? AND cu.role = ? AND coalesce(cu.is_deleted,0)=0 AND coalesce(u.is_deleted,0)=0`,
      [classId, RoleType.TEACHER]
    );
  }

  async addTeacherToClass(
    user: TableTypes<"user">,
    classId: string,
    role: RoleType = RoleType.TEACHER
  ): Promise<void> {
    const now = new Date().toISOString();
    await this.execute(
      `INSERT INTO ${TABLES.ClassUser} (id,class_id,user_id,role,created_at,updated_at,is_deleted,is_firebase,is_ops,ops_created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO NOTHING`,
      [
        uuidv4(),
        classId,
        user.id,
        role,
        now,
        now,
        0,
        null,
        null,
        null,
      ]
    );
  }

  async checkUserExistInSchool(
    schoolId: string,
    userId: string
  ): Promise<boolean> {
    const row = await this.querySingle<{ count: number }>(
      `SELECT COUNT(1) as count FROM ${TABLES.SchoolUser}
       WHERE school_id = ? AND user_id = ? AND coalesce(is_deleted,0)=0`,
      [schoolId, userId]
    );
    return (row?.count ?? 0) > 0;
  }

  async checkTeacherExistInClass(
    classId: string,
    teacherId: string
  ): Promise<boolean> {
    const row = await this.querySingle<{ count: number }>(
      `SELECT COUNT(1) as count FROM ${TABLES.ClassUser}
       WHERE class_id = ? AND user_id = ? AND role = ? AND coalesce(is_deleted,0)=0`,
      [classId, teacherId, RoleType.TEACHER]
    );
    return (row?.count ?? 0) > 0;
  }

  async checkUserIsManagerOrDirector(
    schoolId: string,
    userId: string
  ): Promise<boolean> {
    const roles = [RoleType.COORDINATOR, RoleType.PRINCIPAL, RoleType.SPONSOR];
    const { clause, params } = this.buildInClause(roles);
    const row = await this.querySingle<{ count: number }>(
      `SELECT COUNT(1) as count FROM ${TABLES.SchoolUser}
       WHERE school_id = ? AND user_id = ? AND role IN ${clause} AND coalesce(is_deleted,0)=0`,
      [schoolId, userId, ...params]
    );
    return (row?.count ?? 0) > 0;
  }

  async getTeacherJoinedDate(
    classId: string,
    teacherId: string
  ): Promise<string | undefined> {
    const row = await this.querySingle<{ created_at: string }>(
      `SELECT created_at FROM ${TABLES.ClassUser}
       WHERE class_id = ? AND user_id = ? AND role = ? AND coalesce(is_deleted,0)=0
       ORDER BY created_at ASC LIMIT 1`,
      [classId, teacherId, RoleType.TEACHER]
    );
    return row?.created_at;
  }

  async deleteTeacher(
    classId: string,
    teacherId: string
  ): Promise<void> {
    const updatedAt = new Date().toISOString();
    await this.execute(
      `UPDATE ${TABLES.ClassUser}
       SET is_deleted=1, updated_at=?
       WHERE class_id = ? AND user_id = ? AND role = ? AND coalesce(is_deleted,0)=0`,
      [updatedAt, classId, teacherId, RoleType.TEACHER]
    );
  }

  async deleteClass(classId: string): Promise<void> {
    const now = new Date().toISOString();
    await this.execute(
      `UPDATE ${TABLES.Class} SET is_deleted=1, updated_at=? WHERE id=?`,
      [now, classId]
    );
    await this.execute(
      `UPDATE ${TABLES.ClassUser} SET is_deleted=1, updated_at=? WHERE class_id=?`,
      [now, classId]
    );
    await this.execute(
      `UPDATE ${TABLES.ClassCourse} SET is_deleted=1, updated_at=? WHERE class_id=?`,
      [now, classId]
    );
  }

  async updateClassLastModified(classId: string): Promise<void> {
    await this.execute(
      `UPDATE ${TABLES.Class} SET updated_at=? WHERE id=?`,
      [new Date().toISOString(), classId]
    );
  }

  async updateClass(classId: string, className: string) {
    await this.execute(
      `UPDATE ${TABLES.Class} SET name=? WHERE id=?`,
      [className, classId]
    );
  }

  async createClassCode(classId: string): Promise<number> {
    const code = Math.floor(100000 + Math.random() * 900000);
    const now = new Date().toISOString();
    await this.execute(
      `INSERT INTO ${TABLES.ClassInvite_code} (id,class_id,code,created_at,updated_at,is_deleted,is_class_code,is_firebase)
       VALUES (?,?,?,?,?,?,?,?)`,
      [uuidv4(), classId, code, now, now, 0, 1, null]
    );
    return code;
  }

  async getPrincipalsForSchool(
    schoolId: string
  ): Promise<TableTypes<"user">[]> {
    return this.queryAll<TableTypes<"user">>(
      `SELECT u.* FROM ${TABLES.SchoolUser} su
       JOIN ${TABLES.User} u ON su.user_id = u.id
       WHERE su.school_id = ? AND su.role = 'principal' AND coalesce(su.is_deleted,0)=0 AND coalesce(u.is_deleted,0)=0`,
      [schoolId]
    );
  }

  async getPrincipalsForSchoolPaginated(
    schoolId: string,
    page: number,
    page_size: number
  ): Promise<TableTypes<"user">[]> {
    const offset = (page - 1) * page_size;
    return this.queryAll<TableTypes<"user">>(
      `SELECT u.* FROM ${TABLES.SchoolUser} su
       JOIN ${TABLES.User} u ON su.user_id = u.id
       WHERE su.school_id = ? AND su.role = 'principal' AND coalesce(su.is_deleted,0)=0 AND coalesce(u.is_deleted,0)=0
       LIMIT ? OFFSET ?`,
      [schoolId, page_size, offset]
    );
  }

  async getCoordinatorsForSchool(
    schoolId: string
  ): Promise<TableTypes<"user">[]> {
    return this.queryAll<TableTypes<"user">>(
      `SELECT u.* FROM ${TABLES.SchoolUser} su
       JOIN ${TABLES.User} u ON su.user_id = u.id
       WHERE su.school_id = ? AND su.role = 'coordinator' AND coalesce(su.is_deleted,0)=0 AND coalesce(u.is_deleted,0)=0`,
      [schoolId]
    );
  }

  async getCoordinatorsForSchoolPaginated(
    schoolId: string,
    page: number,
    page_size: number
  ): Promise<TableTypes<"user">[]> {
    const offset = (page - 1) * page_size;
    return this.queryAll<TableTypes<"user">>(
      `SELECT u.* FROM ${TABLES.SchoolUser} su
       JOIN ${TABLES.User} u ON su.user_id = u.id
       WHERE su.school_id = ? AND su.role = 'coordinator' AND coalesce(su.is_deleted,0)=0 AND coalesce(u.is_deleted,0)=0
       LIMIT ? OFFSET ?`,
      [schoolId, page_size, offset]
    );
  }

  async getSponsorsForSchool(
    schoolId: string
  ): Promise<TableTypes<"user">[]> {
    return this.queryAll<TableTypes<"user">>(
      `SELECT u.* FROM ${TABLES.SchoolUser} su
       JOIN ${TABLES.User} u ON su.user_id = u.id
       WHERE su.school_id = ? AND su.role = 'sponsor' AND coalesce(su.is_deleted,0)=0 AND coalesce(u.is_deleted,0)=0`,
      [schoolId]
    );
  }

  async deleteUserFromSchoolsWithRole(
    schoolIds: string[],
    role: RoleType
  ): Promise<void> {
    if (!schoolIds.length) return;
    const { clause, params } = this.buildInClause(schoolIds);
    const now = new Date().toISOString();
    await this.execute(
      `UPDATE ${TABLES.SchoolUser}
       SET is_deleted=1, updated_at=?
       WHERE school_id IN ${clause} AND role = ? AND coalesce(is_deleted,0)=0`,
      [now, ...params, role]
    );
  }

  async getDataByInviteCode(inviteCode: number): Promise<any> {
    const codeRow = await this.querySingle<TableTypes<"class_invite_code">>(
      `SELECT * FROM ${TABLES.ClassInvite_code}
       WHERE code = ? AND coalesce(is_deleted,0)=0
       ORDER BY created_at DESC LIMIT 1`,
      [inviteCode]
    );
    if (!codeRow) throw new Error("Invalid inviteCode");
    const cls = await this.getClassById(codeRow.class_id);
    const school = cls ? await this.getSchoolById(cls.school_id) : undefined;
    return { class: cls, school };
  }

  async addParentToNewClass(classID: string, studentId: string) {
    // PowerSync can't run the Supabase RPC; no-op placeholder.
    return;
  }


  // ---------- School validation helpers ----------
  async validateSchoolData(
    schoolId: string,
    schoolName: string
  ): Promise<{ status: string; errors?: string[] }> {
    const rows = await this.queryAll<{ id: string }>(
      `SELECT id FROM ${TABLES.School}
       WHERE LOWER(name) = LOWER(?) AND id <> ? AND coalesce(is_deleted,0)=0
       LIMIT 1`,
      [schoolName, schoolId]
    );
    if (rows.length > 0) {
      return { status: "error", errors: ["School name already exists"] };
    }
    return { status: "ok" };
  }

  async validateSchoolUdiseCode(
    udise: string
  ): Promise<{ status: string; errors?: string[] }> {
    const rows = await this.queryAll<{ id: string }>(
      `SELECT id FROM ${TABLES.School}
       WHERE udise = ? AND coalesce(is_deleted,0)=0
       LIMIT 1`,
      [udise]
    );
    if (rows.length > 0) {
      return { status: "error", errors: ["UDISE already exists"] };
    }
    return { status: "ok" };
  }

  async validateClassNameWithSchoolID(
    schoolId: string,
    className: string
  ): Promise<{ status: string; errors?: string[] }> {
    const rows = await this.queryAll<{ id: string }>(
      `SELECT id FROM ${TABLES.Class}
       WHERE school_id = ? AND LOWER(name) = LOWER(?) AND coalesce(is_deleted,0)=0
       LIMIT 1`,
      [schoolId, className]
    );
    if (rows.length > 0) {
      return { status: "error", errors: ["Class already exists for this school"] };
    }
    return { status: "ok" };
  }

  async validateParentAndStudentInClass(
    phoneNumber: string,
    studentName: string,
    className: string,
    schoolId: string
  ): Promise<{ status: string; errors?: string[]; message?: string }> {
    // Minimal local validation: check if class exists in school.
    const cls = await this.querySingle<{ id: string }>(
      `SELECT id FROM ${TABLES.Class}
       WHERE school_id = ? AND LOWER(name)=LOWER(?) AND coalesce(is_deleted,0)=0`,
      [schoolId, className]
    );
    if (!cls) {
      return { status: "error", errors: ["Class not found"] };
    }
    return { status: "ok" };
  }

  async validateStudentInClassWithoutPhone(
    studentName: string,
    className: string,
    schoolId: string
  ): Promise<{ status: string; errors?: string[]; message?: string }> {
    // Check if a student with same name exists in that class.
    const rows = await this.queryAll<{ name: string }>(
      `SELECT u.name FROM ${TABLES.ClassUser} cu
       JOIN ${TABLES.Class} c ON cu.class_id = c.id
       JOIN ${TABLES.User} u ON cu.user_id = u.id
       WHERE c.school_id = ? AND LOWER(c.name)=LOWER(?) AND LOWER(u.name)=LOWER(?) AND cu.role='student' AND coalesce(cu.is_deleted,0)=0`,
      [schoolId, className, studentName]
    );
    if (rows.length > 0) {
      return { status: "error", errors: ["Student already in class"] };
    }
    return { status: "ok" };
  }

  async validateClassCurriculumAndSubject(
    curriculumName: string,
    subjectName: string,
    gradeName: string
  ): Promise<{ status: string; errors?: string[] }> {
    // Lightweight validation: ensure curriculum, subject, grade exist.
    const curriculum = await this.querySingle<{ id: string }>(
      `SELECT id FROM ${TABLES.Curriculum} WHERE LOWER(name)=LOWER(?) AND coalesce(is_deleted,0)=0`,
      [curriculumName]
    );
    const subject = await this.querySingle<{ id: string }>(
      `SELECT id FROM ${TABLES.Subject} WHERE LOWER(name)=LOWER(?) AND coalesce(is_deleted,0)=0`,
      [subjectName]
    );
    const grade = await this.querySingle<{ id: string }>(
      `SELECT id FROM ${TABLES.Grade} WHERE LOWER(name)=LOWER(?) AND coalesce(is_deleted,0)=0`,
      [gradeName]
    );
    if (!curriculum || !subject || !grade) {
      const errors = [];
      if (!curriculum) errors.push("Invalid curriculum name");
      if (!subject) errors.push("Invalid subject name");
      if (!grade) errors.push("Invalid grade name");
      return { status: "error", errors };
    }
    return { status: "ok" };
  }

  async validateUserContacts(
    programManagerContact: string,
    fieldCoordinatorContact?: string
  ): Promise<{ status: string; errors?: string[] }> {
    // Basic existence check by email/phone in user table.
    const errors: string[] = [];
    const pmKey = programManagerContact.includes("@") ? "email" : "phone";
    const pm = await this.querySingle<{ id: string }>(
      `SELECT id FROM ${TABLES.User} WHERE ${pmKey} = ? AND coalesce(is_deleted,0)=0`,
      [programManagerContact.trim()]
    );
    if (!pm) errors.push("PROGRAM MANAGER EMAIL OR PHONE NUMBER does not exist in the system");

    if (fieldCoordinatorContact) {
      const fcKey = fieldCoordinatorContact.includes("@") ? "email" : "phone";
      const fc = await this.querySingle<{ id: string }>(
        `SELECT id FROM ${TABLES.User} WHERE ${fcKey} = ? AND coalesce(is_deleted,0)=0`,
        [fieldCoordinatorContact.trim()]
      );
      if (!fc) errors.push("FIELD COORDINATOR EMAIL OR PHONE NUMBER does not exist in the system");
    }
    return errors.length ? { status: "error", errors } : { status: "ok" };
  }

  // ---------- School listings / search ----------
  async getSchoolFilterOptionsForSchoolListing(): Promise<
    Record<string, string[]>
  > {
    const rows = await this.queryAll<TableTypes<"school">>(
      `SELECT state, district, block, country, program_id, group1, group2, group3, group4
       FROM ${TABLES.School}
       WHERE coalesce(is_deleted,0)=0`
    );
    const collect = (key: keyof TableTypes<"school">) =>
      Array.from(new Set(rows.map((r: any) => r[key]).filter(Boolean))) as string[];
    return {
      state: collect("group1"),
      district: collect("group2"),
      block: collect("group3"),
      programType: [],
      partner: [],
      programManager: [],
      fieldCoordinator: [],
      cluster: collect("group4"),
    };
  }

  async getFilteredSchoolsForSchoolListing(
    filters: Partial<TableTypes<"school">>
  ): Promise<TableTypes<"school">[]> {
    const conditions = ["coalesce(is_deleted,0)=0"];
    const params: any[] = [];
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        conditions.push(`${key} = ?`);
        params.push(value);
      }
    });
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    return this.queryAll<TableTypes<"school">>(
      `SELECT * FROM ${TABLES.School} ${where}`,
      params
    );
  }

  async searchSchools(search: string): Promise<TableTypes<"school">[]> {
    const like = `%${search}%`;
    return this.queryAll<TableTypes<"school">>(
      `SELECT * FROM ${TABLES.School}
       WHERE coalesce(is_deleted,0)=0 AND (name LIKE ? OR udise LIKE ? OR address LIKE ?)
       ORDER BY created_at DESC`,
      [like, like, like]
    );
  }

  async searchStudentsInSchool(
    schoolId: string,
    query: string
  ): Promise<TableTypes<"user">[]> {
    const like = `%${query}%`;
    return this.queryAll<TableTypes<"user">>(
      `SELECT DISTINCT u.* FROM ${TABLES.ClassUser} cu
       JOIN ${TABLES.Class} c ON cu.class_id = c.id
       JOIN ${TABLES.User} u ON cu.user_id = u.id
       WHERE c.school_id = ? AND cu.role='student'
         AND coalesce(cu.is_deleted,0)=0 AND coalesce(u.is_deleted,0)=0
         AND (u.name LIKE ? OR u.phone LIKE ? OR u.email LIKE ?)`,
      [schoolId, like, like, like]
    );
  }

  async searchTeachersInSchool(
    schoolId: string,
    query: string
  ): Promise<TableTypes<"user">[]> {
    const like = `%${query}%`;
    return this.queryAll<TableTypes<"user">>(
      `SELECT DISTINCT u.* FROM ${TABLES.SchoolUser} su
       JOIN ${TABLES.User} u ON su.user_id = u.id
       WHERE su.school_id = ? AND su.role='teacher'
         AND coalesce(su.is_deleted,0)=0 AND coalesce(u.is_deleted,0)=0
         AND (u.name LIKE ? OR u.phone LIKE ? OR u.email LIKE ?)`,
      [schoolId, like, like, like]
    );
  }

  async getGeoData(): Promise<TableTypes<"geo_locations">[]> {
    return this.queryAll<TableTypes<"geo_locations">>(
      `SELECT * FROM ${TABLES.GeoLocations} WHERE coalesce(is_deleted,0)=0`
    );
  }

  // ---------- Fallbacks to Supabase implementation ----------
  async clearCacheData(tableNames: readonly any[]): Promise<void> {
    return super.clearCacheData(tableNames);
  }

  async createUserDoc(user: any): Promise<void> {
    return super.createUserDoc(user);
  }

  async getTablesData(
    tableName: TABLES,
    onDataChange: (data: any) => void,
    deleteFlag?: boolean,
    orderBy?: string,
    order?: any
  ) {
    return super.getTablesData(tableName, onDataChange, deleteFlag, orderBy, order);
  }

  async mutate(
    mutateType: any,
    tableName: TABLES,
    data1: { [key: string]: any },
    id: string
  ) {
    return super.mutate(mutateType, tableName, data1, id);
  }

  async getBonusesByIds(ids: string[]): Promise<TableTypes<"lesson">[]> {
    return super.getBonusesByIds(ids);
  }

  async mergeStudentRequest(...args: any[]): Promise<any> {
    // Not applicable in offline mode, delegate.
    // @ts-ignore
    return super.mergeStudentRequest?.(...args);
  }

  async subscribeToClassTopic(): Promise<void> {
    return super.subscribeToClassTopic();
  }

  async getLeaderboardResults(
    ids: string[],
    periodType: string
  ): Promise<TableTypes<"reward">[]> {
    return super.getLeaderboardResults(ids, periodType);
  }

  async getLeaderboardStudentResultFromB2CCollection(studentId: string) {
    return super.getLeaderboardStudentResultFromB2CCollection(studentId);
  }

  assignmentUserListner(...args: any[]) {
    // Realtime listeners not supported via PowerSync; fallback to Supabase.
    // @ts-ignore
    return super.assignmentUserListner?.(...args);
  }
  assignmentListner(...args: any[]) {
    // @ts-ignore
    return super.assignmentListner?.(...args);
  }
  removeAssignmentChannel() {
    // @ts-ignore
    return super.removeAssignmentChannel?.();
  }
  liveQuizListener(...args: any[]) {
    // @ts-ignore
    return super.liveQuizListener?.(...args);
  }
  removeLiveQuizChannel() {
    // @ts-ignore
    return super.removeLiveQuizChannel?.();
  }

  async getRecommendedLessons(
    studentId: string,
    classId?: string
  ): Promise<TableTypes<"lesson">[]> {
    return super.getRecommendedLessons(studentId, classId);
  }

  async createAssignment(...args: any[]): Promise<any> {
    // @ts-ignore
    return super.createAssignment?.(...args);
  }

  async getResultByChapterByDate(...args: any[]): Promise<any> {
    // @ts-ignore
    return super.getResultByChapterByDate?.(...args);
  }

  async validateProgramName(programName: string): Promise<{ status: string; errors?: string[] }> {
    // @ts-ignore
    return super.validateProgramName?.(programName);
  }

  async countAllPendingPushes(): Promise<number> {
    // @ts-ignore
    return super.countAllPendingPushes?.() ?? 0;
  }

  async getDebugInfoLast30Days(): Promise<TableTypes<"issue_debug">[]> {
    // @ts-ignore
    return super.getDebugInfoLast30Days?.();
  }

  async getProgramData(programId: string) {
    return super.getProgramData(programId);
  }

  async createOrAddUserOps(...args: any[]): Promise<any> {
    // @ts-ignore
    return super.createOrAddUserOps?.(...args);
  }

  async isProgramUser(...args: any[]): Promise<boolean> {
    // @ts-ignore
    return super.isProgramUser?.(...args);
  }

  async getManagersAndCoordinators(...args: any[]): Promise<any> {
    // @ts-ignore
    return super.getManagersAndCoordinators?.(...args);
  }

  async school_activity_stats(schoolId: string): Promise<{
    assignments: number;
    users: number;
  }> {
    return super.school_activity_stats(schoolId);
  }

  async isProgramManager(...args: any[]): Promise<boolean> {
    // @ts-ignore
    return super.isProgramManager?.(...args);
  }

  async getChaptersByIds(chapterIds: string[]): Promise<TableTypes<"chapter">[]> {
    return super.getChaptersByIds(chapterIds);
  }

  async getChapterIdbyQrLink(
    link: string
  ): Promise<TableTypes<"chapter_links"> | undefined> {
    // Not implemented with PowerSync; fallback
    // @ts-ignore
    return super.getChapterIdbyQrLink?.(link);
  }

  async getOpsRequests(...args: any[]): Promise<any> {
    // @ts-ignore
    return super.getOpsRequests?.(...args);
  }

  async getRequestFilterOptions(...args: any[]): Promise<any> {
    // @ts-ignore
    return super.getRequestFilterOptions?.(...args);
  }

  async approveOpsRequest(...args: any[]): Promise<any> {
    // @ts-ignore
    return super.approveOpsRequest?.(...args);
  }

  async respondToSchoolRequest(...args: any[]): Promise<any> {
    // @ts-ignore
    return super.respondToSchoolRequest?.(...args);
  }

  async getFieldCoordinatorsByProgram(programId: string): Promise<TableTypes<"user">[]> {
    return super.getFieldCoordinatorsByProgram(programId);
  }

  async updateSchoolStatus(
    schoolId: string,
    newStatus: EnumType<"ops_request_status">
  ): Promise<void> {
    return super.updateSchoolStatus(schoolId, newStatus);
  }

  async sendJoinSchoolRequest(...args: any[]): Promise<any> {
    // @ts-ignore
    return super.sendJoinSchoolRequest?.(...args);
  }

  // ---------- Program helpers ----------
  async getProgramFilterOptions(): Promise<Record<string, string[]>> {
    // Local query to derive distinct values
    const rows = await this.queryAll<{
      state: string | null;
      district: string | null;
      block: string | null;
      program_type: string | null;
      implementation_partner: string | null;
      program_manager: string | null;
      field_coordinator: string | null;
      cluster: string | null;
    }>(`SELECT DISTINCT state,district,block,program_type,implementation_partner,program_manager,field_coordinator,cluster FROM ${TABLES.Program} WHERE coalesce(is_deleted,0)=0`);

    const collect = (field: keyof typeof rows[number]) =>
      Array.from(new Set(rows.map((r) => r[field]).filter(Boolean))) as string[];

    return {
      state: collect("state"),
      district: collect("district"),
      block: collect("block"),
      programType: collect("program_type"),
      partner: collect("implementation_partner"),
      programManager: collect("program_manager"),
      fieldCoordinator: collect("field_coordinator"),
      cluster: collect("cluster"),
    };
  }

  async getPrograms({
    model,
    type,
    partner,
    programManager,
    state,
    district,
    block,
  }: {
    model?: string[];
    type?: string[];
    partner?: string[];
    programManager?: string[];
    state?: string[];
    district?: string[];
    block?: string[];
  }): Promise<TableTypes<"program">[]> {
    const filters: string[] = ["coalesce(is_deleted,0)=0"];
    const params: any[] = [];
    const addIn = (field: string, values?: string[]) => {
      if (values && values.length) {
        const { clause, params: p } = this.buildInClause(values);
        filters.push(`${field} IN ${clause}`);
        params.push(...p);
      }
    };
    addIn("model", model);
    addIn("program_type", type);
    addIn("implementation_partner", partner);
    addIn("program_manager", programManager);
    addIn("state", state);
    addIn("district", district);
    addIn("block", block);

    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    return this.queryAll<TableTypes<"program">>(
      `SELECT * FROM ${TABLES.Program} ${where}`,
      params
    );
  }

  async getProgramsByRole(): Promise<{ data: TableTypes<"program">[] }> {
    const programs = await this.queryAll<TableTypes<"program">>(
      `SELECT * FROM ${TABLES.Program} WHERE coalesce(is_deleted,0)=0`
    );
    return { data: programs };
  }

  async getProgramManagers(): Promise<{ name: string; id: string }[]> {
    const rows = await this.queryAll<{ id: string; name: string | null }>(
      `SELECT DISTINCT u.id, u.name FROM ${TABLES.ProgramUser} pu
       JOIN ${TABLES.User} u ON pu.user_id = u.id
       WHERE pu.role = 'program_manager' AND coalesce(pu.is_deleted,0)=0`
    );
    return rows.map((r) => ({ id: r.id, name: r.name ?? "" }));
  }

  async getUniqueGeoData(): Promise<{
    states: string[];
    districts: string[];
    blocks: string[];
  }> {
    const rows = await this.queryAll<{
      state: string | null;
      district: string | null;
      block: string | null;
    }>(
      `SELECT DISTINCT state,district,block FROM ${TABLES.Program}
       WHERE coalesce(is_deleted,0)=0`
    );
    const uniq = (arr: (string | null)[]) =>
      Array.from(new Set(arr.filter(Boolean))) as string[];
    return {
      states: uniq(rows.map((r) => r.state)),
      districts: uniq(rows.map((r) => r.district)),
      blocks: uniq(rows.map((r) => r.block)),
    };
  }

  async insertProgram(payload: any): Promise<boolean> {
    const programId = payload.id ?? uuidv4();
    const now = new Date().toISOString();
    await this.execute(
      `INSERT INTO ${TABLES.Program} (id,name,program_type,model,start_date,end_date,country,state,district,cluster,block,village,implementation_partner,funding_partner,institute_partner,devices_count,students_count,schools_count,classes_count,teachers_count,description,program_manager,field_coordinator,created_at,updated_at,is_deleted)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        programId,
        payload.programName ?? "",
        payload.programType ?? null,
        payload.programModel ?? null,
        payload.startDate ?? null,
        payload.endDate ?? null,
        payload.country ?? null,
        payload.state ?? null,
        payload.district ?? null,
        payload.cluster ?? null,
        payload.block ?? null,
        payload.village ?? null,
        payload.implementationPartner ?? null,
        payload.fundingPartner ?? null,
        payload.institutePartner ?? null,
        payload.devicesCount ?? null,
        payload.studentsCount ?? null,
        payload.schoolsCount ?? null,
        payload.classesCount ?? null,
        payload.teachersCount ?? null,
        payload.description ?? null,
        payload.programManager ?? null,
        payload.fieldCoordinator ?? null,
        now,
        now,
        0,
      ]
    );
    // Program managers mapping
    if (payload.programManagers?.length) {
      for (const managerId of payload.programManagers) {
        await this.addProgramUser(programId, managerId, "program_manager", now);
      }
    }
    if (payload.fieldCoordinators?.length) {
      for (const fcId of payload.fieldCoordinators) {
        await this.addProgramUser(programId, fcId, "field_coordinator", now);
      }
    }
    return true;
  }

  private async addProgramUser(
    programId: string,
    userId: string,
    role: string,
    timestamp: string
  ) {
    await this.execute(
      `INSERT INTO ${TABLES.ProgramUser} (id,program_id,user_id,role,created_at,updated_at,is_deleted,is_firebase,is_ops,ops_created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [uuidv4(), programId, userId, role, timestamp, timestamp, 0, null, null, null]
    );
  }

  async getProgramManagersForSchools(
    schoolIds: string[]
  ): Promise<{ user_id: string; program_id: string }[]> {
    if (!schoolIds.length) return [];
    const { clause, params } = this.buildInClause(schoolIds);
    return this.queryAll<{ user_id: string; program_id: string }>(
      `SELECT pu.user_id, pu.program_id
       FROM ${TABLES.ProgramUser} pu
       JOIN ${TABLES.Program} p ON pu.program_id = p.id
       WHERE p.id IN (SELECT program_id FROM ${TABLES.School} WHERE id IN ${clause})
         AND pu.role = 'program_manager' AND coalesce(pu.is_deleted,0)=0`,
      params
    );
  }

  async getFieldCoordinatorsForSchools(
    schoolIds: string[]
  ): Promise<{ user_id: string; program_id: string }[]> {
    if (!schoolIds.length) return [];
    const { clause, params } = this.buildInClause(schoolIds);
    return this.queryAll<{ user_id: string; program_id: string }>(
      `SELECT pu.user_id, pu.program_id
       FROM ${TABLES.ProgramUser} pu
       JOIN ${TABLES.Program} p ON pu.program_id = p.id
       WHERE p.id IN (SELECT program_id FROM ${TABLES.School} WHERE id IN ${clause})
         AND pu.role = 'field_coordinator' AND coalesce(pu.is_deleted,0)=0`,
      params
    );
  }

  async getProgramForSchool(
    schoolId: string
  ): Promise<TableTypes<"program"> | undefined> {
    const school = await this.getSchoolById(schoolId);
    if (!school?.program_id) return undefined;
    return this.querySingle<TableTypes<"program">>(
      `SELECT * FROM ${TABLES.Program} WHERE id = ? AND coalesce(is_deleted,0)=0`,
      [school.program_id]
    );
  }

  async getProgramManagersForSchool(
    schoolId: string
  ): Promise<TableTypes<"user">[]> {
    const program = await this.getProgramForSchool(schoolId);
    if (!program) return [];
    return this.queryAll<TableTypes<"user">>(
      `SELECT u.* FROM ${TABLES.ProgramUser} pu
       JOIN ${TABLES.User} u ON pu.user_id = u.id
       WHERE pu.program_id = ? AND pu.role = 'program_manager' AND coalesce(pu.is_deleted,0)=0`,
      [program.id]
    );
  }

  async getProgramsByRole(): Promise<{ data: TableTypes<"program">[] }> {
    return { data: await this.queryAll<TableTypes<"program">>(`SELECT * FROM ${TABLES.Program} WHERE coalesce(is_deleted,0)=0`) };
  }

  async program_activity_stats(programId: string): Promise<{
    assignments: number;
    users: number;
  }> {
    const assignments = await this.queryAll<{ count: number }>(
      `SELECT COUNT(1) as count FROM ${TABLES.Assignment} WHERE program_id = ? AND coalesce(is_deleted,0)=0`,
      [programId]
    );
    const users = await this.queryAll<{ count: number }>(
      `SELECT COUNT(1) as count FROM ${TABLES.ProgramUser} WHERE program_id = ? AND coalesce(is_deleted,0)=0`,
      [programId]
    );
    return {
      assignments: assignments[0]?.count ?? 0,
      users: users[0]?.count ?? 0,
    };
  }

  async updateProgramUserRole(userId: string, role: string): Promise<void> {
    const now = new Date().toISOString();
    await this.execute(
      `UPDATE ${TABLES.ProgramUser}
       SET role=?, updated_at=?
       WHERE user_id=? AND coalesce(is_deleted,0)=0`,
      [role, now, userId]
    );
  }

  async deleteProgramUser(userId: string): Promise<void> {
    const now = new Date().toISOString();
    await this.execute(
      `UPDATE ${TABLES.ProgramUser}
       SET is_deleted=1, updated_at=?
       WHERE user_id=? AND coalesce(is_deleted,0)=0`,
      [now, userId]
    );
  }

  async deleteProgramUsersByIds(ids: string[]): Promise<void> {
    if (!ids.length) return;
    const { clause, params } = this.buildInClause(ids);
    const now = new Date().toISOString();
    await this.execute(
      `UPDATE ${TABLES.ProgramUser}
       SET is_deleted=1, updated_at=?
       WHERE id IN ${clause}`,
      [now, ...params]
    );
  }

  async getStudentResultsByAssignmentId(
    assignmentId: string
  ): Promise<{ result_data: TableTypes<"result">[]; user_data: TableTypes<"user">[] }[]> {
    const results = await this.queryAll<TableTypes<"result">>(
      `SELECT * FROM ${TABLES.Result} WHERE assignment_id = ? AND coalesce(is_deleted,0)=0`,
      [assignmentId]
    );
    const userIds = Array.from(new Set(results.map((r) => r.student_id).filter(Boolean))) as string[];
    const users = userIds.length ? await this.getUsersByIds(userIds) : [];
    return [{ result_data: results, user_data: users }];
  }
}
