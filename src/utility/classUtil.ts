import { start } from "repl";
import { BANDS, TableTypes } from "../common/constants";
import { ServiceConfig } from "../services/ServiceConfig";
import { addDays, addMonths, format, subDays, subWeeks } from "date-fns";

export class ClassUtil {
  private api = ServiceConfig.getI().apiHandler;

  async getWeeklySummary(classId: string) {
    var currentDate = new Date();
    var totalScore = 0;
    var timeSpent = 0;
    currentDate.setDate(currentDate.getDate() + 1);
    var currentDateTimeStamp = currentDate
      .toISOString()
      .replace("T", " ")
      .replace("Z", "+00");

    const oneWeekBack = new Date(currentDate);
    oneWeekBack.setDate(currentDate.getDate() - 8);
    const oneWeekBackTimeStamp = oneWeekBack
      .toISOString()
      .replace("T", " ")
      .replace("Z", "+00");
    const assignements = await this.api.getAssignmentOrLiveQuizByClassByDate(
      classId,
      currentDateTimeStamp,
      oneWeekBackTimeStamp,
      true,
      false
    );
    const assignmentIds = assignements?.map((asgmt) => asgmt.id) || [];
    const assignmentResult =
      await this.api.getResultByAssignmentIds(assignmentIds);
    assignmentResult?.forEach((res) => {
      totalScore = totalScore + (res.score ?? 0);
      timeSpent = timeSpent + (res.time_spent ?? 0) / 60;
    });
    const _students = await this.api.getStudentsForClass(classId);
    const totalStudents = _students.length;
    const totalAssignments = assignmentIds.length;
    const studentsWithCompletedAssignments = assignmentResult?.reduce(
      (acc, result) => {
        const { student_id, assignment_id } = result;
        if (!acc[student_id]) {
          acc[student_id] = new Set();
        }
        acc[student_id].add(assignment_id ?? "");
        return acc;
      },
      {} as { [key: string]: Set<string> }
    );
    const studentsWhoCompletedAllAssignments = studentsWithCompletedAssignments
      ? Object.keys(studentsWithCompletedAssignments).filter((studentId) => {
          return (
            studentsWithCompletedAssignments[studentId].size ===
            totalAssignments
          );
        }).length
      : 0;
    const assignmentsWithCompletedStudents = assignmentResult?.reduce(
      (acc, result) => {
        const { student_id, assignment_id } = result;
        if (assignment_id) {
          if (!acc[assignment_id]) {
            acc[assignment_id] = new Set();
          }
          acc[assignment_id].add(student_id);
        }
        return acc;
      },
      {} as { [key: string]: Set<string> }
    );
    const assignmentsCompletedByAllStudents = assignmentsWithCompletedStudents
      ? Object.keys(assignmentsWithCompletedStudents).filter((assignmentId) => {
          return (
            assignmentsWithCompletedStudents[assignmentId].size ===
            totalStudents
          );
        }).length
      : 0;
    return {
      assignments: {
        asgnmetCmptd: assignmentsCompletedByAllStudents,
        totalAssignments: totalAssignments,
      },
      students: {
        stdCompletd: studentsWhoCompletedAllAssignments,
        totalStudents: totalStudents,
      },
      timeSpent: parseFloat(timeSpent.toFixed(2)),
      averageScore:
        assignmentResult?.length ?? 0 > 0
          ? parseFloat(
              (totalScore / (assignmentResult?.length ?? 0)).toFixed(1)
            )
          : 0,
    };
  }
  public async divideStudents(classId: string) {
    const greenGroup: Map<
      string,
      TableTypes<"user"> | TableTypes<"result">[]
    >[] = [];
    const yellowGroup: Map<
      string,
      TableTypes<"user"> | TableTypes<"result">[]
    >[] = [];
    const redGroup: Map<string, TableTypes<"user"> | TableTypes<"result">[]>[] =
      [];
    const greyGroup: Map<
      string,
      TableTypes<"user"> | TableTypes<"result">[]
    >[] = [];
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1);

