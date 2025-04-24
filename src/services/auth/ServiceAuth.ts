import { UserAttributes } from "@supabase/supabase-js";
import { TableTypes } from "../../common/constants";
// import { SignInWithPhoneNumberResult } from "@capacitor-firebase/authentication";

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

  signInWithEmail(email, password): Promise<boolean>;

  sendResetPasswordEmail(email: string): Promise<boolean>;

  updateUser(attributes: UserAttributes): Promise<boolean>;
}
