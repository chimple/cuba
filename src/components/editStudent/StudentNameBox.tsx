import { t } from "i18next";
import "./StudentNameBox.css";
import TextField from "../common/TextField";

const StudentNameBox: React.FC<{
  studentName: string;
  onValueChange: (name: string) => void;
  onEnterDown: Function;
}> = ({ studentName, onValueChange, onEnterDown }) => {
  return (
    <div className="main-header">
      <div className="name-header">
        <div className="title">{t("Enter Child Name:")}</div>
        <TextField
          onChange={(evt) => onValueChange(evt.target.value)}
          value={studentName}
          onEnterDown={onEnterDown}
        ></TextField>
      </div>
    </div>
  );
};
export default StudentNameBox;
