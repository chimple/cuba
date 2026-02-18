import React, { useEffect, useState } from "react";
import "react-circular-progressbar/dist/styles.css";
import "./DashBoardStudentProgress.css"; // Import the CSS file
import {
  BANDWISECOLOR,
  LIDO_ASSESSMENT,
  TableTypes,
} from "../../../common/constants";
import { t } from "i18next";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import { ServiceConfig } from "../../../services/ServiceConfig";

interface DashBoardStudentProgresProps {
  studentProgress: Map<string, TableTypes<"user"> | TableTypes<"result">[]>;
}
type AggregatedResult = {
  lessonId: string;
  chapterId?: string | null;
  totalScore: number;
  count: number;
};
const DashBoardStudentProgres: React.FC<DashBoardStudentProgresProps> = ({
  studentProgress,
}) => {
  const [results, setResults] = useState<Map<string, string>[]>();

  const api = ServiceConfig.getI().apiHandler;
  const student = studentProgress.get("student") as TableTypes<"user">;

  useEffect(() => {
    init();
  }, []);
  const init = async () => {
    const resultList = studentProgress.get("results") as TableTypes<"result">[];
    if (!resultList || resultList.length === 0) {
      setResults([]);
      return;
    }

    const finalResults: Map<string, string>[] = [];

    for (const result of resultList) {
      if (!result.lesson_id) continue;
      try {
        const lesson = await api.getLesson(result.lesson_id);
        let finalScore = result.score ?? 0;

        // LIDO → aggregate all results for this lesson
        if (lesson?.plugin_type === LIDO_ASSESSMENT) {
          const allResultsForLesson = resultList.filter(
            (r) => r.lesson_id === result.lesson_id,
          );
          const totalScore = allResultsForLesson.reduce(
            (acc, r) => acc + (r.score ?? 0),
            0,
          );
          finalScore = totalScore / allResultsForLesson.length;
        }

        const _res = new Map<string, string>();
        _res.set("score", Math.round(finalScore).toString());
        _res.set("lesson", lesson?.name ?? "");
        let chapterName = "";
        const chapterId = result.chapter_id;
        if (chapterId) {
          const chapter = await api.getChapterById(chapterId);
          if (chapter?.name) chapterName = chapter.name;
        }
        _res.set("chapterName", chapterName);
        finalResults.push(_res);
      } catch (error) {
        console.error(`Error fetching lesson for ${result.lesson_id}:`, error);
      }
    }

    setResults(finalResults);
  };

  return (
    <div className="dashboard-student-progress-container">
      <div className="dashboard-student-avatar-container" key={"avatar"}>
        <img
          src={student?.image || `assets/avatars/${student?.avatar}.png`}
          alt="Profile"
          className="dashboard-avatar"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `assets/avatars/${student?.avatar}.png`;
          }}
        />
        <span className="dashboard-avatar-name">{student?.name}</span>
      </div>

      <div className="dashboard-score-container">
        <div className="dashboard-score-content">
          {results?.map((result, index) => (
            <div className="student-score-container" key={index}>
              <div className="student-score">
                <CircularProgressbar
                  className="circularProgressbar"
                  value={parseInt(result.get("score") ?? "0", 10)}
                  text={result.get("score") ?? "0"}
                  styles={buildStyles({
                    pathColor:
                      parseInt(result.get("score") ?? "0", 10) >= 70
                        ? "green"
                        : parseInt(result.get("score") ?? "0", 10) <= 49
                          ? "red"
                          : "orange",
                    trailColor: "#f1f1f1",
                    textColor: "#333",
                    textSize: "20px",
                  })}
                />
              </div>
              <span className="lesson-chapter-name">
                {result.get("lesson")!.length > 8
                  ? result.get("lesson")
                  : result.get("lesson")}
                {}
              </span>
              <span className="lesson-chapter-name">
                {result.get("chapterName")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashBoardStudentProgres;
