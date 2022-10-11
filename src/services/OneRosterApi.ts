import { Http, HttpHeaders } from "@capacitor-community/http";
import { COURSES, PRE_QUIZ, TEMP_LESSONS_STORE } from "../common/constants";
import { Lesson } from "../interface/curriculumInterfaces";
import { OneRosterStatus, ScoreStatusEnum } from "../interface/modelInterfaces";
import { Class } from "../models/class";
import { LineItem } from "../models/lineItem";
import { Result } from "../models/result";
import { ServiceApi } from "./ServiceApi";
import { v4 as uuidv4 } from 'uuid';


export class OneRosterApi implements ServiceApi {
    public static i: OneRosterApi;
    private preQuizMap: any = {}
    private classes: { [key: string]: Class[] } = {}
    private constructor() {
    }

    public static getInstance(): OneRosterApi {
        if (!OneRosterApi.i) {
            OneRosterApi.i = new OneRosterApi();
        }
        return OneRosterApi.i;
    }

    getHeaders(): HttpHeaders {
        return { Authorization: "Bearer 2YotnFZFEjr1zCsicMWpAA" }
    }

    async getClassesForUser(userId: string): Promise<Class[]> {
        try {
            const response = await Http.get({ url: "https://mocki.io/v1/eed2eaa3-cd47-4f13-a3c4-524de936d132", headers: this.getHeaders() }).catch((e) => { console.log("error on getResultsForStudentForClass", e) });
            const result = (response && response.status === 200) ? response.data : {};
            // const req=await Http.get({url:`http://users/${userId}/classes`})
            // await new Promise(r => setTimeout(r, 1000));
            const classes: Class[] = []
            if (result.classes) {
                for (let i of result.classes) {
                    classes.push(Class.fromJson(i))
                }
            }
            return classes;
        } catch (error) {
            return [];
        }
    }

    async getResultsForStudentForClass(classId: string, studentId: string): Promise<Result[]> {
        try {
            const response = await Http.get({ url: "https://mocki.io/v1/45b03112-954a-438c-a91f-f963e563850a", headers: this.getHeaders() }).catch((e) => { console.log("error on getResultsForStudentForClass", e) });
            const data = (response && response.status === 200) ? response.data : {};
            const addTempResult = (lessonId: string, score: number) => {
                const result = {
                    "sourcedId": "..String..",
                    "status": "active",
                    "dateLastModified": "..Date/Time..",
                    "metadata": {
                        "lessonId": lessonId
                    },
                    "lineItem": {
                        "href": "..URI..",
                        "sourcedId": "..String..",
                        "type": "lineItem"
                    },
                    "student": {
                        "href": "..URI..",
                        "sourcedId": "..String..",
                        "type": "user"
                    },
                    "class": {
                        "href": "..URI..",
                        "sourcedId": "..String..",
                        "type": "class"
                    },
                    "scoreScale": {
                        "href": "..URI..",
                        "sourcedId": "..String..",
                        "type": "scoreScale"
                    },
                    "scoreStatus": "submitted",
                    "score": score,
                    "textScore": "..NormalizedString..",
                    "scoreDate": "..String(Date)..",
                    "comment": "..String..",
                    "learningObjectiveSet": [
                        {
                            "source": "..select from Union..",
                            "learningObjectiveResults": [
                                {
                                    "learningObjectiveId": "..NormalizedString..",
                                    "score": 20,
                                    "textScore": "..NormalizedString.."
                                },

                            ]
                        },

                    ]
                };
                return result;
            }
            const json = localStorage.getItem(TEMP_LESSONS_STORE);
            let lessons: any = {};
            if (json) {
                lessons = JSON.parse(json);
            }
            // console.log('kessins', lessons, typeof lessons)
            for (let i of Object.keys(lessons)) {
                // console.log('Object.keys', i, lessons)
                data?.results?.push(addTempResult(i, lessons[i]))
            }
            // console.log("response getResultsForStudentForClass", response)
            // const req = await Http.get({ url: `/classes/${classId}/students/${studentId}/results` })
            // await new Promise(r => setTimeout(r, 1000));
            const results: Result[] = []
            if (data.results) {
                for (let i of data.results) {
                    results.push(Result.fromJson(i))
                }
            }
            return results;
        } catch (error) {
            console.log(error);
            return [];
        }
    }

