import { TableTypes } from "../../common/constants";

export interface ClassStudentResultInMapInterface {
  [lessonDocId: string]: TableTypes<"result">;
}

export interface DifferentGradesForCourseInterface {
  grades: TableTypes<"grade">[];
  courses: TableTypes<"course">[];
}
export interface LessonChapterInterface {
  lesson: TableTypes<"lesson">[];
  course: TableTypes<"course">[];
}

export interface StudentClassesAndSchoolsInterface {
  classes: TableTypes<"class">[];
  schools: TableTypes<"school">[];
}

export interface AssignmentsByAssignerAndClassInterface {
  classWiseAssignments: TableTypes<"assignment">[];
  individualAssignments: TableTypes<"assignment">[];
}
