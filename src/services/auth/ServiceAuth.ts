import User from "../../models/user";

export interface ServiceAuth {
  googleSign(): Promise<boolean>;

  getCurrentUser(): Promise<User | undefined>;

  isUserLoggedIn(): Promise<boolean>;

  logOut(): Promise<void>;

  createProfile(
    name: string,
    age: number,
    gender: string,
    image: string | null
  ): Promise<User>;

  getUserProfiles(): Promise<User[]>;
}
