import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import onResultDocCreate from "./triggerFunctions/onResultDocCreate";

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

export const db = admin.firestore();

export const onResultCreate = functions.firestore
  .document("Result/{id}")
  .onCreate(onResultDocCreate);
