import React, { useEffect, useState } from "react";
import { ServiceConfig } from "../services/ServiceConfig";
import { HOMEHEADERLIST, PAGES, TableTypes } from "../common/constants";
import { useHistory } from "react-router";
import { Util } from "../utility/util";
import { StudentLessonResult } from "../common/courseConstants";
import { t } from "i18next";
import LessonSlider from "../components/LessonSlider";
import "./LiveQuiz.css";
import SkeltonLoading from "../components/SkeltonLoading";

const LiveQuiz: React.FC = () => {
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [liveQuizzes, setLiveQuizzes] = useState<TableTypes<"lesson">[]>([]);
  const [lessonResultMap, setLessonResultMap] = useState<{
    [lessonDocId: string]: TableTypes<"result">;
  }>();
  const [assignments, setAssignments] = useState<TableTypes<"assignment">[]>(
    []
  );
  const api = ServiceConfig.getI().apiHandler;

  useEffect(() => {
    init();
  }, []);

  const init = async (fromCache: boolean = true) => {
    setLoading(true);
    const student = Util.getCurrentStudent();
    if (!student) {
      history.replace(PAGES.SELECT_MODE);
      return;
    }

    const studentResult = await api.getStudentResultInMap(student.id);

    if (!!studentResult) {
      console.log("tempResultLessonMap = res;", studentResult);
      setLessonResultMap(studentResult);
    }

    const linked = await api.isStudentLinked(student.id, fromCache);
    if (!linked) {
      setLoading(false);
      return;
    }
    const linkedData = await api.getStudentClassesAndSchools(student.id);

    if (!!linkedData && !!linkedData.classes && linkedData.classes.length > 0) {
      const classId = linkedData.classes[0];
      const allLiveQuizzes: TableTypes<"assignment">[] = [];
      await Promise.all(
        linkedData.classes.map(async (_class) => {
          const res = await api.getLiveQuizLessons(classId.id, student.id);
          allLiveQuizzes.push(...res);
        })
      );
      setAssignments(allLiveQuizzes);
      const _lessons: TableTypes<"lesson">[] = [];
      await Promise.all(
        allLiveQuizzes.map(async (_assignment) => {
          const res = await api.getLesson(_assignment.lesson_id);
          if (!!res) {
            // res.assignment = _assignment;
            _lessons.push(res);
          }
        })
      );
      console.log("all the live quizzes...", _lessons);
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
                assignments={assignments}
                showDate={true}
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
