import { DocumentData, Unsubscribe } from "firebase/firestore";
import {
  MODES,
  LeaderboardDropdownList,
  LeaderboardRewards,
  TABLES,
  TableTypes,
  MUTATE_TYPES,
  PROFILETYPE,
  grade1,
  belowGrade1,
  grade2,
  grade3,
  aboveGrade3,
  DEFAULT_SUBJECT_IDS,
  OTHER_CURRICULUM,
  LIVE_QUIZ,
  STARS_COUNT,
  EVENTS,
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
  PROGRAM_TAB,
  AVATARS,
  USER_ROLE,
  ROLE_PRIORITY,
  StudentAPIResponse,
  StudentInfo,
  TeacherAPIResponse,
  TeacherInfo,
  PrincipalInfo,
  PrincipalAPIResponse,
  CoordinatorInfo,
  CoordinatorAPIResponse,
  RequestTypes,
  EnumType,
  CACHETABLES,
  STATUS,
  SearchSchoolsParams,
  SearchSchoolsResult,
  GeoDataParams,
  School,
  REWARD_LESSON,
  OPS_ROLES,
} from "../../common/constants";
import { Constants } from "../database"; // adjust the path as per your project
import { StudentLessonResult } from "../../common/courseConstants";
import { AvatarObj } from "../../components/animation/Avatar";
import Course from "../../models/course";
import Lesson from "../../models/lesson";
import LiveQuizRoomObject from "../../models/liveQuizRoom";
import User from "../../models/user";
import { LeaderboardInfo, ServiceApi } from "./ServiceApi";
import { Database } from "../database";
import {
  PostgrestSingleResponse,
  RealtimeChannel,
  SupabaseClient,
  createClient,
} from "@supabase/supabase-js";
import { RoleType } from "../../interface/modelInterfaces";
import { Util } from "../../utility/util";
import { v4 as uuidv4 } from "uuid";
import { ServiceConfig } from "../ServiceConfig";
import { SqliteApi } from "./SqliteApi";
import {
  UserSchoolClassParams,
  UserSchoolClassResult,
} from "../../ops-console/pages/NewUserPageOps";
export class SupabaseApi implements ServiceApi {
  private _assignmetRealTime?: RealtimeChannel;
  private _assignmentUserRealTime?: RealtimeChannel;
  private _liveQuizRealTime?: RealtimeChannel;
  private _currentMode: MODES;
  async getChaptersForCourse(courseId: string): Promise<
    {
      course_id: string | null;
      created_at: string;
      id: string;
      image: string | null;
      is_deleted: boolean | null;
      name: string | null;
      sort_index: number | null;
      sub_topics: string | null;
      updated_at: string | null;
    }[]
  > {
    if (!this.supabase) return [];
    const { data, error } = await this.supabase
      .from(TABLES.Chapter)
      .select("*")
      .eq("course_id", courseId)
      .eq("is_deleted", false)
      .order("sort_index", { ascending: true });

    if (error) {
      console.error("Error fetching chapters for course:", error);
      return [];
    }

    return data ?? [];
  }
  async clearCacheData(tableNames: readonly CACHETABLES[]): Promise<void> {
    console.warn("Delegating clearSpecificTablesSqlite to SqliteApi");
    const sqliteApi = await SqliteApi.getInstance();
    return sqliteApi.clearCacheData(tableNames);
  }
  async getPendingAssignmentForLesson(
    lessonId: string,
    classId: string,
    studentId: string
  ): Promise<TableTypes<"assignment"> | undefined> {
    if (!this.supabase) return undefined;

    // Class-wise assignments
    const { data: classWise, error: classWiseError } = await this.supabase
      .from(TABLES.Assignment)
      .select("*")
      .eq("lesson_id", lessonId)
      .eq("class_id", classId)
      .eq("is_class_wise", true)
      .eq("is_deleted", false)
      .order("updated_at", { ascending: false });

    if (classWiseError) {
      console.error("Error fetching class-wise assignments:", classWiseError);
      return;
    }

    // Individual assignments (joined with assignment_user)
    const { data: individual, error: individualError } = await this.supabase
      .from(TABLES.Assignment)
      .select(
        `
      *,
      assignment_user:assignment_user!inner(user_id)
    `
      )
      .eq("lesson_id", lessonId)
      .eq("class_id", classId)
      .eq("assignment_user.user_id", studentId)
      .eq("is_deleted", false)
      .order("updated_at", { ascending: false });

    if (individualError) {
      console.error("Error fetching individual assignments:", individualError);
      return;
    }

    // Combine and filter out assignments that already have a result
    const assignments = [...(classWise ?? []), ...(individual ?? [])];

    // Limit to 20 total assignments to check
    const limitedAssignments = assignments.slice(0, 20);

    const results = await Promise.all(
      limitedAssignments.map(async (assignment) => {
        if (!this.supabase) {
          return null;
        }
        const { data: result, error: resultError } = await this.supabase
          .from("result")
          .select("id")
          .eq("assignment_id", assignment.id)
          .eq("student_id", studentId)
          .eq("is_deleted", false)
          .maybeSingle();

        if (resultError) {
          console.error("Error checking assignment result:", resultError);
          return null;
        }
        return !result ? assignment : null;
      })
    );

    // Return the first pending assignment, or undefined if none
    return results.find((a) => !!a) as TableTypes<"assignment"> | undefined;
  }

  async getFavouriteLessons(userId: string): Promise<TableTypes<"lesson">[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from(TABLES.FavoriteLesson)
      .select(`lesson:lesson_id(*)`)
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching favourite lessons:", error);
      return [];
    }

