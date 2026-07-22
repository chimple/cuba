import {
  FilteredSchoolsForSchoolListingOps,
  EnumType,
  MUTATE_TYPES,
  SchoolRoleMap,
  TABLES,
  TabType,
  TableTypes,
} from '../../../common/constants';
import logger from '../../../utility/logger';
import { SqliteApiCampaignManagement } from './SqliteApi.campaign.management';
import {
  ClassMetricsForClassListingRow,
  GetSchoolsWithProgramAccessParams,
  ProgramListingProgramRow,
  SchoolProgramAccessResponse,
} from '../ServiceApi';

export class SqliteApiProgramFoundation extends SqliteApiCampaignManagement {
  [key: string]: any;
  async insertProgram(payload: any): Promise<boolean | null> {
    return await this._serverApi.insertProgram(payload);
  }

  async getUniqueGeoData(): Promise<{
    Country: string[];
    State: string[];
    Block: string[];
    Cluster: string[];
    District: string[];
  }> {
    return await this._serverApi.getUniqueGeoData();
  }

  async getProgramForSchool(
    schoolId: string,
  ): Promise<TableTypes<'program'> | undefined> {
    const prog = await this._serverApi.getProgramForSchool(schoolId);
    return prog;
  }

  async getProgramManagersForSchool(
    schoolId: string,
  ): Promise<TableTypes<'user'>[] | undefined> {
    const users = await this._serverApi.getProgramManagersForSchool(schoolId);
    return users;
  }

  async updateStudentStars(
    studentId: string,
    totalStars: number,
  ): Promise<void> {
    if (!studentId) return;
    try {
      await this.executeQuery(
        `UPDATE ${TABLES.User} SET stars = ? WHERE id = ?;`,
        [totalStars, studentId],
      );

      this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, {
        id: studentId,
        stars: totalStars,
      });
    } catch (error) {
      logger.error('Error setting stars for student:', error);
    }
  }

  async getSchoolsForAdmin(
    limit: number = 10,
    offset: number = 0,
  ): Promise<TableTypes<'school'>[]> {
    return await this._serverApi.getSchoolsForAdmin(limit, offset);
  }

  async getSchoolsByModel(
    model: EnumType<'program_model'>,
    limit: number = 10,
    offset: number = 0,
  ): Promise<TableTypes<'school'>[]> {
    return await this._serverApi.getSchoolsByModel(model, limit, offset);
  }

  async getTeachersForSchools(schoolIds: string[]): Promise<SchoolRoleMap[]> {
    return await this._serverApi.getTeachersForSchools(schoolIds);
  }

  async getStudentsForSchools(schoolIds: string[]): Promise<SchoolRoleMap[]> {
    return await this._serverApi.getStudentsForSchools(schoolIds);
  }

  async getProgramManagersForSchools(
    schoolIds: string[],
  ): Promise<SchoolRoleMap[]> {
    return await this._serverApi.getProgramManagersForSchools(schoolIds);
  }

  async getFieldCoordinatorsForSchools(
    schoolIds: string[],
  ): Promise<SchoolRoleMap[]> {
    return await this._serverApi.getFieldCoordinatorsForSchools(schoolIds);
  }

  async getProgramData(programId: string): Promise<{
    programDetails: { id: string; label: string; value: string }[];
    locationDetails: { id: string; label: string; value: string }[];
    partnerDetails: { id: string; label: string; value: string }[];
    programManagers: {
      name: string;
      role: string;
      phone: string;
      email: string;
    }[];
  } | null> {
    return await this._serverApi.getProgramData(programId);
  }

  async getSchoolFilterOptionsForSchoolListing(): Promise<
    Record<string, string[]>
  > {
    return await this._serverApi.getSchoolFilterOptionsForSchoolListing();
  }

  async getSchoolFilterOptionsForProgram(
    programId: string,
  ): Promise<Record<string, string[]>> {
    return await this._serverApi.getSchoolFilterOptionsForProgram(programId);
  }

  async createOrAddUserOps(payload: {
    name: string;
    email?: string;
    phone?: string;
    role: string;
  }): Promise<{
    success: boolean;
    user_id?: string;
    message?: string;
    error?: string;
  }> {
    return await this._serverApi.createOrAddUserOps(payload);
  }

  async getFilteredSchoolsForSchoolListing(params: {
    filters?: Record<string, string[]>;
    programId?: string;
    page?: number;
    page_size?: number;
    order_by?: string;
    order_dir?: 'asc' | 'desc';
    search?: string;
    date_range?: string;
    percentage_filters?: Record<string, 'low' | 'mid' | 'high'>;
    school_performance_filter?: string | null;
  }): Promise<{ data: FilteredSchoolsForSchoolListingOps[]; total: number }> {
    return await this._serverApi.getFilteredSchoolsForSchoolListing(params);
  }

  async getSchoolMetricsForSchoolListing(params: {
    filters?: Record<string, string[]>;
    programId?: string;
    page?: number;
    page_size?: number;
    order_by?: string;
    order_dir?: 'asc' | 'desc';
    search?: string;
    date_range?: string;
    percentage_filters?: Record<string, 'low' | 'mid' | 'high'>;
    school_performance_filter?: string | null;
  }): Promise<{ data: FilteredSchoolsForSchoolListingOps[]; total: number }> {
    return await this._serverApi.getSchoolMetricsForSchoolListing(params);
  }

  public async getProgramsFromProgramMetrics(params: {
    currentUserId: string;
    filters?: Record<string, string[]>;
    tab?: TabType;
    page?: number;
    page_size?: number;
    order_by?: string;
    order_dir?: 'asc' | 'desc';
    search?: string;
    date_range?: string;
  }): Promise<{
    data: ProgramListingProgramRow[];
    total: number;
  }> {
    return await this._serverApi.getProgramsFromProgramMetrics(params);
  }

  async getClassMetricsForClassListing(params: {
    schoolId: string;
    date_range?: string;
  }): Promise<ClassMetricsForClassListingRow[]> {
    return await this._serverApi.getClassMetricsForClassListing(params);
  }

  async getSchoolsWithProgramAccess(
    params: GetSchoolsWithProgramAccessParams,
  ): Promise<SchoolProgramAccessResponse> {
    return await this._serverApi.getSchoolsWithProgramAccess(params);
  }
}
