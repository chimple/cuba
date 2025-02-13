import { Timestamp } from "firebase/firestore";
import BaseObject from "./baseObject";

export default class LearningUnitService extends BaseObject {
  private _activityId?: string = 'https://example.org/topic/learningUnit1/';

  constructor(
    activityId: string,
    updatedAt: Timestamp,
    createdAt: Timestamp,
    docId: string
  ) {
    super(updatedAt, createdAt, docId);
    this._activityId = activityId;
  }

  public get activityId(): string | undefined {
    return this._activityId;
  }
  public set activityId(value: string) {
    this._activityId = value;
  }

}
