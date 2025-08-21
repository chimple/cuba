import React, { useEffect, useState, useCallback, useRef } from "react";
import { ServiceConfig } from "../services/ServiceConfig";
import {
  HOMEHEADERLIST,
  PAGES,
  TableTypes,
  LIVE_QUIZ,
} from "../common/constants";
import { useHistory } from "react-router";
import { Util } from "../utility/util";
import { t } from "i18next";
import LessonSlider from "../components/LessonSlider";
import "./LiveQuiz.css";
import SkeltonLoading from "../components/SkeltonLoading";

interface LiveQuizProps {
  liveQuizCount: (count: number) => void;
}

const LiveQuiz: React.FC<LiveQuizProps> = ({ liveQuizCount }) => {
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [liveQuizzes, setLiveQuizzes] = useState<TableTypes<"lesson">[]>([]);
  const [lessonResultMap, setLessonResultMap] = useState<{
    [lessonDocId: string]: TableTypes<"result">;
  }>();
  const [assignments, setAssignments] = useState<TableTypes<"assignment">[]>(
    []
  );
  const [currentClass, setCurrentClass] = useState<TableTypes<"class">>();
  const api = ServiceConfig.getI().apiHandler;
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const isMounted = useRef(true);


  const init = useCallback(async () => {
    setLoading(true);
    const student = Util.getCurrentStudent();
    if (!student) {
      history.replace(PAGES.SELECT_MODE);
      return;
    }

    const studentResult = await api.getStudentResultInMap(student.id);
    if (studentResult) {
      setLessonResultMap(studentResult);
    }

    const linkedData = await api.getStudentClassesAndSchools(student.id);
    if (!linkedData?.classes?.length) {
      setLoading(false);
      return;
    }

    const classDoc = linkedData.classes[0];
    setCurrentClass(classDoc);

    const quizChunks = await Promise.all(
      linkedData.classes.map((_class) =>
        api.getLiveQuizLessons(_class.id, student.id)
      )
    );
    const allLiveQuizzes = quizChunks.flat();
    allLiveQuizzes.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const lessonPromises = allLiveQuizzes.map((assignment) =>
      api.getLesson(assignment.lesson_id)
    );
    const resolvedLessons = await Promise.all(lessonPromises);
    const _lessons = resolvedLessons.filter(
      (lesson): lesson is TableTypes<"lesson"> => lesson !== null
    );

    setAssignments(allLiveQuizzes);
    liveQuizCount?.(allLiveQuizzes.length);
    setLiveQuizzes(_lessons);
    setLoading(false);
  }, [api, history]);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    isMounted.current = true;
    const student = Util.getCurrentStudent();
    if (!currentClass || !student) return;

    const handleQuizUpdate = () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        init();
      }, 1000); 
    };

    api.assignmentListner(currentClass.id, (payload) => {
      if (payload && payload.type === LIVE_QUIZ) {
        handleQuizUpdate();
      }
    });

    api.assignmentUserListner(student.id, async (assignmentUser) => {
      if (assignmentUser) {
        const assignment = await api.getAssignmentById(
          assignmentUser.assignment_id
        );
        if (isMounted.current && assignment && assignment.type === LIVE_QUIZ) {
          handleQuizUpdate();
        }
      }
    });

    return () => {
      isMounted.current = false;
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      api.removeAssignmentChannel();
    };
  }, [currentClass, init, api]);

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
