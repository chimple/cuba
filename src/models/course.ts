import { Chapter } from "../common/courseConstants";
import BaseObject from "./baseObject";
import { DocumentReference, Timestamp } from "firebase/firestore";

export default class Course extends BaseObject {
  private _title: string;
  private _chapters: Chapter[];
  private _color: string;
  private _courseCode: string;
  private _curriculum: DocumentReference;
  private _grade: DocumentReference;
  private _sortIndex: number;
  private _status: string;
  private _subject: DocumentReference;
  private _thumbnail: string | undefined;
  // static courseCode: any;

  constructor({
    chapters,
    courseCode,
    color,
    curriculum,
    grade,
    sortIndex,
    status,
    subject,
    title,
    thumbnail,
    updatedAt,
    createdAt,
    docId,
  }: {
    chapters: Chapter[];
    color: string;
    courseCode: string;
    curriculum: DocumentReference;
    grade: DocumentReference;
    sortIndex: number;
    status: string;
    subject: DocumentReference;
    title: string;
    thumbnail: string | undefined;
    updatedAt: Timestamp;
    createdAt: Timestamp;
    docId: string;
  }) {
    super(updatedAt, createdAt, docId);
    this._chapters = chapters;
    this._color = color;
    this._courseCode = courseCode;
    this._curriculum = curriculum;
    this._grade = grade;
    this._sortIndex = sortIndex;
    this._status = status;
    this._subject = subject;
    this._title = title;
    this._thumbnail = thumbnail;
  }
  public get chapters(): Chapter[] {
    return this._chapters;
  }
  public set chapters(value: Chapter[]) {
    this._chapters = value;
  }
  public get color(): string {
    return this._color;
  }
  public set color(value: string) {
    this._color = value;
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
  public get sortIndex(): number {
    return this._sortIndex;
  }
  public set sortIndex(value: number) {
    this._sortIndex = value;
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
  public get thumbnail(): string | undefined {
    return this._thumbnail;
  }
  public set thumbnail(value: string | undefined) {
    this._thumbnail = value;
  }
  public static toJson(course: Course) {
    return {
      chapters: course.chapters,
      color: course.color,
      courseCode: course.courseCode,
      curriculum: course.curriculum,
      grade: course.grade,
      sortIndex: course.sortIndex,
      status: course.status,
      subject: course.subject,
      title: course.title,
      thumbnail: course.thumbnail,
    };
  }
}
