import * as functions from "firebase-functions";
import { db } from "..";
import { DocumentReference, FieldValue } from "firebase-admin/firestore";

const onResultDocCreate = async (
  data: functions.firestore.QueryDocumentSnapshot,
  context: functions.EventContext<{
    id: string;
  }>
) => {
  const values = data.data();
  const course = values.course;
  const createdAt = values.createdAt;
  const lesson = values.lesson;
  const score = values.score;
  const student = values.student;
  const timeSpent = values.timeSpent;
  const assignment = values.assignment;
  const studentDocRef = db.collection("StudentProfile").doc(student.id);
  const studentDoc = await studentDocRef.get();
  let newStudentData: any = {};
  if (studentDoc.exists) {
    newStudentData = studentDoc.data();
  }
  if (!newStudentData.lessons) {
    newStudentData.lessons = {};
  }
  newStudentData.lessons[lesson.id] = {
    course: course,
    date: createdAt,
    score: score,
    timeSpent: timeSpent,
  };
  newStudentData.lastPlayedCourse = course;

  if (!!course) {
    const lastLesson = {
      date: createdAt,
      score: score,
      lesson: lesson,
    };

    if (!newStudentData.last5Lessons) {
      newStudentData.last5Lessons = {};
    }

    if (!newStudentData.last5Lessons[course.id]) {
      newStudentData.last5Lessons[course.id] = [];
    }

    newStudentData.last5Lessons[course.id].unshift(lastLesson);
    newStudentData.last5Lessons[course.id] = newStudentData.last5Lessons[
      course.id
    ].slice(0, 5);
  }

  await studentDocRef.set(newStudentData);

  if (!!newStudentData.classes && newStudentData.classes.length > 0) {
    const studentUserDocRef = db.collection("User").doc(student.id);
    const studentUserDoc = await studentUserDocRef.get();
    if (studentUserDoc.exists && !!studentUserDoc.data()) {
      for (let _classId of newStudentData.classes) {
        await updateClassLeaderboard(
          _classId,
          studentDocRef.id,
          studentUserDoc.get("name"),
          score,
          timeSpent
        );
      }
    }
  }

  if (!!assignment && assignment instanceof DocumentReference) {
    await assignment.update({
      completedStudents: FieldValue.arrayUnion(studentDocRef.id),
      ["results." + studentDocRef.id]: {
        date: createdAt,
        score: score,
      },
    });
  }
};

export default onResultDocCreate;

async function updateClassLeaderboard(
  classId: string,
  studentId: string,
  name: string,
  score: number,
  timeSpent: number
) {
  if (!timeSpent) return;
  const felids: any = {};
  felids[`d.${studentId}.w.s`] = FieldValue.increment(score);
  felids[`d.${studentId}.a.s`] = FieldValue.increment(score);
  felids[`d.${studentId}.w.l`] = FieldValue.increment(1);
  felids[`d.${studentId}.a.l`] = FieldValue.increment(1);
  felids[`d.${studentId}.w.t`] = FieldValue.increment(timeSpent);
  felids[`d.${studentId}.a.t`] = FieldValue.increment(timeSpent);
  felids[`d.${studentId}.n`] = name;
  felids[`u`] = FieldValue.serverTimestamp();

  try {
    await db.collection("Leaderboard").doc(classId).update(felids);
  } catch (e) {
    const error: any = e;
    if (error.code == 5) {
      const newFelids: any = {
        u: FieldValue.serverTimestamp(),
        d: {},
      };
      newFelids["d"][studentId] = {
        w: {
          s: score,
          l: 1,
          t: timeSpent,
        },
        a: {
          s: score,
          l: 1,
          t: timeSpent,
        },
        n: name,
      };
      await db
        .collection("Leaderboard")
        .doc(classId)
        .set(newFelids, { merge: true });
    } else {
      console.log(e);
    }
  }
}
