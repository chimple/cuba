import React from "react";
import { BsFillBellFill } from "react-icons/bs";
import "./SchoolNameHeaderComponent.css";

interface SchoolNameHeaderComponentProps {
  schoolName: string;
}

const SchoolNameHeaderComponent: React.FC<SchoolNameHeaderComponentProps> = ({
  schoolName,
}) => (
  <div className="school-header-row">
    <h1 className="school-header-title">{schoolName}</h1>
    <BsFillBellFill className="school-header-bell" />
  </div>
);

export default SchoolNameHeaderComponent;
