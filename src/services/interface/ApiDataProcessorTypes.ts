import { TableTypes } from "../../common/constants";

export interface ClassStudentResultInMap {
  [lessonDocId: string]: TableTypes<"result">;
}

export interface IDifferentGradesForCourseInterface {
  grades: TableTypes<"grade">[];
  courses: TableTypes<"course">[];
}
export interface ILessonChapterInterface {
  lesson: TableTypes<"lesson">[];
  course: TableTypes<"course">[];
}

export interface IStudentClassesAndSchools {
  classes: TableTypes<"class">[];
  schools: TableTypes<"school">[];
}

export interface IAssignmentsByAssignerAndClass {
  classWiseAssignments: TableTypes<"assignment">[];
  individualAssignments: TableTypes<"assignment">[];
}
