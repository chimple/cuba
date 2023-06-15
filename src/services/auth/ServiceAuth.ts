import { DocumentReference } from "firebase/firestore";
import User from "../../models/user";
import { ConfirmationResult } from "@firebase/auth";
// import { SignInWithPhoneNumberResult } from "@capacitor-firebase/authentication";

export interface ServiceAuth {
  googleSign(): Promise<boolean>;

  getCurrentUser(): Promise<User | undefined>;

  set currentUser(user: User);

  isUserLoggedIn(): Promise<boolean>;

  phoneNumberSignIn(
    phoneNumber,
    recaptchaVerifier
  ): Promise<ConfirmationResult | undefined>;

  proceedWithVerificationCode(
    verificationId,
    verificationCode
  ): Promise<boolean>;

  logOut(): Promise<void>;
}
