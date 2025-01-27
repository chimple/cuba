import { DBSQLiteValues } from "@capacitor-community/sqlite";
import {
  IAssignmentsByAssignerAndClass,
  ILessonChapterInterface,
  IStudentClassesAndSchools,
  IClassStudentResultInMap,
} from "../interface/ApiDataProcessorTypes";

export default class ApiDataProcessor {
  public static dataProcessorStudentResultInMap(
    res: DBSQLiteValues | undefined
  ): IClassStudentResultInMap {
    const data: IClassStudentResultInMap = {};

    if (!res || !res.values || res.values.length < 1) {
      return data;
    }
    const resultMap = {};
    for (const data of res.values) {
      resultMap[data.lesson_id] = data;
    }
    return data;
  }

  public static dataProcessorLessonFromChapter(
    res: DBSQLiteValues | undefined
  ): ILessonChapterInterface {
    const data: ILessonChapterInterface = {
      lesson: [],
      course: [],
    };
    if (!res || !res.values || res.values.length < 1) return data;
    data.lesson = res.values;
    data.course = res.values.map((val) => JSON.parse(val.course));
    return data;
  }

  public static dataProcessorCoursesByGrade(
    gradeRes: DBSQLiteValues | undefined,
    puzzleRes: DBSQLiteValues | undefined
  ) {
    const courses = [...(gradeRes?.values ?? []), ...(puzzleRes?.values ?? [])];
    return courses;
  }

  public static dataProcessorRewardsById(
    rewardRes: DBSQLiteValues | undefined,
    periodType: string
  ) {
    if (!rewardRes || !rewardRes.values || rewardRes.values.length === 0) {
      console.error("No reward found for the given year.");
      return;
    }
    const periodData = JSON.parse(rewardRes.values[0][periodType]);
    try {
      if (periodData) return periodData;
    } catch (parseError) {
      console.error("Error parsing JSON string:", parseError);
      return undefined;
    }
  }

  public static dataProcessorStudentClassesAndSchools(
    res: DBSQLiteValues | undefined
  ): IStudentClassesAndSchools {
    const data: IStudentClassesAndSchools = {
      classes: [],
      schools: [],
    };

    if (!res || !res.values || res.values.length < 1) return data;
    data.classes = res.values;
    data.schools = res.values.map((val) => JSON.parse(val.school));
    return data;
  }

  public static dataProcessorStudentProgress(
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

  public static dataProcessorChapterByLesson(
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

  public static dataProcessorAssignmentsByAssignerAndClass(
    res: DBSQLiteValues | undefined
  ): IAssignmentsByAssignerAndClass {
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

  public static dataProcessorAssignedStudents(
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
