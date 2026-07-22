import { EnumType, TableTypes } from '../../../common/constants';
import { Json } from '../../database';
import { SqliteApiProgramActivityStats } from './SqliteApi.program.activityStats';

export class SqliteApiProgramRequests extends SqliteApiProgramActivityStats {
  [key: string]: any;
  async getOpsRequests(
    requestStatus: EnumType<'ops_request_status'>,
    page: number = 1,
    limit: number = 20,
    orderBy: string = 'created_at',
    orderDir: 'asc' | 'desc' = 'asc',
    filters?: { request_type?: string[]; school?: string[] },
    searchTerm?: string,
  ): Promise<{
    data: Array<TableTypes<'ops_requests'> | Record<string, Json>>;
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  }> {
    throw new Error('Method not implemented.');
  }

  async getRequestFilterOptions(): Promise<{
    requestType: Array<string | null>;
    school: { id: string; name: string }[];
  } | null> {
    throw new Error('Method not implemented.');
  }

  async searchStudentsInSchool(
    schoolId: string,
    searchTerm: string,
    page: number,
    limit: number,
    classId?: string,
    classIds?: string[],
  ): Promise<{ data: any[]; total: number }> {
    await this.ensureInitialized();
    if (!this._db) return { data: [], total: 0 };
    // Empty program class scopes should return an empty search result.
    if (!classId && classIds && classIds.length === 0) {
      return { data: [], total: 0 };
    }
    let whereClause = `
    cu.role = 'student'
    AND cu.is_deleted = 0
    AND c.school_id = ?
  `;
    let params: any[] = [schoolId];
    // Applies program class scope while preserving the class-detail override.
    if (classId) {
      whereClause += ` AND cu.class_id = ?`;
      params.push(classId);
    } else if (classIds && classIds.length > 0) {
      const classScopePlaceholders = classIds.map(() => '?').join(', ');
      whereClause += ` AND cu.class_id IN (${classScopePlaceholders})`;
      params.push(...classIds);
    }
    // ✅ SEARCH FILTER
    if (searchTerm && searchTerm.trim() !== '') {
      whereClause += `
      AND (
        u.name LIKE ?
        OR u.student_id LIKE ?
        OR u.phone LIKE ?
      )
    `;
      const likeTerm = `%${searchTerm}%`;
      params.push(likeTerm, likeTerm, likeTerm);
    }
    const offset = (page - 1) * limit;
    // ✅ COUNT QUERY
    const countQuery = `
    SELECT COUNT(*) as total
    FROM class_user cu
    JOIN user u ON cu.user_id = u.id
    JOIN class c ON cu.class_id = c.id
    WHERE ${whereClause}
  `;
    const countResult = await this._db.query(countQuery, params);
    const total = countResult?.values?.[0]?.total ?? 0;
    // ✅ DATA QUERY
    const query = `
    SELECT
      u.id,
      u.name,
      u.student_id,
      u.phone,
      cu.class_id,
      c.name as class_name,
      pu.parent_id,
      p.name as parent_name
    FROM class_user cu
    JOIN user u ON cu.user_id = u.id
    JOIN class c ON cu.class_id = c.id
    LEFT JOIN parent_user pu
      ON pu.student_id = u.id
      AND pu.is_deleted = 0
    LEFT JOIN user p
      ON pu.parent_id = p.id
    WHERE ${whereClause}
    ORDER BY u.name
    LIMIT ? OFFSET ?
  `;
    const result = await this._db.query(query, [...params, limit, offset]);
    return { data: result?.values ?? [], total };
  }
}
