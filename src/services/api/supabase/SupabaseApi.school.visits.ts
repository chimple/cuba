import {
  MUTATE_TYPES,
  PROFILETYPE,
  SchoolVisitAction,
  SchoolVisitType,
  TABLES,
  TableTypes,
} from '../../../common/constants';
import logger from '../../../utility/logger';
import { SupabaseApiAssignmentAssessments } from './SupabaseApi.assignment.assessments';

export interface SupabaseApiSchoolVisits {
  [key: string]: any;
}
export class SupabaseApiSchoolVisits extends SupabaseApiAssignmentAssessments {
  async updateSchoolLocation(
    schoolId: string,
    lat: number,
    lng: number,
  ): Promise<void> {
    const locationString = `https://www.google.com/maps?q=${lat},${lng}`;
    const updatedAt = new Date().toISOString();

    // Update directly in supabase
    await this.mutate(
      MUTATE_TYPES.UPDATE,
      TABLES.School,
      { location_link: locationString, updated_at: updatedAt },
      schoolId,
    );
  }

  async recordSchoolVisit(
    schoolId: string,
    lat: number,
    lng: number,
    action: SchoolVisitAction,
    visitType?: SchoolVisitType,
    distanceFromSchool?: number,
    numberOfParents?: number,
  ): Promise<TableTypes<'fc_school_visit'> | null> {
    try {
      if (!this.supabase) {
        logger.error('Supabase client not initialized');
        return null;
      }

      const {
        data: { user },
      } = await this.supabase.auth.getUser();
      if (!user) {
        logger.error('SupabaseApi: User not logged in');
        throw 'User is not Logged in';
      }

      const now = new Date().toISOString();

      if (action === SchoolVisitAction.CheckIn) {
        // Enforce enum format: "Regular Visit" -> "regular_visit"
        const newVisit = {
          school_id: schoolId,
          user_id: user.id,
          check_in_at: now,
          check_in_lat: lat,
          check_in_lng: lng,
          type: visitType,
          is_deleted: false,
          distance_from_school:
            distanceFromSchool == null ? null : String(distanceFromSchool),
          number_of_parents: null,
        };

        const { data, error } = await this.supabase
          .from(TABLES.FcSchoolVisit)
          .insert(newVisit)
          .select()
          .single();

        if (error) {
          logger.error('SupabaseApi: Insert Error:', error);
          throw error;
        }
        return data;
      } else {
        const { data: openVisits, error: fetchError } = await this.supabase
          .from(TABLES.FcSchoolVisit)
          .select('*')
          .eq('user_id', user.id)
          .eq('school_id', schoolId)
          .is('check_out_at', null)
          .eq('is_deleted', false)
          .order('check_in_at', { ascending: false })
          .limit(1);

        if (fetchError) {
          logger.error('SupabaseApi: Error fetching open visit:', fetchError);
          throw fetchError;
        }

        if (openVisits && openVisits.length > 0) {
          const visitToUpdate = openVisits[0];
          const nextNumberOfParents =
            visitToUpdate.type === SchoolVisitType.Community
              ? numberOfParents == null
                ? visitToUpdate.number_of_parents
                : numberOfParents
              : null;

          const { data, error } = await this.supabase
            .from(TABLES.FcSchoolVisit)
            .update({
              check_out_at: now,
              check_out_lat: lat,
              check_out_lng: lng,
              number_of_parents: nextNumberOfParents,
              updated_at: now,
              distance_from_school:
                distanceFromSchool == null
                  ? visitToUpdate.distance_from_school
                  : String(distanceFromSchool),
            })
            .eq('id', visitToUpdate.id)
            .select()
            .single();

          if (error) {
            logger.error('SupabaseApi: Update Error:', error);
            throw error;
          }
          return data;
        } else {
          logger.warn('SupabaseApi: No active visit found to check out from.');
          return null;
        }
      }
    } catch (error) {
      logger.error(
        'SupabaseApi: Unexpected error recording school visit:',
        error,
      );
      return null;
    }
  }

  async getLastSchoolVisit(
    schoolId: string,
  ): Promise<TableTypes<'fc_school_visit'> | null> {
    try {
      if (!this.supabase) return null;
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (!user) return null;

      const { data, error } = await this.supabase
        .from(TABLES.FcSchoolVisit)
        .select('*')
        .eq('school_id', schoolId)
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        logger.error('SupabaseApi: Error getting last visit:', error);
        return null;
      }

      return data;
    } catch (e) {
      logger.error('SupabaseApi: getLastSchoolVisit exception:', e);
      return null;
    }
  }

  async updateSchoolProfile(
    school: TableTypes<'school'>,
    name: string,
    group1: string,
    group2: string,
    group3: string,
    image: File | null,
    group4?: string | null,
    program_id?: string | null,
    udise?: string | null,
    address?: string | null,
  ): Promise<TableTypes<'school'>> {
    if (!this.supabase) return {} as TableTypes<'school'>;

    const result = image
      ? await this.addProfileImages(school.id, image, PROFILETYPE.SCHOOL)
      : school.image;
    // Prepare updated data
    const updatedSchool: TableTypes<'school'> = {
      name: name ?? school.name,
      group1: group1 ?? school.group1,
      group2: group2 ?? school.group2,
      group3: group3 ?? school.group3,
      image: result ?? school.image,
      group4: group4 ?? school.group4,
      program_id: program_id ?? school.program_id,
      udise: udise ?? school.udise,
      address: address ?? school.address,
      updated_at: new Date().toISOString(),
      created_at: school.created_at,
      id: school.id,
      is_deleted: false,
      model: null,
      academic_year: null,
      firebase_id: null,
      is_firebase: null,
      is_ops: null,
      language: null,
      ops_created_by: null,
      student_login_type: null,
      status: null,
      key_contacts: null,
      country: null,
      location_link: null,
      whatsapp_bot_number: null,
    };

    const { error } = await this.supabase
      .from(TABLES.School)
      .update(updatedSchool)
      .eq('id', school.id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating school profile:', error);
      throw error;
    }
    return updatedSchool;
  }
}
