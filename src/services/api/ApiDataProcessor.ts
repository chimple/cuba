import {
  DifferentGradesForCourseInterface,
  LessonChapterInterface,
  StudentClassesAndSchoolsInterface,
} from "./ApiDataProcessorTypes";

export default class ApiDataProcessor {
  public static dataProcessorGetStudentResultInMap<
    T extends { lesson_id: string },
  >(
    response: T[]
  ): {
    [key: string]: T;
  } {
    if (!response || response.length < 1) {
      return {};
    }

    const resultMap: { [key: string]: T } = {};
    for (const data of response) {
      if (data.lesson_id !== undefined) {
        resultMap[data.lesson_id] = data;
      }
    }
    return resultMap;
  }

  public static dataProcessorGetDifferentGradesForCourse(
    response: any
  ): DifferentGradesForCourseInterface {
    const gradeMap: DifferentGradesForCourseInterface = {
      grades: [],
      courses: [],
    };

    for (const data of response ?? []) {
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
      const sortIndexA = a.sort_index || Number.MAX_SAFE_INTEGER;
      const sortIndexB = b.sort_index || Number.MAX_SAFE_INTEGER;
      return sortIndexA - sortIndexB;
    });
    return gradeMap as any;
  }

  public static dataProcessorGetLessonFromChapter(
    response: any
  ): LessonChapterInterface {
    const data: LessonChapterInterface = {
      lesson: [],
      course: [],
    };
    if (!response || response.length < 1) return data;
    data.lesson = response;
    data.course = response.map((val) => JSON.parse(val.course));
    return data;
  }

  public static dataProcessorGetStudentClassesAndSchools(
    response: any
  ): StudentClassesAndSchoolsInterface {
    const data: StudentClassesAndSchoolsInterface = {
      classes: [],
      schools: [],
    };

    if (!response || response.length < 1) return data;
    data.classes = response;
    data.schools = response.map((val) => JSON.parse(val.school));
    return data;
  }

  public static dataProcessorGetStudentProgress<
    T extends { course_id: string },
  >(response: T[]): Map<string, string> {
    let resultMap: Map<string, string> = new Map<string, string>();
    if (response && response.length > 0) {
      response.forEach((result) => {
        const courseId = result.course_id;
        if (!resultMap[courseId]) {
          resultMap[courseId] = [];
        }
        resultMap[courseId].push(result);
      });
    }
    return resultMap;
  }

  public static dataProcessorGetChapterByLesson<
    T extends { course_id: string; chapter_id: string },
    U extends { id: string },
  >(response: T[], classesCourse: U[]) {
    if (!response || response.length < 1) return;
    const classCourseIds = new Set(classesCourse.map((course) => course.id));
    const matchedLesson = response.find((lesson) =>
      classCourseIds.has(lesson.course_id)
    );

    return matchedLesson ? matchedLesson.chapter_id : response[0].chapter_id;
  }

  public static dataProcessorGetAssignmentsByAssignerAndClass<
    T extends { is_class_wise: boolean },
  >(response: T[]): { classWiseAssignments: T[]; individualAssignments: T[] } {
    const assignments = response ?? [];
    console.log("assignments..", assignments);

    const classWiseAssignments = assignments.filter(
      (assignment) => assignment.is_class_wise
    );
    const individualAssignments = assignments.filter(
      (assignment) => !assignment.is_class_wise
    );

    return { classWiseAssignments, individualAssignments };
  }

  public static dataProcessorGetAssignedStudents<T extends { user_id: string }>(
    response: T[]
  ): string[] {
    let userIds: string[] = [];

    if (response && response.length > 0) {
      userIds = response.map((row: { user_id: string }) => row.user_id);
    }
    console.log("userids..", userIds);

    return userIds;
  }
}
