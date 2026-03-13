import { Timestamp } from "firebase/firestore";
import BaseObject from "./baseObject";

export default class Language extends BaseObject {
  private _code: string;
  private _title: string;

  constructor(
    code: string,
    title: string,
    updatedAt: Timestamp,
    createdAt: Timestamp,
    docId: string
  ) {
    super(updatedAt, createdAt, docId);
    this._code = code;
    this._title = title;
  }

  public get code(): string {
    return this._code;
  }
  public set code(value: string) {
    this._code = value;
  }
  public get title(): string {
    return this._title;
  }
  public set title(value: string) {
    this._title = value;
  }
}
