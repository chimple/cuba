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
    console.log(parseFloat(timeSpent.toFixed(2)));
    console.log(totalScore / (assignmentResult?.length ?? 0));

    const _students = await this.api.getStudentsForClass(classId);
    const totalStudents = _students.length;
    const totalAssignments = assignmentIds.length;
    console.log("HHHHHHHHHHHHHHHHHHHHHh");
    console.log(totalAssignments);
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

    console.log(
      `Number of students who completed all assignments: ${studentsWhoCompletedAllAssignments}`
    );
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

  async getStudent(classId: string) {
    const _students = await this.api.getStudentsForClass(classId);

    for (const student of _students) {
      const result = await this.api.getStudentLastTenResult(student.id);
      console.log(result);
    }
  }

  public async divideStudents(classId: string) {
    var greenGroup: Map<string, TableTypes<"user"> | TableTypes<"result">[]>[] =
      [];
    var yellowGroup: Map<
      string,
      TableTypes<"user"> | TableTypes<"result">[]
    >[] = [];
    var redGroup: Map<string, TableTypes<"user"> | TableTypes<"result">[]>[] =
      [];
    var greyGroup: Map<string, TableTypes<"user"> | TableTypes<"result">[]>[] =
      [];
    var currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1);
    const oneWeekBack = new Date(currentDate);
    oneWeekBack.setDate(currentDate.getDate() - 8);
    const oneWeekBackTimeStamp = oneWeekBack
      .toISOString()
      .replace("T", " ")
      .replace("Z", "+00");
    const _students = await this.api.getStudentsForClass(classId);
    for (const student of _students) {
      console.log(student);
      const results = await this.api.getStudentLastTenResult(student.id);
      if (results.length == 0) {
        greyGroup.push(
          new Map<string, TableTypes<"user"> | TableTypes<"result">[]>([
            ["student", student],
            ["results", results],
          ])
        );
      } else if (results[0].created_at <= oneWeekBackTimeStamp) {
        greyGroup.push(
          new Map<string, TableTypes<"user"> | TableTypes<"result">[]>([
            ["student", student],
            ["results", results],
          ])
        );
      } else {
        var totalScore = 0;
        results.forEach((result) => {
          totalScore = totalScore + (result.score ?? 0);
        });
        if (totalScore / results.length >= 70) {
          greenGroup.push(
            new Map<string, TableTypes<"user"> | TableTypes<"result">[]>([
              ["student", student],
              ["results", results],
            ])
          );
        } else if (totalScore / results.length <= 49) {
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
    }
    var groups: Map<string, any> = new Map();
    groups.set(BANDS.GREENGROUP, greenGroup);
    groups.set(BANDS.GREYGROUP, greyGroup);
    groups.set(BANDS.REDGROUP, redGroup);
    groups.set(BANDS.YELLOWGROUP, yellowGroup);
    return groups;
  }
}
