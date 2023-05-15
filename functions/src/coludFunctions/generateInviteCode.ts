import * as functions from "firebase-functions";
import { db } from "..";
import { DocumentSnapshot, QuerySnapshot } from "firebase-admin/firestore";
import { customAlphabet } from "nanoid/async";

const generateInviteCode = async (
  data: any,
  context: functions.https.CallableContext
) => {
  if (!data) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing Required Parameters"
    );
  }
  if (!data.classId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing Required Parameter sectionId"
    );
  }
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "unauthenticated user do not have permission to Generate Invite Code"
    );
  }
  const { studentId, classId } = data;
  const isClassCode = data.isClassCode ?? false;
  //TODO write rules
  //   const query = await db
  //     .collection("Connection")
  //     .where("__name__", "in", [
  //       "PR_" + schoolId,
  //       "CO_" + schoolId,
  //       "TE_" + schoolId,
  //     ])
  //     .where("roles", "array-contains", context.auth?.uid)
  //     .get();
  //   if (query.empty) {
  //     const adminQuery: FirebaseFirestore.QuerySnapshot = await db
  //       .collection("Roles")
  //       .where("__name__", "==", "Admin")
  //       .where("roles", "array-contains", context.auth?.uid)
  //       .get();
  //     if (adminQuery.empty) {
  //       throw new functions.https.HttpsError(
  //         "permission-denied",
  //         "user do not have permission to Generate Invite Code"
  //       );
  //     }
  //   }
  let sId: string;
  if (isClassCode) {
    sId = `Class/${classId}`;
  } else {
    if (!studentId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing Required Parameter studentId"
      );
    }
    sId = `User/${studentId}`;
  }
  const doc: DocumentSnapshot<FirebaseFirestore.DocumentData> = await db
    .doc(sId)
    .get();
  if (!doc.exists) {
    throw new functions.https.HttpsError("not-found", "invalid studentId");
  }
  const date = new Date();
  const ref = db.doc(sId);
  const response: QuerySnapshot<FirebaseFirestore.DocumentData> = await db
    .collection("InviteCode")
    .where("ref", "==", ref)
    .where("isClassCode", "==", isClassCode)
    .where("expireTime", ">", date)
    .get();
  let newCode;
  if (response.empty) {
    const newDate = new Date();
    if (isClassCode) {
      newDate.setFullYear(newDate.getFullYear() + 1);
    } else {
      newDate.setHours(newDate.getHours() + 168);
    }
    while (true) {
      const nanoid = customAlphabet("1234567890", 6);
      let tempCode = Number(await nanoid());
      if (tempCode.toString().length < 6) {
        const tempNanoid = customAlphabet(
          "1234567890",
          6 - tempCode.toString().length
        );
        tempCode = Number(tempCode + (await tempNanoid()));
      }
      newCode = Number(tempCode);
      const codeResponse: QuerySnapshot<FirebaseFirestore.DocumentData> =
        await db
          .collection("InviteCode")
          .where("code", "==", newCode)
          .where("expireTime", ">", date)
          .get();
      if (codeResponse.empty) {
        await db.collection("InviteCode").doc().set({
          ref: ref,
          isClassCode: isClassCode,
          code: newCode,
          expireTime: newDate,
        });
        break;
      }
    }
    return {
      code: newCode,
    };
  } else {
    return {
      code: response.docs[0].get("code"),
    };
  }
};
export default generateInviteCode;
