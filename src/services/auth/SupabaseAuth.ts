import { SupabaseAuthClient } from "@supabase/supabase-js/dist/module/lib/SupabaseAuthClient";
import { SupabaseApi } from "../api/SupabaseApi";
import { ServiceAuth } from "./ServiceAuth";
import { Database } from "../database";
import {
  CURRENT_USER,
  REFRESH_TOKEN,
  REFRESH_TABLES_ON_LOGIN,
  TABLES,
  TableTypes,
  USER_DATA,
} from "../../common/constants";
import { SupabaseClient, UserAttributes } from "@supabase/supabase-js";
import { ServiceConfig } from "../ServiceConfig";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
import { Util } from "../../utility/util";
import { useOnlineOfflineErrorMessageHandler } from "../../common/onlineOfflineErrorMessageHandler";

export class SupabaseAuth implements ServiceAuth {
  public static i: SupabaseAuth;
  private _currentUser: TableTypes<"user"> | undefined;

  private _auth: SupabaseAuthClient | undefined;
  private _supabaseDb: SupabaseClient<Database> | undefined;
  // private _auth = getAuth();

  private constructor() {}

  public static getInstance(): SupabaseAuth {
    if (!SupabaseAuth.i) {
      SupabaseAuth.i = new SupabaseAuth();
      SupabaseAuth.i._supabaseDb = SupabaseApi.getInstance().supabase;
      SupabaseAuth.i._auth = SupabaseAuth.i._supabaseDb?.auth;
    }
    return SupabaseAuth.i;
  }
  async loginWithEmailAndPassword(email: any, password: any): Promise<boolean> {
    try {
      if (!this._auth) return false;
      if (!email || !password) {
        throw new Error("Email and password are required.");
      }
      const api = ServiceConfig.getI().apiHandler;
      const { data, error } = await this._auth.signInWithPassword({
        email: email,
        password: password,
      });
      if (error) {
        throw new Error(error.message || "Authentication failed.");
      }
      if (data.session?.refresh_token) {
        Util.addRefreshTokenToLocalStorage(data.session?.refresh_token);
      }
      await api.updateFcmToken(data?.user?.id ?? "");
      const isSynced = await ServiceConfig.getI().apiHandler.syncDB(Object.values(TABLES),REFRESH_TABLES_ON_LOGIN);
      await api.subscribeToClassTopic();
      return true;
    } catch (error) {
      console.log(
        "🚀 ~ file: SupabaseAuth.ts:143 ~ SupabaseAuth ~ Emailsignin ~ error:",
        error
      );
      return false;
    }
  }
  async signInWithEmail(email: string, password: string): Promise<boolean> {
    try {
      if (!this._auth) return false;
      const { data, error } = await this._auth.signInWithPassword({
        email,
        password,
      });
      const api = ServiceConfig.getI().apiHandler;
      if (error) {
        throw new Error(error.message || "Authentication failed.");
      }
      if (data.session?.refresh_token) {
        Util.addRefreshTokenToLocalStorage(data.session?.refresh_token);
      }
      await api.updateFcmToken(data?.user?.id ?? "");
      const isSynced = await ServiceConfig.getI().apiHandler.syncDB(Object.values(TABLES),REFRESH_TABLES_ON_LOGIN);
      return true;
    } catch (error) {
      console.log(
        "🚀 ~ file: SupabaseAuth.ts:166 ~ SupabaseAuth ~ Emailsignin ~ error:",
        error
      );
      return false;
    }
  }
  async sendResetPasswordEmail(email: string): Promise<boolean> {
    try {
      if (!this._auth) return false;
      const { data, error } = await this._auth.resetPasswordForEmail(email);

      if (error) {
        console.error("Reset password error:", error.message);
        return false;
      }

      return true;
    } catch (err: any) {
      console.error("Unexpected error in resetPasswordForEmail:", err.message);
      return false;
    }
  }
  async updateUser(attributes: UserAttributes): Promise<boolean> {
    if (!this._auth) return false;

    const { data, error } = await this._auth.updateUser(attributes);

    if (error) {
      console.error("Error updating user:", error.message);
      return false;
    }
    return true;
  }
  async googleSign(): Promise<boolean> {
    try {
      if (!this._auth) return false;
      const api = ServiceConfig.getI().apiHandler;
      const authUser = await GoogleAuth.signIn();
      console.log(
        "🚀 ~ SupabaseAuth ~ googleSign ~ authUser:",
        authUser.authentication.refreshToken
      );

      const { data, error } = await this._auth.signInWithIdToken({
        provider: "google",
        token: authUser.authentication.idToken,
        access_token: authUser.authentication.accessToken,
      });

      if (data.session?.refresh_token)
        Util.addRefreshTokenToLocalStorage(data.session?.refresh_token);
      console.log(
        "🚀 ~ SupabaseAuth ~ googleSign ~ data, error:",
        data,
        error,
        data.session?.refresh_token
      );
      const rpcRes = await this._supabaseDb?.rpc("isUserExists", {
        user_email: authUser.email,
        user_phone: "",
      });

      console.log("🚀 ~ SupabaseAuth ~ googleSign ~ isUserExists:", rpcRes);
      if (!rpcRes?.data) {
        const createdUser = await api.createUserDoc({
          age: null,
          avatar: null,
          created_at: new Date().toISOString(),
          curriculum_id: null,
          gender: null,
          grade_id: null,
          id: data.user?.id ?? authUser.id,
          image: authUser.imageUrl,
          is_deleted: false,
          is_tc_accepted: false,
          language_id: null,
          name: authUser.name,
          updated_at: new Date().toISOString(),
          email: authUser.email,
          phone: data.user?.phone ?? null,
          music_off: false,
          sfx_off: false,
          fcm_token: null,
          student_id: null,
        });
        this._currentUser = createdUser;
      }
      await api.updateFcmToken(data.user?.id ?? authUser.id);
      const isSynced = await ServiceConfig.getI().apiHandler.syncDB(Object.values(TABLES),REFRESH_TABLES_ON_LOGIN);
      if (rpcRes?.data) {
        await api.subscribeToClassTopic();
      }
    } catch (error) {
      console.error("🚀 ~ SupabaseAuth ~ googleSign ~ error:", error);
      return false;
    }
    return true;
  }

