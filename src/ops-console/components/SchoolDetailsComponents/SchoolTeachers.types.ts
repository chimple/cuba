import type {
  EnumType,
  StudentInfo,
  TeacherInfo,
  WHATSAPP_GROUP_STATUS,
} from '../../../common/constants';
import type { ClassRow, SchoolData } from './SchoolClass';
import type { ProgramGradeScopeData } from './ClassDetailsPageUtils';

export type TeacherWhatsappGroupStatusKey = keyof typeof WHATSAPP_GROUP_STATUS;

export interface DisplayTeacher {
  id: string;
  name: string;
  gender: string;
  grade: number;
  classSection: string;
  phoneNumber: string;
  emailDisplay: string;
  phoneEmailDisplay: string;
  class: string;
  classId: string;
  interactData: string;
  performance: EnumType<'fc_support_level'>;
  interactPayload: TeacherInfo;
  whatsappGroupStatus?: TeacherWhatsappGroupStatusKey;
  teacher_actions?: string;
}

export interface EditTeacherAssignmentState {
  teacher: TeacherInfo;
  assignedClassIds: string[];
}

export interface SchoolTeachersProps {
  data: {
    schoolData?: SchoolData;
    programData?: ProgramGradeScopeData;
    teachers?: TeacherInfo[];
    totalTeacherCount?: number;
    classData?: ClassRow[];
    students?: StudentInfo[];
  };
  isMobile: boolean;
  schoolId: string;
}
