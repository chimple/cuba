import { RoleType } from "../../interface/modelInterfaces";
import { LeaderboardRewards } from "../../common/constants";

export default class ORUser {

  private _respectLaunchVersion: number;
  private _auth: Array<string>;
  private _name: string;
  private _locale: string;
  private _httpProxy: string;
  private _endpointLTIAgs: string;
  private _endpoint: string;
  private _actorName: string;
  private _actorMbox: string;
  private _registration: string;
  private _activityId: string;

  private _id: string;
  private _role: RoleType;
  private _courses: [];
  private _age: number | undefined;
  private _image: string | undefined;
  private _gender: string | undefined;
  private _board: string | undefined;
  private _grade_id: string | undefined;
  private _language_id: string | undefined;
  private _avatar: string | undefined;
  private _sfx_off: number | undefined;
  private _music_off: number | undefined;
  private _curriculum: string | undefined;
  static avatar: string;
  private _is_tc_accepted: boolean | undefined;
  private _rewards: LeaderboardRewards | undefined;
  private _phone: string | undefined;
  private _email: string | undefined;
  private _student_id: string | undefined;

  constructor(
    respectLaunchVersion: number,
    auth: Array<string>,
    name: string,
    locale: string,
    httpProxy: string,
    endpointLTIAgs: string,
    endpoint: string,
    actorName: string,
    actorMbox: string,
    registration: string,
    activity_id: string,
    username: string,
    users: [],
    role: RoleType,
    id: string,
    courses: [],
    age: number | undefined,
    image: string | undefined,
    gender: string | undefined,
    board: string | undefined,
    grade: string | undefined,
    language_id: string | undefined,
    avatar: string | undefined,
    sfx_off: number = 0,
    music_off: number = 0,
    is_tc_accepted: boolean = false,
    rewards?: LeaderboardRewards,
  ) {
    this._respectLaunchVersion = respectLaunchVersion;
    this._auth = auth;
    this._locale = locale;
    this._httpProxy = httpProxy;
    this._endpointLTIAgs = endpointLTIAgs;
    this._endpoint = endpoint;
    this._actorName = actorName;
    this._actorMbox = actorMbox;
    this._registration = registration;
    this._activityId = activity_id
    this._name = name;
    this._role = role;
    this._id = id;
    this._courses = courses;
    this._age = age;
    this._image = image;
    this._gender = gender;
    this._board = board;
    this._grade_id = grade;
    this._language_id = language_id;
    this._avatar = avatar;
    this._sfx_off = sfx_off;
    this._music_off = music_off;
    this._is_tc_accepted = is_tc_accepted;
    this._rewards = rewards;
  }

  public get respectLaunchVersion(): number {
    return this._respectLaunchVersion;
  }
  public set respectLaunchVersion(value: number) {
    this._respectLaunchVersion = value;
  }
  public get auth(): string[] {
    return this._auth;
  }
  public set auth(value: string[]) {
    this._auth = value;
  }
  public get locale(): string {
    return this._locale;
  }
  public set locale(value: string) {
    this._locale = value;
  }
  public get httpProxy(): string {
    return this._httpProxy;
  }
  public set httpProxy(value: string) {
    this._httpProxy = value;
  }
  public get endpointLTIAgs(): string {
    return this._endpointLTIAgs;
  }
  public set endpointLTIAgs(value: string) {
    this._endpointLTIAgs = value;
  }
  public get endpoint(): string {
    return this._endpoint;
  }
  public set endpoint(value: string) {
    this._endpoint = value;
  }
  public get actorName(): string {
    return this._actorName;
  }
  public set actorName(value: string) {
    this._actorName = value;
  }
  public get actorMbox(): string {
    return this._actorMbox;
  }
  public set actorMbox(value: string) {
    this._actorMbox = value;
  }
  public get registration(): string {
    return this._registration;
  }
  public set registration(value: string) {
    this._registration = value;
  }
  public get activityId(): string {
    return this._activityId;
  }
  public set activityId(value: string) {
    this._activityId = value;
  }
  public get role(): RoleType {
    return this._role;
  }
  public set role(value: RoleType) {
    this._role = value;
  }
  public get id(): string {
    return this._id;
  }
  public set id(value: string) {
    this._id = value;
  }
  public get student_id(): string | undefined {
    return this._student_id;
  }
  public set student_id(value: string | undefined) {
    this._student_id = value;
  }
  public get courses(): [] {
    return this._courses;
  }
  public set courses(value: []) {
    this._courses = value;
  }
  public get age(): number | undefined {
    return this._age;
  }
  public set age(value: number | undefined) {
    this._age = value;
  }
  public get image(): string | undefined {
    return this._image;
  }
  public set image(value: string | undefined) {
    this._image = value;
  }
  public get name(): string {
    return this._name;
  }
  public set name(value: string) {
    this._name = value;
  }
  public get gender(): string | undefined {
    return this._gender;
  }
  public set gender(value: string | undefined) {
    this._gender = value;
  }
  public get board(): string | undefined {
    return this._board;
  }
  public set board(value: string | undefined) {
    this._board = value;
  }
  public get grade_id(): string | undefined {
    return this._grade_id;
  }
  public set grade_id(value: string | undefined) {
    this._grade_id = value;
  }
  public get curriculum(): string | undefined {
    return this._curriculum;
  }
  public set curriculum_id(value: string | undefined) {
    this._curriculum = value;
  }
  public get language_id(): string | undefined {
    return this._language_id;
  }
  public set language_id(value: string | undefined) {
    this._language_id = value;
  }
  public get sfx_off(): number | undefined {
    return this._sfx_off;
  }
  public set sfx_off(value: number | undefined) {
    this._sfx_off = value;
  }

  public get music_off(): number | undefined {
    return this._music_off;
  }
  public set music_off(value: number | undefined) {
    this._music_off = value;
  }

  public get avatar(): string | undefined {
    return this._avatar;
  }
  public set avatar(value: string | undefined) {
    this._avatar = value;
  }
  public get is_tc_accepted(): boolean | undefined {
    return this._is_tc_accepted;
  }
  public set is_tc_accepted(value: boolean | undefined) {
    this._is_tc_accepted = value;
  }

  public get rewards(): LeaderboardRewards | undefined {
    return this._rewards;
  }
  public set rewards(value: LeaderboardRewards | undefined) {
    this._rewards = value;
  }
  public get phone(): string | undefined {
    return this._phone;
  }
  public set phone(value: string | undefined) {
    this._phone = value;
  }
  public get email(): string | undefined {
    return this._email;
  }
  public set email(value: string | undefined) {
    this._email = value;
  }

  public toJson() {
    return {
      age: this.age ?? null,
      avatar: this.avatar ?? null,
      board: this.board ?? null,
      courses: this.courses,
      gender: this.gender ?? null,
      grade: this.grade_id ?? null,
      image: this.image ?? null,
      language_id: this.language_id ?? null,
      name: this.name,
      role: this.role,
      // uid: this.uid,
      is_tc_accepted: this.is_tc_accepted,
      sfx_off: this.sfx_off,
      music_off: this.music_off,
      // docId: this.docId,
    };
  }
}
