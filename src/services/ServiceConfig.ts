import { ApiHandler } from "./api/ApiHandler";
import { FirebaseApi } from "./api/FirebaseApi";
import { OneRosterApi } from "./api/OneRosterApi";
import { SqliteApi } from "./api/SqliteApi";
import { AuthHandler } from "./auth/AuthHandler";
import { FirebaseAuth } from "./auth/FirebaseAuth";
import { OneRosterAuth } from "./auth/OneRosterAuth";
import { SupabaseAuth } from "./auth/SupabaseAuth";
export enum APIMode {
  ONEROSTER,
  FIREBASE,
  SQLITE,
}

export class ServiceConfig {
  private static instance: ServiceConfig;
  private _apiHandler: ApiHandler;
  private _authHandler: AuthHandler;
  private _mode: APIMode;

  private constructor() { }

  public static getInstance(mode: APIMode): ServiceConfig {
    if (!ServiceConfig.instance) {
      ServiceConfig.instance = new ServiceConfig();
      ServiceConfig.instance.mode = mode;
    }
    switch (mode) {
      case APIMode.FIREBASE:
        this.instance.initializeFireBase();
        break;
      case APIMode.ONEROSTER:
        this.instance.initializeOneroster();
        break;
      case APIMode.SQLITE:
        this.instance.initializeSqlite();
        break;
      default:
        this.instance.initializeFireBase();
        break;
    }
    return ServiceConfig.instance;
  }

  public static getI(): ServiceConfig {
    return ServiceConfig.instance;
  }

  private initializeOneroster(): void {
    //@ts-ignore
    this._apiHandler = ApiHandler.getInstance(OneRosterApi.getInstance());
    this._authHandler = AuthHandler.getInstance(OneRosterAuth.getInstance());
  }

  private initializeFireBase() {
    //@ts-ignore
    this._apiHandler = ApiHandler.getInstance(FirebaseApi.getInstance());
    //@ts-ignore
    this._authHandler = AuthHandler.getInstance(FirebaseAuth.getInstance());
  }

  private initializeSqlite() {
    this._apiHandler = ApiHandler.getInstance(SqliteApi.i);
    this._authHandler = AuthHandler.getInstance(SupabaseAuth.getInstance());
  }

  get apiHandler(): ApiHandler {
    return this._apiHandler;
  }

  get authHandler(): AuthHandler {
    return this._authHandler;
  }

  public get mode(): APIMode {
    return this._mode;
  }

  public set mode(value: APIMode) {
    this._mode = value;
  }
}
