import React from "react";
import { MenuItem, Select, SelectChangeEvent } from "@mui/material";
import "./imageDropdown.css";
import { t } from "i18next";

interface DropdownOption {
  id: string | number;
  name: string;
  icon?: string;
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
    const selectedOption = options.find((opt) => opt.id === event.target.value);
    if (selectedOption) onOptionSelect(selectedOption);
  };

  return (
    <div className="imageDropdown-wrapper">
      <div className="imageDropdown-container">
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
                },
              },
            },
          }}
          renderValue={(value) =>
            selectedValue?.id ? (
              <div className="imageDropdown-selected">
                {selectedValue.icon && (
                  <img
                    src={selectedValue.icon}
                    alt={selectedValue.name}
                    className="imageDropdown-icon"
                  />
                )}
                <span>{t(selectedValue.name)}</span>
              </div>
            ) : (
              <div className="placeholder">
                <img
                  src={options[0]?.icon || ""}
                  alt="placeholder-icon"
                  className="imageDropdown-icon"
                />
                <span>{t(placeholder)}</span>
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
            <MenuItem
              key={option.id}
              value={option.id}
              className="menu-item-in-image-dropdown"
            >
              {option.icon && (
                <img
                  src={option.icon}
                  alt={option.name}
                  className="imageDropdown-icon"
                />
              )}
              <div className="imageDropdown-text">
                <span className="imageDropdown-subject-text">
                  {t(splitText(option.name, option.subjectDetail).subject)}
                </span>
                <span className="grade-text">
                  {t(splitText(option.name, option.subjectDetail).grade)}
                </span>
              </div>
            </MenuItem>
          ))}
        </Select>
      </div>

      {isDownBorder && <hr />}
    </div>
  );
};

export default ImageDropdown;
