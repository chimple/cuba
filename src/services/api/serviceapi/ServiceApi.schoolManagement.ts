import {
  TableTypes,
  SchoolVisitAction,
  SchoolVisitType,
  EnumType,
} from '../../../common/constants';

export interface ServiceApiSchoolManagement {
  createSchool(
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
  ): Promise<TableTypes<'school'>>;

  updateSchoolProfile(
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
  ): Promise<TableTypes<'school'>>;

  updateSchoolLocation(
    schoolId: string,
    lat: number,
    lng: number,
  ): Promise<void>;

  recordSchoolVisit(
    schoolId: string,
    lat: number,
    lng: number,
    action: SchoolVisitAction,
    visitType?: SchoolVisitType,
    distanceFromSchool?: number,
    numberOfParents?: number,
  ): Promise<TableTypes<'fc_school_visit'> | null>;

  getLastSchoolVisit(
    schoolId: string,
  ): Promise<TableTypes<'fc_school_visit'> | null>;

  requestNewSchool(
    name: string,
    state: string,
    district: string,
    city: string,
    image: File | null,
    udise_id?: string,
  ): Promise<TableTypes<'req_new_school'> | null>;

  deleteApprovedOpsRequestsForUser(
    requested_by: string,
    schoolId?: string,
    classId?: string,
  ): Promise<void>;

  getExistingSchoolRequest(
    requested_by: string,
  ): Promise<TableTypes<'ops_requests'> | null>;

  updateClassCourseSelection(
    classId: string,
    selectedCourseIds: string[],
  ): Promise<void>;

  updateSchoolCourseSelection(
    schoolId: string,
    selectedCourseIds: string[],
  ): Promise<void>;

  getCoursesByClassId(classId: string): Promise<TableTypes<'class_course'>[]>;

  getCoursesBySchoolId(
    schoolId: string,
  ): Promise<TableTypes<'school_course'>[]>;

  removeCoursesFromClass(ids: string[]): Promise<void>;

  removeCoursesFromSchool(ids: string[]): Promise<void>;

  checkCourseInClasses(classIds: string[], courseId: string): Promise<boolean>;

  deleteUserFromClass(
    userId: string,
    class_id: string,
  ): Promise<Boolean | void>;

  getSchoolById(id: string): Promise<TableTypes<'school'> | undefined>;

  getParentWhatsappSchoolByUdise?: (udiseCode: string) => Promise<{
    id: string;
    name: string;
    whatsapp_bot_number?: string | null;
  } | null>;
}
