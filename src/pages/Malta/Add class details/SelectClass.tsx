import React, { useState } from "react";
import "./SelectClass.css";
import { Fab } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { Remove } from "@mui/icons-material";
import { t } from "i18next";
import AddClasses from "./AddClasses";

const SelectClass: React.FC<{
  classes?: string[];
  selectedClass?: string;
  onSwitchClass: (selectedClass: string) => void;
  onClassSelect: (selectedClass: string) => void;
}> = ({ classes, selectedClass, onSwitchClass, onClassSelect }) => {
  const [selected, setSelected] = useState<string | undefined>(selectedClass);
  const [showAddClass, setShowAddClass] = useState(false);

  const handleClassChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSelectedClass = event.target.value;
    setSelected(newSelectedClass);
  };

  const handleSwitchClass = () => {
    if (selected) {
      onSwitchClass(selected);
      onClassSelect(selected);
    }
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
      <div className="demo9">
        {classes?.map((className) => (
          <div key={className}>
            <div className={"class-option1"} />
            <p className="classes-name">{className}</p>
          </div>
        ))}
      </div>
      {classes?.map((className) => (
        <div key={className} className={`class-option`}>
          <input
            type="radio"
            name="class"
            value={className}
            defaultChecked={className === classes[0]}
            checked={className === selected}
            onChange={handleClassChange}
          />
          <label>{className}</label>
        </div>
      ))}

      <div className="switch-button" onClick={handleSwitchClass}>
        {t("Switch Class")}
      </div>

      <div>
        <div className="add-class-container">
          <Fab
            className="add-class-icon"
            size="small"
            sx={{ background: "blue", color: "white", boxShadow: "none" }}
            onClick={handleAddClass}
          >
            <AddIcon />
          </Fab>
          <div className="add-class-text">
            <p className="classes-name" style={{ maxWidth: "fit-content" }}>{t("Add class")}</p>
          </div>
        </div>
        <div className="add-class-container">
          <Fab
            size="small"
            className="delete-class-icon"
            sx={{ background: "red", color: "white", boxShadow: "none" }}
          >
            <Remove />
          </Fab>
          <div className="add-class-text">
            <p className="classes-name" style={{ maxWidth: "fit-content" }}>
              {t("Delete class")} ({selectedClass})
            </p>
          </div>
        </div>
      </div>
      <AddClasses
        open={showAddClass}
        onClose={handleCloseAddClass}
        onAddClass={handleAddClassSuccess}
      />
    </div>
  );
};

export default SelectClass;
