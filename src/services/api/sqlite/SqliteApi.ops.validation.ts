import { MUTATE_TYPES, TABLES } from '../../../common/constants';
import { SqliteApiOpsSchoolUsers } from './SqliteApi.ops.schoolUsers';

export class SqliteApiOpsValidation extends SqliteApiOpsSchoolUsers {
  [key: string]: any;
  async updateSchoolLastModified(schoolId: string): Promise<void> {
    const updatedAt = new Date().toISOString();
    await this.executeQuery(`UPDATE school SET updated_at = ? WHERE id = ?;`, [
      updatedAt,
      schoolId,
    ]);
    this.updatePushChanges(TABLES.School, MUTATE_TYPES.UPDATE, {
      id: schoolId,
      updated_at: updatedAt,
    });
  }

  async updateClassLastModified(classId: string): Promise<void> {
    const updatedAt = new Date().toISOString();
    await this.executeQuery(`UPDATE class SET updated_at = ? WHERE id = ?;`, [
      updatedAt,
      classId,
    ]);
    this.updatePushChanges(TABLES.Class, MUTATE_TYPES.UPDATE, {
      id: classId,
      updated_at: updatedAt,
    });
  }

  async updateUserLastModified(userId: string): Promise<void> {
    const updatedAt = new Date().toISOString();
    await this.executeQuery(`UPDATE user SET updated_at = ? WHERE id = ?;`, [
      updatedAt,
      userId,
    ]);
    this.updatePushChanges(TABLES.User, MUTATE_TYPES.UPDATE, {
      id: userId,
      updated_at: updatedAt,
    });
  }

  async validateParentAndStudentInClass(
    phoneNumber: string,
    studentName: string,
    className: string,
    schoolId: string,
  ): Promise<{ status: string; errors?: string[]; message?: string }> {
    const validatedData = await this._serverApi.validateParentAndStudentInClass(
      schoolId,
      studentName,
      className,
      phoneNumber,
    );
    if (validatedData.status === 'error') {
      const errors = validatedData.errors?.map((err: any) =>
        typeof err === 'string' ? err : err.message || JSON.stringify(err),
      );
      return { status: 'error', errors };
    }

    return { status: 'success' };
  }

  async validateSchoolUdiseCode(
    schoolId: string,
  ): Promise<{ status: string; errors?: string[] }> {
    const validatedData =
      await this._serverApi.validateSchoolUdiseCode(schoolId);
    if (validatedData.status === 'error') {
      const errors = validatedData.errors?.map((err: any) =>
        typeof err === 'string' ? err : err.message || JSON.stringify(err),
      );
      return { status: 'error', errors };
    }

    return { status: 'success' };
  }

  async validateProgramName(
    programName: string,
  ): Promise<{ status: string; errors?: string[] }> {
    const validatedData =
      await this._serverApi.validateProgramName(programName);
    if (validatedData.status === 'error') {
      const errors = validatedData.errors?.map((err: any) =>
        typeof err === 'string' ? err : err.message || JSON.stringify(err),
      );
      return { status: 'error', errors };
    }

    return { status: 'success' };
  }

  async validateClassNameWithSchoolID(
    schoolId: string,
    className: string,
  ): Promise<{ status: string; errors?: string[] }> {
    const validatedData = await this._serverApi.validateClassNameWithSchoolID(
      schoolId,
      className,
    );
    if (validatedData.status === 'error') {
      const errors = validatedData.errors?.map((err: any) =>
        typeof err === 'string' ? err : err.message || JSON.stringify(err),
      );
      return { status: 'error', errors };
    }

    return { status: 'success' };
  }

  async validateStudentInClassWithoutPhone(
    studentName: string,
    className: string,
    schoolId: string,
  ): Promise<{ status: string; errors?: string[]; message?: string }> {
    const validatedData =
      await this._serverApi.validateStudentInClassWithoutPhone(
        studentName,
        className,
        schoolId,
      );
    if (validatedData.status === 'error') {
      const errors = validatedData.errors?.map((err: any) =>
        typeof err === 'string' ? err : err.message || JSON.stringify(err),
      );
      return { status: 'error', errors };
    }

    return { status: 'success' };
  }

  async validateSchoolData(
    schoolId: string,
    schoolName: string,
  ): Promise<{ status: string; errors?: string[] }> {
    const schoolData = await this._serverApi.validateSchoolData(
      schoolId,
      schoolName,
    );
    if (schoolData.status === 'error') {
      return { status: 'error', errors: schoolData.errors };
    }
    return { status: 'success' };
  }

  async validateClassCurriculumAndSubject(
    curriculumName: string,
    subjectName: string,
    gradeName: string,
  ): Promise<{ status: string; errors?: string[] }> {
    const ClassCurriculum =
      await this._serverApi.validateClassCurriculumAndSubject(
        curriculumName,
        subjectName,
        gradeName,
      );
    if (ClassCurriculum.status === 'error') {
      return {
        status: 'error',
        errors: ClassCurriculum.errors || ['Invalid class curriculum'],
      };
    }
    return { status: 'success' };
  }

  async validateUserContacts(
    programManagerPhone: string,
    fieldCoordinatorPhone?: string,
  ): Promise<{ status: string; errors?: string[] }> {
    const response = await this._serverApi.validateUserContacts(
      programManagerPhone,
      fieldCoordinatorPhone,
    );
    if (response.status === 'error') {
      return {
        status: 'error',
        errors: response.errors || ['Invalid user contacts'],
      };
    }
    return { status: 'success' };
  }

  async deleteOldDebugInfoData(): Promise<void> {
    const deleteQuery = `
      DELETE FROM debug_info
      WHERE DATE(created_at) < DATE('now', '-30 days')
    `;
    await this.executeQuery(deleteQuery);
  }

  protected async createDebugInfoTables() {
    const createDebugInfoTable = `
      CREATE TABLE IF NOT EXISTS debug_info (
        id TEXT NOT NULL PRIMARY KEY,
        parent_id TEXT NOT NULL,
        No_of_pushed INTEGER,
        No_of_pulled INTEGER,
        data_transferred INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL
      )
    `;
    await this.executeQuery(createDebugInfoTable);
  }
}
