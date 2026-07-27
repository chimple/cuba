import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  OPS_PERFORMANCE_BANDS,
  WHATSAPP_GROUP_STATUS_KEYS,
} from '../../../common/constants';
import logger from '../../../utility/logger';
import { normalizePhone10 } from '../../pages/NewUserPageOps';
import type { ClassRow, SchoolData } from './SchoolClass';
import type {
  ApiStudentData,
  DisplayStudent,
  WhatsappGroupStatusKey,
} from './SchoolStudents.types';
import {
  getWhatsappAvailabilityStatus,
  mapBandToOpsLabel,
  normalizeWhatsappContactFlag,
  StudentPerformanceBand,
} from './SchoolStudents.utils';

type UseSchoolStudentsStatusParams = {
  api: any;
  classDataRef?: ClassRow;
  data: {
    schoolData?: SchoolData;
    classData?: ClassRow[];
  };
  issTotal: boolean;
  normalizedStudents: ApiStudentData[];
  programScopedClasses: ClassRow[];
  sortedStudents: ApiStudentData[];
};

export const useSchoolStudentsStatus = ({
  api,
  classDataRef,
  data,
  issTotal,
  normalizedStudents,
  programScopedClasses,
  sortedStudents,
}: UseSchoolStudentsStatusParams) => {
  const [studentPerformanceMap, setStudentPerformanceMap] = useState<
    Map<string, string>
  >(new Map());
  const [whatsappMembersByClass, setWhatsappMembersByClass] = useState<
    Map<string, Set<string>>
  >(new Map());
  const [isPerformanceLoading, setIsPerformanceLoading] = useState(false);

  const studentIdsKey = useMemo(
    () => sortedStudents.map((s) => s.user.id).join(','),
    [sortedStudents],
  );
  const performanceClassIdsKey = useMemo(
    () =>
      Array.from(
        new Set(
          normalizedStudents
            .map((student) =>
              issTotal
                ? student.classWithidname?.id
                : (classDataRef?.id ?? student.classWithidname?.id),
            )
            .filter((value): value is string => Boolean(value)),
        ),
      ).join(','),
    [classDataRef?.id, issTotal, normalizedStudents],
  );

  const classGroupKey = useMemo(() => {
    if (!issTotal) return '';
    return programScopedClasses
      .map((row) => `${row?.id ?? ''}:${row?.group_id ?? ''}`)
      .join('|');
  }, [issTotal, programScopedClasses]);

  const classGroupIdMap = useMemo(() => {
    const map = new Map<string, string>();
    const classes = issTotal
      ? programScopedClasses
      : Array.isArray(data.classData)
        ? data.classData
        : [];
    classes.forEach((row) => {
      if (row?.id) map.set(row.id, String(row?.group_id ?? '').trim());
    });
    return map;
  }, [data.classData, issTotal, programScopedClasses]);

  useEffect(() => {
    let cancelled = false;
    const bot = data?.schoolData?.whatsapp_bot_number;
    const classes = issTotal
      ? programScopedClasses
      : classDataRef
        ? [classDataRef]
        : [];
    const groupTargets = classes.filter(
      (row) => row?.id && row?.group_id && String(row.group_id).trim() !== '',
    );

    if (!bot || !api?.getWhatsappGroupDetails || groupTargets.length === 0) {
      setWhatsappMembersByClass(new Map());
      return;
    }

    (async () => {
      try {
        const results = await Promise.all(
          groupTargets.map(async (row) => {
            try {
              const group = await api.getWhatsappGroupDetails(
                row.group_id as string,
                bot,
              );
              return [row.id as string, group] as const;
            } catch (error) {
              logger.error('Failed to fetch WhatsApp group members:', error);
              return [row.id as string, null] as const;
            }
          }),
        );

        if (cancelled) return;
        const next = new Map<string, Set<string>>();
        results.forEach(([classId, group]) => {
          const parsedGroup =
            typeof group === 'object' && group !== null && !Array.isArray(group)
              ? (group as { members?: string[] })
              : null;
          const members = Array.isArray(parsedGroup?.members)
            ? (parsedGroup?.members ?? [])
            : [];
          const normalizedMembers = new Set<string>(
            members
              .map((member: unknown) => normalizePhone10(String(member)))
              .filter((member): member is string => Boolean(member)),
          );
          next.set(classId, normalizedMembers);
        });
        setWhatsappMembersByClass(next);
      } catch (error) {
        logger.error('Failed to fetch WhatsApp group members:', error);
        if (!cancelled) setWhatsappMembersByClass(new Map());
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    api,
    classDataRef?.id,
    classDataRef?.group_id,
    classGroupKey,
    data?.schoolData?.whatsapp_bot_number,
    issTotal,
    programScopedClasses,
  ]);

  const getGroupIdForClass = useCallback(
    (classId?: string) => {
      if (!classId) return '';
      if (!issTotal && classDataRef?.group_id != null) {
        return String(classDataRef.group_id ?? '').trim();
      }
      return String(classGroupIdMap.get(classId) ?? '').trim();
    },
    [classDataRef?.group_id, classGroupIdMap, issTotal],
  );

  const isStudentInWhatsappGroup = useCallback(
    (student: ApiStudentData) => {
      const classId = issTotal
        ? student.classWithidname?.id
        : (classDataRef?.id ?? student.classWithidname?.id);
      if (!classId) return false;
      const members = whatsappMembersByClass.get(classId);
      if (!members || members.size === 0) return false;
      const parentPhone = normalizePhone10(String(student.parent?.phone ?? ''));
      return !!parentPhone && members.has(parentPhone);
    },
    [classDataRef?.id, issTotal, whatsappMembersByClass],
  );

  const getWhatsappGroupStatus = useCallback(
    (student: ApiStudentData): WhatsappGroupStatusKey => {
      const classId = issTotal
        ? student.classWithidname?.id
        : (classDataRef?.id ?? student.classWithidname?.id);
      if (!classId) return WHATSAPP_GROUP_STATUS_KEYS.NOT_CHECKED;

      const waContactRaw =
        (student.parent as { is_wa_contact?: unknown } | null)?.is_wa_contact ??
        null;
      const groupId = getGroupIdForClass(classId);
      if (!groupId) return getWhatsappAvailabilityStatus(waContactRaw);

      if (isStudentInWhatsappGroup(student)) {
        return WHATSAPP_GROUP_STATUS_KEYS.IN_GROUP;
      }

      const waContact = normalizeWhatsappContactFlag(waContactRaw);
      if (waContact === 'yes') return WHATSAPP_GROUP_STATUS_KEYS.NOT_IN_GROUP;
      if (waContact === 'no') return WHATSAPP_GROUP_STATUS_KEYS.NOT_ON_WHATSAPP;
      return WHATSAPP_GROUP_STATUS_KEYS.NOT_CHECKED;
    },
    [classDataRef?.id, getGroupIdForClass, isStudentInWhatsappGroup, issTotal],
  );

  useEffect(() => {
    const fetchStudentPerformance = async () => {
      if (sortedStudents.length === 0) {
        setStudentPerformanceMap(new Map());
        return;
      }
      const studentIds = sortedStudents
        .map((student) => student.user.id)
        .filter(Boolean);
      const classIds = Array.from(
        new Set(
          sortedStudents
            .map((student) =>
              issTotal
                ? student.classWithidname?.id
                : (classDataRef?.id ?? student.classWithidname?.id),
            )
            .filter((value): value is string => Boolean(value)),
        ),
      );
      if (studentIds.length === 0 || classIds.length === 0) {
        setStudentPerformanceMap(new Map());
        return;
      }
      setIsPerformanceLoading(true);
      const performanceMap = new Map<string, string>();
      try {
        const mvRows = await api.getOpsStudentPerformanceBands({
          classIds,
          studentIds,
        });
        mvRows.forEach((row: any) => {
          const rowStudentId = String(row?.student_id ?? '').trim();
          const rowClassId = String(row?.class_id ?? '').trim();
          const rawBand = (row?.performance ??
            null) as StudentPerformanceBand | null;
          if (!rowStudentId || !rowClassId) return;
          performanceMap.set(
            `${rowClassId}:${rowStudentId}`,
            mapBandToOpsLabel(rawBand),
          );
        });
        setStudentPerformanceMap(performanceMap);
      } catch (error) {
        logger.error('Error fetching student performance data:', error);
        setStudentPerformanceMap(performanceMap);
      } finally {
        setIsPerformanceLoading(false);
      }
    };
    fetchStudentPerformance();
  }, [api, classDataRef?.id, issTotal, performanceClassIdsKey, studentIdsKey]);

  return {
    getWhatsappGroupStatus,
    isPerformanceLoading,
    studentPerformanceMap,
  };
};
