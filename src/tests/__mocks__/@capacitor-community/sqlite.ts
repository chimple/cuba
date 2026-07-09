export class SQLiteDBConnection {}

export class SQLiteConnection {
  constructor(_: any) {}
  async initWebStore() {}
  async checkConnectionsConsistency() {
    return { result: true };
  }
  async isConnection(_: string, __: boolean) {
    return { result: false };
  }
  async closeConnection() {}
}

export const CapacitorSQLite = {};
export const capSQLiteResult = {};
export const DBSQLiteValues = {};
export const capSQLiteVersionUpgrade = {};
