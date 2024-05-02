import React from "react";
import { Fab } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { Remove } from "@mui/icons-material";
import { t } from "i18next";
import "./AddDeleteButtons.css";

const AddDeleteButtons: React.FC<{
  selectedClass: string | undefined;
  onAddClass: () => void;
  onDeleteClass: () => void;
}> = ({ selectedClass, onAddClass, onDeleteClass }) => {
  return (
    <div>
      <div className="add-class-container">
        <Fab
          className="add-class-icon"
          size="small"
          sx={{ background: "blue", color: "white", boxShadow: "none" }}
          onClick={onAddClass}
        >
          <AddIcon />
        </Fab>
        <div className="add-class-text">
          <p className="classes-name" style={{ maxWidth: "fit-content" }}>
            {t("Add class")}
          </p>
        </div>
      </div>
      <div className="add-class-container">
        <Fab
          size="small"
          className="delete-class-icon"
          sx={{ background: "red", color: "white", boxShadow: "none" }}
          onClick={onDeleteClass}
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
  );
};

export default AddDeleteButtons;
