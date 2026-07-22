import { TABLES, TableTypes } from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import {
  AssignmentDateRangeData,
  OpsStudentPerformanceBandRow,
  OpsStudentPerformanceBandsParams,
} from '../ServiceApi';
import { SupabaseApiAssignmentTeacherAssignments } from './SupabaseApi.assignment.teacherAssignments';
export interface SupabaseApiAssignmentStudentProgress {
  [key: string]: any;
}
export class SupabaseApiAssignmentStudentProgress extends SupabaseApiAssignmentTeacherAssignments {
  async getAssignmentDateRangeDataForClassAndSchool(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<AssignmentDateRangeData> {
    if (!this.supabase) return { assignments: [], batchGroups: [] };

    const { data, error } = await this.supabase
      .from(TABLES.Assignment)
      .select('*')
      .eq('created_by', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Error fetching assignment date range data:', error);
      return { assignments: [], batchGroups: [] };
    }

    const assignments = (data ?? []) as TableTypes<'assignment'>[];

    const grouped = new Map<
      string,
      {
        batchId: string | null;
        assignmentCount: number;
        latestCreatedAt: string | null;
      }
    >();

    assignments.forEach((row) => {
      const batchId = row.batch_id ?? null;
      const key = batchId ?? '__null__';
      const existing = grouped.get(key);

      if (!existing) {
        grouped.set(key, {
          batchId,
          assignmentCount: 1,
          latestCreatedAt: row.created_at ?? null,
        });
        return;
      }

      existing.assignmentCount += 1;
      existing.latestCreatedAt = row.created_at ?? existing.latestCreatedAt;
    });

    return {
      assignments,
      batchGroups: Array.from(grouped.values()),
    };
  }

  async getCoinAndStreakCount(
    userId: string,
    classId: string,
    schoolId: string,
  ): Promise<{ coins: number; streak: number } | undefined> {
    if (!this.supabase) return;
    const { data, error } = await this.supabase
      .from(TABLES.UserAchivements)
      .select('coins, streak')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .limit(1)
      .maybeSingle();
    if (error) {
      logger.error('Error fetching user achievements:', error);
      return;
    }
    if (!data) return;
    return { coins: data.coins, streak: data.streak };
  }

  async updateCoins(
    userId: string,
    schoolId: string,
    classId: string,
    coins: number,
    streakIncrement = 0,
  ): Promise<TableTypes<TABLES.UserAchivements>> {
    if (!this.supabase) return {} as TableTypes<TABLES.UserAchivements>;

    const now = new Date().toISOString();
    const coinsToAdd = Number(coins) || 0;
    const streakToAdd = Number(streakIncrement) || 0;

    // 1) Check if row already exists for this user/class/school
    const { data: existing, error: fetchError } = await this.supabase
      .from(TABLES.UserAchivements)
      .select('*')
      .eq('user_id', userId)
      .or('is_deleted.is.false,is_deleted.is.null')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      logger.error(
        'Error fetching user_achievements in updateCoins:',
        fetchError,
      );
      return {} as TableTypes<TABLES.UserAchivements>;
    }

    // 2) If exists -> update coins + updated_at
    if (existing) {
      const updatedCoins = Number(existing.coins ?? 1000) + coinsToAdd;
      const updatedStreak = Number(existing.streak ?? 0) + streakToAdd;

      const { error: updateError } = await this.supabase
        .from(TABLES.UserAchivements)
        .update({
          coins: updatedCoins,
          streak: updatedStreak,
          school_id: schoolId,
          class_id: classId,
          updated_at: now,
          is_deleted: false,
        })
        .eq('user_id', userId);

      if (updateError) {
        logger.error('Error updating user_achievements coins:', updateError);
        return {} as TableTypes<TABLES.UserAchivements>;
      }

      return {
        ...existing,
        coins: updatedCoins,
        streak: updatedStreak,
        updated_at: now,
        is_deleted: false,
      } as TableTypes<TABLES.UserAchivements>;
    }

    // 3) If not exists -> create row with default 1000 + reward coins
    const newRow: TableTypes<TABLES.UserAchivements> = {
      user_id: userId,
      school_id: schoolId,
      class_id: classId,
      program_id: null,
      coins: 1000 + coinsToAdd,
      streak: streakToAdd,
      last_rewarded_week: null,
      last_penalty_week: null,
      is_deleted: false,
      created_at: now,
      updated_at: now,
    };

    const { error: insertError } = await this.supabase
      .from(TABLES.UserAchivements)
      .insert(newRow);

    if (insertError) {
      logger.error('Error inserting user_achievements row:', insertError);
      return {} as TableTypes<TABLES.UserAchivements>;
    }

    return newRow;
  }

  async getTeacherJoinedDate(
    userId: string,
    classId: string,
  ): Promise<TableTypes<'class_user'> | undefined> {
    if (!this.supabase) return undefined;

    const { data, error } = await this.supabase
      .from(TABLES.ClassUser)
      .select('*')
      .eq('user_id', userId)
      .eq('role', RoleType.TEACHER)
      .eq('class_id', classId)
      .eq('is_deleted', false)
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching teacher joined date:', error);
      return undefined;
    }

    return data ?? undefined;
  }
  async getAssignedStudents(assignmentId: string): Promise<string[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from(TABLES.Assignment_user)
      .select('user_id')
      .eq('assignment_id', assignmentId)
      .eq('is_deleted', false);

    if (error) {
      logger.error('Error fetching assigned students:', error);
      return [];
    }

    const userIds: string[] = data?.map((row) => row.user_id) ?? [];
    return userIds ?? [];
  }
  async getStudentResultByDate(
    studentId: string,
    courseIds: string[],
    startDate: string,
    endDate: string,
    classId: string,
  ): Promise<TableTypes<'result'>[] | undefined> {
    if (!this.supabase) return;

    const { data, error } = await this.supabase
      .from(TABLES.Result)
      .select('*')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .in('course_id', courseIds)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching student result by date:', error);
      return;
    }

    return data ?? undefined;
  }
  async getStudentPlayStatus(
    studentId: string,
    classId: string,
  ): Promise<{ hasPlayed: boolean; lastPlayedAt?: string }> {
    if (!this.supabase) return { hasPlayed: false };

    const { data, error } = await this.supabase
      .from(TABLES.Result)
      .select('created_at')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      logger.error('Error fetching student play status:', error);
      return { hasPlayed: false };
    }

    if (!data || data.length === 0) return { hasPlayed: false };

    return { hasPlayed: true, lastPlayedAt: data[0].created_at };
  }
  async getOpsStudentPerformanceBands(
    params: OpsStudentPerformanceBandsParams,
  ): Promise<OpsStudentPerformanceBandRow[]> {
    if (!this.supabase) return [];

    const classIds = (params.classIds ?? []).filter(Boolean);
    const studentIds = (params.studentIds ?? []).filter(Boolean);

    if (classIds.length === 0 && studentIds.length === 0) {
      return [];
    }

    let query = this.supabase
      .from('student_performance_mv')
      .select('student_id,class_id,performance');

    if (classIds.length > 0) {
      query = query.in('class_id', classIds);
    }
    if (studentIds.length > 0) {
      query = query.in('student_id', studentIds);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching student performance bands:', error);
      return [];
    }

    return (data ?? []) as OpsStudentPerformanceBandRow[];
  }
}
