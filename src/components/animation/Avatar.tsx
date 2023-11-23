import { CURRENT_AVATAR_SUGGESTION_NO } from "../../common/constants";
import { Chapter } from "../../common/courseConstants";
import Course from "../../models/course";
import Lesson from "../../models/lesson";

export enum AvatarModes {
  Welcome,
  CourseSuggestion,
  RecommendedLesson,
  ChapterSuggestion,
  LessonSuggestion,
  TwoOptionQuestion,
  FourOptionQuestion,
  ShowDailyProgress,
  // scores >= 70
  GoodProgress,

  // scores < 70
  BadProgress,
}

export class AvatarObj {
  public static i: AvatarObj;
  private _mode: any;
  private _message: string | undefined;
  private _imageSrc: string | undefined;
  private _audioSrc: string | undefined;
  private _avatarAnimation: string | undefined;
  private _yesAnimation: string | undefined;
  private _noAnimation: string | undefined;
  private _questionType: string | undefined; //"answered/unanswered",
  private _answer: string | undefined;
  private _option1: string | undefined;
  private _option2: string | undefined;
  private _option3: string | undefined;
  private _option4: string | undefined;
  private _nextMode: string;
  private _currentSuggestionNumber: number;
  private _allSuggestions: [];
  static _i: AvatarObj;

  currentCourse: Course;
  currentChapter: Chapter;
  currentLesson: Lesson | undefined;
  currentRecommededLessonIndex: number;

  private constructor() {}

  public static getInstance(): AvatarObj {
    if (!this._i) {
      this._i = new AvatarObj();
    }
    return this._i;
  }

  public get mode(): any {
    return this._mode;
  }
  public set mode(value: any) {
    this._mode = value;
  }

  public get message(): string | undefined {
    return this._message;
  }
  public set message(value: string | undefined) {
    this._message = value;
  }
  public get imageSrc(): string | undefined {
    return this._imageSrc;
  }
  public set imageSrc(value: string | undefined) {
    this._imageSrc = value;
  }
  public get audioSrc(): string | undefined {
    return this._audioSrc;
  }
  public set audioSrc(value: string | undefined) {
    this._avatarAnimation = value;
  }
  public get avatarAnimation(): string | undefined {
    return this._avatarAnimation;
  }
  public set avatarAnimation(value: string | undefined) {
    this._avatarAnimation = value;
  }
  public get yesAnimation(): string | undefined {
    return this._yesAnimation;
  }
  public set yesAnimation(value: string | undefined) {
    this._yesAnimation = value;
  }
  public get noAnimation(): string | undefined {
    return this._noAnimation;
  }
  public set noAnimation(value: string | undefined) {
    this._noAnimation = value;
  }
  public get nextMode(): string {
    return this._nextMode;
  }
  public set nextMode(value: string) {
    this._nextMode = value;
  }
  public get questionType(): string | undefined {
    return this._questionType;
  }
  public set questionType(value: string | undefined) {
    this._questionType = value;
  }
  public get answer(): string | undefined {
    return this._answer;
  }
  public set answer(value: string | undefined) {
    this._answer = value;
  }
  public get option1(): string | undefined {
    return this._option1;
  }
  public set option1(value: string | undefined) {
    this._option1 = value;
  }
  public get option2(): string | undefined {
    return this._option2;
  }
  public set option2(value: string | undefined) {
    this._option2 = value;
  }
  public get option3(): string | undefined {
    return this._option3;
  }
  public set option3(value: string | undefined) {
    this._option3 = value;
  }
  public get option4(): string | undefined {
    return this._option4;
  }
  public set option4(value: string | undefined) {
    this._option4 = value;
  }
  public get currentSuggestionNumber(): number {
    return this._currentSuggestionNumber;
  }
  public set currentSuggestionNumber(value: number) {
    this._currentSuggestionNumber = value;
  }

  public get allSuggestions(): [] {
    return this._allSuggestions;
  }
  public set allSuggestions(value: []) {
    this._allSuggestions = value;
  }

  public async loadAvatarData() {
    if (!this._allSuggestions) {
      if (!this._currentSuggestionNumber) {
        this._currentSuggestionNumber = 0;
      }

      let response = await fetch(
        "https://mocki.io/v1/1ac6cd7e-a40c-47dd-9afc-f05e0941071a"
      );

      // let response =
      //   await require("json!public\\assets\\animation\\avatarSugguestions.json");

      let suggesstionJson = await response.json();
      console.log("Avatar Sugguestion Json ", suggesstionJson);

      this._allSuggestions = suggesstionJson.rows;
    }

    const currentAvatarSuggestionNoFromLocal =
      Number(localStorage.getItem(CURRENT_AVATAR_SUGGESTION_NO)) ||
      this._currentSuggestionNumber;

    let currentSuggestionInJson =
      this._allSuggestions[currentAvatarSuggestionNoFromLocal];
    this._mode = AvatarModes[currentSuggestionInJson[0]];
    this._message = currentSuggestionInJson[1];
    this._imageSrc = currentSuggestionInJson[2];
    this._audioSrc = currentSuggestionInJson[3];
    this._avatarAnimation = currentSuggestionInJson[4];
    this._yesAnimation = currentSuggestionInJson[5];
    this._noAnimation = currentSuggestionInJson[6];
    this._questionType = currentSuggestionInJson[7];
    this._answer = currentSuggestionInJson[8];
    this._option1 = currentSuggestionInJson[9];
    this._option2 = currentSuggestionInJson[10];
    this._option3 = currentSuggestionInJson[11];
    this._option4 = currentSuggestionInJson[12];
    // this._nextMode = currentSuggestionInJson[13];

    console.log(" AvatarObj in Avatar page ", AvatarObj.getInstance());
  }

  public async loadAvatarDataOnIndex() {
    console.log(
      "if (this.currentSuggestionNumber === this.allSuggestions.length) {",
      this._currentSuggestionNumber === this._allSuggestions.length - 1
    );

    if (this._currentSuggestionNumber === this._allSuggestions.length - 1) {
      this._currentSuggestionNumber = 0;
      console.log(
        "resetting the Avatar Suggestions",
        this._currentSuggestionNumber
      );
    } else {
      this.currentSuggestionNumber++;
      console.log(
        "Avatar Suggestions incremented",
        this._currentSuggestionNumber
      );
    }
    let currentSuggestionInJson =
      this._allSuggestions[this._currentSuggestionNumber];
    this._mode = AvatarModes[currentSuggestionInJson[0]];
    this._message = currentSuggestionInJson[1];
    this._imageSrc = currentSuggestionInJson[2];
    this._audioSrc = currentSuggestionInJson[3];
    this._avatarAnimation = currentSuggestionInJson[4];
    this._yesAnimation = currentSuggestionInJson[5];
    this._noAnimation = currentSuggestionInJson[6];
    this._questionType = currentSuggestionInJson[7];
    this._answer = currentSuggestionInJson[8];
    this._option1 = currentSuggestionInJson[9];
    this._option2 = currentSuggestionInJson[10];
    this._option3 = currentSuggestionInJson[11];
    this._option4 = currentSuggestionInJson[12];
    // this._nextMode = currentSuggestionInJson[13];

    console.log(
      " AvatarObj in Avatar page loadAvatarDataOnIndex( ",
      AvatarObj.getInstance()
    );
  }
}