  async getCurrentUser(): Promise<TableTypes<"user"> | undefined> {
    if (this._currentUser) return this._currentUser;
    if (!navigator.onLine) {
      const api = ServiceConfig.getI().apiHandler;
      let user = localStorage.getItem(USER_DATA);
      if (user) this._currentUser = JSON.parse(user) as TableTypes<"user">;
      return this._currentUser;
    } else {
      await this.refreshSession();
      const authData = await this._auth?.getSession();
      if (!authData || !authData.data.session?.user?.id) return;
      const api = ServiceConfig.getI().apiHandler;
      let user = await api.getUserByDocId(authData.data.session?.user.id);
      localStorage.setItem(USER_DATA, JSON.stringify(user));
      this._currentUser = user;
      return this._currentUser;
    }
  }
  async refreshSession(): Promise<void> {
    try {
      const authData = await this._auth?.getSession();
      let sessionExp = authData?.data.session?.expires_at;
      sessionExp = Number(sessionExp);
      const currentTime = new Date().getTime() / 1000;
      const threshold = 500;
      if (sessionExp < currentTime || sessionExp <= currentTime + threshold) {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN);
        let result = refreshToken?.replace(/"/g, "");
        if (!result) {
          console.error("No refresh token available");
          return;
        }
        const response = await this._auth?.refreshSession({
          refresh_token: result,
        });
        if (response) {
          const { error, data } = response;
          if (error) {
            throw new Error("Session refresh failed: " + error.message);
          } else {
            if (data && data.session) {
              const { access_token, refresh_token } = data.session;
              this._auth?.setSession({ access_token, refresh_token });
              Util.addRefreshTokenToLocalStorage(data.session?.refresh_token);
            }
          }
        }
      } else {
        console.log("Session is still valid");
      }
    } catch (error) {
      console.error("Unexpected error while refreshing session:", error);
    }
  }
  set currentUser(user: TableTypes<"user">) {
    this._currentUser = user;
  }

  async isUserLoggedIn(): Promise<boolean> {
    if (this._currentUser) return true;
    if (navigator.onLine) {
      await this.refreshSession();
      // const authData = await this._auth?.getUser();
      const authData = await this._auth?.getSession();
      // const user = await this.getCurrentUser();
      return !!authData?.data?.session?.user;
    } else {
      const isUser = localStorage.getItem(CURRENT_USER);
      return !!isUser;
    }
  }
  phoneNumberSignIn(phoneNumber: any, recaptchaVerifier: any): Promise<any> {
    throw new Error("Method not implemented.");
  }
  resendOtpMsg91(phoneNumber: string): Promise<boolean | undefined> {
    return this.generateOtp(phoneNumber, "");
  }
  async generateOtp(
    phoneNumber: string,
    appName: string
  ): Promise<boolean | undefined> {
    try {
      if (!this._auth) return false;
      const { data, error } = await this._auth.signInWithOtp({
        phone: phoneNumber,
      });
      if (!error) return true;
      return false;
    } catch (error) {
      console.log("Failed with ");
    }
  }

  async proceedWithVerificationCode(
    phoneNumber: any,
    verificationCode: any
  ): Promise<{ user: any; isUserExist: boolean } | undefined> {
    try {
      if (!this._auth) return;
      const api = ServiceConfig.getI().apiHandler;
      const { data: user, error } = await this._auth.verifyOtp({
        phone: phoneNumber,
        token: verificationCode,
        type: "sms",
      });
      localStorage.setItem(
        REFRESH_TOKEN,
        JSON.stringify(user.session?.refresh_token)
      );

      if (user.session?.refresh_token)
        Util.addRefreshTokenToLocalStorage(user.session?.refresh_token);
      if (error) {
        throw new Error("OTP verification failed");
      }
      const rpcRes = await this._supabaseDb?.rpc("isUserExists", {
        user_email: "",
        user_phone: user?.user?.phone ?? "",
      });
      console.log("🚀 ~ SupabaseAuth ~ PhoneSignIn ~ isUserExists:", rpcRes);

      if (!rpcRes?.data) {
        const createdUser = await api.createUserDoc({
          age: null,
          avatar: null,
          created_at: new Date().toISOString(),
          curriculum_id: null,
          gender: null,
          grade_id: null,
          id: user.user?.id ?? "",
          image: null,
          is_deleted: false,
          is_tc_accepted: false,
          language_id: null,
          name: null,
          updated_at: new Date().toISOString(),
          email: null,
          phone: user?.user?.phone ?? "",
          music_off: false,
          sfx_off: false,
          fcm_token: null,
          student_id: null,
        });
        this._currentUser = createdUser;
      }
      await api.updateFcmToken(user?.user?.id ?? "");
      const isSynced = await ServiceConfig.getI().apiHandler.syncDB(Object.values(TABLES),REFRESH_TABLES_ON_LOGIN);
      if (rpcRes?.data) {
        await api.subscribeToClassTopic();
      }
      return { user: user, isUserExist: rpcRes?.data ?? false };
    } catch (error) {
      return { user: null, isUserExist: false };
    }
  }

  async logOut(): Promise<void> {
    // throw new Error("Method not implemented.");
    await this._auth?.signOut();
    this._currentUser = undefined;
  }
}
