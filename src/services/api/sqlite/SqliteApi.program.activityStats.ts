import { TABLES, TableTypes } from '../../../common/constants';
import { RoleType } from '../../../interface/modelInterfaces';
import logger from '../../../utility/logger';
import { SqliteApiProgramUserRoles } from './SqliteApi.program.userRoles';

export class SqliteApiProgramActivityStats extends SqliteApiProgramUserRoles {
  [key: string]: any;
  async getChapterIdbyQrLink(
    link: string,
  ): Promise<TableTypes<'chapter_links'> | undefined> {
    await this.ensureInitialized();
    if (!link) return;
    try {
      const res = await this._db?.query(
        `SELECT * FROM ${TABLES.ChapterLinks} WHERE link = ? AND is_deleted = 0 LIMIT 1;`,
        [link],
      );

      if (!res || !res.values || res.values.length < 1) return;
      return res.values[0];
    } catch (error) {
      logger.error('Error fetching chapter by QR link:', error);
      return;
    }
  }

  async program_activity_stats(programId: string): Promise<{
    total_students: number;
    total_teachers: number;
    total_schools: number;
    active_student_percentage: number;
    active_teacher_percentage: number;
    avg_weekly_time_minutes: number;
  }> {
    return await this._serverApi.program_activity_stats(programId);
  }

  async school_activity_stats(schoolId: string): Promise<{
    active_student_percentage: number;
    active_teacher_percentage: number;
    avg_weekly_time_minutes: number;
  }> {
    return await this._serverApi.school_activity_stats(schoolId);
  }

  async isProgramManager(): Promise<boolean> {
    return await this._serverApi.isProgramManager();
  }

  async getUserSpecialRoles(userId: string): Promise<string[]> {
    return await this._serverApi.getUserSpecialRoles(userId);
  }

  async updateSpecialUserRole(userId: string, role: string): Promise<void> {
    return await this._serverApi.updateSpecialUserRole(userId, role);
  }

  async deleteSpecialUser(userId: string): Promise<void> {
    return await this._serverApi.deleteSpecialUser(userId);
  }

  async updateProgramUserRole(userId: string, role: string): Promise<void> {
    return await this._serverApi.updateProgramUserRole(userId, role);
  }

  async deleteProgramUser(userId: string): Promise<void> {
    return await this._serverApi.deleteProgramUser(userId);
  }

  async deleteUserFromSchoolsWithRole(
    userId: string,
    role: RoleType,
  ): Promise<void> {
    return await this._serverApi.deleteUserFromSchoolsWithRole(userId, role);
  }

  async getChaptersByIds(
    chapterIds: string[],
  ): Promise<TableTypes<'chapter'>[]> {
    if (!chapterIds || chapterIds.length === 0) {
      logger.warn('getChaptersByIds was called with no chapter IDs.');
      return [];
    }

    try {
      const placeholders = chapterIds.map(() => '?').join(', ');

      const query = `SELECT *
        FROM ${TABLES.Chapter}
        WHERE id IN (${placeholders})
          AND is_deleted = 0;`;

      const res = await this.executeQuery(query, chapterIds);

      if (!res || !res.values) {
        logger.warn('No chapters found for the provided ChapterIDs');
        return [];
      }

      return res.values as TableTypes<'chapter'>[];
    } catch (error) {
      logger.error('Error fetching chapters', error);
      return [];
    }
  }

  async addParentToNewClass(classID: string, studentId: string) {
    throw new Error('Method not implemented.');
  }
}
