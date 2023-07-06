import { Timestamp } from "firebase/firestore";
import BaseObject from "./baseObject";

export default class Grade extends BaseObject {
  private _description: string;
  private _title: string;

  constructor(
    description: string,
    title: string,
    dateLastModified: Timestamp,
    createdAt: Timestamp,
    docId: string
  ) {
    super(dateLastModified, createdAt, docId);
    this._description = description;
    this._title = title;
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
}
