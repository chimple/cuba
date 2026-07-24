import {
  EVENTS,
  LIDO_SCORES_KEY,
  RESULT_STATUS,
  REWARD_LESSON,
} from '../common/constants';
import { Util } from '../utility/util';
import { palUtil } from '../utility/palUtil';
import logger from '../utility/logger';
export const processLidoStoredResults = async (
  ctx: any,
  isAborted: boolean = false,
  isFullPathwayTerminated: boolean = false,
) => {
  const {
    api,
    assignment,
    courseDetail,
    courseDocId,
    doesSkillBelongToCourseSubject,
    getCoursePalContext,
    getStoredLidoScores,
    getTotalStoredLessonTime,
    isAssessmentLesson,
    lesson,
    playedFrom,
    push,
    resolveStudentContext,
    source,
    state,
  } = ctx;
  try {
    const scoresList = getStoredLidoScores();
    const {
      student: currentStudent,
      studentId,
      userId,
    } = await resolveStudentContext();
    if (scoresList.length === 0) {
      logger.warn('?? No stored data found.');
      return;
    }
    if (!currentStudent || !studentId) {
      throw new Error('[LidoPlayer] Student context missing');
    }
    const parentUserId = userId;
    const totalLessonTime = getTotalStoredLessonTime(scoresList);
    let dbMetaData: any = {};
    try {
      const lessonRow = await api.getLesson(lesson.id);
      dbMetaData = lessonRow?.metadata
        ? typeof lessonRow.metadata === 'string'
          ? JSON.parse(lessonRow.metadata)
          : lessonRow.metadata
        : typeof lesson.metadata === 'string'
          ? JSON.parse(lesson.metadata || '{}')
          : lesson.metadata || {};
    } catch (e) {
      logger.error('Meta error', e);
    }
    const activitiesMeta = dbMetaData?.activity || {};
    const skillAggregator = new Map<
      string,
      {
        totalScore: number;
        count: number;
        resultsList: number[];
        correctMoves: number;
        wrongMoves: number;
        totalTimeSpent: number;
      }
    >();

    scoresList.forEach((record: any, idx: number) => {
      if (!record) return;

      const rawScore = record.score;
      const resultBin = record.result;

      // ?? Skill resolved by ARRAY POSITION
      const activityMeta = activitiesMeta[idx];
      const skillId =
        typeof activityMeta?.skill_id === 'string'
          ? activityMeta.skill_id.trim()
          : '';

      if (!skillId) return;

      if (!skillAggregator.has(skillId)) {
        skillAggregator.set(skillId, {
          totalScore: 0,
          count: 0,
          resultsList: [],
          correctMoves: 0,
          wrongMoves: 0,
          totalTimeSpent: 0,
        });
      }
      const group = skillAggregator.get(skillId)!;
      group.totalScore += rawScore || 0;
      group.count += 1;
      group.resultsList.push(resultBin);
      group.correctMoves += record.correctMoves ?? 0;
      group.wrongMoves += record.wrongMoves ?? 0;
      group.totalTimeSpent += record.timeSpent ?? 0;
    });
    const learning_path: boolean = state?.learning_path ?? false;
    const is_homework: boolean = state?.isHomework ?? false;
    const isReward: boolean = state?.reward ?? false;
    const isDefaultLesson: boolean = state?.isDefaultLesson ?? false;

    const shouldGiveDailyReward =
      isReward ||
      ((learning_path || is_homework || isDefaultLesson) &&
        (await Util.shouldGiveDailyReward()));

    if (isAssessmentLesson && shouldGiveDailyReward) {
      sessionStorage.setItem(REWARD_LESSON, 'true');
    }

    for (const [skillId, group] of skillAggregator.entries()) {
      const averageScore = group.totalScore / group.count;
      const activitiesScoresStr = group.resultsList.join(',');

      let abilityUpdates: any = {};
      let courseSubjectIdForResult: string | undefined =
        courseDetail?.subject_id ?? undefined;
      try {
        const currentCourseId = courseDetail?.id ?? courseDocId ?? '';
        const { subjectId: courseSubjectId, hasFramework: courseHasFramework } =
          await getCoursePalContext(currentCourseId);
        courseSubjectIdForResult = courseSubjectId ?? courseSubjectIdForResult;
        const skillData = await api.getSkillById(skillId);
        const currentOutcomeId = skillData?.outcome_id;
        const canUpdateAbility =
          courseHasFramework &&
          (await doesSkillBelongToCourseSubject(courseSubjectId, skillId));

        if (canUpdateAbility) {
          const booleanOutcomes = group.resultsList.map((r) => r === 1);

          abilityUpdates = await palUtil.updateAndGetAbilities({
            studentId,
            courseId: currentCourseId,
            skillId,
            outcomes: booleanOutcomes,
          });

          if (!abilityUpdates.skill_id) abilityUpdates.skill_id = skillId;
          if (!abilityUpdates.outcome_id)
            abilityUpdates.outcome_id = currentOutcomeId;
        }
      } catch (e) {
        logger.error('PAL Error', e);
      }

      const isStudentLinked = await api.isStudentLinked(studentId);
      let classId;
      let schoolId;

      if (isStudentLinked) {
        const studentResult = await api.getStudentClassesAndSchools(studentId);
        if (studentResult?.classes?.length) {
          classId = studentResult.classes[0].id;
          schoolId = studentResult.schools[0].id;
        }
      }

      await api.updateResult(
        currentStudent,
        courseDetail?.id ?? courseDocId ?? '',
        lesson.id,
        Math.round(averageScore),
        group.correctMoves,
        group.wrongMoves,
        group.totalTimeSpent,
        assignment ?? null,
        null,
        classId,
        schoolId,
        false,
        false,
        abilityUpdates.skill_id,
        abilityUpdates.skill_ability,
        abilityUpdates.outcome_id,
        abilityUpdates.outcome_ability,
        abilityUpdates.competency_id,
        abilityUpdates.competency_ability,
        abilityUpdates.domain_id,
        abilityUpdates.domain_ability,
        isAssessmentLesson
          ? (abilityUpdates.subject_id ?? courseSubjectIdForResult)
          : abilityUpdates.subject_id,
        abilityUpdates.subject_ability,
        activitiesScoresStr,
        parentUserId,
        isAborted && isFullPathwayTerminated
          ? RESULT_STATUS.ASSESSMENT_TERMINATED
          : isAborted
            ? RESULT_STATUS.SYSTEM_EXIT
            : RESULT_STATUS.COMPLETED,
        source,
      );
    }

    Util.logEvent(EVENTS.RESULTS_SAVED, {
      user_id: parentUserId,
      student_id: studentId,
      lesson_id: lesson.id,
      course_id: courseDetail?.id ?? courseDocId ?? '',
      is_assessment: isAssessmentLesson,
      is_aborted: isAborted,
    });
    if (isAssessmentLesson) {
      Util.logEvent(EVENTS.ASSESSMENT_COMPLETED, {
        user_id: parentUserId,
        student_id: studentId,
        lesson_id: lesson.id,
        course_id: courseDetail?.id ?? courseDocId ?? '',
        is_assessment: true,
        played_from: playedFrom,
        time_spent: totalLessonTime, // ? correct total
      });
    }

    if (learning_path) {
      await Util.updateLearningPath(
        currentStudent,
        isReward,
        isFullPathwayTerminated,
        courseDetail?.id ?? courseDocId ?? '',
        isAssessmentLesson,
      );
    }
    localStorage.removeItem(LIDO_SCORES_KEY);
  } catch (error) {
    logger.error('? Failed to process lesson end', error);
    push();
  }
};
