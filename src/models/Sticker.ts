import { Timestamp } from "firebase/firestore";
import BaseObject from "./baseObject";

export default class Sticker extends BaseObject {
  private _name: string;
  private _description?: string;
  private _image: string;

  constructor({
    name,
    description,
    image,
    updatedAt,
    createdAt,
    docId,
  }: {
    name: string;
    description?: string;
    image: string;
    updatedAt: Timestamp;
    createdAt: Timestamp;
    docId: string;
  }) {
    super(updatedAt, createdAt, docId);
    this._name = name;
    this._description = description;
    this._image = image;
  }

  public get name(): string {
    return this._name;
  }

  public set name(value: string) {
    this._name = value;
  }

  public get description(): string | undefined {
    return this._description;
  }

  public set description(value: string | undefined) {
    this._description = value;
  }

  public get image(): string {
    return this._image;
  }

  public set image(value: string) {
    this._image = value;
  }
}
