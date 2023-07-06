import { Timestamp } from "firebase/firestore";
import BaseObject from "./baseObject";
import { RoleType } from "../interface/modelInterfaces";

export default class School extends BaseObject {
  private _name: string;
  private _image: string | undefined;
  private _courses: string[];
  private _teachers: string[];
  private _principal: string[];
  private _coordinator: string[];
  private _role: RoleType;

  constructor(
    name: string,
    image: string | undefined,
    courses: string[],
    teachers: string[],
    principal: string[],
    coordinator: string[],
    updatedAt: Timestamp,
    createdAt: Timestamp,
    docId: string
  ) {
    super(updatedAt, createdAt, docId);
    this._name = name;
    this._image = image;
    this._teachers = teachers;
    this._principal = principal;
    this._coordinator = coordinator;
    this._courses = courses;
  }
  public get name(): string {
    return this._name;
  }
  public set name(value: string) {
    this._name = value;
  }
  public get courses(): string[] {
    return this._courses;
  }
  public set courses(value: string[]) {
    this._courses = value;
  }
  public get teachers(): string[] {
    return this._teachers;
  }
  public set teachers(value: string[]) {
    this._teachers = value;
  }
  public get principal(): string[] {
    return this._principal;
  }
  public set principal(value: string[]) {
    this._principal = value;
  }
  public get coordinator(): string[] {
    return this._coordinator;
  }
  public set coordinator(value: string[]) {
    this._coordinator = value;
  }
  public get image(): string | undefined {
    return this._image;
  }
  public set image(value: string | undefined) {
    this._image = value;
  }
  public get role(): RoleType {
    return this._role;
  }
  public set role(value: RoleType) {
    this._role = value;
  }
}
