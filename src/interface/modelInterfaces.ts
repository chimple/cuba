export interface GUIDRef {
    href: string,
    sourcedId: string,
    type: string
}

export enum ClassType {
    HOME_ROOM = "homeroom",
    SCHEDULED = "scheduled",
}

export enum OneRosterStatus {
    ACTIVE = "active",
    TO_BE_DELETED = "tobedeleted",
}

export enum ScoreStatusEnum {
    EXEMPT = "exempt",
    FULLY_GRADED = "fully graded",
    NOT_SUBMITTED = "not submitted",
    PARTIALLY_GRADED = "partially graded",
    SUBMITTED = "submitted",
    INCOMPLETE = "incomplete",
    MISSING = "missing",
    WITHDRAWAL = "withdrawal",
    IN_PROGRESS = "in progress"
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
export enum OrgTypeEnum {
    DEPARTMENT = "department",
    DISTRICT = "district",
    LOCAL = "local",
    NATIONAL = "national",
    SCHOOL = "school",
    STATE = "state"
}
