import { v4 as uuidv4 } from 'uuid';
import { getDailyRewardClaimedEvent } from '../../../analytics/rewardEvents';
import {
  RESULT_STATUS,
  REWARD_LESSON,
  SOURCE,
  TableTypes,
} from '../../../common/constants';
import logger from '../../../utility/logger';
import { Util } from '../../../utility/util';
import { SupabaseApiCourse } from './SupabaseApi.course';

type StudentProgressRowWithLesson = TableTypes<'result'> & {
  lesson?: {
    name?: string;
    chapter_lesson?:
      | {
          chapter?: {
            id?: string;
            name?: string;
            course_id?: string;
          } | null;
        }[]
      | null;
  } | null;
};
export interface SupabaseApiResultsResultUpdates {
  [key: string]: any;
}
export class SupabaseApiResultsResultUpdates extends SupabaseApiCourse {
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
    isImediateSync?: boolean,
    isHomework?: boolean,
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
    activities_scores?: string | null,
    user_id?: string | null,
    status?: RESULT_STATUS | null,
    source?: SOURCE | null,
  ): Promise<TableTypes<'result'>> {
    if (!this.supabase) return {} as TableTypes<'result'>;

    const resultId = uuidv4();
    const now = new Date().toISOString();

    const newResult: TableTypes<'result'> = {
      id: resultId,
      assignment_id: assignmentId ?? null,
      correct_moves: correctMoves,
      lesson_id: lessonId,
      school_id: schoolId ?? null,
      score,
      student_id: student.id,
      time_spent: timeSpent,
      wrong_moves: wrongMoves,
      created_at: now,
      updated_at: now,
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

    const { error: insertError } = await this.supabase
      .from('result')
      .insert(newResult);

    if (insertError) {
      logger.error('Error inserting result:', insertError);
      return {} as TableTypes<'result'>;
    }

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

    // Calculate earned stars
    let starsEarned = 0;
    if (score > 25) starsEarned++;
    if (score > 50) starsEarned++;
    if (score > 75) starsEarned++;

    const totalStars = Util.bumpLocalStarsForStudent(student.id, starsEarned);

    const updateData: any = { stars: totalStars };
    if (newReward) updateData.reward = JSON.stringify(newReward);
    // Update user stars
    const { error: updateError } = await this.supabase
      .from('user')
      .update(updateData)
      .eq('id', student.id);

    if (updateError) {
      logger.error('Error updating student stars:', updateError);
    }

    // Sync local student data
    const updatedStudent = await this.getUserByDocId(student.id);
    if (updatedStudent) {
      Util.setCurrentStudent(updatedStudent);
    }
    // 8️⃣ Log reward event if any
    if (newReward && currentUser) {
      await Util.logEvent(getDailyRewardClaimedEvent(source), {
        user_id: currentUser.id,
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
        score,
        stars_earned: starsEarned,
      });
    }

    return newResult;
  }
}
