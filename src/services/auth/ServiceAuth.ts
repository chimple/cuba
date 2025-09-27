import { UserAttributes } from "@supabase/supabase-js";
import { TableTypes } from "../../common/constants";
// import { SignInWithPhoneNumberResult } from "@capacitor-firebase/authentication";

export interface ServiceAuth {
  loginWithEmailAndPassword(
    email: string,
    password: string
  ): Promise<{ success: boolean; isSpl: boolean }>;

  googleSign(): Promise<{ success: boolean; isSpl: boolean }>;

  getCurrentUser(): Promise<TableTypes<"user"> | undefined>;

  set currentUser(user: TableTypes<"user">);

  isUserLoggedIn(): Promise<boolean>;

  phoneNumberSignIn(phoneNumber, recaptchaVerifier): Promise<any>;

  resendOtpMsg91(phoneNumber: string): Promise<boolean | undefined>;

  generateOtp(
    phoneNumber: string,
    appName: string
  ): Promise<{ success: boolean; error?: any }>;

  proceedWithVerificationCode(
    verificationId,
    verificationCode
  ): Promise<{ user: any; isUserExist: boolean; isSpl: boolean } | undefined>;

  logOut(): Promise<void>;
  doRefreshSession(): Promise<void>;
  /**
   * Authenticates a user using their email and password.
   *
   * @param email - The user's email address.
   * @param password - The user's password.
   * @returns A promise that resolves to an object containing:
   *  - `success`: `true` if sign-in is successful, otherwise `false`.
   *  - `isSpl`: `true` if the user is a special user (e.g., super admin or operational director)
   *             or belongs to a program, otherwise `false`.
   */
  signInWithEmail(
    email: string,
    password: string
  ): Promise<{ success: boolean; isSpl: boolean }>;
  /**
   * Sends a password reset email to the given address.
   *
   * @param email - The email address to which the reset password link will be sent.
   * @returns A promise that resolves to `true` if the email was sent successfully, otherwise `false`.
   */
  sendResetPasswordEmail(email: string): Promise<boolean>;
  /**
   * Updates the attributes of the currently authenticated user.
   *
   * @param attributes - An object containing user attributes to be updated (e.g., password).
   * @returns A promise that resolves to `true` if the update was successful, otherwise `false`.
   */
  updateUser(attributes: UserAttributes): Promise<boolean>;
}
