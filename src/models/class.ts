import { ClassType, OneRosterSrcObject, OneRosterStatus } from "../interface/modelInterfaces";
import { Util } from "../utility/util";

export class Class {

    private _sourcedId: string;
    private _status: OneRosterStatus;
    private _dateLastModified: string;
    private _metadata: object;
    private _title: string;
    private _classCode: string;
    private _classType: ClassType;
    private _location: string;
    private _grades: string[];
    private _subjects: string[];
    private _course: OneRosterSrcObject;
    private _school: OneRosterSrcObject;
    private _terms: OneRosterSrcObject[];
    private _subjectCodes: string[];
    private _periods: string[];
    private _resources: OneRosterSrcObject[];

    constructor(
        title: string,
        classCode: string,
        classType: ClassType,
        location: string,
        grades: string[],
        subjects: string[],
        course: OneRosterSrcObject,
        school: OneRosterSrcObject,
        terms: OneRosterSrcObject[],
        subjectCodes: string[],
        periods: string[],
        resources: OneRosterSrcObject[],
        sourcedId: string,
        status: OneRosterStatus,
        dateLastModified: string,
        metadata: object,
    ) {
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
        this._sourcedId = sourcedId
        this._status = status
        this._dateLastModified = dateLastModified
        this._metadata = metadata
    }

    get sourcedId(): string {
        return this._sourcedId;
    }
    set sourcedId(value: string) {
        this._sourcedId = value;
    }
    get status(): OneRosterStatus {
        return this._status;
    }
    set status(value: OneRosterStatus) {
        this._status = value;
    }
    get dateLastModified(): string {
        return this._dateLastModified;
    }
    set dateLastModified(value: string) {
        this._dateLastModified = value;
    }
    get metadata(): object {
        return this._metadata;
    }
    set metadata(value: object) {
        this._metadata = value;
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
    get course(): OneRosterSrcObject {
        return this._course;
    }
    set course(value: OneRosterSrcObject) {
        this._course = value;
    }
    get school(): OneRosterSrcObject {
        return this._school;
    }
    set school(value: OneRosterSrcObject) {
        this._school = value;
    }
    get terms(): OneRosterSrcObject[] {
        return this._terms;
    }
    set terms(value: OneRosterSrcObject[]) {
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
    get resources(): OneRosterSrcObject[] {
        return this._resources;
    }
    set resources(value: OneRosterSrcObject[]) {
        this._resources = value;
    }
    static fromJson(jsonObj: any): Class {
        const terms: OneRosterSrcObject[] = [];
        for (let i of jsonObj?.terms) {
            terms.push(Util.getOneRosterObject(i))
        }
        const resources: OneRosterSrcObject[] = [];
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