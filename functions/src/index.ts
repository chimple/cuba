import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import onResultDocCreate from "./triggerFunctions/onResultDocCreate";
import generateInviteCode from "./coludFunctions/generateInviteCode";
import getDataByInviteCode from "./coludFunctions/getDataByInviteCode";
import linkStudent from "./coludFunctions/linkStudent";
import cleanLeaderboard from "./triggerFunctions/cleanLeaderboard";

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

export const db = admin.firestore();

export const onResultCreate = functions.firestore
  .document("Result/{id}")
  .onCreate(onResultDocCreate);

export const GenerateInviteCode = functions.https.onCall(generateInviteCode);

export const GetDataByInviteCode = functions.https.onCall(getDataByInviteCode);

export const LinkStudent = functions.https.onCall(linkStudent);

export const CleanLeaderboard = functions.pubsub
  .schedule("0 0 * * 0")
  .timeZone("Asia/Kolkata")
  .onRun(async (context) => {
    await cleanLeaderboard();
  });
