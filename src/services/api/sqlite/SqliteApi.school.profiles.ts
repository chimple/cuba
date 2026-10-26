import {
  DEFAULT_LOCALE_ID,
  LATEST_LEARNING_PATH,
  MUTATE_TYPES,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import logger from '../../../utility/logger';
import { ServiceConfig } from '../../ServiceConfig';
import { v4 as uuidv4 } from 'uuid';
import { SqliteApiSchoolRequests } from './SqliteApi.school.requests';

export class SqliteApiSchoolProfiles extends SqliteApiSchoolRequests {
  [key: string]: any;
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
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw 'User is not Logged in';
    const countryCode = await this.getClientCountryCode();
    const locale = await this.getLocaleByIdOrCode(undefined, countryCode);

    const studentId = uuidv4();
    const now = new Date().toISOString();
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

    await this.executeQuery(
      `
      INSERT INTO user (
        id, name, age, gender, avatar, image,
        curriculum_id, grade_id, language_id,
        created_at, updated_at, locale_id
      )
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
        newStudent.locale_id,
      ],
    );

    const parentUserId = uuidv4();
    await this.executeQuery(
      `
      INSERT INTO parent_user (id, parent_id, student_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?);
    `,
      [parentUserId, _currentUser.id, studentId, now, now],
    );

    this.updatePushChanges(TABLES.User, MUTATE_TYPES.INSERT, newStudent);

    this.updatePushChanges(TABLES.ParentUser, MUTATE_TYPES.INSERT, {
      id: parentUserId,
      parent_id: _currentUser.id,
      student_id: studentId,
      created_at: now,
      updated_at: now,
      is_deleted: false,
    });

    await this.assignCoursesToStudent(
      studentId,
      gradeDocId,
      boardDocId,
      languageDocId,
    );
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
    role: 'student',
    studentId: string,
    tcVersion: number,
  ): Promise<TableTypes<'user'>> {
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw 'User is not Logged in';
    const countryCode = await this.getClientCountryCode();
    let locale: TableTypes<'locale'> | null = await this.getLocaleByIdOrCode(
      undefined,
      countryCode,
    );

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
      locale_id: locale?.id ?? DEFAULT_LOCALE_ID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
      stars: null,
      reward: null,
      is_wa_contact: null,
    };
    // Insert into user table
    await this.executeQuery(
      `
      INSERT INTO user (id, name, age, gender, avatar, image, curriculum_id, grade_id, language_id, created_at, updated_at, student_id, locale_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
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
        newStudent.locale_id,
      ],
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
      ],
    );
    this.updatePushChanges(TABLES.ClassUser, MUTATE_TYPES.INSERT, newClassUser);
    return newStudent;
  }

  async deleteProfile(studentId: string) {
    await this.ensureInitialized();
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
        [studentId],
      );

      const classIds: string[] =
        classResults?.values?.map((row: any) => row.class_id) ?? [];

      for (const classId of classIds) {
        // Soft delete student from class_user
        await this.executeQuery(
          `UPDATE class_user SET is_deleted = 1, updated_at = ? WHERE user_id = ? AND class_id = ? AND is_deleted = 0`,
          [timestamp, studentId, classId],
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
          [classId, localParentId, studentId],
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
            [timestamp, classId, localParentId],
          );
        }
      }

      // Soft delete the parent-student connection
      await this.executeQuery(
        `UPDATE parent_user SET is_deleted = 1, updated_at = ? WHERE student_id = ? AND parent_id = ? AND is_deleted = 0`,
        [timestamp, studentId, localParentId],
      );

      // Clear only this student's cached latest pathway snapshot.
      localStorage.removeItem(`${LATEST_LEARNING_PATH}:${studentId}`);
    } catch (error) {
      logger.error('🚀 ~ SqliteApi ~ deleteProfile ~ error:', error);
    }
  }
}
