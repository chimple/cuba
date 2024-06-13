import { SupabaseAuthClient } from "@supabase/supabase-js/dist/module/lib/SupabaseAuthClient";
import { SupabaseApi } from "../api/SupabaseApi";
import { ServiceAuth } from "./ServiceAuth";
import { Database } from "../database";
import { TableTypes } from "../../common/constants";
import { SupabaseClient } from "@supabase/supabase-js";
import { ServiceConfig } from "../ServiceConfig";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
import { Util } from "../../utility/util";

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

  loginWithEmailAndPassword(email: any, password: any): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  async googleSign(): Promise<boolean> {
    try {
      if (!this._auth) return false;
      const api = ServiceConfig.getI().apiHandler;
      const authUser = await GoogleAuth.signIn();
      console.log("🚀 ~ SupabaseAuth ~ googleSign ~ authUser:", authUser);
      const { data, error } = await this._auth.signInWithIdToken({
        provider: "google",
        token: authUser.authentication.idToken,
        access_token: authUser.authentication.accessToken,
      });
      console.log("🚀 ~ SupabaseAuth ~ googleSign ~ data, error:", data, error);
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
        });
        this._currentUser = createdUser;
      }
      await api.updateFcmToken(data.user?.id ?? authUser.id);
      const isSynced = await ServiceConfig.getI().apiHandler.syncDB();
    } catch (error) {
      console.error("🚀 ~ SupabaseAuth ~ googleSign ~ error:", error);
      return false;
    }
    return true;
  }

  async getCurrentUser(): Promise<TableTypes<"user"> | undefined> {
    if (this._currentUser) return this._currentUser;
    const authData = await this._auth?.getSession();
    if (!authData || !authData.data.session?.user?.id) return;
    const api = ServiceConfig.getI().apiHandler;
    let user = await api.getUserByDocId(authData.data.session?.user.id);
    this._currentUser = user;
    return this._currentUser;
  }
  set currentUser(user: TableTypes<"user">) {
    this._currentUser = user;
  }
  async isUserLoggedIn(): Promise<boolean> {
    if (this._currentUser) return true;
    // const authData = await this._auth?.getUser();
    const authData = await this._auth?.getSession();
    // const user = await this.getCurrentUser();
    return !!authData?.data?.session?.user;
  }
  phoneNumberSignIn(phoneNumber: any, recaptchaVerifier: any): Promise<any> {
    throw new Error("Method not implemented.");
  }
  resendOtpMsg91(phoneNumber: string): Promise<boolean | undefined> {
    throw new Error("Method not implemented.");
  }
  msg91OtpGenerate(
    phoneNumber: string,
    appName: string
  ): Promise<boolean | undefined> {
    throw new Error("Method not implemented.");
  }

  proceedWithVerificationCode(
    verificationId: any,
    verificationCode: any
  ): Promise<{ user: any; isUserExist: boolean } | undefined> {
    throw new Error("Method not implemented.");
  }

  async logOut(): Promise<void> {
    // throw new Error("Method not implemented.");
    await this._auth?.signOut();
    this._currentUser = undefined;
  }
}
