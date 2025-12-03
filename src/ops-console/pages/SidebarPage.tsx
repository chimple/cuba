import React, { useEffect, useState } from "react";
import { PAGES, TableTypes, USER_ROLE } from "../../common/constants";
import { IonPage } from "@ionic/react";
import Sidebar from "../components/Sidebar";
import Dashboard from "../components/Dashboard";
import {
  BrowserRouter as Router,
  Switch,
  useRouteMatch,
  Route,
  Redirect,
} from "react-router-dom";
import ProtectedRoute from "../../ProtectedRoute";
import "./SidebarPage.css";
import { ServiceConfig } from "../../services/ServiceConfig";
import ProgramsPage from "./ProgramPage";
import SchoolList from "./SchoolList";
import SchoolDetailsPage from "./SchoolDetailsPage";
import ProgramDetailsPage from "./ProgramDetailsPage";
import UsersPage from "./UsersPage";
import NewProgram from "../components/NewProgram";
import ProgramConnectedSchoolPage from "./ProgramConnectedSchoolPageOps";
import NewUserPage from "./NewUserPageOps";
import UserDetailsPage from "./UserDetailsPage";
import { RoleType } from "../../interface/modelInterfaces";
import RequestList from "./RequestList";
import StudentPendingRequest from "./StudentPendingRequest";
import SchoolPendingRequest from "./SchoolPendingRequest";
import SchoolApprovedRequest from "./SchoolApprovedRequest";
import SchoolRejectedRequest from "./SchoolRejectedRequest";
import SchoolFormPage from "./SchoolFormPage";
import StudentApprovedRequestDetails from "./OpsApprovedRequestDetails";
import PrincipalTeacherPendingRequest from "./PrincipalTeacherPendingRequest";
import OpsRejectedRequestDetails from "./OpsRejectedRequestDetails";
import OpsApprovedRequestDetails from "./OpsApprovedRequestDetails";
import OpsFlaggedRequestDetails from "./OpsFlaggedRequestDetails";
import AddSchoolPage from "./AddSchoolPage";