    const lessons: TableTypes<"lesson">[] = (data ?? [])
      .map((item) => item.lesson as unknown as TableTypes<"lesson">)
      .filter((lesson) => !!lesson);
    return lessons;
  }

  async getStudentClassesAndSchools(userId: string): Promise<{
    classes: TableTypes<"class">[];
    schools: TableTypes<"school">[];
  }> {
    if (!this.supabase) return { classes: [], schools: [] };
    const data: {
      classes: TableTypes<"class">[];
      schools: TableTypes<"school">[];
    } = {
      classes: [],
      schools: [],
    };
    const { data: classUserData, error } = await this.supabase
      .from(TABLES.ClassUser)
      .select(
        `
      class:class_id (
        *,
        school:school_id (*)
      )
    `
      )
      .eq("user_id", userId)
      .eq("role", RoleType.STUDENT)
      .eq("is_deleted", false);
    if (error || !classUserData) {
      console.error("Error fetching student classes and schools", error);
      return data;
    }

    const schoolsMap = new Map<string, TableTypes<"school">>();

    for (const item of classUserData as any[]) {
      const cls = item.class as TableTypes<"class"> & {
        school?: TableTypes<"school">;
      };

      if (cls) {
        data.classes.push(cls);
        if (cls.school && !schoolsMap.has(cls.school.id)) {
          schoolsMap.set(cls.school.id, cls.school);
        }
      }
    }

    data.schools = Array.from(schoolsMap.values());
    return data;
  }

  async createUserDoc(
    user: TableTypes<"user">
  ): Promise<TableTypes<"user"> | undefined> {
    if (!this.supabase) return;

    const { error } = await this.supabase.from(TABLES.User).insert({
      id: user.id,
      name: user.name,
      age: user.age,
      gender: user.gender,
      avatar: user.avatar,
      image: user.image,
      curriculum_id: user.curriculum_id,
      language_id: user.language_id,
    });

    if (error) {
      console.error("Error creating user:", error);
      return;
    }
    return user;
  }
  syncDB(
    tableNames: TABLES[] = Object.values(TABLES),
    refreshTables: TABLES[] = []
  ): Promise<boolean> {
    return Promise.resolve(true);
  }
  public static i: SupabaseApi;
  public supabase: SupabaseClient<Database> | undefined;
  private supabaseUrl: string;
  private supabaseKey: string;
  private _currentStudent: TableTypes<"user"> | undefined;
  private _currentClass: TableTypes<"class"> | undefined;
  private _currentSchool: TableTypes<"school"> | undefined;
  private _currentCourse:
    | Map<string, TableTypes<"course"> | undefined>
    | undefined;

  public static getInstance(): SupabaseApi {
    if (!SupabaseApi.i) {
      SupabaseApi.i = new SupabaseApi();
      SupabaseApi.i.init();
    }
    return SupabaseApi.i;
  }

  private init() {
    this.supabaseUrl = process.env.REACT_APP_SUPABASE_URL ?? "";
    this.supabaseKey = process.env.REACT_APP_SUPABASE_KEY ?? "";
    this.supabase = createClient<Database>(this.supabaseUrl, this.supabaseKey);
  }

  // as parameters type: school, user, class
  //               image
  // return image stored url
  //---------------------------------------------------------------
  async addProfileImages(
    id: string,
    file: File,
    profileType: PROFILETYPE
  ): Promise<string | null> {
    const extension = file.name.split(".").pop(); // Get file extension
    const newName = `ProfilePicture_${profileType}_${Date.now()}.${extension}`; // Rename the file
    const folderName = encodeURIComponent(String(id));
    const filePath = `${profileType}/${folderName}/${newName}`; // Path inside the bucket
    // Attempt to delete existing files
    const removeResponse = await this.supabase?.storage
      .from("profile-images")
      .remove(
        (
          await this.supabase?.storage
            .from("profile-images")
            .list(`${profileType}/${folderName}`, { limit: 2 })
        )?.data?.map((file) => `${profileType}/${folderName}/${file.name}`) ||
          []
      );
    // Convert File to Blob (necessary for renaming)
    const renamedFile = new File([file], newName, { type: file.type });
    // Upload the new file (allow overwrite)
    const uploadResponse = await this.supabase?.storage
      .from("profile-images")
      .upload(filePath, renamedFile, { upsert: true });
    if (uploadResponse?.error) {
      console.error("Error uploading file:", uploadResponse.error.message);
      return null;
    }
    // Get the Public URL of the uploaded file
    const urlData = this.supabase?.storage
      .from("profile-images")
      .getPublicUrl(filePath);
    const imageUrl = urlData?.data.publicUrl;
    return imageUrl || null;
  }

  async uploadData(payload: any): Promise<boolean | null> {
    if (!this.supabase) return false;

    const supabase = this.supabase;
    let resolved = false;
    const currentuserData =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    const uploadingUser = currentuserData?.id;
    return new Promise(async (resolve) => {
      let uploadId: string | undefined;
      let directChannel: RealtimeChannel | null = null;
      let subscriptionFailCount = 0;
      const subscribeToDirectChannel = (): RealtimeChannel => {
        const channel = supabase
          .channel(`upload-status-${uploadId}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "upload_queue",
              filter: `id=eq.${uploadId}`,
            },
            async (payload) => {
              const status = payload.new?.status;
              console.log("🔄 Realtime update received:", status);
              if ((status === "success" || status === "failed") && !resolved) {
                resolved = true;
                await channel.unsubscribe();
                resolve(status === "success");
              }
            }
          )
          .subscribe(async (status) => {
            if (status === "SUBSCRIBED") {
              console.log("📡 Realtime subscription active.");
              subscriptionFailCount = 0;
            } else {
              subscriptionFailCount++;
              console.warn("⚠️ Subscription status:", status);
              if (subscriptionFailCount > 2) {
                console.warn(
                  "🔁 Reinitializing subscription due to failures..."
                );
                await channel.unsubscribe();
                directChannel = subscribeToDirectChannel();
              }
            }
          });
        return channel;
      };
      const fallbackChannel = uploadingUser
        ? supabase
            .channel(`upload-fallback-${uploadingUser}`)
            .on(
              "postgres_changes",
              {
                event: "UPDATE",
                schema: "public",
                table: "upload_queue",
                filter: `uploading_user=eq.${uploadingUser}`,
              },
              async (payload) => {
                const status = payload.new?.status;
                const id = payload.new?.id;
                console.log(
                  "🔄 [Fallback] Realtime update:",
                  status,
                  "ID:",
                  id
                );
                if (
                  (status === "success" || status === "failed") &&
                  !resolved
                ) {
                  resolved = true;
                  await fallbackChannel?.unsubscribe();
                  console.log(
                    `✅ / ❌ Fallback resolved with status: ${status}`
                  );
                  resolve(status === "success");
                }
              }
            )
            .subscribe()
        : null;
      const { data, error: functionError } = await supabase.functions.invoke(
        "ops-data-insert",
        {
          body: payload,
        }
      );
      uploadId = data?.upload_id;
      if (uploadId) {
        console.log("📡 Received upload_id:", uploadId);
        if (fallbackChannel) {
          await fallbackChannel.unsubscribe();
        }
        const { data: row } = await supabase
          .from("upload_queue")
          .select("status")
          .eq("id", uploadId)
          .single();
        if (row?.status === "success") {
          console.log("✅ Already succeeded before subscription.");
          return resolve(true);
        }
        if (row?.status === "failed") {
          console.log("❌ Already failed before subscription.");
          return resolve(false);
        }
        directChannel = subscribeToDirectChannel();
      } else {
        console.warn("❗ No upload_id returned — using fallback listener.");
      }
    });
  }

  async getTablesData(
    tableNames: TABLES[] = Object.values(TABLES),
    tablesLastModifiedTime: Map<string, string> = new Map(),
    isInitialFetch = false
  ): Promise<Map<string, any[]>> {
    try {
      const data = new Map<string, any[]>();

      const fetchPromises = tableNames.map(async (tableName) => {
        const lastModifiedDate =
          tablesLastModifiedTime.get(tableName) ?? "2024-01-01T00:00:00.000Z";
        let rpcName;
        let res;
        switch (tableName) {
          case TABLES.Assignment: {
            rpcName = "sql_get_assignments";
            res = await this.supabase?.rpc(rpcName, {
              p_updated_at: lastModifiedDate,
            });
            break;
          }
          case TABLES.Assignment_cart: {
            rpcName = "sql_get_assignment_cart";
            res = await this.supabase?.rpc(rpcName, {
              p_updated_at: lastModifiedDate,
            });
            break;
          }
          case TABLES.Assignment_user: {
            rpcName = "sql_get_assignment_users";
            res = await this.supabase?.rpc(rpcName, {
              p_updated_at: lastModifiedDate,
            });
            break;
          }
          case TABLES.Badge: {
            rpcName = "sql_get_badge";
            res = await this.supabase?.rpc(rpcName, {
              p_updated_at: lastModifiedDate,
            });
            break;
          }
          case TABLES.Chapter: {
            rpcName = "sql_get_chapter";
            res = await this.supabase?.rpc(rpcName, {
              p_updated_at: lastModifiedDate,
            });
            break;
          }
          case TABLES.ChapterLesson: {
            rpcName = "sql_get_chapter_lesson";
            res = await this.supabase?.rpc(rpcName, {
              p_updated_at: lastModifiedDate,
            });
            break;
          }
          case TABLES.Class: {
            rpcName = "sql_get_class";
            res = await this.supabase?.rpc(rpcName, {
              p_updated_at: lastModifiedDate,
            });
            break;
          }
          case TABLES.ClassCourse: {
            rpcName = "sql_get_class_course";
            res = await this.supabase?.rpc(rpcName, {
              p_updated_at: lastModifiedDate,
            });
            break;
          }
          case TABLES.ClassInvite_code: {
            rpcName = "sql_get_class_invite_codes";
            res = await this.supabase?.rpc(rpcName, {
              p_updated_at: lastModifiedDate,
            });
            break;
          }
          case TABLES.ClassUser: {
            rpcName = "sql_get_class_user";
            res = await this.supabase?.rpc(rpcName, {
              p_updated_at: lastModifiedDate,
            });
            break;
          }
          case TABLES.OpsRequests: {
            rpcName = "sql_get_ops_requests";
            res = await this.supabase?.rpc(rpcName, {
              p_updated_at: lastModifiedDate,
            });
            break;
          }
          case TABLES.Course: {
            rpcName = "sql_get_course";
            res = await this.supabase?.rpc(rpcName, {
              p_updated_at: lastModifiedDate,
            });
            break;
          }
          case TABLES.Curriculum: {
            rpcName = "sql_get_curriculum";
            res = await this.supabase?.rpc(rpcName, {
              p_updated_at: lastModifiedDate,
            });
            break;
          }
          case TABLES.FavoriteLesson: {
            rpcName = "sql_get_favorite_lessons";
            res = await this.supabase?.rpc(rpcName, {
              p_updated_at: lastModifiedDate,
            });
            break;
          }
          case TABLES.Grade: {
            rpcName = "sql_get_grade";
            res = await this.supabase?.rpc(rpcName, {
              p_updated_at: lastModifiedDate,
            });
            break;
          }
          case TABLES.Language: {
            rpcName = "sql_get_language";
            res = await this.supabase?.rpc(rpcName, {
              p_updated_at: lastModifiedDate,
            });
            break;
          }
          case TABLES.Lesson: {
            rpcName = "sql_get_lessons";
            res = await this.supabase?.rpc(rpcName, {
              p_updated_at: lastModifiedDate,
            });
            break;
          }
          case TABLES.ParentUser: {
            rpcName = "sql_get_parent_users";
            res = await this.supabase?.rpc(rpcName, {
              p_updated_at: lastModifiedDate,
            });
            break;
          }

          case TABLES.Result: {
            rpcName = "sql_get_results";
            res = await this.supabase?.rpc(rpcName, {
              p_updated_at: lastModifiedDate,
            });
            break;
          }
          case TABLES.Reward: {
            rpcName = "sql_get_reward";
            res = await this.supabase?.rpc(rpcName, {
              p_updated_at: lastModifiedDate,
            });
            break;
          }
          case TABLES.School: {
            rpcName = "sql_get_schools";
            res = await this.supabase?.rpc(rpcName, {
              p_updated_at: lastModifiedDate,
            });
            break;
          }
          case TABLES.SchoolCourse: {
            rpcName = "sql_get_school_courses";
            res = await this.supabase?.rpc(rpcName, {
              p_updated_at: lastModifiedDate,
            });
            break;
          }
          case TABLES.SchoolUser: {
            rpcName = "sql_get_school_user";
            res = await this.supabase?.rpc(rpcName, {
              p_updated_at: lastModifiedDate,
            });
            break;
          }
          case TABLES.Sticker: {
            rpcName = "sql_get_sticker";
            res = await this.supabase?.rpc(rpcName, {
              p_updated_at: lastModifiedDate,
            });
            break;
          }
          case TABLES.Subject: {
            rpcName = "sql_get_subject";
            res = await this.supabase?.rpc(rpcName, {
              p_updated_at: lastModifiedDate,
            });
            break;
          }
          case TABLES.User: {
            rpcName = "sql_get_users";
            res = await this.supabase?.rpc(rpcName, {
              p_updated_at: lastModifiedDate,
            });
            break;
          }
          case TABLES.UserBadge: {
            rpcName = "sql_get_user_badges";
            res = await this.supabase?.rpc(rpcName, {
              p_updated_at: lastModifiedDate,
            });
            break;
          }
          case TABLES.UserBonus: {
            rpcName = "sql_get_user_bonus";
            res = await this.supabase?.rpc(rpcName, {
              p_updated_at: lastModifiedDate,
            });
            break;
          }
          case TABLES.UserCourse: {
            rpcName = "sql_get_user_courses";
            res = await this.supabase?.rpc(rpcName, {
              p_updated_at: lastModifiedDate,
            });
            break;
          }
          case TABLES.UserSticker: {
            rpcName = "sql_get_user_stickers";
            res = await this.supabase?.rpc(rpcName, {
              p_updated_at: lastModifiedDate,
            });
            break;
          }
          case TABLES.Live_quiz_room: {
            rpcName = "sql_get_live_quiz_rooms";
            res = await this.supabase?.rpc(rpcName, {
              p_updated_at: lastModifiedDate,
            });
            break;
          }
          default:
            res = await this.supabase
              ?.from(tableName)
              .select("*")
              .gte("updated_at", lastModifiedDate);
            data.set(tableName, res?.data ?? []);
        }

        if (res == null || res.error || !res.data) {
          let parent_user;
          try {
            parent_user =
              await ServiceConfig.getI().authHandler.getCurrentUser();
          } catch (error: any) {
            console.error("User Error", error);
          }
          Util.logEvent(EVENTS.SYNCHING_ERROR, {
            user_name: parent_user?.name || null,
            user_id: parent_user?.id || null,
            user_username: parent_user?.email || null,
            rpc_fn_name: rpcName || "not found",
            table_name: tableName || "not found",
            last_modified_date: lastModifiedDate || "not found",
            error_code: res?.error?.code || null,
            error_deatils: res?.error?.details || null,
            error_hint: res?.error?.hint || null,
            error_message: res?.error?.message || null,
          });
          if (isInitialFetch) {
            throw new Error(
              `Initial fetch failed for ${rpcName || tableName}: ${
                res?.error?.message
              }`
            );
          }
        }
        // console.log(
        //   `Fetched ${JSON.stringify(res?.data)} records from ${tableName}`
        // );
        data.set(tableName, res?.data ?? []);
      });

      await Promise.all(fetchPromises);
      return data;
    } catch (err: any) {
      let parent_user;
      try {
        parent_user = await ServiceConfig.getI().authHandler.getCurrentUser();
      } catch (error: any) {
        console.error("User Error", error);
      }
      Util.logEvent(EVENTS.SYNCHING_ERROR, {
        user_name: parent_user?.name || null,
        user_id: parent_user?.id || null,
        user_username: parent_user?.email || null,
        rpc_fn_name: "not found",
        table_name: "not found",
        last_modified_date: "not found",
        error_message: err || "Unknown error",
      });
      console.error("🚀 ~ Api ~ getTablesData ~ error:", err);
      throw err;
    }
  }

  async mutate(
    mutateType: MUTATE_TYPES,
    tableName: TABLES,
    data1: { [key: string]: any },
    id: string
  ) {
    const data = { ...data1 };
    data.updated_at = new Date().toISOString();
    if (!this.supabase) return;
    let res: PostgrestSingleResponse<any> | undefined = undefined;
    switch (mutateType) {
      case MUTATE_TYPES.INSERT:
        res = await this.supabase.from(tableName).insert(data);
        break;

      case MUTATE_TYPES.UPDATE:
        delete data.id;
        res = await this.supabase.from(tableName).update(data).eq("id", id);
        break;

      case MUTATE_TYPES.DELETE:
        res = await this.supabase.from(tableName).delete().eq("id", id);
        break;

      default:
        break;
    }
    return res;
    // return !!res && !res.error;
  }

  async pushAssignmentCart(data: { [key: string]: any }, id: string) {
    if (!this.supabase) return;
    await this.supabase.from(TABLES.Assignment_cart).upsert({ id, ...data });
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
    if (!this.supabase) return {} as TableTypes<"school">;

    const result = image
      ? await this.addProfileImages(school.id, image, PROFILETYPE.SCHOOL)
      : school.image;
    // Prepare updated data
    const updatedSchool: TableTypes<"school"> = {
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
      created_at: school.created_at,
      id: school.id,
      is_deleted: false,
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

    const { error } = await this.supabase
      .from(TABLES.School)
      .update(updatedSchool)
      .eq("id", school.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating school profile:", error);
      throw error;
    }
    return updatedSchool;
  }

  async getCoursesByClassId(
    classId: string
  ): Promise<TableTypes<"class_course">[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from(TABLES.ClassCourse)
      .select("*")
      .eq("class_id", classId)
      .eq("is_deleted", false);

    if (error) {
      console.error("Error fetching class courses:", error);
      return [];
    }

    return data ?? [];
  }

  async getCoursesBySchoolId(
    schoolId: string
  ): Promise<TableTypes<"school_course">[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from(TABLES.SchoolCourse)
      .select("*")
      .eq("school_id", schoolId)
      .eq("is_deleted", false);

    if (error) {
      console.error("Error fetching school courses:", error);
      return [];
    }

    return data ?? [];
  }

  async removeCoursesFromClass(ids: string[]): Promise<void> {
    if (!this.supabase) return;
    const updatedAt = new Date().toISOString();
    try {
      if (ids.length === 0) {
        console.warn("No course IDs provided for removal.");
        return;
      }

      const { error } = await this.supabase
        .from(TABLES.ClassCourse)
        .update({ is_deleted: true, updated_at: updatedAt })
        .in("id", ids);

      if (error) {
        console.error("Error removing courses from class_course:", error);
      }
    } catch (err) {
      console.error("Exception in removeCoursesFromClass:", err);
    }
  }

  async removeCoursesFromSchool(ids: string[]): Promise<void> {
    if (!this.supabase) return;
    const updatedAt = new Date().toISOString();
    try {
      if (ids.length === 0) {
        console.warn("No course IDs provided for removal.");
        return;
      }

      const { error } = await this.supabase
        .from(TABLES.SchoolCourse)
        .update({ is_deleted: true, updated_at: updatedAt })
        .in("id", ids);

      if (error) {
        console.error("Error removing courses from school_course:", error);
      }
    } catch (err) {
      console.error("Exception in removeCoursesFromSchool:", err);
    }
  }
  async checkCourseInClasses(
    classIds: string[],
    courseId: string
  ): Promise<boolean> {
    if (!this.supabase) return false;

    try {
      if (classIds.length === 0) return false;

      const { data, error } = await this.supabase
        .from(TABLES.ClassCourse)
        .select("id")
        .in("class_id", classIds)
        .eq("course_id", courseId)
        .eq("is_deleted", false)
        .limit(1);

      if (error) {
        console.error("Error checking course in classes:", error);
        return false;
      }

      return !!data && data.length > 0;
    } catch (err) {
      console.error("Exception in checkCourseInClasses:", err);
      return false;
    }
  }

  async deleteUserFromClass(userId: string, class_id: string): Promise<void> {
    if (!this.supabase) return;

    const updatedAt = new Date().toISOString();
    try {
      const { error } = await this.supabase
        .from(TABLES.ClassUser)
        .update({
          is_deleted: true,
          updated_at: updatedAt,
        })
        .eq("user_id", userId)
        .eq("class_id", class_id)
        .eq("is_deleted", false);

      if (error) {
        console.error("Error deleting user from class_user:", error);
      }

      const { error: reqerror } = await this.supabase
        .from(TABLES.OpsRequests)
        .update({
          is_deleted: true,
          updated_at: updatedAt,
        })
        .eq("requested_by", userId)
        .eq("class_id", class_id)
        .eq("is_deleted", false);

      if (reqerror) {
        console.error("Error deleting user from ops_requests:", reqerror);
      }
    } catch (err) {
      console.error("Exception in deleteUserFromClass:", err);
    }
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
    if (!this.supabase) return {} as TableTypes<"school">;
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw "User is not Logged in";

    const schoolId = uuidv4();
    const timestamp = new Date().toISOString();

    // Handle optional image upload
    const result = image
      ? await this.addProfileImages(schoolId, image, PROFILETYPE.SCHOOL)
      : null;

    const newSchool: TableTypes<"school"> = {
      id: schoolId,
      name,
      group1: group1 ?? null,
      group2: group2 ?? null,
      group3: group3 ?? null,
      image: result ?? null,
      group4: group4 ?? null,
      program_id: program_id ?? null,
      udise: udise ?? null,
      address: address ?? null,
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
      country: country ?? null,
      location_link: null,
    };

    // Insert school
    const { error: schoolError } = await this.supabase
      .from(TABLES.School)
      .insert([newSchool]);

    if (schoolError) {
      console.error("Error inserting into school:", schoolError);
      throw schoolError;
    }

    // Create school_user entry
    const newSchoolUser: TableTypes<"school_user"> = {
      id: uuidv4(),
      school_id: schoolId,
      user_id: _currentUser.id,
      role: RoleType.PRINCIPAL,
      created_at: timestamp,
      updated_at: timestamp,
      is_deleted: false,
      is_firebase: null,
      is_ops: null,
      ops_created_by: null,
    };

    const { error: userError } = await this.supabase
      .from(TABLES.SchoolUser)
      .insert([newSchoolUser]);

    if (userError) {
      console.error("Error inserting into school_user:", userError);
      throw userError;
    }

    return newSchool;
  }

  async requestNewSchool(
    name: string,
    state: string,
    district: string,
    city: string,
    image: File | null,
    udise_id?: string
  ): Promise<TableTypes<"req_new_school"> | null> {
    if (!this.supabase) return null;

    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw new Error("User is not logged in");

    // ✅ Select id, created_at, updated_at to avoid TS error
    const { data: existingRequests, error: selectError } = await this.supabase
      .from(TABLES.ReqNewSchool)
      .select("id, created_at, updated_at")
      .eq("user_id", _currentUser.id)
      .eq("is_deleted", false)
      .limit(1);

    if (selectError) {
      console.error("Error checking for existing request:", selectError);
      throw selectError;
    }

    if (existingRequests && existingRequests.length > 0) {
      const existing = existingRequests[0];
      return {
        id: existing.id,
        user_id: _currentUser.id,
        name,
        state,
        district,
        city,
        image: null,
        udise_id: udise_id ?? null,
        is_resolved: false,
        created_at: existing.created_at,
        updated_at: existing.updated_at,
        is_deleted: false,
      };
    }

    const requestId = uuidv4();
    const timestamp = new Date().toISOString();

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
      created_at: timestamp,
      updated_at: timestamp,
      is_deleted: false,
    };

    const { error: insertError } = await this.supabase
      .from(TABLES.ReqNewSchool)
      .insert([newRequest]);

    if (insertError) {
      console.error("Error inserting school request:", insertError);
      throw insertError;
    }

    return newRequest;
  }
  async getExistingSchoolRequest(
    requested_by: string
  ): Promise<TableTypes<"ops_requests"> | null> {
    if (!this.supabase) return null;

    const { data, error } = await this.supabase
      .from(TABLES.OpsRequests)
      .select("*")
      .eq("requested_by", requested_by)
      .eq("request_status", STATUS.REQUESTED)
      .eq("is_deleted", false)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching existing school request:", error);
      throw error;
    }

    return data ?? null;
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
    if (!this.supabase) throw new Error("Supabase instance is not initialized");

    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw new Error("User is not logged in");

    const studentId = uuidv4();
    const now = new Date().toISOString();

    const newStudent: TableTypes<TABLES.User> = {
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

    const { error: userInsertError } = await this.supabase
      .from(TABLES.User)
      .insert([newStudent]);

    if (userInsertError) {
      console.error("Error inserting student profile:", userInsertError);
      throw userInsertError;
    }

    const parentUserId = uuidv4();
    const parentUserData: TableTypes<TABLES.ParentUser> = {
      id: parentUserId,
      parent_id: _currentUser.id,
      student_id: studentId,
      created_at: now,
      updated_at: now,
      is_deleted: false,
      is_firebase: null,
      is_ops: null,
      ops_created_by: null,
    };

    const { error: parentInsertError } = await this.supabase
      .from(TABLES.ParentUser)
      .insert([parentUserData]);

    if (parentInsertError) {
      console.error("Error inserting parent_user link:", parentInsertError);
      throw parentInsertError;
    }

    let courses: TableTypes<TABLES.Course>[] = [];
    if (gradeDocId && boardDocId) {
      courses = await this.getCourseByUserGradeId(gradeDocId, boardDocId);
      for (const course of courses) {
        const newUserCourse: TableTypes<TABLES.UserCourse> = {
          id: uuidv4(),
          user_id: studentId,
          course_id: course.id,
          created_at: now,
          updated_at: now,
          is_deleted: false,
          is_firebase: null,
        };
        const { error: userCourseInsertError } = await this.supabase
          .from(TABLES.UserCourse)
          .insert([newUserCourse]);
      }
    } else {
      const [englishCourse, mathsCourse, digitalSkillsCourse] =
        await Promise.all([
          this.getCourse(CHIMPLE_ENGLISH),
          this.getCourse(CHIMPLE_MATHS),
          this.getCourse(CHIMPLE_DIGITAL_SKILLS),
        ]);
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
        const newUserCourse: TableTypes<TABLES.UserCourse> = {
          id: uuidv4(),
          user_id: studentId,
          course_id: course.id,
          created_at: now,
          updated_at: now,
          is_deleted: false,
          is_firebase: null,
        };
        const { error: userCourseInsertError } = await this.supabase
          .from(TABLES.UserCourse)
          .insert([newUserCourse]);
      }
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
  ): Promise<TableTypes<TABLES.User>> {
    if (!this.supabase)
      return Promise.reject("Supabase client not initialized");

    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw new Error("User is not logged in");

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

    // Insert into user table
    const { error: userInsertError } = await this.supabase
      .from(TABLES.User)
      .insert(newStudent);

    if (userInsertError) {
      console.error("Error inserting user:", userInsertError);
      throw userInsertError;
    }

    // Insert into class_user table
    const classUserId = uuidv4();
    const newClassUser: TableTypes<TABLES.ClassUser> = {
      id: classUserId,
      class_id: classId,
      user_id: userId,
      role: role,
      created_at: timestamp,
      updated_at: timestamp,
      is_deleted: false,
      is_firebase: null,
      is_ops: null,
      ops_created_by: null,
    };

    const { error: classUserInsertError } = await this.supabase
      .from(TABLES.ClassUser)
      .insert(newClassUser);

    if (classUserInsertError) {
      console.error("Error inserting class_user:", classUserInsertError);
      throw classUserInsertError;
    }
    return newStudent;
  }

  async deleteProfile(studentId: string) {
    if (!this.supabase) return;

    const res = await this.supabase.rpc("delete_student_profile", {
      p_student_id: studentId,
    });
    if (res.error) {
      throw res.error;
    }
  }
  async getAllCurriculums(): Promise<TableTypes<"curriculum">[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from(TABLES.Curriculum)
      .select("*")
      .eq("is_deleted", false)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching curriculums:", error);
      return [];
    }
    return data ?? [];
  }

  async getAllGrades(): Promise<TableTypes<"grade">[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from(TABLES.Grade)
      .select("*")
      .eq("is_deleted", false)
      .order("sort_index", {
        ascending: true,
      });

    if (error) {
      console.error("Error fetching grades:", error);
      return [];
    }

    return data ?? [];
  }

  async getAllLanguages(): Promise<TableTypes<"language">[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from(TABLES.Language)
      .select("*")
      .eq("is_deleted", false)
      .order("code", { ascending: true });

    if (error) {
      console.error("Error fetching languages:", error);
      return [];
    }

    return data ?? [];
  }
  async getParentStudentProfiles(): Promise<TableTypes<"user">[]> {
    if (!this.supabase) return [];

    const currentUser =
      await ServiceConfig.getI()?.authHandler?.getCurrentUser();
    if (!currentUser) throw new Error("User is not Logged in");

    const { data, error } = await this.supabase
      .from(TABLES.ParentUser)
      .select("student:student_id(*)")
      .eq("parent_id", currentUser.id)
      .eq("is_deleted", false);

    if (error) {
      console.error("Error fetching parent-student profiles:", error);
      return [];
    }

    // Extract only the student profiles from the joined result
    const students = (data ?? [])
      .map((item: any) => item.student)
      .filter((student: TableTypes<"user">) => student && !student.is_deleted);

    return students;
  }

  async getCourseByUserGradeId(
    gradeDocId: string | null | undefined,
    boardDocId: string | null | undefined
  ): Promise<TableTypes<"course">[]> {
    if (!this.supabase) return [];
    if (!gradeDocId) {
      throw new Error("Grade document ID is required.");
    }

    if (!boardDocId) {
      throw new Error("Board document ID is required.");
    }

    let courseIds: TableTypes<"course">[] = [];
    let isGrade1 = false;
    let isGrade2 = false;

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
      (course) => course.curriculum_id === boardDocId
    );

    courseIds.push(...curriculumCourses);

    const subjectIds = curriculumCourses
      .map((course) => course.subject_id)
      .filter((id): id is string => !!id);

    const remainingSubjects = DEFAULT_SUBJECT_IDS.filter(
      (subjectId) => !subjectIds.includes(subjectId)
    );

    remainingSubjects.forEach((subjectId) => {
      const otherCourses = gradeCourses.filter(
        (course) =>
          course.subject_id === subjectId &&
          course.curriculum_id === OTHER_CURRICULUM
      );
      courseIds.push(...otherCourses);
    });

    return courseIds;
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
    if (!this.supabase) return;
    try {
      const { error } = await this.supabase
        .from("user")
        .update({ sfx_off: value })
        .eq("id", userId);

      if (error) {
        throw new Error(`Failed to update sound flag: ${error.message}`);
      }
    } catch (error) {
      console.error("Error updating sound flag:", error);
    }
  }
  async updateMusicFlag(userId: string, value: boolean) {
    if (!this.supabase) return;

    try {
      const { error } = await this.supabase
        .from("user")
        .update({ music_off: value })
        .eq("id", userId);

      if (error) {
        throw new Error(`Failed to update music flag: ${error.message}`);
      }
    } catch (error) {
      console.error("Error updating music flag:", error);
    }
  }
  async updateLanguage(userId: string, value: string) {
    if (!this.supabase) return;
    try {
      const { error } = await this.supabase
        .from("user")
        .update({ language_id: value })
        .eq("id", userId);

      if (error) {
        throw new Error(`Failed to update language: ${error.message}`);
      }
    } catch (error) {
      console.error("Error updating language:", error);
    }
  }
  async updateFcmToken(userId: string) {
    if (!this.supabase) return;
    try {
      const token = await Util.getToken();

      const { error } = await this.supabase
        .from("user")
        .update({ fcm_token: token })
        .eq("id", userId);

      if (error) {
        throw new Error(`Failed to update FCM token: ${error.message}`);
      }
    } catch (error) {
      console.error("Error updating FCM token:", error);
    }
  }
  async updateTcAccept(userId: string) {
    if (!this.supabase) return;
    try {
      const { error } = await this.supabase
        .from("user")
        .update({ is_tc_accepted: true })
        .eq("id", userId);

      if (error) {
        throw new Error(`Failed to update T&C acceptance: ${error.message}`);
      }

      const auth = ServiceConfig.getI().authHandler;
      const currentUser = await auth.getCurrentUser();
      if (currentUser) {
        currentUser.is_tc_accepted = true;
        auth.currentUser = currentUser;
      }
    } catch (error) {
      console.error("Error updating T&C acceptance:", error);
    }
  }
  async getLanguageWithId(
    id: string
  ): Promise<TableTypes<"language"> | undefined> {
    if (!this.supabase) return;
    try {
      const { data, error } = await this.supabase
        .from("language")
        .select("*")
        .eq("id", id)
        .eq("is_deleted", false)
        .single();

      if (error && error.code !== "PGRST116") {
        throw new Error(
          `Failed to fetch language with id ${id}: ${error.message}`
        );
      }

      return data ?? undefined;
    } catch (error) {
      console.error("Error in getLanguageWithId:", error);
      return Promise.reject(error);
    }
  }
  // not used, getting error when cocos_lesson_id is same for multiple lessons
  async getLessonWithCocosLessonId(
    lessonId: string
  ): Promise<TableTypes<"lesson"> | null> {
    if (!this.supabase) return null;
    const { data, error } = await this.supabase
      .from("lesson")
      .select("*")
      .eq("cocos_lesson_id", lessonId)
      .eq("is_deleted", false)
      .single();

    if (error) {
      console.error("Error fetching lesson:", error);
      if (error.code === "PGRST116") {
        // No rows found
        return null;
      }
      throw new Error(
        `Failed to fetch lesson with cocos_lesson_id ${lessonId}: ${error.message}`
      );
    }
    return data;
  }
  async getCoursesForParentsStudent(
    studentId: string
  ): Promise<TableTypes<"course">[]> {
    if (!this.supabase) return [];

    // Step 1: Fetch all course IDs for the student
    const { data: userCourses, error: userCourseError } = await this.supabase
      .from("user_course")
      .select("course_id")
      .eq("user_id", studentId)
      .eq("is_deleted", false);

    if (userCourseError) {
      throw new Error(
        `Failed to fetch user_course entries: ${userCourseError.message}`
      );
    }

    const courseIds = userCourses.map((uc) => uc.course_id).filter(Boolean);

    if (courseIds.length === 0) return [];

    // Step 2: Fetch course details for those IDs
    const { data: courses, error: courseError } = await this.supabase
      .from("course")
      .select("*")
      .in("id", courseIds)
      .eq("is_deleted", false)
      .order("sort_index", { ascending: true });

    if (courseError) {
      throw new Error(`Failed to fetch course details: ${courseError.message}`);
    }

    return courses;
  }
  async getAdditionalCourses(
    studentId: string
  ): Promise<TableTypes<"course">[]> {
    if (!this.supabase) return [];
    const { data: userCourses, error: ucError } = await this.supabase
      .from("user_course")
      .select("course_id")
      .eq("user_id", studentId)
      .eq("is_deleted", false);

    if (ucError) {
      console.error("Error fetching user courses:", ucError);
      return [];
    }

    const userCourseIds = userCourses?.map((uc) => uc.course_id) ?? [];

    let query = this.supabase
      .from("course")
      .select("*")
      .eq("is_deleted", false);

    if (userCourseIds.length > 0) {
      query = query.not("id", "in", `(${userCourseIds.join(",")})`);
    }

    const { data: courses, error: cError } = await query;

    if (cError) {
      console.error("Error fetching additional courses:", cError);
      return [];
    }

    return courses ?? [];
  }
  async addCourseForParentsStudent(
    courses: TableTypes<"course">[],
    student: TableTypes<"user">
  ) {
    if (!this.supabase) return;

    const newUserCourses: TableTypes<"user_course">[] = courses.map(
      (course) => ({
        id: uuidv4(),
        user_id: student.id,
        course_id: course.id,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_firebase: false,
      })
    );

    const { error } = await this.supabase
      .from("user_course")
      .insert(newUserCourses);

    if (error) {
      console.error("Error inserting user_course:", error);
      throw error;
    }
  }
  async getCoursesForClassStudent(
    classId: string
  ): Promise<TableTypes<"course">[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from("class_course")
      .select("course!inner(*)")
      .eq("class_id", classId)
      .eq("is_deleted", false);

    if (error) {
      console.error("Error fetching courses for class student:", error);
      throw error;
    }
    const courses = (data ?? [])
      .map((item: any) => item.course)
      .sort((a, b) => (a.sort_index ?? 0) - (b.sort_index ?? 0));
    return courses ?? [];
  }
  async getLesson(id: string): Promise<TableTypes<"lesson"> | undefined> {
    if (!this.supabase) return undefined;
    const { data, error } = await this.supabase
      .from("lesson")
      .select("*")
      .eq("id", id)
      .eq("is_deleted", false)
      .single();
    if (error) {
      console.error("Error fetching lesson:", error);
      return undefined;
    }
    return data ?? undefined;
  }
  async getBonusesByIds(ids: string[]): Promise<TableTypes<"lesson">[]> {
    if (!this.supabase || ids.length === 0) return [];

    const { data, error } = await this.supabase
      .from("lesson")
      .select("*")
      .in("id", ids)
      .eq("is_deleted", false);

    if (error) {
      console.error("Error fetching bonuses by IDs:", error);
      return [];
    }

    return data ?? [];
  }
  async getChapterById(id: string): Promise<TableTypes<"chapter"> | undefined> {
    if (!this.supabase) return undefined;
    const { data, error } = await this.supabase
      .from("chapter")
      .select("*")
      .eq("id", id)
      .eq("is_deleted", false)
      .single();
    if (error) {
      console.error("Error fetching chapter:", error);
      return undefined;
    }
    return data ?? undefined;
  }
  async getLessonsForChapter(
    chapterId: string
  ): Promise<TableTypes<"lesson">[]> {
    if (!this.supabase) return [] as TableTypes<"lesson">[];
    const { data, error } = await this.supabase
      .from(TABLES.ChapterLesson)
      .select("lesson:lesson_id(*)")
      .eq("chapter_id", chapterId)
      .order("sort_index", { ascending: true })
      .eq("is_deleted", false);
    if (error) {
      console.error("Error fetching chapter:", error);
      return [] as TableTypes<"lesson">[];
    }
    // Extract lessons from the joined result
    const lessons = (data ?? [])
      .map((item: any) => item.lesson as TableTypes<"lesson">)
      .filter((lesson) => !!lesson);
    return lessons ?? ([] as TableTypes<"lesson">[]);
  }
  async getDifferentGradesForCourse(course: TableTypes<"course">): Promise<{
    grades: TableTypes<"grade">[];
    courses: TableTypes<"course">[];
  }> {
    if (!this.supabase) return { grades: [], courses: [] };

    // Fetch all courses for the subject + curriculum
    const { data: courses, error: courseError } = await this.supabase
      .from("course")
      .select("*")
      .eq("subject_id", course.subject_id!)
      .eq("curriculum_id", course.curriculum_id!)
      .eq("is_deleted", false)
      .order("sort_index", { ascending: true });

    if (courseError || !courses) {
      console.error("Error fetching courses:", courseError);
      return { grades: [], courses: [] };
    }

    // Extract unique grade_ids
    const gradeIds = [
      ...new Set(
        courses.map((c) => c.grade_id).filter((id): id is string => !!id)
      ),
    ];
    if (gradeIds.length === 0) {
      return { grades: [], courses }; // no grades to fetch
    }

    // Fetch grades by IDs
    const { data: grades, error: gradeError } = await this.supabase
      .from("grade")
      .select("*")
      .in("id", gradeIds)
      .eq("is_deleted", false)
      .order("sort_index", { ascending: true });

    if (gradeError || !grades) {
      console.error("Error fetching grades:", gradeError);
      return { grades: [], courses };
    }
    return { grades, courses };
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
    if (!this.supabase) return [];

    const now = new Date().toISOString();

    const { data, error } = await this.supabase
      .from("assignment")
      .select("*, assignment_user:assignment_user!inner(user_id), result(*)")
      .eq("class_id", classId)
      .eq("type", LIVE_QUIZ)
      .lte("starts_at", now)
      .gt("ends_at", now)
      .or(`is_class_wise.eq.true,assignment_user->user_id.eq.${studentId}`)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching live quiz lessons:", error);
      return [];
    }

    // Filter assignments with no result for this student
    const filtered = (data ?? []).filter(
      (assignment) =>
        !Array.isArray(assignment.result) ||
        !(assignment.result ?? []).some((r: any) => r.student_id === studentId)
    );

    return filtered;
  }
  async getLiveQuizRoomDoc(
    liveQuizRoomDocId: string
  ): Promise<TableTypes<"live_quiz_room">> {
    const res = await this.supabase
      ?.from("live_quiz_room")
      .select("*")
      .eq("id", liveQuizRoomDocId)
      .single();
    return res?.data as TableTypes<"live_quiz_room">;
  }
  async updateFavoriteLesson(
    studentId: string,
    lessonId: string
  ): Promise<TableTypes<"favorite_lesson">> {
    if (!this.supabase) return {} as TableTypes<"favorite_lesson">;

    const now = new Date().toISOString();

    const { data: existing, error } = await this.supabase
      .from("favorite_lesson")
      .select("*")
      .eq("user_id", studentId)
      .eq("lesson_id", lessonId)
      .eq("is_deleted", false)
      .maybeSingle();

    if (error) {
      console.error("Favorite fetch error:", error);
      return {} as TableTypes<"favorite_lesson">;
    }

    const favorite: TableTypes<"favorite_lesson"> = {
      id: existing?.id ?? uuidv4(),
      lesson_id: lessonId,
      user_id: studentId,
      created_at: existing?.created_at ?? now,
      updated_at: now,
      is_deleted: false,
      is_firebase: null,
    };

    const { error: upsertError } = await this.supabase
      .from("favorite_lesson")
      .upsert(favorite, { onConflict: "id" });

    if (upsertError) {
      console.error("Favorite upsert error:", upsertError);
      return {} as TableTypes<"favorite_lesson">;
    }

    return favorite;
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
    if (!this.supabase) return {} as TableTypes<"result">;

    const resultId = uuidv4();
    const now = new Date().toISOString();

    const newResult: TableTypes<"result"> = {
      id: resultId,
      assignment_id: assignmentId ?? null,
      correct_moves: correctMoves,
      lesson_id: lessonId,
      school_id: schoolId ?? null,
      score,
      student_id: student.id,
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

    const { error: insertError } = await this.supabase
      .from("result")
      .insert(newResult);

    if (insertError) {
      console.error("Error inserting result:", insertError);
      return {} as TableTypes<"result">;
    }

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

    // Calculate earned stars
    let starsEarned = 0;
    if (score > 25) starsEarned++;
    if (score > 50) starsEarned++;
    if (score > 75) starsEarned++;

    const previousStarsRaw = localStorage.getItem(STARS_COUNT);
    let currentStars = previousStarsRaw
      ? JSON.parse(previousStarsRaw)[student.id]
      : 0;
    const totalStars = currentStars + starsEarned;

    const updateData: any = { stars: totalStars };
    if (newReward) updateData.reward = JSON.stringify(newReward);
    // Update user stars
    const { error: updateError } = await this.supabase
      .from("user")
      .update(updateData)
      .eq("id", student.id);

    if (updateError) {
      console.error("Error updating student stars:", updateError);
    }

    // Sync local student data
    const updatedStudent = await this.getUserByDocId(student.id);
    if (updatedStudent) {
      Util.setCurrentStudent(updatedStudent);
    }
    // 8️⃣ Log reward event if any
    if (newReward && currentUser) {
      await Util.logEvent(EVENTS.REWARD_COLLECTED, {
        user_id: currentUser.id,
        reward_id: newReward.reward_id,
        prev_reward_id: currentUserReward?.reward_id ?? null,
        timestamp: newReward.timestamp,
        course_id: courseId ?? null,
        chapter_id: chapterId,
        lesson_id: lessonId,
        assignment_id: assignmentId ?? null,
        class_id: classId ?? null,
        school_id: schoolId ?? null,
        score,
        stars_earned: starsEarned,
      });
    }

    return newResult;
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
    if (!this.supabase) return student;

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

    await this.supabase.from("user").update(updatedFields).eq("id", student.id);
    Object.assign(student, updatedFields);

    const courses =
      gradeDocId && boardDocId
        ? await this.getCourseByUserGradeId(gradeDocId, boardDocId)
        : [];

    if (courses && courses.length > 0) {
      // Batch fetch existing user_course entries for this student and these courses
      const courseIds = courses.map((c) => c.id);
      const { data: existingUserCourses, error } = await this.supabase
        .from("user_course")
        .select("course_id")
        .eq("user_id", student.id)
        .in("course_id", courseIds)
        .eq("is_deleted", false);

      const existingCourseIds = new Set(
        (existingUserCourses ?? []).map((uc) => uc.course_id)
      );

      // Prepare inserts for only missing courses
      const now = new Date().toISOString();
      const inserts = courses
        .filter((c) => !existingCourseIds.has(c.id))
        .map((c) => ({
          id: uuidv4(),
          user_id: student.id,
          course_id: c.id,
          created_at: now,
          updated_at: now,
          is_deleted: false,
        }));

      // Insert all missing user_course entries in one call (if any)
      if (inserts.length > 0) {
        await this.supabase.from("user_course").insert(inserts);
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
    if (!this.supabase) return student;
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
      student_id: student.student_id ?? null,
      updated_at: now,
    };

    try {
      // Update user table
      await this.supabase
        .from(TABLES.User)
        .update(updatedFields)
        .eq("id", student.id);
      Object.assign(student, updatedFields);

      // Get current class_user record (non-deleted)
      const { data: currentClassUser } = await this.supabase
        .from(TABLES.ClassUser)
        .select("id, class_id")
        .eq("user_id", student.id)
        .eq("is_deleted", false)
        .maybeSingle();
      if (currentClassUser?.class_id !== newClassId) {
        // Mark old class_user as deleted
        if (currentClassUser) {
          await this.supabase
            .from(TABLES.ClassUser)
            .update({ is_deleted: true, updated_at: now })
            .eq("id", currentClassUser.id);
        }

        // Insert new class_user
        const newClassUser: TableTypes<TABLES.ClassUser> = {
          id: uuidv4(),
          class_id: newClassId,
          user_id: student.id,
          role: RoleType.STUDENT,
          created_at: now,
          updated_at: now,
          is_deleted: false,
          is_firebase: null,
          is_ops: null,
          ops_created_by: null,
        };

        await this.supabase.from(TABLES.ClassUser).insert(newClassUser);
        await this.addParentToNewClass(newClassId, student.id);
      }

      return student;
    } catch (error) {
      console.error("Error updating student in school mode:", error);
      throw error;
    }
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
    if (!this.supabase) return user;

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

    const { error } = await this.supabase
      .from("user")
      .update(updatedFields)
      .eq("id", user.id);

    if (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
    Object.assign(user, updatedFields);

    return user;
  }

  async updateClassCourseSelection(
    classId: string,
    selectedCourseIds: string[]
  ): Promise<void> {
    if (!this.supabase) return;

    const now = new Date().toISOString();

    await Promise.all(
      selectedCourseIds.map(async (courseId) => {
        // Check existing entry
        if (!this.supabase) return;
        const { data: existingEntry, error } = await this.supabase
          .from("class_course")
          .select("*")
          .eq("class_id", classId)
          .eq("course_id", courseId)
          .eq("is_deleted", false)
          .maybeSingle();

        if (error) {
          console.error("Error fetching class_course:", error);
          throw error;
        }

        if (!existingEntry) {
          // Insert new
          const newEntry = {
            id: uuidv4(),
            class_id: classId,
            course_id: courseId,
            created_at: now,
            updated_at: now,
            is_deleted: false,
          };
          const { error: insertError } = await this.supabase
            .from("class_course")
            .insert(newEntry);

          if (insertError) {
            console.error("Error inserting class_course:", insertError);
            throw insertError;
          }
        } else if (existingEntry.is_deleted) {
          // Reactivate
          const { error: updateError } = await this.supabase
            .from("class_course")
            .update({ is_deleted: false, updated_at: now })
            .eq("id", existingEntry.id);

          if (updateError) {
            console.error("Error updating class_course:", updateError);
            throw updateError;
          }
        } else {
          // Update timestamp
          const { error: timestampError } = await this.supabase
            .from("class_course")
            .update({ updated_at: now })
            .eq("id", existingEntry.id);

          if (timestampError) {
            console.error("Error updating updated_at:", timestampError);
            throw timestampError;
          }
        }
      })
    );
  }

  async updateSchoolCourseSelection(
    schoolId: string,
    selectedCourseIds: string[]
  ): Promise<void> {
    if (!this.supabase) return;

    const now = new Date().toISOString();

    await Promise.all(
      selectedCourseIds.map(async (courseId) => {
        if (!this.supabase) return;
        const { data: existingEntry, error } = await this.supabase
          .from("school_course")
          .select("id, course_id, is_deleted")
          .eq("school_id", schoolId)
          .eq("course_id", courseId)
          .eq("is_deleted", false)
          .maybeSingle();

        if (error) {
          console.error("Error fetching school_course:", error);
          throw error;
        }

        if (!existingEntry) {
          // Insert new course assignment
          const newEntry = {
            id: uuidv4(),
            school_id: schoolId,
            course_id: courseId,
            created_at: now,
            updated_at: now,
            is_deleted: false,
          };
          const { error: insertError } = await this.supabase
            .from("school_course")
            .insert(newEntry);

          if (insertError) {
            console.error("Error inserting school_course:", insertError);
            throw insertError;
          }
        } else if (existingEntry.is_deleted) {
          // Reactivate the deleted entry
          const { error: updateError } = await this.supabase
            .from("school_course")
            .update({ is_deleted: false, updated_at: now })
            .eq("id", existingEntry.id);

          if (updateError) {
            console.error("Error updating school_course:", updateError);
            throw updateError;
          }
        } else {
          // Update timestamp of existing active entry
          const { error: timestampError } = await this.supabase
            .from("school_course")
            .update({ updated_at: now })
            .eq("id", existingEntry.id);

          if (timestampError) {
            console.error("Error updating updated_at:", timestampError);
            throw timestampError;
          }
        }
      })
    );
  }

  async getSubject(id: string): Promise<TableTypes<"subject"> | undefined> {
    if (!this.supabase) return undefined;
    const { data, error } = await this.supabase
      .from("subject")
      .select("*")
      .eq("id", id)
      .eq("is_deleted", false)
      .single();
    if (error) {
      console.error("Error fetching subject:", error);
      return undefined;
    }
    return data ?? undefined;
  }
  async getCourse(id: string): Promise<TableTypes<"course"> | undefined> {
    if (!this.supabase) return undefined;
    const { data, error } = await this.supabase
      .from("course")
      .select("*")
      .eq("id", id)
      .eq("is_deleted", false)
      .single();
    if (error) {
      console.error("Error fetching course:", error);
      return undefined;
    }
    return data ?? undefined;
  }
  async getCourses(ids: string[]): Promise<TableTypes<"course">[]> {
    if (!this.supabase || !ids || ids.length === 0) return [];

    const { data, error } = await this.supabase
      .from("course")
      .select("*")
      .in("id", ids) // fetch all courses in one go
      .eq("is_deleted", false);

    if (error) {
      console.error("Error fetching courses:", error);
      return [];
    }

    return data ?? [];
  }

  async getStudentResult(
    studentId: string,
    fromCache?: boolean
  ): Promise<TableTypes<"result">[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from("result")
      .select("*")
      .eq("student_id", studentId)
      .eq("is_deleted", false);

    if (error) {
      console.error("Error fetching student results:", error);
      return [];
    }

    return data ?? [];
  }
  async getStudentProgress(studentId: string): Promise<Map<string, string>> {
    if (!this.supabase) return new Map();

    // Use chapter_lesson to join lesson and chapter
    const { data, error } = await this.supabase
      .from("result")
      .select(
        `
      *,
      lesson (
        name,
        chapter_lesson:chapter_lesson!inner(
          chapter (
            id,
            name,
            course_id
          )
        )
      )
    `
      )
      .eq("student_id", studentId)
      .eq("is_deleted", false);

    if (error) {
      console.error("Error fetching student progress:", error);
      return new Map();
    }

    const resultMap = new Map<string, string>();

    if (!data) return resultMap;

    if (data && data.length > 0) {
      data.forEach((result) => {
        const courseId = result.course_id;
        if (courseId && !resultMap[courseId]) {
          resultMap[courseId] = [];
        }
        if (courseId) resultMap[courseId].push(result);
      });
    }
    return resultMap;
  }
  async getStudentResultInMap(
    studentId: string
  ): Promise<{ [lessonDocId: string]: TableTypes<"result"> }> {
    if (!this.supabase) return {};

    const { data, error } = await this.supabase.rpc(
      "get_latest_results_by_student",
      { student_uuid: studentId }
    );

    if (error || !data) {
      console.error("RPC failed:", error);
      return {};
    }

    const resultMap: { [lessonId: string]: TableTypes<"result"> } = {};
    for (const row of data) {
      if (row.lesson_id !== null && row.lesson_id !== undefined) {
        resultMap[row.lesson_id] = row;
      }
    }
    return resultMap;
  }
  async getClassById(id: string): Promise<TableTypes<"class"> | undefined> {
    if (!this.supabase) return;
    const { data, error } = await this.supabase
      .from(TABLES.Class)
      .select("*")
      .eq("id", id)
      .eq("is_deleted", false)
      .single();

    if (error) {
      console.error("Error in getting class", error);
      return;
    }
    return data ?? undefined;
  }
  async getSchoolById(id: string): Promise<TableTypes<"school"> | undefined> {
    if (!this.supabase) return;
    const { data, error } = await this.supabase
      .from(TABLES.School)
      .select("*")
      .eq("id", id)
      .eq("is_deleted", false)
      .single();
    if (error) {
      console.error("Error in getting school", error);
      return;
    }
    return data ?? undefined;
  }
  async isStudentLinked(
    studentId: string,
    fromCache: boolean
  ): Promise<boolean> {
    if (!this.supabase) return false;
    const { data, error } = await this.supabase
      .from(TABLES.ClassUser)
      .select("*")
      .eq("user_id", studentId)
      .eq("role", RoleType.STUDENT)
      .eq("is_deleted", false)
      .single();

    if (error) {
      console.error("Error in isStudentLinked", error);
      return false;
    }
    return true;
  }
  async getPendingAssignments(
    classId: string,
    studentId: string
  ): Promise<TableTypes<"assignment">[]> {
    if (!this.supabase) return [];

    // Fetch assignments with left joins to assignment_user and result
    const { data: allAssignments, error } = await this.supabase
      .from(TABLES.Assignment)
      .select(
        `
      *,
      assignment_user:assignment_user!left(user_id),
      result:result!left(assignment_id,student_id)
    `
      )
      .eq("class_id", classId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching assignments:", error);
      return [];
    }

    // Filter: (is_class_wise === true OR assignment_user.user_id === studentId)
    // AND result for this student is null
    const filtered = (allAssignments ?? []).filter((a: any) => {
      const isClassWise = a.is_class_wise === true;
      const isAssignedToStudent = Array.isArray(a.assignment_user)
        ? a.assignment_user.some((au: any) => au.user_id === studentId)
        : a.assignment_user?.user_id === studentId;
      const hasResultForStudent = Array.isArray(a.result)
        ? a.result.some((r: any) => r.student_id === studentId)
        : a.result?.student_id === studentId;
      return (isClassWise || isAssignedToStudent) && !hasResultForStudent;
    });

    return filtered;
  }
  async getSchoolsForUser(
    userId: string,
    options?: { page?: number; page_size?: number; search?: string }
  ): Promise<{ school: TableTypes<"school">; role: RoleType }[]> {
    if (!this.supabase) return [];

    const search = options?.search?.trim();
    const page = options?.page ?? 1;
    const page_size = options?.page_size ?? 20;
    const from = (page - 1) * page_size;
    const to = from + page_size - 1;

    // --- Special users ---
    const { data: specialUser, error: specialError } = await this.supabase
      .from(TABLES.SpecialUsers)
      .select("role")
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .single();

    if (specialError) {
      console.error("Error fetching special_users:", specialError);
    } else if (specialUser) {
      const role = specialUser.role as RoleType;

      // --- SUPER ADMIN / OPERATIONAL DIRECTOR ---
      if (
        role === RoleType.SUPER_ADMIN ||
        role === RoleType.OPERATIONAL_DIRECTOR
      ) {
        let query = this.supabase
          .from(TABLES.School)
          .select("*")
          .eq("is_deleted", false)
          .order("name", { ascending: true })
          .range(from, to);

        if (search) query = query.ilike("name", `%${search}%`);

        const { data: allSchools, error: allErr } = await query;
        if (allErr) {
          console.error("Error fetching all schools:", allErr);
          return [];
        }
        return (allSchools ?? []).map((school) => ({ school, role }));
      }

      // --- PROGRAM MANAGER / FIELD COORDINATOR ---
      if (
        role === RoleType.PROGRAM_MANAGER ||
        role === RoleType.FIELD_COORDINATOR
      ) {
        const { data: progUsers, error: puErr } = await this.supabase
          .from(TABLES.ProgramUser)
          .select("program_id")
          .eq("user", userId)
          .eq("is_deleted", false);

        if (puErr) {
          console.error("Error fetching program_user:", puErr);
          return [];
        }

        if (progUsers?.length) {
          const programIds = progUsers.map((pu) => pu.program_id);
          let query = this.supabase
            .from(TABLES.School)
            .select("*")
            .in("program_id", programIds)
            .eq("is_deleted", false)
            .order("name", { ascending: true })
            .range(from, to);

          if (search) query = query.ilike("name", `%${search}%`);

          const { data: progSchools, error: psErr } = await query;
          if (psErr) {
            console.error("Error fetching program schools:", psErr);
            return [];
          }

          // Deduplicate by school id
          const unique = new Map<string, { school: any; role: RoleType }>();
          for (const school of progSchools ?? []) {
            unique.set(school.id, { school, role });
          }
          return Array.from(unique.values());
        }
        return [];
      }
    }

    // --- Fallback to original logic ---
    const finalData: { school: TableTypes<"school">; role: RoleType }[] = [];
    const schoolIds: Set<string> = new Set();

    // Teacher-linked schools
    const { data: classUsers, error: classUserError } = await this.supabase
      .from(TABLES.ClassUser)
      .select("class_id")
      .eq("user_id", userId)
      .eq("role", RoleType.TEACHER)
      .eq("is_deleted", false);

    if (classUserError) {
      console.error("Error fetching class users:", classUserError);
    } else if (classUsers?.length) {
      const classIds = classUsers.map((cu) => cu.class_id);
      const { data: classes } = await this.supabase
        .from(TABLES.Class)
        .select("school_id")
        .in("id", classIds)
        .eq("is_deleted", false);

      if (classes?.length) {
        const schoolIdList = classes.map((c) => c.school_id);
        let query = this.supabase
          .from(TABLES.School)
          .select("*")
          .in("id", schoolIdList)
          .eq("is_deleted", false);

        if (search) query = query.ilike("name", `%${search}%`);

        const { data: schools, error: schoolError } = await query;
        if (!schoolError && schools?.length) {
          for (const school of schools) {
            if (!schoolIds.has(school.id)) {
              schoolIds.add(school.id);
              finalData.push({ school, role: RoleType.TEACHER });
            }
          }
        }
      }
    }

    // Schools linked via school_user (non-parent)
    const { data: schoolUsers } = await this.supabase
      .from(TABLES.SchoolUser)
      .select("role, school_id")
      .eq("user_id", userId)
      .neq("role", RoleType.PARENT)
      .eq("is_deleted", false);

    if (schoolUsers?.length) {
      const schoolUserIds = schoolUsers.map((su) => su.school_id);
      let query = this.supabase
        .from(TABLES.School)
        .select("*")
        .in("id", schoolUserIds)
        .eq("is_deleted", false);

      if (search) query = query.ilike("name", `%${search}%`);

      const { data: schools } = await query;
      for (const su of schoolUsers) {
        const school = schools?.find((s) => s.id === su.school_id);
        if (school && !schoolIds.has(school.id)) {
          schoolIds.add(school.id);
          finalData.push({ school, role: su.role as RoleType });
        }
      }
    }

    return finalData;
  }

  public set currentMode(value: MODES) {
    this._currentMode = value;
  }
  public get currentMode(): MODES {
    return this._currentMode;
  }
  async isUserTeacher(userId: string): Promise<boolean> {
    const schools = await this.getSchoolsForUser(userId);
    return schools.length > 0;
  }
  async getClassesForSchool(
    schoolId: string,
    userId: string
  ): Promise<TableTypes<"class">[]> {
    if (!this.supabase) return [];

    const { data: classUsers, error: classUserError } = await this.supabase
      .from(TABLES.ClassUser)
      .select(
        `
      role,
      class:class_id (
        *
      )
    `
      )
      .eq("user_id", userId)
      .neq("role", RoleType.PARENT)
      .eq("is_deleted", false)
      .eq("class.school_id", schoolId)
      .eq("class.is_deleted", false);

    if (classUserError) {
      console.error("Error fetching class users:", classUserError);
    }

    if (classUsers && classUsers.length > 0) {
      const classes = classUsers
        .map((cu) => (Array.isArray(cu.class) ? cu.class[0] : cu.class))
        .filter((cls): cls is TableTypes<"class"> => !!cls);

      if (classes.length > 0) return classes;
    }

    const { data: allClasses, error: allClassesError } = await this.supabase
      .from(TABLES.Class)
      .select("*")
      .eq("school_id", schoolId)
      .eq("is_deleted", false);

    if (allClassesError) {
      console.error("Error fetching all classes:", allClassesError);
    }

    return allClasses || [];
  }
  async getClassesBySchoolId(schoolId: string): Promise<TableTypes<"class">[]> {
    if (!this.supabase) return [];

    const { data: classes, error } = await this.supabase
      .from(TABLES.Class)
      .select("*")
      .eq("school_id", schoolId)
      .eq("is_deleted", false);

    if (error) {
      console.error("Error fetching classes by school ID:", error);
      return [];
    }

    return classes || [];
  }

  async getUsersByIds(userIds: string[]): Promise<TableTypes<"user">[]> {
    if (!this.supabase || userIds.length === 0) return [];

    const { data: users, error } = await this.supabase
      .from(TABLES.User)
      .select("*")
      .in("id", userIds)
      .eq("is_deleted", false);

    if (error) {
      console.error("Error fetching users by IDs:", error);
      return [];
    }

    return users || [];
  }

  async getStudentInfoBySchoolId(
    schoolId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<StudentAPIResponse> {
    if (!this.supabase) {
      console.warn("Supabase not initialized.");
      return { data: [], total: 0 };
    }

    const offset = (page - 1) * limit;

    const { data, error, count } = await this.supabase
      .from("class_user")
      .select(
        `
      class:class_id!inner (
        id,
        name 
      ),
      user:user_id (
        *,
        parent_links:parent_user!student_id (
          parent:parent_id (
            * 
          )
        )
      )
    `,
        { count: "exact" }
      )
      .eq("role", "student")
      .eq("is_deleted", false)
      .eq("class.school_id", schoolId)
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching student info:", error);
      return { data: [], total: 0 };
    }

    const studentInfoList: StudentInfo[] = (data || []).map((row: any) => {
      const { user, class: cls } = row;

      const className = cls?.name || "";
      const { grade, section } = this.parseClassName(className);

      const parent = user?.parent_links?.[0]?.parent || null;

      return {
        user,
        grade,
        classSection: section,
        parent,
        classWithidname: cls,
      };
    });

    return {
      data: studentInfoList,
      total: count ?? 0,
    };
  }
  async getStudentsAndParentsByClassId(
    classId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<StudentAPIResponse> {
    if (!this.supabase) {
      console.warn("Supabase not initialized.");
      return { data: [], total: 0 };
    }

    const offset = (page - 1) * limit;

    const { data, error, count } = await this.supabase
      .from("class_user")
      .select(
        `
      class:class_id!inner (
        id,
        name 
      ),
      user:user_id (
        *,
        parent_links:parent_user!student_id (
          parent:parent_id (
            * 
          )
        )
      )
    `,
        { count: "exact" }
      )
      .eq("role", "student")
      .eq("is_deleted", false)
      .eq("class_id", classId) // Filter by classId
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching students and parents by class ID:", error);
      return { data: [], total: 0 };
    }

    const studentInfoList: StudentInfo[] = (data || []).map((row: any) => {
      const { user, class: cls } = row;

      const className = cls?.name || "";
      const { grade, section } = this.parseClassName(className);

      const parent = user?.parent_links?.[0]?.parent || null;

      return {
        user,
        grade,
        classSection: section,
        parent,
      };
    });
    return {
      data: studentInfoList,
      total: count ?? 0,
    };
  }
  async getStudentAndParentByStudentId(studentId: string): Promise<{
    user: any;
    parents: any[];
  }> {
    if (!this.supabase) {
      console.warn("Supabase not initialized.");
      return { user: null, parents: [] };
    }

    const { data, error } = await this.supabase
      .from("user")
      .select(
        `
      *,
      parent_links:parent_user!student_id (
        parent:parent_id (
          *
        )
      )
      `
      )
      .eq("id", studentId)
      .eq("is_deleted", false)
      .single();

    if (error || !data) {
      console.error("Error fetching student and parent by student ID:", error);
      return { user: null, parents: [] };
    }
    const parents = (data.parent_links || []).map((link: any) => link.parent);

    return {
      user: data,
      parents,
    };
  }

  async mergeStudentRequest(
    requestId: string,
    existingStudentId: string,
    newStudentId: string,
    respondedBy: string
  ): Promise<void> {
    if (!this.supabase) {
      throw new Error("Supabase not initialized.");
    }
    const now = new Date().toISOString();

    // 1. Get new student details (including parents)
    const { data: newStudentData, error: newStudentError } = await this.supabase
      .from("user")
      .select(
        `
      *,
      parent_links:parent_user!student_id (
        parent:parent_id (*)
      )
    `
      )
      .eq("id", newStudentId)
      .eq("is_deleted", false)
      .single();

    if (newStudentError || !newStudentData) {
      throw new Error("New student not found");
    }

    const newParents = (newStudentData.parent_links || []).map(
      (link: any) => link.parent
    );

    // 2. Get existing student details (with parents)
    const { data: existingStudentData, error: existingStudentError } =
      await this.supabase
        .from("user")
        .select(
          `
        *,
        parent_links:parent_user!student_id (
          parent:parent_id (*)
        )
      `
        )
        .eq("id", existingStudentId)
        .eq("is_deleted", false)
        .single();

    if (existingStudentError || !existingStudentData) {
      throw new Error("Existing student not found");
    }

    const existingParents = (existingStudentData.parent_links || []).map(
      (link: any) => link.parent
    );

    // 3. Compare phone or email
    const existingContact =
      existingParents?.[0]?.phone || existingParents?.[0]?.email || null;
    const newContact = newParents?.[0]?.phone || newParents?.[0]?.email || null;

    // 4. Transfer results if present
    const { data: results } = await this.supabase
      .from("result")
      .select("*")
      .eq("student_id", newStudentId)
      .eq("is_deleted", false);

    if (results && results.length > 0) {
      await this.supabase
        .from("result")
        .update({ student_id: existingStudentId, updated_at: now })
        .eq("student_id", newStudentId)
        .eq("is_deleted", false);
    }

    // 5. If contact different, link new parent(s)
    if (newContact && newContact !== existingContact) {
      for (const parent of newParents) {
        const alreadyLinked = existingParents.some(
          (p: any) =>
            (p.phone && parent.phone && p.phone === parent.phone) ||
            (p.email && parent.email && p.email === parent.email)
        );

        if (!alreadyLinked) {
          await this.supabase.from("parent_user").insert({
            student_id: existingStudentId,
            parent_id: parent.id,
            is_deleted: false,
            updated_at: now,
          });
        }
      }
    }

    // 6. Mark new student and related records as deleted
    await this.supabase
      .from("class_user")
      .update({ is_deleted: true, updated_at: now })
      .eq("user_id", newStudentId);

    await this.supabase
      .from("parent_user")
      .update({ is_deleted: true, updated_at: now })
      .eq("student_id", newStudentId);

    await this.supabase
      .from("user")
      .update({ is_deleted: true, updated_at: now })
      .eq("id", newStudentId);

    const { error: updateRequestError } = await this.supabase
      .from("ops_requests")
      .update({
        request_status: "approved",
        updated_at: now,
        responded_by: respondedBy,
      })
      .eq("request_id", requestId); // Identify the specific request

    if (updateRequestError) {
      console.error(
        "Error updating ops_requests status:",
        updateRequestError.message
      );
      throw new Error("Failed to update request status.");
    }
  }

  async getUserRoleForSchool(
    userId: string,
    schoolId: string
  ): Promise<RoleType | undefined> {
    if (!this.supabase) return;

    // Check special users
    const { data: specialUser } = await this.supabase
      .from(TABLES.SpecialUsers)
      .select("role")
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .single();
    if (specialUser?.role) return specialUser.role as RoleType;

    // Check school_user (not parent)
    const { data: schoolUser } = await this.supabase
      .from(TABLES.SchoolUser)
      .select("role")
      .eq("user_id", userId)
      .eq("school_id", schoolId)
      .neq("role", RoleType.PARENT)
      .eq("is_deleted", false)
      .single();
    if (schoolUser?.role) return schoolUser.role as RoleType;

    // Check class_user → teacher
    const { data: classUsers } = await this.supabase
      .from(TABLES.ClassUser)
      .select("class_id")
      .eq("user_id", userId)
      .eq("role", RoleType.TEACHER)
      .eq("is_deleted", false);
    if (classUsers?.length) {
      const classIds = classUsers.map((cu) => cu.class_id);
      const { data: classes } = await this.supabase
        .from(TABLES.Class)
        .select("id, school_id")
        .in("id", classIds)
        .eq("is_deleted", false);
      if (classes?.some((c) => c.school_id === schoolId)) {
        return RoleType.TEACHER;
      }
    }

    return undefined;
  }

  async getTeacherInfoBySchoolId(
    schoolId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<TeacherAPIResponse> {
    if (!this.supabase) {
      console.warn("Supabase not initialized.");
      return { data: [], total: 0 };
    }

    const offset = (page - 1) * limit;

    const { data, error, count } = await this.supabase
      .from("class_user")
      .select(
        `
        user:user_id!inner(*),
        class:class_id!inner(
          id,
          name
        )
      `,
        { count: "exact" }
      )
      .eq("role", "teacher")
      .eq("is_deleted", false)
      .eq("class.school_id", schoolId)
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching teacher info:", error);
      return { data: [], total: 0 };
    }

    const teacherInfoList: TeacherInfo[] = (data || []).map((row: any) => {
      const { user, class: cls } = row;

      const { grade, section } = this.parseClassName(cls?.name || "");

      return {
        user,
        grade: grade,
        classSection: section,
        classWithidname: cls,
      };
    });

    return {
      data: teacherInfoList,
      total: count ?? 0,
    };
  }

  parseClassName(className: string): { grade: number; section: string } {
    const cleanedName = className.trim();
    if (!cleanedName) {
      return { grade: 0, section: "" };
    }

    let grade = 0;
    let section = "";

    const numericMatch = cleanedName.match(/^(\d+)$/);
    if (numericMatch) {
      grade = parseInt(numericMatch[1], 10);
      return { grade: isNaN(grade) ? 0 : grade, section: "" };
    }

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

  async getStudentsForClass(classId: string): Promise<TableTypes<"user">[]> {
    if (!this.supabase) return [];

    const { data: classUsers, error: classUserError } = await this.supabase
      .from(TABLES.ClassUser)
      .select("user_id")
      .eq("class_id", classId)
      .eq("role", RoleType.STUDENT)
      .eq("is_deleted", false);

    if (classUserError) {
      console.error("Error fetching class users:", classUserError);
    }

    if (classUsers && classUsers.length > 0) {
      const studentIds = classUsers.map((cu) => cu.user_id);
      const { data: students, error: studentError } = await this.supabase
        .from(TABLES.User)
        .select("*")
        .in("id", studentIds)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true });

      if (studentError) {
        console.error("Error fetching students:", studentError);
      }

      return students || [];
    }
    return [];
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
  async getDataByInviteCode(inviteCode: number): Promise<any> {
    try {
      const rpcRes = await this.supabase?.rpc("getDataByInviteCode", {
        invite_code: inviteCode,
      });
      if (rpcRes == null || rpcRes.error || !rpcRes.data) {
        throw rpcRes?.error ?? "";
      }
      const data = rpcRes.data;
      return data;
    } catch (e) {
      throw new Error("Invalid inviteCode");
    }
  }
  async createClass(
    schoolId: string,
    className: string,
    groupId?: string
  ): Promise<TableTypes<"class">> {
    if (!this.supabase) throw new Error("Supabase instance is not initialized");

    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw new Error("User is not Logged in");

    const classId = uuidv4();
    const timestamp = new Date().toISOString();

    const newClass: TableTypes<"class"> = {
      id: classId,
      name: className,
      image: null,
      school_id: schoolId,
      group_id: groupId ?? null,
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

    const { error } = await this.supabase.from("class").insert(newClass);
    if (error) {
      console.error("Error inserting class:", error);
      throw error;
    }
    return newClass;
  }
  async deleteClass(classId: string) {
    if (!this.supabase) return;

    try {
      // Soft-delete class_user (only teachers)
      const { error: classUserUpdateError } = await this.supabase
        .from("class_user")
        .update({ is_deleted: true })
        .eq("class_id", classId)
        .eq("role", RoleType.TEACHER);

      if (classUserUpdateError) {
        console.error("Error updating class_user:", classUserUpdateError);
        throw classUserUpdateError;
      }

      // Get affected class_user IDs (teachers)
      const { data: deletedClassUsers, error: classUserFetchError } =
        await this.supabase
          .from("class_user")
          .select("id")
          .eq("class_id", classId)
          .eq("role", RoleType.TEACHER)
          .eq("is_deleted", true);

      if (classUserFetchError) {
        console.error(
          "Error fetching updated class_user records:",
          classUserFetchError
        );
        throw classUserFetchError;
      }

      if (!deletedClassUsers || deletedClassUsers.length === 0) {
      }

      // Soft-delete class_course for this class
      const { error: classCourseUpdateError } = await this.supabase
        .from("class_course")
        .update({ is_deleted: true })
        .eq("class_id", classId);

      if (classCourseUpdateError) {
        console.error("Error updating class_course:", classCourseUpdateError);
        throw classCourseUpdateError;
      }

      // Get affected class_course IDs
      const { data: deletedClassCourses, error: classCourseFetchError } =
        await this.supabase
          .from("class_course")
          .select("id")
          .eq("class_id", classId)
          .eq("is_deleted", true);

      if (classCourseFetchError) {
        console.error(
          "Error fetching updated class_course records:",
          classCourseFetchError
        );
        throw classCourseFetchError;
      }

      if (!deletedClassCourses || deletedClassCourses.length === 0) {
      }

      // Soft-delete the class itself
      const { error: classUpdateError } = await this.supabase
        .from("class")
        .update({ is_deleted: true })
        .eq("id", classId)
        .eq("is_deleted", false);

      if (classUpdateError) {
        console.error("Error soft-deleting class:", classUpdateError);
        throw classUpdateError;
      }
    } catch (error) {
      console.error("Failed to delete class:", error);
      throw error;
    }
  }
  async updateClass(classId: string, className: string, groupId?: string) {
    if (!this.supabase) return;

    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw new Error("User is not Logged in");

    const updateData: any = { name: className };
    if (groupId !== undefined) updateData.group_id = groupId;

    const { error } = await this.supabase
      .from("class")
      .update(updateData)
      .eq("id", classId);

    if (error) {
      console.error("Error updating class name:", error);
      throw error;
    }
  }
  async linkStudent(inviteCode: number, studentId: string): Promise<any> {
    try {
      if (!studentId) {
        throw Error("Student Not Found");
      }
      const rpcRes = await this.supabase?.rpc("linkStudent", {
        invite_code: inviteCode,
        student_id: studentId,
      });
      if (rpcRes == null || rpcRes.error || !rpcRes.data) {
        throw rpcRes?.error ?? "";
      }
      const data = rpcRes.data;
      return data;
    } catch (e) {
      throw new Error("Invalid inviteCode");
    }
  }
  async getLeaderboardResults(
    sectionId: string,
    leaderboardDropdownType: LeaderboardDropdownList
  ): Promise<LeaderboardInfo | undefined> {
    try {
      if (!this.supabase)
        throw new Error("Supabase instance is not initialized");

      // Fetch leaderboard data using the Supabase RPC function
      const rpcRes = await this.supabase.rpc("get_class_leaderboard", {
        current_class_id: sectionId,
      });

      // Check if the response is valid
      if (rpcRes == null || rpcRes.error || !rpcRes.data) {
        throw rpcRes?.error ?? new Error("Failed to fetch leaderboard data");
      }

      // Initialize the leaderboard structure
      const data: any = rpcRes.data;
      let leaderBoardList: LeaderboardInfo = {
        weekly: [],
        allTime: [],
        monthly: [],
      };

      // Process the data and populate the leaderboard lists
      for (let i = 0; i < data.length; i++) {
        const result = data[i];
        const leaderboardEntry = {
          name: result.name || "",
          score: result.total_score || 0,
          timeSpent: result.total_time_spent || 0,
          lessonsPlayed: result.lessons_played || 0,
          userId: result.student_id || "",
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
      }

      return leaderBoardList;
    } catch (e) {
      console.error("Error in getLeaderboardResults: ", e);
      // Return an empty leaderboard structure in case of error
      return {
        weekly: [],
        allTime: [],
        monthly: [],
      };
    }
  }

  async getLeaderboardStudentResultFromB2CCollection(): Promise<
    LeaderboardInfo | undefined
  > {
    try {
      // Initialize leaderboard structure
      let leaderBoardList: LeaderboardInfo = {
        weekly: [],
        allTime: [],
        monthly: [],
      };

      // Define the query to fetch data from the view
      const genericQuery = `
      SELECT *
      FROM get_leaderboard_generic_data
    `;

      if (!this.supabase) {
        console.error("Supabase instance is not initialized");
        return;
      }

      // Execute the query
      const { data, error } = await this.supabase
        .from("get_leaderboard_generic_data")
        .select();

      // Handle errors in the query execution
      if (error) {
        console.error("Error fetching leaderboard data: ", error);
        return;
      }

      // Handle case where no data is returned
      if (!data) {
        console.warn("No data returned from get_leaderboard_generic_data");
        return;
      }

      // Process the results
      data.forEach((result) => {
        if (!result) return;

        const leaderboardEntry = {
          name: result.name || "",
          score: result.total_score || 0,
          timeSpent: result.total_time_spent || 0,
          lessonsPlayed: result.lessons_played || 0,
          userId: result.student_id || "",
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
    if (!this.supabase) return [];

    // 1. Get all chapters for the course
    const { data: chapters, error: chapterError } = await this.supabase
      .from(TABLES.Chapter)
      .select("id")
      .eq("course_id", courseId)
      .eq("is_deleted", false);

    if (chapterError || !chapters || chapters.length === 0) return [];

    const chapterIds = chapters.map((c) => c.id);

    // 2. Get all chapter_lesson entries for these chapters
    const { data: chapterLessons, error: clError } = await this.supabase
      .from(TABLES.ChapterLesson)
      .select("lesson_id")
      .in("chapter_id", chapterIds)
      .eq("is_deleted", false);

    if (clError || !chapterLessons || chapterLessons.length === 0) return [];

    const lessonIds = chapterLessons.map((cl) => cl.lesson_id);

    // 3. Get all lessons by these IDs
    const { data: lessons, error: lessonError } = await this.supabase
      .from(TABLES.Lesson)
      .select("*")
      .in("id", lessonIds)
      .eq("is_deleted", false);

    if (lessonError) return [];

    return lessons ?? [];
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
    if (!this.supabase) {
      return { lesson: [], course: [] };
    }

    const { data, error } = await this.supabase
      .from("chapter_lesson")
      .select(
        `
      lesson(*),
      chapter:chapter_id (
        course:course_id (*)
      )
    `
      )
      .eq("chapter_id", chapterId)
      .eq("lesson_id", lessonId)
      .eq("is_deleted", false)
      .eq("chapter.is_deleted", false)
      .eq("lesson.is_deleted", false);

    if (error) {
      console.error("Error fetching lesson from chapter:", error);
      return { lesson: [], course: [] };
    }

    if (!data || data.length === 0) {
      return { lesson: [], course: [] };
    }

    // Flatten lesson in case it's an array or null
    const lessonData = data
      .flatMap((item) =>
        Array.isArray(item.lesson) ? item.lesson : [item.lesson]
      )
      .filter((lesson): lesson is TableTypes<"lesson"> => !!lesson);

    const courseData = data
      .flatMap((item) => item.chapter ?? [])
      .flatMap((chapter) => chapter.course ?? [])
      .filter((course): course is TableTypes<"course"> => !!course);

    return {
      lesson: lessonData,
      course: courseData,
    };
  }
  async getCoursesByGrade(gradeDocId: any): Promise<TableTypes<"course">[]> {
    if (!this.supabase) return [];
    try {
      const gradeCoursesRes = await this.supabase
        .from(TABLES.Course)
        .select("*")
        .eq("grade_id", gradeDocId)
        .eq("is_deleted", false);

      const puzzleCoursesRes = await this.supabase
        .from(TABLES.Course)
        .select("*")
        .eq("name", "Digital Skills")
        .eq("is_deleted", false);

      const gradeCourses = gradeCoursesRes.data ?? [];
      const puzzleCourses = puzzleCoursesRes.data ?? [];

      return [...gradeCourses, ...puzzleCourses];
    } catch (error) {
      console.error("Error fetching courses by grade:", error);
      return [];
    }
  }
  async getAllCourses(): Promise<TableTypes<"course">[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from("course")
      .select("*")
      .eq("is_deleted", false)
      .order("sort_index", { ascending: true });

    if (error) {
      console.error("Error fetching all courses:", error);
      return [];
    }

    return data ?? [];
  }
  deleteAllUserData(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async getCoursesFromLesson(
    lessonId: string
  ): Promise<TableTypes<"course">[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from("chapter_lesson")
      .select(
        `
      chapter:chapter_id (
        course:course_id (*)
      )
    `
      )
      .eq("lesson_id", lessonId)
      .eq("is_deleted", false)
      .eq("chapter.is_deleted", false);

    if (error) {
      console.error("Error fetching courses from lesson:", error);
      return [];
    }

    // Flatten to get all courses from chapters (each chapter.course is an array)
    const courses = data
      .flatMap((item) => item.chapter ?? [])
      .flatMap((chapter) => chapter.course ?? [])
      .filter((course): course is TableTypes<"course"> => !!course);

    return courses;
  }
  async assignmentUserListner(
    studentId: string,
    onDataChange: (
      assignment_user: TableTypes<"assignment_user"> | undefined
    ) => void
  ) {
    try {
      if (this._assignmentUserRealTime) {
        this._assignmentUserRealTime.unsubscribe();
        this._assignmentUserRealTime = undefined;
      }

      this._assignmentUserRealTime = this.supabase?.channel("assignment_user");
      if (!this._assignmentUserRealTime) {
        throw new Error("Failed to establish channel for assignment_user");
      }

      this._assignmentUserRealTime
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "assignment_user",
            filter: `user_id=eq.${studentId}`,
          },
          (payload) => {
            if (onDataChange) {
              onDataChange(payload.new as TableTypes<"assignment_user">);
            } else {
              console.error(
                "🛑 onDataChange is undefined for assignment_user!"
              );
            }
          }
        )
        .subscribe();
    } catch (error) {
      console.error("🛑 Error in Supabase assignment_user listener:", error);
    }
  }

  async assignmentListner(
    classId: string,
    onDataChange: (assignment: TableTypes<"assignment"> | undefined) => void
  ) {
    try {
      if (this._assignmetRealTime) {
        this._assignmetRealTime.unsubscribe();
        this._assignmetRealTime = undefined;
      }

      this._assignmetRealTime = this.supabase?.channel("assignment");
      if (!this._assignmetRealTime) {
        throw new Error("Failed to establish channel for assignment");
      }
      this._assignmetRealTime
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "assignment",
            filter: `class_id=eq.${classId}`,
          },
          (payload) => {
            if (onDataChange) {
              onDataChange(payload.new as TableTypes<"assignment">);
            } else {
              console.error("🛑 onDataChange is undefined!");
            }
          }
        )
        .subscribe();
    } catch (error) {
      console.error("🛑 Error in Supabase listener:", error);
    }
  }
  async removeAssignmentChannel() {
    try {
      if (this._assignmentUserRealTime)
        this.supabase?.removeChannel(this._assignmentUserRealTime);
      this._assignmentUserRealTime = undefined;
      if (this._assignmetRealTime)
        this.supabase?.removeChannel(this._assignmetRealTime);
      this._assignmetRealTime = undefined;
    } catch (error) {
      throw error;
    }
  }
  async liveQuizListener(
    liveQuizRoomDocId: string,
    onDataChange: (roomDoc: TableTypes<"live_quiz_room"> | undefined) => void
  ) {
    try {
      const roomDoc = await this.getLiveQuizRoomDoc(liveQuizRoomDocId);
      onDataChange(roomDoc);

      this._liveQuizRealTime = this.supabase?.channel("live_quiz_room");

      if (!this._liveQuizRealTime) {
        throw new Error("Failed to establish channel for live quiz room");
      }

      const res = this._liveQuizRealTime
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "live_quiz_room",
            filter: `id=eq.${liveQuizRoomDocId}`,
          },
          (payload) => {
            onDataChange(payload.new as TableTypes<"live_quiz_room">);
          }
        )
        .subscribe();
      return;
    } catch (error) {
      console.error("Error setting up live quiz room listener:", error);
      throw error;
    }
  }
  async removeLiveQuizChannel() {
    try {
      if (this._liveQuizRealTime)
        this.supabase?.removeChannel(this._liveQuizRealTime);
    } catch (error) {
      throw error;
    }
  }
  async updateLiveQuiz(
    roomDocId: string,
    studentId: string,
    questionId: string,
    timeSpent: number,
    score: number
  ): Promise<void> {
    try {
      await this.supabase?.rpc("update_live_quiz", {
        room_id: roomDocId,
        student_id: studentId,
        question_id: questionId,
        time_spent: timeSpent,
        score: score,
      });
    } catch (error) {
      console.error("Error updating quiz result:", error);
      throw error;
    }
  }

  async joinLiveQuiz(
    assignmentId: string,
    studentId: string
  ): Promise<string | undefined> {
    let liveQuizId = await this?.supabase?.rpc("join_live_quiz", {
      _assignment_id: assignmentId,
      _student_id: studentId,
    });

    if (liveQuizId == null || liveQuizId.error || !liveQuizId.data) {
      throw liveQuizId?.error ?? "";
    }
    const data = liveQuizId.data;
    return data;
  }
  async getStudentResultsByAssignmentId(assignmentId: string): Promise<
    {
      result_data: TableTypes<"result">[];
      user_data: TableTypes<"user">[];
    }[]
  > {
    try {
      const results = await this?.supabase?.rpc("get_results_by_assignment", {
        _assignment_id: assignmentId,
      });
      if (results == null || results.error || !results.data) {
        throw results?.error ?? "";
      }
      const data = results.data;
      return data;
    } catch (error) {
      throw error;
    }
  }
  async getAssignmentById(
    id: string
  ): Promise<TableTypes<"assignment"> | undefined> {
    if (!this.supabase) return undefined;

    const { data, error } = await this.supabase
      .from("assignment")
      .select("*")
      .eq("id", id)
      .eq("is_deleted", false)
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching assignment by id:", error);
      return undefined;
    }

    return data ?? undefined;
  }
  async createOrUpdateAssignmentCart(
    userId: string,
    lessons: string
  ): Promise<boolean | undefined> {
    if (!this.supabase) return undefined;

    const now = new Date().toISOString();

    const { error } = await this.supabase.from("assignment_cart").upsert(
      {
        id: userId,
        lessons,
        updated_at: now,
      },
      { onConflict: "id" }
    );

    if (error) {
      console.error("Error creating/updating assignment cart:", error);
      return false;
    }

    return true;
  }
  async getBadgesByIds(ids: string[]): Promise<TableTypes<"badge">[]> {
    if (!this.supabase || ids.length === 0) return [];

    const { data, error } = await this.supabase
      .from("badge")
      .select("*")
      .in("id", ids)
      .eq("is_deleted", false);

    if (error) {
      console.error("Error fetching badges by IDs:", error);
      return [];
    }

    return data ?? [];
  }
  async getStickersByIds(ids: string[]): Promise<TableTypes<"sticker">[]> {
    if (!this.supabase || ids.length === 0) return [];

    const { data, error } = await this.supabase
      .from("sticker")
      .select("*")
      .in("id", ids)
      .eq("is_deleted", false);

    if (error) {
      console.error("Error fetching stickers by IDs:", error);
      return [];
    }

    return data ?? [];
  }
  async getRewardsById(
    id: number,
    periodType: string
  ): Promise<TableTypes<"reward"> | undefined> {
    if (!this.supabase) return;

    try {
      const { data, error } = await this.supabase
        .from("reward")
        .select(`${periodType}`)
        .eq("year", id)
        .single();

      if (error) {
        console.error("Error fetching reward by ID:", error);
        return;
      }

      if (!data || !data[periodType]) {
        console.error("No reward found for the given year or periodType.");
        return;
      }

      try {
        return JSON.parse(data[0][periodType]);
      } catch (parseError) {
        console.error("Error parsing JSON from reward data:", parseError);
        return;
      }
    } catch (error) {
      console.error("Unexpected error in getRewardsById:", error);
      return;
    }
  }
  async getUserSticker(userId: string): Promise<TableTypes<"user_sticker">[]> {
    if (!this.supabase) return [];

    try {
      const { data, error } = await this.supabase
        .from("user_sticker")
        .select("*")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching stickers by user ID:", error);
        return [];
      }

      if (!data || data.length === 0) {
        console.error("No sticker found for the given user ID.");
        return [];
      }

      return data;
    } catch (error) {
      console.error("Unexpected error in getUserSticker:", error);
      return [];
    }
  }
  async getUserBadge(userId: string): Promise<TableTypes<"user_badge">[]> {
    if (!this.supabase) return [];

    try {
      const { data, error } = await this.supabase
        .from("user_badge")
        .select("*")
        .eq("user_id", userId)
        .eq("is_deleted", false);

      if (error) {
        console.error("Error fetching user badge by user ID:", error);
        return [];
      }

      if (!data || data.length === 0) {
        console.error("No badge found for the given user ID.");
        return [];
      }

      return data;
    } catch (error) {
      console.error("Unexpected error in getUserBadge:", error);
      return [];
    }
  }
  async getUserBonus(userId: string): Promise<TableTypes<"user_bonus">[]> {
    if (!this.supabase) return [];

    try {
      const { data, error } = await this.supabase
        .from("user_bonus")
        .select("*")
        .eq("user_id", userId)
        .eq("is_deleted", false);

      if (error) {
        console.error("Error fetching user bonus by user ID:", error);
        return [];
      }

      if (!data || data.length === 0) {
        console.error("No bonus found for the given user ID.");
        return [];
      }

      return data;
    } catch (error) {
      console.error("Unexpected error in getUserBonus:", error);
      return [];
    }
  }
  async updateRewardAsSeen(studentId: string): Promise<void> {
    if (!this.supabase) return;

    try {
      const { error } = await this.supabase
        .from(TABLES.UserSticker)
        .update({ is_seen: true })
        .eq("user_id", studentId)
        .eq("is_seen", false)
        .eq("is_deleted", false);

      if (error) {
        console.error("Error updating rewards as seen:", error);
        throw new Error("Error updating rewards as seen.");
      }
    } catch (err) {
      console.error("Unexpected error updating rewards as seen:", err);
      throw new Error("Unexpected error updating rewards as seen.");
    }
  }
  async getSchoolDetailsByUdise(udiseCode: string): Promise<{
    studentLoginType: string;
    schoolModel: string;
  } | null> {
    if (!this.supabase) return null;

    try {
      // Fetch student_login_type and program_model directly from school table
      const { data: schoolData, error } = await this.supabase
        .from("school")
        .select("student_login_type, model")
        .eq("udise", udiseCode)
        .eq("is_deleted", false)
        .single();
      if (error || !schoolData) {
        console.error("Error fetching school data:", error);
        return null;
      }

      const { student_login_type, model } = schoolData;

      return {
        studentLoginType: student_login_type || "",
        schoolModel: model || "",
      };
    } catch (err) {
      console.error("Unexpected error in getSchoolDetailsByUdise:", err);
      return null;
    }
  }
  async getSchoolDataByUdise(
    udiseCode: string
  ): Promise<TableTypes<"school_data"> | null> {
    if (!this.supabase) return null;

    try {
      const { data, error } = await this.supabase
        .from("school_data")
        .select("*")
        .eq("udise_code", udiseCode)
        .single();

      if (error || !data) {
        console.error("Error fetching school_data record:", error);
        return null;
      }

      return data; // return entire row
    } catch (err) {
      console.error("Unexpected error in getSchoolDataByUdise:", err);
      return null;
    }
  }

  async getUserByDocId(
    studentId: string
  ): Promise<TableTypes<"user"> | undefined> {
    try {
      const res = await this.supabase
        ?.from("user")
        .select("*")
        .eq("id", studentId)
        .eq("is_deleted", false);
      return res?.data?.[0];
    } catch (error) {
      throw error;
    }
  }
  async getGradeById(id: string): Promise<TableTypes<"grade"> | undefined> {
    if (!this.supabase) return;

    try {
      const { data, error } = await this.supabase
        .from("grade")
        .select("*")
        .eq("id", id)
        .eq("is_deleted", false)
        .single();

      if (error) {
        console.error("Error fetching grade by ID:", error);
        return;
      }

      return data;
    } catch (err) {
      console.error("Unexpected error fetching grade by ID:", err);
      return;
    }
  }
  async getGradesByIds(ids: string[]): Promise<TableTypes<"grade">[]> {
    if (!this.supabase || !ids || ids.length === 0) {
      return [];
    }

    try {
      const { data, error } = await this.supabase
        .from("grade")
        .select("*")
        .in("id", ids)
        .eq("is_deleted", false);

      if (error) {
        console.error("Error fetching grades by IDs:", error);
        return [];
      }

      return data ?? [];
    } catch (err) {
      console.error("Unexpected error fetching grades by IDs:", err);
      return [];
    }
  }
  async getCurriculumById(
    id: string
  ): Promise<TableTypes<"curriculum"> | undefined> {
    if (!this.supabase) return;

    try {
      const { data, error } = await this.supabase
        .from("curriculum")
        .select("*")
        .eq("id", id)
        .eq("is_deleted", false)
        .single();

      if (error) {
        console.error("Error fetching curriculum by ID:", error);
        return;
      }

      return data ?? undefined;
    } catch (err) {
      console.error("Unexpected error fetching curriculum by ID:", err);
      return;
    }
  }
  async getCurriculumsByIds(
    ids: string[]
  ): Promise<TableTypes<"curriculum">[]> {
    if (!this.supabase || ids.length === 0) return [];

    try {
      const { data, error } = await this.supabase
        .from("curriculum")
        .select("*")
        .in("id", ids)
        .eq("is_deleted", false);

      if (error) {
        console.error("Error fetching curriculums by IDs:", error);
        return [];
      }

      return data ?? [];
    } catch (err) {
      console.error("Unexpected error fetching curriculums by IDs:", err);
      return [];
    }
  }
  updateRewardsForStudent(studentId: string, unlockReward: LeaderboardRewards) {
    throw new Error("Method not implemented.");
  }

  async getRecommendedLessons(
    studentId: string,
    classId?: string
  ): Promise<TableTypes<"lesson">[]> {
    if (!this.supabase) return [];

    // 1. Get courses for the student or class
    let coursesRes;
    if (classId) {
      coursesRes = await this.supabase
        .from("class_course")
        .select("course_id, course(sort_index)")
        .eq("class_id", classId)
        .eq("is_deleted", false);
    } else {
      coursesRes = await this.supabase
        .from("user_course")
        .select("course_id, course(sort_index)")
        .eq("user_id", studentId)
        .eq("is_deleted", false);
    }

    if (coursesRes.error || !coursesRes.data) return [];

    // Build courseIds and courseIndexMap
    const courseIds = coursesRes.data.map((c) => c.course_id);
    const courseIndexMap = new Map<string, number>();
    coursesRes.data.forEach((c) => {
      // c.course may be null if not joined, so fallback to 0
      courseIndexMap.set(c.course_id, c.course?.sort_index ?? 0);
    });

    if (courseIds.length === 0) return [];

    // 2. Get all lessons and chapters for these courses
    const courseDetailsRes = await this.supabase
      .from("chapter_lesson")
      .select(
        `
      lesson (
        id, name, cocos_subject_code, cocos_chapter_code, cocos_lesson_id,
        image, outcome, plugin_type, status, created_by, subject_id,
        target_age_from, target_age_to, language_id, created_at, updated_at,
        is_deleted, color
      ),
      chapter (
        id, name, course_id, sort_index
      ),
      sort_index
    `
      )
      .in("chapter.course_id", courseIds)
      .eq("is_deleted", false)
      .eq("lesson.is_deleted", false)
      .eq("chapter.is_deleted", false)
      .order("chapter.course_id")
      .order("chapter.sort_index")
      .order("sort_index");

    if (courseDetailsRes.error || !courseDetailsRes.data) return [];

    const courseDetails = (courseDetailsRes.data as any[]).map((item) => ({
      lesson: Array.isArray(item.lesson) ? item.lesson[0] : item.lesson,
      chapter: Array.isArray(item.chapter) ? item.chapter[0] : item.chapter,
      sort_index: item.sort_index,
    })) as {
      lesson: TableTypes<"lesson">;
      chapter: {
        id: string;
        name: string;
        course_id: string;
        sort_index: number;
      };
      sort_index: number;
    }[];

    // 3. Get all results for this student
    const resultsRes = await this.supabase
      .from("result")
      .select("id, student_id, lesson_id, assignment_id, score, updated_at")
      .eq("student_id", studentId)
      .eq("is_deleted", false);

    if (resultsRes.error || !resultsRes.data) return [];

    // 4. Map lesson_id -> lesson info
    const lessonIdToInfoMap = new Map<
      string,
      {
        course_id: string;
        course_index: number;
        chapter_id: string;
        chapter_index: number;
        lesson_index: number;
        lesson: TableTypes<"lesson">;
      }
    >();
    courseDetails.forEach((item) => {
      lessonIdToInfoMap.set(item.lesson.id, {
        course_id: item.chapter.course_id,
        course_index: courseIndexMap.get(item.chapter.course_id) ?? 0,
        chapter_id: item.chapter.id,
        chapter_index: item.chapter.sort_index,
        lesson_index: item.sort_index,
        lesson: item.lesson,
      });
    });

    // 5. Find last played lesson per course (latest updated_at)
    const lastPlayedMap = new Map<
      string,
      {
        result: (typeof resultsRes.data)[0];
        info: {
          course_index: number;
          chapter_id: string;
          chapter_index: number;
          lesson_index: number;
          lesson: TableTypes<"lesson">;
        };
      }
    >();
    for (const r of resultsRes.data) {
      if (!r.lesson_id) continue;
      const info = lessonIdToInfoMap.get(r.lesson_id);
      if (!info) continue;
      const updatedAt = r.updated_at ? new Date(r.updated_at) : null;
      const existing = lastPlayedMap.get(info.course_id);
      const existingUpdatedAt = existing?.result.updated_at
        ? new Date(existing.result.updated_at)
        : null;
      if (updatedAt && (!existingUpdatedAt || updatedAt > existingUpdatedAt)) {
        lastPlayedMap.set(info.course_id, {
          result: r,
          info: {
            course_index: info.course_index,
            chapter_id: info.chapter_id,
            chapter_index: info.chapter_index,
            lesson_index: info.lesson_index,
            lesson: info.lesson,
          },
        });
      }
    }

    // 6. For each last played lesson, get the next lesson in the same chapter
    const nextLessons: TableTypes<"lesson">[] = [];
    for (const { info } of lastPlayedMap.values()) {
      const sameChapterLessons = courseDetails
        .filter(
          (cd) =>
            cd.chapter.id === info.chapter_id &&
            cd.sort_index > info.lesson_index
        )
        .sort((a, b) => a.sort_index - b.sort_index);
      if (sameChapterLessons.length > 0) {
        nextLessons.push(sameChapterLessons[0].lesson);
      }
    }

    // 7. For never played courses, get the first lesson (chapter_index=0, lesson_index=0)
    const neverPlayedCourses = courseIds.filter(
      (cid) => !lastPlayedMap.has(cid)
    );
    const firstLessons: TableTypes<"lesson">[] = courseDetails
      .filter(
        (cd) =>
          neverPlayedCourses.includes(cd.chapter.course_id) &&
          cd.chapter.sort_index === 0 &&
          cd.sort_index === 0
      )
      .map((cd) => cd.lesson);

    // 8. Last played lessons
    const lastPlayedLessons: TableTypes<"lesson">[] = Array.from(
      lastPlayedMap.values()
    ).map((v) => v.info.lesson);

    // 9. Combine and sort
    const allLessons = [
      ...lastPlayedLessons,
      ...firstLessons,
      ...nextLessons,
    ].map((lesson) => ({
      ...lesson,
      course_index:
        courseIndexMap.get(lessonIdToInfoMap.get(lesson.id)?.course_id ?? "") ??
        0,
    }));

    allLessons.sort((a, b) => {
      if (a.course_index !== b.course_index) {
        return a.course_index - b.course_index;
      }
      return (a.name ?? "").localeCompare(b.name ?? "");
    });

    return allLessons;
  }

  async searchLessons(searchString: string): Promise<TableTypes<"lesson">[]> {
    if (!this.supabase) return [];
    const { data, error } = await this.supabase.rpc("find_similar_lessons", {
      search_text: searchString,
    });
    if (error) return [];
    return data;
  }
  async getUserAssignmentCart(
    userId: string
  ): Promise<TableTypes<"assignment_cart"> | undefined> {
    if (!this.supabase) return;

    const { data, error } = await this.supabase
      .from("assignment_cart")
      .select("*")
      .eq("id", userId)
      .eq("is_deleted", false)
      .single();

    if (error || !data) return;

    return data;
  }

  async getChapterByLesson(
    lessonId: string,
    classId?: string,
    userId?: string
  ): Promise<String | undefined> {
    try {
      if (!this.supabase) return;

      const classCourses = classId
        ? await this.getCoursesForClassStudent(classId)
        : await this.getCoursesForParentsStudent(userId ?? "");

      const { data, error } = await this.supabase
        .from("chapter_lesson")
        .select("chapter_id, chapter(course_id), lesson!inner(id)")
        .eq("lesson_id", lessonId)
        .eq("is_deleted", false)
        .eq("chapter.is_deleted", false)
        .eq("lesson.is_deleted", false);

      if (error || !data || data.length < 1) return;

      const classCourseIds = new Set(classCourses.map((course) => course.id));

      const matchedLesson = data.find((item) => {
        const courseId = item.chapter?.course_id;
        return courseId && classCourseIds.has(courseId);
      });

      return matchedLesson ? matchedLesson.chapter_id : data[0].chapter_id;
    } catch (error) {
      console.error("Error fetching chapter by lesson ID:", error);
      return;
    }
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
    if (!this.supabase) return;

    let query = this.supabase
      .from("assignment")
      .select("*")
      .eq("class_id", classId)
      .in("course_id", courseIds)
      .gte("created_at", endDate)
      .lte("created_at", startDate)
      .eq("is_deleted", false);

    // Handle both string and array courseIds
    // if (typeof courseId === "string") {
    //   query = query.eq("course_id", courseId);
    // } else if (Array.isArray(courseId) && courseId.length > 0) {
    //   query = query.in("course_id", courseId);
    // }

    if (isClassWise) {
      query = query.eq("is_class_wise", true);
    }

    if (!allAssignments) {
      if (isLiveQuiz) {
        query = query.eq("type", "liveQuiz");
      } else {
        query = query.neq("type", "liveQuiz");
      }
    }

    query = query.order("created_at", { ascending: false });
    const { data, error } = await query;

    if (error || !data || data.length < 1) return;
    return data;
  }
  async getStudentLastTenResults(
    studentId: string,
    courseIds: string[],
    assignmentIds: string[],
    classId
  ): Promise<TableTypes<"result">[]> {
    if (!this.supabase) return [];

    // 1. Fetch results with assignment_id IS NULL
    const { data: nullAssignments, error: nullError } = await this.supabase
      .from("result")
      .select("*")
      .eq("student_id", studentId)
      .in("course_id", courseIds)
      .eq("class_id", classId)
      .is("assignment_id", null)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(5);

    if (nullError) {
      console.error("Error fetching null assignments:", nullError.message);
    }

    // 2. Fetch results with assignment_id IN (provided IDs)
    let nonNullAssignments: TableTypes<"result">[] = [];
    if (assignmentIds.length > 0) {
      const { data, error } = await this.supabase
        .from("result")
        .select("*")
        .eq("student_id", studentId)
        .in("course_id", courseIds)
        .eq("class_id", classId)
        .in("assignment_id", assignmentIds)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Error fetching non-null assignments:", error.message);
      } else {
        nonNullAssignments = data ?? [];
      }
    }

    // 3. Combine and sort the results by created_at desc
    const combinedResults = [...(nullAssignments ?? []), ...nonNullAssignments];
    combinedResults.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return combinedResults.slice(0, 10);
  }
  async getAssignmentUserByAssignmentIds(
    assignmentIds: string[]
  ): Promise<TableTypes<"assignment_user">[]> {
    if (!this.supabase) return [];

    if (!assignmentIds || assignmentIds.length === 0) {
      return [];
    }

    const { data, error } = await this.supabase
      .from("assignment_user")
      .select("*")
      .in("assignment_id", assignmentIds)
      .eq("is_deleted", false);

    if (error) {
      console.error("Error fetching assignment_user records:", error.message);
      return [];
    }

    return data ?? [];
  }
  async getResultByAssignmentIds(
    assignmentIds: string[]
  ): Promise<TableTypes<"result">[] | undefined> {
    if (!this.supabase || assignmentIds.length === 0) return;

    const { data, error } = await this.supabase
      .from("result")
      .select("*")
      .in("assignment_id", assignmentIds)
      .eq("is_deleted", false);

    if (error) {
      console.error("Error fetching results by assignment IDs:", error.message);
      return;
    }

    return data ?? [];
  }

  async getResultByAssignmentIdsForCurrentClassMembers(
    assignmentIds: string[],
    classId: string
  ): Promise<TableTypes<"result">[] | undefined> {
    if (!this.supabase || assignmentIds.length === 0) return;

    const { data, error } = await this.supabase
      .from("result")
      .select(
        `
        *,
        class_user!inner(
          class_id,
          is_deleted,
          role
        )
      `
      )
      .in("assignment_id", assignmentIds)
      .eq("is_deleted", false)
      .eq("class_user.class_id", classId)
      .eq("class_user.is_deleted", false)
      .eq("class_user.role", "student");

    if (error) {
      console.error(
        "Error fetching results for current class members:",
        error.message
      );
      return;
    }

    return data ?? [];
  }
  async getLastAssignmentsForRecommendations(
    classId: string
  ): Promise<TableTypes<"assignment">[] | undefined> {
    if (!this.supabase) return;

    const { data: assignments, error } = await this.supabase
      .from("assignment")
      .select("*")
      .eq("class_id", classId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching assignments:", error.message);
      return;
    }

    if (!assignments || assignments.length === 0) return [];

    const latestAssignmentsMap = new Map<string, TableTypes<"assignment">>();

    for (const assignment of assignments) {
      const courseId = assignment.course_id;
      if (typeof courseId === "string" && !latestAssignmentsMap.has(courseId)) {
        latestAssignmentsMap.set(courseId, assignment);
      }
    }

    const latestAssignments = Array.from(latestAssignmentsMap.values());
    latestAssignments.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return latestAssignments;
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
    if (!this.supabase) return;

    const assignmentId = uuidv4();
    const timestamp = new Date().toISOString();

    try {
      // Insert into assignment table
      const { error: assignmentError } = await this.supabase
        .from("assignment")
        .insert([
          {
            id: assignmentId,
            created_by: userId,
            starts_at,
            ends_at,
            is_class_wise,
            class_id,
            school_id,
            lesson_id,
            chapter_id,
            course_id,
            type,
            source: source ?? null,
            batch_id: batch_id ?? null,
            created_at: created_at ?? timestamp,
            updated_at: timestamp,
            is_deleted: false,
          },
        ]);

      if (assignmentError) {
        console.error("Error inserting assignment:", assignmentError.message);
      }

      // If not class-wise, insert into assignment_user
      if (!is_class_wise && student_list.length > 0) {
        const assignmentUserEntries = student_list.map((studentId) => ({
          id: uuidv4(),
          assignment_id: assignmentId,
          user_id: studentId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_deleted: false,
        }));

        const { error: userError } = await this.supabase
          .from("assignment_user")
          .insert(assignmentUserEntries);

        if (userError) {
          console.error(
            "Error inserting assignment_user records:",
            userError.message
          );
        }
      }
    } catch (error) {
      console.error("Unexpected error in createAssignment:", error);
    }
  }

  async getTeachersForClass(
    classId: string
  ): Promise<TableTypes<"user">[] | undefined> {
    if (!this.supabase) return;

    //  Get all user_ids of teachers for the class
    const { data: classUsers, error: classUserError } = await this.supabase
      .from(TABLES.ClassUser)
      .select("user_id")
      .eq("class_id", classId)
      .eq("role", RoleType.TEACHER)
      .eq("is_deleted", false);

    if (classUserError) {
      console.error("Error fetching class users:", classUserError);
      return [];
    }

    const userIds = classUsers?.map((cu) => cu.user_id) ?? [];
    if (userIds.length === 0) return [];

    //  Get user details for those user_ids
    const { data: users, error: userError } = await this.supabase
      .from(TABLES.User)
      .select("*")
      .in("id", userIds)
      .eq("is_deleted", false);

    if (userError) {
      console.error("Error fetching users:", userError);
      return [];
    }

    return users ?? [];
  }
  async getUserByEmail(email: string): Promise<TableTypes<"user"> | undefined> {
    try {
      const results = await this?.supabase?.rpc("get_user_by_email", {
        p_email: email,
      });
      if (results == null || results.error || !results.data) {
        throw results?.error ?? "";
      }
      const data = results.data;
      return data;
    } catch (error) {
      throw error;
    }
  }
  async getUserByPhoneNumber(
    phone: string
  ): Promise<TableTypes<"user"> | undefined> {
    try {
      const results = await this?.supabase?.rpc("get_user_by_phonenumber", {
        p_phone: phone,
      });
      if (results == null || results.error || !results.data) {
        throw results?.error ?? "";
      }
      const data = results.data;
      return data;
    } catch (error) {
      throw error;
    }
  }
  async addTeacherToClass(
    schoolId: string,
    classId: string,
    user: TableTypes<"user">
  ): Promise<void> {
    if (!this.supabase) return;

    const classUserId = uuidv4();
    const now = new Date().toISOString();

    const classUser = {
      id: classUserId,
      class_id: classId,
      user_id: user.id,
      role: RoleType.TEACHER as Database["public"]["Enums"]["role"],
      created_at: now,
      updated_at: now,
      is_deleted: false,
    };

    // Insert into class_user table

    const { error: insertError } = await this.supabase
      .from(TABLES.ClassUser)
      .insert(classUser);

    if (insertError) {
      console.error("Error inserting class_user:", insertError);
      throw insertError;
    }

    // Fetch user doc from your server API
    // const user_doc = await this.getUserByDocId(userId);
    const { error: schoolUpdateError } = await this.supabase
      .from(TABLES.School)
      .update({ updated_at: now })
      .eq("id", schoolId)
      .eq("is_deleted", false);

    // 🔹 Update 'school_course' table
    const { error: schoolCourseUpdateError } = await this.supabase
      .from(TABLES.SchoolCourse)
      .update({ updated_at: now })
      .eq("school_id", schoolId)
      .eq("is_deleted", false);
    // Insert into user table with upsert logic (on conflict do nothing)

    const { error: classUpdateError } = await this.supabase
      .from(TABLES.Class)
      .update({ updated_at: now })
      .eq("id", classId)
      .eq("is_deleted", false);

    // 🔹 Update 'school_course' table
    const { error: classCourseUpdateError } = await this.supabase
      .from(TABLES.ClassCourse)
      .update({ updated_at: now })
      .eq("class_id", classId)
      .eq("is_deleted", false);
    if (user) {
      const { error: userInsertError } = await this.supabase
        .from(TABLES.User)
        .upsert(
          {
            id: user.id,
            name: user.name,
            age: user.age,
            gender: user.gender,
            avatar: user.avatar,
            image: user.image,
            curriculum_id: user.curriculum_id,
            language_id: user.language_id,
            created_at: user.created_at,
            updated_at: user.updated_at,
          },
          { ignoreDuplicates: true }
        );

      if (userInsertError) {
        console.error("Error inserting user:", userInsertError);
        throw userInsertError;
      }
    }
  }
  async checkUserExistInSchool(
    schoolId: string,
    userId: string
  ): Promise<boolean> {
    if (!this.supabase) return false;

    //  Check if user is in school_user but NOT as a parent and not deleted
    const { data: schoolUsers, error: schoolUserError } = await this.supabase
      .from(TABLES.SchoolUser)
      .select("*")
      .eq("school_id", schoolId)
      .eq("user_id", userId)
      .neq("role", RoleType.PARENT)
      .eq("is_deleted", false);

    if (schoolUserError) {
      console.error("Error querying school_user:", schoolUserError);
      return false;
    }
    if (schoolUsers && schoolUsers.length > 0) return true;

    //  Get all classes for this school
    const { data: classes, error: classError } = await this.supabase
      .from(TABLES.Class)
      .select("id")
      .eq("school_id", schoolId)
      .eq("is_deleted", false);

    if (classError) {
      console.error("Error querying class:", classError);
      return false;
    }
    if (!classes || classes.length === 0) return false;

    const classIds = classes.map((c) => c.id);
    if (classIds.length === 0) return false;

    //  Check if user is teacher in any of these classes
    const { data: teachers, error: teacherError } = await this.supabase
      .from(TABLES.ClassUser)
      .select("*")
      .in("class_id", classIds)
      .eq("user_id", userId)
      .eq("role", RoleType.TEACHER)
      .eq("is_deleted", false);

    if (teacherError) {
      console.error("Error querying class_user:", teacherError);
      return false;
    }

    return teachers && teachers.length > 0;
  }
  async checkTeacherExistInClass(
    schoolId: string,
    classId: string,
    userId: string
  ): Promise<boolean> {
    if (!this.supabase) return false;
    //  Check if user is in school_user but NOT as a parent and not deleted
    const { data: schoolUsers, error: schoolUserError } = await this.supabase
      .from(TABLES.SchoolUser)
      .select("*")
      .eq("school_id", schoolId)
      .eq("user_id", userId)
      .neq("role", RoleType.PARENT)
      .eq("is_deleted", false);

    if (schoolUserError) {
      console.error("Error querying school_user:", schoolUserError);
      return false;
    }
    if (schoolUsers && schoolUsers.length > 0) return true;

    //  Check if user is teacher in this classe
    const { data, error } = await this.supabase
      .from("class_user")
      .select("id")
      .eq("class_id", classId)
      .eq("user_id", userId)
      .eq("role", RoleType.TEACHER)
      .eq("is_deleted", false)
      .maybeSingle(); // Returns null if no match

    if (error) {
      console.error("Error checking user in class:", error);
      return false;
    }

    return !!data; // true if found, false if not
  }

  async checkUserIsManagerOrDirector(schoolId, userId): Promise<boolean> {
    if (!this.supabase) return false;

    const roles = [
      RoleType.PROGRAM_MANAGER,
      RoleType.OPERATIONAL_DIRECTOR,
      RoleType.FIELD_COORDINATOR,
    ];

    const { data, error } = await this.supabase
      .from(TABLES.SchoolUser)
      .select("*")
      .eq("school_id", schoolId)
      .eq("user_id", userId)
      .in("role", roles)
      .eq("is_deleted", false);

    if (error) {
      console.error("Error querying school_user:", error);
      return false;
    }

    return !!(data && data.length > 0);
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
    if (!this.supabase) {
      return { classWiseAssignments: [], individualAssignments: [] };
    }

    const { data, error } = await this.supabase
      .from(TABLES.Assignment)
      .select("*")
      .eq("created_by", userId)
      .or(`class_id.eq.${classId},is_class_wise.eq.true`)
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .eq("is_deleted", false)
      .order("is_class_wise", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching assignments:", error);
      return { classWiseAssignments: [], individualAssignments: [] };
    }

    const assignments = data ?? [];

    const classWiseAssignments = assignments.filter((a) => a.is_class_wise);
    const individualAssignments = assignments.filter((a) => !a.is_class_wise);

    return { classWiseAssignments, individualAssignments };
  }
  async getTeacherJoinedDate(
    userId: string,
    classId: string
  ): Promise<TableTypes<"class_user"> | undefined> {
    if (!this.supabase) return undefined;

    const { data, error } = await this.supabase
      .from(TABLES.ClassUser)
      .select("*")
      .eq("user_id", userId)
      .eq("role", RoleType.TEACHER)
      .eq("class_id", classId)
      .eq("is_deleted", false)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching teacher joined date:", error);
      return undefined;
    }

    return data ?? undefined;
  }
  async getAssignedStudents(assignmentId: string): Promise<string[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from(TABLES.Assignment_user)
      .select("user_id")
      .eq("assignment_id", assignmentId)
      .eq("is_deleted", false);

    if (error) {
      console.error("Error fetching assigned students:", error);
      return [];
    }

    const userIds: string[] = data?.map((row) => row.user_id) ?? [];
    return userIds ?? [];
  }
  async getStudentResultByDate(
    studentId: string,
    courseIds: string[],
    startDate: string,
    endDate: string,
    classId: string
  ): Promise<TableTypes<"result">[] | undefined> {
    if (!this.supabase) return;

    const { data, error } = await this.supabase
      .from(TABLES.Result)
      .select("*")
      .eq("student_id", studentId)
      .eq("class_id", classId)
      .in("course_id", courseIds)
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching student result by date:", error);
      return;
    }

    return data ?? undefined;
  }
  async getLessonsBylessonIds(
    lessonIds: string[] // Expect an array of strings
  ): Promise<TableTypes<"lesson">[] | undefined> {
    if (!this.supabase || !lessonIds || lessonIds.length === 0) return;

    const { data, error } = await this.supabase
      .from(TABLES.Lesson)
      .select("*")
      .in("id", lessonIds)
      .eq("is_deleted", false);

    if (error) {
      console.error("Error fetching lessons by IDs:", error);
      return;
    }

    return data?.length ? data : undefined;
  }
  async deleteTeacher(classId: string, teacherId: string) {
    if (!this.supabase) return;

    try {
      const updatedAt = new Date().toISOString();
      // Step 1: Fetch class_user entry
      const { data: existingEntries, error: fetchError } = await this.supabase
        .from(TABLES.ClassUser)
        .select("*")
        .eq("user_id", teacherId)
        .eq("class_id", classId)
        .eq("role", RoleType.TEACHER)
        .eq("is_deleted", false);

      if (fetchError) {
        console.error("Error fetching teacher entry:", fetchError);
        return;
      }

      if (!existingEntries || existingEntries.length === 0) {
        throw new Error("Teacher not found.");
      }

      const entryToUpdate = existingEntries[0];

      // Step 2: Soft delete the class_user record
      const { error: updateError } = await this.supabase
        .from(TABLES.ClassUser)
        .update({ is_deleted: true, updated_at: updatedAt })
        .eq("id", entryToUpdate.id);

      if (updateError) {
        console.error("Error updating teacher record:", updateError);
        return;
      }

      // No pushChanges needed
    } catch (error) {
      console.error("SupabaseApi ~ deleteTeacher ~ error:", error);
    }
  }

  async getClassCodeById(class_id: string): Promise<number | undefined> {
    if (!this.supabase || !class_id) return;

    try {
      const currentDate = new Date().toISOString();

      const { data, error } = await this.supabase
        .from(TABLES.ClassInvite_code)
        .select("code")
        .eq("class_id", class_id)
        .eq("is_deleted", false)
        .gte("expires_at", currentDate)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Supabase error in getClassCodeById:", error);
        return;
      }

      return data?.code;
    } catch (err) {
      console.error("Error in getClassCodeById:", err);
      return;
    }
  }

  async getResultByChapterByDate(
    chapter_id: string,
    course_id: string,
    startDate: string,
    endDate: string,
    classId: string
  ): Promise<TableTypes<"result">[] | undefined> {
    if (!this.supabase) return;

    try {
      const { data, error } = await this.supabase
        .from(TABLES.Result)
        .select("*")
        .eq("chapter_id", chapter_id)
        .eq("course_id", course_id)
        .eq("class_id", classId)
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error in getResultByChapterByDate:", error);
        return;
      }

      return data?.length ? data : undefined;
    } catch (err) {
      console.error("Error in getResultByChapterByDate:", err);
      return;
    }
  }

  async createClassCode(classId: string): Promise<number> {
    try {
      // Validate parameters
      if (!classId)
        throw new Error("Class ID is required to create a class code.");

      // Call the RPC function
      const classCode = await this?.supabase?.rpc(
        "generate_unique_class_code",
        {
          class_id_input: classId,
        }
      );
      if (!classCode?.data) {
        throw new Error(`A class code is not created`);
      }
      return classCode?.data;
    } catch (error) {
      throw error; // Re-throw the error for external handling
    }
  }
  async getSchoolsWithRoleAutouser(
    schoolIds: string[]
  ): Promise<TableTypes<"school">[] | undefined> {
    if (!this.supabase || !schoolIds.length) return;

    try {
      const { data, error } = await this.supabase
        .from(TABLES.SchoolUser)
        .select("school(*)")
        .in("school_id", schoolIds)
        .eq("role", RoleType.AUTOUSER)
        .eq("is_deleted", false);

      if (error) {
        console.error("Supabase error in getSchoolsWithRoleAutouser:", error);
        return;
      }

      const schools = (data ?? [])
        .map((item) => item.school)
        .filter((school): school is TableTypes<"school"> => !!school);

      return schools ?? [];
    } catch (err) {
      console.error("Error in getSchoolsWithRoleAutouser:", err);
      return;
    }
  }
  async getPrincipalsForSchool(
    schoolId: string
  ): Promise<TableTypes<"user">[] | undefined> {
    if (!this.supabase) return;

    const { data, error } = await this.supabase
      .from("school_user")
      .select("user:user!school_user_user_id_fkey(*)")
      .eq("school_id", schoolId)
      .eq("role", RoleType.PRINCIPAL)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("Error fetching principals:", error);
      return;
    }

    const users = (data ?? [])
      .map((item) => item.user)
      .filter((user): user is TableTypes<"user"> => !!user);

    return users;
  }

  async getPrincipalsForSchoolPaginated(
    schoolId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PrincipalAPIResponse> {
    if (!this.supabase) {
      return { data: [], total: 0 };
    }

    const offset = (page - 1) * limit;

    const { data, error, count } = await this.supabase
      .from("school_user")
      .select("user:user!school_user_user_id_fkey(*)", { count: "exact" }) // Get count and data
      .eq("school_id", schoolId)
      .eq("role", RoleType.PRINCIPAL)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1); // Apply pagination

    if (error) {
      console.error("Error fetching principals:", error);
      return { data: [], total: 0 };
    }

    if (!data || !count) {
      return { data: [], total: 0 };
    }

    // Extract the user data from the join result
    const users: PrincipalInfo[] = data
      .map((item) => item.user)
      .filter((user): user is PrincipalInfo => !!user);

    return {
      data: users,
      total: count,
    };
  }

  // In your API handler (e.g., SupabaseApi.ts)
  async getCoordinatorsForSchool(
    schoolId: string
  ): Promise<TableTypes<"user">[] | undefined> {
    if (!this.supabase) return;

    const { data, error } = await this.supabase
      .from("school_user")
      .select("user:user!school_user_user_id_fkey(*)")
      .eq("school_id", schoolId)
      .eq("role", RoleType.COORDINATOR)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching coordinators:", error);
      return;
    }

    const coordinators = (data ?? [])
      .map((item) => item.user)
      .filter((user): user is TableTypes<"user"> => !!user);

    return coordinators;
  }

  async getCoordinatorsForSchoolPaginated(
    schoolId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<CoordinatorAPIResponse> {
    if (!this.supabase) {
      return { data: [], total: 0 };
    }

    const offset = (page - 1) * limit;

    const { data, error, count } = await this.supabase
      .from("school_user")
      .select("user:user!school_user_user_id_fkey(*)", { count: "exact" }) // Get count and data
      .eq("school_id", schoolId)
      .eq("role", RoleType.COORDINATOR) // The only change from the principal query
      .eq("is_deleted", false)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1); // Apply pagination

    if (error) {
      console.error("Error fetching coordinators:", error);
      return { data: [], total: 0 };
    }

    if (!data || !count) {
      return { data: [], total: 0 };
    }

    const users: CoordinatorInfo[] = data
      .map((item) => item.user)
      .filter((user): user is CoordinatorInfo => !!user);

    return {
      data: users,
      total: count,
    };
  }
  async getSponsorsForSchool(
    schoolId: string
  ): Promise<TableTypes<"user">[] | undefined> {
    if (!this.supabase) return;

    const { data, error } = await this.supabase
      .from("school_user")
      .select("user:user!user_id(*)")
      .eq("school_id", schoolId)
      .eq("role", RoleType.SPONSOR)
      .eq("is_deleted", false);

    if (error) {
      console.error("Error fetching sponsors:", error);
      return;
    }

    const sponsors = (data as { user: TableTypes<"user"> | null }[])
      .map((item) => item.user)
      .filter((u): u is TableTypes<"user"> => !!u);

    return sponsors;
  }
  async addUserToSchool(
    schoolId: string,
    user: TableTypes<"user">,
    role: RoleType
  ): Promise<void> {
    if (!this.supabase) return;

    const schoolUserId = uuidv4();
    const timestamp = new Date().toISOString();

    const { data: existing, error: selectError } = await this.supabase
      .from(TABLES.SchoolUser)
      .select("id")
      .eq("school_id", schoolId)
      .eq("user_id", user.id)
      .eq("role", role)
      .eq("is_deleted", false)
      .limit(1);

    if (selectError) {
      console.error("Error checking existing school_user:", selectError);
      return;
    }
    if (existing && existing.length > 0) return;

    const schoolUser = {
      id: schoolUserId,
      school_id: schoolId,
      user_id: user.id,
      role: role as Database["public"]["Enums"]["role"],
      created_at: timestamp,
      updated_at: timestamp,
      is_deleted: false,
    };

    const { error: insertError } = await this.supabase
      .from(TABLES.SchoolUser)
      .insert([schoolUser]);

    if (insertError) {
      console.error("Error inserting into school_user:", insertError);
      return;
    }
    const { error: schoolUpdateError } = await this.supabase
      .from(TABLES.School)
      .update({ updated_at: timestamp })
      .eq("id", schoolId)
      .eq("is_deleted", false);
    // 🔹 Update 'school_course' table
    const { error: schoolCourseUpdateError } = await this.supabase
      .from(TABLES.SchoolCourse)
      .update({ updated_at: timestamp })
      .eq("school_id", schoolId)
      .eq("is_deleted", false);
    // const user_doc = await this.getUserByDocId(user.id);

    if (user) {
      const cleanUserDoc = {
        id: user.id,
        name: user.name ?? null,
        age: user.age ?? null,
        gender: user.gender ?? null,
        avatar: user.avatar ?? null,
        image: user.image ?? null,
        curriculum_id: user.curriculum_id ?? null,
        language_id: user.language_id ?? null,
        created_at: user.created_at ?? timestamp,
        updated_at: user.updated_at ?? timestamp,
      };

      const { error: userInsertError } = await this.supabase
        .from(TABLES.User)
        .upsert([cleanUserDoc], { onConflict: "id" });

      if (userInsertError) {
        console.error("Error upserting user:", userInsertError);
      }
    }
  }
  async deleteUserFromSchool(
    schoolId: string,
    userId: string,
    role: RoleType
  ): Promise<void> {
    if (!this.supabase) return;

    try {
      // Find existing school_user row
      const { data, error: selectError } = await this.supabase
        .from("school_user")
        .select("id")
        .eq("school_id", schoolId)
        .eq("user_id", userId)
        .eq("role", role)
        .eq("is_deleted", false)
        .maybeSingle();

      if (selectError) {
        console.error("Error selecting school_user:", selectError);
        return;
      }

      if (!data) {
        throw new Error("school_user not found.");
      }

      const updatedAt = new Date().toISOString();

      // Update is_deleted and updated_at
      const { error: updateError } = await this.supabase
        .from("school_user")
        .update({ is_deleted: true, updated_at: updatedAt })
        .eq("id", data.id);

      if (updateError) {
        console.error("Error updating school_user:", updateError);
        return;
      }
    } catch (error) {
      console.error("SupabaseApi ~ deleteUserFromSchool ~ error:", error);
    }
  }
  async updateSchoolLastModified(schoolId: string): Promise<void> {
    if (!this.supabase) return;

    const updatedAt = new Date().toISOString();

    const { error } = await this.supabase
      .from("school")
      .update({ updated_at: updatedAt })
      .eq("id", schoolId);

    if (error) {
      console.error("Error updating school's updated_at:", error);
    }
  }
  async updateClassLastModified(classId: string): Promise<void> {
    if (!this.supabase) return;

    const updatedAt = new Date().toISOString();

    const { error } = await this.supabase
      .from("class")
      .update({ updated_at: updatedAt })
      .eq("id", classId);

    if (error) {
      console.error("Error updating class's updated_at:", error);
    }
  }
  async updateUserLastModified(userId: string): Promise<void> {
    if (!this.supabase) return;

    const updatedAt = new Date().toISOString();

    const { error } = await this.supabase
      .from("user")
      .update({ updated_at: updatedAt })
      .eq("id", userId);

    if (error) {
      console.error("Error updating user's updated_at:", error);
    }
  }

  async validateSchoolData(
    schoolId: string,
    schoolName: string
  ): Promise<{ status: string; errors?: string[] }> {
    if (!this.supabase) {
      return {
        status: "error",
        errors: ["Supabase client is not initialized"],
      };
    }
    try {
      const { data, error } = await this.supabase.rpc(
        "validate_school_data_rpc",
        {
          input_school_id: schoolId,
          input_school_name: schoolName,
        }
      );
      if (error || !data) {
        throw error ?? new Error("Unknown error from RPC");
      }

      return data as { status: string; errors?: string[] };
    } catch (error) {
      return {
        status: "error",
        errors: [String(error)],
      };
    }
  }
  async validateParentAndStudentInClass(
    phoneNumber: string,
    studentName: string,
    className: string,
    schoolId: string
  ): Promise<{ status: string; errors?: string[]; message?: string }> {
    if (!this.supabase) {
      return {
        status: "error",
        errors: ["Supabase client is not initialized"],
      };
    }

    try {
      const { data, error } = await this.supabase.rpc(
        "check_parent_and_student_in_class",
        {
          phone_number: phoneNumber,
          student_name: studentName,
          class_name: className,
          input_school_udise_code: schoolId,
        }
      );
      // Narrow the type from Json to expected shape
      if (
        typeof data === "object" &&
        data !== null &&
        "status" in data &&
        typeof (data as any).status === "string"
      ) {
        return data as { status: string; errors?: string[]; message?: string };
      }

      // Fallback if data isn't in expected shape
      return {
        status: "error",
        errors: ["Unexpected response format from Supabase function"],
      };
    } catch (error) {
      return {
        status: "error",
        errors: [String(error)],
      };
    }
  }
  async validateProgramName(
    programName: string
  ): Promise<{ status: string; errors?: string[] }> {
    if (!this.supabase) {
      return {
        status: "error",
        errors: ["Supabase client is not initialized"],
      };
    }

    try {
      const { data, error } = await this.supabase.rpc("validate_program_name", {
        input_program_name: programName,
      });
      // Narrow the type from Json to expected shape
      if (
        typeof data === "object" &&
        data !== null &&
        "status" in data &&
        typeof (data as any).status === "string"
      ) {
        return data as { status: string; errors?: string[]; message?: string };
      }

      // Fallback if data isn't in expected shape
      return {
        status: "error",
        errors: ["Unexpected response format from Supabase function 1111"],
      };
    } catch (error) {
      return {
        status: "error",
        errors: [String(error)],
      };
    }
  }

  async validateSchoolUdiseCode(
    schoolId: string
  ): Promise<{ status: string; errors?: string[] }> {
    if (!this.supabase) {
      return {
        status: "error",
        errors: ["Supabase client is not initialized"],
      };
    }

    try {
      const { data, error } = await this.supabase.rpc(
        "validate_school_udise_code",
        {
          input_school_udise_code: schoolId,
        }
      );
      // Narrow the type from Json to expected shape
      if (
        typeof data === "object" &&
        data !== null &&
        "status" in data &&
        typeof (data as any).status === "string"
      ) {
        return data as { status: string; errors?: string[]; message?: string };
      }

      // Fallback if data isn't in expected shape
      return {
        status: "error",
        errors: ["Unexpected response format from Supabase function"],
      };
    } catch (error) {
      return {
        status: "error",
        errors: [String(error)],
      };
    }
  }
  async validateClassNameWithSchoolID(
    schoolId: string,
    className: string
  ): Promise<{ status: string; errors?: string[] }> {
    if (!this.supabase) {
      return {
        status: "error",
        errors: ["Supabase client is not initialized"],
      };
    }

    try {
      const { data, error } = await this.supabase.rpc(
        "check_class_exists_by_name_and_school",
        {
          class_name: className,
          input_school_udise_code: schoolId,
        }
      );
      // Narrow the type from Json to expected shape
      if (
        typeof data === "object" &&
        data !== null &&
        "status" in data &&
        typeof (data as any).status === "string"
      ) {
        return data as { status: string; errors?: string[]; message?: string };
      }

      // Fallback if data isn't in expected shape
      return {
        status: "error",
        errors: ["Unexpected response format from Supabase function"],
      };
    } catch (error) {
      return {
        status: "error",
        errors: [String(error)],
      };
    }
  }
  async validateStudentInClassWithoutPhone(
    studentName: string,
    className: string,
    schoolId: string
  ): Promise<{ status: string; errors?: string[]; message?: string }> {
    if (!this.supabase) {
      return {
        status: "error",
        errors: ["Supabase client is not initialized"],
      };
    }

    try {
      const { data, error } = await this.supabase.rpc(
        "check_student_duplicate_in_class_without_phone_number",
        {
          student_name: studentName,
          class_name: className,
          input_school_udise_code: schoolId,
        }
      );

      // Narrow the type from Json to expected shape
      if (
        typeof data === "object" &&
        data !== null &&
        "status" in data &&
        typeof (data as any).status === "string"
      ) {
        return data as { status: string; errors?: string[]; message?: string };
      }

      // Fallback if data isn't in expected shape
      return {
        status: "error",
        errors: ["Unexpected response format from Supabase function"],
      };
    } catch (error) {
      return {
        status: "error",
        errors: [String(error)],
      };
    }
  }

  async validateClassCurriculumAndSubject(
    curriculumName: string,
    subjectName: string,
    gradeName: string // new parameter
  ): Promise<{ status: string; errors?: string[] }> {
    if (!this.supabase) {
      return {
        status: "error",
        errors: ["Supabase client is not initialized"],
      };
    }
    // Step 1: Fetch curriculum ID
    const { data: curriculumData, error: curriculumError } = await this.supabase
      .from("curriculum")
      .select("id")
      .eq("name", curriculumName)
      .single();

    if (curriculumError || !curriculumData) {
      return {
        status: "error",
        errors: ["Invalid curriculum name"],
      };
    }
    const curriculumId = curriculumData.id;

    // Step 2: Fetch grade ID
    const { data: gradeData, error: gradeError } = await this.supabase
      .from("grade")
      .select("id")
      .eq("name", gradeName)
      .single();
    if (gradeError || !gradeData) {
      return {
        status: "error",
        errors: ["Invalid grade name"],
      };
    }

    const gradeId = gradeData.id;

    // Step 3: Check if course exists with curriculum ID, grade ID, and subject name
    const { data: courseData, error: courseError } = await this.supabase
      .from("course")
      .select("id")
      .eq("curriculum_id", curriculumId)
      .eq("grade_id", gradeId)
      .eq("name", subjectName.trim())
      .eq("is_deleted", false);
    if (courseError || !courseData || courseData.length === 0) {
      return {
        status: "error",
        errors: [
          `Subject '${subjectName}' not found for grade '${gradeName}' in the '${curriculumName}' curriculum.`,
        ],
      };
    }
    return { status: "success" };
  }

  async validateUserContacts(
    programManagerPhone: string,
    fieldCoordinatorPhone?: string
  ): Promise<{ status: string; errors?: string[] }> {
    if (!this.supabase) {
      return {
        status: "error",
        errors: ["Supabase client is not initialized"],
      };
    }

    try {
      const { data, error } = await this.supabase.rpc(
        "validate_user_contacts_rpc",
        {
          program_manager_contact: programManagerPhone.trim(),
          field_coordinator_contact: fieldCoordinatorPhone?.trim(),
        }
      );
      if (error || !data) {
        return {
          status: "error",
          errors: [
            "programManagerPhone and fieldCoordinatorPhone Validation failed",
          ],
        };
      }
      if (
        error ||
        !data ||
        typeof data !== "object" ||
        data === null ||
        !("status" in data) ||
        typeof (data as any).status !== "string"
      ) {
        return {
          status: "error",
          errors: ["Invalid response from validation RPC"],
        };
      }

      return data as { status: string; errors?: string[] };
    } catch (err) {
      return {
        status: "error",
        errors: [String(err)],
      };
    }
  }

  // async validateUserContacts(
  //   programManagerPhone: string,
  //   fieldCoordinatorPhone?: string
  // ): Promise<{ status: string; errors?: string[] }> {
  //   if (!this.supabase) {
  //     return {
  //       status: "error",
  //       errors: ["Supabase client is not initialized"],
  //     };
  //   }

  //   const errors: string[] = [];

  //   const queryKey = programManagerPhone.includes("@") ? "email" : "phone";
  //   const { data: pmData, error: pmError } = await this.supabase
  //     .from("user")
  //     .select("id")
  //     .eq(queryKey, programManagerPhone.trim());

  //   if (pmError || !pmData) {
  //     errors.push(
  //       "PROGRAM MANAGER EMAIL OR PHONE NUMBER does not exist in the system"
  //     );
  //   }

  //   if (fieldCoordinatorPhone) {
  //     const fCqueryKey = fieldCoordinatorPhone.includes("@")
  //       ? "email"
  //       : "phone";
  //     const { data: fcData, error: fcError } = await this.supabase
  //       .from("user")
  //       .select("id")
  //       .eq(fCqueryKey, fieldCoordinatorPhone);

  //     if (fcError || !fcData) {
  //       errors.push(
  //         "FIELD COORDINATOR EMAIL OR PHONE NUMBER does not exist in the system"
  //       );
  //     }
  //   }

  //   return errors.length > 0
  //     ? { status: "error", errors }
  //     : { status: "success" };
  // }
  async setStarsForStudents(
    studentId: string,
    starsCount: number
  ): Promise<void> {
    if (!this.supabase || !studentId) return;

    try {
      // Read existing stars map from localStorage
      const previousStarsRaw = localStorage.getItem(STARS_COUNT);
      const previousStars = previousStarsRaw
        ? JSON.parse(previousStarsRaw)
        : {};

      // Get current stars for this student from localStorage or default 0
      const currentStars = previousStars[studentId] ?? 0;

      // Calculate new total stars
      const totalStars = currentStars + starsCount;

      // Update stars count in Supabase DB
      const { error: updateError } = await this.supabase
        .from("user")
        .update({ stars: totalStars })
        .eq("id", studentId);

      if (updateError) {
        console.error("Error updating stars in Supabase:", updateError);
      }
    } catch (error) {
      console.error("Error in setStarsForStudents:", error);
    }
  }
  async countAllPendingPushes(): Promise<number> {
    throw new Error("Method not implemented.");
  }
  async getDebugInfoLast30Days(parentId: string): Promise<any[]> {
    throw new Error("Method not implemented.");
  }
  async getClassByUserId(userId: string): Promise<TableTypes<"class">> {
    if (!this.supabase) return {} as TableTypes<"class">;

    // Get class_id from class_user
    const { data: classUserData, error: classUserError } = await this.supabase
      .from("class_user")
      .select("class_id")
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .limit(1)
      .single();

    if (classUserError || !classUserData) {
      console.error("Error fetching class_user:", classUserError);
      return {} as TableTypes<"class">;
    }

    const classId = classUserData.class_id;
    if (!classId) return {} as TableTypes<"class">;

    // Get class from class table using class_id
    const { data: classData, error: classError } = await this.supabase
      .from("class")
      .select("*")
      .eq("id", classId)
      .eq("is_deleted", false)
      .limit(1)
      .single();

    if (classError || !classData) {
      console.error("Error fetching class:", classError);
      return {} as TableTypes<"class">;
    }
    return classData;
  }

  async getCoursesForPathway(
    studentId: string
  ): Promise<TableTypes<"course">[]> {
    if (!this.supabase) return [];

    // Get course IDs from user_course for the student
    const { data: userCourses, error: userCoursesError } = await this.supabase
      .from(TABLES.UserCourse)
      .select("course_id")
      .eq("user_id", studentId)
      .eq("is_deleted", false);

    if (userCoursesError) {
      console.error("Error fetching user courses:", userCoursesError);
      return [];
    }
    if (!userCourses || userCourses.length === 0) {
      return [];
    }

    // Extract course IDs as array of strings
    const courseIds = userCourses.map((uc) => uc.course_id);

    // Fetch course details ordered by sort_index
    const { data: courses, error: coursesError } = await this.supabase
      .from(TABLES.Course)
      .select("*")
      .in("id", courseIds)
      .eq("is_deleted", false)
      .order("sort_index", { ascending: true });

    if (coursesError) {
      console.error("Error fetching courses:", coursesError);
      return [];
    }

    return courses ?? [];
  }
  async updateLearningPath(
    student: TableTypes<"user">,
    learning_path: string
  ): Promise<TableTypes<"user">> {
    if (!this.supabase) return student;

    const { error } = await this.supabase
      .from(TABLES.User)
      .update({ learning_path: learning_path })
      .eq("id", student.id)
      .single();
    student.learning_path = learning_path;
    if (error) {
      console.error("Error updating learning path:", error);
      throw error;
    }
    return student;
  }

  async getProgramFilterOptions(): Promise<Record<string, string[]>> {
    if (!this.supabase) {
      console.error("Supabase client is not initialized");
      return {};
    }

    try {
      const { data, error } = await this.supabase.rpc(
        "get_program_filter_options"
      );
      if (error) {
        console.error("RPC error:", error);
        return {};
      }

      const parsed: Record<string, string[]> = {};
      if (data && typeof data === "object") {
        for (const key in data) {
          const val = data[key];
          if (Array.isArray(val)) {
            parsed[key] = val.filter(
              (v) => typeof v === "string" && v.trim() !== "" && v !== "null"
            );
          } else {
            parsed[key] = [];
          }
        }
      }
      return parsed;
    } catch (err) {
      console.error("Unexpected error:", err);
      return {};
    }
  }

  async getPrograms({
    currentUserId,
    filters = {},
    searchTerm = "",
    tab = PROGRAM_TAB.ALL,
    limit = 10,
    offset = 0,
    orderBy = "name",
    order = "asc",
  }: {
    currentUserId: string;
    filters?: Record<string, string[]>;
    searchTerm?: string;
    tab?: TabType;
    limit?: number;
    offset?: number;
    orderBy?: string;
    order?: "asc" | "desc";
  }): Promise<{ data: any[] }> {
    if (!this.supabase) {
      console.error("Supabase client not initialized");
      return { data: [] };
    }

    try {
      const { data, error } = await this.supabase.rpc("get_programs_for_user", {
        _current_user_id: currentUserId,
        _filters: filters,
        _search_term: searchTerm,
        _tab: tab,
        _limit: limit,
        _offset: offset,
        _order_by: orderBy,
        _order: order,
      });

      if (error) {
        console.error("Error calling get_programs_for_user RPC:", error);
        return { data: [] };
      }
      return { data: data || [] };
    } catch (err) {
      console.error("Unexpected error in getPrograms:", err);
      return { data: [] };
    }
  }

  async getProgramManagers(): Promise<{ name: string; id: string }[]> {
    if (!this.supabase) {
      console.error("Supabase client is not initialized.");
      return [];
    }

    const { data, error } = await this.supabase.rpc("get_program_managers");

    if (error) {
      console.error("Error fetching managers:", error);
      return [];
    }

    return (data as { name: string; id: string }[]) || [];
  }

  async getUniqueGeoData(): Promise<{
    Country: string[];
    State: string[];
    Block: string[];
    Cluster: string[];
    District: string[];
  }> {
    if (!this.supabase) {
      console.error("Supabase client is not initialized.");
      return {
        Country: [],
        State: [],
        Block: [],
        Cluster: [],
        District: [],
      };
    }

    const { data, error } = await this.supabase.rpc("get_unique_geo_data");

    if (error) throw error;

    if (!data)
      return { Country: [], State: [], Block: [], Cluster: [], District: [] };
    return data as {
      Country: string[];
      State: string[];
      Block: string[];
      Cluster: string[];
      District: string[];
    };
  }

  async insertProgram(payload: any): Promise<boolean> {
    try {
      if (!this.supabase) {
        console.error("Supabase client is not initialized.");
        return false;
      }
      const programId = uuidv4();
      const _currentUser =
        await ServiceConfig.getI().authHandler.getCurrentUser();

      const record: any = {
        id: programId,
        name: payload.programName,
        model: payload.models,

        implementation_partner: payload.partners.implementation,
        funding_partner: payload.partners.funding,
        institute_partner: payload.partners.institute,

        country: payload.locations.Country,
        state: payload.locations.State,
        block: payload.locations.Block,
        cluster: payload.locations.Cluster,
        district: payload.locations.District,

        program_type: payload.programType,
        institutes_count: payload.stats.schools,
        students_count: payload.stats.students,
        devices_count: payload.stats.devices,

        start_date: payload.startDate,
        end_date: payload.endDate,

        is_deleted: false,
        is_ops: null,
      };

      // Step 1: Insert the program
      const { data, error } = await this.supabase
        .from(TABLES.Program)
        .insert(record)
        .single();

      if (error) {
        console.error("Insert error:", error);
        return false;
      }

      // Step 2: Insert into program_user table
      const programUserRows = payload.selectedManagers.map(
        (userId: string) => ({
          program_id: programId,
          user: userId,
          is_deleted: false,
          is_ops: null,
          role: RoleType.PROGRAM_MANAGER,
        })
      );
      const { error: programUserError } = await this.supabase
        .from(TABLES.ProgramUser)
        .insert(programUserRows);

      if (programUserError) {
        console.error("Error inserting program users:", programUserError);
        return false;
      }

      return true;
    } catch (error) {
      console.error("insertProgram failed:", error);
      return false;
    }
  }
  async getSchoolsForAdmin(
    limit: number = 10,
    offset: number = 0
  ): Promise<TableTypes<"school">[]> {
    if (!this.supabase) {
      console.error("Supabase client is not initialized.");
      return [];
    }
    const { data, error } = await this.supabase
      .from(TABLES.School)
      .select("*")
      .eq("is_deleted", false)
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching schools:", error);
      return [];
    }
    return data ?? [];
  }

  async getSchoolsByModel(
    model: EnumType<"program_model">,
    limit: number = 10,
    offset: number = 0
  ): Promise<TableTypes<"school">[]> {
    if (!this.supabase) {
      console.error("Supabase client is not initialized.");
      return [];
    }

    const { data, error } = await this.supabase
      .from(TABLES.School)
      .select("*")
      .eq("is_deleted", false)
      .eq("model", model)
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching schools by model:", error);
      return [];
    }
    return data ?? [];
  }

  async getTeachersForSchools(schoolIds: string[]): Promise<SchoolRoleMap[]> {
    if (!this.supabase) {
      console.error("Supabase client is not initialized.");
      return [];
    }

    const { data: classes, error: classError } = await this.supabase
      .from(TABLES.Class)
      .select("id, school_id")
      .in("school_id", schoolIds)
      .eq("is_deleted", false);

    if (classError || !classes) {
      console.error("Error fetching classes:", classError);
      return schoolIds.map((id) => ({ schoolId: id, users: [] }));
    }

    const classIds = classes.map((cls) => cls.id);
    const classIdToSchoolId: Record<string, string> = {};
    for (const cls of classes) {
      classIdToSchoolId[cls.id] = cls.school_id;
    }

    const { data: classUsers, error: classUserError } = await this.supabase
      .from(TABLES.ClassUser)
      .select("user: user_id (*), class_id")
      .in("class_id", classIds.length ? classIds : [""])
      .eq("is_deleted", false)
      .eq("role", RoleType.TEACHER);

    if (classUserError || !classUsers) {
      console.error("Error fetching class users:", classUserError);
      return schoolIds.map((id) => ({ schoolId: id, users: [] }));
    }

    const schoolMap: Map<string, TableTypes<"user">[]> = new Map();
    for (const schoolId of schoolIds) {
      schoolMap.set(schoolId, []);
    }

    for (const entry of classUsers) {
      const schoolId = classIdToSchoolId[entry.class_id];
      const user = entry.user as unknown as TableTypes<"user">;
      if (!schoolId || !user) continue;

      const existing = schoolMap.get(schoolId) || [];
      const alreadyExists = existing.some((u) => u.id === user.id);
      if (!alreadyExists) {
        existing.push(user);
        schoolMap.set(schoolId, existing);
      }
    }

    const result: SchoolRoleMap[] = [];
    for (const schoolId of schoolIds) {
      result.push({ schoolId, users: schoolMap.get(schoolId) ?? [] });
    }
    return result;
  }
  async getStudentsForSchools(schoolIds: string[]): Promise<SchoolRoleMap[]> {
    if (!this.supabase) {
      console.error("Supabase client is not initialized.");
      return [];
    }

    const { data: classes, error: classError } = await this.supabase
      .from(TABLES.Class)
      .select("id, school_id")
      .in("school_id", schoolIds)
      .eq("is_deleted", false);

    if (classError || !classes) {
      console.error("Error fetching classes:", classError);
      return schoolIds.map((id) => ({ schoolId: id, users: [] }));
    }

    const classIds = classes.map((cls) => cls.id);
    const classIdToSchoolId: Record<string, string> = {};
    for (const cls of classes) {
      classIdToSchoolId[cls.id] = cls.school_id;
    }

    const { data: classUsers, error: classUserError } = await this.supabase
      .from(TABLES.ClassUser)
      .select("user: user_id (*), class_id")
      .in("class_id", classIds.length ? classIds : [""])
      .eq("is_deleted", false)
      .eq("role", RoleType.STUDENT);

    if (classUserError || !classUsers) {
      console.error("Error fetching class users:", classUserError);
      return schoolIds.map((id) => ({ schoolId: id, users: [] }));
    }

    const schoolMap: Map<string, TableTypes<"user">[]> = new Map();
    for (const schoolId of schoolIds) {
      schoolMap.set(schoolId, []);
    }

    for (const entry of classUsers) {
      const schoolId = classIdToSchoolId[entry.class_id];
      const user = entry.user as unknown as TableTypes<"user">;
      if (!schoolId || !user) continue;

      const existing = schoolMap.get(schoolId) || [];
      const alreadyExists = existing.some((u) => u.id === user.id);
      if (!alreadyExists) {
        existing.push(user);
        schoolMap.set(schoolId, existing);
      }
    }

    const result: SchoolRoleMap[] = [];
    for (const schoolId of schoolIds) {
      result.push({ schoolId, users: schoolMap.get(schoolId) ?? [] });
    }
    return result;
  }

  async getProgramManagersForSchools(
    schoolIds: string[]
  ): Promise<SchoolRoleMap[]> {
    if (!this.supabase) {
      console.error("Supabase client is not initialized.");
      return [];
    }

    const { data, error } = await this.supabase
      .from(TABLES.SchoolUser)
      .select("user: user_id (*), school_id")
      .in("school_id", schoolIds.length ? schoolIds : [""])
      .eq("is_deleted", false)
      .eq("role", RoleType.PROGRAM_MANAGER);

    if (error || !data) {
      console.error("Error fetching program managers:", error);
      return schoolIds.map((id) => ({ schoolId: id, users: [] }));
    }

    const schoolMap: Map<string, TableTypes<"user">[]> = new Map();
    for (const schoolId of schoolIds) {
      schoolMap.set(schoolId, []);
    }

    for (const row of data) {
      const user = row.user as unknown as TableTypes<"user">;
      const schoolId = row.school_id;

      if (!user || !schoolMap.has(schoolId)) continue;

      const users = schoolMap.get(schoolId)!;
      if (!users.find((u) => u.id === user.id)) {
        users.push(user);
      }
    }

    return schoolIds.map((id) => ({
      schoolId: id,
      users: schoolMap.get(id) ?? [],
    }));
  }

  async getFieldCoordinatorsForSchools(
    schoolIds: string[]
  ): Promise<SchoolRoleMap[]> {
    if (!this.supabase) {
      console.error("Supabase client is not initialized.");
      return [];
    }

    const { data, error } = await this.supabase
      .from(TABLES.SchoolUser)
      .select("user: user_id (*), school_id")
      .in("school_id", schoolIds.length ? schoolIds : ["dummy"])
      .eq("is_deleted", false)
      .eq("role", RoleType.FIELD_COORDINATOR);

    if (error || !data) {
      console.error("Error fetching field coordinators:", error);
      return schoolIds.map((id) => ({ schoolId: id, users: [] }));
    }

    const schoolMap: Map<string, TableTypes<"user">[]> = new Map();
    for (const schoolId of schoolIds) {
      schoolMap.set(schoolId, []);
    }

    for (const row of data) {
      const user = row.user as unknown as TableTypes<"user">;
      const schoolId = row.school_id;

      if (!user || !schoolMap.has(schoolId)) continue;

      const users = schoolMap.get(schoolId)!;
      if (!users.find((u) => u.id === user.id)) {
        users.push(user);
      }
    }

    return schoolIds.map((id) => ({
      schoolId: id,
      users: schoolMap.get(id) ?? [],
    }));
  }

  async getProgramForSchool(
    schoolId: string
  ): Promise<TableTypes<"program"> | undefined> {
    if (!this.supabase) return;
    const { data, error } = await this.supabase
      .from("school")
      .select("program:program_id(*)")
      .eq("id", schoolId)
      .maybeSingle();
    if (error) {
      console.error("Error fetching program with join:", error);
      return;
    }
    const program = (data?.program ?? undefined) as
      | TableTypes<"program">
      | undefined;
    return program;
  }

  async getProgramManagersForSchool(
    schoolId: string
  ): Promise<TableTypes<"user">[] | undefined> {
    if (!this.supabase) return;
    const { data: schoolData } = await this.supabase
      .from("school")
      .select("program_id")
      .eq("id", schoolId)
      .maybeSingle();
    const programId = schoolData?.program_id;
    if (!programId) return [];
    const { data: managers } = await this.supabase
      .from("program_user")
      .select("role, is_deleted, user(*)")
      .eq("program_id", programId);
    const managerUsers = (managers ?? [])
      .filter(
        (pu) =>
          pu.role === RoleType.PROGRAM_MANAGER && !pu.is_deleted && pu.user
      )
      .flatMap((pu) =>
        Array.isArray(pu.user) ? pu.user : [pu.user]
      ) as TableTypes<"user">[];
    return managerUsers;
  }

  async updateStudentStars(
    studentId: string,
    totalStars: number
  ): Promise<void> {
    if (!this.supabase || !studentId) return;
    try {
      const { error } = await this.supabase
        .from(TABLES.User)
        .update({ stars: totalStars })
        .eq("id", studentId);

      if (error) {
        console.error("Error setting stars for student:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error setting stars for student:", error);
    }
  }

  async getProgramData(programId: string): Promise<{
    programDetails: { id: string; label: string; value: string }[];
    locationDetails: { id: string; label: string; value: string }[];
    partnerDetails: { id: string; label: string; value: string }[];
    programManagers: { name: string; role: string; phone: string }[];
  } | null> {
    if (!this.supabase) {
      console.error("Supabase client not initialized.");
      return null;
    }

    try {
      const { data: program, error: programError } = await this.supabase
        .from("program")
        .select("*")
        .eq("id", programId)
        .single();

      if (programError || !program) {
        console.error("Error fetching program:", programError);
        return null;
      }

      const { data: mappings, error: mappingsError } = await this.supabase
        .from("program_user")
        .select("user")
        .eq("program_id", programId)
        .eq("role", "program_manager");

      if (mappingsError) {
        console.error("Error fetching program managers:", mappingsError);
        return null;
      }

      const userIds = mappings
        .map((m) => m.user)
        .filter((id): id is string => !!id);

      const { data: users, error: usersError } = await this.supabase
        .from("user")
        .select("id, name, phone")
        .in("id", userIds);
      if (usersError) {
        console.error("Error fetching user details:", usersError);
        return null;
      }

      const programDetails = [
        {
          id: "program_name",
          label: "Program Name",
          value: program.name ?? "",
        },
        {
          id: "program_type",
          label: "Program Type",
          value: program.program_type ?? "",
        },
        {
          id: "program_model",
          label: "Program Model",
          value: Array.isArray(program.model)
            ? program.model.join(", ")
            : program.model ?? "",
        },
        {
          id: "program_date",
          label: "Program Date",
          value: `${program.start_date ?? ""}  ${program.end_date ?? ""}`,
        },
      ];

      const locationDetails = [
        { id: "country", label: "Country", value: program.country ?? "" },
        { id: "state", label: "State", value: program.state ?? "" },
        { id: "district", label: "District", value: program.district ?? "" },
        { id: "cluster", label: "Cluster", value: program.cluster ?? "" },
        { id: "block", label: "Block", value: program.block ?? "" },
        { id: "village", label: "Village", value: program.village ?? "" },
      ];

      const partnerDetails = [
        {
          id: "implementation_partner",
          label: "Implementation Partner",
          value: program.implementation_partner ?? "",
        },
        {
          id: "funding_partner",
          label: "Funding Partner",
          value: program.funding_partner ?? "",
        },
        {
          id: "institute_owner",
          label: "Institute Owner",
          value: program.institute_partner ?? "",
        },
      ];

      const programManagers = users.map((user) => ({
        name: user.name ?? "",
        role: "Program Manager",
        phone: user.phone ?? "",
      }));

      return {
        programDetails,
        locationDetails,
        partnerDetails,
        programManagers,
      };
    } catch (err) {
      console.error("Unexpected error in getProgramData:", err);
      return null;
    }
  }
  async getSchoolFilterOptionsForSchoolListing(): Promise<
    Record<string, string[]>
  > {
    if (!this.supabase) {
      console.error("Supabase client is not initialized");
      return {};
    }

    try {
      const { data, error } = await this.supabase.rpc(
        "get_school_filter_options"
      );

      if (error) {
        console.error("RPC error in getSchoolFilterOptions:", error);
        return {};
      }

      const parsed: Record<string, string[]> = {
        state: [],
        district: [],
        block: [],
        programType: [],
        partner: [],
        programManager: [],
        fieldCoordinator: [],
        cluster: [],
      };

      if (data && typeof data === "object") {
        for (const key in parsed) {
          const val = data[key];
          parsed[key] = Array.isArray(val)
            ? val.filter(
                (v) => typeof v === "string" && v.trim() !== "" && v !== "null"
              )
            : [];
        }
      }

      return parsed;
    } catch (err) {
      console.error("Unexpected error in getSchoolFilterOptions:", err);
      return {};
    }
  }

  async getSchoolFilterOptionsForProgram(
    programId: string
  ): Promise<Record<string, string[]>> {
    if (!this.supabase) {
      console.error("Supabase client is not initialized");
      return {};
    }

    try {
      const { data, error } = await this.supabase.rpc(
        "get_school_filter_options_for_program",
        { input_program_id: programId }
      );

      if (error) {
        console.error("RPC error in getSchoolFilterOptionsForProgram:", error);
        return {};
      }

      const parsed: Record<string, string[]> = {
        state: [],
        district: [],
        block: [],
        cluster: [],
        programType: [],
        partner: [],
        programManager: [],
        fieldCoordinator: [],
        model: [],
      };

      if (data && typeof data === "object") {
        for (const key in parsed) {
          const val = data[key];
          parsed[key] = Array.isArray(val)
            ? val.filter(
                (v) => typeof v === "string" && v.trim() !== "" && v !== "null"
              )
            : [];
        }
      }

      return parsed;
    } catch (err) {
      console.error(
        "Unexpected error in getSchoolFilterOptionsForProgram:",
        err
      );
      return {};
    }
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
    if (!this.supabase) {
      return { success: false, error: "Supabase not initialized" };
    }
    try {
      const { data, error: functionError } =
        await this.supabase.functions.invoke("get_or_create_user", {
          body: {
            name: payload.name,
            email: payload.email || undefined,
            phone: payload.phone || undefined,
          },
        });
      if (functionError) {
        const body = data as any;
        const errorCode = body?.message || "unknown-error";
        const errorDetail = body?.error || functionError.message;
        return {
          success: false,
          message: errorCode,
          error: errorDetail || "Unexpected error occurred",
        };
      }
      const body = data as any;
      const user = body?.user;
      const isNew = body?.is_new === true;
      if (!user || !user.id) {
        return {
          success: false,
          message: "unexpected-error",
          error: "Invalid response from ops_adding_and_creating_user",
        };
      }
      const userId: string = user.id as string;
      const { data: existingSpecial, error: specialError } = await this.supabase
        .from("special_users")
        .select("id, role")
        .eq("user_id", userId)
        .eq("is_deleted", false);
      if (specialError) {
        return {
          success: false,
          message: "db-role-check-failed",
          error: specialError.message,
        };
      }
      const rolesToBlock: RoleType[] = [
        RoleType.PROGRAM_MANAGER,
        RoleType.FIELD_COORDINATOR,
      ];
      const hasBlockedRole =
        existingSpecial?.some((entry) =>
          rolesToBlock.includes(entry.role as RoleType)
        ) ?? false;
      if (hasBlockedRole) {
        return {
          success: true,
          user_id: userId,
          message: "success-user-already-exists",
        };
      }
      const roleForInsert = OPS_ROLES.find((r) => r === payload.role) as
        | RoleType
        | any;
      const { error: insertSpecialError } = await this.supabase
        .from("special_users")
        .insert({
          user_id: userId,
          role: roleForInsert,
          is_deleted: false,
        });
      if (insertSpecialError) {
        return {
          success: false,
          message: "insert-role-failed",
          error: insertSpecialError.message,
        };
      }
      const successMessage = isNew
        ? "success-created"
        : "success-added-to-special_users";
      return {
        success: true,
        user_id: userId,
        message: successMessage,
      };
    } catch (err: any) {
      return {
        success: false,
        message: "unexpected-error",
        error: err?.message || "Unexpected error occurred",
      };
    }
  }

  async getFilteredSchoolsForSchoolListing(params: {
    filters?: Record<string, string[]>;
    programId?: string;
    page?: number;
    page_size?: number;
    order_by?: string;
    order_dir?: "asc" | "desc";
    search?: string;
  }): Promise<{
    data: FilteredSchoolsForSchoolListingOps[];
    total: number;
  }> {
    if (!this.supabase) {
      console.error("Supabase client is not initialized");
      return { data: [], total: 0 };
    }

    const { filters, programId, page, page_size, order_by, order_dir, search } =
      params;
    const payload: any = {};

    if (filters && Object.keys(filters).length > 0) payload.filters = filters;
    if (programId) payload._program_id = programId;
    if (page) payload.page = page;
    if (page_size) payload.page_size = page_size;
    if (order_by) payload.order_by = order_by;
    if (order_dir) payload.order_dir = order_dir;
    if (search) payload.search = search;

    try {
      const { data, error } = await this.supabase.rpc(
        "get_filtered_schools_with_optional_program",
        payload
      );
      if (error) {
        console.error(
          "RPC error in get_filtered_schools_with_optional_program:",
          error
        );
        return { data: [], total: 0 };
      }

      if (
        !data ||
        typeof data !== "object" ||
        !("data" in data) ||
        !("total" in data)
      ) {
        throw new Error(
          "Supabase RPC did not return expected { data, total } shape"
        );
      }

      return {
        data: (data.data ??
          []) as unknown as FilteredSchoolsForSchoolListingOps[],
        total: typeof data.total === "number" ? data.total : 0,
      };
    } catch (err) {
      console.error(
        "Unexpected error in get_filtered_schools_with_optional_program:",
        err
      );
      return { data: [], total: 0 };
    }
  }

  async createAutoProfile(
    languageDocId: string | undefined
  ): Promise<TableTypes<"user">> {
    if (!this.supabase) throw new Error("Supabase instance is not initialized");

    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw new Error("User is not Logged in");
    const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
    const studentProfile = await this.getParentStudentProfiles();
    if (studentProfile.length > 0) return studentProfile[0];

    const studentId = uuidv4();
    const now = new Date().toISOString();

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

    // Insert user
    const { error: userInsertError } = await this.supabase
      .from(TABLES.User)
      .insert([newStudent]);
    if (userInsertError) {
      console.error("Error inserting auto profile user:", userInsertError);
      throw userInsertError;
    }

    // Insert parent_user
    const parentUserId = uuidv4();
    const parentUserData: TableTypes<"parent_user"> = {
      id: parentUserId,
      parent_id: _currentUser.id,
      student_id: studentId,
      created_at: now,
      updated_at: now,
      is_deleted: false,
      is_firebase: null,
      is_ops: null,
      ops_created_by: null,
    };
    const { error: parentInsertError } = await this.supabase
      .from(TABLES.ParentUser)
      .insert([parentUserData]);
    if (parentInsertError) {
      console.error(
        "Error inserting parent_user for auto profile:",
        parentInsertError
      );
      throw parentInsertError;
    }

    // Find English, Maths, and language-dependent subject
    const englishCourse = await this.getCourse(CHIMPLE_ENGLISH);
    const mathsCourse = await this.getCourse(CHIMPLE_MATHS);
    const digitalSkillsCourse = await this.getCourse(CHIMPLE_DIGITAL_SKILLS);
    const language = languageDocId
      ? await this.getLanguageWithId(languageDocId)
      : undefined;
    let langCourse: TableTypes<"course"> | undefined;
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
    // Add only these three courses to the student
    const coursesToAdd = [
      englishCourse,
      mathsCourse,
      langCourse,
      digitalSkillsCourse,
    ].filter(Boolean) as TableTypes<"course">[];

    // Insert user_course entries
    for (const course of coursesToAdd) {
      const newUserCourse: TableTypes<"user_course"> = {
        id: uuidv4(),
        user_id: studentId,
        course_id: course.id,
        created_at: now,
        updated_at: now,
        is_deleted: false,
        is_firebase: null,
      };
      const { error: userCourseInsertError } = await this.supabase
        .from(TABLES.UserCourse)
        .insert([newUserCourse]);
      if (userCourseInsertError) {
        console.error(
          "Error inserting user_course for auto profile:",
          userCourseInsertError
        );
      }
    }

    return newStudent;
  }

  async isProgramUser(): Promise<boolean> {
    if (!this.supabase) {
      console.error("Supabase client not initialized.");
      return false;
    }
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw new Error("User is not Logged in");

    const userId = _currentUser.id;

    const { data, error } = await this.supabase
      .from("program_user")
      .select("id")
      .eq("user", userId)
      .in("role", ["program_manager", "field_coordinator"])
      .eq("is_deleted", false)
      .limit(1);

    if (error) {
      console.error("Error checking program_user table", error);
      return false;
    }

    return !!(data && data.length > 0);
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
    if (!this.supabase) {
      console.error("Supabase client not initialized.");
      return { data: [], totalCount: 0 };
    }
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw new Error("User not logged in");
    const userId = _currentUser.id;
    const roles: string[] = JSON.parse(localStorage.getItem(USER_ROLE) ?? "[]");
    const isSuperAdmin = roles.includes(RoleType.SUPER_ADMIN);
    const isOpsDirector = roles.includes(RoleType.OPERATIONAL_DIRECTOR);
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    if (isSuperAdmin || isOpsDirector) {
      let query = this.supabase
        .from("user")
        .select(
          `
          *,
          special_users!inner (
            role
          )
        `,
          { count: "exact" }
        )
        .eq("is_deleted", false)
        .ilike("name", `%${search}%`)
        .eq("special_users.is_deleted", false);
      if (isOpsDirector && !isSuperAdmin) {
        query = query.neq("special_users.role", RoleType.SUPER_ADMIN);
      }
      const { data, count, error } = await query
        .order(sortBy, { ascending: sortOrder === "asc" })
        .range(from, to);
      if (error) {
        console.error("Supabase fetch error:", error);
        return { data: [], totalCount: 0 };
      }
      if (!data) return { data: [], totalCount: 0 };
      const result = data.map((d) => {
        const { special_users, ...userObject } = d;
        const role = special_users[0]?.role || "";
        return {
          user: userObject as TableTypes<"user">,
          role,
        };
      });
      return { data: result, totalCount: count || 0 };
    }
    if (roles.includes(RoleType.PROGRAM_MANAGER)) {
      const { data: programs, error: programsError } = await this.supabase
        .from("program_user")
        .select("program_id")
        .eq("user", userId)
        .eq("role", RoleType.PROGRAM_MANAGER)
        .eq("is_deleted", false);
      if (programsError) {
        console.error(
          "Error fetching program manager's programs:",
          programsError
        );
        return { data: [], totalCount: 0 };
      }
      if (!programs || programs.length === 0) {
        return { data: [], totalCount: 0 };
      }
      const programIds = programs.map((p) => p.program_id);
      let query = this.supabase
        .from("user")
        .select(
          `
        *,
        program_user!inner(role)
        `,
          { count: "exact" }
        )
        .in("program_user.program_id", programIds)
        .eq("program_user.role", RoleType.FIELD_COORDINATOR)
        .eq("program_user.is_deleted", false)
        .eq("is_deleted", false);
      if (search) {
        query = query.ilike("name", `%${search}%`);
      }
      const {
        data: users,
        count,
        error,
      } = await query
        .order(sortBy, { ascending: sortOrder === "asc" })
        .range(from, to);
      if (error) {
        console.error("Error fetching field coordinators:", error);
        return { data: [], totalCount: 0 };
      }
      if (!users) {
        return { data: [], totalCount: 0 };
      }
      const result = users.map((u) => {
        const { program_user, ...userObject } = u;
        const role = program_user[0]?.role || RoleType.FIELD_COORDINATOR;
        return {
          user: userObject as TableTypes<"user">,
          role,
        };
      });
      return { data: result, totalCount: count || 0 };
    }
    return { data: [], totalCount: 0 };
  }

  async program_activity_stats(programId: string): Promise<{
    total_students: number;
    total_teachers: number;
    total_schools: number;
    active_student_percentage: number;
    active_teacher_percentage: number;
    avg_weekly_time_minutes: number;
  }> {
    if (!this.supabase) {
      console.error("Supabase client is not initialized.");
      return {
        total_students: 0,
        total_teachers: 0,
        total_schools: 0,
        active_student_percentage: 0,
        active_teacher_percentage: 0,
        avg_weekly_time_minutes: 0,
      };
    }
    try {
      const { data, error } = await this.supabase.rpc(
        "get_program_activity_stats",
        {
          p_program_id: programId,
        }
      );

      if (error || !data) {
        console.error("RPC error:", error);
        return {
          total_students: 0,
          total_teachers: 0,
          total_schools: 0,
          active_student_percentage: 0,
          active_teacher_percentage: 0,
          avg_weekly_time_minutes: 0,
        };
      }
      const stats = data as unknown as {
        total_students: number;
        total_teachers: number;
        total_schools: number;
        active_student_percentage: number;
        active_teacher_percentage: number;
        avg_weekly_time_minutes: number;
      };

      return {
        total_students: stats.total_students ?? 0,
        total_teachers: stats.total_teachers ?? 0,
        total_schools: stats.total_schools ?? 0,
        active_student_percentage: stats.active_student_percentage ?? 0,
        active_teacher_percentage: stats.active_teacher_percentage ?? 0,
        avg_weekly_time_minutes: stats.avg_weekly_time_minutes ?? 0,
      };
    } catch (err) {
      console.error("Unexpected error:", err);
      return {
        total_students: 0,
        total_teachers: 0,
        total_schools: 0,
        active_student_percentage: 0,
        active_teacher_percentage: 0,
        avg_weekly_time_minutes: 0,
      };
    }
  }

  async school_activity_stats(schoolId: string): Promise<{
    active_student_percentage: number;
    active_teacher_percentage: number;
    avg_weekly_time_minutes: number;
  }> {
    if (!this.supabase) {
      console.error("Supabase client is not initialized.");
      return {
        active_student_percentage: 0,
        active_teacher_percentage: 0,
        avg_weekly_time_minutes: 0,
      };
    }

    try {
      const { data, error } = await this.supabase.rpc(
        "get_school_activity_stats",
        {
          p_school_id: schoolId,
        }
      );

      if (error) {
        console.error("RPC error:", error);
        return {
          active_student_percentage: 0,
          active_teacher_percentage: 0,
          avg_weekly_time_minutes: 0,
        };
      }
      const stats = data as unknown as {
        active_student_percentage: number;
        active_teacher_percentage: number;
        avg_weekly_time_minutes: number;
      };
      return {
        active_student_percentage: stats?.active_student_percentage ?? 0,
        active_teacher_percentage: stats?.active_teacher_percentage ?? 0,
        avg_weekly_time_minutes: stats?.avg_weekly_time_minutes ?? 0,
      };
    } catch (err) {
      console.error("Unexpected error:", err);
      return {
        active_student_percentage: 0,
        active_teacher_percentage: 0,
        avg_weekly_time_minutes: 0,
      };
    }
  }

  async isProgramManager(): Promise<boolean> {
    if (!this.supabase) {
      console.error("Supabase client not initialized.");
      return false;
    }
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw new Error("User is not Logged in");
    const userId = _currentUser.id;
    const { data, error } = await this.supabase
      .from("program_user")
      .select("id")
      .eq("user", userId)
      .in("role", ["program_manager"])
      .eq("is_deleted", false)
      .limit(1);
    if (error) {
      console.error("Error checking program_user table", error);
      return false;
    }
    return !!(data && data.length > 0);
  }

  async getUserSpecialRoles(userId: string): Promise<string[]> {
    if (!this.supabase) {
      console.error("Supabase client not initialized.");
      return [];
    }

    if (!userId) {
      console.warn("userId is missing. Cannot fetch roles.");
      return [];
    }

    try {
      const { data, error } = await this.supabase
        .from("special_users")
        .select("role")
        .eq("user_id", userId)
        .in("role", [
          RoleType.SUPER_ADMIN,
          RoleType.PROGRAM_MANAGER,
          RoleType.FIELD_COORDINATOR,
          RoleType.OPERATIONAL_DIRECTOR,
        ])
        .eq("is_deleted", false);

      if (error) {
        console.error(
          "Error fetching roles from special_users:",
          error.message
        );
        return [];
      }

      const roles = (data ?? [])
        .map((item) => item.role)
        .filter((role): role is NonNullable<typeof role> => role !== null);

      return roles;
    } catch (e) {
      console.error("Unexpected error while fetching user special roles:", e);
      return [];
    }
  }

  async updateSpecialUserRole(userId: string, role: string): Promise<void> {
    if (!this.supabase) {
      console.error("Supabase client not initialized.");
      return;
    }
    const updatedAt = new Date().toISOString();
    try {
      const { error } = await this.supabase
        .from("special_users")
        .update({
          role: role as RoleType.PROGRAM_MANAGER | RoleType.FIELD_COORDINATOR,
          updated_at: updatedAt,
        })
        .eq("user_id", userId)
        .eq("is_deleted", false);

      if (error) {
        console.error("Error updating role in special_users:", error.message);
      }
    } catch (e) {
      console.error("Unexpected error while updating user role:", e);
    }
  }
  async deleteSpecialUser(userId: string): Promise<void> {
    if (!this.supabase) {
      console.error("Supabase client not initialized.");
      return;
    }
    try {
      const { error } = await this.supabase
        .from("special_users")
        .update({ is_deleted: true })
        .eq("user_id", userId)
        .eq("is_deleted", false);
      if (error) {
        console.error("Error deleting user in special_users:", error.message);
      }
    } catch (e) {
      console.error("Unexpected error while deleting user:", e);
    }
  }

  async updateProgramUserRole(userId: string, role: string): Promise<void> {
    if (!this.supabase) {
      console.error("Supabase client not initialized.");
      return;
    }
    const updatedAt = new Date().toISOString();
    try {
      const { error } = await this.supabase
        .from("program_user")
        .update({
          role: role as RoleType.PROGRAM_MANAGER | RoleType.FIELD_COORDINATOR,
          updated_at: updatedAt,
        })
        .eq("user", userId)
        .eq("is_deleted", false);

      if (error) {
        console.error("Error updating role in program_user:", error.message);
      }
    } catch (e) {
      console.error("Unexpected error while updating user role:", e);
    }
  }

  async deleteProgramUser(userId: string): Promise<void> {
    if (!this.supabase) {
      console.error("Supabase client not initialized.");
      return;
    }
    try {
      const { error } = await this.supabase
        .from("program_user")
        .update({ is_deleted: true })
        .eq("user", userId)
        .eq("is_deleted", false);
      if (error) {
        console.error("Error deleting user in program_user:", error.message);
      }
    } catch (e) {
      console.error("Unexpected error while deleting user:", e);
    }
  }

  async deleteUserFromSchoolsWithRole(
    userId: string,
    role: RoleType
  ): Promise<void> {
    if (!this.supabase) {
      console.error("Supabase client not initialized.");
      return;
    }
    try {
      const { error } = await this.supabase
        .from("school_user")
        .update({ is_deleted: true })
        .eq("user_id", userId)
        .eq("role", role)
        .eq("is_deleted", false);
      if (error) {
        console.error("Error deleting user in program_user:", error.message);
      }
    } catch (e) {
      console.error("Unexpected error while deleting user:", e);
    }
  }
  async getChaptersByIds(
    chapterIds: string[]
  ): Promise<TableTypes<"chapter">[]> {
    if (!this.supabase) {
      console.error(
        "getChaptersByIds failed: Supabase client not initialized."
      );
      return [];
    }

    if (!chapterIds || chapterIds.length === 0) {
      console.warn("getChaptersByIds was called with no chapter IDs.");
      return [];
    }

    try {
      const { data, error } = await this.supabase
        .from(TABLES.Chapter)
        .select("*")
        .in("id", chapterIds)
        .eq("is_deleted", false);

      if (error) {
        console.warn("Error fetching chapters by IDs:", chapterIds);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching chapters", error);
      return [];
    }
  }
  async getChapterIdbyQrLink(
    link: string
  ): Promise<TableTypes<"chapter_links"> | undefined> {
    throw new Error("Method not implemented.");
  }
  async addParentToNewClass(classID: string, studentId: string) {
    try {
      if (!this.supabase) return;
      const { error } = await this.supabase.rpc("add_parent_to_newclass", {
        _class_id: classID,
        _student_id: studentId,
      });

      if (error) {
        console.error("Failed to add parent to class:", error.message);
      }
    } catch (error) {
      console.error("Error in addParentToNewClass:", error);
    }
  }

  async getOpsRequests(
    this: any,
    requestStatus: EnumType<"ops_request_status">,
    page: number = 1,
    limit: number = 20,
    orderBy: string = "created_at",
    orderDir: "asc" | "desc" = "asc",
    filters?: {
      request_type?: EnumType<"ops_request_type">[];
      school?: string[];
    },
    searchTerm?: string
  ): Promise<{
    data: any[];
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  }> {
    try {
      if (!this.supabase)
        return { data: [], total: 0, totalPages: 0, page, limit };

      const offset = Math.max(0, (page - 1) * limit);
      const allowedOrderByDb = [
        "created_at",
        "updated_at",
        "school(name)",
      ] as const;
      if (!allowedOrderByDb.includes(orderBy as any)) orderBy = "created_at";
      if (!["asc", "desc"].includes(orderDir.toLowerCase())) orderDir = "asc";

      const trimmedSearchTerm = searchTerm?.trim();
      const doTextSearch = !!trimmedSearchTerm && trimmedSearchTerm.length >= 3;

      let searchSchoolIds: string[] = [];
      let searchUserIds: string[] = [];

      if (doTextSearch) {
        const [{ data: schoolData }, { data: userData }] = await Promise.all([
          this.supabase
            .from(TABLES.School)
            .select("id")
            .eq("is_deleted", false)
            .ilike("name", `%${trimmedSearchTerm}%`),
          this.supabase
            .from(TABLES.User)
            .select("id")
            .eq("is_deleted", false)
            .ilike("name", `%${trimmedSearchTerm}%`),
        ]);
        if (schoolData?.length)
          searchSchoolIds = schoolData.map((s: any) => String(s.id));
        if (userData?.length)
          searchUserIds = userData.map((u: any) => String(u.id));
      }

      const applyFilters = (q: any) => {
        q = q.eq("is_deleted", false);

        const RS = Constants.public.Enums.ops_request_status;
        const nowIso = new Date().toISOString();
        const isComplexStatus =
          requestStatus === RS[0] || requestStatus === RS[2];

        if (isComplexStatus) {
          if (requestStatus === RS[2]) {
            q = q.or(
              [
                `request_status.eq.${requestStatus}`,
                `and(request_status.eq.requested,request_type.eq.student,request_ends_at.lte.${nowIso})`,
              ].join(",")
            );
          } else {
            q = q.or(
              [
                `and(request_status.eq.requested,request_type.neq.student)`,
                `and(request_status.eq.requested,request_type.eq.student,request_ends_at.gt.${nowIso})`,
              ].join(",")
            );
          }
        } else {
          q = q.eq("request_status", requestStatus);
        }

        if (filters?.request_type?.length)
          q = q.in("request_type", filters.request_type);

        const schoolFilterIds: string[] | undefined = filters?.school?.filter(
          (x: unknown): x is string => typeof x === "string"
        );
        if (schoolFilterIds?.length) q = q.in("school_id", schoolFilterIds);

        if (doTextSearch) {
          const orConditions: string[] = [];

          const allRequestTypes: string[] = Object.values(
            RequestTypes
          ) as string[];
          const st = trimmedSearchTerm!.toLowerCase();

          const matchingRequestTypes = allRequestTypes.filter((rt) =>
            rt.toLowerCase().includes(st)
          );
          if (matchingRequestTypes.length)
            orConditions.push(
              `request_type.in.(${matchingRequestTypes.join(",")})`
            );

          if (trimmedSearchTerm.length) {
            orConditions.push(`request_id.eq.${trimmedSearchTerm}`);
          }

          if (searchSchoolIds.length)
            orConditions.push(`school_id.in.(${searchSchoolIds.join(",")})`);
          if (searchUserIds.length) {
            orConditions.push(
              `requested_by.in.(${searchUserIds.join(",")})`,
              `responded_by.in.(${searchUserIds.join(",")})`
            );
          }

          if (orConditions.length) q = q.or(orConditions.join(","));
          else return { q, earlyEmpty: true };
        }

        return { q, earlyEmpty: false };
      };

      let countQ = this.supabase
        .from(TABLES.OpsRequests)
        .select("id", { count: "exact", head: true });
      const { q: cq, earlyEmpty } = applyFilters(countQ);
      if (earlyEmpty) return { data: [], total: 0, totalPages: 0, page, limit };
      const { error: countErr, count: total } = await cq;
      if (countErr) throw countErr;

      let rowsQ = this.supabase
        .from(TABLES.OpsRequests)
        .select(
          "id, request_id, request_status, request_type, request_ends_at, is_deleted, school_id, class_id, requested_by, responded_by, created_at, updated_at, rejected_reason_description, rejected_reason_type, school:school_id(*)"
        );
      const { q: rq } = applyFilters(rowsQ);

      const { data: rows, error: rowsErr } = await rq
        .order(orderBy, { ascending: orderDir === "asc" })
        .range(offset, offset + limit - 1);
      if (rowsErr) throw rowsErr;

      if (!rows?.length) {
        const totalPages = total ? Math.max(1, Math.ceil(total / limit)) : 0;
        return { data: [], total: total ?? 0, totalPages, page, limit };
      }

      const schoolIds: string[] = Array.from(
        new Set(
          rows
            .map((r: any) => r.school_id)
            .filter((x: unknown): x is string => typeof x === "string")
        )
      );
      const userIds: string[] = Array.from(
        new Set(
          rows
            .flatMap((r: any) => [r.requested_by, r.responded_by])
            .filter((x: unknown): x is string => typeof x === "string")
        )
      );
      const classIds: string[] = Array.from(
        new Set(
          rows
            .map((r: any) => r.class_id)
            .filter((x: unknown): x is string => typeof x === "string")
        )
      );

      const [schoolsResp, usersResp, classesResp] = await Promise.all([
        schoolIds.length
          ? this.supabase
              .from(TABLES.School)
              .select("id, name, udise, group1,group2, group3, country")
              .in("id", schoolIds)
          : Promise.resolve({ data: [] as any[], error: null }),
        userIds.length
          ? this.supabase
              .from(TABLES.User)
              .select("id, name, email, phone")
              .in("id", userIds)
          : Promise.resolve({ data: [] as any[], error: null }),
        classIds.length
          ? this.supabase
              .from(TABLES.Class)
              .select("id, name, school_id")
              .in("id", classIds)
          : Promise.resolve({ data: [] as any[], error: null }),
      ]);
      if (schoolsResp.error) throw schoolsResp.error;
      if (usersResp.error) throw usersResp.error;
      if (classesResp.error) throw classesResp.error;

      const schoolMap = new Map(
        (schoolsResp.data || []).map((s: any): [string, any] => [
          s.id as string,
          s,
        ])
      );
      const userMap = new Map(
        (usersResp.data || []).map((u: any): [string, any] => [
          u.id as string,
          u,
        ])
      );
      const classMap = new Map(
        (classesResp.data || []).map((c: any): [string, any] => [
          c.id as string,
          c,
        ])
      );

      const data = rows.map((r: any) => ({
        ...r,
        school: r.school_id
          ? schoolMap.get(r.school_id) ?? r.school ?? null
          : null,
        requestedBy: r.requested_by
          ? userMap.get(r.requested_by) ?? null
          : null,
        respondedBy: r.responded_by
          ? userMap.get(r.responded_by) ?? null
          : null,
        classInfo: r.class_id ? classMap.get(r.class_id) ?? null : null,
      }));

      const totalPages = total ? Math.max(1, Math.ceil(total / limit)) : 0;
      return { data, total: total ?? 0, totalPages, page, limit };
    } catch (err) {
      console.error("Error in getOpsRequests:", err);
      return { data: [], total: 0, totalPages: 0, page, limit };
    }
  }

  async getRequestFilterOptions() {
    try {
      if (!this.supabase) return null;

      const [requestTypeResponse, schoolResponse] = await Promise.all([
        this.supabase
          .from(TABLES.OpsRequests)
          .select("request_type")
          .eq("is_deleted", false),

        this.supabase
          .from(TABLES.OpsRequests)
          .select("school_id, school:school(id, name)")
          .eq("is_deleted", false)
          .not("school_id", "is", null),
      ]);

      if (requestTypeResponse.error) {
        console.error(
          "Failed to fetch request types:",
          requestTypeResponse.error.message
        );
        throw requestTypeResponse.error;
      }

      if (schoolResponse.error) {
        console.error("Failed to fetch schools:", schoolResponse.error.message);
        throw schoolResponse.error;
      }
      // 1. Get unique request types
      const allRequestTypes = (requestTypeResponse.data || []).map(
        (item) => item.request_type
      );
      const uniqueRequestTypes = [...new Set(allRequestTypes)];

      // 2. Get unique schools with id and name
      const schoolMap = new Map<string, { id: string; name: string }>();

      ((schoolResponse.data as any[]) || []).forEach((item) => {
        if (item.school && item.school.id && item.school.name) {
          schoolMap.set(item.school.id, {
            id: item.school.id,
            name: item.school.name,
          });
        }
      });

      const uniqueSchools = Array.from(schoolMap.values());

      return {
        requestType: uniqueRequestTypes,
        school: uniqueSchools,
      };
    } catch (error) {
      console.error("Error in getRequestFilterOptions:", error);
      throw error;
    }
  }

  async searchStudentsInSchool(
    schoolId: string,
    searchTerm: string,
    page: number,
    limit: number
  ): Promise<{ data: any[]; total: number }> {
    if (!this.supabase) return { data: [], total: 0 };
    try {
      // Step 1: Get all class_ids for the school
      const { data: classData, error: classError } = await this.supabase
        .from("class")
        .select("id, name")
        .eq("school_id", schoolId)
        .eq("is_deleted", false);
      if (classError || !classData) {
        console.error("Error fetching classes for school:", classError);
        return { data: [], total: 0 };
      }
      const classIds = classData.map((row: any) => row.id);
      if (classIds.length === 0) return { data: [], total: 0 };
      // Step 2: Get all class_user rows for those classes and role student, filter by name using ilike
      const { data: classUserData, error: classUserError } = await this.supabase
        .from("class_user")
        .select(`user:user_id (*), class_id`)
        .in("class_id", classIds)
        .eq("role", "student")
        .eq("is_deleted", false)
        .ilike("user.name", `%${searchTerm}%`)
        .not("user", "is", null);
      if (classUserError || !classUserData) {
        console.error("Error fetching class_user rows:", classUserError);
        return { data: [], total: 0 };
      }
      // Step 3: Get parent phone numbers for each student using an inner query
      const studentIds = classUserData.map((row: any) => row.user.id);
      let parentPhoneMap: Record<
        string,
        {
          parent_id: string;
          parent_name: string | null;
          parent_phone: string | null;
        }
      > = {};
      if (studentIds.length > 0) {
        const { data: parentData, error: parentError } = await this.supabase
          .from("parent_user")
          .select("student_id, parent_id, user:parent_id(id, name, phone)")
          .in("student_id", studentIds)
          .eq("is_deleted", false);
        if (parentError) {
          console.error("Error fetching parent_user rows:", parentError);
        } else {
          for (const row of parentData ?? []) {
            let parent_name = null;
            let parent_phone = null;
            if (
              row.user &&
              typeof row.user === "object" &&
              !Array.isArray(row.user)
            ) {
              parent_name = (row.user as any).name ?? null;
              parent_phone = (row.user as any).phone ?? null;
            }
            parentPhoneMap[row.student_id] = {
              parent_id: row.parent_id,
              parent_name,
              parent_phone,
            };
          }
        }
      }
      // Step 4: Pagination
      const offset = (page - 1) * limit;
      const pagedRows = classUserData.slice(offset, offset + limit);
      // Step 5: Build result objects
      const result = pagedRows.map((row: any) => {
        const classInfo = classData.find((c: any) => c.id === row.class_id);
        const className = classInfo?.name ?? "";
        const { grade, section } = this.parseClassName(className);
        const parentInfo = parentPhoneMap[row.user.id] ?? {};
        return {
          id: row.user.id,
          name: row.user.name,
          gender: row.user.gender ?? null,
          student_id: row.user.student_id,
          phone: row.user.phone,
          class_id: row.class_id,
          class_name: className,
          grade,
          classSection: section,
          parent: {
            id: parentInfo.parent_id ?? undefined,
            name: parentInfo.parent_name ?? undefined,
            phone: parentInfo.parent_phone ?? undefined,
          },
        };
      });
      return { data: result, total: classUserData.length };
    } catch (err) {
      console.error("Error searching students in school:", err);
      return { data: [], total: 0 };
    }
  }
  async searchTeachersInSchool(
    schoolId: string,
    searchTerm: string,
    page: number,
    limit: number
  ): Promise<{ data: any[]; total: number }> {
    if (!this.supabase) return { data: [], total: 0 };
    try {
      // Step 1: Get all class_ids for the school
      const { data: classData, error: classError } = await this.supabase
        .from("class")
        .select("id, name")
        .eq("school_id", schoolId)
        .eq("is_deleted", false);
      if (classError || !classData) {
        console.error("Error fetching classes for school:", classError);
        return { data: [], total: 0 };
      }
      const classIds = classData.map((row: any) => row.id);
      if (classIds.length === 0) return { data: [], total: 0 };
      // Step 2: Get all class_user rows for those classes and role teacher
      const { data: classUserData, error: classUserError } = await this.supabase
        .from("class_user")
        .select(`user:user_id (*), class_id`)
        .in("class_id", classIds)
        .eq("role", "teacher")
        .eq("is_deleted", false)
        .ilike("user.name", `%${searchTerm}%`)
        .not("user", "is", null);
      if (classUserError || !classUserData) {
        console.error("Error fetching class_user rows:", classUserError);
        return { data: [], total: 0 };
      }
      // Step 3: Get parent info for each teacher using an inner query
      const teacherIds = classUserData.map((row: any) => row.user.id);
      let parentInfoMap: Record<
        string,
        {
          parent_id: string;
          parent_name: string | null;
          parent_phone: string | null;
        }
      > = {};
      if (teacherIds.length > 0) {
        const { data: parentUserData, error: parentUserError } =
          await this.supabase
            .from("parent_user")
            .select("parent_id, student_id")
            .in("student_id", teacherIds)
            .eq("is_deleted", false);
        if (!parentUserError && parentUserData && parentUserData.length > 0) {
          const parentIds = parentUserData.map((row: any) => row.parent_id);
          let parentDetailsMap: Record<
            string,
            { name: string | null; phone: string | null }
          > = {};
          if (parentIds.length > 0) {
            const { data: parentDetails, error: parentDetailsError } =
              await this.supabase
                .from("user")
                .select("id, name, phone")
                .in("id", parentIds)
                .eq("is_deleted", false);
            if (
              !parentDetailsError &&
              parentDetails &&
              parentDetails.length > 0
            ) {
              for (const parent of parentDetails) {
                parentDetailsMap[parent.id] = {
                  name: parent.name ?? null,
                  phone: parent.phone ?? null,
                };
              }
            }
          }
          for (const row of parentUserData) {
            parentInfoMap[row.student_id] = {
              parent_id: row.parent_id,
              parent_name: parentDetailsMap[row.parent_id]?.name ?? null,
              parent_phone: parentDetailsMap[row.parent_id]?.phone ?? null,
            };
          }
        }
      }
      // Step 4: Pagination
      const offset = (page - 1) * limit;
      const pagedRows = classUserData.slice(offset, offset + limit);
      // Step 5: Build result objects (with parent info)
      const result = pagedRows.map((row: any) => {
        const classInfo = classData.find((c: any) => c.id === row.class_id);
        const className = classInfo?.name ?? "";
        const { grade, section } = this.parseClassName(className);
        const parentInfo = parentInfoMap[row.user.id] ?? null;
        return {
          id: row.user.id,
          name: row.user.name,
          gender: row.user.gender ?? null,
          email: row.user.email,
          phone: row.user.phone,
          class_id: row.class_id,
          class_name: className,
          grade,
          classSection: section,
          parent: parentInfo,
        };
      });
      return { data: result, total: classUserData.length };
    } catch (err) {
      console.error("Error searching teachers in school:", err);
      return { data: [], total: 0 };
    }
  }
  async approveOpsRequest(
    requestId: string,
    respondedBy: string,
    role: (typeof RequestTypes)[keyof typeof RequestTypes],
    schoolId?: string,
    classId?: string
  ): Promise<TableTypes<"ops_requests"> | undefined> {
    if (!this.supabase) return undefined;

    // Build update payload dynamically
    const updatePayload: any = {
      request_status: "approved",
      responded_by: respondedBy,
      updated_at: new Date().toISOString(),
    };

    if (schoolId) {
      updatePayload.school_id = schoolId;
    }

    if (classId) {
      updatePayload.class_id = classId;
    }
    const { data, error } = await this.supabase
      .from("ops_requests")
      .update(updatePayload)
      .eq("id", requestId)
      .eq("is_deleted", false)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Error approving ops_request:", error);
      return undefined;
    }

    return data as TableTypes<"ops_requests">;
  }
  async respondToSchoolRequest(
    requestId: string,
    respondedBy: string,
    status: (typeof STATUS)[keyof typeof STATUS],
    rejectedReasonType?: string,
    rejectedReasonDescription?: string
  ): Promise<TableTypes<"ops_requests"> | undefined> {
    if (!this.supabase) return undefined;

    const updatePayload: any = {
      request_status: status,
      responded_by: respondedBy,
      updated_at: new Date().toISOString(),
    };
    if (rejectedReasonType) {
      updatePayload.rejected_reason_type = rejectedReasonType;
    }
    if (rejectedReasonDescription) {
      updatePayload.rejected_reason_description = rejectedReasonDescription;
    }

    const { data, error } = await this.supabase
      .from("ops_requests")
      .update(updatePayload)
      .eq("id", requestId)
      .eq("is_deleted", false)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Error responding to school_request:", error);
      return undefined;
    }

    return data as TableTypes<"ops_requests">;
  }

  async getProgramsByRole(): Promise<{ data: TableTypes<"program">[] }> {
    if (!this.supabase) {
      console.error("Supabase client not initialized.");
      return { data: [] };
    }

    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw new Error("User not logged in");

    const userId = _currentUser.id;
    const roles: string[] = JSON.parse(localStorage.getItem(USER_ROLE) ?? "[]");
    const isSuperAdmin = roles.includes(RoleType.SUPER_ADMIN);
    const isOpsDirector = roles.includes(RoleType.OPERATIONAL_DIRECTOR);

    // Case 1: Super Admin or Ops Director → fetch ALL programs
    if (isSuperAdmin || isOpsDirector) {
      const { data, error } = await this.supabase
        .from("program")
        .select("*")
        .eq("is_deleted", false)
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching programs:", error);
        return { data: [] };
      }
      return { data: data || [] };
    }

    // Case 2: Program Manager → fetch only programs assigned to them
    if (roles.includes(RoleType.PROGRAM_MANAGER)) {
      const { data: programUsers, error: programUsersError } =
        await this.supabase
          .from("program_user")
          .select("program_id")
          .eq("user", userId)
          .eq("role", RoleType.PROGRAM_MANAGER)
          .eq("is_deleted", false);

      if (programUsersError) {
        console.error(
          "Error fetching program_user entries:",
          programUsersError
        );
        return { data: [] };
      }
      if (!programUsers || programUsers.length === 0) {
        return { data: [] };
      }
      const programIds = programUsers.map((p) => p.program_id);
      const { data: programs, error } = await this.supabase
        .from("program")
        .select("*")
        .in("id", programIds)
        .eq("is_deleted", false)
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching programs for program manager:", error);
        return { data: [] };
      }
      return { data: programs || [] };
    }

    return { data: [] };
  }

  async getFieldCoordinatorsByProgram(
    programId: string
  ): Promise<{ data: TableTypes<"user">[] }> {
    if (!this.supabase) return { data: [] };
    if (!programId) return { data: [] };

    const { data: programUsers, error: linkError } = await this.supabase
      .from("program_user")
      .select("user")
      .eq("program_id", programId)
      .eq("role", RoleType.FIELD_COORDINATOR)
      .eq("is_deleted", false);

    if (linkError || !programUsers?.length) {
      console.error("Error fetching program_user:", linkError);
      return { data: [] };
    }
    const userIds = programUsers
      .map((pu) => pu.user)
      .filter((id): id is string => !!id);
    const { data: users, error: userError } = await this.supabase
      .from("user")
      .select("*")
      .in("id", userIds)
      .eq("is_deleted", false)
      .order("name", { ascending: true });

    if (userError) {
      console.error("Error fetching users:", userError);
      return { data: [] };
    }
    return { data: users || [] };
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
    if (!this.supabase) return;

    const updatePayload: any = {
      status: schoolStatus,
      updated_at: new Date().toISOString(),
    };

    if (address?.state !== undefined) updatePayload.group1 = address.state;
    if (address?.district !== undefined)
      updatePayload.group2 = address.district;
    if (address?.city !== undefined) updatePayload.group3 = address.city;
    if (address?.address !== undefined) updatePayload.group4 = address.address;

    if (keyContacts) {
      updatePayload.key_contacts = JSON.stringify(keyContacts); 
    }
    const { error } = await this.supabase
      .from("school")
      .update(updatePayload)
      .eq("id", schoolId)
      .eq("is_deleted", false);

    if (error) {
      console.error("Error updating school status:", error);
    }
  }
  async getGeoData(params: GeoDataParams): Promise<string[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase.rpc("get_geo_data", params);

    if (error || !data) {
      console.error("RPC 'get_geo_data' failed with params:", params, error);
      return [];
    }
    return data || [];
  }
  async searchSchools(
    params: SearchSchoolsParams
  ): Promise<SearchSchoolsResult> {
    if (!this.supabase) {
      console.error("Supabase client is not available.");
      return { total_count: 0, schools: [] };
    }

    const { data, error } = await this.supabase.rpc("search_schools", params);

    if (error) {
      console.error("RPC 'search_schools' failed:", params, error);
      return { total_count: 0, schools: [] };
    }
    const resultRow = Array.isArray(data) ? data[0] : data;
    console.log("searchSchools result:", data);
    return {
      total_count: resultRow.total_count,
      schools: (resultRow.schools as School[]) ?? [],
    };
  }

  async sendJoinSchoolRequest(
    schoolId: string,
    requestType: RequestTypes,
    classId?: string
  ): Promise<void> {
    if (!this.supabase) throw new Error("Supabase instance is not initialized");

    const currentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!currentUser) throw new Error("User is not Logged in");
    const now = new Date().toISOString();
    const { error } = await this.supabase.from("ops_requests").insert([
      {
        school_id: schoolId,
        class_id: classId,
        request_type: requestType,
        requested_by: currentUser.id,
        request_status: STATUS.REQUESTED,
        rejected_reason_description: "",
        rejected_reason_type: "",
        created_at: now,
        updated_at: now,
        is_deleted: false,
      },
    ]);

    if (error) {
      console.error("❌ Error inserting join school request:", error);
      throw error;
    }
  }
  async getAllClassesBySchoolId(
    schoolId: string
  ): Promise<TableTypes<"class">[]> {
    if (!this.supabase) return [];

    const { data: classes, error } = await this.supabase.rpc(
      "get_classes_by_school_id",
      {
        school_id_input: schoolId,
      }
    );
    if (error) {
      console.error("Error fetching classes by school ID:", error);
      return [];
    }
    return classes || [];
  }
  async getRewardById(
    rewardId: string
  ): Promise<TableTypes<"rive_reward"> | undefined> {
    if (!this.supabase) return undefined;
    try {
      const { data, error } = await this.supabase
        .from("rive_reward")
        .select("*")
        .eq("id", rewardId)
        .eq("is_deleted", false);
      if (error) {
        console.error("Error fetching reward by ID:", error);
      }
      return data && data.length > 0
        ? (data[0] as TableTypes<"rive_reward">)
        : undefined;
    } catch (error) {
      console.log("Unexpected error fetching reward by ID:", error);
      return undefined;
    }
  }
  async getAllRewards(): Promise<TableTypes<"rive_reward">[] | []> {
    if (!this.supabase) return [];
    try {
      const { data, error } = await this.supabase
        .from(TABLES.RiveReward)
        .select("*")
        .eq("type", "normal")
        .eq("is_deleted", false)
        .order("state_number_input");

      if (error) {
        console.error("Error fetching all rewards", error);
        return [];
      }
      return data as TableTypes<"rive_reward">[];
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
    if (!this.supabase) return;
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
      const { error } = await this.supabase
        .from("user")
        .update({ reward: currentUser.reward, updated_at: timestamp })
        .eq("id", userId)
        .eq("is_deleted", false);

      if (error) {
        console.error("Error updating user reward:", error);
        return;
      }
      Util.setCurrentStudent(currentUser);
    } catch (error) {
      console.error("❌ Error updating user reward:", error);
    }
  }
  async getActiveStudentsCountByClass(
    classId: string,
    days: number = 7
  ): Promise<string> {
    if (!this.supabase) {
      throw new Error("Supabase client is not initialized.");
    }
    const { data, error } = await this.supabase.rpc(
      "get_active_students_count_by_class",
      {
        p_class_id: classId,
        p_days: days,
      }
    );
    if (error) {
      console.error("Error fetching active students count:", error);
      throw error;
    }
    return (data ?? 0).toString();
  }
  async getCompletedAssignmentsCountForSubjects(
    studentId: string,
    subjectIds: string[]
  ): Promise<{ subject_id: string; completed_count: number }[]> {
    if (!this.supabase) return [];

    try {
      // Query to get count of completed lessons per subject for the student for given subjects
      const { data, error } = await this.supabase
        .from("result")
        .select("lesson:lesson_id(subject_id)")
        .eq("student_id", studentId)
        .in("lesson.subject_id", subjectIds)
        .is("is_deleted", false);

      if (error) {
        console.error("Error fetching completed homework counts:", error);
        return [];
      }

      // Aggregate counts by subject_id
      const completedCountMap: { [key: string]: number } = {};
      data.forEach((row: any) => {
        const subjId = row.lesson.subject_id;
        completedCountMap[subjId] = (completedCountMap[subjId] || 0) + 1;
      });

      return Object.entries(completedCountMap).map(
        ([subject_id, completed_count]) => ({
          subject_id,
          completed_count,
        })
      );
    } catch (err) {
      console.error("Exception in getCompletedHomeworkCountForSubjects:", err);
      return [];
    }
  }
  async deleteApprovedOpsRequestsForUser(
    userId: string,
    schoolId?: string,
    classId?: string
  ): Promise<void> {
    if (!this.supabase) return;

    let query = this.supabase
      .from("ops_requests")
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq("requested_by", userId)
      .eq("request_status", "approved")
      .eq("is_deleted", false);

    if (schoolId) query = query.eq("school_id", schoolId);
    if (classId) query = query.eq("class_id", classId);

    const { error } = await query;

    if (error) {
      console.error("Error deleting approved ops_requests:", error);
    }
  }

  async getOrcreateschooluser(
    params: UserSchoolClassParams
  ): Promise<UserSchoolClassResult> {
    if (!this.supabase) {
      throw new Error("Supabase client is not initialized.");
    }
    const { name, phoneNumber, email, schoolId, role, classId } = params;
    if (!role) {
      throw new Error("A role is required to link a user to a school.");
    }
    const timestamp = new Date().toISOString();
    const { data, error } = await this.supabase.functions.invoke(
      "get_or_create_user",
      {
        body: { name, phone: phoneNumber, email },
      }
    );
    if (error) {
      console.error("user-upsert failed:", error);
      throw error;
    }
    if (!data || !data.user) {
      console.error("Invalid response from user-upsert:", data);
      throw new Error("Invalid response from user-upsert");
    }
    const { message, user } = data as {
      message: string;
      user: { id: string; [key: string]: any };
    };
    const isNewUser = message === "success-created";
    let schoolUser: any | null = null;
    if (schoolId) {
      const { data: existingSchoolUser, error: existingSchoolUserError } =
        await this.supabase
          .from("school_user")
          .select("*")
          .eq("school_id", schoolId)
          .eq("user_id", user.id)
          .eq("is_deleted", false)
          .maybeSingle();
      if (existingSchoolUserError) {
        console.error("Failed to fetch school_user:", existingSchoolUserError);
        throw existingSchoolUserError;
      }
      if (existingSchoolUser) {
        const { data: updated, error: updateError } = await this.supabase
          .from("school_user")
          .update({
            role,
            is_deleted: false,
            updated_at: timestamp,
          })
          .eq("id", existingSchoolUser.id)
          .select("*")
          .maybeSingle();
        if (updateError) {
          console.error("Failed to update school_user:", updateError);
          throw updateError;
        }
        schoolUser = updated ?? existingSchoolUser;
      } else {
        const schoolUserPayload = {
          id: uuidv4(),
          school_id: schoolId,
          user_id: user.id,
          role,
          is_deleted: false,
          created_at: timestamp,
          updated_at: timestamp,
        };
        const { data: inserted, error: insertError } = await this.supabase
          .from("school_user")
          .insert([schoolUserPayload])
          .select("*")
          .maybeSingle();
        if (insertError) {
          console.error("Failed to insert school_user:", insertError);
          throw insertError;
        }
        schoolUser = inserted;
      }
    }
    let classUser: any | null = null;
    if (classId) {
      const { data: existingClassUser, error: existingClassUserError } =
        await this.supabase
          .from("class_user")
          .select("*")
          .eq("class_id", classId)
          .eq("user_id", user.id)
          .eq("is_deleted", false)
          .maybeSingle();
      if (existingClassUserError) {
        console.error("Failed to fetch class_user:", existingClassUserError);
        throw existingClassUserError;
      }
      if (existingClassUser) {
        const { data: updatedClass, error: updateClassError } =
          await this.supabase
            .from("class_user")
            .update({
              role,
              is_deleted: false,
              updated_at: timestamp,
            })
            .eq("id", existingClassUser.id)
            .select("*")
            .maybeSingle();
        if (updateClassError) {
          console.error("Failed to update class_user:", updateClassError);
          throw updateClassError;
        }
        classUser = updatedClass ?? existingClassUser;
      } else {
        const classUserPayload = {
          id: uuidv4(),
          class_id: classId,
          user_id: user.id,
          role,
          is_deleted: false,
          created_at: timestamp,
          updated_at: timestamp,
        };
        const { data: insertedClass, error: insertClassError } =
          await this.supabase
            .from("class_user")
            .insert([classUserPayload])
            .select("*")
            .maybeSingle();
        if (insertClassError) {
          console.error("Failed to insert class_user:", insertClassError);
          throw insertClassError;
        }
        classUser = insertedClass;
      }
    }
    return {
      user,
      schoolUser,
      classUser,
      isNewUser,
    };
  }
  async insertSchoolDetails(
    schoolId: string,
    schoolModel: string,
    locationLink?: string,
    keyContacts?: any
  ): Promise<void> {
    if (!this.supabase) return;
    const insertPayload: any = {
      model: schoolModel,
      updated_at: new Date().toISOString(),
    };

    if (locationLink !== undefined && locationLink !== null) {
      insertPayload.location_link = locationLink;
    }

    if (keyContacts) {
      insertPayload.key_contacts = JSON.stringify(keyContacts);
    }

    const { error } = await this.supabase
      .from("school")
      .update(insertPayload)
      .eq("id", schoolId)
      .eq("is_deleted", false);

    if (error) {
      console.error("Error inserting school details:", error);
    }
  }
  async updateClassCourses(
    classId: string,
    selectedCourseIds: string[]
  ): Promise<void> {
    if (!this.supabase) return;

    const now = new Date().toISOString();

    // Delete all existing course for this class
    const { error: deleteError } = await this.supabase
      .from("class_course")
      .update({ is_deleted: true, updated_at: now })
      .eq("class_id", classId)
      .eq("is_deleted", false);

    if (deleteError) {
      console.error("Error removing old class_course entries:", deleteError);
      throw deleteError;
    }

    // Insert the new course
    if (selectedCourseIds.length > 0) {
      const newEntries = selectedCourseIds.map((courseId) => ({
        id: uuidv4(),
        class_id: classId,
        course_id: courseId,
        created_at: now,
        updated_at: now,
        is_deleted: false,
      }));

      const { error: insertError } = await this.supabase
        .from("class_course")
        .insert(newEntries);

      if (insertError) {
        console.error("Error inserting new class_course entries:", insertError);
        throw insertError;
      }
    }
  }


  async addStudentWithParentValidation(params: {
    phone: string;
    name: string;
    gender: string;
    age: string;
    classId: string;
    schoolId?: string;
    parentName?: string;
    email?:string;
  }): Promise<{ success: boolean; message: string; data?: any }> {
    if (!this.supabase) {
      return { success: false, message: "Supabase client is not initialized" };
    }

    const {
      phone,
      name,
      gender,
      age,
      classId,
      schoolId,
      parentName,
      email,
    } = params;
    const timestamp = new Date().toISOString();
    const finalAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
    try {
      let languageId;
      if (schoolId) {
        const { data: schoolData, error: schoolError } = await this.supabase
          .from(TABLES.School)
          .select("language")
          .eq("id", schoolId)
          .maybeSingle();

        if (schoolData?.language) {
          languageId = schoolData?.language;
        }
      }
      if (!languageId) {
        languageId = "7eaf3509-e44e-460f-80a1-7f6a13a8a883";
      }

      const { data: userData, error: userError } =
        await this.supabase.functions.invoke("get_or_create_user", {
          body: { name: parentName || "Parent", phone: phone, email: email || "" },
        });

      if (userError) {
        console.error("Error creating/getting parent user:", userError);
        return {
          success: false,
          message: "Error creating parent account",
        };
      }

      if (!userData || !userData.user) {
        console.error("Invalid response from user-upsert:", userData);
        return { success: false, message: "Invalid response from server" };
      }

      const parentId = userData.user.id;

      const { count, error: countError } = await this.supabase
        .from(TABLES.ParentUser)
        .select("*", { count: "exact", head: true })
        .eq("parent_id", parentId)
        .eq("is_deleted", false);

      if (countError) {
        console.error("Error counting children:", countError);
        return {
          success: false,
          message: "Error checking existing profiles",
        };
      }

      if (count !== null && count >= 3) {
        return {
          success: false,
          message: "This number already has 3 profiles.",
        };
      }

      const childId = uuidv4();
      const { error: childCreateError } = await this.supabase
        .from(TABLES.User)
        .insert({
          id: childId,
          name: name,
          gender: gender,
          age: parseInt(age) || 0,
          language_id: languageId,
          avatar: finalAvatar,
          created_at: timestamp,
          updated_at: timestamp,
          is_deleted: false,
        });

      if (childCreateError) {
        console.error("Error creating child user:", childCreateError);
        return { success: false, message: "Error creating student profile" };
      }

      const { error: parentUserError } = await this.supabase
        .from(TABLES.ParentUser)
        .insert({
          id: uuidv4(),
          parent_id: parentId,
          student_id: childId,
          created_at: timestamp,
          updated_at: timestamp,
          is_deleted: false,
        });

      if (parentUserError) {
        console.error("Error linking child to parent:", parentUserError);
        return { success: false, message: "Error linking student to parent" };
      }

      const { error: studentClassError } = await this.supabase
        .from(TABLES.ClassUser)
        .insert({
          id: uuidv4(),
          class_id: classId,
          user_id: childId,
          role: RoleType.STUDENT,
          created_at: timestamp,
          updated_at: timestamp,
          is_deleted: false,
        });

      if (studentClassError) {
        console.error("Error adding student to class:", studentClassError);
        return { success: false, message: "Error adding student to class" };
      }

      const { data: parentInClass, error: parentCheckError } =
        await this.supabase
          .from(TABLES.ClassUser)
          .select("id")
          .eq("class_id", classId)
          .eq("user_id", parentId)
          .eq("role", RoleType.PARENT)
          .eq("is_deleted", false)
          .maybeSingle();

      if (parentCheckError) {
        console.error("Error checking parent in class:", parentCheckError);
      }

      if (!parentInClass) {
        const { error: parentClassError } = await this.supabase
          .from(TABLES.ClassUser)
          .insert({
            id: uuidv4(),
            class_id: classId,
            user_id: parentId,
            role: RoleType.PARENT,
            created_at: timestamp,
            updated_at: timestamp,
            is_deleted: false,
          });

        if (parentClassError) {
          console.error("Error adding parent to class:", parentClassError);
        }
      }

      return {
        success: true,
        message: "Student added successfully",
        data: {
          studentId: childId,
          parentId: parentId,
        },
      };
    } catch (error) {
      console.error(
        "Unexpected error in addStudentWithParentValidation:",
        error
      );
      return {
        success: false,
        message: "An unexpected error occurred while adding the student",
      };
    }
  }
}
