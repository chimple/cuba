import { Http, HttpHeaders } from "@capacitor-community/http";
import { COURSES, EXAM, MIN_PASS, PRE_QUIZ, TEMP_LESSONS_STORE } from "../common/constants";
import { Chapter, Lesson } from "../interface/curriculumInterfaces";
import { OneRosterStatus, ScoreStatusEnum } from "../interface/modelInterfaces";
import { Class } from "../models/class";
import { LineItem } from "../models/lineItem";
import { Result } from "../models/result";
import { ServiceApi } from "./ServiceApi";
import { v4 as uuidv4 } from 'uuid';
import { User } from "../models/user";
import Curriculum from "../models/curriculum";
import Auth from "../models/auth";


export class OneRosterApi implements ServiceApi {
    public static i: OneRosterApi;
    private preQuizMap: { [key: string]: { [key: string]: Result } } = {}
    private classes: { [key: string]: Class[] } = {}
    private lessonMap: { [key: string]: { [key: string]: Result } } = {}
    private constructor() {
    }

    public static getInstance(): OneRosterApi {
        if (!OneRosterApi.i) {
            OneRosterApi.i = new OneRosterApi();
        }
        return OneRosterApi.i;
    }

    getHeaders(): HttpHeaders {
        return { Authorization: "Bearer " + Auth.i.authToken }
    }

