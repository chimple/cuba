import BaseObject from "./baseObject";
import { DocumentReference } from "firebase/firestore";

export default class Topic extends BaseObject {
  private _description: string;
  private _title: string;
  private _subject: DocumentReference;

  constructor(
    description: string,
    title: string,
    subject: DocumentReference,
    dateLastModified: string,
    createdAt: string,
    docId: string
  ) {
    super(dateLastModified, createdAt, docId);
    this._description = description;
    this._title = title;
    this._subject = subject;
  }

  public get description(): string {
    return this._description;
  }
  public set description(value: string) {
    this._description = value;
  }
  public get title(): string {
    return this._title;
  }
  public set title(value: string) {
    this._title = value;
  }
  public get subject(): DocumentReference {
    return this._subject;
  }
  public set subject(value: DocumentReference) {
    this._subject = value;
  }
}
