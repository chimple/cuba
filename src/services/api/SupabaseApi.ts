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
} from "../../common/constants";
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
    throw new Error("Method not implemented.");
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

  async uploadData(payload: any): Promise<boolean> {
    try {
      if (!this.supabase) {
        console.error("Supabase client is not initialized.");
        return false;
      }
      const { data, error } = await this.supabase.functions.invoke(
        "ops-data-insert",
        {
          body: payload,
        }
      );
      if (error) {
        console.error("Function error:", error);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Upload failed:", error);
      return false;
    }
  }

  async getTablesData(
    tableNames: TABLES[] = Object.values(TABLES),
    tablesLastModifiedTime: Map<string, string> = new Map()
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
        }

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
    image: File | null
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
      updated_at: new Date().toISOString(),
      created_at: school.created_at,
      id: school.id,
      is_deleted: false,
      model: null
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

  async deleteUserFromClass(userId: string): Promise<void> {
    if (!this.supabase) return;

    const updatedAt = new Date().toISOString();

    try {
      const { error } = await this.supabase
        .from(TABLES.ClassUser)
        .update({
          is_deleted: true,
          updated_at: updatedAt,
        })
        .eq("user_id", userId);

      if (error) {
        console.error("Error deleting user from class_user:", error);
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
    image: File | null
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
      created_at: timestamp,
      updated_at: timestamp,
      is_deleted: false,
      model: null
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
    userId: string
  ): Promise<TableTypes<"req_new_school"> | null> {
    if (!this.supabase) return null;

    const { data, error } = await this.supabase
      .from(TABLES.ReqNewSchool)
      .select("*")
      .eq("user_id", userId)
      .eq("is_resolved", false)
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
    }

    for (const course of courses) {
      const newUserCourse: TableTypes<TABLES.UserCourse> = {
        id: uuidv4(),
        user_id: studentId,
        course_id: course.id,
        created_at: now,
        updated_at: now,
        is_deleted: false,
      };

      const { error: userCourseInsertError } = await this.supabase
        .from(TABLES.UserCourse)
        .insert([newUserCourse]);
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

    const res = await this.supabase.rpc("delete_student", {
      student_id: studentId,
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
      console.log("Error fetching lesson:", error);
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

    let query = this.supabase.from("course").select("*").eq("is_deleted", false);

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
      .from("lesson")
      .select("*")
      .eq("chapter_id", chapterId)
      .eq("is_deleted", false);
    if (error) {
      console.error("Error fetching chapter:", error);
      return [] as TableTypes<"lesson">[];
    }
    return data ?? ([] as TableTypes<"lesson">[]);
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
      ...new Set(courses.map((c) => c.grade_id).filter(Boolean)),
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
      student_id: studentId,
      time_spent: timeSpent,
      wrong_moves: wrongMoves,
      created_at: now,
      updated_at: now,
      is_deleted: false,
      chapter_id: chapterId,
      course_id: courseId ?? null,
      class_id: classId ?? null,
    };

    const { error: insertError } = await this.supabase
      .from("result")
      .insert(newResult);

    if (insertError) {
      console.error("Error inserting result:", insertError);
      return {} as TableTypes<"result">;
    }

    // Calculate earned stars
    let starsEarned = 0;
    if (score > 25) starsEarned++;
    if (score > 50) starsEarned++;
    if (score > 75) starsEarned++;

    const previousStarsRaw = localStorage.getItem(STARS_COUNT);
    let currentStars = previousStarsRaw
      ? JSON.parse(previousStarsRaw)[studentId]
      : 0;
    const totalStars = currentStars + starsEarned;

    // Update user stars
    const { error: updateError } = await this.supabase
      .from("user")
      .update({ stars: totalStars })
      .eq("id", studentId);

    if (updateError) {
      console.error("Error updating student stars:", updateError);
    }

    // Sync local student data
    const updatedStudent = await this.getUserByDocId(studentId);
    if (updatedStudent) {
      Util.setCurrentStudent(updatedStudent);
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
    boardDocId: string,
    gradeDocId: string,
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
    newClassId: string
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
      student_id: student.student_id ?? null,
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
        const now = new Date().toISOString();

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
        };

        await this.supabase.from(TABLES.ClassUser).insert(newClassUser);
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
    profilePic: string | undefined
  ): Promise<TableTypes<"user">> {
    if (!this.supabase) return user;

    const updatedFields = {
      name: fullName,
      email,
      phone: phoneNum,
      language_id: languageDocId,
      image: profilePic ?? null,
    };

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
      resultMap[row.lesson_id] = row;
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
      console.log("Error in getting class", error);
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
      console.log("Error in getting school", error);
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
      console.log("Error in isStudentLinked", error);
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
    userId: string
  ): Promise<{ school: TableTypes<"school">; role: RoleType }[]> {
    if (!this.supabase) return [];

    const finalData: { school: TableTypes<"school">; role: RoleType }[] = [];
    const schoolIds: Set<string> = new Set();

    // Fetch class_user with TEACHER role
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
      const { data: classes, error: classError } = await this.supabase
        .from(TABLES.Class)
        .select("school_id")
        .in("id", classIds)
        .eq("is_deleted", false);

      if (classError) {
        console.error("Error fetching classes:", classError);
      } else {

        const schoolIdList = classes.map((c) => c.school_id);
        const { data: schools, error: schoolError } = await this.supabase
          .from(TABLES.School)
          .select("*")
          .in("id", schoolIdList)
          .eq("is_deleted", false);

        if (schoolError) {
          console.error("Error fetching schools:", schoolError);
        } else {
          for (const school of schools) {
            if (!schoolIds.has(school.id)) {
              schoolIds.add(school.id);
              finalData.push({ school, role: RoleType.TEACHER });
            }
          }
        }
      }
    }

    // From school_user (excluding parent)
    const { data: schoolUsers, error: schoolUserError } = await this.supabase
      .from(TABLES.SchoolUser)
      .select("role, school_id")
      .eq("user_id", userId)
      .neq("role", RoleType.PARENT)
      .eq("is_deleted", false);

    if (schoolUserError) {
      console.error("Error fetching school users:", schoolUserError);
    } else if (schoolUsers?.length) {
      const schoolUserIds = schoolUsers.map((su) => su.school_id);
      const { data: schools, error: schoolFetchError } = await this.supabase
        .from(TABLES.School)
        .select("*")
        .in("id", schoolUserIds)
        .eq("is_deleted", false);

      if (schoolFetchError) {
        console.error("Error fetching schools:", schoolFetchError);
      } else {
        for (const su of schoolUsers) {
          const school = schools.find((s) => s.id === su.school_id);
          const role = su.role as RoleType;

          if (school && !schoolIds.has(school.id)) {
            schoolIds.add(school.id);
            finalData.push({ school, role });
          } else if (school) {
            const existing = finalData.find((e) => e.school.id === school.id);
            if (existing) {
              existing.role = role; // override
            }
          }
        }
      }
    }
    console.log(finalData);
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
    className: string
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
      created_at: timestamp,
      updated_at: timestamp,
      is_deleted: false,
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
        console.log("No class_user records found for the teachers.");
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
        console.log("No class_course records found for the class.");
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

      console.log("Class and related data marked as deleted successfully.");
    } catch (error) {
      console.error("Failed to delete class:", error);
      throw error;
    }
  }
  async updateClass(classId: string, className: string) {
    if (!this.supabase) return;

    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw new Error("User is not Logged in");

    const { error } = await this.supabase
      .from("class")
      .update({ name: className })
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

      console.log(`Updated unseen rewards to seen for student ${studentId}`);
    } catch (err) {
      console.error("Unexpected error updating rewards as seen:", err);
      throw new Error("Unexpected error updating rewards as seen.");
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
        .select("lesson_id, chapter_id, chapter(course_id)")
        .eq("lesson_id", lessonId)
        .eq("is_deleted", false)
        .eq("chapter.is_deleted", false)
        .eq("lesson.is_deleted", false);

      if (error || !data || data.length < 1) return;

      const classCourseIds = new Set(classCourses.map((c) => c.id));

      const matchedLesson = data.find((item) => {
        const chapters = item.chapter as { course_id: string }[];
        const courseId = chapters[0]?.course_id;
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
    courseId: string,
    startDate: string,
    endDate: string,
    isClassWise: boolean,
    isLiveQuiz: boolean
  ): Promise<TableTypes<"assignment">[] | undefined> {
    if (!this.supabase) return;

    let query = this.supabase
      .from("assignment")
      .select("*")
      .eq("class_id", classId)
      .eq("course_id", courseId)
      .gte("created_at", endDate)
      .lte("created_at", startDate)
      .eq("is_deleted", false);

    if (isClassWise) {
      query = query.eq("is_class_wise", true);
    }

    if (isLiveQuiz) {
      query = query.eq("type", "liveQuiz");
    } else {
      query = query.neq("type", "liveQuiz");
    }

    query = query.order("created_at", { ascending: false });
    const { data, error } = await query;

    if (error || !data || data.length < 1) return;
    return data;
  }
  async getStudentLastTenResults(
    studentId: string,
    courseId: string,
    assignmentIds: string[]
  ): Promise<TableTypes<"result">[]> {
    if (!this.supabase) return [];

    // 1. Fetch results with assignment_id IS NULL
    const { data: nullAssignments, error: nullError } = await this.supabase
      .from("result")
      .select("*")
      .eq("student_id", studentId)
      .eq("course_id", courseId)
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
        .eq("course_id", courseId)
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
    type: string
  ): Promise<boolean> {
    if (!this.supabase) return false;

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
            created_at: timestamp,
            updated_at: timestamp,
            is_deleted: false,
          },
        ]);

      if (assignmentError) {
        console.error("Error inserting assignment:", assignmentError.message);
        return false;
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
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Unexpected error in createAssignment:", error);
      return false;
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
      const data = results.data[0];
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
      const data = results.data[0];
      return data;
    } catch (error) {
      throw error;
    }
  }
  async addTeacherToClass(classId: string, userId: string): Promise<void> {
    if (!this.supabase) return;

    const classUserId = uuidv4();
    const now = new Date().toISOString();

    const classUser = {
      id: classUserId,
      class_id: classId,
      user_id: userId,
      role: RoleType.TEACHER,
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
    const user_doc = await this.getUserByDocId(userId);

    // Insert into user table with upsert logic (on conflict do nothing)
    if (user_doc) {
      const { error: userInsertError } = await this.supabase
        .from(TABLES.User)
        .upsert(
          {
            id: user_doc.id,
            name: user_doc.name,
            age: user_doc.age,
            gender: user_doc.gender,
            avatar: user_doc.avatar,
            image: user_doc.image,
            curriculum_id: user_doc.curriculum_id,
            language_id: user_doc.language_id,
            created_at: user_doc.created_at,
            updated_at: user_doc.updated_at,
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

    const userIds:string[] = data?.map((row) => row.user_id) ?? [];
    return userIds ?? [];
  }
  async getStudentResultByDate(
    studentId: string,
    startDate: string,
    course_id: string,
    endDate: string
  ): Promise<TableTypes<"result">[] | undefined> {
    if (!this.supabase) return;

    const { data, error } = await this.supabase
      .from(TABLES.Result)
      .select("*")
      .eq("student_id", studentId)
      .eq("course_id", course_id)
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
        .update({ is_deleted: true })
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
    endDate: string
  ): Promise<TableTypes<"result">[] | undefined> {
    if (!this.supabase) return;

    try {
      const { data, error } = await this.supabase
        .from(TABLES.Result)
        .select("*")
        .eq("chapter_id", chapter_id)
        .eq("course_id", course_id)
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
        .flatMap((item: { school: any[] }) => item.school)
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
      .select("user(*)")
      .eq("school_id", schoolId)
      .eq("role", RoleType.PRINCIPAL)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching principals:", error);
      return;
    }

    const users = (data ?? [])
      .flatMap((item: { user: any[] }) => item.user)
      .filter((user): user is TableTypes<"user"> => !!user);

    return users;
  }
  async getCoordinatorsForSchool(
    schoolId: string
  ): Promise<TableTypes<"user">[] | undefined> {
    if (!this.supabase) return;

    const { data, error } = await this.supabase
      .from("school_user")
      .select("user(*)")
      .eq("school_id", schoolId)
      .eq("role", RoleType.COORDINATOR)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching coordinators:", error);
      return;
    }

    const coordinators = (data ?? [])
      .flatMap((item: { user: any[] }) => item.user)
      .filter((user): user is TableTypes<"user"> => !!user);

    return coordinators;
  }
  async getSponsorsForSchool(
    schoolId: string
  ): Promise<TableTypes<"user">[] | undefined> {
    if (!this.supabase) return;

    const { data, error } = await this.supabase
      .from("school_user")
      .select("user(*)")
      .eq("school_id", schoolId)
      .eq("role", RoleType.SPONSOR)
      .eq("is_deleted", false);

    if (error) {
      console.error("Error fetching sponsors:", error);
      return;
    }

    const sponsors = (data ?? [])
      .flatMap((item: { user: any[] }) => item.user)
      .filter((user): user is TableTypes<"user"> => !!user);

    return sponsors;
  }
  async addUserToSchool(
    schoolId: string,
    userId: string,
    role: RoleType
  ): Promise<void> {
    if (!this.supabase) return;

    const schoolUserId = uuidv4();
    const timestamp = new Date().toISOString();

    const schoolUser = {
      id: schoolUserId,
      school_id: schoolId,
      user_id: userId,
      role,
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

    const user_doc = await this.getUserByDocId(userId);

    if (user_doc) {
      const cleanUserDoc = {
        id: user_doc.id,
        name: user_doc.name ?? null,
        age: user_doc.age ?? null,
        gender: user_doc.gender ?? null,
        avatar: user_doc.avatar ?? null,
        image: user_doc.image ?? null,
        curriculum_id: user_doc.curriculum_id ?? null,
        language_id: user_doc.language_id ?? null,
        created_at: user_doc.created_at ?? timestamp,
        updated_at: user_doc.updated_at ?? timestamp,
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
  ): Promise<{ status: string; errors?: string[] }> {
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
      if (data?.status === "error" && (data as any).message) {
        return {
          status: "error",
          errors: [(data as any).message],
        };
      }
      return data as { status: string; errors?: string[] };
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
      if (data?.status === "error" && (data as any).message) {
        return {
          status: "error",
          errors: [(data as any).message],
        };
      }
      return data as { status: string; errors?: string[] };
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
      if (data?.status === "error" && (data as any).message) {
        return {
          status: "error",
          errors: [(data as any).message],
        };
      }
      return data as { status: string; errors?: string[] };
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
  ): Promise<{ status: string; errors?: string[] }> {
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

      if (data?.status === "error" && (data as any).message) {
        return {
          status: "error",
          errors: [(data as any).message],
        };
      }

      return data as { status: string; errors?: string[] };
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
          field_coordinator_contact: fieldCoordinatorPhone?.trim() ?? null,
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

      return data;
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
          if (Array.isArray(val) && val.every((v) => typeof v === "string")) {
            parsed[key] = val;
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
    tab = "ALL",
  }: {
    currentUserId: string;
    filters?: Record<string, string[]>;
    searchTerm?: string;
    tab?: "ALL" | "AT SCHOOL" | "AT HOME" | "HYBRID";
  }): Promise<{ data: any[] }> {
    if (!this.supabase) {
      console.error("Supabase client not initialized");
      return { data: [] };
    }

    try {
      // Call the RPC with currentUserId and pass filters as JSON
      const { data, error } = await this.supabase.rpc("get_programs_for_user", {
        _current_user_id: currentUserId,
        _filters: filters,
        _search_term: searchTerm,
        _tab: tab,
      });

      if (error) {
        console.error("Error calling get_programs_for_user RPC:", error);
        return { data: [] };
      }

      // data will contain programs with manager_names already attached
      return { data: data || [] };
    } catch (err) {
      console.error("Unexpected error in getPrograms:", err);
      return { data: [] };
    }
  }

  async getProgramManagers(): Promise<string[]> {
    if (!this.supabase) {
      console.error("Supabase client is not initialized.");
      return [];
    }

    const { data, error } = await this.supabase.rpc("get_program_managers");

    if (error) {
      console.error("Error fetching managers:", error);
      return [];
    }

    const names = data?.map((manager: { name: string }) => manager.name) || [];
    return names;
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

      const model =
        payload.models.length > 1
          ? "HYBRID"
          : payload.models.length === 1
            ? payload.models[0]
            : "";

      const record: any = {
        name: payload.programName,
        model,

        implementation_partner: payload.partners.implementation,
        funding_partner: payload.partners.funding,
        institute_partner: payload.partners.institute,

        country: payload.locations.Country,
        state: payload.locations.State,
        block: payload.locations.Block,
        cluster: payload.locations.Cluster,
        district: payload.locations.District,

        program_type: payload.programType,
        institutes_count: payload.stats.institutes,
        students_count: payload.stats.students,
        devices_count: payload.stats.devices,

        start_date: payload.startDate,
        end_date: payload.endDate,

        program_manager: payload.selectedManagers,

        is_deleted: false,
        is_ops: true,
        school_id: null,
      };

      const { data, error } = await this.supabase
        .from(TABLES.Program)
        .insert(record);

      if (error) {
        console.error("Insert error:", error);
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
    model: MODEL,
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
  programDetails: { label: string; value: string }[];
  locationDetails: { label: string; value: string }[];
  partnerDetails: { label: string; value: string }[];
  programManagers: { name: string; role: string; phone: string }[];
} | null> {
  if (!this.supabase) {
    console.error("Supabase client not initialized.");
    return null;
  }

  try {
    // 1. Fetch program record
    const { data: program, error: programError } = await this.supabase
      .from('program')
      .select('*')
      .eq('id', programId)
      .single();

    if (programError || !program) {
      console.error('Error fetching program:', programError);
      return null;
    }

    // 2. Fetch managers from user_programs
    const { data: mappings, error: mappingsError } = await this.supabase
      .from('program_user')
      .select('user')
      .eq('program_id', programId)
      .eq('role', 'program_manager');

    if (mappingsError) {
      console.error('Error fetching program managers:', mappingsError);
      return null;
    }

    const userIds = mappings.map(m => m.user);
    // 3. Fetch user details
    const { data: users, error: usersError } = await this.supabase
      .from('user')
      .select('id, name, phone')
      .in('id', userIds);
    if (usersError) {
      console.error('Error fetching user details:', usersError);
      return null;
    }

    // 4. Format the response
    const programDetails = [
      { label: 'Program Name', value: program.name },
      { label: 'Program Type', value: program.program_type },
      { label: 'Program Model', value: program.model },
      { label: 'Program Date', value: `${program.start_date}  ${program.end_date}` },
    ];

    const locationDetails = [
      { label: 'Country', value: program.country },
      { label: 'State', value: program.state },
      { label: 'District', value: program.district },
      { label: 'Cluster', value: program.cluster },
      { label: 'Block', value: program.block },
      { label: 'Village', value: program.village },
    ];

    const partnerDetails = [
      { label: 'Implementation Partner', value: program.implementation_partner },
      { label: 'Funding Partner', value: program.funding_partner },
      { label: 'Institute Owner', value: program.institute_partner},
    ];

    const programManagers = users.map(user => ({
      name: user.name,
      role: 'Program Manager',
      phone: user.phone,
    }));

    return {
      programDetails,
      locationDetails,
      partnerDetails,
      programManagers,
    };
  } catch (err) {
    console.error('Unexpected error in getProgramData:', err);
    return null;
  }
}
  


}
