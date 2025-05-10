import React, { useEffect, useState } from "react";
import "react-circular-progressbar/dist/styles.css";
import "./DashBoardStudentProgress.css"; // Import the CSS file
import { BANDWISECOLOR, TableTypes } from "../../../common/constants";
import { t } from "i18next";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import { ServiceConfig } from "../../../services/ServiceConfig";

interface DashBoardStudentProgresProps {
  studentProgress: Map<string, TableTypes<"user"> | TableTypes<"result">[]>;
}

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
    const promises = resultList.map(async (result) => {
      // console.log(result);
      const _res = new Map<string, string>();
      try {
        const lesson = await api.getLesson(result.lesson_id ?? "");
        _res.set("score", result.score?.toString() ?? "0");
        _res.set("lesson", lesson?.name ?? "");
        const chapterId = result.chapter_id;
        var chapterName = "";
        if (chapterId != null) {
          const chapter = await api.getChapterById(chapterId);
          if(chapter !== undefined && chapter.name !== null) {
            chapterName = chapter.name;
          }
        }
        _res.set("chapterName",  chapterName);
      } catch (error) {
        console.error(`Error fetching lesson for ${result.lesson_id}:`, error);
      }
      return _res;
    });
    const _result = await Promise.all(promises);
    setResults(_result);
  };

  return (
    <div className="dashboard-student-progress-container">
      <div className="dashboard-student-avatar-container" key={"avatar"}>
        <img
          src={student?.image ?? ""}
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
              <span className="lesson-chapter-name">{result.get("chapterName")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashBoardStudentProgres;
