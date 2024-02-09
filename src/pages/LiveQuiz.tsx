import React, { useEffect, useState } from "react";
import { ServiceConfig } from "../services/ServiceConfig";
import { HOMEHEADERLIST, PAGES } from "../common/constants";
import { useHistory } from "react-router";
import { Util } from "../utility/util";
import { StudentLessonResult } from "../common/courseConstants";
import Assignment from "../models/assignment";
import Lesson from "../models/lesson";
import { t } from "i18next";
import LessonSlider from "../components/LessonSlider";
import "./LiveQuiz.css";
import SkeltonLoading from "../components/SkeltonLoading";

const LiveQuiz: React.FC = () => {
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [liveQuizzes, setLiveQuizzes] = useState<Lesson[]>([]);
  const [lessonResultMap, setLessonResultMap] = useState<{
    [lessonDocId: string]: StudentLessonResult;
  }>();
  const api = ServiceConfig.getI().apiHandler;

  useEffect(() => {
    init();
  }, []);

  const init = async (fromCache: boolean = true) => {
    setLoading(true);
    const student = await Util.getCurrentStudent();
    if (!student) {
      history.replace(PAGES.SELECT_MODE);
      return;
    }

    const studentResult = await api.getStudentResult(student.docId);
    if (!!studentResult) {
      console.log("tempResultLessonMap = res;", studentResult.lessons);
      setLessonResultMap(studentResult.lessons);
    }

    const linked = await api.isStudentLinked(student.docId, fromCache);
    if (!linked) {
      setLoading(false);
      return;
    }

    if (
      !!studentResult &&
      !!studentResult.classes &&
      studentResult.classes.length > 0
    ) {
      const classId = studentResult.classes[0];
      const allLiveQuizzes: Assignment[] = [];
      await Promise.all(
        studentResult.classes.map(async (_class) => {
          const res = await api.getLiveQuizLessons(classId, student.docId);
          allLiveQuizzes.push(...res);
        })
      );
      const _lessons: Lesson[] = [];
      await Promise.all(
        allLiveQuizzes.map(async (_assignment) => {
          const res = await api.getLesson(
            _assignment.lesson.id,
            undefined,
            true,
            _assignment
          );
          if (!!res) {
            res.assignment = _assignment;
            _lessons.push(res);
          }
        })
      );

      setLiveQuizzes(_lessons);
      setLoading(false);
    } else {
      setLoading(false);
      return;
    }
  };

  return (
    <div>
      {loading ? (
        <SkeltonLoading isLoading={loading} header={HOMEHEADERLIST.LIVEQUIZ} />
      ) : (
        <div>
          {liveQuizzes.length > 0 ? (
            <div>
              <LessonSlider
                lessonData={liveQuizzes}
                isHome={true}
                course={undefined}
                lessonsScoreMap={lessonResultMap || {}}
                startIndex={0}
                showSubjectName={true}
                showChapterName={true}
              />
            </div>
          ) : (
            <div className="pending-live-quiz">
              {t("You do not have any live quizzes available.")}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default LiveQuiz;
