import React,{ useEffect } from "react";
import { PAGES } from "../../common/constants";
import { IonPage } from "@ionic/react";
import Sidebar from "../components/Sidebar";
import Dashboard from "../components/Dashboard";
import { BrowserRouter as Router, Switch, useHistory} from 'react-router-dom';
import ProtectedRoute from "../../ProtectedRoute";


const SidebarPage: React.FC = () => {
    const history = useHistory();
    
    const mockUser = {
        name: 'Super Admin',
        email: 'superadmin@sdutara.org',
        photo: 'https://i.pravatar.cc/40',
        role: 'superadmin',
    };

  return (
    <IonPage>
       <Router>
        <div style={{ display: "flex", height: "100vh" }}>
            <Sidebar user={mockUser} />
            <div style={{ flex: 1, padding: "1rem", overflowY: "auto" }}>
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
