import React, { useState } from 'react';
import { AppBar} from '@mui/material';
import { useHistory } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';
import "./UserRoles.css"
import { USERTYPES } from '../../common/constants';
import DisplayUsers from '../../components/userRoles/DisplayUsers';
import UserTabs from '../../components/userRoles/UserTabs';
import UserActionButton from '../../components/userRoles/UserActionButton';
import AddUserPopUp from '../../components/userRoles/AddUserPopUp';
import { t } from 'i18next';

interface UserRolesProps {

}
const UserRoles: React.FC<UserRolesProps> = () => {
  const history = useHistory();
  const [tabIndex, setTabIndex] = useState(USERTYPES.PRINCIAPAL);
  const [showPopUp, setShowPopUP] = useState(false);
  const [users, setUsers] = useState([]);
 
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
          backgroundColor: "grey",
        }}
      >
        <p className='app-bar-title'>{t('Users')}</p>
      </AppBar>
      <div>
        <UserTabs value={tabIndex} onChange={onTabChange} />
        <DisplayUsers users={users} />
        <div className='vertical-line-container'>
          <div className="vertical-line"></div>
        </div>
        <div className='user-action-buttons'>
          <UserActionButton isAddAction={true} onClick={() => { 
             setShowPopUP(true);
          }} />
          <UserActionButton isAddAction={false} onClick={() => {

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
