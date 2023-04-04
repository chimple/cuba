import BaseObject from "./baseObject";
import { DocumentReference } from "@firebase/firestore";

export default class Course extends BaseObject {
  private _title: string;
  private _chapters: object[];
  private _courseCode: string;
  private _curriculum: DocumentReference;
  private _grade: DocumentReference;
  private _status: string;
  private _subject: DocumentReference;

  constructor(
    chapters: object[],
    courseCode: string,
    curriculum: DocumentReference,
    grade: DocumentReference,
    status: string,
    subject: DocumentReference,
    title: string,
    dateLastModified: string,
    createdAt: string,
    docId: string
  ) {
    super(dateLastModified, createdAt, docId);
    this._chapters = chapters;
    this._courseCode = courseCode;
    this._curriculum = curriculum;
    this._grade = grade;
    this._status = status;
    this._subject = subject;
    this._title = title;
  }
  public get chapters(): object[] {
    return this._chapters;
  }
  public set chapters(value: object[]) {
    this._chapters = value;
  }
  public get courseCode(): string {
    return this._courseCode;
  }
  public set courseCode(value: string) {
    this._courseCode = value;
  }
  public get curriculum(): DocumentReference {
    return this._curriculum;
  }
  public set curriculum(value: DocumentReference) {
    this._curriculum = value;
  }
  public get grade(): DocumentReference {
    return this._grade;
  }
  public set grade(value: DocumentReference) {
    this._grade = value;
  }
  public get status(): string {
    return this._status;
  }
  public set status(value: string) {
    this._status = value;
  }
  public get subject(): DocumentReference {
    return this._subject;
  }
  public set subject(value: DocumentReference) {
    this._subject = value;
  }
  public get title(): string {
    return this._title;
  }
  public set title(value: string) {
    this._title = value;
  }
}
