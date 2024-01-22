import { DocumentReference, Timestamp } from "firebase/firestore";
import { RoleType } from "../interface/modelInterfaces";
import BaseObject from "./baseObject";
import { Util } from "../utility/util";
import { LeaderboardRewards } from "../common/constants";

export default class User extends BaseObject {
  private _username: string;
  private _usernamePhone: string;
  private _usernameMail: string;
  private _users: DocumentReference[];
  private _name: string;
  private _role: RoleType;
  private _uid: string;
  private _courses: DocumentReference[];
  private _age: number | undefined;
  private _image: string | undefined;
  private _gender: string | undefined;
  private _board: DocumentReference | undefined;
  private _grade: DocumentReference | undefined;
  private _language: DocumentReference | undefined;
  private _avatar: string | undefined;
  private _soundFlag: boolean | undefined;
  private _musicFlag: boolean | undefined;
  static avatar: string;
  private _tcAccept: boolean | undefined;
  private _rewards: LeaderboardRewards | undefined;

  constructor(
    username: string,
    users: DocumentReference[],
    name: string,
    role: RoleType,
    uid: string,
    courses: DocumentReference[],
    age: number | undefined,
    image: string | undefined,
    gender: string | undefined,
    board: DocumentReference | undefined,
    grade: DocumentReference | undefined,
    language: DocumentReference | undefined,
    avatar: string | undefined,
    updatedAt: Timestamp,
    createdAt: Timestamp,
    docId: string,
    soundFlag: boolean = true,
    musicFlag: boolean = true,
    tcAccept: boolean = false,
    rewards?: LeaderboardRewards
  ) {
    super(updatedAt, createdAt, docId);
    this._username = username;
    if (Util.isEmail(username)) {
      this._usernameMail = username;
    } else {
      this._usernamePhone = username;
    }
    this._users = users;
    this._name = name;
    this._role = role;
    this._uid = uid;
    this._courses = courses;
    this._age = age;
    this._image = image;
    this._gender = gender;
    this._board = board;
    this._grade = grade;
    this._language = language;
    this._avatar = avatar;
    this._soundFlag = soundFlag;
    this._musicFlag = musicFlag;
    this._tcAccept = tcAccept;
    this._rewards = rewards;
  }
  public get username(): string {
    return this._username;
  }
  public set usernamePhone(value: string) {
    this._usernamePhone = value;
  }
  public get usernamePhone(): string {
    return this._usernamePhone;
  }
  public set usernameMail(value: string) {
    this._usernameMail = value;
  }
  public get usernameMail(): string {
    return this._usernameMail;
  }
  public set username(value: string) {
    this._username = value;
  }
  public get users(): DocumentReference[] {
    return this._users;
  }
  public set users(value: DocumentReference[]) {
    this._users = value;
  }
  public get role(): RoleType {
    return this._role;
  }
  public set role(value: RoleType) {
    this._role = value;
  }
  public get uid(): string {
    return this._uid;
  }
  public set uid(value: string) {
    this._uid = value;
  }
  public get courses(): DocumentReference[] {
    return this._courses;
  }
  public set courses(value: DocumentReference[]) {
    this._courses = value;
  }
  public get age(): number | undefined {
    return this._age;
  }
  public set age(value: number | undefined) {
    this._age = value;
  }
  public get image(): string | undefined {
    return this._image;
  }
  public set image(value: string | undefined) {
    this._image = value;
  }
  public get name(): string {
    return this._name;
  }
  public set name(value: string) {
    this._name = value;
  }
  public get gender(): string | undefined {
    return this._gender;
  }
  public set gender(value: string | undefined) {
    this._gender = value;
  }
  public get board(): DocumentReference | undefined {
    return this._board;
  }
  public set board(value: DocumentReference | undefined) {
    this._board = value;
  }
  public get grade(): DocumentReference | undefined {
    return this._grade;
  }
  public set grade(value: DocumentReference | undefined) {
    this._grade = value;
  }
  public get language(): DocumentReference | undefined {
    return this._language;
  }
  public set language(value: DocumentReference | undefined) {
    this._language = value;
  }
  public get soundFlag(): boolean | undefined {
    return this._soundFlag;
  }
  public set soundFlag(value: boolean | undefined) {
    this._soundFlag = value;
  }

  public get musicFlag(): boolean | undefined {
    return this._musicFlag;
  }
  public set musicFlag(value: boolean | undefined) {
    this._musicFlag = value;
  }

  public get avatar(): string | undefined {
    return this._avatar;
  }
  public set avatar(value: string | undefined) {
    this._avatar = value;
  }
  public get tcAccept(): boolean | undefined {
    return this._tcAccept;
  }
  public set tcAccept(value: boolean | undefined) {
    this._tcAccept = value;
  }

  public get rewards(): LeaderboardRewards | undefined {
    return this._rewards;
  }
  public set rewards(value: LeaderboardRewards | undefined) {
    this._rewards = value;
  }

  public toJson() {
    return {
      age: this.age ?? null,
      avatar: this.avatar ?? null,
      board: this.board ?? null,
      courses: this.courses,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      gender: this.gender ?? null,
      grade: this.grade ?? null,
      image: this.image ?? null,
      language: this.language ?? null,
      name: this.name,
      role: this.role,
      uid: this.uid,
      username: this.username,
      usernamePhone: this.usernamePhone ?? null,
      usernameMail: this.usernameMail ?? null,
      users: this.users,
      tcAccept: this.tcAccept,
      // docId: this.docId,
    };
  }
}
