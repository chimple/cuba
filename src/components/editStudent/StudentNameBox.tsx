import { t } from "i18next";
import "./StudentNameBox.css";

const StudentNameBox: React.FC<{
  studentName: string;
  onValueChange: (name: string) => void;
}> = ({ studentName, onValueChange }) => {
  return (
    <div className="main-header">
      <div className="name-header">
        <div className="title">{t("Enter Child Name:")}</div>
        <input
          onChange={(evt) => onValueChange(evt.target.value)}
          className="text-box"
          type="text"
          value={studentName}
        ></input>
      </div>
    </div>
  );
};
export default StudentNameBox;
