import {
  GUIDRef,
  OneRosterStatus,
  ScoreStatusEnum,
} from "../interface/modelInterfaces";
import { Util } from "../utility/util";
import { BaseObject } from "./baseObject";

export class Result extends BaseObject {
  private _lineItem: GUIDRef;
  private _student: GUIDRef;
  private _class: GUIDRef;
  // private _scoreScale: GUIDRef;
  private _scoreStatus: ScoreStatusEnum;
  private _score: number;
  // private _textScore: string;
  private _scoreDate: string;
  private _comment: string;
  // private _learningObjectiveSet: LearningObjective[];

  public get lineItem(): GUIDRef {
    return this._lineItem;
  }
  public set lineItem(value: GUIDRef) {
    this._lineItem = value;
  }
  public get student(): GUIDRef {
    return this._student;
  }
  public set student(value: GUIDRef) {
    this._student = value;
  }
  public get class(): GUIDRef {
    return this._class;
  }
  public set class(value: GUIDRef) {
    this._class = value;
  }
  // public get scoreScale(): GUIDRef {
  //     return this._scoreScale;
  // }
  // public set scoreScale(value: GUIDRef) {
  //     this._scoreScale = value;
  // }
  public get scoreStatus(): ScoreStatusEnum {
    return this._scoreStatus;
  }
  public set scoreStatus(value: ScoreStatusEnum) {
    this._scoreStatus = value;
  }
  public get score(): number {
    return this._score;
  }
  public set score(value: number) {
    this._score = value;
  }
  // public get textScore(): string {
  //     return this._textScore;
  // }
  // public set textScore(value: string) {
  //     this._textScore = value;
  // }
  public get scoreDate(): string {
    return this._scoreDate;
  }
  public set scoreDate(value: string) {
    this._scoreDate = value;
  }
  public get comment(): string {
    return this._comment;
  }
  public set comment(value: string) {
    this._comment = value;
  }
  // public get learningObjectiveSet(): LearningObjective[] {
  //     return this._learningObjectiveSet;
  // }
  // public set learningObjectiveSet(value: LearningObjective[]) {
  //     this._learningObjectiveSet = value;
  // }

  constructor(
    lineItem: GUIDRef,
    student: GUIDRef,
    class_1: GUIDRef,
    // scoreScale: GUIDRef,
    scoreStatus: ScoreStatusEnum,
    score: number,
    // textScore: string,
    scoreDate: string,
    comment: string,
    // learningObjectiveSet: LearningObjective[],
    sourcedId: string,
    status: OneRosterStatus,
    dateLastModified: string,
    metaData: any
  ) {
    super(sourcedId, status, dateLastModified, metaData);
    this._lineItem = lineItem;
    this._student = student;
    this._class = class_1;
    // this._scoreScale = scoreScale;
    this._scoreStatus = scoreStatus;
    this._score = score;
    // this._textScore = textScore;
    this._scoreDate = scoreDate;
    this._comment = comment;
    // this._learningObjectiveSet = learningObjectiveSet;
  }

  static fromJson(jsonObj: any): Result {
    // const status: OneRosterStatus = (OneRosterStatus[jsonObj?.status] as unknown as OneRosterStatus) ?? OneRosterStatus.active;
    // const learningObjectiveSet: LearningObjective[] = [];
    // for (let i of jsonObj.learningObjectiveSet) {
    //     const learningObjectiveResults: LearningObjectiveResult[] = []
    //     for (let j of i.learningObjectiveResults) {
    //         learningObjectiveResults.push({
    //             learningObjectiveId: j.learningObjectiveId,
    //             score: j.score,
    //             textScore: j.textScore
    //         })
    //     }
    //     const learningObjective: LearningObjective = { source: i.source, learningObjectiveResults: learningObjectiveResults }
    //     learningObjectiveSet.push(learningObjective)
    // }
    let metaData = jsonObj.metaData;
    if (metaData && typeof metaData === "string") {
      metaData = JSON.parse(metaData);
    }
    const newResult = new Result(
      Util.getGUIDRef(jsonObj?.lineItem),
      Util.getGUIDRef(jsonObj?.student),
      Util.getGUIDRef(jsonObj?.class),
      // Util.getGUIDRef(jsonObj?.scoreScale),
      ScoreStatusEnum[jsonObj?.scoreStatus] ?? ScoreStatusEnum.SUBMITTED,
      jsonObj.score,
      // jsonObj.textScore,
      jsonObj.scoreDate,
      jsonObj.comment,
      // learningObjectiveSet,
      jsonObj.sourcedId,
      OneRosterStatus[jsonObj?.status] ?? OneRosterStatus.ACTIVE,
      jsonObj.dateLastModified,
      metaData
    );
    return newResult;
  }

  toJson() {
    return {
      sourcedId: this.sourcedId,
      status: this.status,
      dateLastModified: this.dateLastModified,
      //TODO converting metaData to string to match mike schema
      metaData: JSON.stringify(this.metaData),
      lineItem: this.lineItem,
      student: this.student,
      class: this.class,
      scoreStatus: this.scoreStatus,
      score: this.score,
      // textScore: this.textScore,
      scoreDate: this.scoreDate,
      comment: this.comment,
    };
  }
}
