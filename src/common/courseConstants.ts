import { DocumentReference, Timestamp } from "firebase/firestore";
import Lesson from "../models/lesson";

export interface Chapter {
  id: string;
  lessons: Lesson[] | DocumentReference[];
  title: string;
  thumbnail: string;
}

export enum CollectionIds {
  ASSIGNMENT = "Assignment",
  AVATAR = "Avatar",
  BADGE = "Badge",
  CLASS = "Class",
  CONNECTION = "Connection",
  COURSE = "Course",
  CURRICULUM = "Curriculum",
  GRADE = "Grade",
  LANGUAGE = "Language",
  LESSON = "Lesson",
  SCHOOL = "School",
  SUBJECT = "Subject",
  TOPIC = "Topic",
  USER = "User",
  STUDENT_PROFILE = "StudentProfile",
  RESULT = "Result",
  REWARDS = "Rewards",
  LEADERBOARD = "Leaderboard",
  CLASS_CONNECTION = "ClassConnection",
  SCHOOL_CONNECTION = "SchoolConnection",
  LIVE_QUIZ_ROOM = "LiveQuizRoom",
  STICKER = "Sticker",
}

export interface StudentLessonResult {
  date: Timestamp;
  course: DocumentReference;
  score: number;
  timeSpent: number;
  isLoved: boolean;
}

export interface CocosLessonData {
  mlPartnerId: string | null;
  mlClassId: string | null;
  mlStudentId: string | null;
  courseId: string;
  courseName: string;
  chapterId: string;
  chapterName: string;
  lessonId: string;
  lessonName: string;
  lessonType: string;
  timeSpent: number;
  score: number | null;
  totalGames: number;
  totalMoves: number;
  correctMoves: number;
  correct: number;
  isLoved: boolean;
  wrongMoves: number;
  gameCompleted: boolean;
  quizCompleted: boolean;
  isQuizAnsweredCorrectly: boolean;
  lessonSessionId: string;
  gameTimeSpent: number | null;
  quizTimeSpent: number | null;
  gameScore: number | null;
  quizScore: number | null;
  gameName: string | null;
  currentGameNumber: number | null;
  lessonStartTime: number;
}

export const ASSIGNMENT_COMPLETED_IDS = "assignmentCompletedIds";
