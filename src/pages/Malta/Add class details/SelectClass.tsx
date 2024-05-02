// SelectClass.tsx
import React, { useState } from "react";
import "./SelectClass.css";
import ClassOptions from "./ClassOptions";
import AddDeleteButtons from "./AddDeleteButtons";
import AddClasses from "./AddClasses";

const SelectClass: React.FC<{
  classes?: string[];
  selectedClass?: string;
  onSwitchClass: (selectedClass: string) => void;
}> = ({ classes, selectedClass, onSwitchClass }) => {
  const [selected, setSelected] = useState<string | undefined>(selectedClass);
  const [showAddClass, setShowAddClass] = useState(false);

  const handleClassChange = (selectedClass: string) => {
    setSelected(selectedClass);
  };

  const handleAddClass = () => {
    setShowAddClass(true);
  };

  const handleCloseAddClass = () => {
    setShowAddClass(false);
  };

  const handleAddClassSuccess = (newClass: string) => {
    console.log("New class added..", newClass);
  };

  return (
    <div className="switch-class-container">
      <div>
        <ClassOptions
          classes={classes || []}
          selectedClass={selected}
          onClassChange={handleClassChange}
          onSwitchClass={onSwitchClass}
        />
      </div>

      <AddDeleteButtons
        selectedClass={selectedClass}
        onAddClass={handleAddClass}
        onDeleteClass={() => {}}
      />

      <AddClasses
        open={showAddClass}
        onClose={handleCloseAddClass}
        onAddClass={handleAddClassSuccess}
      />
    </div>
  );
};

export default SelectClass;
