import { useEffect, useMemo, useState } from 'react';
import {
  EnumType,
  PerformanceLevel,
  TeacherInfo,
} from '../../../common/constants';
import { ServiceConfig } from '../../../services/ServiceConfig';
import logger from '../../../utility/logger';
import {
  getClassDisplayLabel,
  getExactClassName,
} from './ClassDetailsPageUtils';
import { mapCountToPerformance } from './SchoolTeachers.utils';
import type {
  DisplayTeacher,
  TeacherWhatsappGroupStatusKey,
} from './SchoolTeachers.types';

type UseSchoolTeachersPerformanceProps = {
  getWhatsappGroupStatus: (
    teacher: TeacherInfo,
  ) => TeacherWhatsappGroupStatusKey;
  sortedTeachers: TeacherInfo[];
};

type AssignmentCountPair = {
  teacherId: string;
  classId: string;
};

const getTeacherClassPair = (
  apiTeacher: TeacherInfo,
): AssignmentCountPair | null => {
  const teacherId = apiTeacher.user?.id;
  const classId =
    (apiTeacher as { classId?: string }).classId ??
    apiTeacher.classWithidname?.id ??
    '';

  if (!teacherId || !classId) return null;

  return { teacherId, classId };
};

const getAssignmentPairKey = ({ teacherId, classId }: AssignmentCountPair) =>
  `${teacherId}:${classId}`;

const toDisplayTeacher = (
  apiTeacher: TeacherInfo,
  performance: EnumType<'fc_support_level'>,
  classId?: string,
): DisplayTeacher => ({
  id: apiTeacher.user?.id ?? '',
  name: apiTeacher.user?.name || 'N/A',
  gender: apiTeacher.user?.gender || 'N/A',
  grade: apiTeacher.grade,
  classSection: apiTeacher.classSection,
  phoneNumber: apiTeacher.user?.phone || 'â€”',
  emailDisplay: apiTeacher.user?.email || 'â€”',
  phoneEmailDisplay: `${apiTeacher.user?.phone?.trim() || 'â€”'} / ${apiTeacher.user?.email?.trim() || 'â€”'}`,
  class: getClassDisplayLabel(
    apiTeacher.grade,
    apiTeacher.classSection,
    getExactClassName(apiTeacher.classWithidname),
  ),
  classId: classId ?? apiTeacher.classWithidname?.id ?? '',
  interactData: '',
  interactPayload: apiTeacher,
  performance,
});

export const useSchoolTeachersPerformance = ({
  getWhatsappGroupStatus,
  sortedTeachers,
}: UseSchoolTeachersPerformanceProps) => {
  const [teachersWithPerformance, setTeachersWithPerformance] = useState<
    DisplayTeacher[]
  >([]);

  const displayTeachers = useMemo((): DisplayTeacher[] => {
    return sortedTeachers.map((apiTeacher) => ({
      id: apiTeacher.user.id,
      name: apiTeacher.user.name || 'N/A',
      gender: apiTeacher.user.gender || 'N/A',
      grade: apiTeacher.grade,
      classSection: apiTeacher.classSection,
      phoneNumber: apiTeacher.user.phone || 'â€”',
      emailDisplay: apiTeacher.user.email || 'â€”',
      phoneEmailDisplay: `${apiTeacher.user.phone || 'â€”'} / ${apiTeacher.user.email || 'â€”'}`,
      class: getClassDisplayLabel(
        apiTeacher.grade,
        apiTeacher.classSection,
        getExactClassName(apiTeacher.classWithidname),
      ),
      classId: apiTeacher.classWithidname?.id ?? '',
      interactData: '',
      interactPayload: apiTeacher,
      performance:
        teachersWithPerformance.find(
          (teacher) =>
            teacher.id === apiTeacher.user.id &&
            teacher.classId === apiTeacher.classWithidname?.id,
        )?.performance ?? 'not_assigning',
    }));
  }, [sortedTeachers, teachersWithPerformance]);

  useEffect(() => {
    if (!sortedTeachers.length) {
      setTeachersWithPerformance([]);
      return;
    }
    let cancelled = false;
    async function loadPerformance() {
      const pairByKey = new Map<string, AssignmentCountPair>();
      sortedTeachers.forEach((apiTeacher) => {
        const pair = getTeacherClassPair(apiTeacher);
        if (pair) {
          pairByKey.set(getAssignmentPairKey(pair), pair);
        }
      });

      const countsByPair: Record<string, number | null> = {};
      const activeApi = ServiceConfig.getI().apiHandler;
      const pairs = Array.from(pairByKey.values());

      if (pairs.length > 0) {
        try {
          Object.assign(
            countsByPair,
            await activeApi.getRecentAssignmentCountsByTeachers(pairs),
          );
        } catch (error) {
          logger.error('Failed to load teacher performance counts:', {
            error,
          });
        }
      }

      const enriched: DisplayTeacher[] = sortedTeachers.map((apiTeacher) => {
        const pair = getTeacherClassPair(apiTeacher);

        if (!pair) {
          return toDisplayTeacher(
            apiTeacher,
            PerformanceLevel.NOT_ASSIGNING as EnumType<'fc_support_level'>,
            '',
          );
        }

        const pairKey = getAssignmentPairKey(pair);
        const perfLevel = mapCountToPerformance(countsByPair[pairKey] ?? null);

        return toDisplayTeacher(
          apiTeacher,
          perfLevel as EnumType<'fc_support_level'>,
          pair.classId,
        );
      });

      if (!cancelled) {
        setTeachersWithPerformance(enriched);
      }
    }

    loadPerformance();
    return () => {
      cancelled = true;
    };
  }, [sortedTeachers]);

  const teachersWithWhatsappStatus = useMemo(
    () =>
      teachersWithPerformance.map((row) => ({
        ...row,
        whatsappGroupStatus: getWhatsappGroupStatus(row.interactPayload),
      })),
    [teachersWithPerformance, getWhatsappGroupStatus],
  );

  return {
    displayTeachers,
    teachersWithPerformance,
    teachersWithWhatsappStatus,
  };
};
