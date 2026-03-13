import React, { useState, useRef, useEffect } from "react";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DoneIcon from '@mui/icons-material/Done';
import "./SelectWithIcons.css";
import { t } from "i18next";

type Option = { value: string; label: string };
type SelectWithIconsProps = {
  label: string;
  value: string;
  setValue: (val: string) => void;
  icon: string;
  options: Option[];
  required?: boolean;
  id?: string;
  optionId?: string;
};

const SelectWithIcons: React.FC<SelectWithIconsProps> = ({
  label,
  value,
  setValue,
  icon,
  options,
  required,
  id,
  optionId
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const [labelWidth, setLabelWidth] = useState(0);

  useEffect(() => {
    if (labelRef.current) {
      setLabelWidth(labelRef.current.offsetWidth);
    }
  }, [label]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = value
  ? options.find((opt) => opt.value === value)?.label
  : t("Select one");

  return (
     <div className="select-with-icon-input-wrapper" ref={dropdownRef} style={{ "--label-width": `${labelWidth}px` } as React.CSSProperties}>
        <div className="select-with-icon-floating-label" ref={labelRef}>
            {label}
            {required && <span className="select-with-icon-required">*</span>}
        </div>
      <div
        id={id}
        className="select-with-icon-input-box"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="select-with-icon-icon-area">
          <img src={icon} alt="icon" />
        </div>
        <div className="select-with-icon-divider" />
        <div className="select-with-icon-selected-text">{selectedLabel}</div>
        <div className="select-with-icon-status">
            {isOpen ? (
                <KeyboardArrowUpIcon className="select-with-icon-dropdown-icon" />
            ) : (
                <KeyboardArrowDownIcon className="select-with-icon-dropdown-icon" />
            )}
        </div>

      </div>

      {isOpen && (
        <div className="select-with-icon-dropdown">
          {options.map((opt) => (
            <div
              id={optionId}
              key={opt.value}
              className={`select-with-icon-option ${value === opt.value ? "selected" : ""}`}
              onClick={() => {
                setValue(opt.value);
                setIsOpen(false);
              }}
            >
              <span>{opt.label}</span>
              {value === opt.value && <span className="select-with-icon-checkmark"><DoneIcon/></span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SelectWithIcons;
