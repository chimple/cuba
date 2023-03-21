import { GUIDRef, OneRosterStatus } from "../interface/modelInterfaces";
import { Util } from "../utility/util";
import { BaseObject } from "./baseObject";

export class Course extends BaseObject {

    private _title: string;
    private _schoolYear: GUIDRef;
    private _courseCode: string;
    private _grades: string[];
    private _subjects: string[];
    private _org: GUIDRef;
    private _subjectCodes: string[];
    private _resources: GUIDRef[];

    public get title(): string {
        return this._title;
    }
    public set title(value: string) {
        this._title = value;
    }
    public get schoolYear(): GUIDRef {
        return this._schoolYear;
    }
    public set schoolYear(value: GUIDRef) {
        this._schoolYear = value;
    }
    public get courseCode(): string {
        return this._courseCode;
    }
    public set courseCode(value: string) {
        this._courseCode = value;
    }
    public get grades(): string[] {
        return this._grades;
    }
    public set grades(value: string[]) {
        this._grades = value;
    }
    public get subjects(): string[] {
        return this._subjects;
    }
    public set subjects(value: string[]) {
        this._subjects = value;
    }
    public get org(): GUIDRef {
        return this._org;
    }
    public set org(value: GUIDRef) {
        this._org = value;
    }
    public get subjectCodes(): string[] {
        return this._subjectCodes;
    }
    public set subjectCodes(value: string[]) {
        this._subjectCodes = value;
    }
    public get resources(): GUIDRef[] {
        return this._resources;
    }
    public set resources(value: GUIDRef[]) {
        this._resources = value;
    }

    constructor(
        title: string,
        schoolYear: GUIDRef,
        courseCode: string,
        grades: string[],
        subjects: string[],
        org: GUIDRef,
        subjectCodes: string[],
        resources: GUIDRef[],
        sourcedId: string,
        status: OneRosterStatus,
        dateLastModified: string,
        metaData: object
    ) {
        super(sourcedId, status, dateLastModified, metaData);
        this._title = title;
        this._schoolYear = schoolYear;
        this._courseCode = courseCode;
        this._grades = grades;
        this._subjects = subjects;
        this._org = org;
        this._subjectCodes = subjectCodes;
        this._resources = resources;
    }

    static fromJson(jsonObj: any): Course {
        const resources: GUIDRef[] = [];
        if (jsonObj.resources) {
            for (const i of jsonObj.resources) {
                resources.push(Util.getGUIDRef(i));
            }
        }
        const newCourse = new Course(
            jsonObj.title,
            Util.getGUIDRef(jsonObj.schoolYear),
            jsonObj.courseCode,
            jsonObj.grades,
            jsonObj.subjects,
            Util.getGUIDRef(jsonObj.org),
            jsonObj.subjectCodes,
            resources,
            jsonObj.sourcedId,
            OneRosterStatus[jsonObj?.status] ?? OneRosterStatus.ACTIVE,
            jsonObj.dateLastModified,
            jsonObj.metaData
        )
        return newCourse;
    }
}