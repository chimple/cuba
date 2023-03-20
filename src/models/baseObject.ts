import { OneRosterStatus } from "../interface/modelInterfaces";

export class BaseObject {
    private _sourcedId: string;
    private _status: OneRosterStatus;
    private _dateLastModified: string;
    private _metaData: any;

    constructor(
        sourcedId: string,
        status: OneRosterStatus,
        dateLastModified: string,
        metaData: any,

    ) {
        this._sourcedId = sourcedId
        this._status = status
        this._dateLastModified = dateLastModified
        this._metaData = metaData
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
    get metaData(): any {
        return this._metaData;
    }
    set metaData(value: any) {
        this._metaData = value;
    }
}