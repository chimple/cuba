import {
  BANDS,
  LIDO_ASSESSMENT,
  TABLESORTBY,
  TableTypes,
} from '../common/constants';
import { ServiceConfig } from '../services/ServiceConfig';
import { addDays, addMonths, subDays } from 'date-fns';
import { Util } from './util';
import logger from './logger';

export class ClassUtil {
  private api = ServiceConfig.getI().apiHandler;

  private getTimestampRange(startDaysBack: number, endDaysBack: number) {
    const now = new Date();
    const istNow = new Date(
      now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
    );
    const istStartOfToday = new Date(istNow);
    istStartOfToday.setHours(0, 0, 0, 0);

    const start = subDays(istStartOfToday, startDaysBack);
    const end = addDays(subDays(istStartOfToday, endDaysBack), 1);

    return {
      start,
      end,
      startTimestamp: start.toISOString().replace('T', ' ').replace('Z', '+00'),
      endTimestamp: end.toISOString().replace('T', ' ').replace('Z', '+00'),
    };
  }

  private getNumericAverage(values: Array<number | null | undefined>) {
    const validValues = values.filter(
      (value): value is number => typeof value === 'number',
    );

    if (validValues.length === 0) return 0;

    const total = validValues.reduce((sum, value) => sum + value, 0);
    return total / validValues.length;
  }

  private getTrend(currentValue: number, previousValue: number) {
    if (currentValue > previousValue) return 'up' as const;
    if (currentValue < previousValue) return 'down' as const;
    return 'same' as const;
  }

  private createStudentProgressMap(
    student: TableTypes<'user'>,
    results: TableTypes<'result'>[],
    weeklyTimeSpentSeconds: number,
    inactivityDays: number,
  ) {
    return new Map<
      string,
      TableTypes<'user'> | TableTypes<'result'>[] | number
    >([
      ['student', student],
      ['results', results],
      ['weeklyTimeSpentSeconds', weeklyTimeSpentSeconds],
      ['inactivityDays', inactivityDays],
    ]);
  }

  async getWeeklySummary(classId: string, courseId: string[]) {
    const currentRange = this.getTimestampRange(6, 0);
    const previousRange = this.getTimestampRange(13, 7);
    const students = await this.api.getStudentsForClass(classId);
    const totalStudents = students.length;

    const studentMetrics = await Promise.all(
      students.map(async (student) => {
        const allResults = await this.api.getStudentResultByDate(
          student.id,
          courseId,
          previousRange.startTimestamp,
          currentRange.endTimestamp,
          classId,
        );

        const currentResults = (allResults ?? []).filter((result) => {
          const createdAt = new Date(result.created_at);
          return (
            createdAt >= currentRange.start && createdAt < currentRange.end
          );
        });

        const previousResults = (allResults ?? []).filter((result) => {
          const createdAt = new Date(result.created_at);
          return (
            createdAt >= previousRange.start && createdAt < previousRange.end
          );
        });

        const currentTimeSpentSeconds = currentResults.reduce(
          (sum, result) => sum + (result.time_spent ?? 0),
          0,
        );
        const previousTimeSpentSeconds = previousResults.reduce(
          (sum, result) => sum + (result.time_spent ?? 0),
          0,
        );

        return {
          hasCurrentPlay: currentResults.length > 0,
          hasPreviousPlay: previousResults.length > 0,
          currentTimeSpentSeconds,
          previousTimeSpentSeconds,
          currentAverageScore: this.getNumericAverage(
            currentResults.map((result) => result.score),
          ),
          previousAverageScore: this.getNumericAverage(
            previousResults.map((result) => result.score),
          ),
        };
      }),
    );

    const activeStudentsCount = studentMetrics.filter(
      (student) => student.hasCurrentPlay,
    ).length;
    const previousActiveStudentsCount = studentMetrics.filter(
      (student) => student.hasPreviousPlay,
    ).length;

    const averageTimeSpentMinutes =
      activeStudentsCount > 0
        ? Math.round(
            studentMetrics.reduce(
              (sum, student) => sum + student.currentTimeSpentSeconds,
              0,
            ) /
              activeStudentsCount /
              60,
          )
        : 0;
    const previousAverageTimeSpentMinutes =
      previousActiveStudentsCount > 0
        ? Math.round(
            studentMetrics.reduce(
              (sum, student) => sum + student.previousTimeSpentSeconds,
              0,
            ) /
              previousActiveStudentsCount /
              60,
          )
        : 0;

    const averageScorePercentage =
      totalStudents > 0
        ? Math.round(
            studentMetrics.reduce(
              (sum, student) => sum + student.currentAverageScore,
              0,
            ) / totalStudents,
          )
        : 0;
    const previousAverageScorePercentage =
      totalStudents > 0
        ? Math.round(
            studentMetrics.reduce(
              (sum, student) => sum + student.previousAverageScore,
              0,
            ) / totalStudents,
          )
        : 0;

    return {
      activeStudents: {
        count: activeStudentsCount,
        totalStudents,
        trend: this.getTrend(activeStudentsCount, previousActiveStudentsCount),
      },
      averageTimeSpent: {
        minutes: averageTimeSpentMinutes,
        trend: this.getTrend(
          averageTimeSpentMinutes,
          previousAverageTimeSpentMinutes,
        ),
      },
      averageScore: {
        percentage: averageScorePercentage,
        trend: this.getTrend(
          averageScorePercentage,
          previousAverageScorePercentage,
        ),
      },
    };
  }

