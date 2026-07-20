import { v4 as uuidv4 } from 'uuid';
import {
  DEFAULT_LOCALE_ID,
  EnumType,
  LATEST_LEARNING_PATH,
  MUTATE_TYPES,
  PROFILETYPE,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import { ServiceConfig } from '../../ServiceConfig';

import { SqliteApiCore } from './SqliteApi.core';
export interface SqliteApiUser {
  [key: string]: any;
}
export class SqliteApiUser extends SqliteApiCore {
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

  async addProfileImages(
    id: string,
    file: File,
    profileType: PROFILETYPE,
  ): Promise<string | null> {
    return await this._serverApi.addProfileImages(id, file, profileType);
  }

  async uploadData(payload: any): Promise<boolean | null> {
    return await this._serverApi.uploadData(payload);
  }

  async migrateSchoolData(payload: { school_ids: string[] }): Promise<boolean> {
    return await this._serverApi.migrateSchoolData(payload);
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
    const oSchool = onlySchool ?? true;
    const oSchoolUser = onlySchoolUser ?? true;
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw 'User is not Logged in';

    const schoolId = uuidv4();
    const result = image
      ? await this.addProfileImages(schoolId, image, PROFILETYPE.SCHOOL)
      : null;
    const newSchool: TableTypes<'school'> = {
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
      status: status,
      key_contacts: null,
      country: country,
      location_link: null,
      whatsapp_bot_number: null,
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
        ],
      );

      await this.updatePushChanges(
        TABLES.School,
        MUTATE_TYPES.INSERT,
        newSchool,
      );
    }

    // Insert into school_user table
    const schoolUserId = uuidv4();
    const newSchoolUser: TableTypes<'school_user'> = {
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
        ],
      );

      await this.updatePushChanges(
        TABLES.SchoolUser,
        MUTATE_TYPES.INSERT,
        newSchoolUser,
      );
    }
    return newSchool;
  }
  async updateSchoolProfile(
    school: TableTypes<'school'>,
    name: string,
    group1: string,
    group2: string,
    group3: string,
    image: File | null,
    group4: string | null,
    program_id: string | null,
    udise: string | null,
    address: string | null,
  ): Promise<TableTypes<'school'>> {
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw 'User is not Logged in';

    const result = image
      ? await this.addProfileImages(school.id, image, PROFILETYPE.SCHOOL)
      : school.image;

    const updatedSchool: TableTypes<'school'> = {
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
      whatsapp_bot_number: null,
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

  async updateSchoolLocation(
    schoolId: string,
    lat: number,
    lng: number,
  ): Promise<void> {
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw 'User is not Logged in';

    const locationString = `https://www.google.com/maps?q=${lat},${lng}`;
    const query = `UPDATE school SET location_link = ?, updated_at = ? WHERE id = ?`;
    const updatedAt = new Date().toISOString();

    await this.executeQuery(query, [locationString, updatedAt, schoolId]);

    const school = await this.getSchoolById(schoolId);
    if (school) {
      this.updatePushChanges(TABLES.School, MUTATE_TYPES.UPDATE, school);
    }
  }

  // add request for creating new school
  async requestNewSchool(
    name: string,
    state: string,
    district: string,
    city: string,
    image: File | null,
    udise_id?: string,
  ): Promise<TableTypes<'req_new_school'> | null> {
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    if (!_currentUser) throw 'User is not Logged in';

    // Check if request already exists for the user
    const res = await this.executeQuery(
      `SELECT * FROM req_new_school WHERE user_id = ?`,
      [_currentUser.id],
    );
    const existingRequests = res?.values ?? [];

    if (existingRequests.length > 0) {
      return existingRequests[0];
    }

    const requestId = uuidv4();
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
      ],
    );

    await this.updatePushChanges(
      TABLES.ReqNewSchool,
      MUTATE_TYPES.INSERT,
      newRequest,
    );

    return newRequest;
  }
  // Add this new function to check if a create school request already exists
  async getExistingSchoolRequest(
    requested_by: string,
  ): Promise<TableTypes<'ops_requests'> | null> {
    await this.ensureInitialized();
    const query = `
      SELECT *
      FROM ${TABLES.OpsRequests}
      WHERE requested_by = ? AND is_deleted = 0`;
    const res = await this._db?.query(query, [requested_by]);
    return res?.values?.length ? res.values[0] : null;
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

  async updateSchoolCourseSelection(
    schoolId: string,
    selectedCourseIds: string[],
  ): Promise<void> {
    await this.ensureInitialized();
    const currentDate = new Date().toISOString();

    for (let idx = 0; idx < selectedCourseIds.length; idx++) {
      const courseId = selectedCourseIds[idx];
      const isLast = idx === selectedCourseIds.length - 1; // ✅ last index check

      // Check if the course is already assigned to the school
      const isExist = await this._db?.query(
        `SELECT * FROM school_course WHERE school_id = ? AND course_id = ?;`,
        [schoolId, courseId],
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
          is_deleted: false,
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
          ],
        );

        // If not last index → isLast = false, otherwise true
        this.updatePushChanges(
          TABLES.SchoolCourse,
          MUTATE_TYPES.INSERT,
          newSchoolCourseEntry,
        );
      } else {
        // Case 2: Course is already assigned
        const existingEntry = isExist.values[0];

        if (existingEntry.is_deleted) {
          // Case 2a: Course was marked as deleted, reactivate it
          await this.executeQuery(
            `UPDATE school_course SET is_deleted = 0, updated_at = ? WHERE id = ?;`,
            [currentDate, existingEntry.id],
          );

          this.updatePushChanges(TABLES.SchoolCourse, MUTATE_TYPES.UPDATE, {
            id: existingEntry.id,
            is_deleted: false,
            updated_at: currentDate,
          });
        } else {
          // Case 2b: Course is already active, update the updated_at field
          await this.executeQuery(
            `UPDATE school_course SET updated_at = ? WHERE id = ?;`,
            [currentDate, existingEntry.id],
          );

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
    selectedCourseIds: string[],
  ): Promise<void> {
    await this.ensureInitialized();
    const currentDate = new Date().toISOString();
    for (let idx = 0; idx < selectedCourseIds.length; idx++) {
      const courseId = selectedCourseIds[idx];
      const isLast = idx === selectedCourseIds.length - 1; // ✅ last item check

      // Check if the course is already assigned to the class
      const isExist = await this._db?.query(
        `SELECT * FROM class_course WHERE class_id = ? AND course_id = ?;`,
        [classId, courseId],
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
          is_deleted: false,
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
            newClassCourseEntry.is_deleted,
          ],
        );

        // Insert notification — pass isLast
        this.updatePushChanges(
          TABLES.ClassCourse,
          MUTATE_TYPES.INSERT,
          newClassCourseEntry,
        );
      } else {
        // Case 2: Course is already assigned
        const existingEntry = isExist.values[0];

        if (existingEntry.is_deleted) {
          // Case 2a: Reactivate deleted course
          await this.executeQuery(
            `UPDATE class_course SET is_deleted = 0, updated_at = ? WHERE id = ?;`,
            [currentDate, existingEntry.id],
          );

          this.updatePushChanges(TABLES.ClassCourse, MUTATE_TYPES.UPDATE, {
            id: existingEntry.id,
            is_deleted: false,
            updated_at: currentDate,
          });
        } else {
          // Case 2b: Course already active, just update timestamp
          await this.executeQuery(
            `UPDATE class_course SET updated_at = ? WHERE id = ?;`,
            [currentDate, existingEntry.id],
          );

          this.updatePushChanges(TABLES.ClassCourse, MUTATE_TYPES.UPDATE, {
            id: existingEntry.id,
            updated_at: currentDate,
          });
        }
      }
    }
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
        classResults?.values?.map((row) => row.class_id) ?? [];

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

  mergeUserPathway(
    existingStudentId: string,
    newStudentId: string,
  ): Promise<{ success: boolean; message: string }> {
    return this._serverApi.mergeUserPathway(existingStudentId, newStudentId);
  }
}
