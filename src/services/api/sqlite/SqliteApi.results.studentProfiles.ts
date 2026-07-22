import {
  DEFAULT_LOCALE_ID,
  LATEST_LEARNING_PATH,
  MUTATE_TYPES,
  REWARD_LEARNING_PATH,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import logger from '../../../utility/logger';
import { v4 as uuidv4 } from 'uuid';
import { SqliteApiResultsResultUpdates } from './SqliteApi.results.resultUpdates';

export class SqliteApiResultsStudentProfiles extends SqliteApiResultsResultUpdates {
  [key: string]: any;
  async updateStudent(
    student: TableTypes<'user'>,
    name: string,
    age: number,
    gender: string,
    avatar: string,
    image: string | undefined,
    boardDocId: string,
    gradeDocId: string,
    languageDocId: string,
  ): Promise<TableTypes<'user'>> {
    const languageChanged = student.language_id !== languageDocId;
    let localeId = student.locale_id;
    if (languageChanged) {
      const countryCode = await this.getClientCountryCode();
      const locale = await this.getLocaleByIdOrCode(undefined, countryCode);
      localeId = locale?.id ?? DEFAULT_LOCALE_ID;
    }
    const now = new Date().toISOString();

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
      locale_id = ?,
      updated_at = ?
      ${languageChanged ? ', learning_path = ?' : ''}
    WHERE id = ?;
  `;
    const params = [
      name,
      age,
      gender,
      avatar,
      image ?? null,
      boardDocId ?? null,
      gradeDocId ?? null,
      languageDocId,
      localeId,
      now,
    ];
    if (languageChanged) {
      params.push(null);
    }
    params.push(student.id);
    await this.executeQuery(updateUserQuery, params);

    const updatedStudent: TableTypes<'user'> = {
      ...student,
      name,
      age,
      gender,
      avatar,
      image: image ?? null,
      curriculum_id: boardDocId ?? null,
      grade_id: gradeDocId ?? null,
      language_id: languageDocId,
      locale_id: localeId,
      updated_at: now,
      ...(languageChanged && { learning_path: null }),
    };

    await this.assignCoursesToStudent(
      student.id,
      gradeDocId,
      boardDocId,
      languageDocId,
    );

    this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, {
      id: student.id,
      name,
      age,
      gender,
      avatar,
      image: image ?? null,
      curriculum_id: boardDocId,
      grade_id: gradeDocId,
      language_id: languageDocId,
      locale_id: localeId,
      updated_at: now,
      ...(languageChanged && { learning_path: null }),
    });
    if (languageChanged) {
      localStorage.removeItem(`${LATEST_LEARNING_PATH}:${student.id}`);
      sessionStorage.removeItem(REWARD_LEARNING_PATH);
    }
    return updatedStudent;
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
    const languageChanged = student.language_id !== languageDocId;
    let localeId = student.locale_id;

    if (languageChanged) {
      const countryCode = await this.getClientCountryCode();
      const locale = await this.getLocaleByIdOrCode(undefined, countryCode);
      localeId = locale?.id ?? DEFAULT_LOCALE_ID;
    }

    const now = new Date().toISOString();

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
        locale_id = ?,
        student_id = ?,
        updated_at = ?
        ${languageChanged ? ', learning_path = ?' : ''}
      WHERE id = ?;
    `;

    try {
      const params = [
        name,
        age,
        gender,
        avatar,
        image ?? null,
        boardDocId,
        gradeDocId,
        languageDocId,
        localeId,
        student_id,
        now,
      ];

      if (languageChanged) {
        params.push(JSON.stringify([])); // keep your existing logic
      }

      params.push(student.id);

      await this.executeQuery(updateUserQuery, params);

      const updatedStudent: TableTypes<'user'> = {
        ...student,
        name,
        age,
        gender,
        avatar,
        image: image ?? null,
        curriculum_id: boardDocId,
        grade_id: gradeDocId,
        language_id: languageDocId,
        student_id,
        locale_id: localeId,
        updated_at: now,
      };

      if (languageChanged) {
        updatedStudent.learning_path = JSON.stringify([]);
      }

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
        locale_id: localeId,
        updated_at: now,
        ...(languageChanged && { learning_path: JSON.stringify([]) }),
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
        const currentClassUserId = `
          SELECT id FROM class_user
          WHERE user_id = ? AND class_id = ? AND is_deleted = 0
        `;

        const data = await this.executeQuery(currentClassUserId, [
          student.id,
          currentClassId,
        ]);

        const deleteOldClassUserQuery = `
          UPDATE class_user
          SET is_deleted = 1, updated_at = ?
          WHERE id = ? AND is_deleted = 0;
        `;

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
        const newClassUser: TableTypes<'class_user'> = {
          id: newClassUserId,
          class_id: newClassId,
          user_id: student.id,
          role: 'student',
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
          ],
        );
        this.updatePushChanges(
          TABLES.ClassUser,
          MUTATE_TYPES.INSERT,
          newClassUser,
        );
        await this._serverApi.addParentToNewClass(newClassId, student.id);
      }

      return updatedStudent;
    } catch (error) {
      logger.error('Error updating student:', error);
      throw error; // Rethrow error after logging
    }
  }

  async updateUserProfile(
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

    const updatedUser: TableTypes<'user'> = {
      ...user,
      name: fullName,
      email: email,
      phone: phoneNum,
      language_id: languageDocId,
      image: profilePic ?? null,
    };

    // Push changes for synchronization
    this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, {
      name: fullName,
      email: email,
      phone: phoneNum,
      language_id: languageDocId,
      image: profilePic ?? null,
      id: user.id,
    });
    return updatedUser;
  }
}
