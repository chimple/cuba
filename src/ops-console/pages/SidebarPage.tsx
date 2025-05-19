import React, { useEffect, useState } from "react";
import { PAGES } from "../../common/constants";
import { IonPage } from "@ionic/react";
import Sidebar from "../components/Sidebar";
import Dashboard from "../components/Dashboard";
import { BrowserRouter as Router, Switch } from 'react-router-dom';
import ProtectedRoute from "../../ProtectedRoute";
import './SidebarPage.css';
import { ServiceConfig } from "../../services/ServiceConfig";

interface UserInfo {
  fullName: string;
  email: string;
  imagePhoto: string;
}

const SidebarPage: React.FC = () => {
  const [user, setUser] = useState<UserInfo>({
    fullName: "",
    email: "",
    imagePhoto: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const currentUser = await ServiceConfig.getI()?.authHandler.getCurrentUser();
      if (!currentUser) {
        console.error("No user is logged in.");
        return;
      }

      setUser({
        fullName: currentUser.name || "",
        email: currentUser.email || currentUser.phone || "",
        imagePhoto: currentUser.image || ""
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <IonPage>
      <Router>
        <div className="sidebarpage-rightSide">
          <Sidebar
            name={user.fullName}
            email={user.email}
            photo={user.imagePhoto}
          />
          <div className="sidebarpage-render">
            <Switch>
              <ProtectedRoute path={PAGES.ADMIN_DASHBOARD} exact={true}>
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
