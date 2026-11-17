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

const istDateString = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
};

const addDays = (dateString: string, days: number) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
};

const istMidnight = (dateString: string) =>
  new Date(`${dateString}T00:00:00+05:30`);

const average = (values: number[]) =>
  values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;

/**
 * Calculates seven chart points from rolling IST windows. Each displayed date
 * uses the completed seven-day window ending at the preceding IST midnight.
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
  const todayIst = istDateString(today);
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
    const displayDate = addDays(todayIst, index - 6);
    // The displayed score represents the completed day immediately before it.
    const edgeScoreDate = addDays(displayDate, -1);
    const currentStart = istMidnight(addDays(edgeScoreDate, -6));
    const currentEnd = istMidnight(addDays(edgeScoreDate, 1));
    const previousStart = istMidnight(addDays(edgeScoreDate, -7));
    const previousEnd = istMidnight(edgeScoreDate);
    const isActive = assignmentDates.some(
      (date) => date >= currentStart && date < currentEnd,
    );

    const classScores = classIds.flatMap((classId) => {
      const classStudents = students.filter(
        (student) => student.class_id === classId,
      );
      if (classStudents.length === 0) return [];

      const movements = classStudents.map((student) => {
        const studentResults =
          resultsByStudentClass.get(`${classId}:${student.user_id}`) ?? [];
        const activityIn = (start: Date, end: Date) => {
          const windowResults = studentResults.filter((result) => {
            const resultDate = new Date(result.created_at);
            return resultDate >= start && resultDate < end;
          });

          return {
            seconds: windowResults.reduce(
              (sum, result) => sum + Math.max(result.time_spent ?? 0, 0),
              0,
            ),
            resultCount: windowResults.length,
          };
        };
        const current = activityIn(currentStart, currentEnd);
        const previous = activityIn(previousStart, previousEnd);
        const hadResultBeforePreviousWindow = studentResults.some(
          (result) => new Date(result.created_at) < previousStart,
        );
        const currentBand = getStudentEngagementBand(
          current.resultCount > 0,
          current.seconds,
          previous.resultCount > 0 || hadResultBeforePreviousWindow,
        );
        const previousBand = getStudentEngagementBand(
          previous.resultCount > 0,
          previous.seconds,
          hadResultBeforePreviousWindow,
        );

        return {
          currentMinutes: current.seconds / 60,
          currentBand,
          previousBand,
          movementPoints: MOVEMENT_POINTS[`${previousBand}-${currentBand}`],
        };
      });
      const greenMinutes = movements
        .filter((student) => student.currentBand === 'green')
        .map((student) => student.currentMinutes);
      const yellowMinutes = movements
        .filter((student) => student.currentBand === 'yellow')
        .map((student) => student.currentMinutes);

      return [
        average(greenMinutes) +
          average(yellowMinutes) +
          movements.reduce((sum, student) => sum + student.movementPoints, 0),
      ];
    });

    return {
      date: displayDate,
      score: Math.round(isActive ? average(classScores) : 0),
    };
  });
};
