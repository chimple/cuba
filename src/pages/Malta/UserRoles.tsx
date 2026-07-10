import React, { useState } from 'react';
import { AppBar } from '@mui/material';
import { useHistory } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';
import "./UserRoles.css"
import { USERTYPES } from '../../common/constants';
import UserTabs from '../../components/userRoles/UserTabs';
import AddUserPopUp from '../../components/userRoles/AddUserPopUp';
import { t } from 'i18next';
import CircularButton from '../../components/CircularButton';
import User from '../../models/user'; import UserImageWithName from '../../components/UserImageWithName';
interface UserRolesProps {

}
const UserRoles: React.FC<UserRolesProps> = () => {
  const history = useHistory();
  const [tabIndex, setTabIndex] = useState(USERTYPES.PRINCIAPAL);
  const [showPopUp, setShowPopUP] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const onTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };
  return (
    <div className='users-page'>
      <AppBar
        position="static"
        sx={{
          flexDirection: "inherit",
          justifyContent: "space-evenly",
          padding: "2vh 3vw 2vh 3vw",
          backgroundColor: "#FFFBEC",
          height: '10vh'
        }}
      >

        <div className="back-button">
          <BackButton onClicked={() => { }} />
        </div>

        <p className='app-bar-title'>{t('Add User')}</p>
      </AppBar>
      <div>
        <UserTabs userType={tabIndex} onChange={onTabChange} />
        <div className="all-users-display">
          {users.map((user) => (
            <UserImageWithName userDocId={user.docId} userName={user.name} userImgPath={'assets/avatars/armydog.png'} />
          ))}
        </div>
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
