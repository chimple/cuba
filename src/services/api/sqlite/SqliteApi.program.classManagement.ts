import { RoleType } from '../../../interface/modelInterfaces';
import {
  UserSchoolClassParams,
  UserSchoolClassResult,
} from '../../../ops-console/pages/NewUserPageOps';
import logger from '../../../utility/logger';
import { SqliteApiProgramDiscovery } from './SqliteApi.program.discovery';
import { MUTATE_TYPES, TABLES } from '../../../common/constants';
import { v4 as uuidv4 } from 'uuid';

export class SqliteApiProgramClassManagement extends SqliteApiProgramDiscovery {
  [key: string]: any;
  public async getOrcreateschooluser(
    params: UserSchoolClassParams,
  ): Promise<UserSchoolClassResult> {
    return this._serverApi.getOrcreateschooluser(params);
  }

  public async createAtSchoolUser(
    id: string,
    schoolName: string,
    udise: string,
    role: RoleType,
    isEmailVerified: boolean,
  ): Promise<void> {
    logger.error('Method not implemented.');
  }

  async insertSchoolDetails(
    schoolId: string,
    schoolModel: string,
    locationLink?: string,
    keyContacts?: any,
  ): Promise<void> {
    try {
      let fields = 'model = ?';
      const values: any[] = [schoolModel];

      if (locationLink !== undefined && locationLink !== null) {
        fields += ', location_link = ?';
        values.push(locationLink);
      }

      if (keyContacts) {
        fields += ', key_contacts = ?';
        values.push(JSON.stringify(keyContacts));
      }

      const timestamp = new Date().toISOString();
      fields += ', updated_at = ?';
      values.push(timestamp);

      values.push(schoolId);

      const query = `
        UPDATE school
        SET ${fields}
        WHERE id = ? AND is_deleted = 0;
      `;
      await this.executeQuery(query, values);

      const pushObject = {
        id: schoolId,
        model: schoolModel,
        location_link: locationLink ?? null,
        key_contacts: JSON.stringify(keyContacts) ?? null,
        updated_at: timestamp,
      };

      await this.updatePushChanges(
        TABLES.School,
        MUTATE_TYPES.UPDATE,
        pushObject,
      );
    } catch (error) {
      logger.error('❌ Error inserting school details:', error);
    }
  }

  async updateClassCourses(
    classId: string,
    selectedCourseIds: string[],
  ): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const deleteQuery = `
        UPDATE class_course
        SET is_deleted = 1, updated_at = ?
        WHERE class_id = ? AND is_deleted = 0;
      `;
      await this.executeQuery(deleteQuery, [timestamp, classId]);
      for (const courseId of selectedCourseIds) {
        const id = uuidv4();

        const insertQuery = `
          INSERT INTO class_course (
            id,
            class_id,
            course_id,
            created_at,
            updated_at,
            is_deleted
          )
          VALUES (?, ?, ?, ?, ?, 0);
        `;

        await this.executeQuery(insertQuery, [
          id,
          classId,
          courseId,
          timestamp,
          timestamp,
        ]);
        this.updatePushChanges(TABLES.ClassCourse, MUTATE_TYPES.INSERT, {
          id,
          class_id: classId,
          course_id: courseId,
          created_at: timestamp,
          updated_at: timestamp,
          is_deleted: 0,
        });
      }
    } catch (error) {
      logger.error('❌ Error replacing class courses:', error);
    }
  }

  public async addStudentWithParentValidation(params: {
    phone?: string;
    name: string;
    gender: string;
    age: string;
    classId: string;
    schoolId?: string;
    parentName?: string;
    email?: string;
    studentID?: string;
    atSchool?: boolean;
  }): Promise<{ success: boolean; message: string; data?: any }> {
    return this._serverApi.addStudentWithParentValidation(params);
  }
}
