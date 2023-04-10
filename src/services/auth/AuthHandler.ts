import User from "../../models/user";
import { ServiceAuth } from "./ServiceAuth";

export class AuthHandler implements ServiceAuth {
  public static i: AuthHandler;

  private s: ServiceAuth;

  private constructor() {}

  public static getInstance(s: ServiceAuth): AuthHandler {
    if (!AuthHandler.i) {
      AuthHandler.i = new AuthHandler();
      AuthHandler.i.s = s;
    }
    return AuthHandler.i;
  }

  async googleSign(): Promise<boolean> {
    return await this.s.googleSign();
  }

  async getCurrentUser(): Promise<User | undefined> {
    return await this.s.getCurrentUser();
  }

  async isUserLoggedIn(): Promise<boolean> {
    return await this.s.isUserLoggedIn();
  }
}
