import { ServiceAuth } from "./ServiceAuth";
import {
  ConfirmationResult,
  GoogleAuthProvider,
  PhoneAuthProvider,
  getAuth,
  signInWithCredential,
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
import { FirebaseAnalytics } from "@capacitor-community/firebase-analytics";
import { ACTION, EVENTS } from "../../common/constants";

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
        FirebaseAnalytics.logEvent({name:EVENTS.USER_PROFILE,params:{
          user_id: user.uid,
          user_name: user.displayName,
          user_username: user.email,
          phone_number: user.email ?? user.phoneNumber!,
          user_type: RoleType.PARENT,
          action_type: ACTION.CREATE
        }});
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
      true,
      true
    );
    await setDoc(userRef, tempUser.toJson());
    this._currentUser = tempUser;
    this._currentUser.docId = user.uid;
    return this._currentUser;
  }

  public async getCurrentUser(): Promise<User | undefined> {
    if (this._currentUser) return this._currentUser;
    let currentUser: any = (await FirebaseAuthentication.getCurrentUser()).user;
    console.log("let currentUser", currentUser);

    if (!currentUser) {
      currentUser = getAuth().currentUser;
      console.log("currentUser in if (!currentUser) {", currentUser);
    }
    if (!currentUser) return;
    const tempUserDoc = await getDoc(doc(this._db, "User", currentUser.uid));
    this._currentUser = (tempUserDoc.data() || tempUserDoc) as User;
    console.log(
      "currentUser in if (!currentUser) {",
      tempUserDoc,
      this._currentUser
    );
    this._currentUser.docId = tempUserDoc.id;
    return this._currentUser;
  }

  public set currentUser(value: User) {
    this._currentUser = value;
  }
  // public set updateCurrentUser(user: User) {
  //     this._currentUser = user;
  // }

  public async phoneNumberSignIn(
    phoneNumber,
    recaptchaVerifier
  ): Promise<ConfirmationResult | undefined> {
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
                // Attach `phoneCodeSent` listener to be notified as soon as the SMS is sent
                await FirebaseAuthentication.addListener(
                  "phoneCodeSent",
                  async (event) => {
                    console.log("phoneCodeSent event ", event);

                    resolve(event);
                  }
                );

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

                // // Attach `phoneVerificationCompleted` listener to be notified if phone verification could be finished automatically
                // await FirebaseAuthentication.addListener(
                //   "phoneVerificationCompleted",
                //   async (event) => {
                //     resolve(event.user);
                //   }
                // );

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

  public async proceedWithVerificationCode(
    result,
    verificationCode
  ): Promise<{ user: any; isUserExist: boolean } | undefined> {
    try {
      // const verificationCode = e.detail.data.values[0];
      console.log("verificationCode", verificationCode);
      if (!verificationCode || !result || verificationCode.length < 6) {
        return;
      }

      // Confirm the verification code
      // const credential = await FirebaseAuthentication.confirmVerificationCode({
      //   verificationId: result.verificationId,
      //   verificationCode,
      // });
      const credential = PhoneAuthProvider.credential(
        result.verificationId!,
        verificationCode
      );
      console.log("credential", this._auth, credential);

      let res = await signInWithCredential(this._auth, credential);
      console.log("signInWithCredential Success!", credential, res.user);
      // Success!

      if (!res.user) {
        return;
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
      return { user: user, isUserExist: tempUserDoc.exists() };
      // return user;
    } catch (error) {
      // Failure!
      console.log("signInWithCredential Failure!", error);
      throw error;
    }
  }

  public async createPhoneAuthUser(userData, result): Promise<any> {
    try {
      const additionalUserInfo = result.additionalUserInfo;
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
        FirebaseAnalytics.logEvent({name:EVENTS.USER_PROFILE,params:{
          user_id: u.uid,
          user_name: u.name,
          user_username: u.username,
          phone_number: u.username,
          user_type: RoleType.PARENT,
          action_type: ACTION.CREATE
        }});
      } else {
        this._currentUser = tempUserDoc.data() as User;
        this._currentUser.docId = tempUserDoc.id;
        Util.subscribeToClassTopicForAllStudents(this._currentUser);
      }
      // }
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

    for (var i = 0; i < 10; i++) {
      await new Promise((res) => setTimeout(res, 100));
      const user = await this.getCurrentUser();
      console.log(
        "🚀 ~ file: FirebaseAuth.ts:146 ~ FirebaseAuth ~ isUserLoggedIn ~ user:",
        user
      );
      if (!!user) {
        return true;
      }
    }
    if (!user && Capacitor.isNativePlatform()) return false;
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
