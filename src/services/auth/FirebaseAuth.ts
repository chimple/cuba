// @ts-nocheck
import { ServiceAuth } from "./ServiceAuth";
import {
  EmailAuthProvider,
  GoogleAuthProvider,
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
import {
  ACTION,
  EVENTS,
  LANGUAGE,
  TableTypes,
} from "../../common/constants";
import { ServiceConfig } from "../ServiceConfig";
import { getFunctions, httpsCallable } from "firebase/functions";

export class FirebaseAuth implements ServiceAuth {
  public static i: FirebaseAuth;
  private _currentUser: User | undefined;

  private _db = getFirestore();
  private _auth = getAuth(); //FirebaseAuth.whichAuth();

  private constructor() {}

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
      CapApp.addListener("appUrlOpen", Util.onAppUrlOpen);
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
      return false;
    }
  }

  async loginWithEmailAndPassword(
    email: string,
    password: string
  ): Promise<boolean> {
    try {
      if (!email || !password) {
        throw new Error("Email and password are required.");
      }
      const result = await FirebaseAuthentication.signInWithEmailAndPassword({
        email,
        password,
      });
      const credential = EmailAuthProvider.credential(email, password);
      await signInWithCredential(this._auth, credential);
      const user = result.user;
      const additionalUserInfo = result.additionalUserInfo;
      if (!user) return false;
      const userRef = doc(this._db, CollectionIds.USER, user.uid);
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
      this.updateUserPreferenceLanguage();
      return true;
    } catch (error) {
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

  public async getCurrentUser(): Promise<TableTypes<"user"> | undefined> {
    throw new Error("Method not implemented");
    // try {
    //   if (this._currentUser) return this._currentUser;
    //   const currentUser = this._auth.currentUser;
    
    //   // let currentUser: any = (await FirebaseAuthentication.getCurrentUser()).user;
    //   

    //   // if (!currentUser) {
    //   //   currentUser = getAuth().currentUser;
    //   
    //   // }
    //   if (!currentUser) return;
    //   const tempUserDoc = await getDoc(doc(this._db, "User", currentUser.uid));
    //   this.updateUserPreferenceLanguage();
    //   this._currentUser = (tempUserDoc.data() || tempUserDoc) as User;
    
    //   this._currentUser.docId = tempUserDoc.id;
    //   return this._currentUser;
    // } catch (error) {
    
    // }
  }

  public set currentUser(value: User) {
    this._currentUser = value;
  }
  // public set updatecurrentUser(user: TableTypes<"user">) {
  //     this._currentUser = user;
  // }

  public async phoneNumberSignIn(phoneNumber, recaptchaVerifier): Promise<any> {
    try {
      let verificationId;
      let result: any;
      if (Capacitor.isNativePlatform()) {
        try {
          // let res = await FirebaseAuthentication.verifyPhoneNumber(
          //   phoneNumber,
          //   0
          // ).then((verificationId) => {
          
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
                    clearTimeout(timeOut);
                    resolve(event);
                  }
                );

                // // Attach `phoneCodeSent` listener to be notified as soon as the SMS is sent
                // await FirebaseAuthentication.addListener(
                //   "authStateChange",
                //   async (event) => {
                

                //     resolve(event);
                //   }
                // );

                await FirebaseAuthentication.addListener(
                  "phoneVerificationFailed",
                  async (event) => {

                    reject(event.message);
                  }
                );

                // Attach `phoneVerificationCompleted` listener to be notified if phone verification could be finished automatically
                await FirebaseAuthentication.addListener(
                  "phoneVerificationCompleted",
                  async (event) => {

                    if (event.user) {
                      const user = event.user;
                      this.updateUserFcm(event.user.uid);
                      const userRef = doc(this._db, "User", user.uid);
                      const tempUserDoc = await getDoc(userRef);
                      if (tempUserDoc.exists() && !!tempUserDoc.data()) {
                        const userDoc = tempUserDoc.data() as User;
                        userDoc.docId = tempUserDoc.id;
                        Util.subscribeToClassTopicForAllStudents(userDoc);
                      }
                      await Util.migrate();
                      resolve(event);
                    } else {

                      reject(event);
                    }
                  }
                );

                // Start sign in with phone number and send the SMS
                await FirebaseAuthentication.signInWithPhoneNumber({
                  phoneNumber: phoneNumber,
                });
              } catch (error) {
                throw error;
              }
            });
          };
          result = await signInWithPhoneNumber();

          App.addListener("appStateChange", Util.onAppStateChange);
          return result;
        } catch (error) {
          throw error;
        }
      } else {
        result = await signInWithPhoneNumber(
          this._auth,
          phoneNumber,
          recaptchaVerifier
        );
        verificationId = result?.verificationId;
        return result;
      }

      // if (verificationId) {
      
      //   proceedWithVerificationCode(verificationId);
      // }
    } catch (error) {
      throw error;
    }
  }

  public async generateOtp(
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
      return response["status"];
    } catch (error) {
    }
  }
  public async resendOtpMsg91(
    phoneNumber: string
  ): Promise<boolean | undefined> {
    try {
      const functions = getFunctions();
      const msg91Otp = httpsCallable(functions, "ResendOtpWithMSG91");
      const result = await msg91Otp({
        phoneNumber,
      });
      const response = result.data as Map<string, boolean>;
      return response["status"];
    } catch (error) {
    }
  }
  public async proceedWithVerificationCode(
    phone_number,
    verificationCode
  ): Promise<{ user: any; isUserExist: boolean } | undefined> {
    try {
      // const verificationCode = e.detail.data.values[0];
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
      const generateCustomTocken = httpsCallable(
        functions,
        "GenerateCustomToken"
      );
      const result = await generateCustomTocken({
        phoneNumber: phone_number,
        otp: verificationCode,
      });
      const response = result.data as Map<string, string>;
      // const credential = PhoneAuthProvider.credential(
      //   result.verificationId,
      //   verificationCode
      // );
      const auth = await getAuth();
      if (response["error"] != null) {
        throw Error(response["error"]);
      }
      await FirebaseAuthentication.signInWithCustomToken({
        token: response["customToken"],
      });
      let res = await signInWithCustomToken(auth, response["customToken"]);
      // let res = await signInWithCredential(auth, credential);
      const u = await FirebaseAuthentication.getCurrentUser();

      
      // Success!

      // await FirebaseAuthentication.confirmVerificationCode({
      //   verificationId: result.verificationId,
      //   verificationCode,
      // });

      
      

      if (!res.user) {
        throw Error("Verification Failed");
      }
      const user = res.user;
      this.updateUserFcm(res.user.uid);
      const userRef = doc(this._db, "User", user.uid);
      const tempUserDoc = await getDoc(userRef);
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
      throw error;
    }
  }

  public async createPhoneAuthUser(userData): Promise<any> {
    try {
      // const additionalUserInfo = result.additionalUserInfo;
      // const additionalUserInfo = getAdditionalUserInfo(result)
      if (!userData) return false;
      const userRef = doc(this._db, "User", userData.uid);
      // if (additionalUserInfo?.isNewUser) {
      //   let u = await this._createUserDoc(userData);
      
      // } else {
      const tempUserDoc = await getDoc(userRef);
      if (!tempUserDoc.exists()) {
        let u = await this._createUserDoc(userData);
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
      return false;
    }
  }

  async isUserLoggedIn(): Promise<boolean> {
    throw new Error("Method not implemented");
    

    // const user = await this.getCurrentUser();
    
    // if (!!user) return true;
    
    // // if (!user && Capacitor.isNativePlatform()) return false;

    // const res = localStorage.getItem(CURRENT_USER);
    
    // if (!res) return false;
    // for (var i = 0; i < 1000; i++) {
    //   await new Promise((res) => setTimeout(res, 100));
    //   const user = await this.getCurrentUser();
    
    //   if (!!user) {
    //     await FirebaseAnalytics.setUserId({
    //       userId: user.id,
    //     });
    //     Util.setUserProperties(user);
    //     return true;
    //   }
    // }
    // localStorage.removeItem(CURRENT_USER);
    // if (!user) return false;
    // return false;
  }

  async logOut(): Promise<void> {
    await FirebaseAuthentication.signOut();
    await this._auth.signOut();
    this._currentUser = undefined;
  }

  private updateUserFcm = async (userId: string) => {
    const token = await Util.getToken();
    if (!!token) {
      await updateDoc(doc(this._db, `${CollectionIds.USER}/${userId}`), {
        fcm: token,
        updatedAt: Timestamp.now(),
      });
    }
  };
}
