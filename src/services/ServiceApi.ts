import { Class } from "../models/class";
import { Result } from "../models/result";

export interface ServiceApi {

    getClassesForUser(userId: string): Promise<Class[]>;

    getResultsForStudentForClass(classId: string, studentId: string): Promise<Result[]>;

    isPreQuizDone(subjectCode: string, classId: string, studentId: string): Promise<boolean>;

}