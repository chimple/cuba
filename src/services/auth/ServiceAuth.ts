import { DocumentReference } from "firebase/firestore";
import User from "../../models/user";

export interface ServiceAuth {
  googleSign(): Promise<boolean>;

  getCurrentUser(): Promise<User | undefined>;

  isUserLoggedIn(): Promise<boolean>;

  logOut(): Promise<void>;

}
