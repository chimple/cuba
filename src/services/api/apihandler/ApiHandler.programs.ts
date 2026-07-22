import { ApiHandlerSchoolOperations } from './ApiHandler.schoolOperations';
import type {
  GetSchoolsWithProgramAccessParams,
  SchoolProgramAccessResponse,
  ClassMetricsForClassListingRow,
} from '../ServiceApi';
import {
  TableTypes,
  EnumType,
  FilteredSchoolsForSchoolListingOps,
  SchoolRoleMap,
  TabType,
} from '../../../common/constants';

export class ApiHandlerPrograms extends ApiHandlerSchoolOperations {
  async getProgramFilterOptions(): Promise<Record<string, string[]>> {
    return await this.s.getProgramFilterOptions();
  }

  async getPrograms(params: {
    currentUserId?: string;
    filters?: Record<string, string[]>;
    searchTerm?: string;
    tab?: TabType;
    limit?: number;
    offset?: number;
    orderBy?: string;
    order?: 'asc' | 'desc';
    page?: number;
    page_size?: number;
    order_by?: string;
    order_dir?: 'asc' | 'desc';
    search?: string;
    date_range?: string;
  }) {
    return await this.s.getPrograms(params);
  }

  async insertProgram(payload: any): Promise<boolean | null> {
    return await this.s.insertProgram(payload);
  }

  async getProgramManagers(): Promise<{ name: string; id: string }[]> {
    return await this.s.getProgramManagers();
  }

  async getUniqueGeoData(): Promise<{
    Country: string[];
    State: string[];
    Block: string[];
    Cluster: string[];
    District: string[];
  }> {
    return await this.s.getUniqueGeoData();
  }

  async getProgramForSchool(
    schoolId: string,
  ): Promise<TableTypes<'program'> | undefined> {
    return await this.s.getProgramForSchool(schoolId);
  }

  async getProgramManagersForSchool(
    schoolId: string,
  ): Promise<TableTypes<'user'>[] | undefined> {
    return await this.s.getProgramManagersForSchool(schoolId);
  }

  async getSchoolsForAdmin(
    limit: number = 10,
    offset: number = 0,
  ): Promise<TableTypes<'school'>[]> {
    return await this.s.getSchoolsForAdmin(limit, offset);
  }

  async getTeachersForSchools(schoolIds: string[]): Promise<SchoolRoleMap[]> {
    return await this.s.getTeachersForSchools(schoolIds);
  }

  async getStudentsForSchools(schoolIds: string[]): Promise<SchoolRoleMap[]> {
    return await this.s.getStudentsForSchools(schoolIds);
  }

  async getProgramManagersForSchools(
    schoolIds: string[],
  ): Promise<SchoolRoleMap[]> {
    return await this.s.getProgramManagersForSchools(schoolIds);
  }

  async getFieldCoordinatorsForSchools(
    schoolIds: string[],
  ): Promise<SchoolRoleMap[]> {
    return await this.s.getFieldCoordinatorsForSchools(schoolIds);
  }

  async updateStudentStars(
    studentId: string,
    totalStars: number,
  ): Promise<void> {
    return await this.s.updateStudentStars(studentId, totalStars);
  }

  async getChapterIdbyQrLink(
    link: string,
  ): Promise<TableTypes<'chapter_links'> | undefined> {
    return await this.s.getChapterIdbyQrLink(link);
  }

  async getSchoolsByModel(
    model: EnumType<'program_model'>,
    limit: number = 10,
    offset: number = 0,
  ): Promise<TableTypes<'school'>[]> {
    return await this.s.getSchoolsByModel(model, limit, offset);
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
    return await this.s.getProgramData(programId);
  }

  async getSchoolFilterOptionsForSchoolListing(): Promise<
    Record<string, string[]>
  > {
    return await this.s.getSchoolFilterOptionsForSchoolListing();
  }

  async getSchoolFilterOptionsForProgram(
    programId: string,
  ): Promise<Record<string, string[]>> {
    return await this.s.getSchoolFilterOptionsForProgram(programId);
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
    return await this.s.getFilteredSchoolsForSchoolListing(params);
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
    return await this.s.getSchoolMetricsForSchoolListing(params);
  }

  async getClassMetricsForClassListing(params: {
    schoolId: string;
    date_range?: string;
  }): Promise<ClassMetricsForClassListingRow[]> {
    return await this.s.getClassMetricsForClassListing(params);
  }

  async getSchoolsWithProgramAccess(
    params: GetSchoolsWithProgramAccessParams,
  ): Promise<SchoolProgramAccessResponse> {
    return await this.s.getSchoolsWithProgramAccess(params);
  }

  async computeSchoolMetricsForSchool(schoolId: string): Promise<boolean> {
    return this.s.computeSchoolMetricsForSchool(schoolId);
  }

  async updateSchoolProgram(
    schoolId: string,
    programId: string,
  ): Promise<boolean> {
    // Delegate to the actual API implementation (e.g., SupabaseApi)
    return this.s.updateSchoolProgram(schoolId, programId);
  }
}
