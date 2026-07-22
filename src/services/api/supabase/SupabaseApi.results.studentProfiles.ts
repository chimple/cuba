import { v4 as uuidv4 } from 'uuid';
import {
  CHIMPLE_DIGITAL_SKILLS,
  CHIMPLE_ENGLISH,
  CHIMPLE_HINDI,
  COURSES,
  DEFAULT_LOCALE_ID,
  GRADE1_KANNADA,
  GRADE1_MARATHI,
  LATEST_LEARNING_PATH,
  REWARD_LEARNING_PATH,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import { SupabaseApiResultsResultUpdates } from './SupabaseApi.results.resultUpdates';

type StudentProgressRowWithLesson = TableTypes<'result'> & {
  lesson?: {
    name?: string;
    chapter_lesson?:
      | {
          chapter?: {
            id?: string;
            name?: string;
            course_id?: string;
          } | null;
        }[]
      | null;
  } | null;
};
export interface SupabaseApiResultsStudentProfiles {
  [key: string]: any;
}
export class SupabaseApiResultsStudentProfiles extends SupabaseApiResultsResultUpdates {
  async updateStudent(
    student: TableTypes<'user'>,
    name: string,
    age: number,
    gender: string,
    avatar: string,
    image: string | undefined,
    boardDocId: string | undefined,
    gradeDocId: string | undefined,
    languageDocId: string,
    localeId?: string,
  ): Promise<TableTypes<'user'>> {
    if (!this.supabase) return student;
    const languageChanged = student.language_id !== languageDocId;

    const updatedFields: any = {
      name,
      age,
      gender,
      avatar,
      image: image ?? null,
      curriculum_id: boardDocId,
      grade_id: gradeDocId,
      language_id: languageDocId,
    };

    if (languageChanged) {
      const countryCode = await this.getClientCountryCode();
      const locale = await this.getLocaleByIdOrCode(undefined, countryCode);
      updatedFields.locale_id = locale?.id ?? DEFAULT_LOCALE_ID;
      updatedFields.learning_path = null;
    }

    await this.supabase.from('user').update(updatedFields).eq('id', student.id);
    const updatedStudent = { ...student, ...updatedFields };
    if (languageChanged) {
      localStorage.removeItem(`${LATEST_LEARNING_PATH}:${student.id}`);
      sessionStorage.removeItem(REWARD_LEARNING_PATH);
    }

    const courses =
      gradeDocId && boardDocId
        ? await this.getCourseByUserGradeId(gradeDocId, boardDocId)
        : languageChanged
          ? await this.getDefaultCoursesForLanguage(languageDocId)
          : [];

    if (courses && courses.length > 0) {
      // Batch fetch existing user_course entries for this student and these courses
      const courseIds = courses.map((c) => c.id);
      const { data: existingUserCourses, error } = await this.supabase
        .from('user_course')
        .select('course_id')
        .eq('user_id', student.id)
        .in('course_id', courseIds)
        .eq('is_deleted', false);

      const existingCourseIds = new Set(
        (existingUserCourses ?? []).map((uc) => uc.course_id),
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
        await this.supabase.from('user_course').insert(inserts);
      }
    }

    return updatedStudent;
  }

  private async getDefaultCoursesForLanguage(
    languageDocId?: string | null,
  ): Promise<TableTypes<'course'>[]> {
    const [englishCourse, mathsCourse, digitalSkillsCourse] = await Promise.all(
      [
        this.getCourse(CHIMPLE_ENGLISH),
        this.resolveMathCourseByLanguage(languageDocId),
        this.getCourse(CHIMPLE_DIGITAL_SKILLS),
      ],
    );

    const language = languageDocId
      ? await this.getLanguageWithId(languageDocId)
      : undefined;
    let langCourse: TableTypes<'course'> | undefined;

    if (language && language.code !== COURSES.ENGLISH) {
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

    return [englishCourse, mathsCourse, langCourse, digitalSkillsCourse].filter(
      Boolean,
    ) as TableTypes<'course'>[];
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
    newClassId: string,
  ): Promise<TableTypes<'user'>> {
    if (!this.supabase) return student;
    const now = new Date().toISOString();
    const updatedFields: any = {
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

    if (student.language_id !== languageDocId) {
      const countryCode = await this.getClientCountryCode();
      const locale = await this.getLocaleByIdOrCode(undefined, countryCode);
      updatedFields.locale_id = locale?.id ?? DEFAULT_LOCALE_ID;
    }

    try {
      // Update user table
      await this.supabase
        .from(TABLES.User)
        .update(updatedFields)
        .eq('id', student.id);
      const updatedStudent = { ...student, ...updatedFields };

      // Get current class_user record (non-deleted)
      const { data: currentClassUser } = await this.supabase
        .from(TABLES.ClassUser)
        .select('id, class_id')
        .eq('user_id', student.id)
        .eq('is_deleted', false)
        .maybeSingle();
      if (currentClassUser?.class_id !== newClassId) {
        // Mark old class_user as deleted
        if (currentClassUser) {
          await this.supabase
            .from(TABLES.ClassUser)
            .update({ is_deleted: true, updated_at: now })
            .eq('id', currentClassUser.id);
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

      return updatedStudent;
    } catch (error) {
      logger.error('Error updating student in school mode:', error);
      throw error;
    }
  }
  public async updateUserProfile(
    user: TableTypes<'user'>,
    fullName: string,
    email: string,
    phoneNum: string,
    languageDocId: string,
    profilePic: string | undefined,
    options?: {
      age?: string;
      gender?: string;
    },
  ): Promise<TableTypes<'user'>> {
    if (!this.supabase) return user;

    const updatedFields: Record<string, any> = {
      name: fullName,
      email,
      phone: phoneNum,
      language_id: languageDocId,
      image: profilePic ?? null,
    };

    if (user.language_id !== languageDocId) {
      const countryCode = await this.getClientCountryCode();
      const locale = await this.getLocaleByIdOrCode(undefined, countryCode);
      updatedFields.locale_id = locale?.id ?? DEFAULT_LOCALE_ID;
    }

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
      .from('user')
      .update(updatedFields)
      .eq('id', user.id);

    if (error) {
      logger.error('Error updating user profile:', error);
      throw error;
    }

    return { ...user, ...updatedFields };
  }
}
