import { Capacitor } from "@capacitor/core";
// import { AccountManager } from "account-manager";
import { IS_USER_LOGED_IN, PAGES, USER_TOKEN } from "../common/constants";

export default class Auth {
  private static instance: Auth;

  private _userAccountName: string;
  private _authToken: string;
  private _accountType: string;
  private _sourcedId: string;
  private _endpointUrl: string;

  private constructor(
    userAccountName: string,
    authToken: string,
    accountType: string,
    sourcedId: string,
    endpointUrl: string
  ) {
    this._userAccountName = userAccountName;
    this._authToken = authToken;
    this._accountType = accountType;
    this._sourcedId = sourcedId;
    this._endpointUrl = endpointUrl;
  }

  static getInstance(): Auth {
    if (!Auth.instance) {
      Auth.instance = new Auth(null!, null!, null!, null!, null!);
    }
    return Auth.instance;
  }

  static get i(): Auth {
    return Auth.getInstance();
  }

  public async VSOLogin(): Promise<boolean> {
    let response: any;
    // try {
    //   response = await AccountManager.accountPicker();
    //   if (response) {
    //     console.log("auth result ", JSON.stringify(response));
    //     this._userAccountName = response.authAccount;
    //     this._accountType = response.addedType;
    //     this._authToken = response.authToken;
    //     this._sourcedId = response.sourcedId;
    //     this._endpointUrl = response.endpointUrl;

    //     localStorage.setItem(IS_USER_LOGED_IN, "true");
    //     localStorage.setItem(USER_TOKEN, JSON.stringify(response));
    //     // history.replace(PAGES.HOME);
    //     return true;
    //   } else {
    //     console.log("login-button result false", response);
    //     localStorage.setItem(IS_USER_LOGED_IN, "false");
    //     return false;
    //   }
    // } catch (error: any) {
      // if (
      //   error.message === "Method not implemented." &&
      //   (Capacitor.getPlatform() === "web" || Capacitor.getPlatform() === "ios")
      // ) {
        // console.log("login error ", Capacitor.getPlatform(), error);
        localStorage.setItem(IS_USER_LOGED_IN, "true");
        localStorage.setItem(
          USER_TOKEN,
          JSON.stringify({
            authAccount: "student",
            sourcedId: "4334700840729898",
            endpointUrl: "http://192.168.88.99:8087/",
            addedType: "com.ustadmobile",
            authToken: "VcisaeK2MhuAxpUCvWUcmVoGyxe1NKY",
          })
        );
        return true;
        // history.replace(PAGES.HOME);
      // }

      localStorage.setItem(IS_USER_LOGED_IN, "false");
      return false;
    // }
  }

  public isUserLoggedIn(): boolean {
    if (
      this._userAccountName != undefined &&
      this._authToken != undefined &&
      this._accountType != undefined &&
      this._sourcedId != undefined &&
      this._endpointUrl != undefined 
    ) {
      return true;
    }

    const isUserLogedIn = localStorage.getItem(IS_USER_LOGED_IN);

    let userData = localStorage.getItem(USER_TOKEN) || "";
    if (isUserLogedIn == "true" && userData && userData != "null") {
      const res = JSON.parse(userData);
      console.log("auth result ", JSON.stringify(res));
      this._userAccountName = res.authAccount;
      this._accountType = res.addedType;
      this._authToken = res.authToken;
      this._sourcedId = res.sourcedId;
      this._endpointUrl = res.endpointUrl;
      if (
        this._userAccountName != undefined &&
        this._authToken != undefined &&
        this._accountType != undefined &&
        this._sourcedId != undefined &&
        this._endpointUrl != undefined 
      ) {
        return true;
      }
      return false;
    } else {
      this._userAccountName = null!;
      this._authToken = null!;
      this._accountType = null!;
      this._sourcedId = null!;
      this._endpointUrl = null!;
      return false;
    }
  }

  public authLogout(): boolean {
    try {
      this._userAccountName = null!;
      this._authToken = null!;
      this._accountType = null!;
      this._sourcedId = null!;
      this._endpointUrl = null!;
      localStorage.setItem(USER_TOKEN, "null");
      localStorage.setItem("isUserLogedIn", "false");
      return true;
    } catch (error) {
      console.log("error", error);
      return false;
    }
  }

  public get userAccountName(): string {
    return this._userAccountName;
  }
  public set userAccountName(value: string) {
    this._userAccountName = value;
  }
  public get authToken(): string {
    return this._authToken;
  }
  public set authToken(value: string) {
    this._authToken = value;
  }
  public get accountType(): string {
    return this._accountType;
  }
  public set accountType(value: string) {
    this._accountType = value;
  }
  public get sourcedId(): string {
    return this._sourcedId;
  }
  public set sourcedId(value: string) {
    this._sourcedId = value;
  }
  public get endpointUrl(): string {
    return this._endpointUrl;
  }
  public set endpointUrl(value: string) {
    this._endpointUrl = value;
  }
}
