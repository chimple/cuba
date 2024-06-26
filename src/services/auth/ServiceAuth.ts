import { DocumentReference } from "firebase/firestore";
import User from "../../models/user";
import { ConfirmationResult } from "@firebase/auth";
// import { SignInWithPhoneNumberResult } from "@capacitor-firebase/authentication";

export interface ServiceAuth {
  loginWithEmailAndPassword(email, password): Promise<boolean>;

  googleSign(): Promise<boolean>;

  getCurrentUser(): Promise<User | undefined>;

  set currentUser(user: User);

  isUserLoggedIn(): Promise<boolean>;

  phoneNumberSignIn(phoneNumber, recaptchaVerifier): Promise<any>;

  resendOtpMsg91(
    phoneNumber: string,
  ): Promise<boolean | undefined>;

  msg91OtpGenerate(
    phoneNumber: string,
    appName: string
  ): Promise<boolean | undefined>;

  proceedWithVerificationCode(
    verificationId,
    verificationCode
  ): Promise<{ user: any; isUserExist: boolean } | undefined>;

  logOut(): Promise<void>;
}
