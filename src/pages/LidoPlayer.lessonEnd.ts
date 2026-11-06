import {
  ACTIVATION_REWARD_FLOW_KEY,
  ASSESSMENT_FAIL_KEY,
  EVENTS,
  FRESH_ASSESSMENT_AFTER_JOIN,
  FAIL_STREAK_KEY,
  HOMEWORK_PATHWAY,
  LIDO_SCORES_KEY,
  RESULT_STATUS,
  REWARD_LESSON,
} from '../common/constants';
import { ASSIGNMENT_COMPLETED_IDS } from '../common/courseConstants';
import { Util } from '../utility/util';
import { AvatarObj } from '../components/animation/Avatar';
import { palUtil } from '../utility/palUtil';
import logger from '../utility/logger';
import { getCachedXapiLaunchAnalyticsContext } from '../tincan';
import {
  HOMEWORK_REWARD_COMPLETED_INDEX_KEY,
  PENDING_HOMEWORK_REWARD_TRANSITION_KEY,
} from './LidoPlayer.helpers';

interface StoredActivityScore {
  result: 0 | 1;
  score: number;
  timeSpent?: number;
}

export const handleLidoLessonEnd = async (ctx: any, e: any) => {
  const {
    assessmentLessonEndSettlingRef,
    api,
    assignmentType,
    chapterDetail,
    courseDetail,
    doesSkillBelongToCourseSubject,
    exitLidoGame,
    getAssessmentFailStreak,
    getAssessmentProgressKey,
    getCoursePalContext,
    getNormalizedMoveCounts,
    getStoredLidoScores,
    isAssessmentLesson,
    lesson,
    lessonDetail,
    lessonId,
    logUserActivationLessonEvent,
    parseNumericValue,
    playedFrom,
    push,
    resolveStudentContext,
    resultFinalizationStartedRef,
    setGameResult,
    setIsLoading,
    setScoreCardProgressState,
    setShowDialogBox,
    shouldTerminateAssessmentPathway,
    source,
    state,
    waitForLearningPathAssessmentFinalizationSettle,
  } = ctx;
  if (resultFinalizationStartedRef.current) return;
  const isLearningPathAssessment = isAssessmentLesson && state?.learning_path;
  if (!isLearningPathAssessment) {
    resultFinalizationStartedRef.current = true;
    setIsLoading(true);
  }
  const lessonData = (e?.detail ?? {}) as any;
  const launchContext = getCachedXapiLaunchAnalyticsContext();
  const {
    student: currentStudent,
    studentId,
    userId,
  } = await resolveStudentContext();
  try {
    if (!currentStudent?.id || !studentId) {
      throw new Error(
        '[LidoPlayer] currentStudent missing while saving lesson result',
      );
    }
    const parentUserId = userId;
    const courseDocId: string | undefined = state.courseDocId;
    const { correctMoves, wrongMoves } = getNormalizedMoveCounts(lessonData);
    if (isAssessmentLesson) {
      if (isLearningPathAssessment) {
        if (assessmentLessonEndSettlingRef.current) return;
        assessmentLessonEndSettlingRef.current = true;
        await waitForLearningPathAssessmentFinalizationSettle();
        assessmentLessonEndSettlingRef.current = false;
        if (resultFinalizationStartedRef.current) return;
        resultFinalizationStartedRef.current = true;
        setIsLoading(true);
      }
      const courseKey = getAssessmentProgressKey();
      const isFullPathwayTerminated = await shouldTerminateAssessmentPathway(
        studentId,
        courseKey,
      );
      const isAssessmentSystemExit =
        !isFullPathwayTerminated &&
        getAssessmentFailStreak(studentId, courseKey) >= 4;
      Util.removeCourseScopedKey(FAIL_STREAK_KEY, studentId, courseKey);
      Util.removeCourseScopedKey(ASSESSMENT_FAIL_KEY, studentId, courseKey);
      localStorage.removeItem(FRESH_ASSESSMENT_AFTER_JOIN(studentId));
      if (isFullPathwayTerminated) {
        Util.logEvent(EVENTS.ASSESSMENT_TERMINATED, {
          user_id: parentUserId,
          student_id: studentId,
          lesson_id: lesson.id,
          course_id: courseDocId,
          is_assessment: isAssessmentLesson,
          played_from: playedFrom,
        });
      }
      resultFinalizationStartedRef.current = false;
      await exitLidoGame(
        isFullPathwayTerminated || isAssessmentSystemExit,
        isFullPathwayTerminated,
      );
      return;
    }
    const assignment = state.assignment;
    const currentCourseId = courseDetail?.id ?? courseDocId ?? '';
    const { subjectId: courseSubjectId, hasFramework: courseHasFramework } =
      await getCoursePalContext(currentCourseId);
    const skillId: string | undefined = state.skillId;
    let normalizedSkillId =
      courseHasFramework &&
      typeof skillId === 'string' &&
      skillId.trim().length > 0
        ? skillId.trim()
        : undefined;

    if (courseHasFramework && !normalizedSkillId) {
      const normalizeIdentifier = (value: unknown) =>
        typeof value === 'string' && value.trim().length > 0
          ? value.trim()
          : undefined;
      const lessonIdentifiers = Array.from(
        new Set(
          [
            lessonDetail?.lido_lesson_id,
            lessonId,
            lessonDetail?.cocos_lesson_id,
            lesson.id,
          ]
            .map(normalizeIdentifier)
            .filter((id): id is string => !!id),
        ),
      );
      for (const lessonIdentifier of lessonIdentifiers) {
        const skills = await api.getSkillByLessonIdentifier(lessonIdentifier);
        for (const skill of skills) {
          if (await doesSkillBelongToCourseSubject(courseSubjectId, skill.id)) {
            normalizedSkillId = skill.id;
            break;
          }
        }
        if (normalizedSkillId) break;
      }
    }
    // const currentStudent = api.currentStudent;
    const data = lessonData;
    // Assessment launches carry the assignment ID directly, so save results against that row.
    let assignmentId =
      state?.homeworkAssignmentId ??
      state?.assessmentId ??
      assignment?.id ??
      null;
    const scoresList = getStoredLidoScores() as StoredActivityScore[];
    const averageActivityScore =
      scoresList.length > 0
        ? Math.floor(
            scoresList.reduce((total, item) => total + item.score, 0) /
              scoresList.length,
          )
        : undefined;
    const finalScore = launchContext
      ? (parseNumericValue(data.finalScore) ?? averageActivityScore)
      : data.finalScore;
    let booleanOutcomes: boolean[] = [];
    let activitiesScoresStr = '';

    if (scoresList.length > 0) {
      booleanOutcomes = scoresList.map((item) => item.result === 1);
      activitiesScoresStr = scoresList.map((item) => item.result).join(',');
    }

    const isStudentLinked = await api.isStudentLinked(currentStudent.id);
    let classId;
    let schoolId;
    let chapter_id;
    if (isStudentLinked) {
      const studentResult = await api.getStudentClassesAndSchools(
        currentStudent.id,
      );
      if (!!studentResult && studentResult.classes.length > 0) {
        classId = studentResult.classes[0].id;
        schoolId = studentResult.schools[0].id;
      }
      if (!assignmentId) {
        const result = await api.getPendingAssignmentForLesson(
          lesson.id,
          classId ?? '',
          currentStudent.id,
        );
        if (result) {
          assignmentId = result?.id;
        }
      }
      chapter_id = await api.getChapterByLesson(lesson.id, classId);
    } else {
      chapter_id = await api.getChapterByLesson(
        lesson.id,
        undefined,
        currentStudent.id,
      );
    }

    // Check if the game was played from `learning_pathway`
    const learning_path: boolean = state?.learning_path ?? false;
    const is_homework: boolean = state?.isHomework ?? false;
    const homeworkIndex: number | undefined = state?.homeworkIndex;
    const storedLessonTime = scoresList.reduce(
      (total, item) => total + (item.timeSpent ?? 0),
      0,
    );
    const lessonTimeSpent =
      parseNumericValue(data.timeSpendForLesson) ??
      (launchContext ? storedLessonTime : 0);
    const totalMoves = launchContext
      ? (parseNumericValue(data.totalMoves) ?? correctMoves + wrongMoves)
      : data.totalMoves;
    const totalGames = launchContext
      ? (parseNumericValue(data.totalGames) ?? scoresList.length)
      : data.totalGames;
    // ?? PRE-CHECK: figure out *before* updating path if this is the last homework lesson
    let shouldGiveHomeworkBonus = false;
    if (is_homework) {
      try {
        const pathStr = localStorage.getItem(HOMEWORK_PATHWAY);
        if (!pathStr) {
          logger.warn(
            '[Homework bonus pre-check] No HOMEWORK_PATHWAY in sessionStorage',
          );
        } else {
          const path = JSON.parse(pathStr) as {
            lessons?: any[];
            currentIndex?: number;
          };
          const lessonsLen = path.lessons?.length ?? 0;
          const isLastLessonInPath =
            lessonsLen > 0 &&
            typeof homeworkIndex === 'number' &&
            homeworkIndex === lessonsLen - 1;
          if (isLastLessonInPath) {
            shouldGiveHomeworkBonus = true;
          }
        }
      } catch (err) {
        logger.error(
          '[Homework bonus pre-check] Error while reading HOMEWORK_PATHWAY',
          err,
        );
      }
    }
    let avatarObj = AvatarObj.getInstance();
    let finalProgressTimeSpent =
      avatarObj.weeklyTimeSpent['min'] * 60 + avatarObj.weeklyTimeSpent['sec'];
    finalProgressTimeSpent = finalProgressTimeSpent + lessonTimeSpent;
    let computeMinutes = Math.floor(finalProgressTimeSpent / 60);
    let computeSec = finalProgressTimeSpent % 60;
    avatarObj.weeklyTimeSpent['min'] = computeMinutes;
    avatarObj.weeklyTimeSpent['sec'] = computeSec;
    avatarObj.weeklyPlayedLesson++;
    setGameResult(data);
    const isReward: boolean = state?.reward ?? false;
    const shouldGiveDailyReward =
      isReward ||
      ((learning_path || is_homework) && (await Util.shouldGiveDailyReward()));
    if (shouldGiveDailyReward) {
      sessionStorage.setItem(REWARD_LESSON, 'true');
    }

    let abilityUpdates: any = {};
    let canUseSkillForAbility = false;
    if (normalizedSkillId && courseHasFramework) {
      try {
        canUseSkillForAbility = await doesSkillBelongToCourseSubject(
          courseSubjectId,
          normalizedSkillId,
        );

        if (canUseSkillForAbility) {
          abilityUpdates = await palUtil.updateAndGetAbilities({
            studentId: currentStudent.id,
            courseId: currentCourseId,
            skillId: normalizedSkillId,
            outcomes: booleanOutcomes,
          });
        }
      } catch (palError) {
        logger.warn(
          '[LidoPlayer] PAL ability update skipped due to invalid skill context',
          palError,
        );
        canUseSkillForAbility = false;
      }
    }

    const result = await api.updateResult(
      currentStudent,
      courseDocId,
      lesson.id,
      Math.round(finalScore ?? 0),
      correctMoves,
      wrongMoves,
      lessonTimeSpent,
      assignmentId,
      chapterDetail?.id ?? chapter_id?.toString() ?? '',
      classId,
      schoolId,
      false, // isImediateSync
      false, // isHomework
      canUseSkillForAbility ? normalizedSkillId : undefined,
      abilityUpdates.skill_ability,
      abilityUpdates.outcome_id,
      abilityUpdates.outcome_ability,
      abilityUpdates.competency_id,
      abilityUpdates.competency_ability,
      abilityUpdates.domain_id,
      abilityUpdates.domain_ability,
      abilityUpdates.subject_id,
      abilityUpdates.subject_ability,
      activitiesScoresStr,
      parentUserId,
      RESULT_STATUS.COMPLETED,
      source,
      lesson.name,
    );

    if (shouldGiveDailyReward && state?.isDefaultLesson) {
      sessionStorage.setItem(ACTIVATION_REWARD_FLOW_KEY, 'true');
    }

    // Update the learning path
    if (learning_path) {
      await Util.updateLearningPath(currentStudent, isReward);
    } else if (is_homework && homeworkIndex !== undefined) {
      // This handles our temporary homework path
      if (shouldGiveDailyReward) {
        sessionStorage.setItem(
          HOMEWORK_REWARD_COMPLETED_INDEX_KEY,
          String(homeworkIndex),
        );
      }
      await Util.refreshHomeworkPathWithLatestAfterIndex(homeworkIndex);
      // Snapshot before advancing: final lesson may remove HOMEWORK_PATHWAY.
      const pathBeforeAdvance = localStorage.getItem(HOMEWORK_PATHWAY);
      if (shouldGiveDailyReward && pathBeforeAdvance) {
        sessionStorage.setItem(
          PENDING_HOMEWORK_REWARD_TRANSITION_KEY,
          JSON.stringify({
            completedIndex: homeworkIndex,
            nextIndex: homeworkIndex + 1,
            pathSnapshot: pathBeforeAdvance,
          }),
        );
      }
      await Util.updateHomeworkPath(homeworkIndex);
    }

    if (shouldGiveHomeworkBonus) {
      try {
        const student = Util.getCurrentStudent() ?? currentStudent;
        if (student?.id) {
          const bonusStars = 10;
          const newLocalStars = Util.bumpLocalStarsForStudent(
            student.id,
            bonusStars,
            student.stars || 0,
          );
          try {
            await api.updateStudentStars(student.id, newLocalStars);
          } catch (err) {
            logger.warn(
              '[Homework bonus] Failed to sync +10 bonus to backend, keeping local only',
              err,
            );
          }
        }
      } catch (err) {
        logger.error(
          '[Homework bonus] Failed to award homework completion bonus',
          err,
        );
      }
    }
    Util.logEvent(EVENTS.LESSON_END, {
      user_id: parentUserId,
      student_id: studentId,
      result_id: result?.id ?? null,
      // assignment_id: lesson.assignment?.id,
      chapter_id: launchContext
        ? data.chapterId || chapterDetail?.id || chapter_id?.toString()
        : data.chapterId,
      lesson_id: launchContext
        ? data.lessonId ||
          lessonId ||
          lessonDetail?.lido_lesson_id ||
          lessonDetail?.id ||
          lesson.lido_lesson_id ||
          lesson.id
        : data.lessonId,
      lesson_type: launchContext
        ? data.lessonType || lessonDetail?.plugin_type
        : data.lessonType,
      lesson_session_id: data.lessonSessionId,
      ml_partner_id: data.mlPartnerId,
      ml_class_id: data.mlClassId,
      ml_student_id: data.mlStudentId,
      course_id: launchContext
        ? data.courseId || courseDetail?.id || courseDocId
        : data.courseId,
      course_name: launchContext
        ? data.courseName || courseDetail?.name
        : (courseDetail?.name ?? ''),
      ...(launchContext
        ? {
            lesson_name:
              data.lessonName ||
              lessonDetail?.name ||
              lesson.name ||
              launchContext.lessonName,
            chapter_name: data.chapterName || chapterDetail?.name,
          }
        : {}),
      time_spent: lessonTimeSpent,
      total_moves: totalMoves,
      total_games: totalGames,
      correct_moves: correctMoves,
      wrong_moves: wrongMoves,
      game_score: data.gameScore,
      quiz_score: data.quizScore,
      game_completed: data.gameCompleted,
      quiz_completed: data.quizCompleted,
      game_time_spent: data.gameTimeSpent,
      quiz_time_spent: data.quizTimeSpent,
      score: finalScore,
      played_from: playedFrom,
      assignment_type: assignmentType,
      source,
    });
    window.dispatchEvent(new CustomEvent(EVENTS.LESSON_END));
    logUserActivationLessonEvent({
      detail: data,
      userId: parentUserId,
      studentId,
      lessonTimeSpent,
      correctMoves,
      wrongMoves,
      resultId: result?.id ?? null,
      status: 'completed',
    });
    let tempAssignmentCompletedIds = localStorage.getItem(
      ASSIGNMENT_COMPLETED_IDS,
    );
    let assignmentCompletedIds;
    if (!tempAssignmentCompletedIds) {
      assignmentCompletedIds = {};
    } else {
      assignmentCompletedIds = JSON.parse(tempAssignmentCompletedIds);
    }
    if (!assignmentCompletedIds[studentId]) {
      assignmentCompletedIds[studentId] = [];
    }
    localStorage.setItem(
      ASSIGNMENT_COMPLETED_IDS,
      JSON.stringify(assignmentCompletedIds),
    );
    setIsLoading(false);
    setScoreCardProgressState({
      isAborted: false,
      isFullPathwayTerminated: false,
    });
    setShowDialogBox(true);
  } catch (error) {
    logger.error('? Failed to process lesson end', error);
    localStorage.removeItem(LIDO_SCORES_KEY);
    if (Util.isRespectMode) {
      // Let the learner leave through the completion screen after a RESPECT
      // launch even when result persistence is unavailable.
      setIsLoading(false);
      setShowDialogBox(true);
      return;
    }
    push();
  }
};
