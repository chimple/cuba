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
            let result: string = responce.result;
            if (result) {
                console.log("login-button result true", result);
                // result = result.replace(/Bundle/s, '').replace("]", "").replace("[", "").replace("{", "{\"").replace("}", "\"}").replaceAll("=", "\":\"").replaceAll(",", "\",\"").replaceAll(" ", "")
                // result = JSON.parse(result)

                let res: string[] = result.split(',');

                console.log("auth result ", res[0], res[1], res[2], res[3]);
                this._userAccountName = res[1];
                this._accountType = res[2];;
                this._authToken = res[3];

                localStorage.setItem(IS_USER_LOGED_IN, "true");
                localStorage.setItem(USER_TOKEN, JSON.stringify(result));
                // history.replace(PAGES.HOME);
                return true;
            } else {
                console.log("login-button result false", result);
                localStorage.setItem(IS_USER_LOGED_IN, "false");
                return false
            }
        } catch (error: any) {
            if (
                error.message === "Method not implemented." &&
                (Capacitor.getPlatform() === "web" ||
                    Capacitor.getPlatform() === "ios")
            ) {
                console.log("login error ", Capacitor.getPlatform(), error)
                localStorage.setItem(IS_USER_LOGED_IN, "true");
                localStorage.setItem(USER_TOKEN, JSON.stringify("01,debug15@gmail.com,com.debug15,VcisaeK2MhuAxpUCvWUcmVoGyxe1NKY"));
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

        const isUserLogedIn = localStorage.getItem(IS_USER_LOGED_IN);

        let userData: string = localStorage.getItem(USER_TOKEN) || '';
        if (isUserLogedIn == "true" && userData && userData != 'null') {
            userData = JSON.parse(userData)
            let res: string[] = userData.split(',');

            console.log("auth result ", res[0], res[1], res[2], res[3]);
            this._userAccountName = res[1];
            this._accountType = res[2];;
            this._authToken = res[3];

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
