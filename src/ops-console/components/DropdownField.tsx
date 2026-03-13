import React from "react";
import {
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";

interface Option {
  label: string;
  value: string;
}

interface DropdownProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[] | Option[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  openDirection?: "up" | "down";
  menuProps?: any;
}

const DropdownField: React.FC<DropdownProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Select",
  required = false,
  disabled = false,
  loading = false,
  openDirection = "down",
  menuProps = {},
}) => {
  const isObjectOptions = typeof options[0] === "object";
  const defaultMenuProps = {
    disablePortal: true,
    PaperProps: { style: { maxHeight: 300 } },
    anchorOrigin:
      openDirection === "up"
        ? { vertical: "bottom", horizontal: "center" }
        : { vertical: "top", horizontal: "center" },
    transformOrigin:
      openDirection === "up"
        ? { vertical: "top", horizontal: "center" }
        : { vertical: "bottom", horizontal: "center" },
  };

  return (
    <FormControl fullWidth size="small">
      <FormLabel sx={{ color: "#111827" }}>
        {label} {required && <span style={{ color: "red" }}>*</span>}
      </FormLabel>

      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        displayEmpty
        disabled={disabled || loading}
        renderValue={(selected) =>
          selected ? (
            isObjectOptions
              ? (options as Option[]).find((o) => o.value === selected)?.label
              : selected
          ) : (
            <span className="school-form-dropdown-placeholder">
              {placeholder}
            </span>
          )
        }
        MenuProps={{
          ...defaultMenuProps,
          ...menuProps,
        }}
      >
        {loading ? (
          <MenuItem disabled>
            <CircularProgress size={20} />
          </MenuItem>
        ) : isObjectOptions ? (
          (options as Option[]).map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))
        ) : (
          (options as string[]).map((opt) => (
            <MenuItem key={opt} value={opt}>
              {opt}
            </MenuItem>
          ))
        )}
      </Select>
    </FormControl>
  );
};

export default DropdownField;
