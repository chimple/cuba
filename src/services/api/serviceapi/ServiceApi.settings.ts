import {
  TableTypes,
  CACHETABLES,
  PROFILETYPE,
  MODES,
  TABLES,
} from '../../../common/constants';

export interface ServiceApiUserSettings {
  clearCacheData(tableNames: readonly CACHETABLES[]): Promise<void>;

  addProfileImages(
    id: string,
    file: File,
    profileType: PROFILETYPE,
  ): Promise<string | null>;

  uploadData(payload: any): Promise<boolean | null>;

  migrateSchoolData(payload: { school_ids: string[] }): Promise<boolean>;

  syncDB(
    tableNames: TABLES[],
    refreshTables: TABLES[],
    isFirstSync?: boolean,
  ): Promise<boolean>;

  isSyncInProgress(): boolean;

  close(): Promise<void>;

  get currentStudent(): TableTypes<'user'> | undefined;

  set currentStudent(value: TableTypes<'user'> | undefined);

  get currentClass(): TableTypes<'class'> | undefined;

  set currentClass(value: TableTypes<'class'> | undefined);

  get currentCourse():
    | Map<string, TableTypes<'course'> | undefined>
    | undefined;

  set currentCourse(
    value: Map<string, TableTypes<'course'> | undefined> | undefined,
  );

  get currentSchool(): TableTypes<'school'> | undefined;

  set currentSchool(value: TableTypes<'school'> | undefined);

  get currentMode(): MODES;

  set currentMode(value: MODES);

  updateSoundFlag(userId: string, value: boolean): Promise<void>;

  updateMusicFlag(userId: string, value: boolean): Promise<void>;

  updateLanguage(userId: string, value: string): Promise<void>;

  updateTcAccept(userId: string): Promise<void>;

  updateTcAgreedVersion(userId: string, version: number): Promise<void>;

  updateFcmToken(userId: string): Promise<void>;
}
