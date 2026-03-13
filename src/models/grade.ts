import { Timestamp } from "firebase/firestore";
import BaseObject from "./baseObject";

export default class Grade extends BaseObject {
  private _description: string;
  private _title: string;
  private _sortIndex: number;

  constructor(
    description: string,
    title: string,
    sortIndex: number,
    updatedAt: Timestamp,
    createdAt: Timestamp,
    docId: string
  ) {
    super(updatedAt, createdAt, docId);
    this._description = description;
    this._title = title;
    this._sortIndex = sortIndex;
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
  public get sortIndex(): number {
    return this._sortIndex;
  }
  public set sortIndex(value: number) {
    this._sortIndex = value;
  }
}
