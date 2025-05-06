import React from "react";
import { MenuItem, Select, SelectChangeEvent } from "@mui/material";
import "./imageDropdown.css";

interface DropdownOption {
  id: string | number;
  name: string;
  icon?: string; // Optional image URL
  subjectDetail?: string;
}

interface ImageDropdownProps {
  options: DropdownOption[];
  selectedValue: DropdownOption;
  onOptionSelect: (selected: DropdownOption) => void;
  placeholder?: string;
  isDownBorder?: boolean;
}

const splitText = (name: string, subjectDetail?: string) => {
  // Split subjectDetail into parts by the first space after the subject
  const subjectDetailParts = subjectDetail?.split(name)?.[1]?.trim();
  return {
    subject: name.trim(),
    grade: subjectDetailParts || "",
  };
};

const ImageDropdown: React.FC<ImageDropdownProps> = ({
  options,
  selectedValue,
  onOptionSelect,
  placeholder = "Select an option",
  isDownBorder = true,
}) => {
  const handleChange = (event: SelectChangeEvent<string | number>) => {
    const selectedOption = options.find(
      (option) => option.id === event.target.value
    );
    if (selectedOption) {
      onOptionSelect(selectedOption);
    }
  };

  return (
    <div
      className="imageDropdown-container"
      style={{ borderBottom: isDownBorder ? "0.2vh solid #333" : "none" }}
    >
      <Select
        value={selectedValue?.id || ""}
        onChange={handleChange}
        displayEmpty
        MenuProps={{
          PaperProps: {
            sx: {
              "& .MuiList-root": {
                listStyle: "none",
                margin: 0,
                padding: 0,
                position: "relative",
                outline: 0,
              },
            },
          },
        }}
        renderValue={(value) =>
          selectedValue?.id ? (
            <div className="selected-value">
              {selectedValue.icon && (
                <img
                  src={selectedValue.icon}
                  alt={selectedValue.name}
                  className="dropdown-icon"
                />
              )}
              <span>{selectedValue.name}</span>
            </div>
          ) : (
            <div className="placeholder">
              <img
                src={options[0]?.icon || ""}
                alt="placeholder-icon"
                className="dropdown-icon"
              />
              <span>{placeholder}</span>
            </div>
          )
        }
        className="imageDropdown-select"
        sx={{
          boxShadow: "none",
          ".MuiOutlinedInput-notchedOutline": { border: "none" },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "transparent",
          },
          "&.Mui-focused": {
            boxShadow: "none",
          },
        }}
      >
        {options.map((option) => (
          <MenuItem key={option.id} value={option.id} className="menu-item">
            {option.icon && (
              <img
                src={option.icon}
                alt={option.name}
                className="dropdown-icon"
              />
            )}
            <div className="dropdown-text">
              <span className="subject-text">
                {splitText(option.name, option.subjectDetail).subject}
              </span>
              <span className="grade-text">
                {splitText(option.name, option.subjectDetail).grade}
              </span>
            </div>
          </MenuItem>
        ))}
      </Select>
    </div>
  );
};

export default ImageDropdown;