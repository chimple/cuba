import React, { useState, useEffect } from 'react';
import { ServiceConfig } from '../../services/ServiceConfig';
import { format } from 'date-fns';
import { TableTypes } from '../../common/constants';
import { t } from 'i18next';
import { Trans } from 'react-i18next';
import CalendarPicker from '../../common/CalendarPicker';

interface AssignmentDetail {
  courseName: string;
  classWiseAssigned: number;
  individualAssigned: number;
  completedClassWise: number;
  completedIndividual: number;
  classWiseCompletionScore: string;
  individualCompletionScore: string;
  overallCompletionScore: string;
}

interface TeacherProfileSectionProps {
  teacher: TableTypes<'user'>;
  classDoc: TableTypes<'class'> | undefined;
}

export const useTeacherProfileSection = ({
  teacher,
  classDoc,
}: TeacherProfileSectionProps) => {
  const [joinedDate, setJoinedDate] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [assignments, setAssignments] = useState<AssignmentDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const api = ServiceConfig.getI()?.apiHandler;

  useEffect(() => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    setStartDate(format(sevenDaysAgo, 'yyyy-MM-dd'));
    setEndDate(format(today, 'yyyy-MM-dd'));
    fetchJoinedDate();
  }, [teacher, classDoc]);

  const fetchJoinedDate = async () => {
    if (teacher?.id) {
      const classUser = await api.getTeacherJoinedDate(
        teacher.id,
        classDoc?.id!,
      );
      if (classUser?.created_at) {
        setJoinedDate(format(new Date(classUser.created_at), 'dd/MM/yyyy'));
      }
    }
  };
  const today = new Date().toISOString().split('T')[0];

  let maxEndDate: string;

  if (startDate) {
    // If startDate is today, set maxEndDate to today
    if (startDate === today) {
      maxEndDate = today;
    } else {
      // Add one month to the startDate
      const oneMonthLater = new Date(
        new Date(startDate).setMonth(new Date(startDate).getMonth() + 1),
      );

      // Ensure the end date does not exceed today
      maxEndDate =
        oneMonthLater > new Date()
          ? today
          : format(oneMonthLater, 'yyyy-MM-dd');
    }
  } else {
    maxEndDate = today;
  }
  const fetchAssignments = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    if (teacher?.id && classDoc?.id && startDate && endDate) {
      const { classWiseAssignments, individualAssignments } =
        await api.getAssignmentsByAssignerAndClass(
          teacher.id,
          classDoc.id,
          startDate,
          endDate,
        );

      const courseAssignmentsMap: Record<
        string,
        {
          classWiseAssigned: number;
          individualAssigned: number;
          totalClassWiseStudents: number;
          individualAssignmentData: {
            [assignmentId: string]: {
              totalStudents: number;
              completedStudents: number;
            };
          };
          completedClassWise: number;
        }
      > = {};

      // Get total students for the class
      const totalStudents = await api.getStudentsForClass(classDoc.id);

      // class-wise assignments
      for (const assignment of classWiseAssignments) {
        const course = await api.getCourse(assignment.course_id!);
        const courseName = course?.name || '';

        const results = await api.getStudentResultsByAssignmentId(
          assignment.id,
        );
        const filteredResultData = results.flatMap((result) =>
          result.result_data.filter((res) => res.id != null),
        );

        if (!courseAssignmentsMap[courseName]) {
          courseAssignmentsMap[courseName] = {
            classWiseAssigned: 0,
            individualAssigned: 0,
            totalClassWiseStudents: totalStudents.length,
            individualAssignmentData: {},
            completedClassWise: 0,
          };
        }

        courseAssignmentsMap[courseName].classWiseAssigned += 1;
        courseAssignmentsMap[courseName].completedClassWise +=
          filteredResultData.length;
      }

      // individual assignments
      for (const assignment of individualAssignments) {
        const course = await api.getCourse(assignment.course_id!);
        const courseName = course?.name || '';

        const assignedStudents = await api.getAssignedStudents(assignment.id);
        const results = await api.getStudentResultsByAssignmentId(
          assignment.id,
        );
        const filteredResultData = results.flatMap((result) =>
          result.result_data.filter((res) => res.id != null),
        );

        if (!courseAssignmentsMap[courseName]) {
          courseAssignmentsMap[courseName] = {
            classWiseAssigned: 0,
            individualAssigned: 0,
            totalClassWiseStudents: totalStudents.length,
            individualAssignmentData: {},
            completedClassWise: 0,
          };
        }

        // Add assignment-specific student data
        courseAssignmentsMap[courseName].individualAssignmentData[
          assignment.id
        ] = {
          totalStudents: assignedStudents.length,
          completedStudents: filteredResultData.length,
        };

        courseAssignmentsMap[courseName].individualAssigned += 1;
      }

      // Calculate assignments with details and completion percentages
      const assignmentWithDetails = Object.entries(courseAssignmentsMap).map(
        ([
          courseName,
          {
            classWiseAssigned,
            individualAssigned,
            totalClassWiseStudents,
            individualAssignmentData,
            completedClassWise,
          },
        ]) => {
          const expectedClassWiseCompletions =
            classWiseAssigned * totalClassWiseStudents;

          const classWisePercentage =
            expectedClassWiseCompletions > 0
              ? (
                  (completedClassWise / expectedClassWiseCompletions) *
                  100
                ).toFixed(2) + '%'
              : '0%';

          // Calculate individual completion based on total assignments
          let totalIndividualStudents = 0;
          let totalIndividualCompletions = 0;

          for (const assignmentId in individualAssignmentData) {
            totalIndividualStudents +=
              individualAssignmentData[assignmentId].totalStudents;
            totalIndividualCompletions +=
              individualAssignmentData[assignmentId].completedStudents;
          }

          const individualPercentage =
            totalIndividualStudents > 0
              ? (
                  (totalIndividualCompletions / totalIndividualStudents) *
                  100
                ).toFixed(2) + '%'
              : '0%';

          // Overall completion score combining both class-wise and individual assignments
          const overallCompletionScore =
            expectedClassWiseCompletions + totalIndividualStudents > 0
              ? (
                  ((completedClassWise + totalIndividualCompletions) /
                    (expectedClassWiseCompletions + totalIndividualStudents)) *
                  100
                ).toFixed(2) + '%'
              : '0%';

          return {
            courseName,
            classWiseAssigned,
            individualAssigned,
            completedClassWise,
            completedIndividual: totalIndividualCompletions,
            classWiseCompletionScore: classWisePercentage,
            individualCompletionScore: individualPercentage,
            overallCompletionScore,
          };
        },
      );

      setAssignments(assignmentWithDetails);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchAssignments();
    }
  }, [startDate, endDate]);

  const handleDateConfirm = (type: 'start' | 'end', date: string) => {
    if (type === 'start') {
      setStartDate(date);
      setEndDate(null);
      setShowStartDatePicker(false);
    } else {
      setEndDate(date);
      setShowEndDatePicker(false);
    }
  };
  return {
    CalendarPicker,
    Trans,
    assignments,
    endDate,
    format,
    handleDateConfirm,
    joinedDate,
    loading,
    maxEndDate,
    parseFloat,
    setShowEndDatePicker,
    setShowStartDatePicker,
    showEndDatePicker,
    showStartDatePicker,
    startDate,
    t,
    teacher,
  };
};
