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
      console.log('FFFFFFFFFFFFFFFFFFFFFFFFF')
      console.log(result)
    }
  }

  public async divideStudents(classId: string) {
    await this.getAssignments(classId);
    await this.getStudent(classId);
  }
}
