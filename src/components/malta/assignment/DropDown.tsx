import { MenuItem, Select } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import './DropDown.css';

const placeholderTextItem = 'select';

interface DropDownProps {
  optionList: {
    id: string;
    displayName: string;
  }[];
  currentValue: string | undefined;
  onValueChange: (value: string) => void;
  placeholder: string | undefined;
  width: string;
}
const DropDown: React.FC<DropDownProps> = ({
  optionList,
  currentValue = placeholderTextItem,
  onValueChange,
  placeholder,
}) => {
  return (
    <Select
      className="dropdown-outer"
      onChange={(evt: SelectChangeEvent<string>) => {
        onValueChange(evt.target.value);
      }}
      value={currentValue}
    >
      <MenuItem hidden={true} value={placeholderTextItem}>
        {placeholder}
      </MenuItem>
      {optionList.map((option, index) => (
        <MenuItem className="dropdown-item" key={index} value={option.id}>
          {option.displayName}
        </MenuItem>
      ))}
    </Select>
  );
};
export default DropDown;