    async isPreQuizDone(subjectCode: string, classId: string, studentId: string): Promise<boolean> {
        if (COURSES.PUZZLE === subjectCode || this.preQuizMap[subjectCode])
            return true;
        const results = await this.getResultsForStudentForClass(classId, studentId);
        for (let result of results)
            if (result.metadata?.lessonId === subjectCode + "_" + PRE_QUIZ) {
                this.preQuizMap[subjectCode] = true
                return true;
            }

        this.preQuizMap[subjectCode] = false

        return false;
    }

    public async getResultsForStudentsForClassInLessonMap(classId: string, studentId: string): Promise<{ [key: string]: Lesson; }> {
        const results = await this.getResultsForStudentForClass(classId, studentId);
        const lessonMap: any = {};
        for (let result of results) {
            if (
                !lessonMap[result.metadata.lessonId] ||
                lessonMap[result.metadata.lessonId] < result.score
            ) {
                lessonMap[result.metadata.lessonId] = result;
            }
        }
        return lessonMap;
    }

    async getLineItemsForClassForLessonId(classId: string, LessonId: string): Promise<LineItem[]> {
        try {
            const filter = encodeURIComponent(`title='${LessonId}'`)
            const response = await Http.get({ url: "https://mocki.io/v1/18b2c698-d192-4fc5-9e47-a6eae79bb681?filter=" + filter, headers: this.getHeaders(), shouldEncodeUrlParams: false }).catch((e) => { console.log("error on getResultsForStudentForClass", e) });
            const result = (response && response.status === 200) ? response.data : {};
            const lineItems: LineItem[] = [];
            if (result.lineItems) {
                for (let i of result.lineItems) {
                    lineItems.push(LineItem.fromJson(i))
                }
            }
            return lineItems;
        } catch (error) {
            console.log(error);
            return [];
        }
    }

    async putLineItem(classId: string, lessonId: string): Promise<LineItem> {
        const sourcedId = uuidv4();
        const assignDate = new Date().toISOString();
        const dueDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
        const lineItem = new LineItem(lessonId, assignDate, dueDate, { href: classId, sourcedId: classId, type: "class" }, { href: "category", sourcedId: "category", type: "category" }, 0, 100, sourcedId, OneRosterStatus.ACTIVE, assignDate, {}, lessonId);
        console.log("lineItem", { lineItems: lineItem.toJson() })
        // Http.put({ url: `/lineItems/${sourcedId}`, data: { lineItem: result.toJson() }, headers: this.getHeaders() })
        return lineItem;

    }

    async putResult(userId: string, classId: string, LessonId: string, score: number): Promise<Result | undefined> {
        try {
            const lineItems = await this.getLineItemsForClassForLessonId(classId, LessonId);
            const lineItem: LineItem = (lineItems && lineItems.length > 0) ? lineItems[0] : await this.putLineItem(classId, LessonId);
            const date = new Date().toISOString();
            const sourcedId = uuidv4();
            const result = new Result(
                {
                    href: lineItem?.sourcedId,
                    sourcedId: lineItem?.sourcedId,
                    type: "lineItem"
                },
                {
                    href: userId,
                    sourcedId: userId,
                    type: "user"
                },
                lineItem.class,
                ScoreStatusEnum.SUBMITTED,
                score,
                date,
                "",
                sourcedId,
                OneRosterStatus.ACTIVE,
                date,
                { LessonId: LessonId });
            console.log('results', { result: result.toJson() })
            // Http.put({ url: `/results/${sourcedId}`, data: { result: result.toJson() }, headers: this.getHeaders() })
            return result;
        } catch (error) {
            console.log(error)
        }
    }
    async getClassForUserForSubject(userId: string, subjectCode: string): Promise<Class | undefined> {
        let classes: Class[] = [];
        if (this.classes[userId] && this.classes[userId].length > 0) {
            classes = this.classes[userId]
        }
        else {
            classes = await this.getClassesForUser(userId);
            this.classes[userId] = classes;
        }
        const classForSub = classes.find((value: Class, index: number, obj: Class[]) => value.classCode === subjectCode);
        return classForSub;
    }

}