import * as functions from "firebase-functions";
import { db } from "..";
import {
  DocumentReference,
  FieldValue,
  QuerySnapshot,
} from "firebase-admin/firestore";

const linkStudent = async (
  data: any,
  context: functions.https.CallableContext
) => {
  if (!data) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing Required Parameters"
    );
  }
  if (!data.inviteCode) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing Required Parameter inviteCode"
    );
  }
  if (!data.studentId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing Required Parameter studentId"
    );
  }
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "unauthenticated user do not have permission to Generate Invite Code"
    );
  }
  const { inviteCode, studentId } = data;
  const parentId = context.auth.uid;
  const studentRef = db.collection("User").doc(studentId);
  const studentDoc = await studentRef.get();
  if (!studentDoc.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      "Student Document not Found"
    );
  }
  const date = new Date();
  const response: QuerySnapshot<FirebaseFirestore.DocumentData> = await db
    .collection("InviteCode")
    .where("expireTime", ">", date)
    .where("code", "==", inviteCode)
    .get();
  if (response.size !== 1) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid inviteCode"
    );
  }
  const inviteCodeDoc = response.docs[0];
  const ref: DocumentReference = inviteCodeDoc.get("ref");
  if (!ref) {
    throw new functions.https.HttpsError(
      "not-found",
      "Class/Student Reference not Found"
    );
  }
  const refDoc = await ref.get();
  if (!refDoc) {
    throw new functions.https.HttpsError(
      "not-found",
      "Class/Student Reference Document not Found"
    );
  }
  const isClassCode = inviteCodeDoc.get("isClassCode");
  if (!isClassCode) {
    throw new functions.https.HttpsError(
      "unimplemented",
      "Student Invite code is not implemented"
    );
  }

  const batch = db.batch();
  batch.set(
    db.collection("ClassConnection").doc("PT_" + ref.id),
    {
      roles: FieldValue.arrayUnion(parentId),
    },
    { merge: true }
  );
  batch.set(
    db.collection("ClassConnection").doc("ST_" + ref.id),
    {
      roles: FieldValue.arrayUnion(studentId),
    },
    { merge: true }
  );
  batch.set(
    db.collection("StudentProfile").doc(studentId),
    {
      classes: FieldValue.arrayUnion(ref.id),
      schools: FieldValue.arrayUnion(refDoc.get("school")?.id),
    },
    { merge: true }
  );
  await batch.commit();
  return { link: true };
};

export default linkStudent;
