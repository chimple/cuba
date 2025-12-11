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
  console.log("googleSign: start", JSON.stringify(null));

  try {
    console.log("googleSign: this._auth", JSON.stringify(this._auth));
    if (!this._auth) {
      const res = { success: false, isSpl: false };
      console.log("googleSign: _auth missing, returning", JSON.stringify(res));
      return res;
    }

    const api = ServiceConfig.getI().apiHandler;
    console.log("googleSign: api handler", JSON.stringify(api));

    let response: any;
    console.log("googleSign: response initial", JSON.stringify(response));

    const isNative = Capacitor.isNativePlatform();
    console.log("googleSign: isNativePlatform", JSON.stringify(isNative));

    if (isNative) {
      response = await SocialLogin.login({
        provider: "google",
        options: { scopes: ["profile", "email"], forceRefreshToken: true },
      });
      console.log("googleSign: response after native login", JSON.stringify(response));
    } else {
      response = await SocialLogin.login({
        provider: "google",
        options: { scopes: ["profile", "email"] },
      });
      console.log("googleSign: response after web login", JSON.stringify(response));
    }

    console.log("googleSign: response.result", JSON.stringify(response?.result));

    if (response.result?.responseType !== "online") {
      const res = { success: false, isSpl: false };
      console.log("googleSign: responseType not online", JSON.stringify(res));
      return res;
    }

    const authentication = response.result;
    console.log("googleSign: authentication", JSON.stringify(authentication));

    const authUser = authentication.profile;
    console.log("googleSign: authUser", JSON.stringify(authUser));

    console.log("googleSign: authentication.idToken", JSON.stringify(authentication.idToken));
    console.log("googleSign: authUser.email", JSON.stringify(authUser.email));
    console.log("googleSign: authUser.id", JSON.stringify(authUser.id));

    if (
      authentication.idToken === null ||
      authUser.email === null ||
      authUser.id === null
    ) {
      const res = { success: false, isSpl: false };
      console.log("googleSign: missing token/email/id", JSON.stringify(res));
      return res;
    }

    const { data, error } = await this._auth.signInWithIdToken({
      provider: "google",
      token: authentication.idToken,
      access_token: authentication.accessToken?.token,
    });

    console.log("googleSign: signInWithIdToken data", JSON.stringify(data));
    console.log("googleSign: signInWithIdToken error", JSON.stringify(error));

    if (data.session?.refresh_token) {
      console.log("googleSign: refresh_token", JSON.stringify(data.session.refresh_token));
      Util.addRefreshTokenToLocalStorage(data.session.refresh_token);
      console.log("googleSign: refresh_token stored", JSON.stringify(null));
    }

    const rpcRes = await this.rpcRetry<boolean>(async () => {
      const { data, error } = await this._supabaseDb!
        .rpc("isUserExists", { user_email: authUser.email!, user_phone: "" })
        .maybeSingle();

      console.log("isUserExists rpc data", JSON.stringify(data));
      console.log("isUserExists rpc error", JSON.stringify(error));

      return { data: !!data, error };
    });

    console.log("googleSign: rpcRes (isUserExists)", JSON.stringify(rpcRes));

    if (!rpcRes) {
      console.log(
        "googleSign: creating new user",
        JSON.stringify({ idData: data.user?.id, idAuth: authUser.id })
      );

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
        reward: null,
        stars: null,
      });

      console.log("googleSign: createdUser", JSON.stringify(createdUser));

      this._currentUser = createdUser;
      console.log("googleSign: _currentUser set", JSON.stringify(this._currentUser));
    } else {
      console.log("googleSign: user exists already", JSON.stringify(rpcRes));
    }

    const isSpl = await this.rpcRetry<boolean>(async () => {
      const { data, error } = await this._supabaseDb!
        .rpc("is_special_or_program_user")
        .maybeSingle();

      console.log("is_special_or_program_user data", JSON.stringify(data));
      console.log("is_special_or_program_user error", JSON.stringify(error));

      return { data: !!data, error };
    });

    console.log("googleSign: isSpl result", JSON.stringify(isSpl));

    if (isSpl) {
      console.log("googleSign: switching API mode → SUPABASE", JSON.stringify(null));
      ServiceConfig.getInstance(APIMode.SQLITE).switchMode(APIMode.SUPABASE);
    } else {
      let isFirstSync = true;
      console.log(
        "googleSign: syncDB starting",
        JSON.stringify({ tables: Object.values(TABLES), refresh: REFRESH_TABLES_ON_LOGIN, isFirstSync })
      );

      await api.syncDB(Object.values(TABLES), REFRESH_TABLES_ON_LOGIN, isFirstSync);

      console.log("googleSign: syncDB done", JSON.stringify(null));
    }

    const userIdForFcm = data.user?.id ?? authUser.id;
    console.log("googleSign: userIdForFcm", JSON.stringify(userIdForFcm));

    await api.updateFcmToken(userIdForFcm);
    console.log("googleSign: updateFcmToken done", JSON.stringify(userIdForFcm));

    if (rpcRes) {
      await api.subscribeToClassTopic();
      console.log("googleSign: subscribeToClassTopic done", JSON.stringify(null));
    }

    const finalRes = { success: true, isSpl: isSpl };
    console.log("googleSign: final return", JSON.stringify(finalRes));
    return finalRes;

  } catch (error: any) {
    console.error("🚀 ~ SupabaseAuth ~ googleSign ~ error:", error?.stack || error);
    console.log("googleSign: caught error", JSON.stringify(error?.stack || error));

    const res = { success: false, isSpl: false };
    console.log("googleSign: returning after error", JSON.stringify(res));
    return res;
  }
}


