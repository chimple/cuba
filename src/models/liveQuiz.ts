import { Timestamp } from "firebase/firestore";
import BaseObject from "./baseObject";

enum OptionOrQuestionType {
  AUDIO = "audio",
  IMAGE = "image",
  TEXT = "text",
}

type LiveQuizOption = {
  isCorrect?: boolean;
} & {
  [K in OptionOrQuestionType]?: string;
};

type LiveQuizQuestion = {
  [K in OptionOrQuestionType]?: string;
};

type LiveQuizData = {
  options: LiveQuizOption[];
  optionsType: string;
  question: LiveQuizQuestion;
  questionType: string;
};

enum LiveQuizType {
  MULTI_OPTIONS = "multiOptions",
}

export default class LiveQuiz extends BaseObject {
  private _data: LiveQuizData;
  private _type: LiveQuizType;

  constructor(
    data: LiveQuizData,
    type: LiveQuizType,
    updatedAt: Timestamp,
    createdAt: Timestamp,
    docId: string
  ) {
    super(updatedAt, createdAt, docId);
    this._data = data;
    this._type = type;
  }

  public get data(): LiveQuizData {
    return this._data;
  }

  public set data(value: LiveQuizData) {
    this._data = value;
  }

  public get type(): LiveQuizType {
    return this._type;
  }

  public set type(value: LiveQuizType) {
    this._type = value;
  }
}
