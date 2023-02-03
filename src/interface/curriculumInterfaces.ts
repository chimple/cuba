
export interface Course {
    chapters: Chapter[];
    id: string;
    name: string;
    lang: string;
    type: string;
    levels: string[];
    isCourseMapped: boolean | null,
}

export interface Chapter {
    id: string;
    lessons: Lesson[];
    name: string;
    image: string;
    color?: string;
    course: Course;
}

export interface Lesson {
    id: string;
    image: string;
    name: string;
    isUnlock: boolean;
    type: string;
    skills?: Array<string>;
    color?: string;
    chapter: Chapter;
    assignmentId?: string;
    outcome?: string | null;
    orig_chapter_id?: string | null;
    orig_course_id?: string | null;
    orig_lesson_id?: string | null;
}
