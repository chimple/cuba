import {
  ASSESSMENT_FAIL_KEY,
  EVENTS,
  FAIL_STREAK_KEY,
  LIDO_SCORES_KEY,
  PROBLEM_END,
} from '../common/constants';
import { getCachedXapiLaunchAnalyticsContext } from '../tincan';
import { Util } from '../utility/util';
export const handleLidoActivityEnd = async (ctx: any, e: any) => {
  const {
    chapterDetail,
    courseDetail,
    courseDocId,
    exitLidoGame,
    getAssessmentProgressKey,
    getNormalizedMoveCounts,
    getStoredLidoScores,
    isAssessmentLesson,
    lesson,
    lessonDetail,
    lessonId,
    parseNumericValue,
    playedFrom,
    resolveStudentContext,
    resultFinalizationStartedRef,
    shouldTerminateAssessmentPathway,
  } = ctx;
  const { studentId, userId } = await resolveStudentContext();
  const detail = (e.detail ?? {}) as any;
  const launchContext = getCachedXapiLaunchAnalyticsContext();
  const score = launchContext
    ? (parseNumericValue(detail.score) ?? 0)
    : (detail.score ?? 0);
  const timeSpentForActivity =
    parseNumericValue(detail.timeSpentForActivity) ?? 0;
  const { correctMoves, wrongMoves } = getNormalizedMoveCounts(detail);
  const isFail = score < 70;
  const binaryScore: 0 | 1 = isFail ? 0 : 1;
  const scoresList = getStoredLidoScores();
  scoresList.push({
    score,
    result: binaryScore,
    correctMoves,
    wrongMoves,
    elapsedTime: timeSpentForActivity,
    timeSpent: timeSpentForActivity,
  });
  localStorage.setItem(LIDO_SCORES_KEY, JSON.stringify(scoresList));

  if (launchContext) {
    const activityScore = parseNumericValue(detail.score);
    const currentIndex = parseNumericValue(detail.currentIndex);
    const rightMoves = parseNumericValue(detail.rightMoves);
    const totalMoves = parseNumericValue(detail.totalMoves);
    Util.logEvent(PROBLEM_END, {
      lesson_id:
        detail.lessonId ||
        lessonId ||
        lessonDetail?.lido_lesson_id ||
        lessonDetail?.id ||
        lesson.lido_lesson_id ||
        lesson.id,
      lesson_name:
        detail.lessonName ||
        lessonDetail?.name ||
        lesson.name ||
        launchContext.lessonName,
      chapter_id: detail.chapterId || chapterDetail?.id,
      chapter_name: detail.chapterName || chapterDetail?.name,
      course_id: detail.courseId || courseDetail?.id || courseDocId,
      course_name: detail.courseName || courseDetail?.name,
      activity_index: currentIndex === undefined ? undefined : currentIndex + 1,
      activity_total: parseNumericValue(detail.totalIndex),
      score: activityScore,
      is_correct: activityScore === undefined ? undefined : activityScore >= 70,
      correct_moves: rightMoves,
      wrong_moves: parseNumericValue(detail.wrongMoves),
      total_moves:
        totalMoves ??
        (rightMoves === undefined
          ? undefined
          : rightMoves + (parseNumericValue(detail.wrongMoves) ?? 0)),
      time_spent: timeSpentForActivity,
      game_completed: detail.gameCompleted,
    });
  }

  if (!studentId) return;
  const parentUserId = userId;
  if (isAssessmentLesson) {
    const assessmentKey = `assessment_star_state_${studentId}_${lesson.id}`;
    if (sessionStorage.getItem(assessmentKey) !== 'true') {
      sessionStorage.setItem(assessmentKey, 'false'); // not yet awarded
    }
  }
  if (!isAssessmentLesson) return;
  const courseKey = getAssessmentProgressKey();
  const failKey = `${ASSESSMENT_FAIL_KEY}_${studentId}`;
  const streakKey = `${FAIL_STREAK_KEY}_${studentId}`;
  const failMap: Record<string, boolean> = JSON.parse(
    localStorage.getItem(failKey) || '{}',
  );
  const streakMap: Record<string, number> = JSON.parse(
    localStorage.getItem(streakKey) || '{}',
  );
  let failStreak = streakMap[courseKey] || 0;
  /* ? Correct answer ? reset streak */
  if (!isFail) {
    streakMap[courseKey] = 0;
    localStorage.setItem(streakKey, JSON.stringify(streakMap));
    return;
  }
  failStreak += 1;
  streakMap[courseKey] = failStreak;
  localStorage.setItem(streakKey, JSON.stringify(streakMap));
  const previousLessonSkipped = await shouldTerminateAssessmentPathway(
    studentId,
    courseKey,
  );
  if (resultFinalizationStartedRef.current) return;
  if (previousLessonSkipped) {
    const courseKey = getAssessmentProgressKey();
    Util.removeCourseScopedKey(FAIL_STREAK_KEY, studentId, courseKey);
    Util.removeCourseScopedKey(ASSESSMENT_FAIL_KEY, studentId, courseKey);
    const isAborted = true;
    const isFullPathwayTerminated = true;
    await exitLidoGame(isAborted, isFullPathwayTerminated); // aborted + full pathway terminated
    Util.logEvent(EVENTS.ASSESSMENT_TERMINATED, {
      user_id: parentUserId,
      student_id: studentId,
      lesson_id: lesson.id,
      course_id: courseDocId,
      is_assessment: isAssessmentLesson,
      played_from: playedFrom,
    }); // aborted
    return;
  }
  if (failStreak >= 4) {
    failMap[courseKey] = true;
    localStorage.setItem(failKey, JSON.stringify(failMap));
    streakMap[courseKey] = 0;
    localStorage.setItem(streakKey, JSON.stringify(streakMap));
    Util.logEvent(EVENTS.ASSESSMENT_ABORTED, {
      user_id: parentUserId,
      student_id: studentId,
      lesson_id: lesson.id,
      course_id: courseDocId,
      is_assessment: isAssessmentLesson,
      played_from: playedFrom,
    }); // aborted
    const isAborted = true;
    await exitLidoGame(isAborted); // skipped
  }
};

