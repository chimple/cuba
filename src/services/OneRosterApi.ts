import { Http, HttpHeaders } from "@capacitor-community/http";
import { COURSES, PRE_QUIZ, TEMP_LESSONS_STORE } from "../common/constants";
import { Lesson } from "../interface/curriculumInterfaces";
import { Class } from "../models/class";
import { Result } from "../models/result";
import { ServiceApi } from "./ServiceApi";

export class OneRosterApi implements ServiceApi {
    public static i: OneRosterApi;
    private preQuizMap: any = {}
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
            const response = await Http.get({ url: "https://mocki.io/v1/db8a9853-1afa-441a-b6a8-b199f3bc2e3e", headers: this.getHeaders() }).catch((e) => { console.log("error on getResultsForStudentForClass", e) });
            const result = (response && response.status === 200) ? response.data : {};
            // const req=await Http.get({url:`http://users/${userId}/classes`})
            await new Promise(r => setTimeout(r, 1000));
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

}