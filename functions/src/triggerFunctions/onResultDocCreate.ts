import * as functions from "firebase-functions";
import { db } from "..";

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
  newData.last5Lessons[course.id] = newData.last5Lessons[course.id].slice(0, 5);

  await studentDocRef.set(newData);
};

export default onResultDocCreate;
