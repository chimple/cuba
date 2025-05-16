import React, {useEffect, useState} from "react";
import { PAGES } from "../../common/constants";
import { IonPage } from "@ionic/react";
import Sidebar from "../components/Sidebar";
import Dashboard from "../components/Dashboard";
import { BrowserRouter as Router, Switch} from 'react-router-dom';
import ProtectedRoute from "../../ProtectedRoute";
import './SidebarPage.css'
import { ServiceConfig } from "../../services/ServiceConfig";

const SidebarPage: React.FC = () => {
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [imagePhoto, setImagePhoto] = useState<string>("")
  
  useEffect(() => {
      fetchData();
    }, []);

    const fetchData = async () => {
        try {
          const currentUser =
            await ServiceConfig.getI()?.authHandler.getCurrentUser();
          if (!currentUser) {
            console.error("No user is logged in.");
            return;
          }
          setFullName(currentUser.name || "");
          setEmail(currentUser.email || currentUser.phone || "");
          setImagePhoto(currentUser.image || "")
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };

  return (
    <IonPage>
       <Router>
        <div className="sidebarpage-rightSide">
            <Sidebar name={fullName} email={email} photo={imagePhoto}  />
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
