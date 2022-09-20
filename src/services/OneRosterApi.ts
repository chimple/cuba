import { TEMP_LESSONS_STORE } from "../common/constants";
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

    async getClassesForUser(userId: string): Promise<Class[]> {
        const result = {
            "classes": [
                {
                    "sourcedId": "sourcedId2",
                    "status": "active",
                    "dateLastModified": "2022-04-23T18:25:43.511Z",
                    "metadata": {
                        "..permitted extension point..": "..user defined value.."
                    },
                    "title": "English",
                    "classCode": "en",
                    "classType": "homeroom",
                    "location": "Room 19",
                    "grades": ["4 grade",],
                    "subjects": ["English", "Hindi"],
                    "course": {
                        "href": "<href of the course that this is a class of>",
                        "sourcedId": "<sourcedId of the course that this is a class of>",
                        "type": "course"
                    },
                    "school": {
                        "href": "<href of the school that this is a class of>",
                        "sourcedId": "<sourcedId of the school that this is a class of>",
                        "type": "org"
                    },
                    "terms": [
                        {
                            "href": "..URI..",
                            "sourcedId": "..String..",
                            "type": "academicSession"
                        },
                    ],
                    "subjectCodes": ["en", "hi"],
                    "periods": ["period 1", "period 2"],
                    "resources": [
                        {
                            "href": "<href of the first term that this class is in>",
                            "sourcedId": "<sourcedId of the 1st term that this class is in>",
                            "type": "academicSession"
                        },
                    ]
                },
                {
                    "sourcedId": "sourcedId2",
                    "status": "active",
                    "dateLastModified": "2022-04-23T18:25:43.511Z",
                    "metadata": {
                        "..permitted extension point..": "..user defined value.."
                    },
                    "title": "Hindi",
                    "classCode": "hi",
                    "classType": "homeroom",
                    "location": "Room 20",
                    "grades": ["4 grade",],
                    "subjects": ["English", "Hindi"],
                    "course": {
                        "href": "<href of the course that this is a class of>",
                        "sourcedId": "<sourcedId of the course that this is a class of>",
                        "type": "course"
                    },
                    "school": {
                        "href": "<href of the school that this is a class of>",
                        "sourcedId": "<sourcedId of the school that this is a class of>",
                        "type": "org"
                    },
                    "terms": [
                        {
                            "href": "..URI..",
                            "sourcedId": "..String..",
                            "type": "academicSession"
                        },
                    ],
                    "subjectCodes": ["en", "hi"],
                    "periods": ["period 1", "period 2"],
                    "resources": [
                        {
                            "href": "<href of the first term that this class is in>",
                            "sourcedId": "<sourcedId of the 1st term that this class is in>",
                            "type": "academicSession"
                        },
                    ]
                },
            ]
        }
        // const req=await Http.get({url:`http://users/${userId}/classes`})
        await new Promise(r => setTimeout(r, 1000));
        const classes: Class[] = []
        for (let i of result.classes) {
            classes.push(Class.fromJson(i))
        }
        return classes;
    }

    async getResultsForStudentForClass(classId: string, studentId: string): Promise<Result[]> {
        const response = {
            "results": [
                {
                    "sourcedId": "..String..",
                    "status": "active",
                    "dateLastModified": "..Date/Time..",
                    "metadata": {
                        "lessonId": "en0000"
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
                    "score": 60,
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
                },
                {
                    "sourcedId": "..String..",
                    "status": "active",
                    "dateLastModified": "..Date/Time..",
                    "metadata": {
                        "lessonId": "en_PreQuiz"
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
                    "score": 60,
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
                },
            ]
        }
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
        console.log('kessins', lessons, typeof lessons)
        for (let i of Object.keys(lessons)) {
            console.log('Object.keys', i, lessons)
            response.results.push(addTempResult(i, lessons[i]))
        }
        console.log("response getResultsForStudentForClass", response)
        // const req = await Http.get({ url: `/classes/${classId}/students/${studentId}/results` })
        await new Promise(r => setTimeout(r, 1000));
        const results: Result[] = []
        for (let i of response.results) {
            results.push(Result.fromJson(i))
        }
        return results;
    }

    async isPreQuizDone(subjectCode: string, classId: string, studentId: string): Promise<boolean> {
        return true;
        const tempSubjectCode = subjectCode.replace("-sl", "");
        if (this.preQuizMap[tempSubjectCode]) {
            return true;
        }
        const results = await this.getResultsForStudentForClass(classId, studentId);
        for (let result of results)
            if (result.metadata?.lessonId === tempSubjectCode + "_PreQuiz") {
                this.preQuizMap[tempSubjectCode] = true
                return true;
            }

        this.preQuizMap[tempSubjectCode] = false

        return false;
    }

}