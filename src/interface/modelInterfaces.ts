export interface GUIDRef {
    href: string,
    sourcedId: string,
    type: string
}

export enum ClassType {
    homeroom,
    scheduled,
}

export enum OneRosterStatus {
    active,
    tobedeleted,
}

export enum ScoreStatusEnum {
    exempt,
    "fully graded",
    "not submitted",
    "partially graded",
    submitted,
    incomplete,
    missing,
    withdrawal,
    "in progress"
}

export interface LearningObjectiveResult {
    "learningObjectiveId": string
    "score": number,
    "textScore": string
}

export interface LearningObjective {
    "source": string,
    "learningObjectiveResults": LearningObjectiveResult[]
}