    const oneWeekBack = new Date(currentDate);
    oneWeekBack.setDate(currentDate.getDate() - 8);
    var currentDateTimeStamp = currentDate
      .toISOString()
      .replace("T", " ")
      .replace("Z", "+00");
    const oneWeekBackTimeStamp = oneWeekBack
      .toISOString()
      .replace("T", " ")
      .replace("Z", "+00");
    const assignements = await this.api.getAssignmentOrLiveQuizByClassByDate(
      classId,
      currentDateTimeStamp,
      oneWeekBackTimeStamp,
      true,
      false
    );
    const assignmentIds = (assignements?.map((asgmt) => asgmt.id) || []).slice(
      0,
      5
    );
    const _students = await this.api.getStudentsForClass(classId);
    const studentResultsPromises = _students.map(async (student) => {
      const results = await this.api.getStudentLastTenResults(
        student.id,
        assignmentIds
      );
      const selfPlayedLength = results.filter(
        (result) => result.assignment_id === null
      ).length;
      if (
        results.length === 0 ||
        results[0].created_at <= oneWeekBackTimeStamp
      ) {
        greyGroup.push(
          new Map<string, TableTypes<"user"> | TableTypes<"result">[]>([
            ["student", student],
            ["results", results],
          ])
        );
      } else {
        const totalScore = results.reduce(
          (acc, result) => acc + (result.score ?? 0),
          0
        );
        const averageScore =
          totalScore / (selfPlayedLength + assignmentIds.length);

        if (averageScore >= 70) {
          greenGroup.push(
            new Map<string, TableTypes<"user"> | TableTypes<"result">[]>([
              ["student", student],
              ["results", results],
            ])
          );
        } else if (averageScore <= 49) {
          redGroup.push(
            new Map<string, TableTypes<"user"> | TableTypes<"result">[]>([
              ["student", student],
              ["results", results],
            ])
          );
        } else {
          yellowGroup.push(
            new Map<string, TableTypes<"user"> | TableTypes<"result">[]>([
              ["student", student],
              ["results", results],
            ])
          );
        }
      }
    });
    await Promise.all(studentResultsPromises);

    const groups: Map<string, any> = new Map();
    groups.set(BANDS.GREENGROUP, greenGroup);
    groups.set(BANDS.GREYGROUP, greyGroup);
    groups.set(BANDS.REDGROUP, redGroup);
    groups.set(BANDS.YELLOWGROUP, yellowGroup);

