import React, { useState, useEffect } from "react";
import { IconType, PAGES, SCHOOL, TableTypes } from "../../common/constants";
import { useHistory } from "react-router-dom";
import { ServiceConfig } from "../../services/ServiceConfig";
import { RoleType } from "../../interface/modelInterfaces";
import Header from "../components/homePage/Header";
import AddButton from "../../common/AddButton";
import "./ManageSchools.css";
import { t } from "i18next";
import DetailList from "../components/schoolComponent/DetailList";
import { Util } from "../../utility/util";
import UploadButton from "../../ops-console/components/UploadButton";

let isManagerOrDirector = false;
interface SchoolWithRole {
  school: TableTypes<"school">;
  role: RoleType;
}

const ManageSchools: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<TableTypes<"user"> | null>(null);
  const [allSchools, setAllSchools] = useState<SchoolWithRole[]>([]);
  const [searchQuery, setSearchQuery] = useState(""); // State for search query
  const [filteredSchools, setFilteredSchools] = useState<SchoolWithRole[]>([]); // State for filtered schools

  const history = useHistory();
  const api = ServiceConfig.getI()?.apiHandler;
  const auth = ServiceConfig.getI()?.authHandler;

  const init = async () => {
    try {
      const user = await auth.getCurrentUser();
      if (!user) return;
      setCurrentUser(user);

      const school = await Util.getCurrentSchool();

      // isManagerOrDirector will be true if user is PROGRAM_MANAGER or OPERATIONAL_DIRECTOR or FIELD_COORDINATOR
      if (school) {
        isManagerOrDirector = await api.checkUserIsManagerOrDirector(school.id, user.id);
      }
      
      const fetchedSchools = await api.getSchoolsForUser(user.id);
      console.log("all schools..", fetchedSchools);

      if (fetchedSchools) setAllSchools(fetchedSchools);
    } catch (error) {
      console.error("Error initializing data:", error);
    }
  };

  const onBackButtonClick = () => {
    history.replace(PAGES.HOME_PAGE, {
      tabValue: 0,
    });
  };

  useEffect(() => {
    init();
  }, []);

  // Filter schools whenever allSchools or searchQuery changes
  useEffect(() => {
    const filtered = allSchools.filter((item) =>
      item.school.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredSchools(filtered);
  }, [allSchools, searchQuery]);

  return (
    <div className="main-page">
      <div className="fixed-header">
        <Header
          isBackButton={true}
          onBackButtonClick={onBackButtonClick}
          onSearchChange={setSearchQuery} // Pass the search callback
        />
      </div>
      <div className="school-div">{t("Schools")}</div>
      <div className="school-list">
        <DetailList data={filteredSchools} type={IconType.SCHOOL} />
      </div>

      {isManagerOrDirector && (
        <UploadButton
          onClick={() => {
            history.replace(PAGES.UPLOAD_PAGE);
          }}
        />
      )}

      {/* <AddButton
        onClick={() => {
          history.replace(PAGES.REQ_ADD_SCHOOL);
        }}
      /> */}
    </div>
  );
};

export default ManageSchools;
