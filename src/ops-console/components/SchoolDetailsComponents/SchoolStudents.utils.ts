import {
  OPS_PERFORMANCE_BANDS,
  PerformanceLevel,
  STUDENT_PERFORMANCE_BAND_KEYS,
  WHATSAPP_GROUP_STATUS_KEYS,
} from '../../../common/constants';
import type {
  ApiStudentData,
  StudentListCacheEntry,
  WhatsappGroupStatusKey,
} from './SchoolStudents.types';

export type StudentPerformanceBand =
  (typeof STUDENT_PERFORMANCE_BAND_KEYS)[keyof typeof STUDENT_PERFORMANCE_BAND_KEYS];
type OpsPerformanceLabel =
  (typeof OPS_PERFORMANCE_BANDS)[keyof typeof OPS_PERFORMANCE_BANDS];

export const ROWS_PER_PAGE = 20;
export const STUDENT_FETCH_BATCH_SIZE = 200;

export const studentListCache = new Map<string, StudentListCacheEntry>();

export const getStudentListCacheKey = (
  schoolId: string,
  optionalClassId: string | undefined,
  classIds: string[] | undefined,
): string => {
  const classScope =
    optionalClassId && optionalClassId.trim() !== ''
      ? `class:${optionalClassId.trim()}`
      : `classes:${classIds?.join(',') ?? 'all'}`;
  return `${schoolId}|${classScope}`;
};

export const sameSection = (a?: string, b?: string) =>
  String(a ?? '')
    .trim()
    .toUpperCase() ===
  String(b ?? '')
    .trim()
    .toUpperCase();

export const getPerformanceChipClass = (
  schstudents_performance: string,
): string => {
  switch (schstudents_performance) {
    case OPS_PERFORMANCE_BANDS.HIGH:
      return 'performance-chip-doing-good';
    case OPS_PERFORMANCE_BANDS.NOT_ACTIVE:
      return 'performance-chip-need-help';
    case OPS_PERFORMANCE_BANDS.MEDIUM:
      return 'performance-chip-still-learning';
    case OPS_PERFORMANCE_BANDS.NOT_DOWNLOADED:
    default:
      return 'performance-chip-not-tracked';
  }
};

export const getWhatsappChipClass = (
  status: WhatsappGroupStatusKey,
): string => {
  switch (status) {
    case WHATSAPP_GROUP_STATUS_KEYS.IN_GROUP:
      return 'schoolstudents-whatsapp-chip-in-group';
    case WHATSAPP_GROUP_STATUS_KEYS.ON_WHATSAPP:
      return 'schoolstudents-whatsapp-chip-in-group';
    case WHATSAPP_GROUP_STATUS_KEYS.NOT_IN_GROUP:
      return 'schoolstudents-whatsapp-chip-not-in-group';
    case WHATSAPP_GROUP_STATUS_KEYS.NOT_AVAILABLE:
      return 'schoolstudents-whatsapp-chip-not-on-whatsapp';
    case WHATSAPP_GROUP_STATUS_KEYS.NOT_ON_WHATSAPP:
      return 'schoolstudents-whatsapp-chip-not-on-whatsapp';
    case WHATSAPP_GROUP_STATUS_KEYS.NOT_CHECKED:
    default:
      return 'schoolstudents-whatsapp-chip-not-checked';
  }
};

export const normalizeWhatsappContactFlag = (
  value: unknown,
): 'yes' | 'no' | null => {
  if (value == null) return null;
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'yes' || normalized === 'true') return 'yes';
  if (normalized === 'no' || normalized === 'false') return 'no';
  return null;
};

export const getWhatsappAvailabilityStatus = (
  waContactRaw: unknown,
): WhatsappGroupStatusKey => {
  const waContact = normalizeWhatsappContactFlag(waContactRaw);
  if (waContact === 'yes') return WHATSAPP_GROUP_STATUS_KEYS.ON_WHATSAPP;
  if (waContact === 'no') return WHATSAPP_GROUP_STATUS_KEYS.NOT_ON_WHATSAPP;
  return WHATSAPP_GROUP_STATUS_KEYS.NOT_CHECKED;
};

export const mapBandToOpsLabel = (
  band?: string | null,
): OpsPerformanceLabel => {
  switch (band) {
    case STUDENT_PERFORMANCE_BAND_KEYS.GREEN:
      return OPS_PERFORMANCE_BANDS.HIGH;
    case STUDENT_PERFORMANCE_BAND_KEYS.YELLOW:
      return OPS_PERFORMANCE_BANDS.MEDIUM;
    case STUDENT_PERFORMANCE_BAND_KEYS.RED:
      return OPS_PERFORMANCE_BANDS.NOT_ACTIVE;
    case STUDENT_PERFORMANCE_BAND_KEYS.GREY:
    default:
      return OPS_PERFORMANCE_BANDS.NOT_DOWNLOADED;
  }
};

export const mapOpsLabelToPerformanceLevel = (
  label?: string | null,
):
  | PerformanceLevel.DOING_GOOD
  | PerformanceLevel.STILL_LEARNING
  | PerformanceLevel.NEED_HELP
  | PerformanceLevel.NOT_TRACKED => {
  switch (label) {
    case OPS_PERFORMANCE_BANDS.HIGH:
      return PerformanceLevel.DOING_GOOD;
    case OPS_PERFORMANCE_BANDS.MEDIUM:
      return PerformanceLevel.STILL_LEARNING;
    case OPS_PERFORMANCE_BANDS.NOT_ACTIVE:
      return PerformanceLevel.NEED_HELP;
    case OPS_PERFORMANCE_BANDS.NOT_DOWNLOADED:
    default:
      return PerformanceLevel.NOT_TRACKED;
  }
};

export const getStudentInfoByIdFromList = (
  students: ApiStudentData[],
  id: string,
) => {
  if (!Array.isArray(students)) return null;
  return students.find((stu) => stu.user?.id === id) || null;
};
