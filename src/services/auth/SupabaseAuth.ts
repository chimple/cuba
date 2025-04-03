// SupabaseAuth.ts
import { SupabaseAuthClient } from "@supabase/supabase-js/dist/module/lib/SupabaseAuthClient";
import { SupabaseApi } from "../api/SupabaseApi";
import { ServiceAuth } from "./ServiceAuth";
import { Database } from "../database";
import {
  CURRENT_USER,
  REFRESH_TOKEN,
  TableTypes,
  USER_DATA,
  PREVIOUS_USER_ID_KEY,
  CURRENT_USER_ID_KEY,
} from "../../common/constants";
import { SupabaseClient } from "@supabase/supabase-js";
import { ServiceConfig } from "../ServiceConfig";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
import { Util } from "../../utility/util";
import { Capacitor } from "@capacitor/core";
import { CapacitorSQLite } from "@capacitor-community/sqlite";

// ─── Helper functions for user state management ──────────────────────────────
interface UserState {
  previousUserId?: string;
  currentUserId?: string;
}
const USER_STATE_KEY = "USER_STATE";

function getUserState(): UserState {
  const state = localStorage.getItem(USER_STATE_KEY);
  return state ? JSON.parse(state) : {};
}

function setUserState(state: UserState): void {
  localStorage.setItem(USER_STATE_KEY, JSON.stringify(state));
}

export class SupabaseAuth implements ServiceAuth {
  public static i: SupabaseAuth;
  private _currentUser: TableTypes<"user"> | undefined;
  private _auth: SupabaseAuthClient | undefined;
  private _supabaseDb: SupabaseClient<Database> | undefined;

  private constructor() {}

  public static getInstance(): SupabaseAuth {
    if (!SupabaseAuth.i) {
      SupabaseAuth.i = new SupabaseAuth();
      SupabaseAuth.i._supabaseDb = SupabaseApi.getInstance().supabase;
      SupabaseAuth.i._auth = SupabaseAuth.i._supabaseDb?.auth;
    }
    return SupabaseAuth.i;
  }

