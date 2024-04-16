import React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { t } from 'i18next';
import { USERTYPES } from '../../common/constants';
import "./UserTabs.css"

interface UserTabsProps {
  value: string;
  onChange: (event, newValu) => void;
}

const UserTabs: React.FC<UserTabsProps> = ({ value, onChange }) => {
  return (
    <Tabs
      value={value}
      onChange={onChange}
      className='tab-tool-bar'
      textColor="secondary"
      indicatorColor="secondary"
      aria-label="secondary tabs example"
      scrollButtons="auto"
      centered
      sx={{
        "& .MuiTabs-indicator": {
          backgroundColor: "#000000 !important",
          bottom: "15% !important",
        },
        "& .MuiTab-root": { color: "#000000 !important" },
        "& .Mui-selected": { color: "#000000 !important" },
      }}
    >
      <Tab
        value={USERTYPES.PRINCIAPAL}
        label={t(USERTYPES.PRINCIAPAL)} // Assuming `t` function is defined for translations
        id="users-tab-bar"
      />
      <Tab
        id="users-tab-bar"
        value={USERTYPES.COORDINATORS}
        label={t(USERTYPES.COORDINATORS)}
      />
      <Tab
        id="users-tab-bar"
        value={USERTYPES.SPONSORS}
        label={t(USERTYPES.SPONSORS)}
      />
    </Tabs>
  );
};

export default UserTabs;
