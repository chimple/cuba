import ORUser from "../../models/OneRoster/ORUser";

export interface ServiceAuth {
  loginWithEmailAndPassword(email, password): Promise<boolean>;

  googleSign(): Promise<boolean>;

  getCurrentUser(): Promise<ORUser | undefined>;

  set currentUser(user: ORUser);

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
  loginWithRespect(): Promise<ORUser | boolean | undefined>;
}
