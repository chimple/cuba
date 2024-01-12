import { FC, useState } from "react";
import { LEADERBOARD_REWARD_LIST } from "../../common/constants";
import { Box, Tab, Tabs } from "@mui/material";
import { t } from "i18next";

const LeaderBoardRewards: FC = () => {
  const [tabIndex, setTabIndex] = useState(LEADERBOARD_REWARD_LIST.BADGES);
  const handleChange = (
    event: React.SyntheticEvent,
    newValue: LEADERBOARD_REWARD_LIST
  ) => {
    // setValue(newValue);
    setTabIndex(newValue);
  };
  return (
    <>
      <Tabs
        value={tabIndex}
        onChange={handleChange}
        textColor="secondary"
        indicatorColor="secondary"
        aria-label="secondary tabs example"
        // variant="scrollable"
        scrollButtons="auto"
        // aria-label="scrollable auto tabs example"
        centered
        sx={{
          // "& .MuiAppBar-root": { backgroundColor: "#FF7925 !important" },
          "& .MuiTabs-indicator": {
            backgroundColor: "#000000 !important",
            bottom: "15% !important",
          },
          "& .MuiTab-root": { color: "#000000 !important" },
          "& .Mui-selected": { color: "#000000 !important" },
        }}
      >
        <Tab
          id="parent-page-tab-bar"
          value={LEADERBOARD_REWARD_LIST.BADGES}
          label={t(LEADERBOARD_REWARD_LIST.BADGES)}
        />
        <Tab
          id="parent-page-tab-bar"
          value={LEADERBOARD_REWARD_LIST.BONUS}
          label={t(LEADERBOARD_REWARD_LIST.BONUS)}
        />
      </Tabs>
      {tabIndex === LEADERBOARD_REWARD_LIST.BADGES && <Box>BADGES</Box>}

      {tabIndex === LEADERBOARD_REWARD_LIST.BONUS && <Box>BONUS</Box>}
    </>
  );
};

export default LeaderBoardRewards;
