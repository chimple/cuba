import React, { useState, useRef, useEffect } from "react";
import "./CustomImageDropdown.css";
import { ALL_SUBJECT } from '../../../common/constants';

interface DropdownOption {
  id: string | number;
  name: string;
  icon?: string;
  subjectDetail?: string;
}

interface CustomImageDropdownProps {
  options: DropdownOption[];
  selectedValue: DropdownOption;
  onOptionSelect: (selected: DropdownOption) => void;
  placeholder?: string;
  isDownBorder?: boolean;
}

const splitText = (name: string, subjectDetail?: string) => {
  if (name === ALL_SUBJECT.name) {
    return { subject: name.trim(), grade: ALL_SUBJECT.subjectDetail };
  }
  const subjectDetailParts = subjectDetail?.split(name)?.[1]?.trim();
  return {
    subject: name.trim(),
    grade: subjectDetailParts || "",
  };
};

const CustomImageDropdown: React.FC<CustomImageDropdownProps> = ({
  options,
  selectedValue,
  onOptionSelect,
  placeholder = "Select an option",
  isDownBorder = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setIsOpen((prev) => !prev);

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      className="customImageDropdown-container"
      ref={dropdownRef}
    >
      <div className="customImageDropdown-selected" onClick={toggleDropdown}>
        {selectedValue?.id ? (
          <>
            {selectedValue.icon && (
              <img src={selectedValue.icon} alt={selectedValue.name} className="customImage-icon" />
            )}
            <span>{selectedValue.name}</span>
          </>
        ) : (
          <>
            <img
              src={options[0]?.icon || ""}
              alt="placeholder"
              className="customImage-icon"
            />
            <span>{placeholder}</span>
          </>
        )}
        <img
          src="/assets/icons/iconDown.png"
          alt="down-icon"
          className="image-subject-dropdown-icon"
        />
      </div>

      {isOpen && (
        <div className="customImageDropdown-menu">
          {options.map((option) => {
            const { subject, grade } = splitText(option.name, option.subjectDetail);
            return (
              <div
                key={option.id}
                className="customImageDropdown-menu-item"
                onClick={() => {
                  onOptionSelect(option);
                  setIsOpen(false);
                }}
              >
                {option.icon && <img src={option.icon} alt={option.name} className="customImage-icon" />}
                <div className="dropdown-text">
                  <span className="subject-text">{subject}</span>
                  <span className="grade-text">{grade}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomImageDropdown;