import { Timestamp } from "firebase/firestore";
import BaseObject from "./baseObject";

export const LIVE_QUIZ_QUESTION_TIME = 30;

export enum OptionOrQuestionType {
  AUDIO = "audio",
  IMAGE = "image",
  TEXT = "text",
}

export type LiveQuizOption = {
  isCorrect?: boolean;
  isTextTTS?: boolean;
} & {
  [K in OptionOrQuestionType]?: string;
};

export type LiveQuizQuestion = {
  id: string;
  isTextTTS?: boolean;
} & {
  [K in OptionOrQuestionType]?: string;
};

export type LiveQuizData = {
  options: LiveQuizOption[];
  optionsType: string;
  question: LiveQuizQuestion;
  questionType: string;
};

export enum LiveQuizType {
  MULTI_OPTIONS = "multiOptions",
}

export default class LiveQuiz extends BaseObject {
  private _data: LiveQuizData[];
  private _type: LiveQuizType;

  constructor(
    data: LiveQuizData[],
    type: LiveQuizType,
    updatedAt: Timestamp,
    createdAt: Timestamp,
    docId: string
  ) {
    super(updatedAt, createdAt, docId);
    this._data = data;
    this._type = type;
  }

  public get data(): LiveQuizData[] {
    return this._data;
  }

  public set data(value: LiveQuizData[]) {
    this._data = value;
  }

  public get type(): LiveQuizType {
    return this._type;
  }

  public set type(value: LiveQuizType) {
    this._type = value;
  }
}