    return groups;
  }
  private getDaysInRange(startDate: Date, endDate: Date): string[] {
    const days: string[] = [];
    var currentDate = new Date(startDate);
    endDate = addDays(new Date(endDate), 1);
    while (currentDate < endDate) {
      days.push(currentDate.toLocaleDateString("en-US", { weekday: "long" }));
      currentDate = addDays(new Date(currentDate), 1);
    }

    return days;
  }
  private getMonthsInRange(startDate: Date, endDate: Date): string[] {
    const months: string[] = [];
    let currentDate = new Date(startDate);
    endDate = addDays(new Date(endDate), 1);

    while (currentDate < endDate) {
      const monthName = currentDate.toLocaleDateString("en-US", {
        month: "long",
      });
      if (!months.includes(monthName)) {
        months.push(monthName); // Add month name if it's not already in the list
      }
      currentDate = addMonths(new Date(currentDate), 1);
    }

    return months;
  }
  public async getWeeklyReport(
    classId: string,
    startDate: Date,
    endDate: Date
  ) {
    const adjustedStartDate = subDays(new Date(startDate), 1);
    const adjustedEndDate = addDays(new Date(endDate), 1);
    const daysInRange = this.getDaysInRange(startDate, endDate);
    const startTimeStamp = adjustedStartDate
      .toISOString()
      .replace("T", " ")
      .replace("Z", "+00");
    const endTimeStamp = adjustedEndDate
      .toISOString()
      .replace("T", " ")
      .replace("Z", "+00");
    const _students = await this.api.getStudentsForClass(classId);

    const resultsByStudent = new Map<
      string,
      { name: string; results: Record<string, any[]> }
    >();

    _students.forEach((student) => {
      resultsByStudent.set(student.id, {
        name: student.name || "",
        results: {},
      });
      daysInRange.forEach((day) => {
        resultsByStudent.get(student.id)!.results[day] = [];
      });
    });

    for (const student of _students) {
      const res = await this.api.getStudentResultByDate(
        student.id,
        startTimeStamp,
        endTimeStamp
      );

      res?.forEach((result) => {
        const resultDate = new Date(result.created_at);
        const dayName = resultDate.toLocaleDateString("en-US", {
          weekday: "long",
        });

        if (resultsByStudent.get(student.id)?.results[dayName]) {
          resultsByStudent.get(student.id)!.results[dayName].push(result);
        }
      });
    }
    const daysMapArray: Map<
      string,
      { headerName: string; startAt: string; endAt: string }
    >[] = (daysInRange || []).map((day) => {
      const daysMap = new Map<
        string,
        { headerName: string; startAt: string; endAt: string }
      >();

      daysMap.set(day, {
        headerName: day,
        startAt: "",
        endAt: "",
      });

      return daysMap;
    });
    return {
      ReportData: resultsByStudent,
      HeaderData: daysMapArray,
    };
  }

  public async getMonthlyReport(
    classId: string,
    startDate: Date,
    endDate: Date
  ) {
    console.log('DDDDDDDDDDDDD')
    console.log(startDate)
    console.log(endDate)
    const monthsInRange = this.getMonthsInRange(startDate, endDate);
    const adjustedStartDate = subDays(new Date(startDate), 1);
    const adjustedEndDate = addDays(new Date(endDate), 1);
    const startTimeStamp = adjustedStartDate
      .toISOString()
      .replace("T", " ")
      .replace("Z", "+00");
    const endTimeStamp = adjustedEndDate
      .toISOString()
      .replace("T", " ")
      .replace("Z", "+00");
    const _students = await this.api.getStudentsForClass(classId);

    const resultsByStudent = new Map<
      string,
      { name: string; results: Record<string, any[]> }
    >();
    _students.forEach((student) => {
      resultsByStudent.set(student.id, {
        name: student.name || "",
        results: {},
      });
      monthsInRange.forEach((month) => {
        resultsByStudent.get(student.id)!.results[month] = [];
      });
    });

    for (const student of _students) {
      const res = await this.api.getStudentResultByDate(
        student.id,
        startTimeStamp,
        endTimeStamp
      );

      res?.forEach((result) => {
        const resultDate = new Date(result.created_at);
        const monthName = resultDate.toLocaleDateString("en-US", {
          month: "long",
        });
        if (resultsByStudent.get(student.id)?.results[monthName]) {
          resultsByStudent.get(student.id)!.results[monthName].push(result);
        }
      });
    }
    const monthsMapArray: Map<
      string,
      { headerName: string; startAt: string; endAt: string }
    >[] = (monthsInRange || []).map((month) => {
      const monthsMap = new Map<
        string,
        { headerName: string; startAt: string; endAt: string }
      >();

      monthsMap.set(month, {
        headerName: month,
        startAt: "",
        endAt: "",
      });

      return monthsMap;
    });
    return {
      ReportData: resultsByStudent,
      HeaderData: monthsMapArray,
    };
  }
  public async getAssignmentOrLiveQuizReport(
    classId: string,
    startDate: Date,
    endDate: Date,
    isLiveQuiz: boolean
  ) {
    const adjustedStartDate = subDays(new Date(startDate), 1);
    const adjustedEndDate = addDays(new Date(endDate), 1);

    const startTimeStamp = adjustedStartDate
      .toISOString()
      .replace("T", " ")
      .replace("Z", "+00");
    const endTimeStamp = adjustedEndDate
      .toISOString()
      .replace("T", " ")
      .replace("Z", "+00");
    const _students = await this.api.getStudentsForClass(classId);

    const _assignments = await this.api.getAssignmentOrLiveQuizByClassByDate(
      classId,
      endTimeStamp,
      startTimeStamp,
      false,
      isLiveQuiz
    );

    let assignmentIds = _assignments?.map((asgmt) => asgmt.id) || [];
    const lessonIds = [
      ...new Set(_assignments?.map((res) => res.lesson_id) || []),
    ];
    const assignmentResults =
      await this.api.getResultByAssignmentIds(assignmentIds);
    const lessonDetails = await this.api.getLessonsBylessonIds(lessonIds);

    const assignmentMapArray: Map<
      string,
      { headerName: string; startAt: string; endAt: string }
    >[] = (_assignments || []).map((assignment) => {
      const lesson = lessonDetails?.find(
        (lesson) => lesson.id === assignment.lesson_id
      );

      const assignmentMap = new Map<
        string,
        { headerName: string; startAt: string; endAt: string }
      >();

      assignmentMap.set(assignment.id, {
        headerName: lesson?.name ?? "",
        startAt: assignment.starts_at,
        endAt: assignment.ends_at ?? "",
      });

      return assignmentMap;
    });
    const resultsByStudent = new Map<
      string,
      { name: string; results: Record<string, any[]> }
    >();

    _students.forEach((student) => {
      resultsByStudent.set(student.id, {
        name: student.name || "",
        results: {},
      });
      assignmentIds.forEach((assignmentId) => {
        resultsByStudent.get(student.id)!.results[assignmentId] = [];
      });
    });

    assignmentResults?.forEach((result) => {
      const studentId = result.student_id;
      const assignmentId = result.assignment_id;

      if (resultsByStudent.get(studentId)?.results[assignmentId ?? ""]) {
        resultsByStudent
          .get(studentId)!
          .results[assignmentId ?? ""].push(result);
      }
    });
    return {
      ReportData: resultsByStudent,
      HeaderData: assignmentMapArray,
    };
  }
}
