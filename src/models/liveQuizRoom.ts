import { DocumentReference, Timestamp } from "firebase/firestore";
import BaseObject from "./baseObject";

interface LiveQuizRoomSchema {
  assignment: DocumentReference;
  class: DocumentReference;
  lesson: DocumentReference;
  course: DocumentReference;
  participants: string[];
  school: DocumentReference;
  startsAt: Timestamp;
  results: LiveQuizResults;
}

interface LiveQuizResult {
  score: number;
  timeSpent: number;
  id: string;
}

interface LiveQuizResults {
  [studentId: string]: LiveQuizResult[];
}

export default class LiveQuizRoomObject extends BaseObject {
  private _assignment: DocumentReference;
  private _class: DocumentReference;
  private _lesson: DocumentReference;
  private _course: DocumentReference;
  private _participants: string[];
  private _school: DocumentReference;
  private _startsAt: Timestamp;
  private _results: LiveQuizResults;

  constructor(
    data: LiveQuizRoomSchema,
    updatedAt: Timestamp,
    createdAt: Timestamp,
    docId: string
  ) {
    super(updatedAt, createdAt, docId);
    this._assignment = data.assignment;
    this._class = data.class;
    this._lesson = data.lesson;
    this._participants = data.participants;
    this._school = data.school;
    this._startsAt = data.startsAt;
    this._results = data.results;
  }

  public get assignment(): DocumentReference {
    return this._assignment;
  }

  public set assignment(value: DocumentReference) {
    this._assignment = value;
  }

  public get class(): DocumentReference {
    return this._class;
  }

  public set class(value: DocumentReference) {
    this._class = value;
  }

  public get lesson(): DocumentReference {
    return this._lesson;
  }

  public set lesson(value: DocumentReference) {
    this._lesson = value;
  }

  public get course(): DocumentReference {
    return this._course;
  }

  public set course(value: DocumentReference) {
    this._course = value;
  } 

  public get participants(): string[] {
    return this._participants;
  }

  public set participants(value: string[]) {
    this._participants = value;
  }

  public get school(): DocumentReference {
    return this._school;
  }

  public set school(value: DocumentReference) {
    this._school = value;
  }

  public get startsAt(): Timestamp {
    return this._startsAt;
  }

  public set startsAt(value: Timestamp) {
    this._startsAt = value;
  }

  public get results(): LiveQuizResults {
    return this._results;
  }

  public set results(value: LiveQuizResults) {
    this._results = value;
  }
}
