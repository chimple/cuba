import React, { useEffect, useState } from "react";
import { PAGES, TableTypes } from "../../common/constants";
import { IonPage } from "@ionic/react";
import Sidebar from "../components/Sidebar";
import Dashboard from "../components/Dashboard";
import { BrowserRouter as Router, Switch, useRouteMatch, Route, Redirect} from "react-router-dom";
import ProtectedRoute from "../../ProtectedRoute";
import "./SidebarPage.css";
import { ServiceConfig } from "../../services/ServiceConfig";
import ProgramsPage from "./ProgramPage";
import SchoolList from "./SchoolList";
import NewProgram from "../components/NewProgram";

const SidebarPage: React.FC = () => {
  const { path } = useRouteMatch();
  
  const [currentUser, setCurrentUser] = useState<TableTypes<"user"> | null>(null);

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
                {/* <ProtectedRoute path={`${path}${PAGES.ADMIN_DASHBOARD}`} exact={true}>
                  <Dashboard />
              </ProtectedRoute> */}
               <ProtectedRoute path={`${path}${PAGES.PROGRAM_PAGE}`} exact={true}>
                  <ProgramsPage/>
              </ProtectedRoute>
               <ProtectedRoute path={`${path}${PAGES.SCHOOL_LIST}`} exact={true}>
                  <SchoolList/>
              </ProtectedRoute>
              <ProtectedRoute path={`${path}${PAGES.NEW_PROGRAM}`} exact={true}>
                  <NewProgram/>
              </ProtectedRoute>
            </Switch>
          </div>
        </div>
    </IonPage>
  );
};

export default SidebarPage;
