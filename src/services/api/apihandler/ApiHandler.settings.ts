import { ApiHandlerUserProfiles } from './ApiHandler.profiles';
import {
  TableTypes,
  CACHETABLES,
  PROFILETYPE,
  MODES,
  TABLES,
} from '../../../common/constants';

export class ApiHandlerUserSettings extends ApiHandlerUserProfiles {
  clearCacheData(tableNames: readonly CACHETABLES[]): Promise<void> {
    return this.s.clearCacheData(tableNames);
  }

  async addProfileImages(
    id: string,
    file: File,
    profileType: PROFILETYPE,
  ): Promise<string | null> {
    return await this.s.addProfileImages(id, file, profileType);
  }

  async uploadData(payload: any): Promise<boolean | null> {
    return await this.s.uploadData(payload);
  }

  async migrateSchoolData(payload: { school_ids: string[] }): Promise<boolean> {
    return await this.s.migrateSchoolData(payload);
  }

  syncDB(
    tableNames: TABLES[] = Object.values(TABLES),
    refreshTables: TABLES[] = [],
    isFirstSync?: boolean,
  ): Promise<boolean> {
    return this.s.syncDB(tableNames, refreshTables, isFirstSync);
  }

  isSyncInProgress(): boolean {
    return this.s.isSyncInProgress();
  }

  close(): Promise<void> {
    return this.s.close();
  }

  get currentStudent(): TableTypes<'user'> | undefined {
    return this.s.currentStudent;
  }

  set currentStudent(value: TableTypes<'user'> | undefined) {
    this.s.currentStudent = value;
  }

  get currentClass(): TableTypes<'class'> | undefined {
    return this.s.currentClass;
  }

  set currentClass(value: TableTypes<'class'> | undefined) {
    this.s.currentClass = value;
  }

  get currentCourse():
    | Map<string, TableTypes<'course'> | undefined>
    | undefined {
    return this.s.currentCourse;
  }

  set currentCourse(
    value: Map<string, TableTypes<'course'> | undefined> | undefined,
  ) {
    this.s.currentCourse = value;
  }

  get currentSchool(): TableTypes<'school'> | undefined {
    return this.s.currentSchool;
  }

  set currentSchool(value: TableTypes<'school'> | undefined) {
    this.s.currentSchool = value;
  }

  get currentMode(): MODES {
    return this.s.currentMode;
  }

  set currentMode(value: MODES) {
    this.s.currentMode = value;
  }

  updateSoundFlag(userId: string, value: boolean) {
    return this.s.updateSoundFlag(userId, value);
  }

  updateMusicFlag(userId: string, value: boolean) {
    return this.s.updateMusicFlag(userId, value);
  }

  updateLanguage(userId: string, value: string) {
    return this.s.updateLanguage(userId, value);
  }

  updateTcAccept(userId: string) {
    return this.s.updateTcAccept(userId);
  }

  updateTcAgreedVersion(userId: string, version: number) {
    return this.s.updateTcAgreedVersion(userId, version);
  }

  updateFcmToken(userId: string) {
    return this.s.updateFcmToken(userId);
  }
}
