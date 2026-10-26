import { BANDS, TableTypes } from '../../common/constants';
import { ServiceConfig } from '../../services/ServiceConfig';
import { addDays, subDays, subSeconds } from 'date-fns';

export class ClassUtilEngagement {
  protected api = ServiceConfig.getI().apiHandler;

  private getUtcStartOfDay(baseDate: Date) {
    return new Date(
      Date.UTC(
        baseDate.getUTCFullYear(),
        baseDate.getUTCMonth(),
        baseDate.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );
  }

  private getTimestampRange(startDaysBack: number, endDaysBack: number) {
    const now = new Date();
    const utcStartOfToday = this.getUtcStartOfDay(now);

    const start = subDays(utcStartOfToday, startDaysBack);
    const end = addDays(subDays(utcStartOfToday, endDaysBack), 1);
    const endOfDay = subSeconds(end, 1);

    return {
      start,
      end,
      startTimestamp: start.toISOString(),
      endTimestamp: endOfDay.toISOString(),
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
        return {
          hasCurrentPlay: currentResults.length > 0,
          hasPreviousPlay: previousResults.length > 0,
          currentResultsCount: currentResults.length,
          previousResultsCount: previousResults.length,
          currentTimeSpentSeconds: currentResults.reduce(
            (sum, result) => sum + (result.time_spent ?? 0),
            0,
          ),
          previousTimeSpentSeconds: previousResults.reduce(
            (sum, result) => sum + (result.time_spent ?? 0),
            0,
          ),
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

    const currentResultsCount = studentMetrics.reduce(
      (sum, student) => sum + student.currentResultsCount,
      0,
    );

    const previousResultsCount = studentMetrics.reduce(
      (sum, student) => sum + student.previousResultsCount,
      0,
    );

    const averageScorePercentage =
      currentResultsCount > 0
        ? Math.round(
            studentMetrics.reduce(
              (sum, student) =>
                sum + student.currentAverageScore * student.currentResultsCount,
              0,
            ) / currentResultsCount,
          )
        : 0;
    const previousAverageScorePercentage =
      previousResultsCount > 0
        ? Math.round(
            studentMetrics.reduce(
              (sum, student) =>
                sum +
                student.previousAverageScore * student.previousResultsCount,
              0,
            ) / previousResultsCount,
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
          classId,
        );
        const lastPlayedAt = playStatus.lastPlayedAt;
        const inactivityDays = lastPlayedAt
          ? Math.floor(
              (new Date().getTime() - new Date(lastPlayedAt).getTime()) /
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
}
