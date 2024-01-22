import BaseObject from "./baseObject";
import { DocumentReference, Timestamp } from "firebase/firestore";

export default class Assignment extends BaseObject {
  private _assigner: DocumentReference;
  private _class: DocumentReference;
  private _completedStudents: string[];
  private _description: string;
  private _dueDate: Timestamp;
  private _lesson: DocumentReference;
  private _resultValueMax: number;
  private _resultValueMin: number;
  private _results: object;
  private _school: DocumentReference;
  private _course: DocumentReference;
  private _type: string;
  private _startsAt: Timestamp;
  private _endsAt: Timestamp;

  constructor(
    assigner: DocumentReference,
    class_1: DocumentReference,
    course: DocumentReference,
    completedStudents: string[],
    description: string,
    dueDate: Timestamp,
    lesson: DocumentReference,
    resultValueMax: number,
    resultValueMin: number,
    results: object,
    school: DocumentReference,
    updatedAt: Timestamp,
    createdAt: Timestamp,
    docId: string,
    type: string,
    startsAt: Timestamp,
    endsAt: Timestamp
  ) {
    super(updatedAt, createdAt, docId);
    this._assigner = assigner;
    this._class = class_1;
    this._completedStudents = completedStudents;
    this._description = description;
    this._dueDate = dueDate;
    this._lesson = lesson;
    this._resultValueMax = resultValueMax;
    this._resultValueMin = resultValueMin;
    this._results = results;
    this._school = school;
    this._course = course;
    this._type = type;
    this._startsAt = startsAt;
    this._endsAt = endsAt;
  }

  public get assigner(): DocumentReference {
    return this._assigner;
  }
  public set assigner(value: DocumentReference) {
    this._assigner = value;
  }
  public get class(): DocumentReference {
    return this._class;
  }
  public set class(value: DocumentReference) {
    this._class = value;
  }
  public get completedStudents(): string[] {
    return this._completedStudents;
  }
  public set completedStudents(value: string[]) {
    this._completedStudents = value;
  }
  public get description(): string {
    return this._description;
  }
  public set description(value: string) {
    this._description = value;
  }
  public get dueDate(): Timestamp {
    return this._dueDate;
  }
  public set dueDate(value: Timestamp) {
    this._dueDate = value;
  }
  public get lesson(): DocumentReference {
    return this._lesson;
  }
  public set lesson(value: DocumentReference) {
    this._lesson = value;
  }
  public get resultValueMax(): number {
    return this._resultValueMax;
  }
  public set resultValueMax(value: number) {
    this._resultValueMax = value;
  }
  public get resultValueMin(): number {
    return this._resultValueMin;
  }
  public set resultValueMin(value: number) {
    this._resultValueMin = value;
  }
  public get results(): object {
    return this._results;
  }
  public set results(value: object) {
    this._results = value;
  }
  public get school(): DocumentReference {
    return this._school;
  }
  public set school(value: DocumentReference) {
    this._school = value;
  }
  public get course(): DocumentReference {
    return this._course;
  }
  public set course(value: DocumentReference) {
    this._course = value;
  }
  public get type(): string {
    return this._type;
  }
  public set type(value: string) {
    this._type = value;
  }
  public get startsAt(): Timestamp {
    return this._startsAt;
  }
  public set startsAt(value: Timestamp) {
    this._startsAt = value;
  }
  public get endsAt(): Timestamp {
    return this._endsAt;
  }
  public set endsAt(value: Timestamp) {
    this._endsAt = value;
  }
}
