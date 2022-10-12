import { GUIDRef, OneRosterStatus, OrgTypeEnum } from "../interface/modelInterfaces";
import { Util } from "../utility/util";
import { BaseObject } from "./baseObject";

export class Org extends BaseObject {
    private _name: string;
    private _type: OrgTypeEnum;
    private _identifier: string;
    private _parent: GUIDRef;
    private _children: GUIDRef[];

    public get name(): string {
        return this._name;
    }
    public set name(value: string) {
        this._name = value;
    }
    public get type(): OrgTypeEnum {
        return this._type;
    }
    public set type(value: OrgTypeEnum) {
        this._type = value;
    }
    public get identifier(): string {
        return this._identifier;
    }
    public set identifier(value: string) {
        this._identifier = value;
    }
    public get parent(): GUIDRef {
        return this._parent;
    }
    public set parent(value: GUIDRef) {
        this._parent = value;
    }
    public get children(): GUIDRef[] {
        return this._children;
    }
    public set children(value: GUIDRef[]) {
        this._children = value;
    }

    constructor(
        name: string,
        type: OrgTypeEnum,
        identifier: string,
        parent: GUIDRef,
        children: GUIDRef[],
        sourcedId: string,
        status: OneRosterStatus,
        dateLastModified: string,
        metadata: object,
    ) {
        super(sourcedId, status, dateLastModified, metadata);
        this._name = name;
        this._type = type;
        this._identifier = identifier;
        this._parent = parent;
        this._children = children;
    }

    static fromJson(jsonObj: any): Org {
        const children: GUIDRef[] = [];
        for (let i of jsonObj?.children) {
            children.push(Util.getGUIDRef(i))
        }
        const newOrg = new Org(
            jsonObj?.name,
            OrgTypeEnum[jsonObj?.type] ?? OrgTypeEnum.SCHOOL,
            jsonObj.identifier,
            Util.getGUIDRef(jsonObj?.parent),
            children,
            jsonObj?.sourcedId,
            OneRosterStatus[jsonObj?.status] ?? OneRosterStatus.ACTIVE,
            jsonObj?.dateLastModified,
            jsonObj?.metadata)
        return newOrg;
    }

}  