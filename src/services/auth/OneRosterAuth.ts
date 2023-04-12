import User from "../../models/user";
import { ServiceAuth } from "./ServiceAuth";

export class OneRosterAuth implements ServiceAuth {
  public static i: OneRosterAuth;

  private constructor() {}
  getUserProfiles(): Promise<User[]> {
    throw new Error("Method not implemented.");
  }
  createProfile(
    name: string,
    age: number,
    gender: string,
    image: string | null
  ): Promise<User> {
    throw new Error("Method not implemented.");
  }
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
