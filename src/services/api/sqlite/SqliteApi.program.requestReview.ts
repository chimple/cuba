import { RequestTypes, STATUS, TableTypes } from '../../../common/constants';
import { SqliteApiProgramRequests } from './SqliteApi.program.requests';

export class SqliteApiProgramRequestReview extends SqliteApiProgramRequests {
  [key: string]: any;
  async searchTeachersInSchool(
    schoolId: string,
    searchTerm: string,
    page: number = 1,
    limit: number = 20,
    classIds?: string[],
  ): Promise<{ data: any[]; total: number }> {
    await this.ensureInitialized();
    if (!this._db) return { data: [], total: 0 };
    // Empty program class scopes should return an empty search result.
    if (classIds && classIds.length === 0) return { data: [], total: 0 };
    let whereClause = `cu.role = 'teacher' AND cu.is_deleted = 0 AND c.school_id = ?`;
    let params: any[] = [schoolId];
    // Applies program class scope before searching teacher memberships.
    if (classIds && classIds.length > 0) {
      const classScopePlaceholders = classIds.map(() => '?').join(', ');
      whereClause += ` AND cu.class_id IN (${classScopePlaceholders})`;
      params.push(...classIds);
    }
    if (searchTerm && searchTerm.trim() !== '') {
      whereClause += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
      const likeTerm = `%${searchTerm}%`;
      params.push(likeTerm, likeTerm, likeTerm);
    }
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM class_user cu
      JOIN user u ON cu.user_id = u.id
      JOIN class c ON cu.class_id = c.id
      WHERE ${whereClause}
    `;
    const countResult = await this._db.query(countQuery, params);
    const total = countResult?.values?.[0]?.total ?? 0;
    // Paginated query
    const offset = (page - 1) * limit;
    const query = `
      SELECT u.id, u.name, u.email, u.phone, cu.class_id, c.name as class_name
      FROM class_user cu
      JOIN user u ON cu.user_id = u.id
      JOIN class c ON cu.class_id = c.id
      WHERE ${whereClause}
      ORDER BY u.name
      LIMIT ? OFFSET ?
    `;
    const result = await this._db.query(query, [...params, limit, offset]);
    return { data: result?.values ?? [], total };
  }

  async respondToSchoolRequest(
    requestId: string,
    respondedBy: string,
    status: (typeof STATUS)[keyof typeof STATUS],
    rejectedReasonType?: string,
    rejectedReasonDescription?: string,
  ): Promise<TableTypes<'ops_requests'> | undefined> {
    return await this._serverApi.respondToSchoolRequest(
      requestId,
      respondedBy,
      status,
      rejectedReasonType,
      rejectedReasonDescription,
    );
  }

  async approveOpsRequest(
    requestId: string,
    respondedBy: string,
    role: (typeof RequestTypes)[keyof typeof RequestTypes],
    schoolId?: string,
    classId?: string,
  ): Promise<TableTypes<'ops_requests'> | undefined> {
    return await this._serverApi.approveOpsRequest(
      requestId,
      respondedBy,
      role,
      schoolId,
      classId,
    );
  }
}
