import { MenuItem, Select } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import './DropDown.css';
import { getTrackableProps, type TrackableId } from '../analytics/trackable';

const placeholderTextItem = 'placeholderText';
const DropDown: React.FC<{
  optionList: {
    id: string;
    displayName: string;
  }[];
  currentValue: string | undefined;
  onValueChange: (value: string) => void;
  placeholder: string | undefined;
  width: string;
  trackableId?: TrackableId;
  optionTrackableId?: TrackableId;
}> = ({
  optionList,
  currentValue = placeholderTextItem,
  onValueChange,
  width,
  placeholder,
  trackableId,
  optionTrackableId,
}) => {
  return (
    <Select
      className="dropdown-outer"
      sx={{
        color: currentValue === placeholderTextItem ? 'gray' : 'black',
        width: width,
        borderRadius: '0.8vw',
        fontFamily: 'BalooRegular',
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
      onChange={(evt: SelectChangeEvent<string>) => {
        onValueChange(evt.target.value);
      }}
      value={currentValue}
      {...(trackableId ? getTrackableProps(trackableId) : {})}
      MenuProps={{
        sx: { marginTop: '0.8vh' },
        PaperProps: {
          className: 'dropdown-inner',
          sx: {
            maxHeight: '36vh',
            OverflowY: 'scroll',
            borderRadius: '0.8vw',
            width: width,
            backgroundColor: '#e2dede',
          },
        },
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'center',
        },
        transformOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
      }}
    >
      {optionList.map((option, index) => (
        <MenuItem
          className="dropdown-item"
          sx={{ fontFamily: 'BalooRegular' }}
          key={index}
          value={option.id}
          {...(optionTrackableId ? getTrackableProps(optionTrackableId) : {})}
        >
          {option.displayName}
        </MenuItem>
      ))}
    </Select>
  );
};
export default DropDown;