async getCurrentUser(): Promise<TableTypes<"user"> | undefined> {
  const TAG = "[AUTH][getCurrentUser]";

  console.log(`${TAG} called`);
  console.log(`${TAG} online status:`, navigator.onLine);

  if (this._currentUser) {
    console.log(`${TAG} returning cached user`, this._currentUser);
    return this._currentUser;
  }

  if (!navigator.onLine) {
    console.log(`${TAG} offline mode`);

    let user = localStorage.getItem(USER_DATA);
    console.log(`${TAG} localStorage USER_DATA:`, user);

    if (user) {
      this._currentUser = JSON.parse(user) as TableTypes<"user">;
      console.log(`${TAG} loaded user from localStorage`, this._currentUser);
    }
    return this._currentUser;
  }

  try {
    console.log(`${TAG} fetching session from supabase`);
    const authData = await this._auth?.getSession();

    console.log(`${TAG} session response:`, authData);

    if (!authData?.data?.session?.user?.id) {
      console.warn(`${TAG} no valid session found`);
      return;
    }

    const userId = authData.data.session.user.id;
    console.log(`${TAG} userId:`, userId);

    const api = ServiceConfig.getI().apiHandler;

    const userRole = await api.getUserSpecialRoles(userId);
    console.log(`${TAG} user roles:`, userRole);

    if (userRole.length > 0) {
      localStorage.setItem(USER_ROLE, JSON.stringify(userRole));
    }

    let user = await api.getUserByDocId(userId);
    console.log(`${TAG} fetched user doc:`, user);

    if (user) {
      localStorage.setItem(USER_DATA, JSON.stringify(user));
      this._currentUser = user;
      console.log(`${TAG} user stored & returned`);
      return this._currentUser;
    } else {
      // await this.doRefreshSession();
      const authData = await this._auth?.getSession();
      if (!authData || !authData.data.session?.user?.id) return;

      const api = ServiceConfig.getI().apiHandler;
      const userRole = await api.getUserSpecialRoles(
        authData.data.session?.user.id
      );
      console.log("user role from curr user....", userRole);

      if (userRole.length > 0) {
        localStorage.setItem(USER_ROLE, JSON.stringify(userRole));
      }
      let user = await api.getUserByDocId(authData.data.session?.user.id);
      if (user) {
        console.log("uuuuu from curr user....", user.id);

        localStorage.setItem(USER_DATA, JSON.stringify(user));
        this._currentUser = user;
        return this._currentUser;
      } else {
        this._auth?.signOut();
        return;
      }
    }
  } catch (err) {
    console.error(`${TAG} error`, err);
    return;
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
    for (;;) {
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
          `RPC attempt ${attempt}/${max} failed${
            burn ? "" : " (not counting)"
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
      } catch (err) {}
      if (isUserExist) await api.subscribeToClassTopic();

      return { user, isUserExist: !!isUserExist, isSpl };
    } catch (_err) {
      return { user: null, isUserExist: false, isSpl: false };
    }
  }

  async logOut(): Promise<void> {
    // throw new Error("Method not implemented.");
    await this._auth?.signOut();
    this._currentUser = undefined;
  }
}
