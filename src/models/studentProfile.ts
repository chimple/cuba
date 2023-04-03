import { BaseObject } from "./baseObject";
import { DocumentReference } from "@firebase/firestore";

export default class StudentProfile extends BaseObject {
  private _classes: string[];
  private _last5Lessons: object;
  private _lastPlayedCourse: DocumentReference;
  private _lessons: object;
  private _school: DocumentReference;

  constructor(
    lastPlayedCourse: DocumentReference,
    classes: string[],
    last5Lessons: object,
    lessons: object,
    school: DocumentReference,
    dateLastModified: string,
    createdAt: string,
    docId: string
  ) {
    super(dateLastModified, createdAt, docId);
    this._lastPlayedCourse = lastPlayedCourse;
    this._classes = classes;
    this._last5Lessons = last5Lessons;
    this._lessons = lessons;
    this._school = school;
  }

  public get classes(): string[] {
    return this._classes;
  }
  public set classes(value: string[]) {
    this._classes = value;
  }
  public get last5Lessons(): object {
    return this._last5Lessons;
  }
  public set last5Lessons(value: object) {
    this._last5Lessons = value;
  }
  public get lastPlayedCourse(): DocumentReference {
    return this._lastPlayedCourse;
  }
  public set lastPlayedCourse(value: DocumentReference) {
    this._lastPlayedCourse = value;
  }
  public get lessons(): object {
    return this._lessons;
  }
  public set lessons(value: object) {
    this._lessons = value;
  }
  public get school(): DocumentReference {
    return this._school;
  }
  public set school(value: DocumentReference) {
    this._school = value;
  }
}
