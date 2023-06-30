import { Http } from "@capacitor-community/http";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Toast } from "@capacitor/toast";
import createFilesystem from "capacitor-fs";
import { unzip } from "zip2";
import {
  CURRENT_STUDENT,
  BUNDLE_URL,
  COURSES,
  CURRENT_LESSON_LEVEL,
  EVENTS,
  FCM_TOKENS,
  LANG,
  LANGUAGE,
  LAST_PERMISSION_CHECKED,
  LAST_UPDATE_CHECKED,
  PAGES,
  PortPlugin,
  PRE_QUIZ,
  SELECTED_GRADE,
  SL_GRADES,
  CURRENT_CLASS,
  CURRENT_SCHOOL,
} from "../common/constants";
import { Chapter, Course, Lesson } from "../interface/curriculumInterfaces";
import { GUIDRef } from "../interface/modelInterfaces";
import Result from "../models/result";
import { OneRosterApi } from "../services/api/OneRosterApi";
import User from "../models/user";
import { ServiceConfig } from "../services/ServiceConfig";
import i18n from "../i18n";
import { FirebaseAnalytics } from "@capacitor-firebase/analytics";
import { FirebaseMessaging } from "@capacitor-firebase/messaging";
import {
  DocumentData,
  DocumentReference,
  doc,
  getFirestore,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { Keyboard } from "@capacitor/keyboard";
import {
  AppUpdate,
  AppUpdateAvailability,
  AppUpdateResultCode,
} from "@capawesome/capacitor-app-update";
import Class from "../models/class";
import School from "../models/school";

export class schoolUtil {
  //   public static port: PortPlugin;

  public static getCurrentClass(): Class | undefined {
    const api = ServiceConfig.getI().apiHandler;
    if (!!api.currentClass) return api.currentClass;
    const temp = localStorage.getItem(CURRENT_CLASS);

    if (!temp) return;
    const currentClass = JSON.parse(temp) as Class;
    function getRef(ref): DocumentReference {
      const db = getFirestore();
      const newCourseRef = doc(
        db,
        ref["_key"].path.segments.at(-2),
        ref["_key"].path.segments.at(-1)
      );
      return newCourseRef;
    }

    function convertDoc(
      refs: DocumentReference<DocumentData>
    ): DocumentReference {
      const newCourseRef = getRef(refs);
      return newCourseRef;
    }

    if (!!currentClass.school)
      currentClass.school = convertDoc(currentClass.school);
    api.currentClass = currentClass;
    return currentClass;
  }
  public static setCurrentClass = async (currClass: Class) => {
    const api = ServiceConfig.getI().apiHandler;
    api.currentClass = currClass;

    localStorage.setItem(
      CURRENT_CLASS,
      JSON.stringify({
        name: currClass.name,
        image: currClass.image,
        classCode: currClass.classCode,
        school: currClass.school,
        courses: currClass.courses,
        description: currClass.description,
        parents: currClass.parents,
        students: currClass.students,
        teachers: currClass.teachers,
        principal: currClass.principal,
        coordinator: currClass.coordinator,
      })
    );
  };
  public static getCurrentSchool(): School | undefined {
    const api = ServiceConfig.getI().apiHandler;
    if (!!api.currentSchool) return api.currentSchool;
    const temp = localStorage.getItem(CURRENT_SCHOOL);

    if (!temp) return;
    const currentSchool = JSON.parse(temp) as School;
    function getRef(ref): DocumentReference {
      const db = getFirestore();
      const newCourseRef = doc(
        db,
        ref["_key"].path.segments.at(-2),
        ref["_key"].path.segments.at(-1)
      );
      return newCourseRef;
    }

    function convertDoc(
      refs: DocumentReference<DocumentData>
    ): DocumentReference {
      const newCourseRef = getRef(refs);
      return newCourseRef;
    }

    // if (!!currentClass.school)
    //   currentClass.school = convertDoc(currentClass.school);
    api.currentSchool = currentSchool;
    return currentSchool;
  }
  public static setCurrentSchool = async (currSchool: School) => {
    const api = ServiceConfig.getI().apiHandler;
    api.currentSchool = currSchool;

    localStorage.setItem(
      CURRENT_CLASS,
      JSON.stringify({
        name: currSchool.name,
        image: currSchool.image,
        courses: currSchool.courses,
        teachers: currSchool.teachers,
        principal: currSchool.principal,
        coordinator: currSchool.coordinator,
        dateLastModified: currSchool.dateLastModified,
        role: currSchool.role,
        createdAt: currSchool.createdAt,
        docId: currSchool.docId,
      })
    );
  };
}
