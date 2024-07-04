import { FC, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { PAGES, TableTypes } from "../../common/constants";
import { ServiceConfig } from "../../services/ServiceConfig";
import { Util } from "../../utility/util";
import { RoleType } from "../../interface/modelInterfaces";
import { AppBar } from "@mui/material";
import { t } from "i18next";
import BackButton from "../../components/common/BackButton";
import "./DisplaySchools.css";
import UserImageWithName from "../../components/UserImageWithName";

interface SchoolWithRole {
  school: TableTypes<"school">;
  role: RoleType;
}
const DisplaySchools: FC<{}> = () => {
  const history = useHistory();
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;
  const [schoolList, setSchoolList] = useState<SchoolWithRole[]>([]);
  useEffect(() => {
    initData();
  }, []);
  const initData = async () => {
    const currentUser = await auth.getCurrentUser();
    if (!currentUser) return;
    const allSchool = await api.getSchoolsForUser(currentUser.id);
    setSchoolList(allSchool);
  };
  return (
    <div className="display-page">
      <AppBar
        position="static"
        sx={{
          flexDirection: "inherit",
          justifyContent: "space-evenly",
          padding: "2vh 3vw 2vh 3vw",
          backgroundColor: "#FFFBEC",
          height: "10vh",
        }}
      >
        <div className="back-button">
          <BackButton onClicked={() => {
    
          }} />
        </div>
        <p className="app-bar-title">{t("select school")}</p>
      </AppBar>
      <div className="all-school-display">
          {schoolList.map((school) => (
            <div
            onClick={() => {
              history.replace(PAGES.HOME_PAGE);
             }}
        >
            <img

                src={'assets/avatars/armydog.png'}
                alt=""
            />
            <span style={{color:'black',textAlign:'center'}} className="user-name">{school.school.name}</span>
        </div>
          ))}
        </div>
    </div>
  );
};
export default DisplaySchools;
