import { ServiceApi } from "./ServiceApi";

export class FirebaseApi implements ServiceApi {
  public static i: FirebaseApi;

  private constructor() {}

  public static getInstance(): FirebaseApi {
    if (!FirebaseApi.i) {
      FirebaseApi.i = new FirebaseApi();
    }
    return FirebaseApi.i;
  }
}
