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
  userType: UserType;
  activityRecency: ActivityRecency;
  estimatedRecipientCount: number;
};

export const useMessagesRecipientCount = ({
  programId,
  summarySchoolIds,
  summaryGradeIds,
  userType,
  activityRecency,
  estimatedRecipientCount,
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
          const studentMaps = await api.getStudentsForSchools(summarySchoolIds);
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
          const mvRows = await api.getOpsStudentPerformanceBands({
            studentIds,
          });
          if (requestIdRef.current !== requestId) return;
          const activityByStudentId = new Map<string, number>();
          mvRows.forEach((row) => {
            const studentId = String(row.student_id ?? '').trim();
            if (!studentId) return;
            const timeSpent = Number(row.time_spent_seconds_7d ?? 0);
            const existing = activityByStudentId.get(studentId) ?? 0;
            if (timeSpent > existing)
              activityByStudentId.set(studentId, timeSpent);
          });
          const nextCount = studentIds.filter((studentId) => {
            const timeSpent = activityByStudentId.get(studentId) ?? 0;
            const isActive = timeSpent > 0;
            if (activityRecency === 'active_7d') return isActive;
            if (activityRecency === 'inactive_7d') return !isActive;
            return true;
          }).length;
          setRoleBasedRecipientCount(nextCount);
          return;
        }

        if (userType === 'teacher') {
          const teacherMaps = await api.getTeachersForSchools(summarySchoolIds);
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
              summaryGradeIds,
            );
          if (requestIdRef.current !== requestId) return;
          if (activityRecency === 'active_7d') {
            setRoleBasedRecipientCount(activeTeacherCount ?? teacherCount);
            return;
          }
          if (activityRecency === 'inactive_7d') {
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
    userType,
  ]);

  const displayRecipientCount =
    userType === 'student'
      ? activityRecency === 'all'
        ? estimatedRecipientCount
        : roleBasedRecipientCount
      : roleBasedRecipientCount;

  return { displayRecipientCount, loadingRoleCount, roleBasedRecipientCount };
};
