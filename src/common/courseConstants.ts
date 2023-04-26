import { DocumentReference, Timestamp } from "firebase/firestore";
import Lesson from "../models/lesson";

export interface Chapter {
  id: string;
  lessons: Lesson[] | DocumentReference[];
  title: string;
  thumbnail: string;
}

export enum CollectionIds {
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
}
