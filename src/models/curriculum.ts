import { Http } from "@capacitor-community/http";
import { Chapter, Course, Lesson } from "../interface/curriculumInterfaces";
import { Util } from "../utility/util";
import fs from 'fs'

export default class Curriculum {
    private static instance: Curriculum;
    private _lessonData: any;

    course: Course;
    chapter: Chapter;
    lesson: Lesson;
    curriculum: Map<string, Course> = new Map();
    allLessons: Map<string, Lesson> = new Map();
    data: Array<Array<string>>;
    currentProblem: number;
    totalProblems: number;
    currentCourseId: string;
    currentChapterId: string;
    currentLessonId: string;
    assignments: any[] = [];
    featuredLessons: any[] = [];
    prevCourse: Course;
    prevChapter: Chapter;

    private constructor(
        course: Course,
        chapter: Chapter,
        lesson: Lesson,
        data: Array<Array<string>>,
        currentProblem: number,
        totalproblem: number,
        currentCourseId: string,
        currentChapterId: string,
        currentLessonId: string,
        prevCourse: Course,
        prevChapter: Chapter
    ) {
        this.course = course
        this.chapter = chapter
        this.lesson = lesson
        this.data = data
        this.currentProblem = currentProblem
        this.totalProblems = totalproblem
        this.currentCourseId = currentCourseId
        this.currentChapterId = currentChapterId
        this.currentLessonId = currentLessonId
        this.prevCourse = prevCourse
        this.prevChapter = prevChapter
    }

    static getInstance(): Curriculum {
        if (!Curriculum.instance) {
            Curriculum.instance = new Curriculum(null!, null!, null!, [], -1, -1, null!, null!, null!, null!, null!);
        }
        return Curriculum.instance;
    }

    static get i(): Curriculum {
        return Curriculum.getInstance();
    }

    clear() {
        this.course = null!
        this.chapter = null!
        this.lesson = null!
    }

    // To load Course Jsons
    async loadCourseJsons(courseIds: Array<string>) {
        courseIds.forEach(courseId => {
            this.loadSingleCourseJson(courseId)
        });
    }

    //To load single course Json
    async loadSingleCourseJson(courseId: string): Promise<Map<string, Course>> {
        console.log('loadSingleCourseJson() method called')
        // let jsonFile = fs.readFileSync("courses/" + courseId + "/" + courseId + "/res/course.json", 'utf-8');
        let jsonFile = await Http.get({ url: "courses/" + courseId + "/" + courseId + "/res/course.json", responseType: "json" })
        console.log("course Json ", courseId)
        let course = Util.toCourse(jsonFile.data);

        course.chapters.forEach((chapter) => {
            chapter.course = course;
            chapter.lessons.forEach((lesson) => {
                lesson.chapter = chapter;
                // if (User.getCurrentUser() && User.getCurrentUser().debug) {
                //     lesson.open = true
                // } else {
                lesson.open = false
                // }
                this.allLessons.set(lesson.id, lesson)
            });
        });
        this.curriculum.set(courseId, course);

        console.log(this.curriculum, this.allLessons)

        return this.curriculum;
    }

    async allChapterforSubject(courseId: string): Promise<Chapter[]> {

        if (this.curriculum.get(courseId)?.chapters == undefined) {
            const course = await this.loadSingleCourseJson(courseId);
            return course.get(courseId)?.chapters || [];
        }
        return this.curriculum.get(courseId)?.chapters || [];
    }

    async allLessonforSubject(courseId: string): Promise<Lesson[]> {
        let course = this.curriculum || undefined;
        const lessons: Lesson[] = []
        if (course.get(courseId)?.chapters == undefined) {
            course = await this.loadSingleCourseJson(courseId);
        }
        const chapters = course.get(courseId)?.chapters || []
        for (let chapter of chapters) {
            for (let lesson of chapter.lessons) {
                lessons.push(lesson)
            }
        }
        return lessons || [];
    }

    nextProblem() {
        if (this.currentProblem < this.totalProblems) {
            this.currentProblem++;
            this.data = [this._lessonData.rows[this.currentProblem - 1]];
        }
    }

    prevProblem() {
        if (this.currentProblem > 1) {
            this.currentProblem--;
            this.data = [this._lessonData.rows[this.currentProblem - 1]];
        }
    }

    getAssignments(): Lesson[] {
        return []
    }

}
