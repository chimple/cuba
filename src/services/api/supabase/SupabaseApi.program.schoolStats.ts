import { SchoolVisitType, TABLES } from '../../../common/constants';
import { FCSchoolStats } from '../../../ops-console/pages/SchoolDetailsPage';
import logger from '../../../utility/logger';
import { SupabaseApiProgramFieldCoordinator } from './SupabaseApi.program.fieldCoordinator';

export interface SupabaseApiProgramSchoolStats {
  [key: string]: any;
}
export class SupabaseApiProgramSchoolStats extends SupabaseApiProgramFieldCoordinator {
  async getSchoolStatsForSchool(schoolId: string): Promise<FCSchoolStats> {
    if (!this.supabase) {
      return {
        visits: 0,
        calls_made: 0,
        tech_issues: 0,
        parents_interacted: 0,
        parents_reached: 0,
        students_interacted: 0,
        teachers_interacted: 0,
      };
    }
    try {
      if (!schoolId) {
        logger.error('Error getting current school');
        return {
          visits: 0,
          calls_made: 0,
          tech_issues: 0,
          parents_interacted: 0,
          parents_reached: 0,
          students_interacted: 0,
          teachers_interacted: 0,
        };
      }
      const now = new Date();
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(now.getDate() - 15);
      const fromIso = fifteenDaysAgo.toISOString();
      const { count: visitsCount, error: visitsError } = await this.supabase
        .from('fc_school_visit')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .gte('created_at', fromIso)
        .is('is_deleted', false);
      if (visitsError) {
        logger.error('Error counting visits:', visitsError);
      }
      const visits = visitsCount ?? 0;
      const { data: forms, error: formsError } = await this.supabase
        .from('fc_user_forms')
        .select(
          'contact_method, call_status, contact_target, tech_issues_reported, created_at',
        )
        .eq('school_id', schoolId)
        .gte('created_at', fromIso)
        .is('is_deleted', false);
      if (formsError) {
        logger.error('Error fetching fc_user_forms:', formsError);
        return {
          visits,
          calls_made: 0,
          tech_issues: 0,
          parents_interacted: 0,
          parents_reached: 0,
          students_interacted: 0,
          teachers_interacted: 0,
        };
      }
      const parentsReachedBySchool = await this.getParentsReachedBySchoolIds([
        schoolId,
      ]);
      let calls_made = 0;
      let tech_issues = 0;
      let parents_interacted = 0;
      let students_interacted = 0;
      let teachers_interacted = 0;
      (forms || []).forEach((row: any) => {
        const isCallInteraction = row.contact_method === 'call';
        const isInPersonInteraction = row.contact_method === 'in_person';
        if (isCallInteraction) {
          calls_made += 1;
        }
        if (isCallInteraction || isInPersonInteraction) {
          if (row.contact_target === 'parent') {
            parents_interacted += 1;
          } else if (row.contact_target === 'student') {
            students_interacted += 1;
          } else if (row.contact_target === 'teacher') {
            teachers_interacted += 1;
          }
        }
        if (row.tech_issues_reported === true) {
          tech_issues += 1;
        }
      });
      return {
        visits,
        calls_made,
        tech_issues,
        parents_interacted,
        parents_reached: parentsReachedBySchool[schoolId] ?? 0,
        students_interacted,
        teachers_interacted,
      };
    } catch (err) {
      logger.error('Exception in getFCSchoolStatsForUser:', err);
      return {
        visits: 0,
        calls_made: 0,
        tech_issues: 0,
        parents_interacted: 0,
        parents_reached: 0,
        students_interacted: 0,
        teachers_interacted: 0,
      };
    }
  }

  async getParentsReachedBySchoolIds(
    schoolIds: string[],
  ): Promise<Record<string, number>> {
    const normalizedSchoolIds = [...new Set(schoolIds.filter(Boolean))];
    if (!this.supabase || normalizedSchoolIds.length === 0) {
      return {};
    }

    const { data, error } = await this.supabase
      .from(TABLES.FcSchoolVisit)
      .select('school_id, number_of_parents')
      .in('school_id', normalizedSchoolIds)
      .eq('type', SchoolVisitType.Community)
      .eq('is_deleted', false)
      .not('number_of_parents', 'is', null)
      .gt('number_of_parents', 0);

    if (error) {
      logger.error('Error fetching community visit parent counts:', error);
      return {};
    }

    return (data ?? []).reduce<Record<string, number>>((accumulator, visit) => {
      const schoolId = visit.school_id;
      if (!schoolId) {
        return accumulator;
      }

      const parentCount =
        typeof visit.number_of_parents === 'number'
          ? visit.number_of_parents
          : 0;
      accumulator[schoolId] = (accumulator[schoolId] ?? 0) + parentCount;
      return accumulator;
    }, {});
  }
}
