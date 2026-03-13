import { Timestamp } from "firebase/firestore";

export default class BaseObject {
  private _updatedAt: Timestamp;
  private _createdAt: Timestamp;
  private _docId: string;

  constructor(
    updatedAt: Timestamp,
    createdAt: Timestamp,
    docId: string
  ) {
    this._updatedAt = updatedAt;
    this._createdAt = createdAt;
    this._docId = docId;
  }

  get updatedAt(): Timestamp {
    return this._updatedAt;
  }
  set updatedAt(value: Timestamp) {
    this._updatedAt = value;
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
