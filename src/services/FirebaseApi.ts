import Assignment from "../models/assignment";
import Class from "../models/class";
import Result from "../models/result";
import User from "../models/user";
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
