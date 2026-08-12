import {
  EnumType,
  MUTATE_TYPES,
  PROFILETYPE,
  SCHOOL,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import { ServiceConfig } from '../../ServiceConfig';
import { v4 as uuidv4 } from 'uuid';
import { SqliteApiSchoolCourses } from './SqliteApi.school.courses';

export class SqliteApiSchoolCreation extends SqliteApiSchoolCourses {
  [key: string]: any;
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

  async computeSchoolMetricsForSchool(schoolId: string): Promise<boolean> {
    return this._serverApi.computeSchoolMetricsForSchool(schoolId);
  }
}
