import { BANDS, TableTypes } from "../common/constants";
import { ServiceConfig } from "../services/ServiceConfig";
import { format, subWeeks } from "date-fns";

export class StudentUtil {
  private api = ServiceConfig.getI().apiHandler;

  async getAssignments(classId: string) {
    var currentDate = new Date();
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
    const res = await this.api.getAssignmentByClassByDate(
      classId,
      currentDateTimeStamp,
      oneWeekBackTimeStamp
    );
    return res;
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
