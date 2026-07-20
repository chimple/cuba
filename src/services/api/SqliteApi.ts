import { ServiceApi } from './ServiceApi';
import { SupabaseApi } from './SupabaseApi';
import { SqliteApiPal } from './sqlite/SqliteApi.pal';

export class SqliteApi extends SqliteApiPal implements ServiceApi {
  public static i: SqliteApi;

  public static getI(): SqliteApi {
    if (!SqliteApi.i) {
      SqliteApi.i = new SqliteApi();
      SqliteApi.i._serverApi = SupabaseApi.getInstance();
    }
    return SqliteApi.i;
  }

  public static async getInstance(): Promise<SqliteApi> {
    if (!SqliteApi.i) {
      SqliteApi.i = new SqliteApi();
      SqliteApi.i._serverApi = SupabaseApi.getInstance();
    }
    await SqliteApi.i.ensureInitialized();
    return SqliteApi.i;
  }
}
