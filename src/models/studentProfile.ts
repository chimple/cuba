import { Timestamp } from "firebase/firestore";
import BaseObject from "./baseObject";
import { DocumentReference } from "firebase/firestore";
import { StudentLessonResult } from "../common/courseConstants";

export default class StudentProfile extends BaseObject {
  private _classes: string[];
  private _last5Lessons: object;
  private _lastPlayedCourse: DocumentReference;
  private _lessons: { [lessonDocId: string]: StudentLessonResult };
  private _schools: string[];

  constructor(
    lastPlayedCourse: DocumentReference,
    classes: string[],
    last5Lessons: object,
    lessons: { [lessonDocId: string]: StudentLessonResult },
    school: string[],
    dateLastModified: Timestamp,
    createdAt: Timestamp,
    docId: string
  ) {
    super(dateLastModified, createdAt, docId);
    this._lastPlayedCourse = lastPlayedCourse;
    this._classes = classes;
    this._last5Lessons = last5Lessons;
    this._lessons = lessons;
    this._schools = school;
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
  public get lessons(): { [lessonDocId: string]: StudentLessonResult } {
    return this._lessons;
  }
  public set lessons(value: { [lessonDocId: string]: StudentLessonResult }) {
    this._lessons = value;
  }
  public get school(): string[] {
    return this._schools;
  }
  public set school(value: string[]) {
    this._schools = value;
  }
}
