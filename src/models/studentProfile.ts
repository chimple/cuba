import { Timestamp } from "firebase/firestore";
import BaseObject from "./baseObject";
import { DocumentReference } from "firebase/firestore";
import { StudentLessonResult } from "../common/courseConstants";

export default class StudentProfile extends BaseObject {
  private _classes: string[];
  private _last5Lessons: object | undefined;
  private _lastPlayedCourse: DocumentReference<any> | null;
  private _lessons: { [lessonDocId: string]: StudentLessonResult };
  private _schools: string[];

  constructor(
    lastPlayedCourse: DocumentReference<any> | null,
    classes: string[],
    last5Lessons: object | undefined,
    lessons: { [lessonDocId: string]: StudentLessonResult },
    schools: string[],
    dateLastModified: Timestamp,
    createdAt: Timestamp,
    docId: string
  ) {
    super(dateLastModified, createdAt, docId);
    this._lastPlayedCourse = lastPlayedCourse;
    this._classes = classes;
    this._last5Lessons = last5Lessons;
    this._lessons = lessons;
    this._schools = schools;
  }

  public get classes(): string[] {
    return this._classes;
  }
  public set classes(value: string[]) {
    this._classes = value;
  }
  public get last5Lessons(): object | undefined {
    return this._last5Lessons;
  }
  public set last5Lessons(value: object | undefined) {
    this._last5Lessons = value;
  }
  public get lastPlayedCourse(): DocumentReference<any> | null {
    return this._lastPlayedCourse;
  }
  public set lastPlayedCourse(value: DocumentReference<any> | null) {
    this._lastPlayedCourse = value;
  }
  public get lessons(): { [lessonDocId: string]: StudentLessonResult } {
    return this._lessons;
  }
  public set lessons(value: { [lessonDocId: string]: StudentLessonResult }) {
    this._lessons = value;
  }
  public get schools(): string[] {
    return this._schools;
  }
  public set schools(value: string[]) {
    this._schools = value;
  }
}
