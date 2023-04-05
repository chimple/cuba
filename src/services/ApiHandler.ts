import Assignment from "../models/assignment";
import Class from "../models/class";
import Result from "../models/result";
import User from "../models/user";
import { ServiceApi } from "./ServiceApi";

export class ApiHandler {
  public static i: ApiHandler;

  private s: ServiceApi;

  private constructor() {}

  public static getInstance(s: ServiceApi): ApiHandler {
    if (!ApiHandler.i) {
      ApiHandler.i = new ApiHandler();
      ApiHandler.i.s = s;
    }
    return ApiHandler.i;
  }

  // public async getUser(userId: string): Promise<User | undefined> {
  //   return await this.s.getUser(userId);
  // }
}
