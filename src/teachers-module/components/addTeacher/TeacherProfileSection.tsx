import React, { useState, useEffect, useRef } from "react";
import { IonIcon } from "@ionic/react";
import { calendarOutline } from "ionicons/icons";
import { ServiceConfig } from "../../../services/ServiceConfig";
import { format } from "date-fns";
import { TableTypes } from "../../../common/constants";
import "./TeacherProfileSection.css";
import { t } from "i18next";
import { Trans } from "react-i18next";
import CalendarPicker from "../../../common/CalendarPicker";

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
  teacher: TableTypes<"user">;
  classDoc: TableTypes<"class"> | undefined;
}

const TeacherProfileSection: React.FC<TeacherProfileSectionProps> = ({
  teacher,
  classDoc,
}) => {
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

    setStartDate(format(sevenDaysAgo, "yyyy-MM-dd"));
    setEndDate(format(today, "yyyy-MM-dd"));
    fetchJoinedDate();
  }, [teacher, classDoc]);

  const fetchJoinedDate = async () => {
    if (teacher?.id) {
      const classUser = await api.getTeacherJoinedDate(
        teacher.id,
        classDoc?.id!
      );
      if (classUser?.created_at) {
        setJoinedDate(format(new Date(classUser.created_at), "dd/MM/yyyy"));
      }
    }
  };
  const today = new Date().toISOString().split("T")[0];

  let maxEndDate: string;

  if (startDate) {
    // If startDate is today, set maxEndDate to today
    if (startDate === today) {
      maxEndDate = today;
    } else {
      // Add one month to the startDate
      const oneMonthLater = new Date(
        new Date(startDate).setMonth(new Date(startDate).getMonth() + 1)
      );

      // Ensure the end date does not exceed today
      maxEndDate =
        oneMonthLater > new Date()
          ? today
          : format(oneMonthLater, "yyyy-MM-dd");
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
          endDate
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
        const courseName = course?.name || "";

        const results = await api.getStudentResultsByAssignmentId(
          assignment.id
        );
        const filteredResultData = results.flatMap((result) =>
          result.result_data.filter((res) => res.id != null)
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
        const courseName = course?.name || "";

        const assignedStudents = await api.getAssignedStudents(assignment.id);
        const results = await api.getStudentResultsByAssignmentId(
          assignment.id
        );
        const filteredResultData = results.flatMap((result) =>
          result.result_data.filter((res) => res.id != null)
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
                ).toFixed(2) + "%"
              : "0%";

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
                ).toFixed(2) + "%"
              : "0%";

          // Overall completion score combining both class-wise and individual assignments
          const overallCompletionScore =
            expectedClassWiseCompletions + totalIndividualStudents > 0
              ? (
                  ((completedClassWise + totalIndividualCompletions) /
                    (expectedClassWiseCompletions + totalIndividualStudents)) *
                  100
                ).toFixed(2) + "%"
              : "0%";

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
        }
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

  const handleDateConfirm = (type: "start" | "end", date: string) => {
    if (type === "start") {
      setStartDate(date);
      setEndDate(null);
      setShowStartDatePicker(false);
    } else {
      setEndDate(date);
      setShowEndDatePicker(false);
    }
  };
  return (
    <div className="teacher-profile-section">
      <div className="teacher-profile-header">
        <img
          className={teacher.image ? "teacher-profile-img" : ""}
          src={teacher.image || "assets/icons/userIcon.png"}
          onError={(e: any) => (e.target.src = "assets/icons/userIcon.png")}
        />
        <div className="teacher-info">
          <div className="teacher-name">{teacher.name}</div>
          <p className="joined-date">
            {joinedDate ? t("Joined on") + "  :  " + joinedDate : ""}
          </p>
        </div>
      </div>

      {/* Date selection section */}
      <div className="date-selection">
        <div>
          <p>
            <Trans i18nKey="assignments_date_message" />
          </p>
        </div>
        <div className="date-icons">
          <div>
            <div>{t("Start Date")}</div>
            <div>
              {startDate ? format(new Date(startDate), "dd/MM/yyyy") : ""}
            </div>
          </div>
          <IonIcon
            icon={calendarOutline}
            className="calendar-icon"
            onClick={() => setShowStartDatePicker(true)}
          />
          <div className="vertical-line"></div>
          <div>
            <div>{t("End Date")}</div>
            <div>{endDate ? format(new Date(endDate), "dd/MM/yyyy") : ""}</div>
          </div>
          <IonIcon
            icon={calendarOutline}
            className="calendar-icon"
            onClick={() => setShowEndDatePicker(true)}
          />
        </div>
      </div>

      {startDate && endDate && (
        <div className="text-label">
          <span className="assignment-text"> {t("Assignments")}</span>
          <span className="date-text">
            {format(new Date(startDate), "dd/MM")}
          </span>
          {" - "}
          <span className="date-text">
            {format(new Date(endDate), "dd/MM")}
          </span>
        </div>
      )}

      {loading ? (
        <div className="no-data-text">{t("Loading...")}</div>
      ) : assignments.length > 0 ? (
        <div className="assignments-scroll-container">
          <table className="assignments-table">
            <thead>
              <tr>
                <th>{t("Course Name")}</th>
                <th>{t("Assigned")}</th>
                <th>{t("Completion Score")}</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment, index) => {
                const classWisePercentage = parseFloat(
                  assignment.classWiseCompletionScore
                );
                const individualPercentage = parseFloat(
                  assignment.individualCompletionScore
                );

                const averagePercentage = Math.round(
                  (classWisePercentage + individualPercentage) / 2
                );

                return (
                  <tr key={index}>
                    <td>{assignment.courseName}</td>
                    <td>
                      {assignment.classWiseAssigned +
                        assignment.individualAssigned}
                    </td>
                    <td>
                      <p>{`${averagePercentage}%`}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-data-text">{t("No Assignments found")}</div>
      )}

      {showStartDatePicker && (
        <CalendarPicker
          value={startDate}
          onConfirm={(date) => handleDateConfirm("start", date)}
          onCancel={() => setShowStartDatePicker(false)}
          mode="start"
          maxDate={new Date().toISOString().split("T")[0]}
        />
      )}
      {showEndDatePicker && (
        <CalendarPicker
          value={endDate}
          onConfirm={(date) => handleDateConfirm("end", date)}
          onCancel={() => setShowEndDatePicker(false)}
          mode="end"
          startDate={startDate}
          minDate={
            startDate ? startDate : new Date().toISOString().split("T")[0]
          }
          maxDate={maxEndDate}
        />
      )}
    </div>
  );
};

export default TeacherProfileSection;
