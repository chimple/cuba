import { ServiceAuth } from "./ServiceAuth";
import {
  ConfirmationResult,
  GoogleAuthProvider,
  PhoneAuthProvider,
  getAuth,
  indexedDBLocalPersistence,
  initializeAuth,
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
} from "firebase/firestore";
import { RoleType } from "../../interface/modelInterfaces";
import {
  FirebaseAuthentication,
  SignInWithPhoneNumberResult,
} from "@capacitor-firebase/authentication";
// import { cfaSignIn } from "capacitor-firebase-auth-x";
// import { FirebaseAuthentication } from "@awesome-cordova-plugins/firebase-authentication";
// import { getFirebaseAuth } from "../Firebase";
import { App } from "@capacitor/app";
import { Util } from "../../utility/util";
import { Capacitor } from "@capacitor/core";
import { getApp } from "firebase/app";

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
      } else {
        const tempUserDoc = await getDoc(userRef);
        if (!tempUserDoc.exists) {
          await this._createUserDoc(user);
        } else {
          this._currentUser = tempUserDoc.data() as User;
        }
      }
      App.addListener("appStateChange", Util.onAppStateChange);
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
    console.log("currentUser in if (!currentUser) {", currentUser);
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
  ): Promise<ConfirmationResult | SignInWithPhoneNumberResult | undefined> {
    try {
      let verificationId;
      console.log(
        "onclick phone Number",
        phoneNumber,
        Capacitor.isNativePlatform()
      );
      let result: ConfirmationResult | SignInWithPhoneNumberResult;
      if (Capacitor.isNativePlatform()) {
        console.log("if (Capacitor.isNativePlatform()) {");
        // let res = await FirebaseAuthentication.verifyPhoneNumber(
        //   phoneNumber,
        //   0
        // ).then((verificationId) => {
        //   console.log("in then verificationId", verificationId, res);
        // });

        result = await FirebaseAuthentication.signInWithPhoneNumber({
          phoneNumber,
        });
        App.addListener("appStateChange", Util.onAppStateChange);

        // .then((verificationId) => {
        //   console.log("verificationId in verifyphonenumber", verificationId);

        //   // var code = prompt("Enter verification code");
        //   // if (code) {
        //   FirebaseAuthentication.signInWithVerificationId(
        //     verificationId,
        //     "code"
        //   );
        //   // }
        // })
        // .catch((err) => {
        //   console.error("Phone number verification failed", err);
        // });

        // result = cfaSignIn("phone", { phone: phoneNumber }).subscribe((user) =>
        //   console.log(user.phoneNumber)
        // );
        // // Android and iOS
        // cfaSignInPhoneOnCodeSent().subscribe((verificationId) => {
        //   console.log(verificationId);
        // });
        // // Android Only
        // cfaSignInPhoneOnCodeReceived().subscribe(
        //   (event: { verificationId: string; verificationCode: string }) => {
        //     console.log(`${event.verificationId}:${event.verificationCode}`);
        //     return event;
        //   }
        // );
        // result = await FirebaseAuthentication.signInWithPhoneNumber({
        //   phoneNumber,
        // });
        // console.log("if (Capacitor.isNativePlatform()) { result ", result);
        console.log("FirebaseAuthentication.verifyPhoneNumber res", result);
        return result;
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
      return;
    }
  }

  public async proceedWithVerificationCode(
    result,
    verificationCode
  ): Promise<any> {
    try {
      // const verificationCode = e.detail.data.values[0];
      console.log("verificationCode", verificationCode);
      if (!verificationCode || !result || verificationCode.length < 6) {
        return;
      }
      const credential = PhoneAuthProvider.credential(
        result.verificationId!,
        verificationCode
      );
      console.log("credential", this._auth, credential);

      let res = await signInWithCredential(this._auth, credential);
      console.log("signInWithCredential Success!", res);
      // Success!

      const user = res.user;
      console.log("res user", user);
      // const userRef = doc(this._db, "User", user.uid);
      // // if (res.additionalUserInfo?.isNewUser) {
      // //   await this._createUserDoc(user);
      // // } else {
      // console.log("userRef", userRef);
      // const tempUserDoc = await getDoc(userRef);
      // console.log("tempUserDoc", tempUserDoc);
      // // if (tempUserDoc.exists()) {
      // let u = await this._createUserDoc(user);
      // console.log("created user", u);
      // // } else {
      // //   this._currentUser = tempUserDoc.data() as User;
      // //   console.log("this._currentUser", tempUserDoc.data() as User);
      // // }
      // // }
      // // // App.addListener("appStateChange", Util.onAppStateChange);

      return user;
    } catch (err) {
      // Failure!
      console.log("signInWithCredential Failure!", err);
      return;
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
      } else {
        this._currentUser = tempUserDoc.data() as User;
      }
      // }

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
    }
    if (!user && Capacitor.isNativePlatform()) return false;
    return false;
  }

  async logOut(): Promise<void> {
    await FirebaseAuthentication.signOut();
    await this._auth.signOut();
    this._currentUser = undefined;
  }
}
