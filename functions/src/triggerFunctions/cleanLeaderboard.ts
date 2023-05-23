import { FieldValue } from "firebase-admin/firestore";
import { db } from "..";

async function cleanLeaderboard() {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  const leaderboards = await db
    .collection("Leaderboard")
    .where("u", ">=", date)
    .get();
  const batchArray = [];
  batchArray.push(db.batch());
  let operationCounter = 0;
  let batchIndex = 0;
  for (const doc of leaderboards.docs) {
    const data = doc.get("d");
    for (const id of Object.keys(data)) {
      data[id]["w"] = {
        s: 0,
        l: 0,
        t: 0,
      };
    }
    batchArray[batchIndex].update(doc.ref, {
      d: data,
      u: FieldValue.serverTimestamp(),
    });
    operationCounter++;
    if (operationCounter === 499) {
      batchArray.push(db.batch());
      batchIndex++;
      operationCounter = 0;
    }
  }
  for (const batch of batchArray) {
    await batch.commit();
  }
  await cleanGenericLeaderboard();
}

export default cleanLeaderboard;

async function cleanGenericLeaderboard() {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  const leaderboards = await db
    .collection("Leaderboard")
    .doc("b2c")
    .collection("genericLeaderboard")
    .where("updatedAt", ">=", date)
    .get();
  const batchArray = [];
  batchArray.push(db.batch());
  let operationCounter = 0;
  let batchIndex = 0;
  for (const doc of leaderboards.docs) {
    batchArray[batchIndex].update(doc.ref, {
      weeklyLessonPlayed: 0,
      weeklyScore: 0,
      weeklyTimeSpent: 0,
      updatedAt: FieldValue.serverTimestamp(),
    });
    operationCounter++;
    if (operationCounter === 499) {
      batchArray.push(db.batch());
      batchIndex++;
      operationCounter = 0;
    }
  }
  for (const batch of batchArray) {
    await batch.commit();
  }
}
