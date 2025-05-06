import React, { useEffect, useState } from "react";
import "./ExpandedTable.css";
import { ServiceConfig } from "../../../services/ServiceConfig";
import { ApiHandler } from "../../../services/api/ApiHandler";
import { SCORECOLOR } from "../../../common/constants";
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
  const result = {};

  for (const key of orderedDays) {
    for (const res of data[key]) {
      const { id,lesson_id, score, assignment_id } = res;

      // Fetch lesson details
      const lesson = await api.getLesson(lesson_id);
      const lessonName = lesson?.name ?? "";

      if (!result[id]) {
        result[id] = {
          name: lessonName,
          resultId:id,
          is_assignment: assignment_id != null,
          scoresByDay: orderedDays.reduce((acc, day) => {
            acc[day] = null;
            return acc;
          }, {}),
        };
      }

      // Update score for the specific day
      result[id].scoresByDay[key] = score;
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
    console.log(_lessonIdsByDay);
    setLessonIdsByDay(_lessonIdsByDay);
  };
  return (
    <>
      {Object.values(lessonIdsByDay).map((lesson: any, lessonIndex) => (
        <tr key={lessonIndex}>
          <td>
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
              style={{ color: getColor(lesson.scoresByDay[day]) }}
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
