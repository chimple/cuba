import BaseObject from "./baseObject";

export default class school extends BaseObject {
  private _name: string;
  private _courses: string[];
  private _teachers: string[];
  private _principal: string[];
  private _coordinator: string[];

  constructor(
    courses: string[],
    teachers: string[],
    principal: string[],
    coordinator: string[],
    name: string,
    dateLastModified: string,
    createdAt: string,
    docId: string
  ) {
    super(dateLastModified, createdAt, docId);
    this._name = name;
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
}
