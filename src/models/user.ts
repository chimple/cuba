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
    dateLastModified: Timestamp,
    createdAt: Timestamp,
    docId: string
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
      dateLastModified: this.dateLastModified,
      createdAt: this.createdAt,
      // docId: this.docId,
    };
  }
}
