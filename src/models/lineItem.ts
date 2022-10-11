import { GUIDRef, LearningObjective, LearningObjectiveResult, OneRosterStatus } from "../interface/modelInterfaces";
import { Util } from "../utility/util";
import { BaseObject } from "./baseObject";

export class LineItem extends BaseObject {

    private _title: string;
    private _description: string;
    private _assignDate: string;
    private _dueDate: string;
    private _class: GUIDRef;
    private _school: GUIDRef;
    private _category: GUIDRef;
    private _gradingPeriod: GUIDRef;
    private _academicSession: GUIDRef;
    private _scoreScale: GUIDRef;
    private _resultValueMin: number;
    private _resultValueMax: number;
    private _learningObjectiveSet: LearningObjective[];

    public get title(): string {
        return this._title;
    }
    public set title(value: string) {
        this._title = value;
    }
    public get description(): string {
        return this._description;
    }
    public set description(value: string) {
        this._description = value;
    }
    public get assignDate(): string {
        return this._assignDate;
    }
    public set assignDate(value: string) {
        this._assignDate = value;
    }
    public get dueDate(): string {
        return this._dueDate;
    }
    public set dueDate(value: string) {
        this._dueDate = value;
    }
    public get class(): GUIDRef {
        return this._class;
    }
    public set class(value: GUIDRef) {
        this._class = value;
    }
    public get school(): GUIDRef {
        return this._school;
    }
    public set school(value: GUIDRef) {
        this._school = value;
    }
    public get category(): GUIDRef {
        return this._category;
    }
    public set category(value: GUIDRef) {
        this._category = value;
    }
    public get gradingPeriod(): GUIDRef {
        return this._gradingPeriod;
    }
    public set gradingPeriod(value: GUIDRef) {
        this._gradingPeriod = value;
    }
    public get academicSession(): GUIDRef {
        return this._academicSession;
    }
    public set academicSession(value: GUIDRef) {
        this._academicSession = value;
    }
    public get scoreScale(): GUIDRef {
        return this._scoreScale;
    }
    public set scoreScale(value: GUIDRef) {
        this._scoreScale = value;
    }
    public get resultValueMin(): number {
        return this._resultValueMin;
    }
    public set resultValueMin(value: number) {
        this._resultValueMin = value;
    }
    public get resultValueMax(): number {
        return this._resultValueMax;
    }
    public set resultValueMax(value: number) {
        this._resultValueMax = value;
    }
    public get learningObjectiveSet(): LearningObjective[] {
        return this._learningObjectiveSet;
    }
    public set learningObjectiveSet(value: LearningObjective[]) {
        this._learningObjectiveSet = value;
    }

    constructor(
        title: string,
        description: string,
        assignDate: string,
        dueDate: string,
        class_1: GUIDRef,
        school: GUIDRef,
        category: GUIDRef,
        gradingPeriod: GUIDRef,
        academicSession: GUIDRef,
        scoreScale: GUIDRef,
        resultValueMin: number,
        resultValueMax: number,
        learningObjectiveSet: LearningObjective[],
        sourcedId: string,
        status: OneRosterStatus,
        dateLastModified: string,
        metadata: object
    ) {
        super(sourcedId, status, dateLastModified, metadata);
        this._title = title;
        this._description = description;
        this._assignDate = assignDate;
        this._dueDate = dueDate;
        this._class = class_1;
        this._school = school;
        this._category = category;
        this._gradingPeriod = gradingPeriod;
        this._academicSession = academicSession;
        this._scoreScale = scoreScale;
        this._resultValueMin = resultValueMin;
        this._resultValueMax = resultValueMax;
        this._learningObjectiveSet = learningObjectiveSet;
    }

    static fromJson(jsonObj: any): LineItem {
        const status: OneRosterStatus = (OneRosterStatus[jsonObj?.status] as unknown as OneRosterStatus) ?? OneRosterStatus.active;
        const learningObjectiveSet: LearningObjective[] = [];
        for (let i of jsonObj.learningObjectiveSet) {
            const learningObjectiveResults: LearningObjectiveResult[] = []
            for (let j of i.learningObjectiveResults) {
                learningObjectiveResults.push({
                    learningObjectiveId: j.learningObjectiveId,
                    score: j.score,
                    textScore: j.textScore
                })
            }
            const learningObjective: LearningObjective = { source: i.source, learningObjectiveResults: learningObjectiveResults }
            learningObjectiveSet.push(learningObjective)
        }

        const newLineItem = new LineItem(
            jsonObj.title,
            jsonObj.description,
            jsonObj.assignDate,
            jsonObj.dueDate,
            Util.getGUIDRef(jsonObj?.class),
            Util.getGUIDRef(jsonObj?.school),
            Util.getGUIDRef(jsonObj?.category),
            Util.getGUIDRef(jsonObj?.gradingPeriod),
            Util.getGUIDRef(jsonObj?.academicSession),
            Util.getGUIDRef(jsonObj?.scoreScale),
            jsonObj.resultValueMin,
            jsonObj.resultValueMax,
            learningObjectiveSet,
            jsonObj.sourcedId,
            status,
            jsonObj.dateLastModified,
            jsonObj.metadata
        );
        return newLineItem;
    }

}