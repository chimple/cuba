import BaseObject from "./baseObject";
import { DocumentReference, Timestamp } from "firebase/firestore";

export default class Result extends BaseObject {
  private _comment: string | undefined;
  private _assignment: DocumentReference | undefined;
  private _class: DocumentReference | undefined;
  private _course: DocumentReference | undefined;
  private _lesson: DocumentReference;
  private _school: DocumentReference | undefined;
  private _score: number;
  private _student: DocumentReference;
  private _correctMoves: number;
  private _wrongMoves: number;
  private _timeSpent: number;

  constructor(
    comment: string | undefined,
    updatedAt: Timestamp,
    createdAt: Timestamp,
    assignment: DocumentReference | undefined,
    class_1: DocumentReference | undefined,
    course: DocumentReference | undefined,
    lesson: DocumentReference,
    school: DocumentReference | undefined,
    score: number,
    correctMoves: number,
    wrongMoves: number,
    timeSpent: number,
    student: DocumentReference,
    docId: string
  ) {
    super(updatedAt, createdAt, docId);
    this._comment = comment;
    this._assignment = assignment;
    this._class = class_1;
    this._course = course;
    this._lesson = lesson;
    this._school = school;
    this._score = score;
    this._student = student;
    this._correctMoves = correctMoves;
    this._wrongMoves = wrongMoves;
    this._timeSpent = timeSpent;
  }

  public get comment(): string | undefined {
    return this._comment;
  }
  public set comment(value: string | undefined) {
    this._comment = value;
  }
  public get class(): DocumentReference | undefined {
    return this._class;
  }
  public set class(value: DocumentReference | undefined) {
    this._class = value;
  }
  public get course(): DocumentReference | undefined {
    return this._course;
  }
  public set course(value: DocumentReference | undefined) {
    this._course = value;
  }
  public get lesson(): DocumentReference {
    return this._lesson;
  }
  public set lesson(value: DocumentReference) {
    this._lesson = value;
  }
  public get school(): DocumentReference | undefined {
    return this._school;
  }
  public set school(value: DocumentReference | undefined) {
    this._school = value;
  }
  public get score(): number {
    return this._score;
  }
  public set score(value: number) {
    this._score = value;
  }
  public get student(): DocumentReference {
    return this._student;
  }
  public set student(value: DocumentReference) {
    this._student = value;
  }
  public get assignment(): DocumentReference | undefined {
    return this._assignment;
  }
  public set assignment(value: DocumentReference | undefined) {
    this._assignment = value;
  }
  public get correctMoves(): number {
    return this._correctMoves;
  }
  public set correctMoves(value: number) {
    this._correctMoves = value;
  }
  public get wrongMoves(): number {
    return this._wrongMoves;
  }
  public set wrongMoves(value: number) {
    this._wrongMoves = value;
  }
  public get timeSpent(): number {
    return this._timeSpent;
  }
  public set timeSpent(value: number) {
    this._timeSpent = value;
  }

  public toJson() {
    return {
      comment: this.comment ?? null,
      class: this.class ?? null,
      course: this.course ?? null,
      lesson: this.lesson,
      school: this.school ?? null,
      score: this.score,
      student: this.student,
      assignment: this.assignment ?? null,
      correctMoves: this.correctMoves,
      wrongMoves: this.wrongMoves,
      timeSpent: this.timeSpent,
      updatedAt: this.updatedAt,
      createdAt: this.createdAt,
    };
  }
}
