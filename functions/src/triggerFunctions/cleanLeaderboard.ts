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
    batchArray[batchIndex].update(doc.ref, { d: data });
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

export default cleanLeaderboard;
