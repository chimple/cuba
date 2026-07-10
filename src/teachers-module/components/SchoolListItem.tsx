import React, { FC } from "react";
import { IonIcon, IonItem, IonButton } from "@ionic/react";
import { chevronDown } from "ionicons/icons";
import { TableTypes } from "../../common/constants";
import schoolImage from "../assets/images/school.svg";
import "./SchoolListItem.css";
import { t } from "i18next";

interface SchoolListItemProps {
  school: TableTypes<"school">;
  isExpanded: boolean;
  onToggle: () => void;
  onJoin: (school: TableTypes<"school">) => void;
  searchText: string;
}

// A helper function to bold the matching search text
const highlightText = (text: string, highlight: string) => {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }
  const parts = text.split(new RegExp(`(${highlight})`, "gi"));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <strong key={i}>{part}</strong>
        ) : (
          part
        )
      )}
    </span>
  );
};

const SchoolListItem: FC<SchoolListItemProps> = ({
  school,
  isExpanded,
  onToggle,
  onJoin,
  searchText,
}) => {
  // Simple logic to pick a random-ish icon based on the school name length
  const iconIndex = school.name.length % 3;
  const iconPath = `assets/icons/school-icon-${iconIndex}.png`;

  return (
    <div className={`school-list-item ${isExpanded ? "expanded" : ""}`}>
      <div className="school-list-item-header" onClick={onToggle}>
        <img
          src={schoolImage}
          alt="school icon"
          className="school-list-school-icon"
        />
        <div className="school-list-school-name-udise-wrapper">
          <div className="school-list-school-name">
            {highlightText(school.name, searchText)}
          </div>
          <div className="school-list-school-udise-collapsed">
            UDISE: {school.udise || "N/A"}
          </div>
        </div>
        <IonIcon icon={chevronDown} className="school-list-expand-arrow" />
      </div>

      {isExpanded && (
        <div className="school-list-school-item-details">
          <div className="school-list-school-details-text">
            <p>
              {t("Block")}: {school.group3 || "N/A"}, {t("Cluster")}:{" "}
              {school.group4 || "N/A"}, {t("Village Name")}:
            </p>
            <p>UDISE: {school.udise || "N/A"}</p>
          </div>
          <IonButton
            className="school-list-join-button"
            onClick={() => onJoin(school)}
          >
            {t("Join")}
          </IonButton>
        </div>
      )}
    </div>
  );
};

export default SchoolListItem;
