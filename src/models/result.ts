import BaseObject from "./baseObject";
import { DocumentReference, Timestamp } from "@firebase/firestore";

export default class Result extends BaseObject {
  private _comment: string;
  private _name: string;
  private _assignment: DocumentReference;
  private _class: DocumentReference;
  private _course: DocumentReference;
  private _lesson: DocumentReference;
  private _school: DocumentReference;
  private _score: number;
  private _scoreDate: Timestamp;
  private _student: DocumentReference;

  constructor(
    comment: string,
    name: string,
    dateLastModified: string,
    createdAt: string,
    assignment: DocumentReference,
    class_1: DocumentReference,
    course: DocumentReference,
    lesson: DocumentReference,
    school: DocumentReference,
    score: number,
    scoreDate: Timestamp,
    student: DocumentReference,
    docId: string,
  ) {
    super(dateLastModified, createdAt,docId);
    this._comment = comment;
    this._name = name;
    this._assignment = assignment;
    this._class = class_1;
    this._course = course;
    this._lesson = lesson;
    this._school = school;
    this._score = score;
    this._scoreDate = scoreDate;
    this._student = student;
  }

  public get comment(): string {
    return this._comment;
  }
  public set comment(value: string) {
    this._comment = value;
  }
  public get name(): string {
    return this._name;
  }
  public set name(value: string) {
    this._name = value;
  }
  public get class(): DocumentReference {
    return this._class;
  }
  public set class(value: DocumentReference) {
    this._class = value;
  }
  public get course(): DocumentReference {
    return this._course;
  }
  public set course(value: DocumentReference) {
    this._course = value;
  }
  public get lesson(): DocumentReference {
    return this._lesson;
  }
  public set lesson(value: DocumentReference) {
    this._lesson = value;
  }
  public get school(): DocumentReference {
    return this._school;
  }
  public set school(value: DocumentReference) {
    this._school = value;
  }
  public get score(): number {
    return this._score;
  }
  public set score(value: number) {
    this._score = value;
  }
  public get scoreDate(): Timestamp {
    return this._scoreDate;
  }
  public set scoreDate(value: Timestamp) {
    this._scoreDate = value;
  }
  public get student(): DocumentReference {
    return this._student;
  }
  public set student(value: DocumentReference) {
    this._student = value;
  }
  public get assignment(): DocumentReference {
    return this._assignment;
  }
  public set assignment(value: DocumentReference) {
    this._assignment = value;
  }
}
