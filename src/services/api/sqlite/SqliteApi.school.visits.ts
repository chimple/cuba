import {
  MUTATE_TYPES,
  PROFILETYPE,
  SCHOOL,
  SchoolVisitAction,
  SchoolVisitType,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import logger from '../../../utility/logger';
import { ServiceConfig } from '../../ServiceConfig';
import { SqliteApiResultsProgress } from './SqliteApi.results.progress';

export class SqliteApiSchoolVisits extends SqliteApiResultsProgress {
  [key: string]: any;
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
      return await this._serverApi.recordSchoolVisit(
        schoolId,
        lat,
        lng,
        action,
        visitType,
        distanceFromSchool,
        numberOfParents,
      );
    } catch (error) {
      logger.error('❌ Error recording school visit:', error);
      return null;
    }
  }

  async getLastSchoolVisit(
    schoolId: string,
  ): Promise<TableTypes<'fc_school_visit'> | null> {
    if (this._serverApi) {
      return this._serverApi.getLastSchoolVisit(schoolId);
    }
    return Promise.resolve(null);
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
}
