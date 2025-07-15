import { FC, useEffect, useState, useRef } from "react";
import { useHistory } from "react-router";
import { PAGES, TableTypes, USER_ROLE, MODES } from "../../common/constants";
import { ServiceConfig } from "../../services/ServiceConfig";
import { Util } from "../../utility/util";
import { t } from "i18next";
import "./DisplaySchools.css";
import Header from "../components/homePage/Header";
import { IonFabButton, IonIcon, IonPage } from "@ionic/react";
import { PiUserSwitchFill } from "react-icons/pi";
import CommonToggle from "../../common/CommonToggle";
import { schoolUtil } from "../../utility/schoolUtil";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { Capacitor } from "@capacitor/core";
import { addOutline } from "ionicons/icons";
import { RoleType } from "../../interface/modelInterfaces";

interface SchoolWithRole {
  school: TableTypes<"school">;
  role: RoleType;
}

const PAGE_SIZE = 20;

const DisplaySchools: FC<{}> = () => {
  const history = useHistory();
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;
  const [schoolList, setSchoolList] = useState<SchoolWithRole[]>([]);
  const [user, setUser] = useState<TableTypes<"user">>();
  const [isAuthorizedForOpsMode, setIsAuthorizedForOpsMode] =
    useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    lockOrientation();
    initData();
  }, []);

  const lockOrientation = () => {
    if (Capacitor.isNativePlatform()) {
      ScreenOrientation.lock({ orientation: "portrait" });
    }
  };

  const fetchSchools = async (pageNo: number, userId: string) => {
    setLoading(true);
    const result = await api.getSchoolsForUser(userId, {
      page: pageNo,
      page_size: PAGE_SIZE,
    });
    if (result.length < PAGE_SIZE) setHasMore(false);
    setSchoolList((prev) => (pageNo === 1 ? result : [...prev, ...result]));
    setLoading(false);
  };

  const initData = async () => {
    const currentUser = await auth.getCurrentUser();
    if (!currentUser) return;
    setUser(currentUser);

    const userRoles: string[] = JSON.parse(
      localStorage.getItem(USER_ROLE) ?? "[]"
    );

    const isOpsRole =
      userRoles.includes(RoleType.SUPER_ADMIN) ||
      userRoles.includes(RoleType.OPERATIONAL_DIRECTOR);

    const isProgramUser = await api.isProgramUser();
    if (isOpsRole || isProgramUser) setIsAuthorizedForOpsMode(true);

    setPage(1);
    setHasMore(true);
    await fetchSchools(1, currentUser.id);

    const tempSchool = Util.getCurrentSchool();
    if (tempSchool) {
       if (!user) return;
      const role = await api.getUserRoleForSchool(user.id, tempSchool.id);
      if (role) {
        selectSchool({ school: tempSchool, role });
      }
    } else if (schoolList.length === 1) {
      selectSchool(schoolList[0]);
    }
  };

  // Infinite scroll listener
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (loading || !hasMore) return;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
        setPage((p) => p + 1);
      }
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [loading, hasMore]);

  // Fetch next page on page increment
  useEffect(() => {
    if (!user) return;
    if (page === 1) return;
    fetchSchools(page, user.id);
  }, [page, user]);

  const getClasses = async (schoolId: string) => {
    const tempClasses = await api.getClassesForSchool(schoolId, user?.id!);
    if (tempClasses.length > 0) {
      return tempClasses;
    } else {
      return [];
    }
  };
  const switchUser = async () => {
    schoolUtil.setCurrMode(MODES.PARENT);
    history.replace(PAGES.DISPLAY_STUDENT);
  };
  async function selectSchool(school: SchoolWithRole) {
    Util.setCurrentSchool(school.school, school.role);

    await Util.handleClassAndSubjects(
      school.school.id,
      user?.id!,
      history,
      PAGES.DISPLAY_SCHOOLS
    );

    const tempClass = Util.getCurrentClass();
    if (tempClass) {
      Util.setCurrentClass(tempClass);
      history.replace(PAGES.HOME_PAGE, { tabValue: 0 });
    } else {
      const classes = await getClasses(school.school.id);
      if (classes.length > 0) {
        Util.setCurrentClass(classes[0]);
        history.replace(PAGES.HOME_PAGE, { tabValue: 0 });
      }
    }
  }
  return (
    <IonPage className="display-page">
      <Header
        isBackButton={false}
        disableBackButton={true}
        customText="Select School"
      />

      <div className="display-user-switch-user-toggle">
        <div className="display-school-switch-text">
          <PiUserSwitchFill className="display-user-user-switch-icon" />
          <CommonToggle onChange={switchUser} label="Switch to Child's Mode" />
        </div>
        {!Capacitor.isNativePlatform() && isAuthorizedForOpsMode && (
          <div className="display-schools-toggle-ops-switch-text">
            <PiUserSwitchFill className="display-user-user-switch-icon" />
            <CommonToggle
              onChange={() => Util.switchToOpsUser(history)}
              label={t("switch to ops mode") as string}
            />
          </div>
        )}
      </div>
      <hr className="display-school-horizontal-line" />
      {schoolList.length === 0 && !loading ? (
        <div className="no-schools-container">
          <div className="create-school-button">
            <IonFabButton
              onClick={() => {
                history.replace(PAGES.REQ_ADD_SCHOOL, {
                  origin: PAGES.DISPLAY_SCHOOLS,
                });
              }}
            >
              <IonIcon icon={addOutline} />
            </IonFabButton>
            <div className="create-new-school-text">
              {t("Create New School")}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div
           className="all-school-display-container display-all-schools-scroll"
            ref={scrollRef}
            style={{ overflowY: "auto", maxHeight: "calc(100vh - 200px)" }}
          >
            <div className="all-school-display">
              {schoolList.map((school) => (
                <div
                  key={school.school.id}
                  onClick={() => selectSchool(school)}
                >
                  <div className="display-school-single-school">
                    <div className="display-school-image">
                      <img
                        className="school-image-p"
                        src={school.school.image ?? "assets/icons/school.png"}
                      ></img>
                    </div>
                    <div className="display-school-name">
                      {school.school.name}
                    </div>
                  </div>
                </div>
              ))}
               {loading && (
              <div className="display-loading-text">
                {t("Loading...")}
              </div>  
            )}
              {!hasMore && schoolList.length > 0 && (
                <div className="display-no-more-schools">
                {t("No more schools")}
              </div>
              )}
            </div>
          </div>
        </>
      )}
      {/* comment out the plus icon */}
      {/* {schoolList.length > 0 && (
        <AddButton
          onClick={() => {
            history.replace(PAGES.ADD_SCHOOL, {
              origin: PAGES.DISPLAY_SCHOOLS,
            });
          }}
        />
      )} */}
    </IonPage>
  );
};

export default DisplaySchools;
