import {
  TableTypes,
  EnumType,
  FilteredSchoolsForSchoolListingOps,
  SchoolRoleMap,
  TabType,
} from '../../../common/constants';
import type {
  GetSchoolsWithProgramAccessParams,
  SchoolProgramAccessResponse,
  ClassMetricsForClassListingRow,
  ProgramListingProgramRow,
} from './ServiceApi.types';

export interface ServiceApiPrograms {
  getProgramFilterOptions(): Promise<Record<string, string[]>>;

  getPrograms(params: {
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
  }): Promise<{ data: ProgramListingProgramRow[]; total?: number }>;

  insertProgram(payload: any, id?: string): Promise<boolean | null>;

  getProgramManagers(): Promise<{ name: string; id: string }[]>;

  getUniqueGeoData(): Promise<{
    Country: string[];
    State: string[];
    Block: string[];
    Cluster: string[];
    District: string[];
  }>;

  getProgramForSchool(
    schoolId: string,
  ): Promise<TableTypes<'program'> | undefined>;

  getProgramManagersForSchool(
    schoolId: string,
  ): Promise<TableTypes<'user'>[] | undefined>;

  getSchoolsForAdmin(
    limit: number,
    offset: number,
  ): Promise<TableTypes<'school'>[]>;

  getTeachersForSchools(schoolIds: string[]): Promise<SchoolRoleMap[]>;

  getStudentsForSchools(schoolIds: string[]): Promise<SchoolRoleMap[]>;

  getProgramManagersForSchools(schoolIds: string[]): Promise<SchoolRoleMap[]>;

  getFieldCoordinatorsForSchools(schoolIds: string[]): Promise<SchoolRoleMap[]>;

  updateStudentStars(studentId: string, totalStars: number): Promise<void>;

  getChapterIdbyQrLink(
    link: string,
  ): Promise<TableTypes<'chapter_links'> | undefined>;

  getSchoolsByModel(
    model: EnumType<'program_model'>,
    limit: number,
    offset: number,
  ): Promise<TableTypes<'school'>[]>;

  getProgramData(programId: string): Promise<{
    programDetails: { id: string; label: string; value: string }[];
    locationDetails: { id: string; label: string; value: string }[];
    partnerDetails: { id: string; label: string; value: string }[];
    programManagers: {
      name: string;
      role: string;
      phone: string;
      email: string;
    }[];
  } | null>;

  getSchoolFilterOptionsForSchoolListing(): Promise<Record<string, string[]>>;

  getSchoolFilterOptionsForProgram(
    programId: string,
  ): Promise<Record<string, string[]>>;

  getFilteredSchoolsForSchoolListing(params: {
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
  }): Promise<{
    data: FilteredSchoolsForSchoolListingOps[];
    total: number;
  }>;

  getSchoolMetricsForSchoolListing(params: {
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
  }): Promise<{
    data: FilteredSchoolsForSchoolListingOps[];
    total: number;
  }>;

  getClassMetricsForClassListing(params: {
    schoolId: string;
    date_range?: string;
  }): Promise<ClassMetricsForClassListingRow[]>;

  getSchoolsWithProgramAccess(
    params: GetSchoolsWithProgramAccessParams,
  ): Promise<SchoolProgramAccessResponse>;

  computeSchoolMetricsForSchool(schoolId: string): Promise<boolean>;

  updateSchoolProgram(schoolId: string, programId: string): Promise<boolean>;
}
