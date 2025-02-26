import { TableTypes } from "../../common/constants";
// import { SignInWithPhoneNumberResult } from "@capacitor-firebase/authentication";

export interface OneRosterUser {
  respectLaunchVersion: number;
  auth: Array<string>;
  given_name: string;
  locale: string;
  http_proxy: string;
  endpoint_lti_ags: string;
  endpoint: string;
  actor: {
    name: Array<string>;
    mbox: Array<string>;
  };
  registration: string;
  activity_id: string;
}

export interface ServiceAuth {
  loginWithEmailAndPassword(email, password): Promise<boolean>;

  googleSign(): Promise<boolean>;

  getCurrentUser(): Promise<TableTypes<"user"> | undefined>;

  set currentUser(user: TableTypes<"user">);

  isUserLoggedIn(): Promise<boolean>;

  phoneNumberSignIn(phoneNumber, recaptchaVerifier): Promise<any>;

  resendOtpMsg91(phoneNumber: string): Promise<boolean | undefined>;

  generateOtp(
    phoneNumber: string,
    appName: string
  ): Promise<boolean | undefined>;

  proceedWithVerificationCode(
    verificationId,
    verificationCode
  ): Promise<{ user: any; isUserExist: boolean } | undefined>;

  logOut(): Promise<void>;
  refreshSession(): Promise<void>;
  loginWithRespect?(): Promise<OneRosterUser | boolean | undefined>;
}
