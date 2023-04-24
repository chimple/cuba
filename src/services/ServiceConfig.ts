import { ApiHandler } from "./api/ApiHandler";
import { FirebaseApi } from "./api/FirebaseApi";
import { OneRosterApi } from "./api/OneRosterApi";
import { AuthHandler } from "./auth/AuthHandler";
import { FirebaseAuth } from "./auth/FirebaseAuth";
import { OneRosterAuth } from "./auth/OneRosterAuth";
export enum APIMode {
  ONEROSTER,
  FIREBASE,
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
    this._apiHandler = ApiHandler.getInstance(OneRosterApi.getInstance());
    this._authHandler = AuthHandler.getInstance(OneRosterAuth.getInstance());
  }

  private initializeFireBase() {
    this._apiHandler = ApiHandler.getInstance(FirebaseApi.getInstance());
    this._authHandler = AuthHandler.getInstance(FirebaseAuth.getInstance());
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
