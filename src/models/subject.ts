import { Timestamp } from "firebase/firestore";
import BaseObject from "./baseObject";

export default class Subject extends BaseObject {
  private _description: string;
  private _title: string;
  private _id: string;
  constructor(
    description: string,
    title: string,
    id: string,
    updatedAt: Timestamp,
    createdAt: Timestamp,
    docId: string
  ) {
    super(updatedAt, createdAt, docId);
    this._description = description;
    this._title = title;
    this._id = id;
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
  public get id(): string {
    return this._id;
  }
  public set id(value: string) {
    this._id = value;
  }
}
