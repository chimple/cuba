import { start } from "repl";
import { BANDS, TABLESORTBY, TableTypes } from "../common/constants";
import { ServiceConfig } from "../services/ServiceConfig";
import { addDays, addMonths, format, subDays, subWeeks } from "date-fns";

export class ClassUtil {
  private api = ServiceConfig.getI().apiHandler;

  async getWeeklySummary(classId: string, courseId: string) {
    var currentDate = new Date();
    var totalScore = 0;
    var timeSpent = 0;
    const adjustedcurrentDate = addDays(currentDate, 1);
    const adjustedoneWeekBack = subDays(currentDate, 7);
    var currentDateTimeStamp = adjustedcurrentDate
      .toISOString()
      .replace("T", " ")
      .replace("Z", "+00");

    const oneWeekBackTimeStamp = adjustedoneWeekBack
      .toISOString()
      .replace("T", " ")
      .replace("Z", "+00");

    const assignements = await this.api.getAssignmentOrLiveQuizByClassByDate(
      classId,
      courseId,
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
      timeSpent: parseFloat((timeSpent / totalStudents).toFixed(2)),
      averageScore:
        assignmentResult?.length ?? 0 > 0
          ? parseFloat(
              (totalScore / (assignmentResult?.length ?? 0)).toFixed(1)
            )
          : 0,
    };
  }
  public async divideStudents(classId: string, courseId: string) {
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
    const adjustedcurrentDate = addDays(currentDate, 1);
    const adjustedoneWeekBack = subDays(currentDate, 7);
    var currentDateTimeStamp = adjustedcurrentDate
      .toISOString()
      .replace("T", " ")
      .replace("Z", "+00");

    const oneWeekBackTimeStamp = adjustedoneWeekBack
      .toISOString()
      .replace("T", " ")
      .replace("Z", "+00");
    const assignements = await this.api.getAssignmentOrLiveQuizByClassByDate(
      classId,
      courseId,
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
        courseId,
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

  private calculateTotalScore(results: any) {
    const allResults = Object.values(results).flat();

    return allResults.reduce((total, result) => {
      if (result && typeof result === "object") {
        return total + ((result as any).score || 0); // Casting to any
      }
      return total;
    }, 0);
  }
  private sortStudentsByTotalScore(resultsByStudent: Map<string, any>) {
    const sortedEntries = [...resultsByStudent.entries()].sort(
      ([, studentA], [, studentB]) => {
        const totalScoreA = this.calculateTotalScore(
          studentA.results
        ) as number;
        const totalScoreB = this.calculateTotalScore(
          studentB.results
        ) as number;

        return totalScoreB - totalScoreA;
      }
    );
    return new Map(sortedEntries);
  }
  public async getWeeklyReport(
    classId: string,
    courseId: string,
    startDate: Date,
    endDate: Date,
    sortBy: TABLESORTBY,
    isAssignments: boolean
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
    if (sortBy == TABLESORTBY.NAME)
      _students.sort((a, b) => {
        if (a.name === null) return 1;
        if (b.name === null) return -1;
        return a.name.localeCompare(b.name);
      });
    var resultsByStudent = new Map<
      string,
      { student: TableTypes<"user">; results: Record<string, any[]> }
    >();

    _students.forEach((student) => {
      resultsByStudent.set(student.id, {
        student: student,
        results: {},
      });
      daysInRange.forEach((day) => {
        resultsByStudent.get(student.id)!.results[day] = [];
      });
    });

    for (const student of _students) {
      var res = await this.api.getStudentResultByDate(
        student.id,
        courseId,
        startTimeStamp,
        endTimeStamp
      );
      res = isAssignments
        ? res?.filter((item) => item.assignment_id !== null)
        : res;

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
    if (sortBy === TABLESORTBY.LOWSCORE || sortBy === TABLESORTBY.HIGHSCORE) {
      resultsByStudent = this.sortStudentsByTotalScore(resultsByStudent);
      if (sortBy === TABLESORTBY.LOWSCORE) {
        const reversedEntries = [...resultsByStudent.entries()].reverse();
        resultsByStudent = new Map(reversedEntries);
      }
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
    courseId: string,
    startDate: Date,
    endDate: Date,
    sortBy: TABLESORTBY,
    isAssignments: boolean
  ) {
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
    if (sortBy == TABLESORTBY.NAME)
      _students.sort((a, b) => {
        if (a.name === null) return 1;
        if (b.name === null) return -1;
        return a.name.localeCompare(b.name);
      });

    var resultsByStudent = new Map<
      string,
      { student: TableTypes<"user">; results: Record<string, any[]> }
    >();
    _students.forEach((student) => {
      resultsByStudent.set(student.id, {
        student: student,
        results: {},
      });
      monthsInRange.forEach((month) => {
        resultsByStudent.get(student.id)!.results[month] = [];
      });
    });

    for (const student of _students) {
      var res = await this.api.getStudentResultByDate(
        student.id,
        courseId,
        startTimeStamp,
        endTimeStamp
      );
      res = isAssignments
        ? res?.filter((item) => item.assignment_id !== null)
        : res;
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
    if (sortBy === TABLESORTBY.LOWSCORE || sortBy === TABLESORTBY.HIGHSCORE) {
      resultsByStudent = this.sortStudentsByTotalScore(resultsByStudent);
      if (sortBy === TABLESORTBY.LOWSCORE) {
        const reversedEntries = [...resultsByStudent.entries()].reverse();
        resultsByStudent = new Map(reversedEntries);
      }
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
  public formatDate(timestamp) {
    const date = new Date(timestamp);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}`;
  }
  public async getAssignmentOrLiveQuizReport(
    classId: string,
    courseId: string,
    startDate: Date,
    endDate: Date,
    isLiveQuiz: boolean,
    sortBy: TABLESORTBY
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
    if (sortBy == TABLESORTBY.NAME)
      _students.sort((a, b) => {
        if (a.name === null) return 1;
        if (b.name === null) return -1;
        return a.name.localeCompare(b.name);
      });

    const _assignments = await this.api.getAssignmentOrLiveQuizByClassByDate(
      classId,
      courseId,
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

        startAt: this.formatDate(assignment.starts_at),
        endAt: assignment.ends_at ? this.formatDate(assignment.ends_at) : "",
      });

      return assignmentMap;
    });
    var resultsByStudent = new Map<
      string,
      { student: TableTypes<"user">; results: Record<string, any[]> }
    >();

    _students.forEach((student) => {
      resultsByStudent.set(student.id, {
        student: student,
        results: {},
      });
      assignmentIds.forEach((assignmentId) => {
        resultsByStudent.get(student.id)!.results[assignmentId] = [];
      });
    });
    if (sortBy === TABLESORTBY.LOWSCORE || sortBy === TABLESORTBY.HIGHSCORE) {
      resultsByStudent = this.sortStudentsByTotalScore(resultsByStudent);
      if (sortBy === TABLESORTBY.HIGHSCORE) {
        const reversedEntries = [...resultsByStudent.entries()].reverse();
        resultsByStudent = new Map(reversedEntries);
      }
    }
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
  public async getStudentProgress(
    studentId: string,
    courseId: string,
    startDate: string,
    endDate: string
  ) {
    const adjustedStartDate = subDays(new Date(startDate ?? ""), 1);
    const adjustedEndDate = addDays(new Date(endDate ?? ""), 1);
    const startTimeStamp = adjustedStartDate
      .toISOString()
      .replace("T", " ")
      .replace("Z", "+00");
    const endTimeStamp = adjustedEndDate
      .toISOString()
      .replace("T", " ")
      .replace("Z", "+00");
    var res = await this.api.getStudentResultByDate(
      studentId,
      courseId,
      startTimeStamp,
      endTimeStamp
    );
    const lessonIds = res?.map((item) => item.lesson_id ?? "");
    var lessons = await this.api.getLessonsBylessonIds(lessonIds ?? []);
    const formattedResults = res?.map((result) => {
      const matchingLesson = lessons?.find(
        (lesson) => lesson.id === result.lesson_id
      );

      return {
        lessonName: matchingLesson?.name ?? "",
        score: result.score ?? 0,
        date: new Date(result.created_at).toLocaleDateString("en-GB"),
        isAssignment: result.assignment_id ? true : false,
      };
    });
    return formattedResults;
  }
  public async getChapterWiseReport(
    classId: string,
    startDate: Date,
    endDate: Date,
    courseId: string,
    chapterId: string,
    sortBy: TABLESORTBY,
    isAssignments: boolean
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
    if (sortBy == TABLESORTBY.NAME)
      _students.sort((a, b) => {
        if (a.name === null) return 1;
        if (b.name === null) return -1;
        return a.name.localeCompare(b.name);
      });

    const _lessons = await this.api.getLessonsForChapter(chapterId);

    var chapterResults = await this.api.getResultByChapterByDate(
      chapterId,
      courseId,
      startTimeStamp,
      endTimeStamp
    );
    chapterResults = isAssignments
      ? chapterResults?.filter((item) => item.assignment_id !== null)
      : chapterResults;
    const chapterMapArray: Map<
      string,
      { headerName: string; startAt: string; endAt: string }
    >[] = (_lessons || []).map((lesson) => {
      const lessonMap = new Map<
        string,
        { headerName: string; startAt: string; endAt: string }
      >();

      lessonMap.set(lesson.id, {
        headerName: lesson?.name ?? "",
        startAt: "",
        endAt: "",
      });

      return lessonMap;
    });
    var resultsByStudent = new Map<
      string,
      { student: TableTypes<"user">; results: Record<string, any[]> }
    >();

    _students.forEach((student) => {
      resultsByStudent.set(student.id, {
        student: student,
        results: {},
      });
      _lessons.forEach((lesson) => {
        resultsByStudent.get(student.id)!.results[lesson.id] = [];
      });
    });
    if (sortBy === TABLESORTBY.LOWSCORE || sortBy === TABLESORTBY.HIGHSCORE) {
      resultsByStudent = this.sortStudentsByTotalScore(resultsByStudent);
      if (sortBy === TABLESORTBY.HIGHSCORE) {
        const reversedEntries = [...resultsByStudent.entries()].reverse();
        resultsByStudent = new Map(reversedEntries);
      }
    }

    chapterResults?.forEach((result) => {
      const studentId = result.student_id;
      const lessonId = result.lesson_id;

      if (resultsByStudent.get(studentId)?.results[lessonId ?? ""]) {
        resultsByStudent.get(studentId)!.results[lessonId ?? ""].push(result);
      }
    });
    return {
      ReportData: resultsByStudent,
      HeaderData: chapterMapArray,
    };
  }

  public async groupStudentsByCategoryInList(
    studentsMap: Map<string, Map<string, TableTypes<"user">>>
  ): Promise<Map<string, TableTypes<"user">[]>> {
    const groups: Map<string, TableTypes<"user">[]> = new Map();

    studentsMap.forEach((studentM: Map<string, any>, index: string) => {
      studentM.forEach((element: any) => {
        const studentData = element.get("student");
        if (!studentData) {
          return; // Skip this element if no student data is present
        }

        // Fetch the existing array of students for this category, or initialize a new array
        let existingStudents = groups.get(index) || [];

        // Add the student element to the existing group array
        existingStudents.push(studentData);

        // Update the group with the new list of students
        groups.set(index, existingStudents);
      });
    });
    return groups;
  }
}
