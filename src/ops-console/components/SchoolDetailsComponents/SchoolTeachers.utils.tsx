import React from 'react';
import { Chip } from '@mui/material';
import { t } from 'i18next';
import {
  EnumType,
  PERFORMANCE_UI,
  PerformanceLevel,
  WHATSAPP_GROUP_STATUS,
  WHATSAPP_GROUP_STATUS_KEYS,
  WHATSAPP_GROUP_TICK_ICON,
} from '../../../common/constants';
import type { TeacherWhatsappGroupStatusKey } from './SchoolTeachers.types';

export const ROWS_PER_PAGE = 20;

export type TeacherListCacheEntry = {
  data: import('../../../common/constants').TeacherInfo[];
  total: number;
};

export const teacherListCache = new Map<string, TeacherListCacheEntry>();

export const getTeacherListCacheKey = (
  schoolId: string,
  classIds: string[] | undefined,
): string => `${schoolId}|classes:${classIds?.join(',') ?? 'all'}`;

export const getWhatsappChipClass = (
  status: TeacherWhatsappGroupStatusKey,
): string => {
  switch (status) {
    case WHATSAPP_GROUP_STATUS_KEYS.IN_GROUP:
      return 'schoolteachers-whatsapp-chip-in-group';
    case WHATSAPP_GROUP_STATUS_KEYS.ON_WHATSAPP:
      return 'schoolteachers-whatsapp-chip-in-group';
    case WHATSAPP_GROUP_STATUS_KEYS.NOT_IN_GROUP:
      return 'schoolteachers-whatsapp-chip-not-in-group';
    case WHATSAPP_GROUP_STATUS_KEYS.NOT_AVAILABLE:
      return 'schoolteachers-whatsapp-chip-not-on-whatsapp';
    case WHATSAPP_GROUP_STATUS_KEYS.NOT_ON_WHATSAPP:
      return 'schoolteachers-whatsapp-chip-not-on-whatsapp';
    case WHATSAPP_GROUP_STATUS_KEYS.NOT_CHECKED:
    default:
      return 'schoolteachers-whatsapp-chip-not-checked';
  }
};

export const renderTeacherWhatsappGroupChip = (
  statusKey?: TeacherWhatsappGroupStatusKey,
) => {
  const key = statusKey ?? WHATSAPP_GROUP_STATUS_KEYS.NOT_CHECKED;
  return (
    <Chip
      icon={
        key === WHATSAPP_GROUP_STATUS_KEYS.IN_GROUP ? (
          <img
            src={WHATSAPP_GROUP_TICK_ICON}
            alt=""
            aria-hidden="true"
            className="schoolteachers-whatsapp-chip-icon"
          />
        ) : undefined
      }
      label={t(WHATSAPP_GROUP_STATUS[key])}
      size="small"
      className={`schoolteachers-whatsapp-chip schoolteachers-whatsapp-chip-base ${getWhatsappChipClass(key)}`}
    />
  );
};

export const getPerformancePillClass = (
  performance: EnumType<'fc_support_level'>,
): string => {
  switch (performance) {
    case PerformanceLevel.NOT_ASSIGNING:
      return 'schoolTeachers-performance-pill-not-assigning';
    case PerformanceLevel.ONE_TO_TWO_ASSIGNED:
      return 'schoolTeachers-performance-pill-one-to-two';
    case PerformanceLevel.THREE_TO_FOUR_ASSIGNED:
      return 'schoolTeachers-performance-pill-three-to-four';
    case PerformanceLevel.FOUR_PLUS_ASSIGNED:
      return 'schoolTeachers-performance-pill-four-plus';
    default:
      return 'schoolTeachers-performance-pill-not-tracked';
  }
};

export const renderTeacherPerformancePill = (
  performance: EnumType<'fc_support_level'>,
) => {
  if (!performance) return <span>--</span>;
  const ui = PERFORMANCE_UI[performance];
  return (
    <div
      className={`schoolTeachers-performance-pill ${getPerformancePillClass(
        performance,
      )}`}
    >
      {t(ui.label)}
    </div>
  );
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
): TeacherWhatsappGroupStatusKey => {
  const waContact = normalizeWhatsappContactFlag(waContactRaw);
  if (waContact === 'yes') return WHATSAPP_GROUP_STATUS_KEYS.ON_WHATSAPP;
  if (waContact === 'no') return WHATSAPP_GROUP_STATUS_KEYS.NOT_ON_WHATSAPP;
  return WHATSAPP_GROUP_STATUS_KEYS.NOT_CHECKED;
};

export const mapCountToPerformance = (
  count: number | null,
): PerformanceLevel => {
  if (count === null) return PerformanceLevel.NOT_TRACKED;
  if (count === 0) return PerformanceLevel.NOT_ASSIGNING;
  if (count >= 1 && count <= 2) return PerformanceLevel.ONE_TO_TWO_ASSIGNED;
  if (count >= 3 && count <= 4) return PerformanceLevel.THREE_TO_FOUR_ASSIGNED;
  if (count >= 5) return PerformanceLevel.FOUR_PLUS_ASSIGNED;
  return PerformanceLevel.NOT_TRACKED;
};
