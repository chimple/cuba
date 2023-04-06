import { ServiceAuth } from "./ServiceAuth";

export class FirebaseAuth implements ServiceAuth {
  public static i: FirebaseAuth;

  private constructor() {}

  public static getInstance(): FirebaseAuth {
    if (!FirebaseAuth.i) {
      FirebaseAuth.i = new FirebaseAuth();
    }
    return FirebaseAuth.i;
  }
}
