import { USER_TOKEN } from "../common/constants";

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
            let userData: any = localStorage.getItem(USER_TOKEN) || {}
            userData = JSON.parse(userData)
            console.log("Auth userData ", userData)
            Auth.instance = new Auth(userData.authAccount, userData.authtoken, userData.accountType);
            console.log("Auth object ", Auth.i._authToken)
        }
        return Auth.instance;
    }

    static get i(): Auth {
        return Auth.getInstance();
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
