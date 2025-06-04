import { ApiHandler } from "./api/ApiHandler";
import { FirebaseApi } from "./api/FirebaseApi";
import { OneRosterApi } from "./api/OneRosterApi";
import { SqliteApi } from "./api/SqliteApi";
import { AuthHandler } from "./auth/AuthHandler";
import { FirebaseAuth } from "./auth/FirebaseAuth";
import { OneRosterAuth } from "./auth/OneRosterAuth";
import { SupabaseAuth } from "./auth/SupabaseAuth";
import { SupabaseApi } from "./api/SupabaseApi";

export enum APIMode {
  ONEROSTER,
  FIREBASE,
  SQLITE,
  SUPABASE,
}

export class ServiceConfig {
  private static instance: ServiceConfig;
  private _apiHandler: ApiHandler;
  private _authHandler: AuthHandler;
  private _mode: APIMode;

  private constructor() {}

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
      case APIMode.SUPABASE:
        this.instance.initializeSupabase();
        break;
      default:
        this.instance.initializeFireBase();
        break;
    }
    return this.instance;
  }

  public static getI(): ServiceConfig {
    console.debug("[ServiceConfig] getI called");
    return ServiceConfig.instance;
  }

  public switchMode(newMode: APIMode) {
    console.debug(`[ServiceConfig] switchMode called. Switching from ${APIMode[this._mode]} to ${APIMode[newMode]}`);
    this.mode = newMode;
    switch (newMode) {
      case APIMode.FIREBASE:
        this.initializeFireBase();
        break;
      case APIMode.ONEROSTER:
        this.initializeOneroster();
        break;
      case APIMode.SQLITE:
        this.initializeSqlite();
        break;
      case APIMode.SUPABASE:
        this.initializeSupabase();
        break;
      default:
        this.initializeFireBase();
        break;
    }
  }

  private initializeOneroster()  {
    console.debug("[ServiceConfig] Initializing OneRoster API and Auth");
    //@ts-ignore
    this._apiHandler = ApiHandler.getInstance(OneRosterApi.getInstance());
    this._authHandler = AuthHandler.getInstance(OneRosterAuth.getInstance());
  }

  private initializeFireBase() {
    console.debug("[ServiceConfig] Initializing Firebase API and Auth");
    //@ts-ignore
    this._apiHandler = ApiHandler.getInstance(FirebaseApi.getInstance());
    //@ts-ignore
    this._authHandler = AuthHandler.getInstance(FirebaseAuth.getInstance());
  }

  private initializeSqlite() {
    console.debug("[ServiceConfig] Initializing SQLite API and Supabase Auth");
    this._apiHandler = ApiHandler.getInstance(SqliteApi.i);
    this._authHandler = AuthHandler.getInstance(SupabaseAuth.getInstance());
  }

  private initializeSupabase() {
    console.debug("[ServiceConfig] Initializing Supabase API and Auth");
    //@ts-ignore
    this._apiHandler = ApiHandler.getInstance(SupabaseApi.getInstance());
    //@ts-ignore
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
    console.debug(`[ServiceConfig] mode set to: ${APIMode[value]}`);
    this._mode = value;
  }
}
