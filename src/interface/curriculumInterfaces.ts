
export interface Course {
    chapters: Chapter[];
    id: string;
    name: string;
    lang: string;
    type: string;
    levels: string[];
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
    open?: boolean;
    type?: string;
    skills?: Array<string>;
    color?: string;
    chapter: Chapter;
    assignmentId?: string;
}
