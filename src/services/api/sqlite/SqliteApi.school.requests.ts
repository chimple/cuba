import {
  MUTATE_TYPES,
  PROFILETYPE,
  SCHOOL,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import { ServiceConfig } from '../../ServiceConfig';
import { v4 as uuidv4 } from 'uuid';
import { SqliteApiSchoolCreation } from './SqliteApi.school.creation';

export class SqliteApiSchoolRequests extends SqliteApiSchoolCreation {
  [key: string]: any;
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
}
