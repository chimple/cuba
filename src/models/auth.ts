import { Capacitor } from "@capacitor/core";
import { AccountManager } from "account-manager";
import { IS_USER_LOGED_IN, PAGES, USER_TOKEN } from "../common/constants";

export default class Auth {
    private static instance: Auth;

    private _userAccountName: string;
    private _authToken: string;
    private _accountType: string;

    private constructor(
        userAccountName: string,
        authToken: string,
        accountType: string,
    ) {
        this._userAccountName = userAccountName;
        this._authToken = authToken;
        this._accountType = accountType;
    }

    static getInstance(): Auth {
        if (!Auth.instance) {
            Auth.instance = new Auth(null!, null!, null!);
        }
        return Auth.instance;
    }

    static get i(): Auth {
        return Auth.getInstance();
    }

    public async VSOLogin(): Promise<boolean> {
        let responce: any;
        try {
            responce = await AccountManager.accountPicker();
            // console.log("login-button-result", responce.result);
            let result: any = responce.result;
            // console.log("login-button-result result.result", result);
            if (result) {
                console.log("login-button result true", result);
                result = result.replace(/Bundle/s, '').replace("]", "").replace("[", "").replace("{", "{\"").replace("}", "\"}").replaceAll("=", "\":\"").replaceAll(",", "\",\"").replaceAll(" ", "")
                result = JSON.parse(result)

                console.log("auth result ", result.authtoken, this._authToken);
                this._userAccountName = result.authAccount;
                this._authToken = result.authtoken;
                this._accountType = result.accountType;

                console.log(
                    "auth result after ",
                    result.authtoken,
                    this._authToken
                );

                localStorage.setItem(IS_USER_LOGED_IN, "true");
                localStorage.setItem(USER_TOKEN, JSON.stringify(result));
                // history.replace(PAGES.HOME);
                console.log(
                    "localStorage.getItem(USER_TOKEN) ",
                    localStorage.getItem(USER_TOKEN)
                );
                return true;
            } else {
                console.log("login-button result false", result);
                localStorage.setItem(IS_USER_LOGED_IN, "false");
                return false
            }
        } catch (error: any) {
            console.log("Capacitor.getPlatform()", Capacitor.getPlatform());
            if (
                error.message === "Method not implemented." &&
                (Capacitor.getPlatform() === "web" ||
                    Capacitor.getPlatform() === "ios")
            ) {
                console.log("login-button result true");
                localStorage.setItem(IS_USER_LOGED_IN, "true");
                localStorage.setItem(USER_TOKEN, JSON.stringify({ "authAccount": "debug15@gmail.com", "accountType": "com.debug15", "authtoken": "VcisaeK2MhuAxpUCvWUcmVoGyxe1NKY" }));
                return true;
                // history.replace(PAGES.HOME);
            }

            localStorage.setItem(IS_USER_LOGED_IN, "false");
            return false

        }
    }

    public isUserLoggedIn(): boolean {
        if (this._userAccountName != undefined && this._authToken != undefined && this._accountType != undefined) {
            return true;
        }

        let userData: any = localStorage.getItem(USER_TOKEN)
        console.log("Auth userData ", userData)
        if (userData && userData != 'null') {
            userData = JSON.parse(userData)
            console.log("Auth userData ", userData, userData.authtoken)

            this._userAccountName = userData.authAccount;
            this._authToken = userData.authtoken;
            this._accountType = userData.accountType;
            console.log("Auth object ", Auth.i)
            return true;
        }
        else {
            this._userAccountName = null!;
            this._authToken = null!;
            this._accountType = null!;
            return false
        }
    }

    public authLogout(): boolean {
        try {
            this._userAccountName = null!;
            this._authToken = null!;
            this._accountType = null!;
            localStorage.setItem(USER_TOKEN, "null");
            localStorage.setItem("isUserLogedIn", "false");
            return true
        } catch (error) {
            console.log("error", error);
            return false
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

}
