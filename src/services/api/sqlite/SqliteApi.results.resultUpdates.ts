import { getDailyRewardClaimedEvent } from '../../../analytics/rewardEvents';
import {
  LATEST_STARS,
  MUTATE_TYPES,
  RESULT_STATUS,
  REWARD_LESSON,
  SOURCE,
  STUDENT_RESULT,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import { store } from '../../../redux/store';
import logger from '../../../utility/logger';
import { Util } from '../../../utility/util';
import { v4 as uuidv4 } from 'uuid';
import { SqliteApiCourseMedia } from './SqliteApi.course.media';

export class SqliteApiResultsResultUpdates extends SqliteApiCourseMedia {
  [key: string]: any;
  async updateResult(
    student: TableTypes<'user'>,
    courseId: string | undefined,
    lessonId: string,
    score: number,
    correctMoves: number,
    wrongMoves: number,
    timeSpent: number,
    assignmentId: string | undefined,
    chapterId: string,
    classId: string | undefined,
    schoolId: string | undefined,
    isImediateSync: boolean = false,
    isHomework: boolean = false,
    skill_id?: string | undefined,
    skill_ability?: number | undefined,
    outcome_id?: string | undefined,
    outcome_ability?: number | undefined,
    competency_id?: string | undefined,
    competency_ability?: number | undefined,
    domain_id?: string | undefined,
    domain_ability?: number | undefined,
    subject_id?: string | undefined,
    subject_ability?: number | undefined,
    activities_scores?: string | undefined,
    user_id?: string | undefined,
    status?: RESULT_STATUS | null,
    source?: SOURCE | null,
  ): Promise<TableTypes<'result'>> {
    let resultId = uuidv4();
    let isDuplicate = true;
    while (isDuplicate) {
      const check = await this.executeQuery(
        `SELECT id FROM result WHERE id = ? LIMIT 1`,
        [resultId],
      );
      if (!check?.values || check.values.length === 0) {
        isDuplicate = false;
      } else {
        resultId = uuidv4(); // now this won't throw error
      }
    }
    const newResult: TableTypes<'result'> = {
      id: resultId,
      assignment_id: assignmentId ?? null,
      correct_moves: correctMoves,
      lesson_id: lessonId,
      school_id: schoolId ?? null,
      score: score,
      student_id: student.id,
      time_spent: timeSpent,
      wrong_moves: wrongMoves,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
      chapter_id: chapterId,
      course_id: courseId ?? null,
      class_id: classId ?? null,
      firebase_id: null,
      is_firebase: null,
      skill_id: skill_id ?? null,
      skill_ability: skill_ability ?? null,
      outcome_id: outcome_id ?? null,
      outcome_ability: outcome_ability ?? null,
      competency_id: competency_id ?? null,
      competency_ability: competency_ability ?? null,
      domain_id: domain_id ?? null,
      domain_ability: domain_ability ?? null,
      subject_id: subject_id ?? null,
      subject_ability: subject_ability ?? null,
      activities_scores: activities_scores ?? null,
      user_id: user_id ?? null,
      status: (status ?? null) as TableTypes<'result'>['status'],
      source: source ?? null,
    };
    const res = await this.executeQuery(
      `
    INSERT INTO result (id, assignment_id, correct_moves, lesson_id, school_id, score, student_id, time_spent, wrong_moves, created_at, updated_at, is_deleted, course_id, chapter_id , class_id, skill_id, skill_ability, outcome_id, outcome_ability, competency_id, competency_ability, domain_id, domain_ability, subject_id, subject_ability, activities_scores,user_id, status, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `,
      [
        newResult.id,
        newResult.assignment_id,
        newResult.correct_moves,
        newResult.lesson_id,
        newResult.school_id,
        newResult.score,
        newResult.student_id,
        newResult.time_spent,
        newResult.wrong_moves,
        newResult.created_at,
        newResult.updated_at,
        newResult.is_deleted,
        newResult.course_id,
        newResult.chapter_id,
        newResult.class_id,
        newResult.skill_id,
        newResult.skill_ability,
        newResult.outcome_id,
        newResult.outcome_ability,
        newResult.competency_id,
        newResult.competency_ability,
        newResult.domain_id,
        newResult.domain_ability,
        newResult.subject_id,
        newResult.subject_ability,
        newResult.activities_scores,
        newResult.user_id,
        newResult.status,
        newResult.source,
      ],
    );
    // ⭐ reward update
    const currentUser = await this.getUserByDocId(student.id);
    const rewardLesson = sessionStorage.getItem(REWARD_LESSON);
    let newReward: { reward_id: string; timestamp: string } | null = null;
    let currentUserReward: { reward_id: string; timestamp: string } | null =
      null;

    if (rewardLesson == 'true' && currentUser) {
      sessionStorage.removeItem(REWARD_LESSON);

      const todaysReward = await Util.fetchTodaysReward();
      const todaysTimestamp = new Date().toISOString();

      currentUserReward = currentUser.reward
        ? JSON.parse(currentUser.reward as string)
        : null;

      if (todaysReward) {
        const alreadyGiven =
          currentUserReward &&
          currentUserReward.reward_id === todaysReward.id &&
          new Date(currentUserReward.timestamp).toISOString().split('T')[0] ===
            todaysTimestamp.split('T')[0];

        if (!alreadyGiven) {
          newReward = {
            reward_id: todaysReward.id,
            timestamp: todaysTimestamp,
          };
        }
      }
    }
    const lesson = await this.getLesson(lessonId);

    const isAssessment = lesson?.plugin_type === 'lido_assessment';

    let starsEarned = 0;
    if (isAssessment) {
      const assessmentKey = `assessment_star_state_${student.id}_${lessonId}`;
      const awarded = sessionStorage.getItem(assessmentKey) === 'true';
      if (!awarded) {
        starsEarned = 3;
        sessionStorage.setItem(assessmentKey, 'true');
      }
    } else {
      if (score > 25) starsEarned++;
      if (score > 50) starsEarned++;
      if (score > 75) starsEarned++;
    }

    if (starsEarned > 0) {
      const latestStarsKey = LATEST_STARS(student.id);
      const currentLocalStars = parseInt(
        localStorage.getItem(latestStarsKey) || '0',
      );
      localStorage.setItem(
        latestStarsKey,
        (currentLocalStars + starsEarned).toString(),
      );
    }
    let query = `UPDATE ${TABLES.User} SET `;
    let params: any[] = [];

    if (newReward !== null) {
      query += `reward = ?, `;
      params.push(JSON.stringify(newReward));
    }
    // Fetch fresh value only for star calculation
    const latestUserForStars = await this.getUserByDocId(student.id);
    const totalStars = (latestUserForStars?.stars || 0) + starsEarned;
    const latestLocalStarsForStudent = parseInt(
      localStorage.getItem(LATEST_STARS(student.id)) || '0',
    );
    const finalStarsToSet = Math.max(totalStars, latestLocalStarsForStudent);
    query += `stars =  ? WHERE id = ?;`;
    params.push(finalStarsToSet, student.id);

    await this.executeQuery(query, params);

    const updatedStudent = await this.getUserByDocId(student.id);
    if (updatedStudent) {
      updatedStudent.language_id = student.language_id;
      Util.setCurrentStudent(updatedStudent);
      Util.setLocalStarsForStudent(
        updatedStudent.id,
        updatedStudent.stars || 0,
      );
    }
    this.updatePushChanges(TABLES.Result, MUTATE_TYPES.INSERT, newResult);
    const pushData: any = {
      id: student.id,
      stars: updatedStudent?.stars,
    };
    if (newReward !== null && currentUser) {
      let userId: string = 'anonymous';
      try {
        const data = store.getState()?.auth?.user;
        if (!data || !data.id)
          throw new Error('User data or ID is missing in the store');
        userId = data?.id ?? 'anonymous';
      } catch (error) {
        logger.error('Failed to get user from redux store:', error);
      }
      pushData.reward = JSON.stringify(newReward);
      await Util.logEvent(getDailyRewardClaimedEvent(source), {
        user_id: userId,
        student_id: currentUser.id,
        reward_id: newReward.reward_id,
        prev_reward_id: currentUserReward?.reward_id ?? null,
        timestamp: newReward.timestamp,
        source: source ?? null,
        course_id: courseId ?? null,
        chapter_id: chapterId,
        lesson_id: lessonId,
        assignment_id: assignmentId ?? null,
        class_id: classId ?? null,
        school_id: schoolId ?? null,
        score: score,
        stars_earned: starsEarned,
      });
    }
    this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, pushData);

    try {
      const studentResultStr = sessionStorage.getItem(STUDENT_RESULT);
      const studentResultObj = studentResultStr
        ? JSON.parse(studentResultStr)
        : {};
      studentResultObj[student.id] = true;
      sessionStorage.setItem(STUDENT_RESULT, JSON.stringify(studentResultObj));
    } catch (e) {
      logger.error('Failed to set studentResult in sessionStorage', e);
    }

    return newResult;
  }
}
