import { ServiceAuth } from "./ServiceAuth";

export class AuthHandler {
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

  // public async getUser(userId: string): Promise<User | undefined> {
  //   return await this.s.getUser(userId);
  // }
}
