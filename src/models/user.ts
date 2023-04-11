import { DocumentReference, Timestamp } from "firebase/firestore";
import { RoleType } from "../interface/modelInterfaces";
import BaseObject from "./baseObject";

export default class User extends BaseObject {
  private _username: string;
  private _userIds: DocumentReference[];
  private _name: string;
  private _role: RoleType;
  private _uid: string;
  private _courses: DocumentReference[];
  private _age: number | null;
  private _image: string | null;

  constructor(
    username: string,
    userIds: DocumentReference[],
    name: string,
    role: RoleType,
    uid: string,
    courses: DocumentReference[],
    age: number | null,
    image: string | null,
    dateLastModified: Timestamp,
    createdAt: Timestamp,
    docId: string
  ) {
    super(dateLastModified, createdAt, docId);
    this._username = username;
    this._userIds = userIds;
    this._name = name;
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
  public get userIds(): DocumentReference[] {
    return this._userIds;
  }
  public set userIds(value: DocumentReference[]) {
    this._userIds = value;
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
  public toJson() {
    return {
      username: this.username,
      userIds: this.userIds,
      name: this.name,
      role: this.role,
      uid: this.uid,
      courses: this.courses,
      age: this.age,
      image: this.image ?? null,
      dateLastModified: this.dateLastModified,
      createdAt: this.createdAt,
      docId: this.docId,
    };
  }
}
