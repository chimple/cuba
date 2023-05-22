import * as functions from "firebase-functions";
import { db } from "..";
import { QuerySnapshot } from "firebase-admin/firestore";

const getDataByInviteCode = async (
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
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "unauthenticated user do not have permission to Generate Invite Code"
    );
  }
  const { inviteCode } = data;

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
  const ref = inviteCodeDoc.get("ref");
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
  return {
    data: JSON.parse(JSON.stringify(refDoc.data())),
    isClassCode: inviteCodeDoc.get("isClassCode"),
  };
};

export default getDataByInviteCode;
