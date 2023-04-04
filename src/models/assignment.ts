import BaseObject from "./baseObject";
import { DocumentReference, Timestamp } from "firebase/firestore";

export default class Assignment extends BaseObject {
  private _assigner: DocumentReference;
  private _class: DocumentReference;
  private _completedStudent: string[];
  private _description: string;
  private _dueDate: Timestamp;
  private _lesson: DocumentReference;
  private _resultValueMax: number;
  private _resultValueMin: number;
  private _results: object;
  private _school: DocumentReference;

  constructor(
    assigner: DocumentReference,
    class_1: DocumentReference,
    completedStudent: string[],
    description: string,
    dueDate: Timestamp,
    lesson: DocumentReference,
    resultValueMax: number,
    resultValueMin: number,
    results: object,
    school: DocumentReference,
    dateLastModified: string,
    createdAt: string,
    docId: string
  ) {
    super(dateLastModified, createdAt, docId);
    this._assigner = assigner;
    this._class = class_1;
    this._completedStudent = completedStudent;
    this._description = description;
    this._dueDate = dueDate;
    this._lesson = lesson;
    this._resultValueMax = resultValueMax;
    this._resultValueMin = resultValueMin;
    this._results = results;
    this._school = school;
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
  public get completedStudent(): string[] {
    return this._completedStudent;
  }
  public set completedStudent(value: string[]) {
    this._completedStudent = value;
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
}
