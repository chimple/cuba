import { TABLES, TableTypes } from '../../../common/constants';
import logger from '../../../utility/logger';
import { ServiceConfig } from '../../ServiceConfig';
import { SqliteApiSchoolProfiles } from './SqliteApi.school.profiles';

export class SqliteApiSchoolReferenceData extends SqliteApiSchoolProfiles {
  [key: string]: any;
  async getAllCurriculums(): Promise<TableTypes<'curriculum'>[]> {
    await this.ensureInitialized();
    const res = await this._db?.query(
      `SELECT * FROM ${TABLES.Curriculum} ORDER BY name ASC`,
    );
    logger.info('🚀 ~ SqliteApi ~ getAllCurriculums ~ res:', res);
    return res?.values ?? [];
  }

  async getAllGrades(): Promise<TableTypes<'grade'>[]> {
    await this.ensureInitialized();
    const res = await this._db?.query('select * from ' + TABLES.Grade);
    return res?.values ?? [];
  }

  async getAllLanguages(): Promise<TableTypes<'language'>[]> {
    await this.ensureInitialized();
    const res = await this._db?.query('select * from ' + TABLES.Language);
    logger.info('🚀 ~ SqliteApi ~ getAllLanguages ~ res:', res);
    return res?.values ?? [];
  }

  async getParentStudentProfiles(): Promise<TableTypes<'user'>[]> {
    await this.ensureInitialized();
    if (!this._db) throw 'Db is not initialized';
    const authHandler = ServiceConfig.getI()?.authHandler;
    const currentUser = await authHandler?.getCurrentUser();
    if (!currentUser) throw 'User is not Logged in';
    const query = `
  SELECT *
  FROM ${TABLES.ParentUser} AS parent
  JOIN ${TABLES.User} AS student ON parent.student_id = student.id
  WHERE parent.parent_id = "${currentUser.id}" AND parent.is_deleted = 0 AND student.is_deleted = 0;
`;
    const res = await this._db.query(query);
    return res.values ?? [];
  }

  get currentStudent(): TableTypes<'user'> | undefined {
    return this._currentStudent;
  }

  set currentStudent(value: TableTypes<'user'> | undefined) {
    this._currentStudent = value;
  }

  get currentClass(): TableTypes<'class'> | undefined {
    return this._currentClass;
  }

  set currentClass(value: TableTypes<'class'> | undefined) {
    this._currentClass = value;
  }

  get currentSchool(): TableTypes<'school'> | undefined {
    return this._currentSchool;
  }

  set currentSchool(value: TableTypes<'school'> | undefined) {
    this._currentSchool = value;
  }

  get currentCourse():
    | Map<string, TableTypes<'course'> | undefined>
    | undefined {
    return this._currentCourse;
  }

  set currentCourse(
    value: Map<string, TableTypes<'course'> | undefined> | undefined,
  ) {
    this._currentCourse = value;
  }

  async updateSchoolProgram(
    schoolId: string,
    programId: string,
  ): Promise<boolean> {
    return this._serverApi.updateSchoolProgram(schoolId, programId);
  }
}
