import { DBSQLiteValues } from "@capacitor-community/sqlite";
import {
  ClassStudentResultInMapInterface,
  DifferentGradesForCourseInterface,
  AssignmentsByAssignerAndClassInterface,
  LessonChapterInterface,
  StudentClassesAndSchoolsInterface,
} from "./ApiDataProcessorTypes";

export default class ApiDataProcessor {
  public static dataProcessorGetStudentResultInMap(
    res: DBSQLiteValues | undefined
  ): ClassStudentResultInMapInterface {
    const data: ClassStudentResultInMapInterface = {};

    if (!res || !res.values || res.values.length < 1) {
      return data;
    }
    const resultMap = {};
    for (const data of res.values) {
      resultMap[data.lesson_id] = data;
    }
    return data;
  }

  public static dataProcessorGetDifferentGradesForCourse(
    res: DBSQLiteValues | undefined
  ): DifferentGradesForCourseInterface {
    const gradeMap: DifferentGradesForCourseInterface = {
      grades: [],
      courses: [],
    };

    for (const data of res?.values ?? []) {
      const grade = JSON.parse(data.grade);
      delete data.grade;
      const course = data;
      const gradeAlreadyExists = gradeMap.grades.find(
        (_grade) => _grade.id === grade.id
      );
      if (gradeAlreadyExists) continue;
      gradeMap.courses.push(course);
      gradeMap.grades.push(grade);
    }

    gradeMap.grades.sort((a, b) => {
      //Number.MAX_SAFE_INTEGER is using when sortIndex is not found GRADES (i.e it gives default value)
      const sortIndexA = a.sort_index || Number.MAX_SAFE_INTEGER;
      const sortIndexB = b.sort_index || Number.MAX_SAFE_INTEGER;

      return sortIndexA - sortIndexB;
    });
    return gradeMap as any;
  }

  public static dataProcessorGetLessonFromChapter(
    res: DBSQLiteValues | undefined
  ): LessonChapterInterface {
    const data: LessonChapterInterface = {
      lesson: [],
      course: [],
    };
    if (!res || !res.values || res.values.length < 1) return data;
    data.lesson = res.values;
    data.course = res.values.map((val) => JSON.parse(val.course));
    return data;
  }

  public static dataProcessorGetStudentClassesAndSchools(
    res: DBSQLiteValues | undefined
  ): StudentClassesAndSchoolsInterface {
    const data: StudentClassesAndSchoolsInterface = {
      classes: [],
      schools: [],
    };

    if (!res || !res.values || res.values.length < 1) return data;
    data.classes = res.values;
    data.schools = res.values.map((val) => JSON.parse(val.school));
    return data;
  }

  public static dataProcessorGetStudentProgress(
    res: DBSQLiteValues | undefined
  ): Map<string, string> {
    let resultMap: Map<string, string> = new Map<string, string>();
    if (res && res.values) {
      res.values.forEach((result) => {
        const courseId = result.course_id;
        if (!resultMap[courseId]) {
          resultMap[courseId] = [];
        }
        resultMap[courseId].push(result);
      });
    }
    return resultMap;
  }

  public static dataProcessorGetChapterByLesson(
    res: DBSQLiteValues | undefined,
    classesCourse: any
  ) {
    if (!res || !res.values || res.values.length < 1) return;
    const classCourseIds = new Set(classesCourse.map((course) => course.id));
    const matchedLesson = res.values.find((lesson) =>
      classCourseIds.has(lesson.course_id)
    );

    return matchedLesson ? matchedLesson.chapter_id : res.values[0].chapter_id;
  }

  public static dataProcessorGetAssignmentsByAssignerAndClass(
    res: DBSQLiteValues | undefined
  ): AssignmentsByAssignerAndClassInterface {
    const assignments = res?.values ?? [];
    console.log("assignments..", assignments);
    const classWiseAssignments = assignments.filter(
      (assignment) => assignment.is_class_wise
    );
    const individualAssignments = assignments.filter(
      (assignment) => !assignment.is_class_wise
    );

    return { classWiseAssignments, individualAssignments };
  }

  public static dataProcessorGetAssignedStudents(
    res: DBSQLiteValues | undefined
  ): string[] {
    let userIds: string[] = [];

    if (res?.values) {
      userIds = res?.values.map((row: { user_id: string }) => row.user_id);
    }
    console.log("userids..", userIds);

    return userIds;
  }
}