const SidebarPage: React.FC = () => {
  const { path } = useRouteMatch();

  const [currentUser, setCurrentUser] = useState<TableTypes<"user"> | null>(
    null
  );
  const userRole = localStorage.getItem(USER_ROLE) || "[]";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const user = await ServiceConfig.getI()?.authHandler.getCurrentUser();
      if (!user) {
        console.error("No user is logged in.");
        return;
      }

      setCurrentUser(user);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  return (
    <IonPage>
      <div className="sidebarpage-rightSide">
        <Sidebar
          name={currentUser?.name || ""}
          email={currentUser?.email || ""}
          photo={currentUser?.image || ""}
        />
        <div className="sidebarpage-render">
          <Switch>
            <ProtectedRoute exact path={path}>
              <Redirect to={`${path}${PAGES.PROGRAM_PAGE}`} />
            </ProtectedRoute>
            {/* <ProtectedRoute
              path={`${path}${PAGES.ADMIN_DASHBOARD}`}
              exact={true}
            >
              <Dashboard />
            </ProtectedRoute> */}
            <ProtectedRoute path={`${path}${PAGES.PROGRAM_PAGE}`} exact={true}>
              <ProgramsPage />
            </ProtectedRoute>
            <ProtectedRoute path={`${path}${PAGES.SCHOOL_LIST}`} exact={true}>
              <SchoolList />
            </ProtectedRoute>
            <ProtectedRoute path={`${path}${PAGES.REQUEST_LIST}`} exact={true}>
              <RequestList />
            </ProtectedRoute>
            <ProtectedRoute
              path={`${path}${PAGES.REQUEST_LIST}${PAGES.SCHOOL_PENDING_REQUEST}/:id`}
              exact={true}
            >
              <SchoolPendingRequest />
            </ProtectedRoute>
            <ProtectedRoute
              path={`${path}${PAGES.REQUEST_LIST}${PAGES.SCHOOL_APPROVED_REQUEST}/:id`}
              exact={true}
            >
              <SchoolApprovedRequest />
            </ProtectedRoute>
            <ProtectedRoute
              path={`${path}${PAGES.REQUEST_LIST}${PAGES.SCHOOL_REJECTED_REQUEST}/:id`}
              exact={true}
            >
              <SchoolRejectedRequest />
            </ProtectedRoute>
            <ProtectedRoute
              path={`${path}${PAGES.REQUEST_LIST}${PAGES.SCHOOL_PENDING_REQUEST}${PAGES.SCHOOL_FORM_PAGE}/:id`}
              exact={true}
            >
              <SchoolFormPage />
            </ProtectedRoute>
            <ProtectedRoute
              path={`${path}${PAGES.REQUEST_LIST}${PAGES.STUDENT_PENDING_REQUEST}/:id`}
              exact={true}
            >
              <StudentPendingRequest />
            </ProtectedRoute>
            <ProtectedRoute
              path={`${path}${PAGES.REQUEST_LIST}${PAGES.OPS_APPROVED_REQUEST}/:id`}
              exact={true}
            >
              <OpsApprovedRequestDetails />
            </ProtectedRoute>
            <ProtectedRoute
              path={`${path}${PAGES.REQUEST_LIST}${PAGES.OPS_REJECTED_REQUEST}/:id`}
              exact={true}
            >
              <OpsRejectedRequestDetails />
            </ProtectedRoute>
            <ProtectedRoute
              path={`${path}${PAGES.REQUEST_LIST}${PAGES.OPS_REJECTED_FLAGGED}/:id`}
              exact={true}
            >
              <OpsFlaggedRequestDetails />
            </ProtectedRoute>
            <ProtectedRoute
              path={`${path}${PAGES.REQUEST_LIST}${PAGES.PRINCIPAL_TEACHER_PENDING_REQUEST}/:id`}
              exact={true}
            >
              <PrincipalTeacherPendingRequest />
            </ProtectedRoute>
            <ProtectedRoute
              path={`${path}${PAGES.SCHOOL_LIST}${PAGES.SCHOOL_DETAILS}/:school_id`}
              exact={true}
            >
              {(routeProps) => {
                return (
                  <SchoolDetailsPage id={routeProps.match.params.school_id} />
                );
              }}
            </ProtectedRoute>
            <ProtectedRoute
              path={`${path}${PAGES.PROGRAM_PAGE}${PAGES.PROGRAM_DETAIL_PAGE}/:program_id`}
              exact={true}
            >
              {(routeProps) => {
                return (
                  <ProgramDetailsPage id={routeProps.match.params.program_id} />
                );
              }}
            </ProtectedRoute>
            <ProtectedRoute path={`${path}${PAGES.NEW_PROGRAM}`} exact={true}>
              <NewProgram />
            </ProtectedRoute>
            <ProtectedRoute path={`${path}${PAGES.USERS}`} exact={true}>
              <UsersPage />
            </ProtectedRoute>
            <ProtectedRoute
              path={`${path}${PAGES.PROGRAM_PAGE}${PAGES.PROGRAM_DETAIL_PAGE}${PAGES.PROGRAM_CONNECTED_SCHOOL_LIST_PAGE_OPS}/:program_id`}
              exact={true}
            >
              {(routeProps) => {
                return (
                  <ProgramConnectedSchoolPage
                    id={routeProps.match.params.program_id}
                  />
                );
              }}
            </ProtectedRoute>
            <ProtectedRoute
              path={`${path}${PAGES.USERS}${PAGES.NEW_USERS_OPS}`}
              exact={true}
            >
              <NewUserPage />
            </ProtectedRoute>
            <ProtectedRoute
              path={`${path}${PAGES.ADMIN_USERS}${PAGES.USER_DETAILS}`}
              exact={true}
            >
              <UserDetailsPage />
            </ProtectedRoute>
            <ProtectedRoute
              path={`${path}${PAGES.SCHOOL_LIST}${PAGES.ADD_SCHOOL_PAGE}`}
              exact={true}
            >
              <AddSchoolPage />
            </ProtectedRoute>
          </Switch>
        </div>
      </div>
    </IonPage>
  );
};

export default SidebarPage;
