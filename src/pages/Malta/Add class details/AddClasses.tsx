import React, { useState } from "react";
import { Dialog } from "@mui/material";
import { Cancel } from "@mui/icons-material";
import DropDown from "../../../components/DropDown";
import { t } from "i18next";
import "./AddClasses.css";

const AddClasses: React.FC<{
  open: boolean;
  onClose: () => void;
  onAddClass: (selectedClass: string) => void;
}> = ({ open, onClose, onAddClass }) => {
  const [selectedOption, setSelectedOption] = useState<string | undefined>(
    undefined
  );
  const additionalClasses = ["4th standard", "5th standard"];

  const handleAddClass = () => {
    if (selectedOption) {
      console.log("Selected class to add:", selectedOption);
      onAddClass(selectedOption);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="addclass-header">
        <p className="addclass-header-text1">{t("Add class")}</p>
        <Cancel className="cancel-icon" onClick={onClose} />
      </div>
      <div className="dropdown-container">
        <DropDown
          optionList={additionalClasses.map((className) => ({
            id: className,
            displayName: className,
          }))}
          currentValue={selectedOption}
          onValueChange={(value) => setSelectedOption(value)}
          placeholder="Select Class"
          width="200px"
        />
      </div>
      <div className="add-button-div">
        <div className="add-button-new" onClick={handleAddClass}>
          {t("Add")}
        </div>
      </div>
    </Dialog>
  );
};

export default AddClasses;
