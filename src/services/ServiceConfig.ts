import { ApiHandler } from "./ApiHandler";
import { FirebaseApi } from "./FirebaseApi";
import { OneRosterApi } from "./OneRosterApi";

export enum APIMode {
  ONEROSTER,
  FIREBASE,
}

export class ServiceConfig {
  private static instance: ServiceConfig;
  private _handler: ApiHandler;
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
    this._handler = ApiHandler.getInstance(OneRosterApi.getInstance());
  }

  private initializeFireBase() {
    this._handler = ApiHandler.getInstance(FirebaseApi.getInstance());
  }

  get handle(): ApiHandler {
    return this._handler;
  }

  public get mode(): APIMode {
    return this._mode;
  }

  public set mode(value: APIMode) {
    this._mode = value;
  }
}
