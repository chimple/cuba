import type { KeyboardEvent } from 'react';

type SelectOption = { value: string; label: string };

type ShortSelectKeyboardParams = {
  event: KeyboardEvent<HTMLDivElement>;
  isOpen: boolean;
  fieldName: string;
  selectedIndex: number;
  options: SelectOption[];
  handleChange: (name: string, value: string) => void;
  setOpenSelect: (name: string | null) => void;
};

export const handleShortSelectKeyboard = ({
  event,
  isOpen,
  fieldName,
  selectedIndex,
  options,
  handleChange,
  setOpenSelect,
}: ShortSelectKeyboardParams) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    setOpenSelect(null);
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    setOpenSelect(isOpen ? null : fieldName);
  } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    const direction = event.key === 'ArrowDown' ? 1 : -1;
    const nextIndex =
      (selectedIndex + direction + options.length) % options.length;
    handleChange(fieldName, options[nextIndex].value);
    setOpenSelect(fieldName);
  }
};
