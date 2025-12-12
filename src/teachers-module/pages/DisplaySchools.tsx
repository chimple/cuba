import { FC, useEffect, useState, useRef } from "react";
import { useHistory, useLocation } from "react-router";
import {
  CLASS,
  CURRENT_SCHOOL,
  PAGES,
  TableTypes,
  USER_ROLE,
  MODES,
  USER_SELECTION_STAGE,
  IS_OPS_USER,
  LANGUAGE,
  STATUS,
} from "../../common/constants";
import { APIMode, ServiceConfig } from "../../services/ServiceConfig";
import { Util } from "../../utility/util";
import { AppBar } from "@mui/material";
import { t } from "i18next";
import "./DisplaySchools.css";
import Header from "../components/homePage/Header";
import { IonFabButton, IonIcon, IonItem, IonPage } from "@ionic/react";
import { PiUserSwitchFill } from "react-icons/pi";
import CommonToggle from "../../common/CommonToggle";
import { schoolUtil } from "../../utility/schoolUtil";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { Capacitor } from "@capacitor/core";
import AddButton from "../../common/AddButton";
import { addOutline } from "ionicons/icons";
import { RoleType } from "../../interface/modelInterfaces";
import Loading from "../../components/Loading";

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
  const scrollPositionRef = useRef<number>(0);

  const checkSchoolRequest = async () => {
    const api = ServiceConfig.getI().apiHandler;
    const _currentUser =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    const existingRequest = await api.getExistingSchoolRequest(
      _currentUser?.id as string
    );
    if (existingRequest) {
      history.replace(PAGES.POST_SUCCESS);
    }
  };

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
       setTimeout(() => {
        Util.killCocosGame()
      }, 1000);
    }
  };

  const fetchSchools = async (pageNo: number, userId: string) => {
    if (scrollRef.current) {
      scrollPositionRef.current = scrollRef.current.scrollTop;
    }
    const result = await api.getSchoolsForUser(userId, {
      page: pageNo,
      page_size: PAGE_SIZE,
    });
    if (pageNo === 1 && result.length === 0) {
      history.replace(PAGES.SEARCH_SCHOOL);
      return;
    }
    if (result.length < PAGE_SIZE) setHasMore(false);
    setSchoolList((prev) => (pageNo === 1 ? result : [...prev, ...result]));
    setLoading(false);
    return result;
  };

  const initData = async () => {
    setLoading(true);
    const currentUser = await auth.getCurrentUser();
    const languageCode = localStorage.getItem(LANGUAGE);
    if (!currentUser?.name || currentUser.name.trim() === "") {
      history.replace(PAGES.ADD_TEACHER_NAME);
    }
    if (!currentUser) return;
    setUser(currentUser);
    const isOpsUser = localStorage.getItem(IS_OPS_USER) === "true";
    if (isOpsUser) setIsAuthorizedForOpsMode(true);
    try {
      await Util.updateUserLanguage(languageCode ?? "en");
    } catch (error) {
      console.error("Failed to update user language on init:", error);
    }
    setPage(1);
    setHasMore(true);
    await fetchSchools(1, currentUser.id);
    // If user already has both school & class chosen and app is in Teacher mode, go Home
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
      setLoading(false);
      return;
    }
    // Previously selected school? Respect it
    const preSelectedSchool = Util.getCurrentSchool();
    if (preSelectedSchool) {
      const role = await api.getUserRoleForSchool(
        currentUser.id,
        preSelectedSchool.id
      );
      if (role) {
        await selectSchool({ school: preSelectedSchool, role });
        return;
      }
    }
    // Fresh fetch and decide
    const firstPage = await fetchSchools(1, currentUser.id);
    if (!firstPage || firstPage.length === 0) {
      // If a request was already sent, go to Post Success; else go to Request School page
      const _currentUser =
        await ServiceConfig.getI().authHandler.getCurrentUser();
      const existingRequest = await api.getExistingSchoolRequest(
        _currentUser?.id as string
      );
      if (existingRequest?.request_status === STATUS.REQUESTED) {
        history.replace(PAGES.POST_SUCCESS, { tabValue: 0 });
      } else if (existingRequest?.request_status === STATUS.REJECTED) {
        history.replace(PAGES.SEARCH_SCHOOL, { tabValue: 0 });
      } else if (existingRequest?.request_status === STATUS.APPROVED) {
        history.replace(PAGES.DISPLAY_SCHOOLS, { tabValue: 0 });
      } else {
        history.replace(PAGES.SEARCH_SCHOOL, {
          origin: PAGES.DISPLAY_SCHOOLS,
        });
      }
      setLoading(false);
      return;
    }
    if (firstPage.length === 1) {
      await selectSchool(firstPage[0]); // auto-select the only school → Home
      return;
    }
    // Else: multiple schools → stay on DisplaySchools and let the user choose
    setLoading(false);
  };
  // infinite scroll listener with debounce and robust guard
  const prevSchoolListLength = useRef<number>(0);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !hasMore) return;
    let debounceTimeout: NodeJS.Timeout | null = null;
    const handleScroll = () => {
      if (loading) return;
      if (debounceTimeout) clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
          setPage((p) => p + 1);
        }
      }, 150);
    };
    el.addEventListener("scroll", handleScroll);
    return () => {
      el.removeEventListener("scroll", handleScroll);
      if (debounceTimeout) clearTimeout(debounceTimeout);
    };
  }, [loading, hasMore]);

  // fetch next page if page++
  useEffect(() => {
    if (!user || page === 1) return;
    fetchSchools(page, user.id);
  }, [page, user]);

  // Restore scroll position only when new schools are appended and hasMore is true
  useEffect(() => {
    if (
      page > 1 &&
      scrollRef.current &&
      schoolList.length > prevSchoolListLength.current &&
      hasMore
    ) {
      setTimeout(() => {
        scrollRef.current!.scrollTop = scrollPositionRef.current;
      }, 0);
    }
    prevSchoolListLength.current = schoolList.length;
  }, [schoolList, hasMore]);

  // helper: get classes
  const getClasses = async (schoolId: string, userId: string) => {
    const classes = await api.getClassesForSchool(schoolId, userId);
    return classes.length ? classes : [];
  };

  const switchUser = () => {
    schoolUtil.setCurrMode(MODES.PARENT);
    history.replace(PAGES.DISPLAY_STUDENT);
    setLoading(false);
  };

  async function selectSchool(school: SchoolWithRole) {
    Util.setCurrentSchool(school.school, school.role);
    const currentUser = user || (await auth.getCurrentUser());
    if (!currentUser) return;
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
      const classes = await getClasses(school.school.id, currentUser?.id);
      if (classes.length > 0) {
        Util.setCurrentClass(classes[0]);
        history.replace(PAGES.HOME_PAGE, { tabValue: 0 });
      }
    }
    setLoading(false);
  }

  return (
    <IonPage className="display-page">
      {!loading && (
        <>
          <Header
            isBackButton={false}
            disableBackButton={true}
            customText="Select School"
          />
          <div className="display-user-switch-user-toggle">
            <div className="display-school-switch-text">
              <PiUserSwitchFill className="display-user-user-switch-icon" />
              <CommonToggle
                onChange={switchUser}
                label="Switch to Child's Mode"
              />
            </div>
            {isAuthorizedForOpsMode && (
              <div className="display-schools-toggle-ops-switch-text">
                <PiUserSwitchFill className="display-user-user-switch-icon" />
                <CommonToggle
                  onChange={() => Util.switchToOpsUser(history)}
                  label={t("Switch to Ops Mode").toString()}
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
                  <div
                    key={school.school.id}
                    onClick={() => selectSchool(school)}
                  >
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
        </>
      )}
      <Loading isLoading={loading} />
    </IonPage>
  );
};

export default DisplaySchools;
