export default class BaseObject {
  private _dateLastModified: string;
  private _createdAt: string;
  private _docId: string;

  constructor(dateLastModified: string, createdAt: string, docId: string) {
    this._dateLastModified = dateLastModified;
    this._createdAt = createdAt;
    this._docId = docId;
  }

  get dateLastModified(): string {
    return this._dateLastModified;
  }
  set dateLastModified(value: string) {
    this._dateLastModified = value;
  }
  public get createdAt(): string {
    return this._createdAt;
  }
  public set createdAt(value: string) {
    this._createdAt = value;
  }
  public get docId(): string {
    return this._docId;
  }
  public set docId(value: string) {
    this._docId = value;
  }
}
