import { ClassType, OneRosterGUIDRef, OneRosterStatus } from "../interface/modelInterfaces";
import { Util } from "../utility/util";
import { BaseObject } from "./baseObject";

export class Class extends BaseObject {


    private _title: string;
    private _classCode: string;
    private _classType: ClassType;
    private _location: string;
    private _grades: string[];
    private _subjects: string[];
    private _course: OneRosterGUIDRef;
    private _school: OneRosterGUIDRef;
    private _terms: OneRosterGUIDRef[];
    private _subjectCodes: string[];
    private _periods: string[];
    private _resources: OneRosterGUIDRef[];

    constructor(
        title: string,
        classCode: string,
        classType: ClassType,
        location: string,
        grades: string[],
        subjects: string[],
        course: OneRosterGUIDRef,
        school: OneRosterGUIDRef,
        terms: OneRosterGUIDRef[],
        subjectCodes: string[],
        periods: string[],
        resources: OneRosterGUIDRef[],
        sourcedId: string,
        status: OneRosterStatus,
        dateLastModified: string,
        metadata: object,
    ) {
        super(sourcedId, status, dateLastModified, metadata);
        this._title = title
        this._classCode = classCode
        this._classType = classType
        this._location = location
        this._grades = grades
        this._subjects = subjects
        this._course = course
        this._school = school
        this._terms = terms
        this._subjectCodes = subjectCodes
        this._periods = periods
        this._resources = resources
    }


    get title(): string {
        return this._title;
    }
    set title(value: string) {
        this._title = value;
    }
    get classCode(): string {
        return this._classCode;
    }
    set classCode(value: string) {
        this._classCode = value;
    }
    get classType(): ClassType {
        return this._classType;
    }
    set classType(value: ClassType) {
        this._classType = value;
    }
    get location(): string {
        return this._location;
    }
    set location(value: string) {
        this._location = value;
    }
    get grades(): string[] {
        return this._grades;
    }
    set grades(value: string[]) {
        this._grades = value;
    }
    get subjects(): string[] {
        return this._subjects;
    }
    set subjects(value: string[]) {
        this._subjects = value;
    }
    get course(): OneRosterGUIDRef {
        return this._course;
    }
    set course(value: OneRosterGUIDRef) {
        this._course = value;
    }
    get school(): OneRosterGUIDRef {
        return this._school;
    }
    set school(value: OneRosterGUIDRef) {
        this._school = value;
    }
    get terms(): OneRosterGUIDRef[] {
        return this._terms;
    }
    set terms(value: OneRosterGUIDRef[]) {
        this._terms = value;
    }
    get subjectCodes(): string[] {
        return this._subjectCodes;
    }
    set subjectCodes(value: string[]) {
        this._subjectCodes = value;
    }
    get periods(): string[] {
        return this._periods;
    }
    set periods(value: string[]) {
        this._periods = value;
    }
    get resources(): OneRosterGUIDRef[] {
        return this._resources;
    }
    set resources(value: OneRosterGUIDRef[]) {
        this._resources = value;
    }
    static fromJson(jsonObj: any): Class {
        const terms: OneRosterGUIDRef[] = [];
        for (let i of jsonObj?.terms) {
            terms.push(Util.getOneRosterObject(i))
        }
        const resources: OneRosterGUIDRef[] = [];
        for (let i of jsonObj?.resources) {
            resources.push(Util.getOneRosterObject(i))
        }
        const status: OneRosterStatus = (OneRosterStatus[jsonObj?.status] as unknown as OneRosterStatus) ?? OneRosterStatus.active;

        const newClass = new Class(
            jsonObj?.title,
            ClassType[jsonObj?.classCode] ?? ClassType.homeroom,
            jsonObj?.classType,
            jsonObj?.location,
            jsonObj?.grades ?? [],
            jsonObj?.subjects ?? [],
            Util.getOneRosterObject(jsonObj?.course),
            Util.getOneRosterObject(jsonObj?.school),
            terms,
            jsonObj?.subjectCodes,
            jsonObj?.periods,
            resources,
            jsonObj?.sourcedId,
            status,
            jsonObj?.dateLastModified,
            jsonObj?.metadata

        )
        return newClass;
    }
}