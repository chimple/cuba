import { DocumentReference } from "firebase/firestore";
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

  async logOut(): Promise<void> {
    return await this.s.logOut();
  }

  async createProfile(
    name: string,
    age: number,
    gender: string,
    avatar: string | null,
    image: string | null,
    board: DocumentReference | null,
    grade: DocumentReference | null,
    language: DocumentReference | null
  ): Promise<User> {
    return await this.s.createProfile(
      name,
      age,
      gender,
      avatar,
      image,
      board,
      grade,
      language
    );
  }
  async getUserProfiles() {
    return await this.s.getUserProfiles();
  }
}
