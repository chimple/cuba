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
  CURRENT_SCHOOL,
  MODES,
  SCHOOL_LOGIN,
  PAGES,
  USER_ROLE,
} from "../../common/constants";
import { SupabaseClient, UserAttributes } from "@supabase/supabase-js";
import { APIMode, ServiceConfig } from "../ServiceConfig";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
import { Util } from "../../utility/util";
import { useOnlineOfflineErrorMessageHandler } from "../../common/onlineOfflineErrorMessageHandler";
import { schoolUtil } from "../../utility/schoolUtil";

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
      SupabaseAuth?.i?._auth?.onAuthStateChange((event, session) => {
        if (event === "TOKEN_REFRESHED") {
          if (session?.refresh_token)
            Util.addRefreshTokenToLocalStorage(session?.refresh_token);
        }
      });
    }

    return SupabaseAuth.i;
  }
  async loginWithEmailAndPassword(
    email: string,
    password: string
  ): Promise<{ success: boolean; isSpl: boolean }> {
    let isSpl = false;
    try {
      if (!this._auth) return { success: false, isSpl };
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
      if (this._supabaseDb) {
        const { data: isSplResult, error: isSplError } =
          await this._supabaseDb.rpc("is_special_or_program_user");
        if (isSplError) {
          console.error("Error checking special/program user:", isSplError);
        } else {
          isSpl = isSplResult;
        }
      } else {
        console.error("Supabase DB client is not initialized.");
      }
      if (isSpl) {
        ServiceConfig.getInstance(APIMode.SQLITE).switchMode(APIMode.SUPABASE);
      } else {
        await api.syncDB(Object.values(TABLES), REFRESH_TABLES_ON_LOGIN);
      }
      await api.updateFcmToken(data?.user?.id ?? "");
      Util.storeLoginDetails(email, password);
      await api.subscribeToClassTopic();
      return { success: true, isSpl };
    } catch (error) {
      console.error(
        "🚀 ~ file: SupabaseAuth.ts:143 ~ SupabaseAuth ~ Emailsignin ~ error:",
        error
      );
      return { success: false, isSpl };
    }
  }
  async signInWithEmail(
    email: string,
    password: string
  ): Promise<{ success: boolean; isSpl: boolean }> {
    let isSplValue = false;
    try {
      if (!this._auth) return { success: false, isSpl: isSplValue };
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
      const isSpl = await this._supabaseDb?.rpc("is_special_or_program_user");
      isSplValue = isSpl?.data === true;
      if (isSplValue) {
        ServiceConfig.getInstance(APIMode.SQLITE).switchMode(APIMode.SUPABASE);
      } else {
        await ServiceConfig.getI().apiHandler.syncDB(
          Object.values(TABLES),
          REFRESH_TABLES_ON_LOGIN
        );
      }
      await api.updateFcmToken(data?.user?.id ?? "");
      Util.storeLoginDetails(email, password);
      return { success: true, isSpl: isSplValue };
    } catch (error) {
      console.error(
        "🚀 ~ file: SupabaseAuth.ts:166 ~ SupabaseAuth ~ Emailsignin ~ error:",
        error
      );
      return { success: false, isSpl: isSplValue };
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
  async googleSign(): Promise<{ success: boolean; isSpl: boolean }> {
    try {
      if (!this._auth) return { success: false, isSpl: false };

      const api = ServiceConfig.getI().apiHandler;
      const authUser = await GoogleAuth.signIn();
      const { data, error } = await this._auth.signInWithIdToken({
        provider: "google",
        token: authUser.authentication.idToken,
        access_token: authUser.authentication.accessToken,
      });

      if (data.session?.refresh_token) {
        Util.addRefreshTokenToLocalStorage(data.session?.refresh_token);
      }
      const rpcRes = await this._supabaseDb?.rpc("isUserExists", {
        user_email: authUser.email,
        user_phone: "",
      });

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
          is_tc_accepted: true,
          language_id: null,
          name: authUser.name,
          updated_at: new Date().toISOString(),
          email: authUser.email,
          phone: data.user?.phone ?? null,
          music_off: false,
          sfx_off: false,
          fcm_token: null,
          student_id: null,
          firebase_id: null,
          is_firebase: null,
          is_ops: null,
          learning_path: null,
          ops_created_by: null,
          stars: null,
        });
        this._currentUser = createdUser;
      }

      const isSpl = await this._supabaseDb?.rpc("is_special_or_program_user");
      const isSplValue = isSpl?.data === true;
      if (isSplValue) {
        ServiceConfig.getInstance(APIMode.SQLITE).switchMode(APIMode.SUPABASE);
      } else {
        await ServiceConfig.getI().apiHandler.syncDB(
          Object.values(TABLES),
          REFRESH_TABLES_ON_LOGIN
        );
      }

      await api.updateFcmToken(data.user?.id ?? authUser.id);
      if (rpcRes?.data) {
        await api.subscribeToClassTopic();
      }
      return { success: true, isSpl: isSplValue };
    } catch (error: any) {
      console.error(
        "🚀 ~ SupabaseAuth ~ googleSign ~ error:",
        error?.stack || error
      );
      return { success: false, isSpl: false };
    }
  }

  async getCurrentUser(): Promise<TableTypes<"user"> | undefined> {
    if (this._currentUser) return this._currentUser;
    if (!navigator.onLine) {
      const api = ServiceConfig.getI().apiHandler;
      let user = localStorage.getItem(USER_DATA);
      if (user) this._currentUser = JSON.parse(user) as TableTypes<"user">;
      return this._currentUser;
    } else {
      // await this.doRefreshSession();
      const authData = await this._auth?.getSession();
      if (!authData || !authData.data.session?.user?.id) return;

      const api = ServiceConfig.getI().apiHandler;
      const userRole = await api.getUserSpecialRoles(
        authData.data.session?.user.id
      );
      if (userRole.length > 0) {
        localStorage.setItem(USER_ROLE, JSON.stringify(userRole));
      }
      let user = await api.getUserByDocId(authData.data.session?.user.id);
      if (user) {
        localStorage.setItem(USER_DATA, JSON.stringify(user));
        this._currentUser = user;
        return this._currentUser;
      } else {
        this._auth?.signOut();
        return;
      }
    }
  }
  async doRefreshSession(): Promise<void> {
    if (!navigator.onLine) {
      console.log("Device is offline. Skipping session refresh.");
      return;
    }

    const item = localStorage.getItem(REFRESH_TOKEN);
    if (!item) {
      return;
    }

    try {
      const data = JSON.parse(item);
      const refreshToken = data.token?.replace(/"/g, "");
      const savedAt = new Date(data.savedAt.toString());
      const now = new Date();

      const daysDiff = Math.floor(
        (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff < 1) {
        console.log(
          `Refresh token is only ${daysDiff} day(s) old. No need to refresh.`
        );
        return;
      }

      const response = await this._auth?.refreshSession({
        refresh_token: refreshToken,
      });
      if (response) {
        const { error, data } = response;
        if (error) {
          throw new Error("Session refresh failed: " + error.message);
        } else if (data?.session) {
          const { access_token, refresh_token } = data.session;
          this._auth?.setSession({ access_token, refresh_token });
          Util.addRefreshTokenToLocalStorage(refresh_token);
        }
      }
    } catch (error) {
      console.error("Unexpected error while refreshing session:", error);

      try {
        await schoolUtil.trySchoolRelogin();
      } catch (retryError) {
        console.error("trySchoolRelogin failed:", retryError);
      }
    }
  }

  set currentUser(user: TableTypes<"user">) {
    this._currentUser = user;
  }

  async isUserLoggedIn(): Promise<boolean> {
    if (this._currentUser) return true;
    if (navigator.onLine) {
      await this.doRefreshSession();
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
      console.error("Failed with ", error);
    }
  }

  async proceedWithVerificationCode(
    phoneNumber: any,
    verificationCode: any
  ): Promise<{ user: any; isUserExist: boolean; isSpl: boolean } | undefined> {
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
          is_tc_accepted: true,
          language_id: null,
          name: null,
          updated_at: new Date().toISOString(),
          email: null,
          phone: user?.user?.phone ?? "",
          music_off: false,
          sfx_off: false,
          fcm_token: null,
          student_id: null,
          firebase_id: null,
          is_firebase: null,
          is_ops: null,
          learning_path: null,
          ops_created_by: null,
          stars: null,
        });
        this._currentUser = createdUser;
      }
      let isSpl = false;
      if (this._supabaseDb) {
        const { data: isSplResult, error: isSplError } =
          await this._supabaseDb.rpc("is_special_or_program_user");
        if (isSplError) {
          console.error("Error checking special/program user:", isSplError);
        } else {
          isSpl = isSplResult;
        }
      }
      if (isSpl) {
        ServiceConfig.getInstance(APIMode.SQLITE).switchMode(APIMode.SUPABASE);
      } else {
        await ServiceConfig.getI().apiHandler.syncDB(
          Object.values(TABLES),
          REFRESH_TABLES_ON_LOGIN
        );
      }
      await api.updateFcmToken(user?.user?.id ?? "");
      if (rpcRes?.data) {
        await api.subscribeToClassTopic();
      }
      return {
        user: user,
        isUserExist: rpcRes?.data ?? false,
        isSpl: isSpl,
      };
    } catch (error) {
      return { user: null, isUserExist: false, isSpl: false };
    }
  }

  async logOut(): Promise<void> {
    // throw new Error("Method not implemented.");
    await this._auth?.signOut();
    this._currentUser = undefined;
  }
}
