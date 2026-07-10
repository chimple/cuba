import {
  CURRENT_CLASS,
  CURRENT_MODE,
  CURRENT_SCHOOL,
  CURRENT_USER,
  MODES,
  PAGES,
  SCHOOL_LOGIN,
  TableTypes,
} from "../common/constants";
import { ServiceConfig } from "../services/ServiceConfig";
import { Util } from "./util";

export class schoolUtil {
  //   public static port: PortPlugin;

  public static getCurrentClass(): TableTypes<"class"> | undefined {
    const api = ServiceConfig.getI().apiHandler;
    if (!!api.currentClass) return api.currentClass;
    const temp = localStorage.getItem(CURRENT_CLASS);

    if (!temp) return;
    try {
      const currentClass = JSON.parse(temp) as TableTypes<"class">;
      // function getRef(ref): DocumentReference {
      //   const db = getFirestore();
      //   const newCourseRef = doc(
      //     db,
      //     ref["_key"].path.segments.at(-2),
      //     ref["_key"].path.segments.at(-1)
      //   );
      //   return newCourseRef;
      // }

      // function convertDoc(
      //   refs: DocumentReference<DocumentData>
      // ): DocumentReference {
      //   const newCourseRef = getRef(refs);
      //   return newCourseRef;
      // }

      // if (!!currentClass.school)
      //   currentClass.school = convertDoc(currentClass.school);
      // api.currentClass = currentClass;
      return currentClass;
    } catch (error) {
      console.error("Failed to parse CURRENT_SCHOOL from localStorage:", error);
      return undefined;
    }
  }

  public static setCurrentClass = async (
    currClass: TableTypes<"class"> | undefined
  ) => {
    const api = ServiceConfig.getI().apiHandler;
    api.currentClass = currClass;

    localStorage.setItem(
      CURRENT_CLASS,
      JSON.stringify(currClass)
      // JSON.stringify({
      //   name: currClass.name,
      //   image: currClass.image,
      //   classCode: currClass.classCode,
      //   school: currClass.school,
      //   courses: currClass.courses,
      //   description: currClass.description,
      //   parents: currClass.parents,
      //   students: currClass.students,
      //   teachers: currClass.teachers,
      //   principal: currClass.principal,
      //   coordinator: currClass.coordinator,
      // })
    );
  };
  public static removeCurrentClass = () => {
    const api = ServiceConfig.getI().apiHandler;
    api.currentClass = undefined;
    localStorage.removeItem(CURRENT_CLASS);
  };
  public static getCurrentSchool(): TableTypes<"school"> | undefined {
    const api = ServiceConfig.getI().apiHandler;
    if (!!api.currentSchool) return api.currentSchool;
    const temp = localStorage.getItem(CURRENT_SCHOOL);

    if (!temp) return;
    const currentSchool = JSON.parse(temp) as TableTypes<"school">;
    // function getRef(ref): DocumentReference {
    //   const db = getFirestore();
    //   const newCourseRef = doc(
    //     db,
    //     ref["_key"].path.segments.at(-2),
    //     ref["_key"].path.segments.at(-1)
    //   );
    //   return newCourseRef;
    // }

    // function convertDoc(
    //   refs: DocumentReference<DocumentData>
    // ): DocumentReference {
    //   const newCourseRef = getRef(refs);
    //   return newCourseRef;
    // }

    // // if (!!currentClass.school)
    // //   currentClass.school = convertDoc(currentClass.school);
    // api.currentSchool = currentSchool;
    return currentSchool;
  }
  public static setCurrentSchool = async (currSchool: TableTypes<"school">) => {
    const api = ServiceConfig.getI().apiHandler;
    api.currentSchool = currSchool;

    localStorage.setItem(
      CURRENT_SCHOOL,
      JSON.stringify(currSchool)
      // JSON.stringify({
      //   name: currSchool.name,
      //   image: currSchool.image,
      //   courses: currSchool.courses,
      //   teachers: currSchool.teachers,
      //   principal: currSchool.principal,
      //   coordinator: currSchool.coordinator,
      //   updatedAt: currSchool.updatedAt,
      //   role: currSchool.role,
      //   createdAt: currSchool.createdAt,
      //   docId: currSchool.docId,
      // })
    );
  };

  public static async getCurrMode(): Promise<MODES | undefined> {
    const api = ServiceConfig.getI().apiHandler;
    const auth = ServiceConfig.getI().authHandler;

    if (!!api.currentMode) return api.currentMode;
    const currMode = localStorage.getItem(CURRENT_MODE);
    if (!currMode) {
      const currUser = await auth.getCurrentUser();
      if (!currUser) return undefined;
      const allSchool = await api.getSchoolsForUser(currUser.id);
      if (!allSchool || allSchool.length < 1) {
        this.setCurrMode(MODES.PARENT);
        return MODES.PARENT;
      } else {
        this.setCurrMode(MODES.SCHOOL);
        return MODES.SCHOOL;
      }
    }
    const tempMode: MODES = MODES[currMode as keyof typeof MODES];
    api.currentMode = tempMode;
    return tempMode;
  }
  public static setCurrMode = async (currMode: MODES) => {
    const api = ServiceConfig.getI().apiHandler;
    api.currentMode = currMode;
    localStorage.setItem(CURRENT_MODE, currMode);
  };

  public static async trySchoolRelogin(): Promise<boolean> {
    try {
      const currentMode = localStorage.getItem(CURRENT_MODE);
      if (currentMode !== MODES.SCHOOL) return false;
      const savedSchoolData = localStorage.getItem(SCHOOL_LOGIN);
      if (!savedSchoolData) return false;
      const credentials = await Util.decryptData(savedSchoolData);
      if (!credentials || !credentials.email || !credentials.password)
        return false;
      const authInstance = ServiceConfig.getI().authHandler;
      const result = await authInstance.loginWithEmailAndPassword(
        credentials.email,
        credentials.password
      );
      if (result) {
        localStorage.setItem(CURRENT_USER, JSON.stringify(result));
        window.history.replaceState(
          window.history.state,
          "",
          PAGES.SELECT_MODE.toString()
        );

        return true;
      } else {
        console.warn("User not found. Please verify your credentials.");
        window.history.replaceState(
          window.history.state,
          "",
          PAGES.LOGIN.toString()
        );
        return false;
      }
    } catch (error) {
      console.error("Login unsuccessful. Please try again later.", error);
      return false;
    }
  }
}
