import {
  AVATARS,
  CHIMPLE_DIGITAL_SKILLS,
  CHIMPLE_ENGLISH,
  CHIMPLE_HINDI,
  COURSES,
  GRADE1_KANNADA,
  GRADE1_MARATHI,
  MUTATE_TYPES,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import { ServiceConfig } from '../../ServiceConfig';
import { v4 as uuidv4 } from 'uuid';
import { SqliteApiProgramFoundation } from './SqliteApi.program.foundation';

export class SqliteApiProgramUserRoles extends SqliteApiProgramFoundation {
  [key: string]: any;
  async createAutoProfile(
    languageDocId: string | undefined,
    tcVersion: number,
  ): Promise<TableTypes<'user'>> {
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw 'User is not Logged in';
    const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
    const studentProfile = await this.getParentStudentProfiles();
    if (studentProfile.length > 0) return studentProfile[0];
    const studentId = uuidv4();
    const newStudent: TableTypes<'user'> = {
      id: studentId,
      name: null,
      age: null,
      gender: null,
      avatar: randomAvatar,
      image: null,
      curriculum_id: null,
      grade_id: null,
      language_id: languageDocId ?? null,
      locale_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
      is_tc_accepted: true,
      tc_agreed_version: tcVersion ?? 0,
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
      is_wa_contact: null,
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
      ],
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
      ],
    );

    // Find English, Maths, and language-dependent subject
    const englishCourse = await this.getCourse(CHIMPLE_ENGLISH);
    const mathsCourse = await this.resolveMathCourseByLanguage(languageDocId);
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
      if (!course) continue;
      const newUserCourse: TableTypes<'user_course'> = {
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
        [newUserCourse.id, newUserCourse.user_id, newUserCourse.course_id],
      );
      this.updatePushChanges(
        TABLES.UserCourse,
        MUTATE_TYPES.INSERT,
        newUserCourse,
      );
    }

    return newStudent;
  }

  async isProgramUser(): Promise<boolean> {
    return await this._serverApi.isProgramUser();
  }

  async isSplUser(): Promise<boolean> {
    return await this._serverApi.isSplUser();
  }

  async getManagersAndCoordinators(
    page: number = 1,
    search: string = '',
    limit: number = 10,
    sortBy: keyof TableTypes<'user'> = 'name',
    sortOrder: 'asc' | 'desc' = 'asc',
  ): Promise<{
    data: { user: TableTypes<'user'>; role: string }[];
    totalCount: number;
  }> {
    return await this._serverApi.getManagersAndCoordinators(
      page,
      search,
      limit,
      sortBy,
      sortOrder,
    );
  }
}
