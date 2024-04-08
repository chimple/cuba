import { ServiceAuth } from "./ServiceAuth";
import {
  ConfirmationResult,
  GoogleAuthProvider,
  PhoneAuthProvider,
  getAuth,
  signInWithCredential,
  signInWithCustomToken,
  signInWithPhoneNumber,
} from "firebase/auth";
import User from "../../models/user";
import {
  Timestamp,
  doc,
  getDoc,
  getFirestore,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { RoleType } from "../../interface/modelInterfaces";
import {
  FirebaseAuthentication,
  // SignInWithPhoneNumberResult,
} from "@capacitor-firebase/authentication";
// import { cfaSignIn } from "capacitor-firebase-auth-x";
// import { FirebaseAuthentication } from "@awesome-cordova-plugins/firebase-authentication";
// import { getFirebaseAuth } from "../Firebase";
import { App } from "@capacitor/app";
import { Util } from "../../utility/util";
import { Capacitor } from "@capacitor/core";
import { CollectionIds } from "../../common/courseConstants";
import { ACTION, CURRENT_USER, EVENTS, LANGUAGE } from "../../common/constants";
import { FirebaseAnalytics } from "@capacitor-community/firebase-analytics";
import { ServiceConfig } from "../ServiceConfig";
import { getFunctions, httpsCallable } from "firebase/functions";

export class FirebaseAuth implements ServiceAuth {
  public static i: FirebaseAuth;
  private _currentUser: User | undefined;

  private _db = getFirestore();
  private _auth = getAuth(); //FirebaseAuth.whichAuth();

  private constructor() { }

  public static getInstance(): FirebaseAuth {
    if (!FirebaseAuth.i) {
      FirebaseAuth.i = new FirebaseAuth();
    }
    return FirebaseAuth.i;
  }

  // public static whichAuth() {
  //   let auth;
  //   if (Capacitor.isNativePlatform()) {
  //     auth = initializeAuth(getApp(), {
  //       persistence: indexedDBLocalPersistence,
  //     });
  //   } else {
  //     auth = getAuth(getApp());
  //   }
  //   return auth;
  // }
  private async updateUserPreferenceLanguage() {
    if (!!this._currentUser) {
      const appLang = localStorage.getItem(LANGUAGE);
      if (!!appLang) {
        const languages =
          await ServiceConfig.getI().apiHandler.getAllLanguages();
        const langDocId = languages.find(
          (lang) => lang.code === appLang
        )?.docId;
        if (!!langDocId) {
          const langDoc = doc(
            this._db,
            `${CollectionIds.LANGUAGE}/${langDocId}`
          );

          if (!!langDoc && this._currentUser.language?.id != langDoc?.id) {
            this._currentUser.language = langDoc;
            await updateDoc(
              doc(this._db, `${CollectionIds.USER}/${this._currentUser.uid}`),
              {
                language: this._currentUser.language,
                updatedAt: Timestamp.now(),
              }
            );
          }
        }
      }
    }
  }

  public async googleSign(): Promise<boolean> {
    try {
      await App.removeAllListeners();
      const result = await FirebaseAuthentication.signInWithGoogle();
      // const result = await signInWithPopup(this._auth,this._provider)
      const credential = GoogleAuthProvider.credential(
        result.credential?.idToken
      );
      await signInWithCredential(this._auth, credential);
      const user = result.user;
      const additionalUserInfo = result.additionalUserInfo;
      // const additionalUserInfo = getAdditionalUserInfo(result)
      if (!user) return false;
      const userRef = doc(this._db, "User", user.uid);
      if (additionalUserInfo?.isNewUser) {
        await this._createUserDoc(user);
      } else {
        const tempUserDoc = await getDoc(userRef);
        if (!tempUserDoc.exists) {
          await this._createUserDoc(user);
        } else {
          this._currentUser = tempUserDoc.data() as User;
          this._currentUser.docId = tempUserDoc.id;
          Util.subscribeToClassTopicForAllStudents(this._currentUser);
        }
      }
      App.addListener("appStateChange", Util.onAppStateChange);
      this.updateUserFcm(user.uid);
      const migrateRes = await Util.migrate();
      if (
        migrateRes?.migrated &&
        this._currentUser &&
        !!migrateRes.newStudents
      ) {
        if (!this._currentUser.users) {
          this._currentUser.users = [];
        }
        this._currentUser.users.push(...migrateRes.newStudents);
      }
      this.updateUserPreferenceLanguage();
      return true;
    } catch (error) {
      console.log(
        "🚀 ~ file: FirebaseAuth.ts:60 ~ FirebaseAuth ~ googleSign ~ error:",
        error
      );
      return false;
    }
  }

  private async _createUserDoc(user): Promise<User> {
    // const courseIds: DocumentReference[] = DEFAULT_COURSE_IDS.map((id) =>
    //   doc(this._db, `Course/${id}`)
    // );
    const userRef = doc(this._db, "User", user.uid);
    const tempUser = new User(
      user.email ?? user.phoneNumber!,
      [],
      user.displayName ?? "",
      RoleType.PARENT,
      user.uid,
      [],
      undefined,
      user.photoUrl,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      Timestamp.now(),
      Timestamp.now(),
      user.uid,
      0,
      0
    );
    await setDoc(userRef, tempUser.toJson());
    this._currentUser = tempUser;
    this._currentUser.docId = user.uid;
    Util.logEvent(EVENTS.USER_PROFILE, {
      user_id: tempUser.uid,
      user_name: tempUser.name,
      user_username: tempUser.username,
      phone_number: tempUser.username,
      user_type: RoleType.PARENT,
      action_type: ACTION.CREATE,
    });

    return this._currentUser;
  }

  public async getCurrentUser(): Promise<User | undefined> {
    try {
      if (this._currentUser) return this._currentUser;
      const currentUser = this._auth.currentUser;
      console.log("🚀 ~ file: FirebaseAuth.ts:153 ~ currentUser:", currentUser);
      // let currentUser: any = (await FirebaseAuthentication.getCurrentUser()).user;
      // console.log("let currentUser", currentUser);

      // if (!currentUser) {
      //   currentUser = getAuth().currentUser;
      //   console.log("currentUser in if (!currentUser) {", currentUser);
      // }
      if (!currentUser) return;
      const tempUserDoc = await getDoc(doc(this._db, "User", currentUser.uid));
      this.updateUserPreferenceLanguage();
      this._currentUser = (tempUserDoc.data() || tempUserDoc) as User;
      console.log(
        "currentUser in if (!currentUser) {",
        tempUserDoc,
        this._currentUser
      );
      this._currentUser.docId = tempUserDoc.id;
      return this._currentUser;
    } catch (error) {
      console.log("🚀 ~ file: FirebaseAuth.ts:175 ~ error:", error);
    }
  }

  public set currentUser(value: User) {
    this._currentUser = value;
  }
  // public set updateCurrentUser(user: User) {
  //     this._currentUser = user;
  // }

  public async phoneNumberSignIn(phoneNumber, recaptchaVerifier): Promise<any> {
    try {
      let verificationId;
      console.log(
        "onclick phone Number",
        phoneNumber,
        Capacitor.isNativePlatform()
      );
      let result: any;
      if (Capacitor.isNativePlatform()) {
        try {
          console.log("if (Capacitor.isNativePlatform()) {", phoneNumber);
          // let res = await FirebaseAuthentication.verifyPhoneNumber(
          //   phoneNumber,
          //   0
          // ).then((verificationId) => {
          //   console.log("in then verificationId", verificationId, res);
          // });

          const signInWithPhoneNumber = async () => {
            return new Promise(async (resolve, reject) => {
              try {
                var timeOut = setTimeout(() => {
                  reject("Timed out waiting for SMS");
                }, 60000);
                // Attach `phoneCodeSent` listener to be notified as soon as the SMS is sent
                await FirebaseAuthentication.addListener(
                  "phoneCodeSent",
                  async (event) => {
                    console.log("phoneCodeSent event ", JSON.stringify(event));
                    clearTimeout(timeOut);
                    resolve(event);
                  }
                );

                // // Attach `phoneCodeSent` listener to be notified as soon as the SMS is sent
                // await FirebaseAuthentication.addListener(
                //   "authStateChange",
                //   async (event) => {
                //     console.log("authStateChange event ", event);

                //     resolve(event);
                //   }
                // );

                await FirebaseAuthentication.addListener(
                  "phoneVerificationFailed",
                  async (event) => {
                    console.log(
                      "FirebaseAuth.ts:196 ~ phoneVerificationFailed event ",
                      JSON.stringify(event)
                    );

                    reject(event.message);
                  }
                );

                // Attach `phoneVerificationCompleted` listener to be notified if phone verification could be finished automatically
                await FirebaseAuthentication.addListener(
                  "phoneVerificationCompleted",
                  async (event) => {
                    console.log(
                      "`phoneVerificationCompleted` listener to be notified if phone verification could be finished automatically"
                    );

                    if (event.user) {
                      console.log(
                        "instant verification ",
                        JSON.stringify(event)
                      );
                      const user = event.user;
                      console.log("res user", user);
                      this.updateUserFcm(event.user.uid);
                      const userRef = doc(this._db, "User", user.uid);
                      console.log("userRef", userRef);
                      const tempUserDoc = await getDoc(userRef);
                      console.log(
                        "const tempUserDoc",
                        JSON.stringify(tempUserDoc)
                      );
                      console.log(
                        "return result",
                        JSON.stringify({
                          user: user,
                          isUserExist: tempUserDoc.exists(),
                        })
                      );
                      if (tempUserDoc.exists() && !!tempUserDoc.data()) {
                        const userDoc = tempUserDoc.data() as User;
                        userDoc.docId = tempUserDoc.id;
                        Util.subscribeToClassTopicForAllStudents(userDoc);
                      }
                      await Util.migrate();
                      resolve(event);
                    } else {
                      console.log("instant verification");

                      reject(event);
                    }
                  }
                );

                // Start sign in with phone number and send the SMS
                await FirebaseAuthentication.signInWithPhoneNumber({
                  phoneNumber: phoneNumber,
                });
              } catch (error) {
                console.log(
                  "🚀 ~ file: FirebaseAuth.ts:231 ~ FirebaseAuth ~ phoneNumberSignin ~ error:",
                  error
                );
                throw error;
              }
              console.log("signInWithPhoneNumber exicuted ");
            });
          };
          result = await signInWithPhoneNumber();
          console.log("result = await signInWithPhoneNumber();", result);

          App.addListener("appStateChange", Util.onAppStateChange);
          console.log("result = await signInWithPhoneNumber();", result);
          return result;
        } catch (error) {
          console.log(
            "🚀 ~ file: FirebaseAuth.ts:167 ~ FirebaseAuth ~ phoneNumberSignin ~ error:",
            error
          );
          throw error;
        }
      } else {
        result = await signInWithPhoneNumber(
          this._auth,
          phoneNumber,
          recaptchaVerifier
        );
        console.log("else result ", result);
        verificationId = result?.verificationId;
        console.log("verificationId ", verificationId);
        return result;
      }

      // if (verificationId) {
      //   console.log("verificationId if ");
      //   proceedWithVerificationCode(verificationId);
      // }
    } catch (error) {
      console.log(
        "🚀 ~ file: FirebaseAuth.ts:167 ~ FirebaseAuth ~ phoneNumberSignin ~ error:",
        error
      );
      throw error;
    }
  }

  public async msg91OtpGenerate(
    phoneNumber: string,
    appName: string

  ): Promise<boolean | undefined> {
    try {
      const functions = getFunctions();
      const msg91Otp = httpsCallable(functions, "GenerateOtpWithMSG91");
      const result = await msg91Otp({
        phoneNumber,
        appName,
      });
      const response = result.data as Map<string, boolean>;
      return response['status']
    } catch (error) {
      console.log(
        "Failed with Msg91",
        error
      );
    }
  }
  public async resendOtpMsg91(phoneNumber: string): Promise<boolean | undefined> {
    try {
      const functions = getFunctions();
      const msg91Otp = httpsCallable(functions, "ResendOtpWithMSG91");
      const result = await msg91Otp({
        phoneNumber,
      });
      const response = result.data as Map<string, boolean>;
      return response['status']
    } catch (error) {
      console.log(
        "Failed with Msg91",
        error
      );
    }
  }
  public async proceedWithVerificationCode(
    phone_number,
    verificationCode
  ): Promise<{ user: any; isUserExist: boolean } | undefined> {
    try {
      // const verificationCode = e.detail.data.values[0];
      console.log("verificationCode", verificationCode);
      if (!verificationCode || verificationCode.length < 6) {
        return;
      }

      // Confirm the verification code
      // const credential =
      //   await FirebaseAuthentication.confirmVerificationCode({
      //     verificationId: result.verificationId,
      //     verificationCode,
      //   });
      // if (!confirmVerificationCredential.credential) {
      //   return;
      // }
      const functions = getFunctions();
      const generateCustomTocken = httpsCallable(functions, "GenerateCustomToken");
      const result = await generateCustomTocken({
        'phoneNumber': phone_number,
        'otp': verificationCode,
      });
      const response = result.data as Map<string, string>;
      // const credential = PhoneAuthProvider.credential(
      //   result.verificationId,
      //   verificationCode
      // );
      const auth = await getAuth();
      if (response['error'] != null) {
        throw Error(response['error']);
      }
      let res = await signInWithCustomToken(auth, response['customToken'])
      // let res = await signInWithCredential(auth, credential);
      const u = await FirebaseAuthentication.getCurrentUser();
      console.log(
        "line ni 316 before FirebaseAuthentication.getCurrentUser()",
        JSON.stringify(u.user)
      );
      console.log(
        "line ni 320 before JSON.stringify(auth.currentUser)",
        JSON.stringify(auth.currentUser)
      );

      // console.log("signInWithCredential Success!", JSON.stringify(credential));
      // Success!

      // await FirebaseAuthentication.confirmVerificationCode({
      //   verificationId: result.verificationId,
      //   verificationCode,
      // });

      // console.log(
      //   "line ni 316 FirebaseAuthentication.getCurrentUser()",
      //   JSON.stringify(u.user)
      // );
      // console.log(
      //   "line ni 320 JSON.stringify(auth.currentUser)",
      //   JSON.stringify(auth.currentUser)
      // );

      if (!res.user) {
        throw Error("Verification Failed");
      }
      const user = res.user;
      console.log("res user", user);
      this.updateUserFcm(res.user.uid);
      const userRef = doc(this._db, "User", user.uid);
      console.log("userRef", userRef);
      const tempUserDoc = await getDoc(userRef);
      console.log("const tempUserDoc", JSON.stringify(tempUserDoc));
      console.log(
        "return result",
        JSON.stringify({ user: user, isUserExist: tempUserDoc.exists() })
      );
      if (tempUserDoc.exists() && !!tempUserDoc.data()) {
        const userDoc = tempUserDoc.data() as User;
        userDoc.docId = tempUserDoc.id;
        Util.subscribeToClassTopicForAllStudents(userDoc);
      }
      await Util.migrate();
      return { user: user, isUserExist: tempUserDoc.exists() };
      // return user;
    } catch (error) {
      // Failure!
      console.log("signInWithCredential Failure!", error);
      throw error;
    }
  }

  public async createPhoneAuthUser(userData): Promise<any> {
    try {
      // const additionalUserInfo = result.additionalUserInfo;
      // const additionalUserInfo = getAdditionalUserInfo(result)
      if (!userData) return false;
      const userRef = doc(this._db, "User", userData.uid);
      console.log("userRef", userRef);
      // if (additionalUserInfo?.isNewUser) {
      //   let u = await this._createUserDoc(userData);
      //   console.log("created user", u);
      // } else {
      const tempUserDoc = await getDoc(userRef);
      console.log(
        "tempUserDoc",
        tempUserDoc,
        tempUserDoc.exists(),
        !tempUserDoc.exists()
      );
      if (!tempUserDoc.exists()) {
        let u = await this._createUserDoc(userData);
        console.log("created user", u);
      } else {
        this._currentUser = tempUserDoc.data() as User;
        this._currentUser.docId = tempUserDoc.id;
        Util.subscribeToClassTopicForAllStudents(this._currentUser);
      }
      // await Util.migrate();
      const migrateRes = await Util.migrate();
      if (
        migrateRes?.migrated &&
        this._currentUser &&
        !!migrateRes.newStudents
      ) {
        if (!this._currentUser.users) {
          this._currentUser.users = [];
        }
        this._currentUser.users.push(...migrateRes.newStudents);
      }
      // }
      this.updateUserPreferenceLanguage();
      this.updateUserFcm(userData.uid);
      return true;
    } catch (error) {
      console.log("User Creation Failed!", error);
      return false;
    }
  }

  async isUserLoggedIn(): Promise<boolean> {
    console.log("isUserLoggedIn entred");

    const user = await this.getCurrentUser();
    console.log("isUserLoggedIn user", user, !!user);
    if (!!user) return true;
    console.log(
      "isUserLoggedIn !user && Capacitor.isNativePlatform()",
      !user,
      !user && Capacitor.isNativePlatform()
    );
    // if (!user && Capacitor.isNativePlatform()) return false;

    const res = localStorage.getItem(CURRENT_USER);
    console.log("res...", res);
    if (!res) return false;
    for (var i = 0; i < 1000; i++) {
      await new Promise((res) => setTimeout(res, 100));
      const user = await this.getCurrentUser();
      console.log(
        "🚀 ~ file: FirebaseAuth.ts:146 ~ FirebaseAuth ~ isUserLoggedIn ~ user:",
        user
      );
      if (!!user) {
        await FirebaseAnalytics.setUserId({
          userId: user.uid,
        });
        Util.setUserProperties(user);
        return true;
      }
    }
    localStorage.removeItem(CURRENT_USER);
    if (!user) return false;
    return false;
  }

  async logOut(): Promise<void> {
    await FirebaseAuthentication.signOut();
    await this._auth.signOut();
    this._currentUser = undefined;
  }

  private updateUserFcm = async (userId: string) => {
    const token = await Util.getToken();
    console.log(
      "🚀 ~ file: FirebaseAuth.ts:360 ~ updateUserFcm= ~ token:",
      token
    );
    if (!!token) {
      await updateDoc(doc(this._db, `${CollectionIds.USER}/${userId}`), {
        fcm: token,
        updatedAt: Timestamp.now(),
      });
    }
  };
}
