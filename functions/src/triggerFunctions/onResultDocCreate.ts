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
  let newData: any = {};
  if (studentDoc.exists) {
    newData = studentDoc.data();
  }
  if (!newData.lessons) {
    newData.lessons = {};
  }
  newData.lessons[lesson.id] = {
    course: course,
    date: createdAt,
    score: score,
    timeSpent: timeSpent,
  };
  newData.lastPlayedCourse = course;

  if (!!course) {
    const lastLesson = {
      date: createdAt,
      score: score,
      lesson: lesson,
    };

    if (!newData.last5Lessons) {
      newData.last5Lessons = {};
    }

    if (!newData.last5Lessons[course.id]) {
      newData.last5Lessons[course.id] = [];
    }

    newData.last5Lessons[course.id].unshift(lastLesson);
    newData.last5Lessons[course.id] = newData.last5Lessons[course.id].slice(
      0,
      5
    );
  }

  await studentDocRef.set(newData);

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