export const handleLidoGameExit = async (ctx: any, e: any) => {
  const {
    assignmentType,
    chapterDetail,
    courseDetail,
    getAssessmentProgressKey,
    getNormalizedMoveCounts,
    lesson,
    lessonDetail,
    logUserActivationLessonEvent,
    parseNumericValue,
    playedFrom,
    push,
    resolveStudentContext,
  } = ctx;
  const data = (e.detail ?? {}) as any;
  const { studentId, userId } = await resolveStudentContext();
  if (!studentId) {
    push();
    return;
  }

  const parentUserId = userId;
  const courseKey = getAssessmentProgressKey();
  Util.removeCourseScopedKey(FAIL_STREAK_KEY, studentId, courseKey);

  const { correctMoves, wrongMoves } = getNormalizedMoveCounts(data);
  const lessonTimeSpent = parseNumericValue(data.timeSpendForLesson) ?? 0;
  Util.logEvent(EVENTS.LESSON_INCOMPLETE, {
    user_id: parentUserId,
    student_id: studentId,
    // assignment_id: lessonDetail.assignment?.id,
    left_game_no: data.currentGameNumber,
    left_game_name: data.gameName,
    chapter_id: data.chapterId,
    chapter_name: chapterDetail?.name ?? '',
    lesson_id: data.lessonId,
    lesson_name: lessonDetail?.name ?? lesson?.name ?? '',
    lesson_type: data.lessonType,
    lesson_session_id: data.lessonSessionId,
    ml_partner_id: data.mlPartnerId,
    ml_class_id: data.mlClassId,
    ml_student_id: data.mlStudentId,
    course_id: data.courseId,
    course_name: courseDetail?.name ?? '',
    time_spent: lessonTimeSpent,
    total_moves: data.totalMoves,
    total_games: data.totalGames,
    correct_moves: correctMoves,
    wrong_moves: wrongMoves,
    game_score: data.gameScore,
    quiz_score: data.quizScore,
    game_completed: data.gameCompleted,
    quiz_completed: data.quizCompleted,
    game_time_spent: data.gameTimeSpent,
    quiz_time_spent: data.quizTimeSpent,
    played_from: playedFrom,
    assignment_type: assignmentType,
  });
  logUserActivationLessonEvent({
    detail: data,
    userId: parentUserId,
    studentId,
    lessonTimeSpent,
    correctMoves,
    wrongMoves,
    resultId: null,
    status: 'incomplete',
  });
  push();
};
