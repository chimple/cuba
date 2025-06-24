import { FC, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { AppBar } from "@mui/material";
import { t } from "i18next";
import { ServiceConfig } from "../../services/ServiceConfig";
import { Util } from "../../utility/util";
import { PAGES, TableTypes } from "../../common/constants";
import BackButton from "../../components/common/BackButton";
import "./DisplayClasses.css";

const DisplayClasses: FC = () => {
  const history = useHistory();
  const api = ServiceConfig.getI()?.apiHandler;
  const auth = ServiceConfig.getI()?.authHandler;

  const [allClasses, setAllClasses] = useState<TableTypes<"class">[]>([]);
  const [currentSchool, setCurrentSchool] =
    useState<TableTypes<"school"> | null>(null);
  const [currentUser, setCurrentUser] = useState<TableTypes<"user"> | null>(
    null
  );

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      const user = await auth.getCurrentUser();
      const tempSchool = Util.getCurrentSchool();

      if (!user || !tempSchool) {
        history.replace(PAGES.DISPLAY_SCHOOLS);
        return;
      }

      setCurrentUser(user);
      setCurrentSchool(tempSchool);

      const schoolCourses = await api.getCoursesBySchoolId(tempSchool.id);
      if (schoolCourses.length === 0) {
        history.replace(PAGES.SUBJECTS_PAGE, {
          schoolId: tempSchool.id,
          origin: PAGES.DISPLAY_CLASSES,
          isSelect: true,
        });
        return;
      }

      const fetchedClasses = await api.getClassesForSchool(
        tempSchool.id,
        user.id
      );
      if (fetchedClasses.length === 0) {
        history.replace(PAGES.ADD_CLASS, {
          school: currentSchool,
          origin: PAGES.DISPLAY_CLASSES,
        });
        return;
      }

      const classCoursesData = await Promise.all(
        fetchedClasses.map((classItem) =>
          api.getCoursesByClassId(classItem.id).then((courses) => ({
            classId: classItem.id,
            courses,
          }))
        )
      );

      const classWithoutSubjects = classCoursesData.find(
        (data) => data.courses.length === 0
      );

      if (classWithoutSubjects) {
        history.replace(PAGES.SUBJECTS_PAGE, {
          classId: classWithoutSubjects.classId,
          origin: PAGES.DISPLAY_CLASSES,
          isSelect: true,
        });
        Util.clearNavigationState();
        return;
      }
      setAllClasses(fetchedClasses);
    } catch (error) {
      console.error("Error initializing data:", error);
    }
  };

  const handleClassSelection = (selectedClass: TableTypes<"class">) => {
    Util.setCurrentClass(selectedClass);
    history.replace(PAGES.HOME_PAGE, { tabValue: 0 });
  };

  return (
    <div className="display-classes-page">
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
          <BackButton
            onClicked={() => history.replace(PAGES.DISPLAY_SCHOOLS)}
          />
        </div>
        <p className="app-bar-title">{t("Select Class")}</p>
      </AppBar>

      <div className="all-classes-display">
        {allClasses.length > 0 ? (
          allClasses.map((classItem) => (
            <div
              key={classItem.id}
              className="class-item"
              onClick={() => handleClassSelection(classItem)}
            >
              <img src={"assets/avatars/armydog.png"} alt="" />
              <span className="class-name">{classItem.name}</span>
            </div>
          ))
        ) : (
          <p className="no-classes-message">{t("no classes available")}</p>
        )}
      </div>
    </div>
  );
};

export default DisplayClasses;
