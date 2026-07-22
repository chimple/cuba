import {
  LIDO_ASSESSMENT,
  TABLESORTBY,
  TableTypes,
} from '../../common/constants';
import { addDays, subDays } from 'date-fns';
import { Util } from '../util';
import logger from '../logger';
import { ClassUtilPeriodReports } from './ClassUtilPeriodReports';

export class ClassUtilAssignmentReports extends ClassUtilPeriodReports {
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
    if (sortBy === TABLESORTBY.NAME)
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
}
