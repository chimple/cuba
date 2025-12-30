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
import { SupabaseClient, UserAttributes, Session } from "@supabase/supabase-js";
import { APIMode, ServiceConfig } from "../ServiceConfig";
import { SocialLogin } from "@capgo/capacitor-social-login";
import { Util } from "../../utility/util";
import { useOnlineOfflineErrorMessageHandler } from "../../common/onlineOfflineErrorMessageHandler";
import { schoolUtil } from "../../utility/schoolUtil";
import { Capacitor } from "@capacitor/core";

export class SupabaseAuth implements ServiceAuth {
  public static i: SupabaseAuth;
  private _currentUser: TableTypes<"user"> | undefined;

  private _auth: SupabaseAuthClient | undefined;
  private _supabaseDb: SupabaseClient<Database> | undefined;
  // private _auth = getAuth();

  private constructor() { }
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
      if (data.session?.refresh_token)
        Util.addRefreshTokenToLocalStorage(data.session?.refresh_token);
      if (this._supabaseDb) {
        let isSpl = false;
        try {
          isSpl = await this.rpcRetry<boolean>(async () => {
            const { data, error } = await this._supabaseDb!.rpc(
              "is_special_or_program_user"
            ).maybeSingle();

            return { data: Boolean(data), error } as {
              data: boolean;
              error: any;
            };
          });
        } catch (err) {
          console.error("Error checking special/program user:", err);
        }
        if (isSpl) {
          console.log("User is a special or program user");
        } else {
          console.log("User is NOT a special or program user");
        }
      } else {
        console.error("Supabase DB client is not initialized.");
      }
      if (!isSpl) {
        let isFirstSync = true;
        await api.syncDB(
          Object.values(TABLES),
          REFRESH_TABLES_ON_LOGIN,
          isFirstSync
        );
      } else {
        ServiceConfig.getInstance(APIMode.SQLITE).switchMode(APIMode.SUPABASE);
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
      let response;
      if (Capacitor.isNativePlatform()) {
        response = await SocialLogin.login({
          provider: "google",
          options: {
            scopes: ["profile", "email"],
            forceRefreshToken: true,
          },
        });
      } else {
        const { data, error } = await this._auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: window.location.origin,
            queryParams: {
              prompt: "select_account",
            },
          },
        });

        if (error) {
          console.error("Web Google login failed:", error);
          return { success: false, isSpl: false };
        }
        return { success: true, isSpl: false };
      }
      if (response.result?.responseType !== "online") {
        return { success: false, isSpl: false };
      }
      const authentication = response.result;
      const authUser = authentication.profile;

      if (
        authentication.idToken === null ||
        authUser.email === null ||
        authUser.id === null
      )
        return { success: false, isSpl: false };
      const { data, error } = await this._auth.signInWithIdToken({
        provider: "google",
        token: authentication.idToken,
        access_token: authentication.accessToken?.token,
      });

      if (data.session?.refresh_token) {
        Util.addRefreshTokenToLocalStorage(data.session?.refresh_token);
      }

      if (!data.session) return { success: false, isSpl: false };

      const initResult = await this.initializeUserRecord(data.session);
      return { success: !!initResult, isSpl: initResult?.isSpl ?? false };
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
      const session = authData.data.session;

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
        // If user is not found in DB but we have a session (e.g. fresh OAuth login), try to create/init them
        const initResult = await this.initializeUserRecord(session);
        if (initResult && initResult.user) {
          this._currentUser = initResult.user;
          return this._currentUser;
        }
        // If still fails, sign out
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
      // const authData = await this._auth?.getSession();
      const user = await this.getCurrentUser();

      // return !!authData?.data?.session?.user;
      return !!user;
    } else {
      const isUser = localStorage.getItem(CURRENT_USER);
      return !!isUser;
    }
  }

  phoneNumberSignIn(phoneNumber: any, recaptchaVerifier: any): Promise<any> {
    throw new Error("Method not implemented.");
  }
  async resendOtpMsg91(phoneNumber: string): Promise<boolean | undefined> {
    try {
      const result = await this.generateOtp(phoneNumber, "");
      return result.success;
    } catch (error) {
      console.error("Resend OTP failed: ", error);
      return false;
    }
  }
  async generateOtp(
    phoneNumber: string,
    appName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this._auth)
        return { success: false, error: "Auth service not initialized" };
      const { data, error } = await this._auth.signInWithOtp({
        phone: phoneNumber,
      });
      if (error) {
        return {
          success: false,
          error: error.message || "Failed to generate OTP",
        };
      }
      return { success: true };
    } catch (error: any) {
      console.error("Failed with ", error);
      return {
        success: false,
        error:
          error.message ||
          String(error) ||
          "An unknown error occurred during OTP generation.",
      };
    }
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }
  private isNetworkError(err: any): boolean {
    const code = String(err?.code ?? "");
    const msg = String(err?.message ?? "");
    return (
      code === "ERR_NETWORK_CHANGED" ||
      code === "ERR_NETWORK" ||
      /ERR_NETWORK_CHANGED|ERR_NETWORK|ERR_INTERNET_DISCONNECTED|ERR_NAME_NOT_RESOLVED|Failed to fetch|networkerror|offline|dns|socket/i.test(
        msg
      )
    );
  }
  // helper stays the same
  private async rpcRetry<T>(
    fn: () => Promise<{ data: T; error: any }>,
    max = 5
  ): Promise<T> {
    let attempt = 1;
    for (; ;) {
      try {
        const { data, error } = await fn();
        if (error) throw error;
        return data;
      } catch (err) {
        const burn = !this.isNetworkError(err);
        const nextAttempt = burn ? attempt + 1 : attempt;
        if (nextAttempt > max) throw err;
        const backoff = Math.min(2000 * (burn ? attempt : 1), 8000);
        console.warn(
          `RPC attempt ${attempt}/${max} failed${burn ? "" : " (not counting)"
          }; retrying in ${backoff}ms`,
          err
        );
        await this.sleep(backoff);
        attempt = nextAttempt;
      }
    }
  }

  async proceedWithVerificationCode(
    phoneNumber: string,
    verificationCode: string
  ): Promise<{ user: any; isUserExist: boolean; isSpl: boolean } | undefined> {
    try {
      if (!this._auth) return;
      const api = ServiceConfig.getI().apiHandler;

      const { data: user, error } = await this._auth.verifyOtp({
        phone: phoneNumber,
        token: verificationCode,
        type: "sms",
      });
      if (error) throw new Error("OTP verification failed");

      localStorage.setItem(
        REFRESH_TOKEN,
        JSON.stringify(user.session?.refresh_token)
      );
      if (user.session?.refresh_token)
        Util.addRefreshTokenToLocalStorage(user.session.refresh_token);

      // ✅ RETRY: isUserExists
      const isUserExist = await this.rpcRetry<boolean>(async () => {
        const { data, error } = await this._supabaseDb!.rpc("isUserExists", {
          user_email: "",
          user_phone: user?.user?.phone ?? "",
        }).maybeSingle(); // returns { data: unknown | null, error }

        return { data: !!data, error } as { data: boolean; error: any };
      });

      if (!isUserExist) {
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
          // locale_id: null,
          locale_id: null,
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
          reward: null,
          stars: null,
        });
        this._currentUser = createdUser;
      }

      // ✅ RETRY: is_special_or_program_user
      const isSpl = await this.rpcRetry<boolean>(async () => {
        const { data, error } = await this._supabaseDb!.rpc(
          "is_special_or_program_user"
        ).maybeSingle();

        return { data: !!data, error } as { data: boolean; error: any };
      });

      if (isSpl) {
        ServiceConfig.getInstance(APIMode.SQLITE).switchMode(APIMode.SUPABASE);
      } else {
        let isFirstSync = true;
        await api.syncDB(
          Object.values(TABLES),
          REFRESH_TABLES_ON_LOGIN,
          isFirstSync
        );
      }
      try {
        await api.updateFcmToken(user.user?.id ?? "");
      } catch (err) { }
      if (isUserExist) await api.subscribeToClassTopic();

      return { user, isUserExist: !!isUserExist, isSpl };
    } catch (_err) {
      return { user: null, isUserExist: false, isSpl: false };
    }
  }

  private async initializeUserRecord(session: Session): Promise<{ user: TableTypes<"user">; isSpl: boolean } | null> {
    try {
      if (!this._supabaseDb || !session.user) return null;
      const api = ServiceConfig.getI().apiHandler;
      const user = session.user;
      const email = user.email;
      const id = user.id;
      // Map metadata. logic handles both Google and potentially other providers if standardized
      const meta = user.user_metadata || {};
      const name = meta.full_name || meta.name || meta.given_name || "";
      const avatarUrl = meta.avatar_url || meta.picture || null;

      const isUserExists = await this.rpcRetry<boolean>(async () => {
        const { data, error } = await this._supabaseDb!.rpc("isUserExists", {
          user_email: email || "",
          user_phone: "",
        }).maybeSingle();
        return { data: !!data, error };
      });

      let createdUser: TableTypes<"user"> | undefined;

      if (!isUserExists) {
        createdUser = await api.createUserDoc({
          age: null,
          avatar: null,
          created_at: new Date().toISOString(),
          curriculum_id: null,
          gender: null,
          grade_id: null,
          id: id,
          image: avatarUrl,
          is_deleted: false,
          is_tc_accepted: true,
          language_id: null,
          // locale_id: null,
          locale_id: null,
          name: name,
          updated_at: new Date().toISOString(),
          email: email || null,
          phone: user.phone || null,
          music_off: false,
          sfx_off: false,
          fcm_token: null,
          student_id: null,
          firebase_id: null,
          is_firebase: null,
          is_ops: null,
          learning_path: null,
          ops_created_by: null,
          reward: null,
          stars: null,
        });
      }

      const isSplQuery = await this.rpcRetry<boolean>(async () => {
        const { data, error } = await this._supabaseDb!.rpc(
          "is_special_or_program_user"
        ).maybeSingle();

        return { data: !!data, error } as { data: boolean; error: any };
      });

      if (isSplQuery) {
        ServiceConfig.getInstance(APIMode.SQLITE).switchMode(APIMode.SUPABASE);
      } else {
        let isFirstSync = true;
        await api.syncDB(
          Object.values(TABLES),
          REFRESH_TABLES_ON_LOGIN,
          isFirstSync
        );
      }

      if (isUserExists){
        createdUser = await api.getUserByDocId(id);
      }
      if (!createdUser) {
        console.error("Failed to initialize user record: User could not be created or retrieved.");
        return null;
      }
      this._currentUser = createdUser;

      await api.updateFcmToken(id);
      if (isUserExists) {
        await api.subscribeToClassTopic();
      }

      return { user: createdUser, isSpl: isSplQuery };
    } catch (error) {
      console.error("initializeUserRecord failed:", error);
      return null;
    }
  }

  async logOut(): Promise<void> {
    // throw new Error("Method not implemented.");
    await this._auth?.signOut();
    this._currentUser = undefined;
  }
}
