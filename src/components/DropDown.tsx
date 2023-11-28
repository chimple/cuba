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
}> = ({ optionList, currentValue = placeholderTextItem, onValueChange, width, placeholder }) => {
  return (
    <Select

      className="dropdown-outer"
      sx={{
        color: currentValue === placeholderTextItem ? "gray" : "black",
        width: width,
        borderRadius: "0.8vw",
        fontFamily: "BalooRegular",
        '.MuiOutlinedInput-notchedOutline': {
          borderColor: 'gray',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: 'gray',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: 'gray',
        },
      }}
      variant="outlined"
      onChange={(evt) => {
        onValueChange(evt.target.value);
      }}
      value={currentValue}
      MenuProps={{
        sx: { marginTop: "0.8vh", },
        PaperProps: {
          className: "dropdown-inner",
          sx: {
            maxHeight: "36vh",
            OverflowY: "scroll",
            borderRadius: "0.8vw",
            width: width,
            backgroundColor: "#e2dede",
          }
        },
        anchorOrigin: {
          vertical: "bottom",
          horizontal: "center"
        },
        transformOrigin: {
          vertical: "top",
          horizontal: "center"
        },
      }
      }
    >
      <MenuItem hidden={true} value={placeholderTextItem} >
        {placeholder}
      </MenuItem>

      {optionList.map((option, index) => (

        <MenuItem className="dropdown-item" sx={{ fontFamily: "BalooRegular", }} key={index} value={option.id}>
          {option.displayName}
        </MenuItem>
      ))}

    </Select>

  );
};
export default DropDown;
