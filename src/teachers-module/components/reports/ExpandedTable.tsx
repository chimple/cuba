import React, { useEffect, useState } from "react";
import "./ExpandedTable.css";
import { ServiceConfig } from "../../../services/ServiceConfig";
import { ApiHandler } from "../../../services/api/ApiHandler";
import { LIDO_ASSESSMENT, SCORECOLOR } from "../../../common/constants";
interface ExpandedTableProps {
  expandedData;
}

function getColor(score) {
  if (score == null) {
    return SCORECOLOR.WHITE;
  } else if (score < 30) {
    return SCORECOLOR.RED;
  } else if (score >= 30 && score <= 70) {
    return SCORECOLOR.ORANGE;
  } else {
    return SCORECOLOR.GREEN;
  }
}
async function getLessonScoresByDay(data, api: ApiHandler) {
  const orderedDays = Object.keys(data);
  const result: Record<string, any> = {};

  for (const day of orderedDays) {
    for (const res of data[day]) {
      const { id, lesson_id, score, assignment_id } = res;

      const lesson = await api.getLesson(lesson_id);
      const lessonName = lesson?.name ?? "";

      // Use lesson_id as key for LIDO, id for COCOS
      const key = lesson?.plugin_type === LIDO_ASSESSMENT ? lesson_id : id;

      if (!result[key]) {
        result[key] = {
          name: lessonName,
          resultId: id,
          is_assignment: assignment_id != null,
          scoresByDay: orderedDays.reduce(
            (acc, d) => {
              acc[d] = null;
              return acc;
            },
            {} as Record<string, number | null>,
          ),
        };
      }

      if (lesson?.plugin_type === LIDO_ASSESSMENT) {
        // Aggregate all LIDO results for the same lesson on this day
        const allResultsForLessonOnDay = data[day].filter(
          (r) => r.lesson_id === lesson_id,
        );
        const totalScore = allResultsForLessonOnDay.reduce(
          (acc, r) => acc + (r.score ?? 0),
          0,
        );
        const avgScore = totalScore / allResultsForLessonOnDay.length;

        result[key].scoresByDay[day] = Math.round(avgScore);
      } else {
        // COCOS → keep each result separate
        result[key].scoresByDay[day] = score;
      }
    }
  }
  return result;
}

const ExpandedTable: React.FC<ExpandedTableProps> = ({ expandedData }) => {
  const [lessonIdsByDay, setLessonIdsByDay] = useState<{}>({});
  useEffect(() => {
    init();
  }, []);
  const api = ServiceConfig.getI().apiHandler;
  const init = async () => {
    const _lessonIdsByDay = await getLessonScoresByDay(expandedData, api);
    setLessonIdsByDay(_lessonIdsByDay);
  };
  return (
    <>
      {Object.values(lessonIdsByDay).map((lesson: any, lessonIndex) => (
        <tr key={lessonIndex}>
          <td style={{ backgroundColor: "#EFE8F8" }}>
            <div className="expanded-table-lesson-details">
              <span className="lesson-name-text">{lesson.name}</span>
              {
                <img
                  src={
                    lesson.is_assignment
                      ? "assets/icons/assignment.png"
                      : "assets/icons/self_played.png"
                  }
                  alt="assignment icon"
                  className="assignment-icon"
                />
              }
            </div>
          </td>
          {Object.keys(lesson.scoresByDay).map((day, dayIndex) => (
            <td
              key={dayIndex}
              className="square-cell"
              style={{
                color: getColor(lesson.scoresByDay[day]),
                backgroundColor: "#EFE8F8",
              }}
            >
              {lesson.scoresByDay[day] !== null
                ? `${lesson.scoresByDay[day]}`
                : "-"}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

export default ExpandedTable;
