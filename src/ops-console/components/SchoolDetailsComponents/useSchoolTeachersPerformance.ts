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
      const enriched: DisplayTeacher[] = await Promise.all(
        sortedTeachers.map(async (apiTeacher) => {
          const teacherId = apiTeacher.user?.id;
          const classId =
            (apiTeacher as { classId?: string }).classId ??
            apiTeacher.classWithidname?.id ??
            '';

          if (!teacherId || !classId) {
            return toDisplayTeacher(
              apiTeacher,
              PerformanceLevel.NOT_ASSIGNING as EnumType<'fc_support_level'>,
              '',
            );
          }

          let perfLevel = PerformanceLevel.NOT_TRACKED;
          try {
            const activeApi = ServiceConfig.getI().apiHandler;
            const count = await activeApi.getRecentAssignmentCountByTeacher(
              teacherId,
              classId,
            );
            perfLevel = mapCountToPerformance(count);
          } catch (error) {
            logger.error('Failed to load teacher performance count:', {
              teacherId,
              classId,
              error,
            });
          }

          return toDisplayTeacher(
            apiTeacher,
            perfLevel as EnumType<'fc_support_level'>,
            classId,
          );
        }),
      );

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
