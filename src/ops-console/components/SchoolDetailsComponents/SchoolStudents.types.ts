import type { StudentInfo } from '../../../common/constants';

export type ApiStudentData = StudentInfo;

export interface DisplayStudent {
  id: string;
  original: StudentInfo;
  studentIdDisplay: string;
  name: string;
  schstudents_interact?: string;
  gender: string;
  grade: number;
  classSection: string;
  phoneNumber: string;
  class: string;
  schstudents_performance?: string;
  whatsappGroupStatus?: WhatsappGroupStatusKey;
  schstudents_actions?: string;
}

export type WhatsappGroupStatusKey =
  | 'IN_GROUP'
  | 'ON_WHATSAPP'
  | 'NOT_IN_GROUP'
  | 'NOT_AVAILABLE'
  | 'NOT_ON_WHATSAPP'
  | 'NOT_CHECKED';

export type StudentListCacheEntry = {
  data: ApiStudentData[];
  total: number;
};