  // ─── LOGIN WITH EMAIL/PASSWORD ──────────────────────────────────────────────
  async loginWithEmailAndPassword(email: any, password: any): Promise<boolean> {
    try {
      console.log("[Email Login] Starting login with email:", email);
      if (!this._auth) return false;
      if (!email || !password) {
        throw new Error("Email and password are required.");
      }
      const api = ServiceConfig.getI().apiHandler;
      // ✅ Always clear previous cache before login (especially for Android)
      await this.preLoginCleanup();  

      const { data, error } = await this._auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message || "Authentication failed.");
      console.log("[Email Login] Sign in response:", data);
      if (data.session?.refresh_token) {
        Util.addRefreshTokenToLocalStorage(data.session.refresh_token);
      }
      await api.updateFcmToken(data?.user?.id ?? "");
      const rpcRes = await this._supabaseDb?.rpc("isUserExists", {
        user_email: email,
        user_phone: "",
      });
      console.log("[Email Login] RPC response (isUserExists):", rpcRes?.data);

      // Clear cache if a different user is logging in
      await this.handleCacheOnLogin(data?.user?.id);

      if (rpcRes?.data) {
        console.log("[Email Login] User exists. Loading existing user data.");
        const existingUser = await api.getUserByDocId(data.user?.id);
        this._currentUser = existingUser;
      } else {
        console.log("[Email Login] User does not exist. Creating new user document.");
        const createdUser = await api.createUserDoc({
          age: null,
          avatar: null,
          created_at: new Date().toISOString(),
          curriculum_id: null,
          gender: null,
          grade_id: null,
          id: data.user?.id,
          image: null,
          is_deleted: false,
          is_tc_accepted: false,
          language_id: null,
          name: email, // default name using email
          updated_at: new Date().toISOString(),
          email: email,
          phone: data.user?.phone ?? null,
          music_off: false,
          sfx_off: false,
          fcm_token: null,
          student_id: null,
        });
        this._currentUser = createdUser;
      }

      await ServiceConfig.getI().apiHandler.syncDB();
      await api.subscribeToClassTopic();
      console.log("[Email Login] Completed successfully.");
      return true;
    } catch (error) {
      console.error("[Email Login] Error:", error);
      return false;
    }
  }

  // ─── GOOGLE SIGN IN ───────────────────────────────────────────
  async googleSign(): Promise<boolean> {
    try {
      console.log("[Google SignIn] Starting Google sign in.");
      if (!this._auth) return false;
      const api = ServiceConfig.getI().apiHandler;
      await this.preLoginCleanup();
      const authUser = await GoogleAuth.signIn();
      console.log("[Google SignIn] Google auth response:", authUser);
      const { data, error } = await this._auth.signInWithIdToken({
        provider: "google",
        token: authUser.authentication.idToken,
        access_token: authUser.authentication.accessToken,
      });
      if (error) throw new Error(error.message || "Google sign in failed.");
      console.log("[Google SignIn] Supabase sign in response:", data);
      if (data.session?.refresh_token) {
        Util.addRefreshTokenToLocalStorage(data.session.refresh_token);
      }
      const rpcRes = await this._supabaseDb?.rpc("isUserExists", {
        user_email: authUser.email,
        user_phone: "",
      });
      console.log("[Google SignIn] RPC response (isUserExists):", rpcRes?.data);

      await this.handleCacheOnLogin(data?.user?.id);

      if (rpcRes?.data) {
        console.log("[Google SignIn] User exists. Loading existing user data.");
        const existingUser = await api.getUserByDocId(data.user?.id ?? authUser.id);
        this._currentUser = existingUser;
      } else {
        console.log("[Google SignIn] User does not exist. Creating new user document.");
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
      await ServiceConfig.getI().apiHandler.syncDB();
      if (rpcRes?.data) {
        await api.subscribeToClassTopic();
      }
      console.log("[Google SignIn] Completed successfully.");
      return true;
    } catch (error) {
      console.error("[Google SignIn] Error:", error);
      return false;
    }
  }

  // ─── OTP (Proceed With Verification Code) ───────────────────
  async proceedWithVerificationCode(
    phoneNumber: any,
    verificationCode: any
  ): Promise<{ user: any; isUserExist: boolean } | undefined> {
    try {
      console.log("[OTP Login] Starting OTP verification for phone:", phoneNumber);
      if (!this._auth) return;
      const api = ServiceConfig.getI().apiHandler;
      await this.preLoginCleanup();
      const { data: user, error } = await this._auth.verifyOtp({
        phone: phoneNumber,
        token: verificationCode,
        type: "sms",
      });
      if (error) throw new Error("OTP verification failed: " + error.message);
      console.log("[OTP Login] OTP verification response:", user);
      localStorage.setItem(REFRESH_TOKEN, JSON.stringify(user.session?.refresh_token));
      if (user.session?.refresh_token) {
        Util.addRefreshTokenToLocalStorage(user.session.refresh_token);
      }
      const rpcRes = await this._supabaseDb?.rpc("isUserExists", {
        user_email: "",
        user_phone: user?.user?.phone ?? "",
      });
      console.log("[OTP Login] RPC response (isUserExists):", rpcRes?.data);

      await this.handleCacheOnLogin(user?.user?.id);
      await ServiceConfig.getI().apiHandler.syncDB();

      if (rpcRes?.data) {
        console.log("[OTP Login] User exists. Loading existing user data.");
        const existingUser = await api.getUserByDocId(user.user?.id ?? "");
        this._currentUser = existingUser;
      } else {
        console.log("[OTP Login] User does not exist. Creating new user document.");
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
          name: "", // default empty name
          updated_at: new Date().toISOString(),
          email: "",
          phone: user?.user?.phone ?? "",
          music_off: false,
          sfx_off: false,
          fcm_token: null,
          student_id: null,
        });
        this._currentUser = createdUser;
      }
      await api.updateFcmToken(user?.user?.id ?? "");
      await ServiceConfig.getI().apiHandler.syncDB();
      if (rpcRes?.data) {
        await api.subscribeToClassTopic();
      }
      console.log("[OTP Login] Completed successfully.");
      return { user, isUserExist: rpcRes?.data ?? false };
    } catch (error) {
      console.error("[OTP Login] Error:", error);
      // Clear any recaptcha verifier if available
      if (typeof window !== "undefined" && window.recaptchaVerifier && window.recaptchaVerifier.clear) {
        window.recaptchaVerifier.clear();
      }
      return { user: null, isUserExist: false };
    }
  }

  // ─── GET CURRENT USER (Cached or via API) ─────────────────────
  async getCurrentUser(): Promise<TableTypes<"user"> | undefined> {
    if (this._currentUser) return this._currentUser;
    if (!navigator.onLine) {
      const api = ServiceConfig.getI().apiHandler;
      const user = localStorage.getItem(USER_DATA);
      if (user) this._currentUser = JSON.parse(user) as TableTypes<"user">;
      return this._currentUser;
    } else {
      await this.refreshSession();
      const authData = await this._auth?.getSession();
      if (!authData || !authData.data.session?.user?.id) return;
      const api = ServiceConfig.getI().apiHandler;
      const user = await api.getUserByDocId(authData.data.session.user.id);
      localStorage.setItem(USER_DATA, JSON.stringify(user));
      this._currentUser = user;
      return this._currentUser;
    }
  }

  // ─── REFRESH SESSION ──────────────────────────────────────────
  async refreshSession(): Promise<void> {
    try {
      const authData = await this._auth?.getSession();
      let sessionExp = authData?.data.session?.expires_at;
      sessionExp = Number(sessionExp);
      const currentTime = new Date().getTime() / 1000;
      const threshold = 500;
      if (sessionExp < currentTime || sessionExp <= currentTime + threshold) {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN);
        const result = refreshToken?.replace(/"/g, "");
        if (!result) {
          console.error("No refresh token available");
          return;
        }
        const response = await this._auth?.refreshSession({ refresh_token: result });
        if (response) {
          const { error, data } = response;
          if (error) throw new Error("Session refresh failed: " + error.message);
          else if (data && data.session) {
            const { access_token, refresh_token } = data.session;
            this._auth?.setSession({ access_token, refresh_token });
            Util.addRefreshTokenToLocalStorage(data.session.refresh_token);
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
      const authData = await this._auth?.getSession();
      return !!authData?.data?.session?.user;
    } else {
      return !!localStorage.getItem(CURRENT_USER);
    }
  }

  phoneNumberSignIn(phoneNumber: any, recaptchaVerifier: any): Promise<any> {
    throw new Error("Method not implemented.");
  }

  resendOtpMsg91(phoneNumber: string): Promise<boolean | undefined> {
    return this.generateOtp(phoneNumber, "");
  }

  async generateOtp(phoneNumber: string, appName: string): Promise<boolean | undefined> {
    try {
      if (!this._auth) return false;
      const { data, error } = await this._auth.signInWithOtp({ phone: phoneNumber });
      return !error;
    } catch (error) {
      console.log("Failed with", error);
    }
  }

  // ─── HANDLE CACHE ON LOGIN ────────────────────────────────────
  async handleCacheOnLogin(currentUserId: string | undefined) {
    const state = getUserState();
    console.log("Current stored state:", state);
    console.log("New user ID:", currentUserId);

    if (state.currentUserId && currentUserId && state.currentUserId !== currentUserId) {
      console.log("🚀 New user detected - Clearing previous user's cache.");
      // Remove user-specific localStorage keys
      const userSpecificKeys = [CURRENT_USER, USER_DATA, "class", "school", "userRole"];
      userSpecificKeys.forEach((key) => localStorage.removeItem(key));
      // Clear local database cache before new login
      await ServiceConfig.getI().apiHandler.clearUserCache();
      state.previousUserId = state.currentUserId;
    }
    state.currentUserId = currentUserId;
    setUserState(state);
    console.log("Updated state:", getUserState());
  }

  private async preLoginCleanup(): Promise<void> {
    try {
      console.log("🔄 [preLoginCleanup] Dropping user tables...");
      const userKeys = [CURRENT_USER, USER_DATA, "class", "school", "userRole", USER_STATE_KEY];
      userKeys.forEach((key) => localStorage.removeItem(key));
  
      await ServiceConfig.getI().apiHandler.dropAllTables();
      console.log("✅ [preLoginCleanup] Done.");
    } catch (err) {
      console.error("❌ [preLoginCleanup] Error:", err);
    }
  }  

  // ─── LOGOUT ─────────────────────────────────────────────────────
  async logOut(): Promise<void> {
    try {
      if (this._currentUser?.id) {
        localStorage.setItem("PREVIOUS_USER_ID", this._currentUser.id);
      }
  
      const keysToRemove = [CURRENT_USER, USER_DATA, "class", "school", "userRole", "USER_STATE"];
      keysToRemove.forEach((key) => localStorage.removeItem(key));
  
      // 🔥 Drop all tables (clean DB without messing with connection)
      await ServiceConfig.getI().apiHandler.dropAllTables();
  
      await this._auth?.signOut();
      this._currentUser = undefined;
  
      console.log("👋 User logged out and DB tables dropped.");
    } catch (error) {
      console.error("❌ Error during logout:", error);
    }
  }  
}
