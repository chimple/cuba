import React, { useEffect, useState } from "react";
import { PAGES, TableTypes } from "../../common/constants";
import { IonPage } from "@ionic/react";
import Sidebar from "../components/Sidebar";
import Dashboard from "../components/Dashboard";
import { BrowserRouter as Router, Switch, useRouteMatch, Route, Redirect} from "react-router-dom";
import ProtectedRoute from "../../ProtectedRoute";
import "./SidebarPage.css";
import { ServiceConfig } from "../../services/ServiceConfig";

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
      <Router>
        <div className="sidebarpage-rightSide">
          <Sidebar
            name={currentUser?.name || ""}
            email={currentUser?.email || ""}
            photo={currentUser?.image || ""}
          />
          <div className="sidebarpage-render">
            <Switch>
                <Route exact path={path}>
                  <Redirect to={`${path}${PAGES.ADMIN_DASHBOARD}`} />
                </Route>
                <ProtectedRoute path={`${path}${PAGES.ADMIN_DASHBOARD}`} exact={true}>
                  <Dashboard />
              </ProtectedRoute>
            </Switch>
          </div>
        </div>
      </Router>
    </IonPage>
  );
};

export default SidebarPage;
