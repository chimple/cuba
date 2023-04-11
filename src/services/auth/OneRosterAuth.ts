import User from "../../models/user";
import { ServiceAuth } from "./ServiceAuth";

export class OneRosterAuth implements ServiceAuth {
  public static i: OneRosterAuth;

  private constructor() {}
  logOut(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  isUserLoggedIn(): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  public static getInstance(): OneRosterAuth {
    if (!OneRosterAuth.i) {
      OneRosterAuth.i = new OneRosterAuth();
    }
    return OneRosterAuth.i;
  }

  googleSign(): Promise<any> {
    throw new Error("Method not implemented.");
  }

  getCurrentUser(): Promise<User | undefined> {
    throw new Error("Method not implemented.");
  }
}
