import { Class } from "../models/class";

export interface ServiceApi {

    getClassesForUser(userId: string): Promise<Class[]>;
}