import React from "react";

interface DropdownProps {
  options: { value: string; label: string }[];
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

const Dropdown: React.FC<DropdownProps> = ({ options, onChange }) => {
  return (
    <select className="dropdown" onChange={onChange}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

const Dropdowns: React.FC = () => {
  const handleDropdownChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    console.log(event.target.value);
  };

  return (
    <div className="dropdown-container">
      <Dropdown
        options={[
          { value: "option1", label: "Option 1" },
          { value: "option2", label: "Option 2" },
          { value: "option3", label: "Option 3" },
        ]}
        onChange={handleDropdownChange}
      />
      <Dropdown
        options={[
          { value: "optionA", label: "Option A" },
          { value: "optionB", label: "Option B" },
          { value: "optionC", label: "Option C" },
        ]}
        onChange={handleDropdownChange}
      />
    </div>
  );
};

export default Dropdowns;
