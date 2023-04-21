import { DocumentReference, Timestamp } from "firebase/firestore";
import { RoleType } from "../interface/modelInterfaces";
import BaseObject from "./baseObject";

export default class User extends BaseObject {
  private _username: string;
  private _users: DocumentReference[];
  private _name: string;
  private _role: RoleType;
  private _uid: string;
  private _courses: DocumentReference[];
  private _age: number | null;
  private _image: string | null;
  private _gender: string | null;
  private _board: DocumentReference | null;
  private _grade: DocumentReference | null;
  private _language: DocumentReference | null;
  private _avatar: string | null;
  private _soundFlag: boolean | undefined;
  private _musicFlag: boolean | undefined;

  constructor(
    username: string,
    users: DocumentReference[],
    name: string,
    role: RoleType,
    uid: string,
    courses: DocumentReference[],
    age: number | null,
    image: string | null,
    gender: string | null,
    board: DocumentReference | null,
    grade: DocumentReference | null,
    language: DocumentReference | null,
    avatar: string | null,
    dateLastModified: Timestamp,
    createdAt: Timestamp,
    docId: string,
    soundFlag: boolean = true,
    musicFlag: boolean = true,
  ) {
    super(dateLastModified, createdAt, docId);
    this._username = username;
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

  }
  public get username(): string {
    return this._username;
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
  public get age(): number | null {
    return this._age;
  }
  public set age(value: number | null) {
    this._age = value;
  }
  public get image(): string | null {
    return this._image;
  }
  public set image(value: string | null) {
    this._image = value;
  }
  public get name(): string {
    return this._name;
  }
  public set name(value: string) {
    this._name = value;
  }
  public get gender(): string | null {
    return this._gender;
  }
  public set gender(value: string | null) {
    this._gender = value;
  }
  public get board(): DocumentReference | null {
    return this._board;
  }
  public set board(value: DocumentReference | null) {
    this._board = value;
  }
  public get grade(): DocumentReference | null {
    return this._grade;
  }
  public set grade(value: DocumentReference | null) {
    this._grade = value;
  }
  public get language(): DocumentReference | null {
    return this._language;
  }
  public set language(value: DocumentReference | null) {
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

  public get avatar(): string | null {
    return this._avatar;
  }
  public set avatar(value: string | null) {
    this._avatar = value;
  }

  public toJson() {
    return {
      username: this.username,
      users: this.users,
      name: this.name,
      role: this.role,
      uid: this.uid,
      courses: this.courses,
      age: this.age,
      image: this.image ?? null,
      gender: this.gender ?? null,
      board: this.board,
      grade: this.grade,
      language: this.language,
      dateLastModified: this.dateLastModified,
      createdAt: this.createdAt,
      // docId: this.docId,
    };
  }
}
