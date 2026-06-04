import {
  CampaignAssignmentChapterOption,
  CampaignAssignmentSubjectOption,
} from '../../../services/api/ServiceApi';
import { CampaignSetupFormState } from './types';

export type Frequency = 'daily' | 'alternate_days' | 'alternate_week';

export type AssignmentRow = {
  rowId: string;
  gradeId: string;
  courseId: string;
  chapterId: string;
  lessonId: string;
  lessonNo: number;
  date: string;
  lessonName: string;
  subjectName: string;
};

export type CampaignAssignmentDraft = {
  batchId: string;
  gradeId: string;
  schoolIds: string[];
  courseId: string;
  chapterId: string;
  lessonId: string;
  lessonName: string;
  subjectName: string;
  startsAt: string;
  endsAt: string | null;
  type: 'homework';
  source: 'campaign';
  setNumber: number;
};

export type GradeAssignmentConfig = {
  subjectIds: string[];
  frequency: Frequency;
  chapterIds: string[];
  expandedChapterIds: string[];
  removedRowIds: string[];
};

export const DEFAULT_FREQUENCY: Frequency = 'daily';

export const frequencyLabels: Record<Frequency, string> = {
  daily: 'Daily',
  alternate_days: 'Alternate Days',
  alternate_week: 'Alternate Week (≥ 2 weeks)',
};

export const createDefaultConfig = (): GradeAssignmentConfig => ({
  subjectIds: [],
  frequency: DEFAULT_FREQUENCY,
  chapterIds: [],
  expandedChapterIds: [],
  removedRowIds: [],
});

const parseDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDisplayDate = (value: string) =>
  value
    ? new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(parseDate(value))
    : '-';

const isSunday = (date: Date) => date.getDay() === 0;

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const getCampaignDaysWithoutSundays = (
  startDate: string,
  endDate: string,
) => {
  if (!startDate || !endDate) return 0;
  let count = 0;
  for (
    let day = parseDate(startDate);
    day <= parseDate(endDate);
    day = addDays(day, 1)
  ) {
    if (!isSunday(day)) count += 1;
  }
  return count;
};

const getScheduleDates = (
  startDate: string,
  endDate: string,
  frequency: Frequency,
  assignmentCount: number,
) => {
  if (!startDate || !endDate || assignmentCount === 0) return [];

  const dates: string[] = [];
  const end = parseDate(endDate);
  let cursor = parseDate(startDate);
  const increment =
    frequency === 'daily' ? 1 : frequency === 'alternate_days' ? 2 : 14;

  while (cursor <= end && dates.length < assignmentCount) {
    while (cursor <= end && isSunday(cursor)) {
      cursor = addDays(cursor, 1);
    }
    if (cursor <= end) dates.push(formatIsoDate(cursor));
    cursor = addDays(cursor, increment);
  }

  return dates;
};

const distributeDatesAcrossAssignments = (
  dates: string[],
  assignmentCount: number,
) => {
  if (dates.length === 0 || assignmentCount === 0) return [];

  const baseAssignmentsPerDate = Math.floor(assignmentCount / dates.length);
  const extraAssignments = assignmentCount % dates.length;
  const distributedDates: string[] = [];

  dates.forEach((date, dateIndex) => {
    const assignmentCountForDate =
      baseAssignmentsPerDate + (dateIndex < extraAssignments ? 1 : 0);
    for (let index = 0; index < assignmentCountForDate; index += 1) {
      distributedDates.push(date);
    }
  });

  return distributedDates;
};

export const isAlternateWeekEnabled = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) return false;
  const days =
    Math.round(
      (parseDate(endDate).getTime() - parseDate(startDate).getTime()) /
        (1000 * 60 * 60 * 24),
    ) + 1;
  return days >= 14;
};

export const buildRows = (
  gradeId: string,
  subjects: CampaignAssignmentSubjectOption[],
  config: GradeAssignmentConfig,
  form: CampaignSetupFormState,
) => {
  const selectedLessons: Array<{
    chapter: CampaignAssignmentChapterOption;
    lesson: CampaignAssignmentChapterOption['lessons'][number];
    subjectName: string;
    courseId: string;
  }> = [];

  subjects.forEach((subject) => {
    subject.chapters.forEach((chapter) => {
      if (config.chapterIds.includes(chapter.id)) {
        chapter.lessons.forEach((lesson) => {
          selectedLessons.push({
            chapter,
            lesson,
            subjectName: subject.name,
            courseId: subject.id,
          });
        });
      }
    });
  });

  const selectedLessonRows = selectedLessons
    .map(({ chapter, lesson, subjectName, courseId }, lessonIndex) => ({
      rowId: `${chapter.id}:${lesson.id}`,
      gradeId,
      courseId,
      chapterId: chapter.id,
      lessonId: lesson.id,
      lessonNo: lessonIndex + 1,
      lessonName: lesson.name,
      subjectName,
    }))
    .filter((row) => !config.removedRowIds.includes(row.rowId));

  const chapterDates = getScheduleDates(
    form.startDate,
    form.endDate,
    config.frequency,
    selectedLessonRows.length,
  );
  const assignmentDates = distributeDatesAcrossAssignments(
    chapterDates,
    selectedLessonRows.length,
  );

  return selectedLessonRows.map((row, index) => ({
    ...row,
    date: assignmentDates[index] || '',
    lessonNo: index + 1,
  }));
};

export const buildAssignmentDrafts = (
  rowsByGrade: Map<string, AssignmentRow[]>,
  schoolIds: string[],
  campaignId: string,
): CampaignAssignmentDraft[] =>
  Array.from(rowsByGrade.entries()).flatMap(([gradeId, rows]) =>
    rows
      .filter((row) => row.date)
      .map((row, index) => ({
        batchId: campaignId,
        gradeId,
        schoolIds,
        courseId: row.courseId,
        chapterId: row.chapterId,
        lessonId: row.lessonId,
        lessonName: row.lessonName,
        subjectName: row.subjectName,
        startsAt: row.date,
        endsAt: null,
        type: 'homework',
        source: 'campaign',
        setNumber: index + 1,
      })),
  );