  public async divideStudents(classId: string, courseIds: string[]) {
    const greenGroup: Map<
      string,
      TableTypes<'user'> | TableTypes<'result'>[] | number
    >[] = [];
    const yellowGroup: Map<
      string,
      TableTypes<'user'> | TableTypes<'result'>[] | number
    >[] = [];
    const redGroup: Map<
      string,
      TableTypes<'user'> | TableTypes<'result'>[] | number
    >[] = [];
    const greyGroup: Map<
      string,
      TableTypes<'user'> | TableTypes<'result'>[] | number
    >[] = [];
    const currentRange = this.getTimestampRange(6, 0);
    const _students = await this.api.getStudentsForClass(classId);
    const studentResultsPromises = _students.map(async (student) => {
      const currentWeekRawResults =
        (await this.api.getStudentResultByDate(
          student.id,
          courseIds,
          currentRange.startTimestamp,
          currentRange.endTimestamp,
          classId,
        )) ?? [];
      const currentWeekResults = currentWeekRawResults.filter((result) => {
        const createdAt = new Date(result.created_at);
        return createdAt >= currentRange.start && createdAt < currentRange.end;
      });
      const hasPlayedInLast7Days = currentWeekResults.length > 0;
      const currentWeekTimeSpentSeconds = currentWeekResults.reduce(
        (sum, result) => sum + (result.time_spent ?? 0),
        0,
      );

      if (!hasPlayedInLast7Days) {
        const playStatus = await this.api.getStudentPlayStatus(
          student.id,
          courseIds,
          classId,
        );
        const inactivityDays = playStatus.lastPlayedAt
          ? Math.floor(
              (new Date().getTime() -
                new Date(playStatus.lastPlayedAt).getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : 0;

        if (!playStatus.hasPlayed) {
          greyGroup.push(this.createStudentProgressMap(student, [], 0, 0));
          return;
        }

        redGroup.push(
          this.createStudentProgressMap(
            student,
            currentWeekResults,
            currentWeekTimeSpentSeconds,
            inactivityDays,
          ),
        );
      } else if (currentWeekTimeSpentSeconds >= 45 * 60) {
        greenGroup.push(
          this.createStudentProgressMap(
            student,
            currentWeekResults,
            currentWeekTimeSpentSeconds,
            0,
          ),
        );
      } else if (currentWeekTimeSpentSeconds === 0) {
        const latestResult = [...currentWeekResults].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )[0];
        const inactivityDays = latestResult
          ? Math.floor(
              (new Date().getTime() -
                new Date(latestResult.created_at).getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : 0;
        redGroup.push(
          this.createStudentProgressMap(
            student,
            currentWeekResults,
            currentWeekTimeSpentSeconds,
            inactivityDays,
          ),
        );
      } else {
        yellowGroup.push(
          this.createStudentProgressMap(
            student,
            currentWeekResults,
            currentWeekTimeSpentSeconds,
            0,
          ),
        );
      }
    });
    await Promise.all(studentResultsPromises);

    redGroup.sort(
      (a, b) =>
        ((b.get('inactivityDays') as number) ?? 0) -
        ((a.get('inactivityDays') as number) ?? 0),
    );
    yellowGroup.sort(
      (a, b) =>
        ((b.get('weeklyTimeSpentSeconds') as number) ?? 0) -
        ((a.get('weeklyTimeSpentSeconds') as number) ?? 0),
    );
    greenGroup.sort(
      (a, b) =>
        ((b.get('weeklyTimeSpentSeconds') as number) ?? 0) -
        ((a.get('weeklyTimeSpentSeconds') as number) ?? 0),
    );

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
      days.push(currentDate.toLocaleDateString('en-US', { weekday: 'long' }));
      currentDate = addDays(new Date(currentDate), 1);
    }

    return days;
  }
  private getMonthsInRange(startDate: Date, endDate: Date): string[] {
    const months: string[] = [];
    let currentDate = new Date(startDate);
    endDate = addDays(new Date(endDate), 1);

    while (currentDate < endDate) {
      const monthName = currentDate.toLocaleDateString('en-US', {
        month: 'long',
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
      if (result && typeof result === 'object') {
        return total + ((result as any).score || 0); // Casting to any
      }
      return total;
    }, 0);
  }
  private sortStudentsByTotalScore(resultsByStudent: Map<string, any>) {
    const sortedEntries = [...resultsByStudent.entries()].sort(
      ([, studentA], [, studentB]) => {
        const totalScoreA = this.calculateTotalScore(
          studentA.results,
        ) as number;
        const totalScoreB = this.calculateTotalScore(
          studentB.results,
        ) as number;

        return totalScoreB - totalScoreA;
      },
    );
    return new Map(sortedEntries);
  }
  public async getWeeklyReport(
    classId: string,
    courseIds: string[],
    startDate: Date,
    endDate: Date,
    sortBy: TABLESORTBY,
    isAssignments: boolean,
  ) {
    const adjustedStartDate = subDays(new Date(startDate), 1);
    const adjustedEndDate = addDays(new Date(endDate), 1);
    const daysInRange = this.getDaysInRange(startDate, endDate);
    const startTimeStamp = adjustedStartDate
      .toISOString()
      .replace('T', ' ')
      .replace('Z', '+00');
    const endTimeStamp = adjustedEndDate
      .toISOString()
      .replace('T', ' ')
      .replace('Z', '+00');

    const _students = await this.api.getStudentsForClass(classId);
    if (sortBy == TABLESORTBY.NAME)
      _students.sort((a, b) => {
        if (a.name === null) return 1;
        if (b.name === null) return -1;
        return a.name.localeCompare(b.name);
      });
    var resultsByStudent = new Map<
      string,
      { student: TableTypes<'user'>; results: Record<string, any[]> }
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
    const lessonCache = new Map<string, TableTypes<'lesson'>>();
    for (const student of _students) {
      var res = await this.api.getStudentResultByDate(
        student.id,
        courseIds,
        startTimeStamp,
        endTimeStamp,
        classId,
      );
      res = isAssignments
        ? res?.filter((item) => item.assignment_id !== null)
        : res;

      for (const result of res ?? []) {
        const resultDate = new Date(result.created_at);
        const dayName = resultDate.toLocaleDateString('en-US', {
          weekday: 'long',
        });

        const dayResults = resultsByStudent.get(student.id)?.results[dayName];

        if (!dayResults) continue;

        let lesson = lessonCache.get(result.lesson_id!);

        if (!lesson && result.lesson_id) {
          lesson = await this.api.getLesson(result.lesson_id);
          if (lesson) lessonCache.set(result.lesson_id, lesson);
        }
        Util.upsertResultWithAggregation(dayResults, result, lesson);
      }
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
        startAt: '',
        endAt: '',
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
    courseIds: string[],
    startDate: Date,
    endDate: Date,
    sortBy: TABLESORTBY,
    isAssignments: boolean,
  ) {
    const monthsInRange = this.getMonthsInRange(startDate, endDate);
    const adjustedStartDate = subDays(new Date(startDate), 1);
    const adjustedEndDate = addDays(new Date(endDate), 1);
    const startTimeStamp = adjustedStartDate
      .toISOString()
      .replace('T', ' ')
      .replace('Z', '+00');
    const endTimeStamp = adjustedEndDate
      .toISOString()
      .replace('T', ' ')
      .replace('Z', '+00');
    const _students = await this.api.getStudentsForClass(classId);
    if (sortBy == TABLESORTBY.NAME)
      _students.sort((a, b) => {
        if (a.name === null) return 1;
        if (b.name === null) return -1;
        return a.name.localeCompare(b.name);
      });

    var resultsByStudent = new Map<
      string,
      { student: TableTypes<'user'>; results: Record<string, any[]> }
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
    const lessonCache = new Map<string, TableTypes<'lesson'>>();
    for (const student of _students) {
      var res = await this.api.getStudentResultByDate(
        student.id,
        courseIds,
        startTimeStamp,
        endTimeStamp,
        classId,
      );
      res = isAssignments
        ? res?.filter((item) => item.assignment_id !== null)
        : res;
      for (const result of res ?? []) {
        const resultDate = new Date(result.created_at);
        const monthName = resultDate.toLocaleDateString('en-US', {
          month: 'long',
        });

        const monthResults = resultsByStudent.get(student.id)?.results[
          monthName
        ];
        if (!monthResults) continue;

        let lesson = lessonCache.get(result.lesson_id!);

        if (!lesson && result.lesson_id) {
          lesson = await this.api.getLesson(result.lesson_id);
          if (lesson) lessonCache.set(result.lesson_id, lesson);
        }

        Util.upsertResultWithAggregation(monthResults, result, lesson);
      }
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
        startAt: '',
        endAt: '',
      });

      return monthsMap;
    });
    return {
      ReportData: resultsByStudent,
      HeaderData: monthsMapArray,
    };
  }
  public formatDate(timestamp: string | number | Date) {
    const date = new Date(timestamp);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`;
  }
  public async getAssignmentOrLiveQuizReportForReport(
    classId: string,
    courseId: any,
    startDate: Date,
    endDate: Date,
    isLiveQuiz: boolean,
    sortBy: TABLESORTBY,
  ) {
    const adjustedStartDate = subDays(new Date(startDate), 1);
    const adjustedEndDate = addDays(new Date(endDate), 1);

    const startTimeStamp = adjustedStartDate
      .toISOString()
      .replace('T', ' ')
      .replace('Z', '+00');
    const endTimeStamp = adjustedEndDate
      .toISOString()
      .replace('T', ' ')
      .replace('Z', '+00');

    const _students = await this.api.getStudentsForClass(classId);
    if (sortBy === TABLESORTBY.NAME) {
      _students.sort((a, b) => {
        if (a.name === null) return 1;
        if (b.name === null) return -1;
        return a.name.localeCompare(b.name);
      });
    }

    const _assignments = await this.api.getAssignmentOrLiveQuizByClassByDate(
      classId,
      courseId,
      endTimeStamp,
      startTimeStamp,
      /* isClassWise = */ false,
      isLiveQuiz,
      false,
    );

    const assignmentIds = _assignments?.map((asgmt) => asgmt.id) || [];
    const lessonIds = [
      ...new Set(_assignments?.map((res) => res.lesson_id) || []),
    ];

    const assignmentResults =
      await this.api.getResultByAssignmentIds(assignmentIds);
    const lessonDetails = await this.api.getLessonsBylessonIds(lessonIds);

    const assignmentUserRecords =
      await this.api.getAssignmentUserByAssignmentIds(assignmentIds);

    const assignmentIsClassWise: Record<string, boolean> = {};
    _assignments?.forEach((assignment) => {
      assignmentIsClassWise[assignment.id] = Boolean(assignment.is_class_wise);
    });

    const assignmentMapArray: Map<
      string,
      {
        headerName: string;
        startAt: string;
        endAt: string;
        belongsToClass: boolean;
      }
    >[] = (_assignments || []).map((assignment) => {
      const lesson = lessonDetails?.find(
        (lesson) => lesson.id === assignment.lesson_id,
      );
      const belongsToClass = Boolean(assignment.is_class_wise);
      const assignmentMap = new Map<
        string,
        {
          headerName: string;
          startAt: string;
          endAt: string;
          belongsToClass: boolean;
          courseId: string;
        }
      >();

      assignmentMap.set(assignment.id, {
        headerName: lesson?.name ?? '',
        startAt: this.formatDate(assignment.starts_at),
        endAt: assignment.ends_at ? this.formatDate(assignment.ends_at) : '',
        belongsToClass: belongsToClass,
        courseId: assignment.course_id ?? '',
      });

      return assignmentMap;
    });

    let resultsByStudent = new Map<
      string,
      { student: TableTypes<'user'>; results: Record<string, any[]> }
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
        resultsByStudent = new Map([...resultsByStudent.entries()].reverse());
      }
    }
    // lesson cache for LIDO aggregation
    const lessonCache = new Map<string, TableTypes<'lesson'>>();

    assignmentResults?.forEach((result) => {
      const studentId = result.student_id;
      const assignmentId = result.assignment_id;

      const bucket =
        resultsByStudent.get(studentId)?.results[assignmentId ?? ''];

      if (!bucket) return;

      const assignment = _assignments?.find((a) => a.id === assignmentId);

      if (!assignment?.lesson_id) {
        bucket.push(result);
        return;
      }

      let lesson = lessonCache.get(assignment.lesson_id);

      if (!lesson) {
        lesson = lessonDetails?.find((l) => l.id === assignment.lesson_id);
        if (lesson) lessonCache.set(assignment.lesson_id, lesson);
      }
      // LIDO → avg, others → push
      Util.upsertResultWithAggregation(bucket, result, lesson);
    });

    resultsByStudent.forEach((studentData, studentId) => {
      assignmentIds.forEach((assignmentId) => {
        if (!assignmentIsClassWise[assignmentId]) {
          const isAssignedToStudent = assignmentUserRecords?.some(
            (record) =>
              record.assignment_id === assignmentId &&
              record.user_id === studentId,
          );

          if (
            !isAssignedToStudent &&
            studentData.results[assignmentId].length === 0
          ) {
            studentData.results[assignmentId].push({
              assignment_id: assignmentId,
              score: null,
            });
          }
        }
      });
    });
    return {
      ReportData: resultsByStudent,
      HeaderData: assignmentMapArray,
    };
  }
  public async getStudentProgressForStudentTable(
    studentId: string,
    courseIds: string[],
    startDate: string,
    endDate: string,
    classId: string,
  ) {
    const adjustedStartDate = subDays(new Date(startDate ?? ''), 1);
    const adjustedEndDate = addDays(new Date(endDate ?? ''), 1);
    const startTimeStamp = adjustedStartDate
      .toISOString()
      .replace('T', ' ')
      .replace('Z', '+00');
    const endTimeStamp = adjustedEndDate
      .toISOString()
      .replace('T', ' ')
      .replace('Z', '+00');
    const res = await this.api.getStudentResultByDate(
      studentId,
      courseIds,
      startTimeStamp,
      endTimeStamp,
      classId,
    );
    if (!res || res.length === 0) return [];

    const finalResults: any[] = [];

    for (const result of res) {
      if (!result.lesson_id) continue;

      try {
        const lesson = await this.api.getLesson(result.lesson_id);
        let finalScore = result.score ?? 0;

        // Only aggregate/average for LIDO
        if (lesson?.plugin_type === LIDO_ASSESSMENT) {
          const allResultsForLesson = res.filter(
            (r) => r.lesson_id === result.lesson_id,
          );
          const totalScore = allResultsForLesson.reduce(
            (acc, r) => acc + (r.score ?? 0),
            0,
          );
          finalScore = totalScore / allResultsForLesson.length;

          // Make sure we only push one entry per LIDO lesson
          if (finalResults.find((r) => r.lessonName === lesson?.name)) {
            continue;
          }
        }

        finalResults.push({
          lessonName: lesson?.name ?? '',
          score: Math.round(finalScore),
          date: new Date(result.created_at!).toLocaleDateString('en-GB'),
          isAssignment: result.assignment_id ? true : false,
        });
      } catch (error) {
        logger.error(`Error fetching lesson for ${result.lesson_id}:`, error);
      }
    }

    return finalResults;
  }
  public async getChapterWiseReport(
    classId: string,
    startDate: Date,
    endDate: Date,
    courseId: string,
    chapterId: string,
    sortBy: TABLESORTBY,
    isAssignments: boolean,
  ) {
    const adjustedStartDate = subDays(new Date(startDate), 1);
    const adjustedEndDate = addDays(new Date(endDate), 1);

    const startTimeStamp = adjustedStartDate
      .toISOString()
      .replace('T', ' ')
      .replace('Z', '+00');
    const endTimeStamp = adjustedEndDate
      .toISOString()
      .replace('T', ' ')
      .replace('Z', '+00');
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
      endTimeStamp,
      classId,
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
        headerName: lesson?.name ?? '',
        startAt: '',
        endAt: '',
      });

      return lessonMap;
    });
    var resultsByStudent = new Map<
      string,
      { student: TableTypes<'user'>; results: Record<string, any[]> }
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

      if (resultsByStudent.get(studentId)?.results[lessonId ?? '']) {
        resultsByStudent.get(studentId)!.results[lessonId ?? ''].push(result);
      }
    });
    return {
      ReportData: resultsByStudent,
      HeaderData: chapterMapArray,
    };
  }

  public async groupStudentsByCategoryInList(
    studentsMap: Map<string, Map<string, TableTypes<'user'>>>,
  ): Promise<Map<string, TableTypes<'user'>[]>> {
    const groups: Map<string, TableTypes<'user'>[]> = new Map();

    studentsMap.forEach((studentM: Map<string, any>, index: string) => {
      studentM.forEach((element: any) => {
        const studentData = element.get('student');
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
  public sortStudentsByTotalScoreAssignment = (
    studentsMap: Map<
      string,
      { student: TableTypes<'user'>; results: Record<string, any[]> }
    >,
  ): Map<
    string,
    { student: TableTypes<'user'>; results: Record<string, any[]> }
  > => {
    // Convert Map to array of entries
    const studentsArray = Array.from(studentsMap.entries());

    // Calculate total score for each student
    const studentsWithScores = studentsArray.map(([studentId, studentData]) => {
      let totalScore = 0;
      let validResults = 0;

      // Sum scores from all assignments
      Object.values(studentData.results).forEach((assignmentResults) => {
        assignmentResults.forEach((result) => {
          if (result.score !== null && !isNaN(result.score)) {
            totalScore += result.score;
            validResults++;
          }
        });
      });

      // Calculate average score (or 0 if no valid results)
      const averageScore = validResults > 0 ? totalScore / validResults : 0;

      return {
        studentId,
        studentData,
        averageScore,
      };
    });

    // Sort by average score (ascending for LOWSCORE)
    studentsWithScores.sort((a, b) => a.averageScore - b.averageScore);

    // Convert back to Map
    return new Map(
      studentsWithScores.map((item) => [item.studentId, item.studentData]),
    );
  };
}
