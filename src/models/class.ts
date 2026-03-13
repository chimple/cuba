import BaseObject from "./baseObject";
import { DocumentReference, Timestamp } from "firebase/firestore";

export default class Class extends BaseObject {
  private _name: string;
  private _image: string | undefined;
  private _classCode: string;
  private _school: DocumentReference;
  private _courses: string[];
  private _description: string;
  private _parents: string[];
  private _students: string[];
  private _teachers: string[];
  private _principal: string[];
  private _coordinator: string[];

  constructor(
    name: string,
    image: string | undefined,
    classCode: string,
    school: DocumentReference,
    courses: string[],
    description: string,
    parents: string[],
    students: string[],
    teachers: string[],
    principal: string[],
    coordinator: string[],
    updatedAt: Timestamp,
    createdAt: Timestamp,
    docId: string
  ) {
    super(updatedAt, createdAt, docId);
    this._name = name;
    this._image = image;
    this._classCode = classCode;
    this._school = school;
    this._courses = courses;
    this._description = description;
    this._parents = parents;
    this._students = students;
    this._teachers = teachers;
    this._principal = principal;
    this._coordinator = coordinator;
  }

  public get school(): DocumentReference {
    return this._school;
  }
  public set school(value: DocumentReference) {
    this._school = value;
  }
  public get courses(): string[] {
    return this._courses;
  }
  public set courses(value: string[]) {
    this._courses = value;
  }
  public get description(): string {
    return this._description;
  }
  public set description(value: string) {
    this._description = value;
  }
  public get parents(): string[] {
    return this._parents;
  }
  public set parents(value: string[]) {
    this._parents = value;
  }
  public get students(): string[] {
    return this._students;
  }
  public set students(value: string[]) {
    this._students = value;
  }
  public get teachers(): string[] {
    return this._teachers;
  }
  public set teachers(value: string[]) {
    this._teachers = value;
  }
  public get principal(): string[] {
    return this._principal;
  }
  public set principal(value: string[]) {
    this._principal = value;
  }
  public get coordinator(): string[] {
    return this._coordinator;
  }
  public set coordinator(value: string[]) {
    this._coordinator = value;
  }
  public get name(): string {
    return this._name;
  }
  public set name(value: string) {
    this._name = value;
  }
  public get classCode(): string {
    return this._classCode;
  }
  public set classCode(value: string) {
    this._classCode = value;
  }
  public get image(): string | undefined {
    return this._image;
  }
  public set image(value: string | undefined) {
    this._image = value;
  }
}
