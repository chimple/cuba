import { Class } from "../models/class";
import { LineItem } from "../models/lineItem";
import { Result } from "../models/result";
import { User } from "../models/user";

export interface ServiceApi {

    getClassesForUser(userId: string): Promise<Class[]>;

    getResultsForStudentForClass(classId: string, studentId: string): Promise<Result[]>;

    isPreQuizDone(subjectCode: string, classId: string, studentId: string): Promise<boolean>;

    getLineItemForClassForLessonId(classId: string, LessonId: string): Promise<LineItem | undefined>;

    putLineItem(classId: string, lessonId: string): Promise<LineItem>;

    putResult(userId: string, classId: string, LessonId: string, score: number, subjectCode: string): Promise<Result | undefined>;

    getUser(userId: string): Promise<User | undefined>
}