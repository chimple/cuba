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
import { ServiceConfig } from "../ServiceConfig";
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
      const raw = localStorage.getItem(CURRENT_USER);
      if (raw) {
        try {
          SupabaseAuth.i._currentUser = JSON.parse(raw);
        } catch { /* ignore */ }
      }
      SupabaseAuth?.i?._auth?.onAuthStateChange((event, session) => {
        if (event === "TOKEN_REFRESHED" && session?.refresh_token) {
          Util.addRefreshTokenToLocalStorage(session.refresh_token);
        }
      });
    }

    return SupabaseAuth.i;
  }
  /** whenever we assign currentUser we push it into localStorage, */
  set currentUser(user: TableTypes<"user">) {
    this._currentUser = user;
    localStorage.setItem(CURRENT_USER, JSON.stringify(user));
    localStorage.setItem(USER_DATA, JSON.stringify(user));
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
      const isSynced = await ServiceConfig.getI().apiHandler.syncDB(
        Object.values(TABLES),
        REFRESH_TABLES_ON_LOGIN
      );
      Util.storeLoginDetails(email, password);
      await api.subscribeToClassTopic();
      return true;
    } catch (error) {
      console.error(
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
      const isSynced = await ServiceConfig.getI().apiHandler.syncDB(
        Object.values(TABLES),
        REFRESH_TABLES_ON_LOGIN
      );
      Util.storeLoginDetails(email, password);
      return true;
    } catch (error) {
      console.error(
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
  if (!this._auth || !this._supabaseDb) return false;
  const api = ServiceConfig.getI().apiHandler;

  try {
    // 1) Google OAuth
    const authUser = await GoogleAuth.signIn();
    const { data, error } = await this._auth.signInWithIdToken({
      provider: "google",
      token: authUser.authentication.idToken,
      access_token: authUser.authentication.accessToken,
    });
    if (error) throw error;

    // store new refresh token
    if (data.session?.refresh_token) {
      Util.addRefreshTokenToLocalStorage(data.session.refresh_token);
      console.log(
        "🚀 ~ SupabaseAuth ~ googleSign ~ data, error:",
        data,
        error,
        data.session?.refresh_token
      );
    }

    const userId = data.user!.id;

    // 2) check if already in your users table
    const rpcRes = await this._supabaseDb.rpc(
      "isUserExists",
      { user_email: authUser.email, user_phone: "" }
    );
    const existsRes = rpcRes.data as boolean | null;

    let userDoc: TableTypes<"user"> | undefined;

    if (existsRes) {
      // fetch existing
      userDoc = await api.getUserByDocId(userId);
      if (!userDoc) {
        console.error(
          "[SupabaseAuth] rpc said user exists, but getUserByDocId returned undefined"
        );
        return false;
      }
      // subscribe only if they already existed
      await api.subscribeToClassTopic();
    } else {
      // create new row
      await api.createUserDoc({
        age: null,
        avatar: null,
        created_at: new Date().toISOString(),
        curriculum_id: null,
        gender: null,
        grade_id: null,
        id: userId,
        image: authUser.imageUrl,
        is_deleted: false,
        is_tc_accepted: true,
        language_id: null,
        name: authUser.name,
        updated_at: new Date().toISOString(),
        email: authUser.email,
        phone: data.user!.phone ?? null,
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

      // **immediately re‐fetch** what you just created
      userDoc = await api.getUserByDocId(userId);
      if (!userDoc) {
        console.error("[SupabaseAuth] failed to fetch newly created user");
        return false;
      }
    }

    // 3) final checks & setup
    this.currentUser = userDoc;
    await api.updateFcmToken(userId);
    await api.syncDB(Object.values(TABLES), REFRESH_TABLES_ON_LOGIN);

    return true;

  } catch (err) {
    console.error("SupabaseAuth.googleSign error:", err);
    return false;
  }
}

  async getCurrentUser(): Promise<TableTypes<"user"> | undefined> {
    // in‑memory
    if (this._currentUser) {
      return this._currentUser;
    }

    // offline fallback
    if (!navigator.onLine) {
      const raw = localStorage.getItem(CURRENT_USER);
      if (!raw) return;
      try {
        this._currentUser = JSON.parse(raw);
        return this._currentUser;
      } catch {
        return;
      }
    }

    // online: ensure tokens fresh, then fetch from your users table
    await this.doRefreshSession();
    const sess = await this._auth!.getSession();
    const id = sess?.data.session?.user?.id;
    if (!id) return;

    const api = ServiceConfig.getI().apiHandler;
    // get any special roles
    const roles = await api.getUserSpecialRoles(id);
    if (roles.length) {
      localStorage.setItem(USER_ROLE, JSON.stringify(roles));
    } else {
      localStorage.removeItem(USER_ROLE);
    }

    // fetch user doc
    const userDoc = await api.getUserByDocId(id);
    if (userDoc) {
      this.currentUser = userDoc;
    }
    return userDoc;
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

  async isUserLoggedIn(): Promise<boolean> {
    if (this._currentUser) return true;
    if (localStorage.getItem(CURRENT_USER)) return true;
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
      await api.updateFcmToken(user?.user?.id ?? "");
      const isSynced = await ServiceConfig.getI().apiHandler.syncDB(
        Object.values(TABLES),
        REFRESH_TABLES_ON_LOGIN
      );
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
