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
  STUDENTPROFILE = "StudentProfile",
  RESULT = "Result",
  LEADERBOARD = "Leaderboard",
}

export interface StudentLessonResult {
  date: Timestamp;
  course: DocumentReference;
  score: number;
  timeSpent: number;
}

export interface lessonEndData {
  chapterName: string;
  chapterId: string;
  lessonName: string;
  lessonId: string;
  courseName: string;
  score: number;
  timeSpent: number;
  totalGames: number;
  wrongMoves: number;
  correctMoves: number;
  correct: number;
}

export const ASSIGNMENT_COMPLETED_IDS = "assignmentCompletedIds";
