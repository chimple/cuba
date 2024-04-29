import React, { useState } from 'react';
import { AppBar} from '@mui/material';
import { useHistory } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';
import "./UserRoles.css"
import { USERTYPES } from '../../common/constants';
import DisplayUsers from '../../components/DisplayUsers';
import UserTabs from '../../components/userRoles/UserTabs';
import AddUserPopUp from '../../components/userRoles/AddUserPopUp';
import { t } from 'i18next';
import CircularButton from '../../components/CircularButton';
import User from '../../models/user';;

interface UserRolesProps {

}
const UserRoles: React.FC<UserRolesProps> = () => {
  const history = useHistory();
  const [tabIndex, setTabIndex] = useState(USERTYPES.PRINCIAPAL);
  const [showPopUp, setShowPopUP] = useState(false);
  const [users, setUsers] = useState([]);
  var usersd:User[] = [];
 
  const onTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };
  return (
    <div className='users-page'>
      <div className="back-button-in-users">
        <BackButton onClicked={() => { }} />
      </div>
      <AppBar
        position="static"
        sx={{
          flexDirection: "inherit",
          justifyContent: "space-evenly",
          padding: "2vh 3vw 2vh 3vw",
          backgroundColor: "#FFFBEC",
        }}
      >
        <p className='app-bar-title'>{t('Users')}</p>
      </AppBar>
      <div>
        <UserTabs userType={tabIndex} onChange={onTabChange} />
        <DisplayUsers users={usersd} />
        <div className='vertical-line-container'>
          <div className="vertical-line"></div>
        </div>
        <div className='user-action-buttons'>
          <CircularButton isAddAction={true} onClick={() => { 
             setShowPopUP(true);
          }} />
          <CircularButton isAddAction={false} onClick={() => {

          }} />
          {showPopUp && <AddUserPopUp showDialogBox={showPopUp} handleClose={() => {
            setShowPopUP(!showPopUp);
          }} />}
        </div>
      </div>
    </div>
  )
};

export default UserRoles;
