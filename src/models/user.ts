import { RoleType } from "../interface/modelInterfaces";
import { BaseObject } from "./baseObject";

export class User extends BaseObject {
  private _username: string;
  private _userIds: string[];
  private _givenName: string;
  private _familyName: string;
  private _middleName: string | null;
  private _role: RoleType;
  private _uid: string;
  private _courses: string[];
  private _age: number;
  private _image: string;

  constructor(
    username: string,
    userIds: string[],
    givenName: string,
    familyName: string,
    middleName: string | null,
    role: RoleType,
    uid: string,
    courses: string[],
    age: number,
    image: string,
    dateLastModified: string,
    createdAt: string,
    docId: string
  ) {
    super(dateLastModified, createdAt, docId);
    this._username = username;
    this._userIds = userIds;
    this._givenName = givenName;
    this._familyName = familyName;
    this._middleName = middleName;
    this._role = role;
    this._uid = uid;
    this._courses = courses;
    this._age = age;
    this._image = image;
  }
  public get username(): string {
    return this._username;
  }
  public set username(value: string) {
    this._username = value;
  }
  public get userIds(): string[] {
    return this._userIds;
  }
  public set userIds(value: string[]) {
    this._userIds = value;
  }

  public get givenName(): string {
    return this._givenName;
  }
  public set givenName(value: string) {
    this._givenName = value;
  }
  public get familyName(): string {
    return this._familyName;
  }
  public set familyName(value: string) {
    this._familyName = value;
  }
  public get middleName(): string | null {
    return this._middleName;
  }
  public set middleName(value: string | null) {
    this._middleName = value;
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
  public get courses(): string[] {
    return this._courses;
  }
  public set courses(value: string[]) {
    this._courses = value;
  }
  public get age(): number {
    return this._age;
  }
  public set age(value: number) {
    this._age = value;
  }
  public get image(): string {
    return this._image;
  }
  public set image(value: string) {
    this._image = value;
  }
}