    async getClassesForUser(userId: string): Promise<Class[]> {
        console.log('in getClassesForUser')
        try {
            const response = await Http.get({ url: "https://mocki.io/v1/dcf990f5-52ca-48c2-9ff7-31a25f7a5d9d", headers: this.getHeaders() }).catch((e) => { console.log("error on getResultsForStudentForClass", e) });
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
            const response = await Http.get({ url: "https://mocki.io/v1/0306052a-5830-47c3-ace2-b03951286345", headers: this.getHeaders() }).catch((e) => { console.log("error on getResultsForStudentForClass", e) });
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
        if (COURSES.PUZZLE === subjectCode) return true;
        const preQuiz = await this.getPreQuiz(subjectCode, classId, studentId)
        return !!preQuiz;
    }

    async getPreQuiz(subjectCode: string, classId: string, studentId: string): Promise<Result | undefined> {
        if (!this.preQuizMap[studentId]) {
            this.preQuizMap[studentId] = {}
        }
        if (this.preQuizMap[studentId][subjectCode])
            return this.preQuizMap[studentId][subjectCode];
        const results = await this.getResultsForStudentForClass(classId, studentId);
        for (let result of results)
            if (result.metadata?.lessonId === subjectCode + "_" + PRE_QUIZ) {
                this.preQuizMap[studentId][subjectCode] = result
                return result;
            }
    }

    public async getResultsForStudentsForClassInLessonMap(classId: string, studentId: string): Promise<{ [key: string]: Result; }> {
        if (!!this.lessonMap[studentId]) {
            await new Promise(r => setTimeout(r, 10));
            return this.lessonMap[studentId];
        }
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
        this.lessonMap[studentId] = lessonMap;
        return lessonMap;
    }

    async getLineItemsForClassForLessonId(classId: string, lessonId: string): Promise<LineItem[]> {
        try {
            const filter = encodeURIComponent(`title='${lessonId}'`)
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

    async putResult(userId: string, classId: string, lessonId: string, score: number, subjectCode: string): Promise<Result | undefined> {
        try {
            const lineItems = await this.getLineItemsForClassForLessonId(classId, lessonId);
            const lineItem: LineItem = (lineItems && lineItems.length > 0) ? lineItems[0] : await this.putLineItem(classId, lessonId);
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
                { lessonId: lessonId });
            console.log('results', { result: result.toJson() })
            // Http.put({ url: `/results/${sourcedId}`, data: { result: result.toJson() }, headers: this.getHeaders() })
            if (this.lessonMap[userId] == null) {
                this.lessonMap[userId] = {}
            }
            this.lessonMap[userId][lessonId] = result;
            if (score >= MIN_PASS) {
                const curInstance = Curriculum.getInstance();
                const lessons = await curInstance.allLessonForSubject(subjectCode, this.lessonMap[userId]);
                const lesson = lessons.find((lesson: Lesson) => lesson.id === lessonId);
                if (lesson && lesson.type === EXAM && lesson.chapter.lessons[lesson.chapter.lessons.length - 1].id === lessonId) {
                    console.log("updating prequiz for lesson", lesson)
                    const preQuiz = await this.updatePreQuiz(subjectCode, classId, userId, lesson.chapter.id, true)
                    console.log("updated prequiz", preQuiz)
                }
            }
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

    async getUser(userId: string): Promise<User | undefined> {
        try {
            const response = await Http.get({ url: "https://mocki.io/v1/c856c037-87d1-4722-b623-a6e0fd302ae9", headers: this.getHeaders() }).catch((e) => { console.log("error on getResultsForStudentForClass", e) });
            const result = (response && response.status === 200) ? response.data : {};
            if (result.user)
                return User.fromJson(result.user)
        } catch (error) {
            console.log('error')
        }
    }

    async updatePreQuiz(subjectCode: string, classId: string, studentId: string, chapterId: string, updateNextChapter = true): Promise<Result | undefined> {
        try {
            const curInstance = Curriculum.getInstance();
            const chapters = await curInstance.allChapterForSubject(subjectCode);
            const chapterIndex = chapters.findIndex((chapter: Chapter) => chapter.id === chapterId);
            let score = (((chapterIndex + (updateNextChapter ? 2 : 1)) / chapters.length) * 100);
            if (score > 100) score = 100
            let index = ((score * chapters.length) / 100) - 1
            const isFloat = (x: number) => !!(x % 1);
            if (isFloat(index)) {
                index = Math.round(index)
            }
            console.log('updatePreQuiz', score, chapterIndex, chapterId, index, chapters[Math.min(index, chapters.length - 1)]?.id)
            const preQuiz = await this.getPreQuiz(subjectCode, classId, studentId);
            const date = new Date().toISOString();
            let preQuizresult: Result;
            if (preQuiz) {
                preQuiz.dateLastModified = date
                preQuiz.score = Math.max(score, preQuiz.score);
                preQuizresult = preQuiz;
            }
            else {
                const sourcedId = uuidv4();
                const lessonId = subjectCode + "_" + PRE_QUIZ;
                const lineItems = await this.getLineItemsForClassForLessonId(classId, lessonId);
                const lineItem: LineItem = (lineItems && lineItems.length > 0) ? lineItems[0] : await this.putLineItem(classId, lessonId);
                preQuizresult = new Result(
                    {
                        href: lineItem?.sourcedId,
                        sourcedId: lineItem?.sourcedId,
                        type: "lineItem"
                    },
                    {
                        href: studentId,
                        sourcedId: studentId,
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
                    { lessonId: lessonId });
            }
            // Http.put({ url: `/results/${preQuizresult.sourcedId}`, data: { result: preQuizresult.toJson() }, headers: this.getHeaders() })
            if (!this.preQuizMap[studentId]) {
                this.preQuizMap[studentId] = {};
            }
            this.preQuizMap[studentId][subjectCode] = preQuizresult;

            if (this.lessonMap[studentId] == null) {
                this.lessonMap[studentId] = {}
            }
            this.lessonMap[studentId][subjectCode + "_" + PRE_QUIZ] = preQuizresult;

            //temp storing prequiz locally
            const json = localStorage.getItem(TEMP_LESSONS_STORE);
            let lessons: any = {};
            if (json) {
                lessons = JSON.parse(json);
            }
            lessons[preQuizresult.metadata.lessonId] = preQuizresult?.score;
            localStorage.setItem(TEMP_LESSONS_STORE, JSON.stringify(lessons));
            
            return preQuizresult;
        } catch (error) {
            console.log(error)
        }
    }

    async getChapterForPreQuizScore(subjectCode: string, score: number, chapters: Chapter[] | undefined = undefined): Promise<Chapter> {
        if (!chapters) {
            const curInstance = Curriculum.getInstance();
            chapters = await curInstance.allChapterForSubject(subjectCode);
        }
        if (score > 100) score = 100;
        let index = ((score * chapters.length) / 100) - 1;
        const isFloat = (x: number) => !!(x % 1);
        if (isFloat(index)) index = Math.round(index);
        console.log('getChapterForPreQuizScore', score, index, chapters[Math.min(index, chapters.length - 1)]?.id)
        return chapters[Math.min(index, chapters.length - 1)] ?? chapters[1];
    }

}