import { TABLESORTBY, TableTypes } from '../../common/constants';
import { addDays, addMonths, subDays } from 'date-fns';
import { Util } from '../util';
import { ClassUtilEngagement } from './ClassUtilEngagement';

export class ClassUtilPeriodReports extends ClassUtilEngagement {
  protected getDaysInRange(startDate: Date, endDate: Date): string[] {
    const days: string[] = [];
    var currentDate = new Date(startDate);
    endDate = addDays(new Date(endDate), 1);
    while (currentDate < endDate) {
      days.push(currentDate.toLocaleDateString('en-US', { weekday: 'long' }));
      currentDate = addDays(new Date(currentDate), 1);
    }

    return days;
  }
  protected getMonthsInRange(startDate: Date, endDate: Date): string[] {
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

  protected calculateTotalScore(results: any) {
    const allResults = Object.values(results).flat();

    return allResults.reduce((total, result) => {
      if (result && typeof result === 'object') {
        return total + ((result as any).score || 0); // Casting to any
      }
      return total;
    }, 0);
  }
  protected sortStudentsByTotalScore(resultsByStudent: Map<string, any>) {
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
    if (sortBy === TABLESORTBY.NAME)
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
    if (sortBy === TABLESORTBY.NAME)
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
}
