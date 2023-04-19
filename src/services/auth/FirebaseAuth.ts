import { ServiceAuth } from "./ServiceAuth";
import {
  GoogleAuthProvider,
  getAuth,
  signInWithCredential,
} from "firebase/auth";
import User from "../../models/user";
import {
  DocumentReference,
  Timestamp,
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getFirestore,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { RoleType } from "../../interface/modelInterfaces";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
// import { getFirebaseAuth } from "../Firebase";
import { App } from "@capacitor/app";
import { Util } from "../../utility/util";
import { Capacitor } from "@capacitor/core";
import { DEFAULT_COURSE_IDS } from "../../common/constants";

export class FirebaseAuth implements ServiceAuth {
  public static i: FirebaseAuth;
  private _currentUser: User | null;
  private _db = getFirestore();
  private _auth = getAuth();

  private constructor() {}

  public static getInstance(): FirebaseAuth {
    if (!FirebaseAuth.i) {
      FirebaseAuth.i = new FirebaseAuth();
    }
    return FirebaseAuth.i;
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
      user.uid
    );
    await setDoc(userRef, tempUser.toJson());
    this._currentUser = tempUser;
    return this._currentUser;
  }

  public async getCurrentUser(): Promise<User | undefined> {
    if (this._currentUser) return this._currentUser;
    const currentUser = (await FirebaseAuthentication.getCurrentUser()).user;
    if (!currentUser) return;
    const tempUserDoc = await getDoc(doc(this._db, "User", currentUser.uid));
    this._currentUser = tempUserDoc.data() as User;
    this._currentUser.docId = tempUserDoc.id;
    return this._currentUser;
  }

  async isUserLoggedIn(): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!!user) return true;
    if (!user && Capacitor.isNativePlatform()) return false;
    for (var i = 0; i < 10; i++) {
      await new Promise((res) => setTimeout(res, 100));
      const user = await this.getCurrentUser();
      console.log(
        "🚀 ~ file: FirebaseAuth.ts:146 ~ FirebaseAuth ~ isUserLoggedIn ~ user:",
        user
      );
      if (!!user) return true;
    }
    return false;
  }

  async logOut(): Promise<void> {
    await FirebaseAuthentication.signOut();
    await this._auth.signOut();
    this._currentUser = null;
  }
}
