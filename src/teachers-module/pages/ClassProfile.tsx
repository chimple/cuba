import { FC, useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { PAGES, TableTypes, USER_ROLE } from "../../common/constants";
import Header from "../components/homePage/Header";
import { Util } from "../../utility/util";
import "./ClassProfile.css";
import { t } from "i18next";
import DeleteClassDialog from "../components/classComponents/DeleteClassDialog";
const ClassProfile: FC = () => {
  const history = useHistory();
  const location = useLocation();
  const [currentClass, setCurrentClass] = useState<TableTypes<"class">>();
  const { school: localSchool, classDoc: classData } = location.state as any;
  const currentSchool = localSchool ?? Util.getCurrentSchool();
  const currentUserRole = JSON.parse(localStorage.getItem(USER_ROLE)!);

  useEffect(() => {
    fetchClassDetails();
  }, []);

  const fetchClassDetails = async () => {
    if (classData) {
      setCurrentClass(classData);
    }
  };

  const handleEditClass = () => {
    history.replace(PAGES.EDIT_CLASS, {
      school: currentSchool,
      classDoc: currentClass,
    });
  };

  const onBackButtonClick = () => {
    Util.setPathToBackButton(PAGES.MANAGE_CLASS, history);
  };
  return (
    <div className="class-profile-page">
      <Header
        isBackButton={true}
        onBackButtonClick={onBackButtonClick}
        showSchool={true}
        showClass={true}
        className={currentClass?.name}
        schoolName={currentSchool?.name}
      />
      <div className="class-name-div">{t("Class")}</div>
      <hr className="horizontal-line" />

      <div className="profile-div">
        <div className="class-profile-header">{t("Class") + ":"}</div>
        <div className="name-div"> {currentClass?.name}</div>
      </div>
      <hr className="horizontal-line" />

      <div className="edit-delete-section">
        <div onClick={handleEditClass}>{t("Edit")}</div>
        <div className="vertical-line"></div>
        <DeleteClassDialog classId={currentClass?.id!} />
      </div>
    </div>
  );
};

export default ClassProfile;
