import { v4 as uuidv4 } from 'uuid';
import {
  CHIMPLE_DIGITAL_SKILLS,
  CHIMPLE_ENGLISH,
  CHIMPLE_HINDI,
  COURSES,
  DEFAULT_LOCALE_ID,
  EnumType,
  GRADE1_KANNADA,
  GRADE1_MARATHI,
  MUTATE_TYPES,
  PROFILETYPE,
  STATUS,
  SchoolVisitAction,
  SchoolVisitType,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import { ServiceConfig } from '../../ServiceConfig';
import { SupabaseApiCore } from './SupabaseApi.core';
const SCHOOL_METRICS_DAY_WINDOWS = [7, 15, 30] as const;
const PROGRAM_METRICS_DAY_WINDOWS = [7, 15, 30] as const;

export interface SupabaseApiSchool {
  [key: string]: any;
}
export class SupabaseApiSchool extends SupabaseApiCore {
  async updateSchoolLocation(
    schoolId: string,
    lat: number,
    lng: number,
  ): Promise<void> {
    const locationString = `https://www.google.com/maps?q=${lat},${lng}`;
    const updatedAt = new Date().toISOString();

    // Update directly in supabase
    await this.mutate(
      MUTATE_TYPES.UPDATE,
      TABLES.School,
      { location_link: locationString, updated_at: updatedAt },
      schoolId,
    );
  }

  async recordSchoolVisit(
    schoolId: string,
    lat: number,
    lng: number,
    action: SchoolVisitAction,
    visitType?: SchoolVisitType,
    distanceFromSchool?: number,
    numberOfParents?: number,
  ): Promise<TableTypes<'fc_school_visit'> | null> {
    try {
      if (!this.supabase) {
        logger.error('Supabase client not initialized');
        return null;
      }

      const {
        data: { user },
      } = await this.supabase.auth.getUser();
      if (!user) {
        logger.error('SupabaseApi: User not logged in');
        throw 'User is not Logged in';
      }

      const now = new Date().toISOString();

      if (action === SchoolVisitAction.CheckIn) {
        // Enforce enum format: "Regular Visit" -> "regular_visit"
        const newVisit = {
          school_id: schoolId,
          user_id: user.id,
          check_in_at: now,
          check_in_lat: lat,
          check_in_lng: lng,
          type: visitType,
          is_deleted: false,
          distance_from_school:
            distanceFromSchool == null ? null : String(distanceFromSchool),
          number_of_parents: null,
        };

        const { data, error } = await this.supabase
          .from(TABLES.FcSchoolVisit)
          .insert(newVisit)
          .select()
          .single();

        if (error) {
          logger.error('SupabaseApi: Insert Error:', error);
          throw error;
        }
        return data;
      } else {
        const { data: openVisits, error: fetchError } = await this.supabase
          .from(TABLES.FcSchoolVisit)
          .select('*')
          .eq('user_id', user.id)
          .eq('school_id', schoolId)
          .is('check_out_at', null)
          .eq('is_deleted', false)
          .order('check_in_at', { ascending: false })
          .limit(1);

        if (fetchError) {
          logger.error('SupabaseApi: Error fetching open visit:', fetchError);
          throw fetchError;
        }

        if (openVisits && openVisits.length > 0) {
          const visitToUpdate = openVisits[0];
          const nextNumberOfParents =
            visitToUpdate.type === SchoolVisitType.Community
              ? numberOfParents == null
                ? visitToUpdate.number_of_parents
                : numberOfParents
              : null;

          const { data, error } = await this.supabase
            .from(TABLES.FcSchoolVisit)
            .update({
              check_out_at: now,
              check_out_lat: lat,
              check_out_lng: lng,
              number_of_parents: nextNumberOfParents,
              updated_at: now,
              distance_from_school:
                distanceFromSchool == null
                  ? visitToUpdate.distance_from_school
                  : String(distanceFromSchool),
            })
            .eq('id', visitToUpdate.id)
            .select()
            .single();

          if (error) {
            logger.error('SupabaseApi: Update Error:', error);
            throw error;
          }
          return data;
        } else {
          logger.warn('SupabaseApi: No active visit found to check out from.');
          return null;
        }
      }
    } catch (error) {
      logger.error(
        'SupabaseApi: Unexpected error recording school visit:',
        error,
      );
      return null;
    }
  }

  async getLastSchoolVisit(
    schoolId: string,
  ): Promise<TableTypes<'fc_school_visit'> | null> {
    try {
      if (!this.supabase) return null;
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (!user) return null;

      const { data, error } = await this.supabase
        .from(TABLES.FcSchoolVisit)
        .select('*')
        .eq('school_id', schoolId)
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        logger.error('SupabaseApi: Error getting last visit:', error);
        return null;
      }

      return data;
    } catch (e) {
      logger.error('SupabaseApi: getLastSchoolVisit exception:', e);
      return null;
    }
  }

  async updateSchoolProfile(
    school: TableTypes<'school'>,
    name: string,
    group1: string,
    group2: string,
    group3: string,
    image: File | null,
    group4?: string | null,
    program_id?: string | null,
    udise?: string | null,
    address?: string | null,
  ): Promise<TableTypes<'school'>> {
    if (!this.supabase) return {} as TableTypes<'school'>;

    const result = image
      ? await this.addProfileImages(school.id, image, PROFILETYPE.SCHOOL)
      : school.image;
    // Prepare updated data
    const updatedSchool: TableTypes<'school'> = {
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
      whatsapp_bot_number: null,
    };

    const { error } = await this.supabase
      .from(TABLES.School)
      .update(updatedSchool)
      .eq('id', school.id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating school profile:', error);
      throw error;
    }
    return updatedSchool;
  }

  async getCoursesByClassId(
    classId: string,
  ): Promise<TableTypes<'class_course'>[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from(TABLES.ClassCourse)
      .select('*')
      .eq('class_id', classId)
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error fetching class courses:', error);
      return [];
    }

    return data ?? [];
  }

  async getCoursesBySchoolId(
    schoolId: string,
  ): Promise<TableTypes<'school_course'>[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from(TABLES.SchoolCourse)
      .select('*')
      .eq('school_id', schoolId)
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error fetching school courses:', error);
      return [];
    }

    return data ?? [];
  }

  async removeCoursesFromClass(ids: string[]): Promise<void> {
    if (!this.supabase) return;
    const updatedAt = new Date().toISOString();
    try {
      if (ids.length === 0) {
        logger.warn('No course IDs provided for removal.');
        return;
      }

      const { error } = await this.supabase
        .from(TABLES.ClassCourse)
        .update({ is_deleted: true, updated_at: updatedAt })
        .in('id', ids);

      if (error) {
        logger.error('Error removing courses from class_course:', error);
      }
    } catch (err) {
      logger.error('Exception in removeCoursesFromClass:', err);
    }
  }

  async removeCoursesFromSchool(ids: string[]): Promise<void> {
    if (!this.supabase) return;
    const updatedAt = new Date().toISOString();
    try {
      if (ids.length === 0) {
        logger.warn('No course IDs provided for removal.');
        return;
      }

      const { error } = await this.supabase
        .from(TABLES.SchoolCourse)
        .update({ is_deleted: true, updated_at: updatedAt })
        .in('id', ids);

      if (error) {
        logger.error('Error removing courses from school_course:', error);
      }
    } catch (err) {
      logger.error('Exception in removeCoursesFromSchool:', err);
    }
  }
  async checkCourseInClasses(
    classIds: string[],
    courseId: string,
  ): Promise<boolean> {
    if (!this.supabase) return false;

    try {
      if (classIds.length === 0) return false;

      const { data, error } = await this.supabase
        .from(TABLES.ClassCourse)
        .select('id')
        .in('class_id', classIds)
        .eq('course_id', courseId)
        .eq('is_deleted', false)
        .limit(1);

      if (error) {
        logger.error('Error checking course in classes:', error);
        return false;
      }

      return !!data && data.length > 0;
    } catch (err) {
      logger.error('Exception in checkCourseInClasses:', err);
      return false;
    }
  }

  // ServerApi.ts
  async deleteUserFromClass(
    userId: string,
    class_id: string,
  ): Promise<boolean | void> {
    if (!this.supabase) return false;

    try {
      const rpcRes = await this.supabase.rpc('delete_user_from_class', {
        p_user_id: userId,
        p_class_id: class_id,
      });

      if (!rpcRes || rpcRes.error) {
        if (rpcRes?.error) {
          logger.error('Error deleting user from class:', rpcRes.error);
        }
        return false;
      }

      await this.updateClassAndSchoolLastModified([class_id]);
      return true;
    } catch (error) {
      logger.error('SupabaseApi ~ deleteUserFromClass ~ error:', error);
      return false;
    }
  }

  async createSchool(
    name: string,
    group1: string,
    group2: string,
    group3: string,
    group4: string | null,
    status: EnumType<'status'> | null,
    image: File | null,
    program_id: string | null,
    udise: string | null,
    address: string | null,
    country: string | null,
    onlySchool?: boolean,
    onlySchoolUser?: boolean,
  ): Promise<TableTypes<'school'>> {
    if (!this.supabase) return {} as TableTypes<'school'>;
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw 'User is not Logged in';

    const schoolId = uuidv4();
    const timestamp = new Date().toISOString();
    const oSchool = onlySchool ?? true;
    const oSchoolUser = onlySchoolUser ?? true;

    let newSchool: TableTypes<'school'> | null = null;

    if (oSchool) {
      const result = image
        ? await this.addProfileImages(schoolId, image, PROFILETYPE.SCHOOL)
        : null;

      newSchool = {
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
        status: status,
        key_contacts: null,
        country: country ?? null,
        location_link: null,
        whatsapp_bot_number: null,
      };

      const { error: schoolError } = await this.supabase
        .from(TABLES.School)
        .insert([newSchool]);

      if (schoolError) {
        logger.error('Error inserting into school:', schoolError);
        throw schoolError;
      }
      await this.computeSchoolMetricsForSchool(schoolId);
    }

    if (oSchoolUser) {
      const newSchoolUser: TableTypes<'school_user'> = {
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
        logger.error('Error inserting into school_user:', userError);
        throw userError;
      }
    }

    return newSchool ?? ({} as TableTypes<'school'>);
  }

  async computeSchoolMetricsForSchool(schoolId: string): Promise<boolean> {
    if (!this.supabase) return false;
    if (!schoolId) {
      logger.error(
        'computeSchoolMetricsForSchool called without a valid schoolId',
      );
      return false;
    }
    try {
      for (const dayWindow of SCHOOL_METRICS_DAY_WINDOWS) {
        const { error } = await this.supabase.rpc('compute_school_metrics', {
          p_days: dayWindow,
          p_school_id: schoolId,
        });

        if (error) {
          logger.error('Error computing school metrics:', {
            schoolId,
            dayWindow,
            error,
          });
          return false;
        }
      }
      return true;
    } catch (error) {
      logger.error('computeSchoolMetricsForSchool failed:', {
        schoolId,
        error,
      });
      return false;
    }
  }

  async computeProgramMetricsForProgram(programId: string): Promise<boolean> {
    if (!this.supabase) return false;
    if (!programId) {
      logger.error(
        'computeProgramMetricsForProgram called without a valid programId',
      );
      return false;
    }
    try {
      for (const dayWindow of PROGRAM_METRICS_DAY_WINDOWS) {
        const { error } = await this.supabase.rpc('compute_program_metrics', {
          p_days: dayWindow,
          p_program_id: programId,
        });

        if (error) {
          logger.error('Error computing program metrics:', {
            programId,
            dayWindow,
            error,
          });
          return false;
        }
      }
      return true;
    } catch (error) {
      logger.error('computeProgramMetricsForProgram failed:', {
        programId,
        error,
      });
      return false;
    }
  }

  async requestNewSchool(
    name: string,
    state: string,
    district: string,
    city: string,
    image: File | null,
    udise_id?: string,
  ): Promise<TableTypes<'req_new_school'> | null> {
    if (!this.supabase) return null;

    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw new Error('User is not logged in');

    // ✅ Select id, created_at, updated_at to avoid TS error
    const { data: existingRequests, error: selectError } = await this.supabase
      .from(TABLES.ReqNewSchool)
      .select('id, created_at, updated_at')
      .eq('user_id', _currentUser.id)
      .eq('is_deleted', false)
      .limit(1);

    if (selectError) {
      logger.error('Error checking for existing request:', selectError);
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

    const newRequest: TableTypes<'req_new_school'> = {
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
      logger.error('Error inserting school request:', insertError);
      throw insertError;
    }

    return newRequest;
  }
  async getExistingSchoolRequest(
    requested_by: string,
  ): Promise<TableTypes<'ops_requests'> | null> {
    if (!this.supabase) return null;

    const { data, error } = await this.supabase
      .from(TABLES.OpsRequests)
      .select('*')
      .eq('requested_by', requested_by)
      .eq('request_status', STATUS.REQUESTED)
      .eq('is_deleted', false)
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching existing school request:', error);
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
    languageDocId: string | undefined,
    tcVersion: number,
  ): Promise<TableTypes<'user'>> {
    if (!this.supabase) throw new Error('Supabase instance is not initialized');

    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw new Error('User is not logged in');

    const studentId = uuidv4();
    const now = new Date().toISOString();
    const countryCode = await this.getClientCountryCode();
    const locale = await this.getLocaleByIdOrCode(undefined, countryCode);

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
      locale_id: locale?.id ?? DEFAULT_LOCALE_ID,
      created_at: now,
      updated_at: now,
      is_deleted: false,
      is_tc_accepted: true,
      tc_agreed_version: tcVersion ?? 0,
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
      is_wa_contact: null,
    };

    const { error: userInsertError } = await this.supabase
      .from(TABLES.User)
      .insert([newStudent]);

    if (userInsertError) {
      logger.error('Error inserting student profile:', userInsertError);
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
      logger.error('Error inserting parent_user link:', parentInsertError);
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
          this.resolveMathCourseByLanguage(languageDocId),
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
        const courseId = thirdLanguageCourseMap[language.code ?? ''];
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
        if (!course) continue;
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
    studentId: string,
    tcVersion: number,
  ): Promise<TableTypes<TABLES.User>> {
    if (!this.supabase)
      return Promise.reject('Supabase client not initialized');

    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw new Error('User is not logged in');

    const userId = uuidv4();
    const timestamp = new Date().toISOString();
    const countryCode = await this.getClientCountryCode();
    let locale: TableTypes<'locale'> | null = null;
    if (countryCode) {
      locale = await this.getLocaleByIdOrCode(undefined, countryCode);
    }

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
      locale_id: locale?.id ?? DEFAULT_LOCALE_ID,
      created_at: timestamp,
      updated_at: timestamp,
      is_deleted: false,
      is_tc_accepted: true,
      tc_agreed_version: tcVersion ?? 0,
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
      is_wa_contact: null,
    };

    // Insert into user table
    const { error: userInsertError } = await this.supabase
      .from(TABLES.User)
      .insert(newStudent);

    if (userInsertError) {
      logger.error('Error inserting user:', userInsertError);
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
      logger.error('Error inserting class_user:', classUserInsertError);
      throw classUserInsertError;
    }
    return newStudent;
  }

  async deleteProfile(studentId: string) {
    if (!this.supabase) return;

    const res = await this.supabase.rpc('delete_student_profile', {
      p_student_id: studentId,
    });
    if (res.error) {
      throw res.error;
    }
  }
  async getAllCurriculums(): Promise<TableTypes<'curriculum'>[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from(TABLES.Curriculum)
      .select('*')
      .eq('is_deleted', false)
      .order('name', { ascending: true });

    if (error) {
      logger.error('Error fetching curriculums:', error);
      return [];
    }
    return data ?? [];
  }

  async getAllGrades(): Promise<TableTypes<'grade'>[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from(TABLES.Grade)
      .select('*')
      .eq('is_deleted', false)
      .order('sort_index', {
        ascending: true,
      });

    if (error) {
      logger.error('Error fetching grades:', error);
      return [];
    }

    return data ?? [];
  }

  async getAllLanguages(): Promise<TableTypes<'language'>[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from(TABLES.Language)
      .select('*')
      .eq('is_deleted', false)
      .order('code', { ascending: true });

    if (error) {
      logger.error('Error fetching languages:', error);
      return [];
    }

    return data ?? [];
  }
  async getParentStudentProfiles(): Promise<TableTypes<'user'>[]> {
    if (!this.supabase) return [];

    const currentUser =
      await ServiceConfig.getI()?.authHandler?.getCurrentUser();
    if (!currentUser) throw new Error('User is not Logged in');

    const { data, error } = await this.supabase
      .from(TABLES.ParentUser)
      .select('student:student_id(*)')
      .eq('parent_id', currentUser.id)
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error fetching parent-student profiles:', error);
      return [];
    }

    // Extract only the student profiles from the joined result
    const students = (data ?? [])
      .map((item: any) => item.student)
      .filter((student: TableTypes<'user'>) => student && !student.is_deleted);

    return students;
  }
  async updateSchoolProgram(
    schoolId: string,
    programId: string,
  ): Promise<boolean> {
    if (!this.supabase) return false; // <-- guard

    const { error } = await this.supabase // <-- await
      .from('school')
      .update({ program_id: programId })
      .eq('id', schoolId);

    if (error) {
      logger.error('Error updating school program:', error);
      return false;
    }

    return true;
  }
}
