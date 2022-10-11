import { Chapter, Course, Lesson } from "../interface/curriculumInterfaces";
import { Util } from "../utility/util";
import { COURSES, EXAM, TEMP_LESSONS_STORE } from "../common/constants";
import { OneRosterApi } from "../services/OneRosterApi";

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
        this.curriculum.clear();
        this.allLessons.clear();
    }

    // To load Course Jsons
    async loadCourseJsons(courseIds: Array<string>) {
        for (let i = 0; i < courseIds.length; i++) {
            await this.loadSingleCourseJson(courseIds[i])
        }
    }

    //To load single course Json
    async loadSingleCourseJson(courseId: string): Promise<Map<string, Course>> {

        if (this.curriculum.get(courseId)) {
            return this.curriculum;
        }

        console.log('loadSingleCourseJson() method called')
        // let course: Course;
        let res = await fetch("courses/" + courseId + "/course.json")
        const data = await res.json();
        let course = Util.toCourse(data)

        const apiInstance = OneRosterApi.getInstance();
        const playedLessons: any = await apiInstance.getResultsForStudentsForClassInLessonMap("", "") || {};

        console.log("playedLessons", playedLessons)

        //if quiz is  not played making all other lesson lock
        if (!playedLessons[courseId + "_PreQuiz"] && courseId != COURSES.PUZZLE) {
            course.chapters.forEach(async (chapter: Chapter) => {
                chapter.course = course;
                chapter.lessons.forEach(async (lesson) => {
                    lesson.isUnlock = lesson.id != courseId + "_PreQuiz" ? false : true;
                    lesson.chapter = chapter;
                    this.allLessons.set(lesson.id, lesson)
                });
            });
            this.curriculum.set(courseId, course);
            console.log(this.curriculum, this.allLessons)

            return this.curriculum
        } else {
            course.chapters.forEach(async (chapter: Chapter) => {
                chapter.course = course;
                chapter = await this.unlockingLessonsByChapterWise(playedLessons, courseId, chapter);
            });
            this.curriculum.set(courseId, course);

            console.log(this.curriculum, this.allLessons)

            return this.curriculum;
        }
    }

    async unlockingLessonsByChapterWise(playedLessons: any, courseId: string, chapter: Chapter): Promise<Chapter> {

        //Unlocking all Puzzle Lessons
        if (courseId === COURSES.PUZZLE) {
            let tempLessons: Lesson[] = chapter.lessons;
            for (let i = 0; i < tempLessons.length; i++) {
                tempLessons[i].isUnlock = true;
                tempLessons[i].chapter = chapter;
                this.allLessons.set(tempLessons[i].id, tempLessons[i])
            }
            chapter.lessons = tempLessons
            return chapter
        } else {
            let tempLessons: Lesson[] = chapter.lessons;
            // console.log("chapter.lessons", chapter.lessons)
            for (let i = 0; i < tempLessons.length; i++) {

                //Unlocking Played lessons and Next Lesson
                if ((playedLessons[tempLessons[i].id] && tempLessons.length > i + 1) || (i - 1 >= 0 && playedLessons[tempLessons[i - 1]?.id])) {
                    tempLessons[i].isUnlock = true
                    tempLessons[i].chapter = chapter;
                    this.allLessons.set(tempLessons[i].id, tempLessons[i])
                    // console.log(tempLessons[i].id, "is played so unlocking this lesson", tempLessons[i].isUnlock, playedLessons['ambulance']._metadata.lessonId)
                    
                    // checking lesson type === EXAM && scored > 70 then Unlocking Next lesson
                    if (playedLessons[tempLessons[i].id] && tempLessons.length > i + 1) {
                        if (tempLessons[i].type != EXAM || (tempLessons[i].type === EXAM && playedLessons[tempLessons[i].id].score > 70)) {
                            tempLessons[i + 1].isUnlock = true
                            tempLessons[i + 1].chapter = chapter;
                            this.allLessons.set(tempLessons[i + 1].id, tempLessons[i + 1]);
                            console.log(tempLessons[i].name, "is played so unlocking next lesson", tempLessons[i + 1].name, tempLessons[i + 1].isUnlock)
                        } else {
                            // console.log("Entered else", tempLessons[i + 1].isUnlock)
                            tempLessons[i + 1].isUnlock = false
                            tempLessons[i + 1].chapter = chapter;
                            this.allLessons.set(tempLessons[i + 1].id, tempLessons[i + 1]);
                            console.log(tempLessons[i].name, "is played but challenge score not > 70", tempLessons[i + 1].name, tempLessons[i + 1].isUnlock)
                            i++
                        }
                    }
                    // Unlocking every first lessons in each chapter(i === 0 ? true)
                } else if (i === 0) {
                    tempLessons[i].isUnlock = true
                    tempLessons[i].chapter = chapter;
                    this.allLessons.set(tempLessons[i].id, tempLessons[i])
                } else {
                    tempLessons[i].isUnlock = false
                    tempLessons[i].chapter = chapter;
                    this.allLessons.set(tempLessons[i].id, tempLessons[i])
                }

            }
            chapter.lessons = tempLessons
            return chapter
        }
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
