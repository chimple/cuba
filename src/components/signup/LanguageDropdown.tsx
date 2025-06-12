import React, { useState, useRef, useEffect } from "react";
import "./LanguageDropdown.css";

export interface LanguageOption {
  id: string;
  displayName: string;
}

interface LanguageDropdownProps {
  options: LanguageOption[];
  value: string;
  onChange: (id: string) => void;
}

const LanguageDropdown: React.FC<LanguageDropdownProps> = ({
  options,
  value,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((opt) => opt.id === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="LanguageDropdown-container" ref={ref}>
      <button
        className={`LanguageDropdown-selected${open ? " open" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <span className="LanguageDropdown-title">
          {selected ? selected.displayName : "Select"}
        </span>
        <img
          src="/assets/loginAssets/DropDownArrow.svg"
          className="LanguageDropdown-arrow"
        />
      </button>

      <div className={`LanguageDropdown-menu ${open ? "show" : "hide"}`}>
        {options.map((opt) => (
          <div
            key={opt.id}
            className={`LanguageDropdown-option${
              opt.id === value ? " selected" : ""
            }`}
            onClick={() => {
              onChange(opt.id);
              setOpen(false);
            }}
          >
            {opt.displayName}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LanguageDropdown;
