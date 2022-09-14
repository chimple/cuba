export interface OneRosterSrcObject {
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