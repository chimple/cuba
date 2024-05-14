import { FC, useState } from "react";
import AssignButton from "./AssignButton";
import Lesson from "../../../models/lesson";
import RecommendedAssignment from "./RecommendedAssignment";
import "./RecommendedTab.css"

const RecommendedTab: FC<{
  lessons: Lesson[];
}> = ({ lessons }) => {
  enum STAGES {
    SUBJECTS,
  }
  const [stage, setStage] = useState(STAGES.SUBJECTS);
  return (
    <div className="recommendedTab"
    >
      {stage === STAGES.SUBJECTS && lessons && (
        <div>
          <RecommendedAssignment infoText="These are the recommended assignments based on the previous assignments" />
        </div>
      )}

      <AssignButton disabled={false} onClicked={() => {}} />
    </div>
  );
};

export default RecommendedTab;
