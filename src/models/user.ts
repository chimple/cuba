import { GUIDRef, OneRosterStatus, RoleType, TrueFalseEnum, UserId } from "../interface/modelInterfaces";
import { Util } from "../utility/util";
import { BaseObject } from "./baseObject";

export class User extends BaseObject {
    private _username: string;
    private _userIds: UserId[] | null;
    private _enabledUser: TrueFalseEnum;
    private _givenName: string;
    private _familyName: string;
    private _middleName: string | null;
    private _role: RoleType;
    private _identifier: string | null;
    private _email: string | null;
    private _sms: string | null;
    private _phone: string | null;
    private _agents: GUIDRef[] | null;
    private _orgs: GUIDRef[];
    private _grades: string[] | null;
    private _password: string | null;

    public get username(): string {
        return this._username;
    }
    public set username(value: string) {
        this._username = value;
    }
    public get userIds(): UserId[] | null {
        return this._userIds;
    }
    public set userIds(value: UserId[] | null) {
        this._userIds = value;
    }
    public get enabledUser(): TrueFalseEnum {
        return this._enabledUser;
    }
    public set enabledUser(value: TrueFalseEnum) {
        this._enabledUser = value;
    }
    public get givenName(): string {
        return this._givenName;
    }
    public set givenName(value: string) {
        this._givenName = value;
    }
    public get familyName(): string {
        return this._familyName;
    }
    public set familyName(value: string) {
        this._familyName = value;
    }
    public get middleName(): string | null {
        return this._middleName;
    }
    public set middleName(value: string | null) {
        this._middleName = value;
    }
    public get role(): RoleType {
        return this._role;
    }
    public set role(value: RoleType) {
        this._role = value;
    }
    public get identifier(): string | null {
        return this._identifier;
    }
    public set identifier(value: string | null) {
        this._identifier = value;
    }
    public get email(): string | null {
        return this._email;
    }
    public set email(value: string | null) {
        this._email = value;
    }
    public get sms(): string | null {
        return this._sms;
    }
    public set sms(value: string | null) {
        this._sms = value;
    }
    public get phone(): string | null {
        return this._phone;
    }
    public set phone(value: string | null) {
        this._phone = value;
    }
    public get agents(): GUIDRef[] | null {
        return this._agents;
    }
    public set agents(value: GUIDRef[] | null) {
        this._agents = value;
    }
    public get orgs(): GUIDRef[] {
        return this._orgs;
    }
    public set orgs(value: GUIDRef[]) {
        this._orgs = value;
    }
    public get grades(): string[] | null {
        return this._grades;
    }
    public set grades(value: string[] | null) {
        this._grades = value;
    }
    public get password(): string | null {
        return this._password;
    }
    public set password(value: string | null) {
        this._password = value;
    }

    constructor(
        username: string,
        userIds: UserId[] | null,
        enabledUser: TrueFalseEnum,
        givenName: string,
        familyName: string,
        middleName: string | null,
        role: RoleType,
        identifier: string | null,
        email: string | null,
        sms: string | null,
        phone: string | null,
        agents: GUIDRef[] | null,
        orgs: GUIDRef[],
        grades: string[] | null,
        password: string | null,
        sourcedId: string,
        status: OneRosterStatus,
        dateLastModified: string,
        metaData: object,
    ) {
        super(sourcedId, status, dateLastModified, metaData);
        this._username = username;
        this._userIds = userIds;
        this._enabledUser = enabledUser;
        this._givenName = givenName;
        this._familyName = familyName;
        this._middleName = middleName;
        this._role = role;
        this._identifier = identifier;
        this._email = email;
        this._sms = sms;
        this._phone = phone;
        this._agents = agents;
        this._orgs = orgs;
        this._grades = grades;
        this._password = password;
    }

    static fromJson(jsonObj: any): User {
        const orgs: GUIDRef[] = [];
        if (jsonObj?.orgs)
            for (let i of jsonObj?.orgs) {
                orgs.push(Util.getGUIDRef(i))
            }
        const agents: GUIDRef[] = [];
        if (jsonObj?.agents)
            for (let i of jsonObj?.agents) {
                agents.push(Util.getGUIDRef(i))
            }
        const newUser = new User(
            jsonObj.username,
            jsonObj.userIds,
            TrueFalseEnum[jsonObj.enabledUser] ?? TrueFalseEnum.TRUE,
            jsonObj.givenName,
            jsonObj.familyName,
            jsonObj.middleName,
            RoleType[jsonObj.role] ?? RoleType.STUDENT,
            jsonObj.identifier,
            jsonObj.email,
            jsonObj.sms,
            jsonObj.phone,
            agents,
            orgs,
            jsonObj.grades,
            jsonObj.password,
            jsonObj?.sourcedId,
            OneRosterStatus[jsonObj?.status] ?? OneRosterStatus.ACTIVE,
            jsonObj?.dateLastModified,
            jsonObj?.metaData
        )
        return newUser;
    }

}