import { TABLES, TableTypes } from '../../../common/constants';
import {
  readAssignmentCartFromStorage,
  writeAssignmentCartToStorage,
} from '../../../teachers-module/pages/AssignmentCartStorage';
import { SqliteApiAssignmentCourseLookups } from './SqliteApi.assignment.courseLookups';

export class SqliteApiAssignmentSchoolLookups extends SqliteApiAssignmentCourseLookups {
  [key: string]: any;
  async getGradeById(id: string): Promise<TableTypes<'grade'> | undefined> {
    await this.ensureInitialized();
    const res = await this._db?.query(
      `select * from ${TABLES.Grade} where id = "${id}"`,
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }

  async getGradeByName(name: string): Promise<TableTypes<'grade'> | undefined> {
    const res = await this._db?.query(
      `SELECT * FROM ${TABLES.Grade} WHERE name = ? AND is_deleted = 0 LIMIT 1`,
      [name],
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }

  async getGradesByIds(gradeIds: string[]): Promise<TableTypes<'grade'>[]> {
    await this.ensureInitialized();
    if (!gradeIds || gradeIds.length === 0) {
      return [];
    }
    // Format the IDs for the SQL query
    const formattedIds = gradeIds.map((id: any) => `"${id}"`).join(', ');
    // Construct and execute the query
    const res = await this._db?.query(
      `SELECT * FROM ${TABLES.Grade} WHERE id IN (${formattedIds})`,
    );

    if (!res || !res.values || res.values.length === 0) {
      return []; // Return an empty array if no grades are found
    }
    // Return the retrieved grades
    return res.values;
  }

  async getCurriculumById(
    id: string,
  ): Promise<TableTypes<'curriculum'> | undefined> {
    await this.ensureInitialized();
    const res = await this._db?.query(
      `select * from ${TABLES.Curriculum} where id = "${id}"`,
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }

  async getCurriculumsByIds(
    ids: string[],
  ): Promise<TableTypes<'curriculum'>[]> {
    await this.ensureInitialized();
    if (!ids || ids.length === 0) {
      return [];
    }

    // Format the IDs for the SQL query
    const formattedIds = ids.map((id: any) => `"${id}"`).join(', ');

    // Construct and execute the query
    const res = await this._db?.query(
      `SELECT * FROM ${TABLES.Curriculum} WHERE id IN (${formattedIds})`,
    );

    if (!res || !res.values || res.values.length < 1) {
      return [];
    }

    // Assuming you need to return the first item or an empty array
    return res.values;
  }

  async getSchoolDetailsByUdise(udiseCode: string): Promise<{
    schoolId?: string;
    studentLoginType: string;
    schoolModel: string;
    whatsappBotNumber?: string;
  } | null> {
    // Step 1: Get school info by UDISE code
    const schoolRes = await this.executeQuery(
      `SELECT id, student_login_type, model, whatsapp_bot_number FROM school WHERE udise = ? AND is_deleted = 0`,
      [udiseCode],
    );

    if (!schoolRes?.values?.length) {
      return null;
    }

    const { id, student_login_type, model, whatsapp_bot_number } =
      schoolRes.values[0];

    return {
      schoolId: id || '',
      studentLoginType: student_login_type || '',
      schoolModel: model || '',
      whatsappBotNumber: whatsapp_bot_number || '',
    };
  }

  async getSchoolDataByUdise(
    udiseCode: string,
  ): Promise<TableTypes<'school_data'> | null> {
    const schoolRes = await this.executeQuery(
      `SELECT * FROM school_data WHERE udise = ?`,
      [udiseCode],
    );
    if (!schoolRes?.values?.length) {
      return null;
    }
    return schoolRes.values[0];
  }

  async getUserByDocId(
    studentId: string,
  ): Promise<TableTypes<'user'> | undefined> {
    await this.ensureInitialized();
    const res = await this._db?.query(
      `select * from ${TABLES.User} where id = "${studentId}"`,
    );
    if (!res || !res.values || res.values.length < 1) return;
    return res.values[0];
  }

  async createOrUpdateAssignmentCart(
    userId: string,
    lessons: string,
  ): Promise<boolean | undefined> {
    const now = new Date().toISOString();
    const existing = readAssignmentCartFromStorage(userId);
    writeAssignmentCartToStorage(userId, {
      lessons,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    });
    return true;
  }
}
