import { ServiceAuth } from "./ServiceAuth";

export class OneRosterAuth implements ServiceAuth {
  public static i: OneRosterAuth;
  private constructor() {}

  public static getInstance(): OneRosterAuth {
    if (!OneRosterAuth.i) {
      OneRosterAuth.i = new OneRosterAuth();
    }
    return OneRosterAuth.i;
  }
}
