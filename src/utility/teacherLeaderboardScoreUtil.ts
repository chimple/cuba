import type { TeacherLeaderboardScoreHistory } from '../services/api/ServiceApi';
import {
  getStudentEngagementBand,
  StudentEngagementBand,
} from './classUtil/ClassUtilEngagement';

type Student = { class_id: string; user_id: string };
type Assignment = { created_at: string };
type Result = {
  class_id: string | null;
  student_id: string;
  time_spent: number | null;
  created_at: string;
};

const MOVEMENT_POINTS: Record<
  `${StudentEngagementBand}-${StudentEngagementBand}`,
  number
> = {
  'red-yellow': 10,
  'yellow-green': 5,
  'red-green': 15,
  'grey-yellow': 20,
  'grey-green': 25,
  'green-yellow': -5,
  'yellow-red': -10,
  'green-red': -15,
  'green-green': 0,
  'yellow-yellow': 0,
  'red-red': 0,
  'grey-grey': 0,
  'green-grey': 0,
  'yellow-grey': 0,
  'red-grey': 0,
  'grey-red': 0,
};

/**
 * Calculates chart scores from API data using the shared student engagement bands.
 * @param assignments Teacher-created assignments used to determine active windows.
 * @param classIds Classes taught by the teacher.
 * @param results Student learning results used for engagement and band changes.
 * @param students Current student roster for each teacher class.
 * @param today Optional reference date, primarily allowing deterministic callers.
 */
export const calculateTeacherLeaderboardScoreHistory = ({
  assignments,
  classIds,
  results,
  students,
  today = new Date(),
}: {
  assignments: Assignment[];
  classIds: string[];
  results: Result[];
  students: Student[];
  today?: Date;
}): TeacherLeaderboardScoreHistory[] => {
  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);
  const assignmentDates = assignments.map(
    (assignment) => new Date(assignment.created_at),
  );
  const resultsByStudentClass = new Map<string, Result[]>();
  results.forEach((result) => {
    if (!result.class_id) return;
    const key = `${result.class_id}:${result.student_id}`;
    resultsByStudentClass.set(key, [
      ...(resultsByStudentClass.get(key) ?? []),
      result,
    ]);
  });

  return Array.from({ length: 7 }, (_, index) => {
    const scoreDate = new Date(startOfToday);
    scoreDate.setDate(scoreDate.getDate() - (6 - index));
    const windowStart = new Date(scoreDate);
    windowStart.setDate(windowStart.getDate() - 6);
    const previousWindowStart = new Date(scoreDate);
    previousWindowStart.setDate(previousWindowStart.getDate() - 7);
    const scoreDateEnd = new Date(scoreDate);
    scoreDateEnd.setDate(scoreDateEnd.getDate() + 1);
    const isActive = assignmentDates.some(
      (date) => date >= windowStart && date < scoreDateEnd,
    );
    let dailyScore = 0;

    if (isActive) {
      classIds.forEach((classId) => {
        const studentBands = students
          .filter((student) => student.class_id === classId)
          .map((student) => {
            const studentResults =
              resultsByStudentClass.get(`${classId}:${student.user_id}`) ?? [];
            const secondsIn = (start: Date, end: Date) =>
              studentResults
                .filter((result) => {
                  const date = new Date(result.created_at);
                  return date >= start && date < end;
                })
                .reduce((sum, result) => sum + (result.time_spent ?? 0), 0);
            const currentSeconds = secondsIn(windowStart, scoreDateEnd);
            const previousSeconds = secondsIn(previousWindowStart, scoreDate);
            return {
              currentSeconds,
              currentBand: getStudentEngagementBand(
                studentResults.some(
                  (result) =>
                    new Date(result.created_at) >= windowStart &&
                    new Date(result.created_at) < scoreDateEnd,
                ),
                currentSeconds,
                studentResults.some(
                  (result) => new Date(result.created_at) < scoreDateEnd,
                ),
              ),
              previousBand: getStudentEngagementBand(
                studentResults.some(
                  (result) =>
                    new Date(result.created_at) >= previousWindowStart &&
                    new Date(result.created_at) < scoreDate,
                ),
                previousSeconds,
                studentResults.some(
                  (result) => new Date(result.created_at) < scoreDate,
                ),
              ),
            };
          });
        const averageSeconds = (band: StudentEngagementBand) => {
          const matching = studentBands.filter(
            (student) => student.currentBand === band,
          );
          return matching.length
            ? matching.reduce(
                (sum, student) => sum + student.currentSeconds,
                0,
              ) / matching.length
            : 0;
        };
        dailyScore +=
          (averageSeconds('green') + averageSeconds('yellow')) / 60 +
          studentBands.reduce(
            (sum, student) =>
              sum +
              MOVEMENT_POINTS[`${student.previousBand}-${student.currentBand}`],
            0,
          );
      });
    }
    return {
      date: scoreDate.toISOString().slice(0, 10),
      score: Math.round(dailyScore),
    };
  });
};
