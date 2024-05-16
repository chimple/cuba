import React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { t } from 'i18next';
import { USERTYPES } from '../../common/constants';
import "./ClassTabs.css"
import { AppBar, Box } from '@mui/material';

interface ClassTabsProps {
    userType: USERTYPES;
    onChange: (event, newValu) => void;
}

const ClassTabs: React.FC<ClassTabsProps> = ({ userType: value, onChange }) => {
    return (
        <div className="tabs-view">
            <AppBar className="home-page-app-bar">
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
                                backgroundColor: '#FFDC96'
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
                            className="class-page-sub-tab"
                            label={USERTYPES.STUDENTS}
                            value={USERTYPES.STUDENTS}
                            onClick={() => {

                            }}
                            sx={{
                                textTransform: 'none'
                            }}
                        />
                        <Tab
                            className="class-page-sub-tab"
                            label={USERTYPES.TEACHERS}
                            value={USERTYPES.TEACHERS}
                            onClick={() => {

                            }}
                            sx={{
                                textTransform: 'none'
                            }}
                        />
                    </Tabs>
                </Box>
            </AppBar>
        </div>
    );
};

export default ClassTabs;
