import {
  ASSESSMENT_FAIL_KEY,
  EVENTS,
  FAIL_STREAK_KEY,
  LIDO_SCORES_KEY,
} from '../common/constants';
import { Util } from '../utility/util';
import { ServiceConfig } from '../services/ServiceConfig';
import logger from '../utility/logger';

export const createLidoPlayerControllerHelpers = (ctx: any) => {
  const {
    api,
    assignmentType,
    chapterDetail,
    courseDetail,
    courseDetailWithPathFields,
    courseDocId,
    isActivationLesson,
    isAssessmentLesson,
    lesson,
    lessonDetail,
    playedFrom,
    previousAssessmentSkippedRef,
    source,
  } = ctx;
  const getAssessmentProgressKey = () => {
    if (isAssessmentLesson && courseDetailWithPathFields?.subject_id) {
      const courseCode = (
        courseDetailWithPathFields.code ??
        courseDetailWithPathFields.course_code
      )
        ?.trim()
        ?.toLowerCase();
      const courseId =
        courseDetailWithPathFields.id ??
        courseDetailWithPathFields.course_id ??
        courseDocId;
      return courseCode
        ? `subject:${courseDetailWithPathFields.subject_id}:course:${courseCode}`
        : `subject:${courseDetailWithPathFields.subject_id}:course:${courseId}`;
    }
    return (
      courseDetailWithPathFields?.id ??
      courseDetailWithPathFields?.course_id ??
      courseDocId ??
      ''
    );
  };

  const resolveStudentContext = async (): Promise<{
    student: any;
    studentId: string | undefined;
    userId: string | undefined;
  }> => {
    const authHandler = ServiceConfig.getI()?.authHandler;
    const currentUser = await authHandler?.getCurrentUser();
    let student = Util.getCurrentStudent();
    if (!student) {
      student = currentUser;
    }
    return {
      student,
      studentId: student?.id ?? currentUser?.id,
      userId: currentUser?.id,
    };
  };

  const resolveLidoPlayerLanguage = async (): Promise<string> => {
    const authCurrentUser = ServiceConfig.getI().authHandler.currentUser as any;
    const { student } = await resolveStudentContext();
    const languageId = student?.language_id ?? authCurrentUser?.language_id;

    if (!languageId) {
      return 'en';
    }

    try {
      const languageDoc = await api.getLanguageWithId(languageId);
      return languageDoc?.code ?? 'en';
    } catch (error) {
      logger.error('[LidoPlayer] Failed to resolve player language', error);
      return 'en';
    }
  };

  const resolvePreviousAssessmentSkipped = async (
    studentId: string,
  ): Promise<boolean> => {
    if (previousAssessmentSkippedRef.current !== null) {
      return previousAssessmentSkippedRef.current;
    }

    const courseKey = courseDetail?.id ?? courseDocId ?? '';
    if (!courseKey) {
      previousAssessmentSkippedRef.current = false;
      return false;
    }

    try {
      const hasPendingAbort = await api.hasPendingAbortedAssessment(
        studentId,
        courseKey,
      );
      previousAssessmentSkippedRef.current = hasPendingAbort;
      return hasPendingAbort;
    } catch (error) {
      logger.error(
        '[LidoPlayer] Failed to resolve previous assessment skip state',
        error,
      );
      previousAssessmentSkippedRef.current = false;
      return false;
    }
  };

  const getCoursePalContext = async (
    courseId: string,
  ): Promise<{
    subjectId?: string | null;
    hasFramework: boolean;
  }> => {
    if (!courseId) return { hasFramework: false };

    if (courseDetail?.id === courseId || !courseDetail?.id) {
      if (courseDetail?.subject_id || courseDetail?.framework_id) {
        return {
          subjectId: courseDetail.subject_id,
          hasFramework: !!courseDetail.framework_id,
        };
      }
    }

    try {
      const course = await api.getCourse(courseId);
      return {
        subjectId: course?.subject_id,
        hasFramework: !!course?.framework_id,
      };
    } catch (error) {
      logger.warn(
        '[LidoPlayer] Failed to resolve course PAL context before update',
        error,
      );
      return { hasFramework: false };
    }
  };

  const doesSkillBelongToCourseSubject = async (
    courseSubjectId: string | null | undefined,
    skillId: string | undefined,
  ): Promise<boolean> => {
    if (!courseSubjectId || !skillId) return false;

    try {
      const skillSubject = await api.getSubjectBySkillId(skillId);
      return skillSubject?.id === courseSubjectId;
    } catch (error) {
      logger.warn(
        '[LidoPlayer] Failed to verify skill subject before PAL update',
        error,
      );
      return false;
    }
  };

  type LidoEventDetail = Record<string, unknown> & {
    chapterId?: string;
    courseId?: string;
    correctMoves?: number | string;
    currentGameNumber?: number | null;
    finalScore?: number | null;
    gameCompleted?: boolean;
    gameName?: string | null;
    gameScore?: number | null;
    gameTimeSpent?: number | null;
    lessonId?: string;
    lessonSessionId?: string;
    lessonType?: string;
    mlClassId?: string | null;
    mlPartnerId?: string | null;
    mlStudentId?: string | null;
    quizCompleted?: boolean;
    quizScore?: number | null;
    quizTimeSpent?: number | null;
    rightMoves?: number | string;
    score?: number | null;
    timeSpentForActivity?: number | null;
    timeSpendForLesson?: number | null;
    totalGames?: number;
    totalMoves?: number;
    wrongMoves?: number | string;
  };

  type StoredLidoScore = {
    score: number;
    result: 0 | 1;
    correctMoves?: number;
    wrongMoves?: number;
    elapsedTime?: number;
    timeSpent?: number;
  };

  const parseNumericValue = (value: unknown): number | undefined => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  };

  const getNormalizedMoveCounts = (detail: LidoEventDetail) => ({
    correctMoves:
      parseNumericValue(detail.correctMoves) ??
      parseNumericValue(detail.rightMoves) ??
      0,
    wrongMoves: parseNumericValue(detail.wrongMoves) ?? 0,
  });

  const getStoredLidoScores = (): StoredLidoScore[] => {
    const storedData = localStorage.getItem(LIDO_SCORES_KEY);
    if (!storedData) return [];

    const parsed = JSON.parse(storedData);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((record): StoredLidoScore => {
      const rawTimeSpent = parseNumericValue(record?.timeSpent) ?? 0;
      const rawElapsedTime = parseNumericValue(record?.elapsedTime);

      return {
        score: parseNumericValue(record?.score) ?? 0,
        result: record?.result === 1 ? 1 : 0,
        correctMoves: parseNumericValue(record?.correctMoves) ?? 0,
        wrongMoves: parseNumericValue(record?.wrongMoves) ?? 0,
        elapsedTime: rawElapsedTime ?? rawTimeSpent,
        timeSpent: rawTimeSpent,
      };
    });
  };

  const getTotalStoredLessonTime = (scoresList: StoredLidoScore[]): number =>
    scoresList.reduce((total, record) => total + (record.timeSpent ?? 0), 0);

  const shouldTerminateAssessmentPathway = async (
    studentId: string,
    courseKey: string,
  ): Promise<boolean> => {
    const failKey = `${ASSESSMENT_FAIL_KEY}_${studentId}`;
    const streakKey = `${FAIL_STREAK_KEY}_${studentId}`;
    const failMap: Record<string, boolean> = JSON.parse(
      localStorage.getItem(failKey) || '{}',
    );
    const streakMap: Record<string, number> = JSON.parse(
      localStorage.getItem(streakKey) || '{}',
    );
    const previousLessonSkipped =
      !!failMap[courseKey] ||
      (await resolvePreviousAssessmentSkipped(studentId));

    return previousLessonSkipped && (streakMap[courseKey] || 0) >= 2;
  };

  const getAssessmentFailStreak = (
    studentId: string,
    courseKey: string,
  ): number => {
    const streakKey = `${FAIL_STREAK_KEY}_${studentId}`;
    const streakMap: Record<string, number> = JSON.parse(
      localStorage.getItem(streakKey) || '{}',
    );

    return streakMap[courseKey] || 0;
  };

  const logUserActivationLessonEvent = ({
    detail,
    userId,
    studentId,
    lessonTimeSpent,
    correctMoves,
    wrongMoves,
    resultId,
    status,
  }: {
    detail: LidoEventDetail;
    userId?: string;
    studentId: string;
    lessonTimeSpent: number;
    correctMoves: number;
    wrongMoves: number;
    resultId?: string | null;
    status: 'completed' | 'incomplete';
  }) => {
    if (!isActivationLesson) {
      return;
    }

    Util.logEvent(EVENTS.USER_ACTIVATION_LESSON, {
      user_id: userId,
      student_id: studentId,
      result_id: resultId ?? null,
      chapter_id: detail.chapterId,
      chapter_name: chapterDetail?.name ?? '',
      lesson_id: detail.lessonId,
      lesson_name: lessonDetail?.name ?? lesson?.name ?? '',
      lesson_type: detail.lessonType,
      lesson_session_id: detail.lessonSessionId,
      ml_partner_id: detail.mlPartnerId,
      ml_class_id: detail.mlClassId,
      ml_student_id: detail.mlStudentId,
      course_id: detail.courseId,
      course_name: courseDetail?.name ?? '',
      time_spent: lessonTimeSpent,
      total_moves: detail.totalMoves,
      total_games: detail.totalGames,
      correct_moves: correctMoves,
      wrong_moves: wrongMoves,
      game_score: detail.gameScore,
      quiz_score: detail.quizScore,
      game_completed: detail.gameCompleted,
      quiz_completed: detail.quizCompleted,
      game_time_spent: detail.gameTimeSpent,
      quiz_time_spent: detail.quizTimeSpent,
      score: detail.finalScore,
      played_from: playedFrom,
      assignment_type: assignmentType,
      source,
      status,
    });
  };
  return {
    getAssessmentFailStreak,
    getAssessmentProgressKey,
    getCoursePalContext,
    getNormalizedMoveCounts,
    getStoredLidoScores,
    getTotalStoredLessonTime,
    doesSkillBelongToCourseSubject,
    logUserActivationLessonEvent,
    parseNumericValue,
    resolveLidoPlayerLanguage,
    resolveStudentContext,
    shouldTerminateAssessmentPathway,
  };
};
