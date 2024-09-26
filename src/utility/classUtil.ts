import { BANDS, TableTypes } from "../common/constants";
import { ServiceConfig } from "../services/ServiceConfig";
import { format, subWeeks } from "date-fns";

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
    const assignements = await this.api.getAssignmentByClassByDate(
      classId,
      currentDateTimeStamp,
      oneWeekBackTimeStamp
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
          ? totalScore / (assignmentResult?.length ?? 0)
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
    const assignements = await this.api.getAssignmentByClassByDate(
      classId,
      currentDateTimeStamp,
      oneWeekBackTimeStamp
    );
    const assignmentIds = (assignements?.map((asgmt) => asgmt.id) || []).slice(
      0,
      5
    );
    const _students = await this.api.getStudentsForClass(classId);
    const studentResultsPromises = _students.map(async (student) => {
      const results = await this.api.getStudentLastTenResult(
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
        const averageScore = totalScore / (selfPlayedLength+assignmentIds.length);

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
}
