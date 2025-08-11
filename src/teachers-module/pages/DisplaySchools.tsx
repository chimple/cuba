import { FC, useEffect, useState, useRef } from "react";
import { useHistory, useLocation } from "react-router";
import {
  PAGES,
  TableTypes,
  USER_ROLE,
  MODES,
  USER_SELECTION_STAGE,
  IS_OPS_USER,
} from "../../common/constants";
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
const DisplaySchools: FC = () => {
  const history = useHistory();
  const location = useLocation();
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;
  const [schoolList, setSchoolList] = useState<SchoolWithRole[]>([]);
  const [user, setUser] = useState<TableTypes<"user">>();
  const [isAuthorizedForOpsMode, setIsAuthorizedForOpsMode] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const mode = await schoolUtil.getCurrMode();
      const done = JSON.parse(
        localStorage.getItem(USER_SELECTION_STAGE) ?? "false"
      );
      if (
        mode === MODES.TEACHER &&
        done &&
        location.pathname !== PAGES.HOME_PAGE
      ) {
        history.replace(PAGES.HOME_PAGE);
      }
    })();
  }, [location.pathname, history]);

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
    const isOpsUser = localStorage.getItem(IS_OPS_USER) === "true";
    if (isOpsUser) setIsAuthorizedForOpsMode(true);
    setPage(1);
    setHasMore(true);
    await fetchSchools(1, currentUser.id);
    // if they’d already picked a school previously
    const tempSchool = Util.getCurrentSchool();
    if (tempSchool) {
      const role = await api.getUserRoleForSchool(
        currentUser.id,
        tempSchool.id
      );
      if (role) {
        return selectSchool({ school: tempSchool, role });
      }
    }
    if (schoolList.length === 1) {
      return selectSchool(schoolList[0]);
    }
  };
  // infinite scroll listener
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
  // fetch next page if page++
  useEffect(() => {
    if (!user || page === 1) return;
    fetchSchools(page, user.id);
  }, [page, user]);
  // helper: get classes
  const getClasses = async (schoolId: string,userId:string) => {
    const classes = await api.getClassesForSchool(schoolId, userId);
    return classes.length ? classes : [];
  };
  const switchUser = () => {
    schoolUtil.setCurrMode(MODES.PARENT);
    history.replace(PAGES.DISPLAY_STUDENT);
  };

  async function selectSchool(school: SchoolWithRole) {
    Util.setCurrentSchool(school.school, school.role);
     const currentUser = user || await auth.getCurrentUser(); 
     if(!currentUser)return
    await Util.handleClassAndSubjects(
      school.school.id,
      currentUser?.id,
      history,
      PAGES.DISPLAY_SCHOOLS
    );
    localStorage.setItem(USER_SELECTION_STAGE, JSON.stringify(true));
    const tempClass = Util.getCurrentClass();
    if (tempClass) {
      history.replace(PAGES.HOME_PAGE, { tabValue: 0 });
    } else {
      const classes = await getClasses(school.school.id,currentUser?.id);
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
              onClick={() =>
                history.replace(PAGES.REQ_ADD_SCHOOL, {
                  origin: PAGES.DISPLAY_SCHOOLS,
                })
              }
            >
              <IonIcon icon={addOutline} />
            </IonFabButton>
            <div className="create-new-school-text">
              {t("Create New School")}
            </div>
          </div>
        </div>
      ) : (
        <div
          className="all-school-display-container display-all-schools-scroll"
          ref={scrollRef}
          style={{ overflowY: "auto", maxHeight: "calc(100vh - 200px)" }}
        >
          <div className="all-school-display">
            {schoolList.map((school) => (
              <div key={school.school.id} onClick={() => selectSchool(school)}>
                <div className="display-school-single-school">
                  <div className="display-school-image">
                    <img
                      className="school-image-p"
                      src={school.school.image ?? "assets/icons/school.png"}
                      alt=""
                    />
                  </div>
                  <div className="display-school-name">
                    {school.school.name}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="display-loading-text">{t("Loading...")}</div>
            )}
            {!hasMore && schoolList.length > 0 && (
              <div className="display-no-more-schools">
                {t("No more schools")}
              </div>
            )}
          </div>
        </div>
      )}
    </IonPage>
  );
};
export default DisplaySchools;
