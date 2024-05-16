import {
  CURRENT_CLASS,
  CURRENT_MODE,
  CURRENT_SCHOOL,
  MODES,
  TableTypes,
} from "../common/constants";
import { ServiceConfig } from "../services/ServiceConfig";

export class schoolUtil {
  //   public static port: PortPlugin;

  public static getCurrentClass(): TableTypes<"class"> | undefined {
    const api = ServiceConfig.getI().apiHandler;
    if (!!api.currentClass) return api.currentClass;
    const temp = localStorage.getItem(CURRENT_CLASS);

    if (!temp) return;
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
  }
  public static setCurrentClass = async (currClass: TableTypes<"class">) => {
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
    console.log(currMode);
    if (!currMode) {
      const currUser = await auth.getCurrentUser();
      if (!currUser) return undefined;
      const allSchool = await api.getSchoolsForUser(currUser.id);
      if (!allSchool || allSchool.length < 1) {
        api.currentMode = MODES.PARENT;
        return MODES.PARENT;
      } else {
        api.currentMode = MODES.SCHOOL;
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
}
