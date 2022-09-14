import { OneRosterStatus } from "../interface/modelInterfaces";

export class BaseObject {
    private _sourcedId: string;
    private _status: OneRosterStatus;
    private _dateLastModified: string;
    private _metadata: object;

    constructor(
        sourcedId: string,
        status: OneRosterStatus,
        dateLastModified: string,
        metadata: object,

    ) {
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
}