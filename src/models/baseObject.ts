import { Timestamp } from "firebase/firestore";

export default class BaseObject {
  private _dateLastModified: Timestamp;
  private _createdAt: Timestamp;
  private _docId: string;

  constructor(
    dateLastModified: Timestamp,
    createdAt: Timestamp,
    docId: string
  ) {
    this._dateLastModified = dateLastModified;
    this._createdAt = createdAt;
    this._docId = docId;
  }

  get dateLastModified(): Timestamp {
    return this._dateLastModified;
  }
  set dateLastModified(value: Timestamp) {
    this._dateLastModified = value;
  }
  public get createdAt(): Timestamp {
    return this._createdAt;
  }
  public set createdAt(value: Timestamp) {
    this._createdAt = value;
  }
  public get docId(): string {
    return this._docId;
  }
  public set docId(value: string) {
    this._docId = value;
  }
}
