import { MenuItem, Select } from "@mui/material";
import "./DropDown.css";

const placeholderTextItem = "placeholderText";
const DropDown: React.FC<{
  optionList: {
    id: string;
    displayName: string;
  }[];
  currentValue: string | undefined;
  onValueChange;
  placeholder: string | undefined;
  width: string;
}> = ({ optionList, currentValue = placeholderTextItem, onValueChange }) => {
  return (
    <Select
      className="dropdown-outer"
      onChange={(evt) => {
        onValueChange(evt.target);
      }}
      value={currentValue}
    >
      {optionList.map((option, index) => (
        <MenuItem
          className="dropdown-item"
          key={index}
          value={option.id}
        >
          {option.displayName}
        </MenuItem>
      ))}
    </Select>
  );
};
export default DropDown;
