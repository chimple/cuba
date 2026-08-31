import { v4 as uuidv4 } from 'uuid';
import {
  CHIMPLE_DIGITAL_SKILLS,
  CHIMPLE_ENGLISH,
  CHIMPLE_HINDI,
  COURSES,
  DEFAULT_LOCALE_ID,
  GRADE1_KANNADA,
  GRADE1_MARATHI,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import { ServiceConfig } from '../../ServiceConfig';
import { SupabaseApiSchoolRequests } from './SupabaseApi.school.requests';

export interface SupabaseApiSchoolProfiles {
  [key: string]: any;
}
export class SupabaseApiSchoolProfiles extends SupabaseApiSchoolRequests {
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
}
