import React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { t } from 'i18next';
import { USERTYPES } from '../../common/constants';
import "./UserTabs.css"
import { AppBar, Box } from '@mui/material';

interface UserTabsProps {
  userType: USERTYPES;
  onChange: (event, newValu) => void;
}

const UserTabs: React.FC<UserTabsProps> = ({ userType: value, onChange }) => {
  return (
    <div className="tabs-view">
      <AppBar className="tab-page-app-bar">
        <Box>
          <Tabs
            value={value}
            onChange={onChange}
            TabIndicatorProps={{ style: { display: "none" } }}
            sx={{
              "& .MuiTab-root": {
                color: "black",
                borderRadius: "5vh",
                padding: "0 3vw",
                margin: "1vh 1vh",
                minHeight: "37px",
                backgroundColor:'#FFDC96'
              },
              "& .Mui-selected": {
                backgroundColor: "#FFDC97",
                borderRadius: "8vh",
                color: "blue !important",
                minHeight: "37px",
              },
            }}
          >
            <Tab
              className="user-page-sub-tab"
              label={USERTYPES.PRINCIAPAL}
              value={USERTYPES.PRINCIAPAL}
              onClick={() => {

              }}
            />
            <Tab
              className="user-page-sub-tab"
              label={USERTYPES.COORDINATORS}
              value={USERTYPES.COORDINATORS}
              onClick={() => {

              }}
            />
            <Tab
              className="user-page-sub-tab"
              label={USERTYPES.SPONSORS}
              value={USERTYPES.SPONSORS}
              onClick={() => {

              }}
            />
          </Tabs>
        </Box>
      </AppBar>
    </div>
  );
};

export default UserTabs;
