import { FC, useState } from "react";
import Lesson from "../../../models/lesson";
import RecommendedAssignment from "./RecommendedAssignment";
import "./RecommendedTab.css";
import CommonButton from "../common/CommonButton";
import { t } from "i18next";

const RecommendedTab: FC<{
  lessons: Lesson[];
}> = ({ lessons }) => {
  enum STAGES {
    SUBJECTS,
  }
  const [stage, setStage] = useState(STAGES.SUBJECTS);
  return (
    <div className="recommendedTab">
      {stage === STAGES.SUBJECTS && lessons && (
        <div>
          <RecommendedAssignment infoText={t("These are the recommended assignments based on the previous assignments")} />
        </div>
      )}

      <CommonButton title={t("Assign")} disabled={false} onClicked={() => {}} />
    </div>
  );
};

export default RecommendedTab;
