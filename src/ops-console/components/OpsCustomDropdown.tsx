import React from "react";
import {
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  FormHelperText,
} from "@mui/material";
import "./OpsCustomDropdown.css";

interface OpsCustomDropdownProps {
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  placeholder?: string;
}

const OpsCustomDropdown: React.FC<OpsCustomDropdownProps> = ({
  value,
  options,
  onChange,
  error = false,
  helperText,
  disabled = false,
  placeholder, // default placeholder
}) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value);
  };
  return (
    <FormControl error={error} disabled={disabled} className="ops-dropdown">
      <Select
        value={value}
        onChange={handleChange}
        className="ops-dropdown-select"
        displayEmpty
        MenuProps={{
          PaperProps: {
            className: "ops-dropdown-menu",
          },
        }}
      >
        <MenuItem value="" disabled>
          <span className="ops-dropdown-placeholder">{placeholder}</span>
        </MenuItem>
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default OpsCustomDropdown;
