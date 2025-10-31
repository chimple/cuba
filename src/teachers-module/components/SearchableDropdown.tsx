import React, { useState, useEffect, useRef, useCallback } from "react";
import "./SearchableDropdown.css";
import { t } from "i18next";

interface Option {
  id: string | number;
  name: string;
}

interface SearchableDropdownProps {
  placeholder: string;
  fetchOptions: (query: string, page: number) => Promise<Option[]>;
  selectedValue: Option | null;
  onOptionSelect: (option: Option) => void;
  onClear: () => void;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  placeholder,
  fetchOptions,
  selectedValue,
  onOptionSelect,
  onClear,
}) => {
  const [inputValue, setInputValue] = useState(selectedValue?.name || "");
  const [options, setOptions] = useState<Option[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // 🔄 Load dropdown options
  useEffect(() => {
    if (!fetchOptions || !isOpen) return;
    let isCancelled = false;

    const loadOptions = async () => {
      setIsLoading(true);
      const newOptions = await fetchOptions(inputValue, page);
      if (!isCancelled) {
        setOptions((prev) =>
          page === 1 ? newOptions : [...prev, ...newOptions]
        );
        setHasMore(newOptions.length >= 20);
      }
      setIsLoading(false);
    };

    loadOptions();
    return () => {
      isCancelled = true;
    };
  }, [inputValue, page, isOpen]);

  useEffect(() => {
    if (selectedValue?.name) setInputValue(selectedValue.name);
  }, [selectedValue]);

  // 🔁 Scroll-based pagination
  const handleScroll = useCallback(() => {
    const div = listRef.current;
    if (!div || isLoading || !hasMore) return;
    const nearBottom =
      div.scrollTop + div.clientHeight >= div.scrollHeight - 20;
    if (nearBottom) setPage((p) => p + 1);
  }, [isLoading, hasMore]);

  const handleSelect = (option: Option) => {
    onOptionSelect(option);
    setInputValue(option.name);
    setIsOpen(false);
  };

  const handleToggleDropdown = () => {
    if (isOpen) {
      setInputValue("");
      setOptions([]);
      onOptionSelect({ id: "", name: "" });
      onClear();
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return (
    <div className="searchable-dropdown-container">
      <div className="searchable-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          className="searchable-input"
          placeholder={placeholder}
          value={inputValue}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setInputValue(e.target.value);
            setPage(1);
            setIsOpen(true);
          }}
        />

        <button
          className="dropdown-toggle-button"
          onClick={handleToggleDropdown}
          type="button"
        >
          {isOpen ? "×" : "▾"}
        </button>
      </div>

      {isOpen && (
        <div className="searchable-list" ref={listRef} onScroll={handleScroll}>
          {options.map((option) => (
            <div
              key={option.id}
              className={`searchable-option ${
                selectedValue?.id === option.id ? "selected" : ""
              }`}
              onClick={() => handleSelect(option)}
            >
              {option.name}
            </div>
          ))}
          {isLoading && <div className="searchable-option">{t("Loading...")}</div>}
          {!isLoading && options.length === 0 && (
            <div className="searchable-option">{t("No Results Found")}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
