import { useEffect, useRef, useState } from 'react';
import { ServiceConfig } from '../../services/ServiceConfig';
import type {
  ActivityRecency,
  UserType,
} from './useMessagesAudienceSelection.helpers';

type Params = {
  programId: string;
  summarySchoolIds: string[];
  summaryGradeIds: string[];
  isAllSchools: boolean;
  isAllGrades: boolean;
  userType: UserType;
  activityRecency: ActivityRecency;
};

export const useMessagesRecipientCount = ({
  programId,
  summarySchoolIds,
  summaryGradeIds,
  isAllSchools,
  isAllGrades,
  userType,
  activityRecency,
}: Params) => {
  const api = ServiceConfig.getI().apiHandler;
  const [roleBasedRecipientCount, setRoleBasedRecipientCount] = useState<
    number | null
  >(null);
  const [loadingRoleCount, setLoadingRoleCount] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;

    const fetchRoleBasedCount = async () => {
      if (!programId || summarySchoolIds.length === 0) {
        setRoleBasedRecipientCount(null);
        return;
      }

      setLoadingRoleCount(true);
      try {
        if (userType === 'student') {
          const isFullProgramSelection = isAllSchools && isAllGrades;
          if (activityRecency === 'all' && isFullProgramSelection) {
            const programMetrics =
              await api.getProgramMetricsForProgram(programId);
            if (requestIdRef.current !== requestId) return;

            const programStudentCount = Number(
              programMetrics?.onboarded_students ?? 0,
            );
            if (
              Number.isFinite(programStudentCount) &&
              programStudentCount > 0
            ) {
              setRoleBasedRecipientCount(programStudentCount);
              return;
            }
          }

          const studentMaps =
            summaryGradeIds.length > 0
              ? await api.getStudentsForSchoolsAndGrades(
                  summarySchoolIds,
                  summaryGradeIds,
                )
              : await api.getStudentsForSchools(summarySchoolIds);
          if (requestIdRef.current !== requestId) return;
          const studentIds = studentMaps.flatMap((school) =>
            (school.users ?? []).map((user) => user.id).filter(Boolean),
          );
          if (studentIds.length === 0) {
            setRoleBasedRecipientCount(0);
            return;
          }

          if (activityRecency === 'all') {
            setRoleBasedRecipientCount(studentIds.length);
            return;
          }

          if (activityRecency === 'active_7days') {
            const activeCount = await api.getActiveStudentsForSchoolsAndGrades(
              summarySchoolIds,
              summaryGradeIds,
            );
            if (requestIdRef.current !== requestId) return;
            setRoleBasedRecipientCount(activeCount);
            return;
          }

          const activeCount = await api.getActiveStudentsForSchoolsAndGrades(
            summarySchoolIds,
            summaryGradeIds,
          );
          if (requestIdRef.current !== requestId) return;
          const inactiveCount = Math.max(studentIds.length - activeCount, 0);
          setRoleBasedRecipientCount(inactiveCount);
          return;
        }

        if (userType === 'teacher') {
          const isFullProgramSelection = isAllSchools && isAllGrades;
          if (activityRecency === 'all' && isFullProgramSelection) {
            const programMetrics =
              await api.getProgramMetricsForProgram(programId);
            if (requestIdRef.current !== requestId) return;

            const programTeacherCount = Number(
              programMetrics?.onboarded_teachers ?? 0,
            );
            if (
              Number.isFinite(programTeacherCount) &&
              programTeacherCount > 0
            ) {
              setRoleBasedRecipientCount(programTeacherCount);
              return;
            }
          }

          const hasGradeSelection = summaryGradeIds.length > 0;
          const teacherMaps =
            hasGradeSelection && api.getTeachersForSchoolsAndGrades
              ? await api.getTeachersForSchoolsAndGrades(
                  summarySchoolIds,
                  summaryGradeIds,
                )
              : await api.getTeachersForSchools(summarySchoolIds);
          if (requestIdRef.current !== requestId) return;
          const teacherCount = teacherMaps.reduce(
            (total, school) => total + (school.users?.length ?? 0),
            0,
          );
          if (activityRecency === 'all') {
            setRoleBasedRecipientCount(teacherCount);
            return;
          }

          const activeTeacherCount =
            await api.getActiveTeachersCountForProgram7d(
              programId,
              summarySchoolIds,
              summaryGradeIds,
            );
          if (requestIdRef.current !== requestId) return;
          if (activityRecency === 'active_7days') {
            setRoleBasedRecipientCount(activeTeacherCount ?? teacherCount);
            return;
          }
          if (activityRecency === 'inactive_7days') {
            const inactiveCount =
              teacherCount - (activeTeacherCount ?? teacherCount);
            setRoleBasedRecipientCount(Math.max(inactiveCount, 0));
            return;
          }
          setRoleBasedRecipientCount(teacherCount);
          return;
        }

        const principals = await Promise.all(
          summarySchoolIds.map((schoolId: string) =>
            api.getPrincipalsForSchool(schoolId),
          ),
        );
        if (requestIdRef.current !== requestId) return;
        setRoleBasedRecipientCount(
          principals.reduce(
            (total, schoolUsers) => total + (schoolUsers?.length ?? 0),
            0,
          ),
        );
      } catch {
        if (requestIdRef.current !== requestId) return;
        setRoleBasedRecipientCount(null);
      } finally {
        if (requestIdRef.current === requestId) setLoadingRoleCount(false);
      }
    };

    void fetchRoleBasedCount();
  }, [
    activityRecency,
    api,
    programId,
    summaryGradeIds,
    summarySchoolIds,
    isAllGrades,
    isAllSchools,
    userType,
  ]);

  return {
    displayRecipientCount: roleBasedRecipientCount,
    loadingRoleCount,
    roleBasedRecipientCount,
  };
};
