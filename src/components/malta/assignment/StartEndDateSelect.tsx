import { t } from "i18next";
import "./StartEndDateSelect.css";
import DateTimePicker from "./DateTimePicker";
import { FC } from "react";

interface StartEndDateSelectProps {
  startDate: string;
  endDate: string;
}

const StartEndDateSelect: FC<StartEndDateSelectProps> = ({
  startDate,
  endDate,
}) => {
  return (
    <>
      <div className="datePicker">
        <div className="datetextdiv">
          {t("Start Date")}
          <DateTimePicker date={startDate} />
        </div>
        <div className="datetextdiv">
          {t("End Date")}
          <DateTimePicker date={endDate} />
        </div>
      </div>
    </>
  );
};
export default StartEndDateSelect;
