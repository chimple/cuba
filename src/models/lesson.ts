import { Timestamp } from "firebase/firestore";
import BaseObject from "./baseObject";
import { DocumentReference } from "firebase/firestore";

export default class Lesson extends BaseObject {
  private _title: string;
  private _clonedFrom: DocumentReference;
  private _createdBy: DocumentReference;
  private _id: string;
  private _language: string;
  private _outcome: string;
  private _pluginType: string;
  private _status: string;
  private _subject: DocumentReference;
  private _targetFrom: number;
  private _targetTo: number;
  private _thumbnail: string;
  private _topic: DocumentReference;
  private _type: string;

  constructor(
    clonedFrom: DocumentReference,
    createdBy: DocumentReference,
    id: string,
    language: string,
    outcome: string,
    pluginType: string,
    status: string,
    subject: DocumentReference,
    targetFrom: number,
    targetTo: number,
    thumbnail: string,
    topic: DocumentReference,
    type: string,
    title: string,
    dateLastModified: Timestamp,
    createdAt: Timestamp,
    docId: string
  ) {
    super(dateLastModified, createdAt, docId);
    this._clonedFrom = clonedFrom;
    this._createdBy = createdBy;
    this._id = id;
    this._language = language;
    this._outcome = outcome;
    this._pluginType = pluginType;
    this._status = status;
    this._subject = subject;
    this._targetFrom = targetFrom;
    this._targetTo = targetTo;
    this._thumbnail = thumbnail;
    this._topic = topic;
    this._type = type;
    this._title = title;
  }

  public get title(): string {
    return this._title;
  }
  public set title(value: string) {
    this._title = value;
  }
  public get clonedFrom(): DocumentReference {
    return this._clonedFrom;
  }
  public set clonedFrom(value: DocumentReference) {
    this._clonedFrom = value;
  }
  public get createdBy(): DocumentReference {
    return this._createdBy;
  }
  public set createdBy(value: DocumentReference) {
    this._createdBy = value;
  }
  public get id(): string {
    return this._id;
  }
  public set id(value: string) {
    this._id = value;
  }
  public get language(): string {
    return this._language;
  }
  public set language(value: string) {
    this._language = value;
  }
  public get outcome(): string {
    return this._outcome;
  }
  public set outcome(value: string) {
    this._outcome = value;
  }
  public get pluginType(): string {
    return this._pluginType;
  }
  public set pluginType(value: string) {
    this._pluginType = value;
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
  public get targetFrom(): number {
    return this._targetFrom;
  }
  public set targetFrom(value: number) {
    this._targetFrom = value;
  }
  public get targetTo(): number {
    return this._targetTo;
  }
  public set targetTo(value: number) {
    this._targetTo = value;
  }
  public get thumbnail(): string {
    return this._thumbnail;
  }
  public set thumbnail(value: string) {
    this._thumbnail = value;
  }
  public get topic(): DocumentReference {
    return this._topic;
  }
  public set topic(value: DocumentReference) {
    this._topic = value;
  }
  public get type(): string {
    return this._type;
  }
  public set type(value: string) {
    this._type = value;
  }
}
