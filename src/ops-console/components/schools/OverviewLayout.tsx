import React from "react";
import SchoolDetails from "./SchoolDetails";
import ProgramDetails from "./ProgramDetails";
import SchoolPerformance from "./SchoolPerformance";
import KeyContacts from "./KeyContacts";
import "./Overview.css";
import LocationDetails from "./LocationDetails";
import CurriculumSubjectsCard from "./CurriculumSubjectsCard";

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);
  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

const OverviewLayout = ({ id }) => {
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <div className="overview-layout">
        <div className="right-box">
          <SchoolPerformance />
        </div>
        <div className="right-box">
          <KeyContacts id={id} />
        </div>
        <div className="left-box">
          <SchoolDetails id={id} />
        </div>
        <div className="left-box">
          <CurriculumSubjectsCard id={id} />
        </div>
        <div className="left-box">
          <LocationDetails id={id} />
        </div>
        <div className="right-box">
          <ProgramDetails id={id} />
        </div>
      </div>
    );
  }

  return (
    <div className="overview-layout">
      <div className="left-column">
        <SchoolDetails id={id} />
        <CurriculumSubjectsCard id={id} />
        <LocationDetails id={id} />
      </div>
      <div className="right-column">
        <div className="right-box">
          <KeyContacts id={id} />
          <ProgramDetails id={id} />
        </div>
        <div className="right-box">
          <SchoolPerformance />
        </div>
      </div>
    </div>
  );
};

export default OverviewLayout;
