import React, { useEffect, useState } from "react";
import SchoolDetailsTabsComponent from "../../../ops-console/components/SchoolDetailsComponents/SchoolDetailsTabsComponent";
import SchoolNameHeaderComponent from "../../../ops-console/components/SchoolDetailsComponents/SchoolNameHeaderComponent";
import Breadcrumb from "../../../ops-console/components/Breadcrumb";

const data = {
  schoolData: {
    name: "Green Valley High",
    udise: "12345678901",
    group1: "Karnataka",
    group2: "Bangalore",
    group3: "Cluster A",
    group4: "Block 5",
    address: "123 Main St, Bangalore, Karnataka",
  },
  programData: {
    name: "Awesome Learning",
    program_type: "Government",
    model: "In School",
  },
  principals: [
    {
      name: "Ms. Rani Gupta",
      role: "Principal",
      phone: "9876543210",
      email: "rani.gupta@school.org",
    },
  ],
  coordinators: [
    {
      name: "Mr. Suresh Rao",
      role: "Coordinator",
      phone: "9876501234",
      email: "suresh.rao@school.org",
    },
  ],
  programManagers: [
    {
      name: "Priya Singh",
      role: "Program Manager",
      phone: "9000000001",
      email: "priya.singh@org.com",
    },
  ],
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 600);
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 600);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isMobile;
}

export default {
  title: "SchoolDetails/SchoolDetailPage",
  component: SchoolDetailsTabsComponent,
};

export const FullPage = () => {
  const schoolName = data.schoolData?.name;
  const isMobile = useIsMobile();
  const history = { goBack: () => alert("Go back to school list page!") };
  return (
    <div className="school-detail-container">
      <div className="school-detail-header">
        {schoolName && <SchoolNameHeaderComponent schoolName={schoolName} />}
      </div>
      {!isMobile && schoolName && (
        <div className="school-detail-secondary-header">
          <Breadcrumb
            crumbs={[
              {
                label: "Schools",
                onClick: () => history.goBack(),
              },
              {
                label: schoolName ?? "",
              },
            ]}
          />
        </div>
      )}
      <div className="school-detail-tertiary-gap" />
      <div className="school-detail-tertiary-header">
        <SchoolDetailsTabsComponent data={data} isMobile={isMobile} />
      </div>
      <div className="school-detail-columns-gap" />
    </div>
  );
};
